package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.List;

public class RestApiPlugin extends BasePlugin {
    private static int MAX_REDIRECTS = 5;
    private static ObjectMapper objectMapper;

    public RestApiPlugin(PluginWrapper wrapper) {
        super(wrapper);
        this.objectMapper = new ObjectMapper();
    }

    @Slf4j
    @Extension
    public static class RestApiPluginExecutor implements PluginExecutor {

        @Override
        public Mono<ActionExecutionResult> execute(Object connection,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {

            String requestBody = (actionConfiguration.getBody() == null) ? "" : actionConfiguration.getBody();
            String path = (actionConfiguration.getPath() == null) ? "" : actionConfiguration.getPath();
            String url = datasourceConfiguration.getUrl() + path;

            HttpMethod httpMethod = actionConfiguration.getHttpMethod();
            if (httpMethod == null) {
                return Mono.error(new Exception("HttpMethod must not be null"));
            }

            WebClient.Builder webClientBuilder = WebClient.builder();

            if (datasourceConfiguration.getHeaders() != null) {
                addHeadersToRequest(webClientBuilder, datasourceConfiguration.getHeaders());
            }

            if (actionConfiguration.getHeaders() != null) {
                addHeadersToRequest(webClientBuilder, actionConfiguration.getHeaders());
            }


            URI uri = null;
            try {
                uri = createFinalUriWithQueryParams(url, actionConfiguration.getQueryParameters());
            } catch (URISyntaxException e) {
                e.printStackTrace();
                return Mono.error(e);
            }

            WebClient client = webClientBuilder.build();
            return httpCall(client, httpMethod, uri, requestBody, 0)
                    .flatMap(clientResponse -> clientResponse.toEntity(String.class))
                    .map(stringResponseEntity -> {
                        /**TODO
                         * Handle XML response. Currently we only handle JSON responses. The other kind of responses are
                         * kept as is and returned as a string.
                         */
                        HttpHeaders headers = stringResponseEntity.getHeaders();
                        String body = stringResponseEntity.getBody();
                        HttpStatus statusCode = stringResponseEntity.getStatusCode();

                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setStatusCode(statusCode.toString());
                        Boolean isBodyJson = false;
                        if (headers != null) {
                            // Convert the headers into json tree to store in the results
                            String headerInJsonString = null;
                            try {
                                headerInJsonString = objectMapper.writeValueAsString(headers);
                            } catch (JsonProcessingException e) {
                                e.printStackTrace();
                            }
                            try {
                                // Set headers in the result now
                                result.setHeaders(objectMapper.readTree(headerInJsonString));
                            } catch (IOException e) {
                                e.printStackTrace();
                            }

                            // Find the media type of the response to parse the body as required. Currently only JSON
                            // responses are parsed. The rest kind of responses are kept as is.
                            MediaType contentType = headers.getContentType();
                            if (MediaType.APPLICATION_JSON.equals(contentType) ||
                                    MediaType.APPLICATION_JSON_UTF8.equals(contentType) ||
                                    MediaType.APPLICATION_JSON_UTF8_VALUE.equals(contentType)) {
                                isBodyJson = true;
                            }
                        }

                        if (body != null) {
                            if (isBodyJson) {
                                try {
                                    result.setBody(objectMapper.readTree(body));
                                } catch (IOException e) {
                                    e.printStackTrace();
                                }
                            } else {
                                // If the body is not of JSON type, just set it as is.
                                result.setBody(body.trim());
                            }
                        }
                        return result;
                    });
        }

        private Mono<ClientResponse> httpCall(WebClient webClient, HttpMethod httpMethod, URI uri, String requestBody, int iteration) {
            if (iteration == MAX_REDIRECTS) {
                System.out.println("Exceeded the http redirect limits. Returning error");
                return Mono.error(new Exception("Exceeded the http redirect limits"));
            }
            return webClient
                    .method(httpMethod)
                    .uri(uri)
                    .body(BodyInserters.fromObject(requestBody))
                    .exchange()
                    .flatMap(response -> {
                        if (response.statusCode().is3xxRedirection()) {
                            String redirectUrl = response.headers().header("Location").get(0);
                            URI redirectUri = null;
                            try {
                                redirectUri = new URI(redirectUrl);
                            } catch (URISyntaxException e) {
                                e.printStackTrace();
                            }
                            return httpCall(webClient, httpMethod, redirectUri, requestBody, iteration+1);
                        }
                        return Mono.just(response);
                    });
        }

        @Override
        public Object datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            return null;
        }

        @Override
        public void datasourceDestroy(Object connection) {

        }

        @Override
        public Boolean isDatasourceValid(DatasourceConfiguration datasourceConfiguration) {
            if (datasourceConfiguration.getUrl() == null) {
                System.out.println("URL is null. Data validation failed");
                return false;
            }
            // Check for URL validity
            try {
                new URL(datasourceConfiguration.getUrl()).toURI();
                return true;
            } catch (Exception e) {
                System.out.println("URL is invalid. Data validation failed");
                return false;
            }
        }

        private void addHeadersToRequest(WebClient.Builder webClientBuilder, List<Property> headers) {
            for (Property header : headers) {
                if (header.getKey() != null && !header.getKey().isEmpty()) {
                    webClientBuilder.defaultHeader(header.getKey(), header.getValue());
                }
            }
        }

        private URI createFinalUriWithQueryParams(String url, List<Property> queryParams) throws URISyntaxException {
            UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
            uriBuilder.uri(new URI(url));

            if (queryParams != null) {
                for (Property queryParam : queryParams) {
                    if (queryParam.getKey() != null && !queryParam.getKey().isEmpty()) {
                        uriBuilder.queryParam(queryParam.getKey(), queryParam.getValue());
                    }
                }
            }
            return uriBuilder.build(true).toUri();
        }
    }
}
