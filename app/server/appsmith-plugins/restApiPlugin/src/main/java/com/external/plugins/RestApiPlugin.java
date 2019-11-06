package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.ResourceConfiguration;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;

public class RestApiPlugin extends BasePlugin {

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
                                                   ResourceConfiguration resourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {

            String requestBody = (actionConfiguration.getBody() == null) ? "" : actionConfiguration.getBody();
            String path = (actionConfiguration.getPath() == null) ? "" : actionConfiguration.getPath();
            String url = resourceConfiguration.getUrl() + path;

            HttpMethod httpMethod = actionConfiguration.getHttpMethod();
            if (httpMethod == null) {
                return Mono.error(new Exception("HttpMethod must not be null"));
            }

            WebClient.Builder webClientBuilder = WebClient.builder();

            if (resourceConfiguration.getHeaders() != null) {
                addHeadersToRequest(webClientBuilder, resourceConfiguration.getHeaders());
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

            return webClientBuilder
                    .build()
                    .method(httpMethod)
                    .uri(uri)
                    .body(BodyInserters.fromObject(requestBody))
                    .exchange()
                    .flatMap(clientResponse -> clientResponse.toEntity(String.class))
                    .map(stringResponseEntity -> {
                        /**TODO
                         * Handle XML response. Currently we only handle JSON responses.
                         */
                        HttpHeaders headers = stringResponseEntity.getHeaders();
                        String body = stringResponseEntity.getBody();
                        HttpStatus statusCode = stringResponseEntity.getStatusCode();

                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setStatusCode(statusCode.toString());
                        try {
                            if (body != null) {
                                result.setBody(objectMapper.readTree(body));
                            }
                            if (headers != null) {
                                String headerInJsonString = objectMapper.writeValueAsString(headers);
                                result.setHeaders(objectMapper.readTree(headerInJsonString));
                            }
                        } catch (IOException e) {
                            e.printStackTrace();
                        }

                        return result;
                    });
        }

        @Override
        public Object resourceCreate(ResourceConfiguration resourceConfiguration) {
            return null;
        }

        @Override
        public void resourceDestroy(Object connection) {

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
