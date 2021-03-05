package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.models.Property;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonSyntaxException;
import lombok.extern.slf4j.Slf4j;
import org.bson.internal.Base64;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.util.CollectionUtils;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public class GoogleSheetsPlugin extends BasePlugin {

    // Setting max content length. This would've been coming from `spring.codec.max-in-memory-size` property if the
    // `WebClient` instance was loaded as an auto-wired bean.
    public static final ExchangeStrategies EXCHANGE_STRATEGIES = ExchangeStrategies
            .builder()
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(/* 10MB */ 10 * 1024 * 1024))
            .build();

    public GoogleSheetsPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class GoogleSheetsPluginExecutor implements PluginExecutor<Void> {

        @Override
        public Mono<ActionExecutionResult> execute(Void connection,
                                                   DatasourceConfiguration datasourceConfiguration,
                                                   ActionConfiguration actionConfiguration) {

            // Initializing object for error condition
            ActionExecutionResult errorResult = new ActionExecutionResult();
            errorResult.setStatusCode(AppsmithPluginError.PLUGIN_ERROR.getAppErrorCode().toString());
            errorResult.setIsExecutionSuccess(false);

            // Check if method is defined
            final List<Property> properties = actionConfiguration.getPluginSpecifiedTemplates();
            final com.external.plugins.Method method = CollectionUtils.isEmpty(properties)
                    ? null
                    : com.external.plugins.Method.valueOf(properties.get(0).getValue());

            if (method == null) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        "Missing Google Sheets method."
                ));
            }


            // Initializing webClient to be used for http call
            WebClient.Builder webClientBuilder = WebClient.builder();


            // Adding request body
            String requestBodyAsString = (actionConfiguration.getBody() == null) ? "" : actionConfiguration.getBody();
            try {
                objectFromJson(requestBodyAsString);
            } catch (JsonSyntaxException e) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR,
                        requestBodyAsString,
                        "Malformed JSON: " + e.getMessage()
                ));
            }

            // Right before building the webclient object, we populate it with whatever mutation the APIConnection object demands
//            if (apiConnection != null) {
//                webClientBuilder.filter(apiConnection);
//            }

            WebClient client = webClientBuilder
                    .exchangeStrategies(EXCHANGE_STRATEGIES)
                    .clientConnector(new ReactorClientHttpConnector(
                            HttpClient.create().wiretap(true)
                    ))
                    .build();
            final OAuth2 oauth2 = (OAuth2) datasourceConfiguration.getAuthentication();
            assert (!oauth2.getIsEncrypted() && oauth2.getAuthenticationResponse() != null);
            // Triggering the actual REST API call
            return Method.valueOf(actionConfiguration.getPluginSpecifiedTemplates().get(0).getValue())
                    .getClient(client, actionConfiguration.getPluginSpecifiedTemplates(), requestBodyAsString)
                    .headers(headers -> headers.set("Authorization", oauth2.getHeaderPrefix() + " " + oauth2.getAuthenticationResponse().getToken()))
                    .exchange()
                    .flatMap(clientResponse -> clientResponse.toEntity(byte[].class))
                    .map(stringResponseEntity -> {
                                HttpHeaders headers = stringResponseEntity.getHeaders();
                                // Find the media type of the response to parse the body as required.
                                MediaType contentType = headers.getContentType();
                                byte[] body = stringResponseEntity.getBody();
                                HttpStatus statusCode = stringResponseEntity.getStatusCode();

                                ActionExecutionResult result = new ActionExecutionResult();

                                System.out.println("Here after response: " + stringResponseEntity.getStatusCodeValue() + " " + headers.getContentType());
                                // Set the request fields
//                        result.setRequest(actionExecutionRequest);

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
                                    throw Exceptions.propagate(
                                            new AppsmithPluginException(
                                                    AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR,
                                                    headerInJsonString,
                                                    e.getMessage()
                                            )
                                    );
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
                                            if (statusCode.is2xxSuccessful()) {
                                                result.setBody(objectMapper.readTree(jsonBody));
                                            } else {
                                                result.setBody(objectMapper.readTree(jsonBody).get("error").get("message").asText());
                                            }
                                        } catch (IOException e) {
                                            throw Exceptions.propagate(
                                                    new AppsmithPluginException(
                                                            AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR,
                                                            new String(body),
                                                            e.getMessage()
                                                    )
                                            );
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
                            }
                    )
                    .onErrorResume(e -> {
                        errorResult.setBody(Exceptions.unwrap(e).getMessage());
//                        errorResult.setRequest(actionExecutionRequest);
                        return Mono.just(errorResult);
                    });
        }

        public String convertPropertyListToReqBody(List<Property> bodyFormData,
                                                   String reqContentType,
                                                   Boolean encodeParamsToggle) {
            if (bodyFormData == null || bodyFormData.isEmpty()) {
                return "";
            }

            return bodyFormData.stream()
                    .map(property -> {
                        String key = property.getKey();
                        String value = property.getValue();

                        if (MediaType.APPLICATION_FORM_URLENCODED_VALUE.equals(reqContentType)
                                && encodeParamsToggle) {
                            try {
                                value = URLEncoder.encode(value, StandardCharsets.UTF_8.toString());
                            } catch (UnsupportedEncodingException e) {
                                throw new UnsupportedOperationException(e);
                            }
                        }

                        return key + "=" + value;
                    })
                    .collect(Collectors.joining("&"));
        }


        /**
         * Given a JSON string, we infer the top-level type of the object it represents and then parse it into that
         * type. However, only `Map` and `List` top-levels are supported. Note that the map or list may contain
         * anything, like booleans or number or even more maps or lists. It's only that the top-level type should be a
         * map / list.
         *
         * @param jsonString A string that confirms to JSON syntax. Shouldn't be null.
         */
        private static void objectFromJson(String jsonString) {
            Class<?> type;
            String trimmed = jsonString.trim();

            if (trimmed.startsWith("{")) {
                type = Map.class;
            } else if (trimmed.startsWith("[")) {
                type = List.class;
            } else {
                // The JSON body is likely a literal boolean or number or string. For our purposes here, we don't have
                // to parse this JSON.
                return;
            }

            new GsonBuilder().create().fromJson(jsonString, type);
        }

        @Override
        public Mono<Void> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            return Mono.empty();
        }

        @Override
        public void datasourceDestroy(Void connection) {
            // REST API plugin doesn't have a datasource.
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            return Set.of();
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            // At this point, the URL can be invalid because of mustache template keys inside it. Hence, connecting to
            // and verifying the URL isn't feasible. Since validation happens just before testing, and since validation
            // checks if a URL is present, there's nothing left to do here, but return a successful response.
            return Mono.just(new DatasourceTestResult());
        }
    }

}