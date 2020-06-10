package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Property;
import com.appsmith.external.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonSyntaxException;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.bson.internal.Base64;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.InvalidMediaTypeException;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public class RestApiPlugin extends BasePlugin {
    private static final int MAX_REDIRECTS = 5;

    // Setting max content length. This would've been coming from `spring.codec.max-in-memory-size` property if the
    // `WebClient` instance was loaded as an auto-wired bean.
    public static final ExchangeStrategies EXCHANGE_STRATEGIES = ExchangeStrategies
            .builder()
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(/* 10MB */ 10 * 1024 * 1024))
            .build();

    public RestApiPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class RestApiPluginExecutor implements PluginExecutor {

        @Override
        public Mono<Object> execute(Object connection,
                                    DatasourceConfiguration datasourceConfiguration,
                                    ActionConfiguration actionConfiguration) {

            String path = (actionConfiguration.getPath() == null) ? "" : actionConfiguration.getPath();
            String url = datasourceConfiguration.getUrl() + path;
            String reqContentType = "";

            HttpMethod httpMethod = actionConfiguration.getHttpMethod();
            if (httpMethod == null) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "HTTPMethod must be set."));
            }

            WebClient.Builder webClientBuilder = WebClient.builder();

            if (datasourceConfiguration.getHeaders() != null) {
                reqContentType = addHeadersToRequestAndGetContentType(
                        webClientBuilder, datasourceConfiguration.getHeaders());
            }

            if (actionConfiguration.getHeaders() != null) {
                reqContentType = addHeadersToRequestAndGetContentType(
                        webClientBuilder, actionConfiguration.getHeaders());
            }

            final String contentTypeError = verifyContentType(actionConfiguration.getHeaders());
            if (contentTypeError != null) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR, "Invalid value for Content-Type."));
            }

            String requestBodyAsString = (actionConfiguration.getBody() == null) ? "" : actionConfiguration.getBody();

            if (MediaType.APPLICATION_FORM_URLENCODED_VALUE.equals(reqContentType)
                    || MediaType.MULTIPART_FORM_DATA_VALUE.equals(reqContentType)) {
                requestBodyAsString = convertPropertyListToReqBody(actionConfiguration.getBodyFormData());
            }

            URI uri;
            try {
                uri = createFinalUriWithQueryParams(url, actionConfiguration.getQueryParameters());
            } catch (URISyntaxException e) {
                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e));
            }

            log.debug("Final URL is: " + uri.toString());
            WebClient client = webClientBuilder.exchangeStrategies(EXCHANGE_STRATEGIES).build();

            return httpCall(client, httpMethod, uri, requestBodyAsString, 0, reqContentType)
                    .flatMap(clientResponse -> clientResponse.toEntity(byte[].class))
                    .map(stringResponseEntity -> {
                        HttpHeaders headers = stringResponseEntity.getHeaders();
                        // Find the media type of the response to parse the body as required.
                        MediaType contentType = headers.getContentType();
                        byte[] body = stringResponseEntity.getBody();
                        HttpStatus statusCode = stringResponseEntity.getStatusCode();

                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setStatusCode(statusCode.toString());
                        result.setIsExecutionSuccess(statusCode.is2xxSuccessful());

                        // Convert the headers into json tree to store in the results
                        String headerInJsonString;
                        try {
                            headerInJsonString = objectMapper.writeValueAsString(headers);
                        } catch (JsonProcessingException e) {
                            return Mono.defer(() -> Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e)));
                        }

                        // Set headers in the result now
                        try {
                            result.setHeaders(objectMapper.readTree(headerInJsonString));
                        } catch (IOException e) {
                            return Mono.defer(() -> Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e)));
                        }

                        if (body != null) {
                            /**TODO
                             * Handle XML response. Currently we only handle JSON & Image responses. The other kind of responses
                             * are kept as is and returned as a string.
                             */
                            if (MediaType.APPLICATION_JSON.equals(contentType) ||
                                    MediaType.APPLICATION_JSON_UTF8.equals(contentType)) {
                                try {
                                    String jsonBody = new String(body);
                                    result.setBody(objectMapper.readTree(jsonBody));
                                } catch (IOException e) {
                                    return Mono.defer(() -> Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e)));
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
                    .doOnError(e -> Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e)));
        }

        private String convertPropertyListToReqBody(List<Property> bodyFormData) {
            if (bodyFormData == null || bodyFormData.isEmpty()) {
                return "";
            }

            String reqBody = bodyFormData.stream()
                    .map(property -> property.getKey() + "=" + property.getValue())
                    .collect(Collectors.joining("&"));
            return reqBody;
        }

        /**
         * If the headers list of properties contains a `Content-Type` header, verify if the value of that header is a
         * valid media type.
         * @param headers List of header Property objects to look for Content-Type headers in.
         * @return An error message string if the Content-Type value is invalid, otherwise `null`.
         */
        private static String verifyContentType(List<Property> headers) {
            if (headers == null) {
                return null;
            }

            for (Property header : headers) {
                if (header.getKey().equalsIgnoreCase(HttpHeaders.CONTENT_TYPE)) {
                    try {
                        MediaType.valueOf(header.getValue());
                    } catch (InvalidMediaTypeException e) {
                        return e.getMessage();
                    }
                    // Don't break here since there can be multiple `Content-Type` headers.
                }
            }

            return null;
        }

        private Mono<ClientResponse> httpCall(WebClient webClient, HttpMethod httpMethod, URI uri, String requestBodyAsString,
                                              int iteration, String contentType) {
            if (iteration == MAX_REDIRECTS) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Exceeded the HTTP redirect limits of " + MAX_REDIRECTS
                ));
            }

            Object requestBodyAsObject = null;

            if (MediaType.APPLICATION_JSON_VALUE.equals(contentType)) {
                try {
                    requestBodyAsObject = objectFromJson(requestBodyAsString);
                } catch (JsonSyntaxException e) {
                    return Mono.error(new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_ERROR,
                            "Malformed JSON: " + e.getMessage()
                    ));
                }
            }

            if (requestBodyAsObject == null) {
                requestBodyAsObject = requestBodyAsString;
            }

            return webClient
                    .method(httpMethod)
                    .uri(uri)
                    .body(BodyInserters.fromObject(requestBodyAsObject))
                    .exchange()
                    .doOnError(e -> Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e)))
                    .flatMap(response -> {
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
                                return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e));
                            }
                            return httpCall(webClient, httpMethod, redirectUri, requestBodyAsString, iteration + 1,
                                    contentType);
                        }
                        return Mono.just(response);
                    });
        }

        /**
         * Given a JSON string, we infer the top-level type of the object it represents and then parse it into that
         * type. However, only `Map` and `List` top-levels are supported. Note that the map or list may contain
         * anything, like booleans or number or even more maps or lists. It's only that the top-level type should be a
         * map / list.
         * @param jsonString A string that confirms to JSON syntax. Shouldn't be null.
         * @return An object of type `Map`, `List`, if applicable, or `null`.
         */
        private static Object objectFromJson(String jsonString) {
            Class<?> type;
            String trimmed = jsonString.trim();

            if (trimmed.startsWith("{")) {
                type = Map.class;
            } else if (trimmed.startsWith("[")) {
                type = List.class;
            } else {
                // The JSON body is likely a literal boolean or number or string. For our purposes here, we don't have
                // to parse this JSON.
                return null;
            }

            return new GsonBuilder().create().fromJson(jsonString, type);
        }

        @Override
        public Mono<Object> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            return Mono.empty();
        }

        @Override
        public void datasourceDestroy(Object connection) {
            // REST API plugin doesn't have a datasource.
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            // We don't verify whether the URL is in valid format because it can contain mustache template keys, and so
            // look invalid at this point, but become valid after mustache rendering. So we just check if URL field has
            // a non-empty value.

            Set<String> invalids = new HashSet<>();

            if (StringUtils.isEmpty(datasourceConfiguration.getUrl())) {
                invalids.add("Missing URL.");
            }

            final String contentTypeError = verifyContentType(datasourceConfiguration.getHeaders());
            if (contentTypeError != null) {
                invalids.add("Invalid Content-Type: " + contentTypeError);
            }

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            // At this point, the URL can be invalid because of mustache template keys inside it. Hence, connecting to
            // and verifying the URL isn't feasible. Since validation happens just before testing, and since validation
            // checks if a URL is present, there's nothing left to do here, but return a successful response.
            return Mono.just(new DatasourceTestResult());
        }

        private String addHeadersToRequestAndGetContentType(WebClient.Builder webClientBuilder,
                                                            List<Property> headers) {
            String contentType = "";

            for (Property header : headers) {
                String key = header.getKey();
                if (StringUtils.isNotEmpty(key)) {
                    String value = header.getValue();
                    webClientBuilder.defaultHeader(key, value);
                    
                    if (HttpHeaders.CONTENT_TYPE.equalsIgnoreCase(key)) {
                        contentType = value;
                    }
                }
            }
            return contentType;
        }

        private URI createFinalUriWithQueryParams(String url, List<Property> queryParams) throws URISyntaxException {
            UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
            uriBuilder.uri(new URI(url));

            if (queryParams != null) {
                for (Property queryParam : queryParams) {
                    String key = queryParam.getKey();
                    if (StringUtils.isNotEmpty(key)) {
                        uriBuilder.queryParam(key, URLEncoder.encode(queryParam.getValue(), StandardCharsets.UTF_8));
                    }
                }
            }
            return uriBuilder.build(true).toUri();
        }
    }
}
