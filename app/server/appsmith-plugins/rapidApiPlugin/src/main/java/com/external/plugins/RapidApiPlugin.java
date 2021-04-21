package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Property;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.fasterxml.jackson.core.JsonProcessingException;
import lombok.extern.slf4j.Slf4j;
import org.bson.internal.Base64;
import org.json.JSONObject;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class RapidApiPlugin extends BasePlugin {
    private static final int MAX_REDIRECTS = 5;

    private static final String JSON_TYPE = "apipayload";

    public RapidApiPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class RapidApiPluginExecutor implements PluginExecutor<Void> {

        private static final String RAPID_API_KEY_NAME = "X-RapidAPI-Key";
        private static final String RAPID_API_KEY_VALUE = System.getenv("APPSMITH_RAPID_API_KEY_VALUE");

        @Override
        public Mono<ActionExecutionResult> execute(Void ignored,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {

            if (StringUtils.isEmpty(RAPID_API_KEY_VALUE)) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "RapidAPI Key value " +
                        "not set."));
            }

            String requestBody = (actionConfiguration.getBody() == null) ? "" : actionConfiguration.getBody();
            String path = (actionConfiguration.getPath() == null) ? "" : actionConfiguration.getPath();
            String url = datasourceConfiguration.getUrl() + path;

            HttpMethod httpMethod = actionConfiguration.getHttpMethod();
            if (httpMethod == null) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "HTTPMethod must be " +
                        "set."));
            }

            WebClient.Builder webClientBuilder = WebClient.builder();

            if (datasourceConfiguration.getHeaders() != null) {
                addHeadersToRequest(webClientBuilder, datasourceConfiguration.getHeaders());
            }

            if (actionConfiguration.getHeaders() != null) {
                addHeadersToRequest(webClientBuilder, actionConfiguration.getHeaders());
            }

            // Add the rapid api headers
            webClientBuilder.defaultHeader(RAPID_API_KEY_NAME, RAPID_API_KEY_VALUE);

            //If route parameters exist, update the URL by replacing the key surrounded by '{' and '}'
            if (actionConfiguration.getRouteParameters() != null && !actionConfiguration.getRouteParameters().isEmpty()) {
                for (Property property : actionConfiguration.getRouteParameters()) {
                    // If either the key or the value is empty, skip
                    if (property.getKey() != null && !property.getKey().isEmpty() &&
                            property.getValue() != null && !((String) property.getValue()).isEmpty()) {

                        Pattern pattern = Pattern.compile("\\{" + property.getKey() + "\\}");
                        Matcher matcher = pattern.matcher(url);
                        url = matcher.replaceAll(URLEncoder.encode((String) property.getValue()));
                    }
                }
            }

            URI uri;
            try {
                String httpUrl = addHttpToUrlWhenPrefixNotPresent(url);
                uri = createFinalUriWithQueryParams(httpUrl, actionConfiguration.getQueryParameters());
                log.info("Final URL is : {}", uri);
            } catch (URISyntaxException e) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, e));
            }

            // Build the body of the request in case of bodyFormData is not null
            if (actionConfiguration.getBodyFormData() != null) {
                // First set the header to specify the content type
                webClientBuilder.defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON.toString());

                Map<String, String> keyValueMap = new HashMap<>();

                List<Property> bodyFormData = actionConfiguration.getBodyFormData();
                String jsonString = null;
                JSONObject bodyJson;
                for (Property property : bodyFormData) {

                    if (property.getValue() != null) {
                        if (!property.getType().equals(JSON_TYPE)) {
                            keyValueMap.put(property.getKey(), (String) property.getValue());
                        } else {
                            // This is actually supposed to be the body and should not be in key-value format. No need to
                            // convert the same.
                            jsonString = (String) property.getValue();
                            break;
                        }
                    }
                }

                if (jsonString == null) {
                    bodyJson = new JSONObject(keyValueMap);
                } else {
                    bodyJson = new JSONObject(jsonString);
                }
                jsonString = bodyJson.toString();

                // Now reset the request body
                requestBody = jsonString;

            }

            WebClient client = webClientBuilder.build();
            return httpCall(client, httpMethod, uri, requestBody, 0)
                    .flatMap(clientResponse -> clientResponse.toEntity(byte[].class))
                    .map(stringResponseEntity -> {
                        HttpHeaders headers = stringResponseEntity.getHeaders();
                        // Find the media type of the response to parse the body as required.
                        MediaType contentType = headers.getContentType();
                        byte[] body = stringResponseEntity.getBody();
                        HttpStatus statusCode = stringResponseEntity.getStatusCode();

                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setStatusCode(statusCode.toString());
                        // If the HTTP response is 200, only then cache the response.
                        // We shouldn't cache the response even for other 2xx statuses like 201, 204 etc.
                        if (statusCode.equals(HttpStatus.OK)) {
                            result.setIsExecutionSuccess(true);
                        }

                        if (headers != null) {
                            // Convert the headers into json tree to store in the results
                            String headerInJsonString;
                            try {
                                headerInJsonString = objectMapper.writeValueAsString(headers);
                            } catch (JsonProcessingException e) {
                                e.printStackTrace();
                                throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e));
                            }
                            try {
                                // Set headers in the result now
                                result.setHeaders(objectMapper.readTree(headerInJsonString));
                            } catch (IOException e) {
                                e.printStackTrace();
                                throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e));
                            }
                        }

                        if (body != null) {
                            /**TODO
                             * Handle XML response. Currently we only handle JSON & Image responses. The other kind of responses
                             * are kept as is and returned as a string.
                             */
                            if (MediaType.APPLICATION_JSON.equals(contentType) ||
                                    MediaType.APPLICATION_JSON_UTF8.equals(contentType) ||
                                    MediaType.APPLICATION_JSON_UTF8_VALUE.equals(contentType)) {
                                String jsonBody = new String(body);
                                try {
                                    result.setBody(objectMapper.readTree(jsonBody));
                                } catch (IOException e) {
                                    e.printStackTrace();
                                    throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR, jsonBody, e));
                                }
                            } else if (MediaType.IMAGE_GIF.equals(contentType) ||
                                    MediaType.IMAGE_JPEG.equals(contentType) ||
                                    MediaType.IMAGE_PNG.equals(contentType)) {
                                String encode = Base64.encode(body);
                                result.setBody(encode);
                            } else {
                                // If the body is not of JSON type, just set it as is.
                                String bodyString = new String(body);
                                result.setBody(bodyString.trim());
                            }
                        }

                        return result;
                    })
                    .onErrorMap(throwable -> {
                        final Throwable actualException = Exceptions.unwrap(throwable);
                        if (actualException instanceof AppsmithPluginException) {
                            return actualException;
                        } else {
                            return new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, actualException);
                        }
                    });
        }

        private Mono<ClientResponse> httpCall(WebClient webClient, HttpMethod httpMethod, URI uri, String requestBody, int iteration) {
            if (iteration == MAX_REDIRECTS) {
                System.out.println("Exceeded the http redirect limits. Returning error");
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Exceeded the HTTO redirect limits of " + MAX_REDIRECTS));
            }
            return webClient
                    .method(httpMethod)
                    .uri(uri)
                    .body(BodyInserters.fromObject(requestBody))
                    .exchange()
                    .doOnError(e -> Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e)))
                    .flatMap(res -> {
                        ClientResponse response = (ClientResponse) res;
                        if (response.statusCode().is3xxRedirection()) {
                            String redirectUrl = response.headers().header("Location").get(0);
                            /**
                             * TODO
                             * In case the redirected URL is not absolute (complete), create the new URL using the relative path
                             * This particular scenario is seen in the URL : https://rickandmortyapi.com/api/character
                             * It redirects to partial URI : /api/character/
                             * In this scenario we should convert the partial URI to complete URI
                             */
                            URI redirectUri = null;
                            try {
                                redirectUri = new URI(redirectUrl);
                            } catch (URISyntaxException e) {
                                e.printStackTrace();
                            }
                            return httpCall(webClient, httpMethod, redirectUri, requestBody, iteration + 1);
                        }
                        return Mono.just(response);
                    });
        }

        @Override
        public Mono<Void> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            return Mono.empty();
        }

        @Override
        public void datasourceDestroy(Void connection) {

        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            // Since the datasource is created by rapid api & not by the user and it can't be edited.
            // Assume that everything is good. Return as valid.
            return Collections.emptySet();
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return StringUtils.isEmpty(RAPID_API_KEY_VALUE)
                    ? Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, "RapidAPI Key value " +
                    "not set."))
                    : Mono.just(new DatasourceTestResult());
        }

        private void addHeadersToRequest(WebClient.Builder webClientBuilder, List<Property> headers) {
            for (Property header : headers) {
                if (header.getKey() != null && !header.getKey().isEmpty()) {
                    webClientBuilder.defaultHeader(header.getKey(), (String) header.getValue());
                }
            }
        }

        private String addHttpToUrlWhenPrefixNotPresent(String url) {
            if (url == null || url.toLowerCase().startsWith("http") || url.contains("://")) {
                return url;
            }
            return "http://" + url;
        }

        private URI createFinalUriWithQueryParams(String url, List<Property> queryParams) throws URISyntaxException {
            UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
            uriBuilder.uri(new URI(url));

            if (queryParams != null) {
                for (Property queryParam : queryParams) {
                    // If either the key or the value is empty, skip
                    if (queryParam.getKey() != null && !queryParam.getKey().isEmpty() &&
                            queryParam.getValue() != null && !((String) queryParam.getValue()).isEmpty()) {
                        uriBuilder.queryParam(queryParam.getKey(), URLEncoder.encode((String) queryParam.getValue(),
                                StandardCharsets.UTF_8));
                    }
                }
            }
            return uriBuilder.build(true).toUri();
        }

        /**
         * TODO :
         * Add a function which is called during import of a template to an action. As part of that do the following :
         * 1. Get the provider and the template
         * 2. Check if the provider is subscribed to, and if not, subscribe.
         * 3. Set Property field isRedacted for fields like host, etc. These fields in turn would not be displayed to
         * the user during GET Actions.
         */
    }
}
