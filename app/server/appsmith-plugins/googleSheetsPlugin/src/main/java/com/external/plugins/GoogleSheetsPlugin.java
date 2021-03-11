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
import com.external.config.GoogleSheetsMethodStrategy;
import com.external.config.Method;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonSyntaxException;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.http.HttpHeaders;
import org.springframework.util.CollectionUtils;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;

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
            final Method method = CollectionUtils.isEmpty(properties)
                    ? null
                    : GoogleSheetsMethodStrategy.getMethod(properties.get(0).getValue());

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

            // Validating request body
            try {
                objectFromJson(requestBodyAsString);
            } catch (JsonSyntaxException e) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR,
                        requestBodyAsString,
                        "Malformed JSON: " + e.getMessage()
                ));
            }

            WebClient client = webClientBuilder
                    .exchangeStrategies(EXCHANGE_STRATEGIES)
                    .build();

            // Authentication will already be valid at this point
            final OAuth2 oauth2 = (OAuth2) datasourceConfiguration.getAuthentication();
            assert (!oauth2.getIsEncrypted() && oauth2.getAuthenticationResponse() != null);

            // Triggering the actual REST API call
            return method
                    // This method call will populate the request with all the configurations it needs for a particular method
                    .getClient(client, actionConfiguration.getPluginSpecifiedTemplates(), requestBodyAsString)
                    .headers(headers -> headers.set("Authorization", "Bearer " + oauth2.getAuthenticationResponse().getToken()))
                    .exchange()
                    .flatMap(clientResponse -> clientResponse.toEntity(byte[].class))
                    .map(response -> {
                        // Populate result object
                        ActionExecutionResult result = new ActionExecutionResult();

                        // Set response status
                        result.setStatusCode(response.getStatusCode().toString());
                        result.setIsExecutionSuccess(response.getStatusCode().is2xxSuccessful());

                        HttpHeaders headers = response.getHeaders();
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

                        // Choose body depending on response status
                        byte[] body = response.getBody();
                        if (body != null) {
                            try {
                                String jsonBody = new String(body);
                                JsonNode jsonNodeBody = objectMapper.readTree(jsonBody);

                                if (response.getStatusCode().is2xxSuccessful()) {
                                    result.setBody(method.transformResponse(jsonNodeBody, objectMapper));
                                } else {
                                    result.setBody(jsonNodeBody
                                            .get("error")
                                            .get("message")
                                            .asText());
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
                        }
                        return result;
                    })
                    .onErrorResume(e -> {
                        errorResult.setBody(Exceptions.unwrap(e).getMessage());
                        System.out.println(e.getMessage());
                        return Mono.just(errorResult);
                    });
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
            // This plugin doesn't have a connection to destroy
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            return Set.of();
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            // This plugin would not have the option to test
            return Mono.just(new DatasourceTestResult());
        }
    }
}