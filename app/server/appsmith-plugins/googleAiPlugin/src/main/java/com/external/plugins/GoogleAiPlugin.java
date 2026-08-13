package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.restApiUtils.connections.APIConnection;
import com.appsmith.external.helpers.restApiUtils.helpers.RequestCaptureFilter;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.ApiKeyAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.BaseRestApiPluginExecutor;
import com.appsmith.external.services.SharedConfig;
import com.external.plugins.commands.GoogleAICommand;
import com.external.plugins.constants.GoogleAIConstants;
import com.external.plugins.models.GoogleAIRequestDTO;
import com.external.plugins.utils.GoogleAIMethodStrategy;
import com.external.plugins.utils.RequestUtils;
import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.PluginWrapper;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.external.plugins.constants.GoogleAIConstants.BODY;
import static com.external.plugins.constants.GoogleAIConstants.GOOGLE_AI_API_ENDPOINT;
import static com.external.plugins.constants.GoogleAIConstants.LABEL;
import static com.external.plugins.constants.GoogleAIConstants.MODELS;
import static com.external.plugins.constants.GoogleAIConstants.VALUE;
import static com.external.plugins.constants.GoogleAIErrorMessages.EMPTY_API_KEY;
import static com.external.plugins.constants.GoogleAIErrorMessages.INVALID_API_KEY;
import static com.external.plugins.constants.GoogleAIErrorMessages.QUERY_FAILED_TO_EXECUTE;

@Slf4j
public class GoogleAiPlugin extends BasePlugin {
    public GoogleAiPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    public static class GoogleAiPluginExecutor extends BaseRestApiPluginExecutor {
        private static final Gson gson = new Gson();

        // TTS, live/realtime, image/video generation and embedding variants also expose
        // generateContent but are not usable as chat models
        private static final Pattern NON_CHAT_MODEL_PATTERN =
                Pattern.compile("tts|live|image|audio|embed|aqa|computer-use");

        protected GoogleAiPluginExecutor(SharedConfig sharedConfig) {
            super(sharedConfig);
        }

        /**
         * Tries to fetch the models list from GoogleAI API and if request succeed, then datasource configuration is valid
         */
        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            log.debug(Thread.currentThread().getName() + ": testDatasource() called for GoogleAI plugin.");
            final ApiKeyAuth apiKeyAuth = (ApiKeyAuth) datasourceConfiguration.getAuthentication();
            if (!StringUtils.hasText(apiKeyAuth.getValue())) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, EMPTY_API_KEY));
            }

            URI uri = UriComponentsBuilder.fromUriString(GOOGLE_AI_API_ENDPOINT)
                    .path(MODELS)
                    .build()
                    .toUri();
            HttpMethod httpMethod = HttpMethod.GET;

            return RequestUtils.makeRequest(httpMethod, uri, apiKeyAuth, BodyInserters.empty())
                    .map(responseEntity -> {
                        if (responseEntity.getStatusCode().is2xxSuccessful()) {
                            // valid credentials
                            return new DatasourceTestResult();
                        }
                        return new DatasourceTestResult(INVALID_API_KEY);
                    })
                    .onErrorResume(error -> Mono.just(new DatasourceTestResult(
                            "Error while trying to test the datasource configurations" + error.getMessage())));
        }

        @Override
        public Mono<ActionExecutionResult> executeParameterized(
                APIConnection connection,
                ExecuteActionDTO executeActionDTO,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {
            log.debug(Thread.currentThread().getName() + ": executeParameterized() called for GoogleAI plugin.");
            // Get prompt from action configuration
            List<Map.Entry<String, String>> parameters = new ArrayList<>();

            prepareConfigurationsForExecution(executeActionDTO, actionConfiguration, datasourceConfiguration);

            // Initializing object for error condition
            ActionExecutionResult errorResult = new ActionExecutionResult();
            initUtils.initializeResponseWithError(errorResult);

            GoogleAICommand googleAICommand = GoogleAIMethodStrategy.selectExecutionMethod(actionConfiguration, gson);
            googleAICommand.validateRequest(actionConfiguration);
            GoogleAIRequestDTO googleAIRequestDTO = googleAICommand.makeRequestBody(actionConfiguration);

            URI uri = googleAICommand.createExecutionUri(actionConfiguration);
            HttpMethod httpMethod = googleAICommand.getExecutionMethod();
            ActionExecutionRequest actionExecutionRequest =
                    RequestCaptureFilter.populateRequestFields(actionConfiguration, uri, parameters, objectMapper);

            final ApiKeyAuth apiKeyAuth = (ApiKeyAuth) datasourceConfiguration.getAuthentication();

            if (!StringUtils.hasText(apiKeyAuth.getValue())) {
                ActionExecutionResult apiKeyNotPresentErrorResult = new ActionExecutionResult();
                apiKeyNotPresentErrorResult.setIsExecutionSuccess(false);
                apiKeyNotPresentErrorResult.setErrorInfo(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, EMPTY_API_KEY));
                return Mono.just(apiKeyNotPresentErrorResult);
            }

            return RequestUtils.makeRequest(httpMethod, uri, apiKeyAuth, BodyInserters.fromValue(googleAIRequestDTO))
                    .flatMap(responseEntity -> {
                        HttpStatusCode statusCode = responseEntity.getStatusCode();

                        ActionExecutionResult actionExecutionResult = new ActionExecutionResult();
                        actionExecutionResult.setRequest(actionExecutionRequest);
                        actionExecutionResult.setStatusCode(statusCode.toString());

                        if (HttpStatusCode.valueOf(401).isSameCodeAs(statusCode)) {
                            actionExecutionResult.setIsExecutionSuccess(false);
                            String errorMessage = "";
                            if (responseEntity.getBody() != null && responseEntity.getBody().length > 0) {
                                errorMessage = new String(responseEntity.getBody());
                            }
                            actionExecutionResult.setErrorInfo(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_AUTHENTICATION_ERROR, errorMessage));
                            return Mono.just(actionExecutionResult);
                        }

                        if (statusCode.is4xxClientError()) {
                            actionExecutionResult.setIsExecutionSuccess(false);
                            String errorMessage = "";
                            if (responseEntity.getBody() != null && responseEntity.getBody().length > 0) {
                                errorMessage = new String(responseEntity.getBody());
                            }
                            actionExecutionResult.setErrorInfo(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_DATASOURCE_ERROR, errorMessage));

                            return Mono.just(actionExecutionResult);
                        }

                        Object body;
                        try {
                            body = objectMapper.readValue(responseEntity.getBody(), Object.class);
                            actionExecutionResult.setBody(body);
                        } catch (IOException ex) {
                            actionExecutionResult.setIsExecutionSuccess(false);
                            actionExecutionResult.setErrorInfo(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR, BODY, ex.getMessage()));
                            return Mono.just(actionExecutionResult);
                        }

                        if (!statusCode.is2xxSuccessful()) {
                            actionExecutionResult.setIsExecutionSuccess(false);
                            actionExecutionResult.setErrorInfo(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_ERROR, QUERY_FAILED_TO_EXECUTE, body));
                            return Mono.just(actionExecutionResult);
                        }

                        actionExecutionResult.setIsExecutionSuccess(true);

                        return Mono.just(actionExecutionResult);
                    })
                    .onErrorResume(error -> {
                        errorResult.setIsExecutionSuccess(false);
                        log.error(
                                "An error has occurred while trying to run the Google AI API query command with error {}",
                                error.getMessage());
                        if (!(error instanceof AppsmithPluginException)) {
                            error = new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_ERROR, error.getMessage(), error);
                        }
                        errorResult.setErrorInfo(error);
                        return Mono.just(errorResult);
                    });
        }

        @Override
        public Mono<TriggerResultDTO> trigger(
                APIConnection connection, DatasourceConfiguration datasourceConfiguration, TriggerRequestDTO request) {
            log.debug(Thread.currentThread().getName() + ": trigger() called for GoogleAI plugin.");
            final ApiKeyAuth apiKeyAuth = (ApiKeyAuth) datasourceConfiguration.getAuthentication();

            // Without a usable key the live fetch cannot succeed; return the fallback list directly
            if (apiKeyAuth == null || !StringUtils.hasText(apiKeyAuth.getValue())) {
                return Mono.just(new TriggerResultDTO(getDataToMap(GoogleAIConstants.GOOGLE_AI_MODELS)));
            }

            URI uri = UriComponentsBuilder.fromUriString(GOOGLE_AI_API_ENDPOINT)
                    .path(MODELS)
                    // single page; Google caps pageSize at 1000, no pagination follow-up on purpose
                    .queryParam("pageSize", 1000)
                    .build()
                    .toUri();

            return Mono.defer(() -> RequestUtils.makeRequest(HttpMethod.GET, uri, apiKeyAuth, BodyInserters.empty()))
                    .map(responseEntity -> {
                        if (!responseEntity.getStatusCode().is2xxSuccessful() || responseEntity.getBody() == null) {
                            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR);
                        }
                        List<String> models = extractGenerateContentModels(new String(responseEntity.getBody()));
                        if (models.isEmpty()) {
                            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR);
                        }
                        return models;
                    })
                    .onErrorResume(error -> {
                        log.debug("Error while fetching Google AI models list, using the fallback list", error);
                        return Mono.just(GoogleAIConstants.GOOGLE_AI_MODELS);
                    })
                    .map(models -> new TriggerResultDTO(getDataToMap(models)));
        }

        /**
         * Parses the models.list response (https://ai.google.dev/api/models#method:-models.list) down to
         * gemini chat models usable with the generateContent command. Package-visible for tests.
         */
        static List<String> extractGenerateContentModels(String responseBody) {
            JsonObject response = JsonParser.parseString(responseBody).getAsJsonObject();
            List<String> models = new ArrayList<>();
            if (!response.has(GoogleAIConstants.MODELS_RESPONSE_KEY)) {
                return models;
            }
            for (JsonElement modelElement : response.getAsJsonArray(GoogleAIConstants.MODELS_RESPONSE_KEY)) {
                JsonObject model = modelElement.getAsJsonObject();
                if (!model.has(GoogleAIConstants.NAME) || !model.has(GoogleAIConstants.SUPPORTED_GENERATION_METHODS)) {
                    continue;
                }
                String name = model.get(GoogleAIConstants.NAME)
                        .getAsString()
                        .replaceFirst("^" + GoogleAIConstants.MODELS_NAME_PREFIX, "");
                if (!name.startsWith("gemini")
                        || NON_CHAT_MODEL_PATTERN.matcher(name).find()) {
                    continue;
                }
                boolean supportsGenerateContent = false;
                for (JsonElement method : model.getAsJsonArray(GoogleAIConstants.SUPPORTED_GENERATION_METHODS)) {
                    if (GoogleAIConstants.GENERATE_CONTENT_METHOD.equals(method.getAsString())) {
                        supportsGenerateContent = true;
                        break;
                    }
                }
                if (supportsGenerateContent) {
                    models.add(name);
                }
            }
            return models;
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            log.debug(Thread.currentThread().getName() + ": validateDatasource() called for GoogleAI plugin.");
            return RequestUtils.validateApiKeyAuthDatasource(datasourceConfiguration);
        }

        private List<Map<String, String>> getDataToMap(List<String> data) {
            return data.stream().sorted().map(x -> Map.of(LABEL, x, VALUE, x)).collect(Collectors.toList());
        }
    }
}
