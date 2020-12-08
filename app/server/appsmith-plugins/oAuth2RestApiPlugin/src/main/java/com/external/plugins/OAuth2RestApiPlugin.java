package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Property;
import com.appsmith.external.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.external.connections.Connection;
import com.fasterxml.jackson.core.JsonProcessingException;
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
import org.springframework.util.CollectionUtils;
import org.springframework.util.LinkedCaseInsensitiveMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public class OAuth2RestApiPlugin extends BasePlugin {

    public OAuth2RestApiPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class RestApiPluginExecutor implements PluginExecutor<Connection> {

        @Override
        public Mono<Tuple2<ActionExecutionResult, Connection>> execute(Connection connection,
                                                                       DatasourceConfiguration datasourceConfiguration,
                                                                       ActionConfiguration actionConfiguration) {

            // Error state for any issues with API call
            ActionExecutionResult errorResult = new ActionExecutionResult();
            errorResult.setStatusCode(AppsmithPluginError.PLUGIN_ERROR.getAppErrorCode().toString());
            errorResult.setIsExecutionSuccess(false);

            // Clean url for API call
            String path = (actionConfiguration.getPath() == null) ? "" : actionConfiguration.getPath();
            String url = datasourceConfiguration.getUrl() + path;
            String reqContentType = "";

            HttpMethod httpMethod = actionConfiguration.getHttpMethod();
            URI uri;
            try {
                String httpUrl = addHttpToUrlWhenPrefixNotPresent(url);
                uri = createFinalUriWithQueryParams(httpUrl, actionConfiguration.getQueryParameters());
            } catch (URISyntaxException e) {
                ActionExecutionRequest actionExecutionRequest = populateRequestFields(actionConfiguration, null);
                actionExecutionRequest.setUrl(url);
                errorResult.setBody(AppsmithPluginError.PLUGIN_ERROR.getMessage(e));
                errorResult.setRequest(actionExecutionRequest);
                return Mono.just(errorResult).zipWith(Mono.just(connection));
            }

            System.out.println("Final URL is: " + uri.toString());

            ActionExecutionRequest actionExecutionRequest = populateRequestFields(actionConfiguration, uri);
            System.out.println("request is : {}" + actionExecutionRequest);

            if (httpMethod == null) {
                errorResult.setBody(AppsmithPluginError.PLUGIN_ERROR.getMessage("HTTPMethod must be set."));
                errorResult.setRequest(actionExecutionRequest);
                return Mono.just(errorResult).zipWith(Mono.just(connection));
            }

            if (datasourceConfiguration.getHeaders() != null) {
                connection.addRequestHeaders(datasourceConfiguration.getHeaders());
            }

            if (actionConfiguration.getHeaders() != null) {
                connection.addRequestHeaders(actionConfiguration.getHeaders());
            }

            final String contentTypeError = verifyContentType(actionConfiguration.getHeaders());
            if (contentTypeError != null) {
                errorResult.setBody(AppsmithPluginError.PLUGIN_ERROR.getMessage("Invalid value for Content-Type."));
                errorResult.setRequest(actionExecutionRequest);
                return Mono.just(errorResult).zipWith(Mono.just(connection));
            }

            connection.addRequestBody(actionConfiguration);

            return connection.execute(httpMethod, uri, 0)
                    .flatMap(clientResponse -> clientResponse.toEntity(byte[].class))
                    .flatMap(stringResponseEntity -> {
                        HttpHeaders headers = stringResponseEntity.getHeaders();
                        // Find the media type of the response to parse the body as required.
                        MediaType contentType = headers.getContentType();
                        byte[] body = stringResponseEntity.getBody();
                        HttpStatus statusCode = stringResponseEntity.getStatusCode();

                        ActionExecutionResult result = new ActionExecutionResult();

                        // Set the request fields
                        result.setRequest(actionExecutionRequest);

                        result.setStatusCode(statusCode.toString());
                        result.setIsExecutionSuccess(statusCode.is2xxSuccessful());

                        // Convert the headers into json tree to store in the results
                        String headerInJsonString;
                        try {
                            headerInJsonString = objectMapper.writeValueAsString(headers);
                        } catch (JsonProcessingException e) {
                            throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e));
                        }

                        // Set headers in the result now
                        try {
                            result.setHeaders(objectMapper.readTree(headerInJsonString));
                        } catch (IOException e) {
                            throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e));
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
                                    throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e));
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
                        System.out.println("After response: " + result);
                        return Mono.zip(Mono.just(result), Mono.just(connection));
                    })
                    .onErrorResume(e -> {
                        errorResult.setBody(Exceptions.unwrap(e).getMessage());
                        errorResult.setRequest(actionExecutionRequest);
                        return Mono.just(errorResult).zipWith(Mono.just(connection));
                    });
        }

        /**
         * If the headers list of properties contains a `Content-Type` header, verify if the value of that header is a
         * valid media type.
         *
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

        @Override
        public Mono<Connection> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            return Mono.just(Connection.createConnection(datasourceConfiguration));
        }

        @Override
        public void datasourceDestroy(Connection connection) {
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
                    String key = queryParam.getKey();
                    if (StringUtils.isNotEmpty(key)) {
                        uriBuilder.queryParam(URLEncoder.encode(key, StandardCharsets.UTF_8),
                                URLEncoder.encode(queryParam.getValue(), StandardCharsets.UTF_8));
                    }
                }
            }
            return uriBuilder.build(true).toUri();
        }

        private ActionExecutionRequest populateRequestFields(ActionConfiguration actionConfiguration,
                                                             URI uri) {

            ActionExecutionRequest actionExecutionRequest = new ActionExecutionRequest();

            if (actionConfiguration.getHeaders() != null) {
                MultiValueMap<String, String> reqMultiMap = CollectionUtils.toMultiValueMap(new LinkedCaseInsensitiveMap<>(8, Locale.ENGLISH));

                actionConfiguration.getHeaders().stream()
                        .forEach(header -> reqMultiMap.put(header.getKey(), Arrays.asList(header.getValue())));
                actionExecutionRequest.setHeaders(objectMapper.valueToTree(reqMultiMap));
            }

            // If the body is set, then use that field as the request body by default
            if (actionConfiguration.getBody() != null) {
                actionExecutionRequest.setBody(actionConfiguration.getBody());
            }

            if (actionConfiguration.getHttpMethod() != null) {
                actionExecutionRequest.setHttpMethod(actionConfiguration.getHttpMethod());
            }

            if (uri != null) {
                actionExecutionRequest.setUrl(uri.toString());
            }

            return actionExecutionRequest;
        }
    }
}
