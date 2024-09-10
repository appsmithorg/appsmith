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
import com.external.plugins.commands.AnthropicCommand;
import com.external.plugins.constants.AnthropicConstants;
import com.external.plugins.models.AnthropicRequestDTO;
import com.external.plugins.models.CompletionDTO;
import com.external.plugins.models.MessageDTO;
import com.external.plugins.utils.AnthropicMethodStrategy;
import com.external.plugins.utils.RequestUtils;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.json.JSONObject;
import org.pf4j.PluginWrapper;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import static com.external.plugins.constants.AnthropicConstants.ANTHROPIC_MODELS;
import static com.external.plugins.constants.AnthropicConstants.BODY;
import static com.external.plugins.constants.AnthropicConstants.CLAUDE3_PREFIX;
import static com.external.plugins.constants.AnthropicConstants.LABEL;
import static com.external.plugins.constants.AnthropicConstants.TEST_MODEL;
import static com.external.plugins.constants.AnthropicConstants.TEST_PROMPT;
import static com.external.plugins.constants.AnthropicConstants.VALUE;
import static com.external.plugins.constants.AnthropicErrorMessages.EMPTY_API_KEY;
import static com.external.plugins.constants.AnthropicErrorMessages.INVALID_API_KEY;
import static com.external.plugins.constants.AnthropicErrorMessages.QUERY_FAILED_TO_EXECUTE;

@Slf4j
public class AnthropicPlugin extends BasePlugin {
    public AnthropicPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    public static class AnthropicPluginExecutor extends BaseRestApiPluginExecutor {
        private static final Gson gson = new Gson();
        private static final Cache<String, TriggerResultDTO> triggerResponseCache =
                CacheBuilder.newBuilder().expireAfterWrite(1, TimeUnit.DAYS).build();

        protected AnthropicPluginExecutor(SharedConfig sharedConfig) {
            super(sharedConfig);
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            String printMessage = Thread.currentThread().getName() + ": testDatasource() called for Anthropic plugin.";
            log.debug(printMessage);
            final ApiKeyAuth apiKeyAuth = (ApiKeyAuth) datasourceConfiguration.getAuthentication();
            if (!StringUtils.hasText(apiKeyAuth.getValue())) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, EMPTY_API_KEY));
            }

            AnthropicCommand anthropicCommand = AnthropicMethodStrategy.selectExecutionMethod(AnthropicConstants.CHAT);
            URI uri = anthropicCommand.createExecutionUri();
            HttpMethod httpMethod = anthropicCommand.getExecutionMethod();

            AnthropicRequestDTO anthropicRequestDTO = new AnthropicRequestDTO();
            anthropicRequestDTO.setPrompt(TEST_PROMPT);
            anthropicRequestDTO.setModel(TEST_MODEL);
            anthropicRequestDTO.setMaxTokensToSample(1);
            anthropicRequestDTO.setTemperature(0f);

            return RequestUtils.makeRequest(httpMethod, uri, apiKeyAuth, BodyInserters.fromValue(anthropicRequestDTO))
                    .map(responseEntity -> {
                        HttpStatusCode statusCode = responseEntity.getStatusCode();
                        if (HttpStatusCode.valueOf(401).isSameCodeAs(statusCode)) {
                            // invalid credentials
                            return new DatasourceTestResult(INVALID_API_KEY);
                        }

                        return new DatasourceTestResult();
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

            String printMessage =
                    Thread.currentThread().getName() + ": executeParameterized() called for Anthropic plugin.";
            log.debug(printMessage);
            // Get prompt from action configuration
            List<Map.Entry<String, String>> parameters = new ArrayList<>();

            prepareConfigurationsForExecution(executeActionDTO, actionConfiguration, datasourceConfiguration);
            // Filter out any empty headers
            headerUtils.removeEmptyHeaders(actionConfiguration);
            headerUtils.setHeaderFromAutoGeneratedHeaders(actionConfiguration);

            // Initializing object for error condition
            ActionExecutionResult errorResult = new ActionExecutionResult();
            initUtils.initializeResponseWithError(errorResult);

            AnthropicCommand anthropicCommand =
                    AnthropicMethodStrategy.selectExecutionMethod(actionConfiguration, gson);
            AnthropicRequestDTO anthropicRequestDTO = anthropicCommand.makeRequestBody(actionConfiguration);

            URI uri = anthropicCommand.createExecutionUri();
            HttpMethod httpMethod = anthropicCommand.getExecutionMethod();
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

            String model = anthropicRequestDTO.getModel();

            // we don't want to serialise null values as Anthropic throws bad request otherwise
            objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
            String requestBody;
            try {
                requestBody = objectMapper.writeValueAsString(anthropicRequestDTO);
            } catch (Exception e) {
                errorResult.setIsExecutionSuccess(false);
                errorResult.setErrorInfo(
                        new AppsmithPluginException(AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR, e.getMessage()));
                return Mono.just(errorResult);
            }

            return RequestUtils.makeRequest(httpMethod, uri, apiKeyAuth, BodyInserters.fromValue(requestBody))
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
                            if (model.contains(CLAUDE3_PREFIX)) {
                                actionExecutionResult.setBody(body);
                            } else {
                                actionExecutionResult.setBody(
                                        formatResponseBodyAsCompletionAPI(model, responseEntity.getBody()));
                            }
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
                        log.debug(
                                "An error has occurred while trying to run the anthropic API query command with error {}",
                                error.getStackTrace());
                        if (!(error instanceof AppsmithPluginException)) {
                            error = new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_ERROR, error.getMessage(), error);
                        }
                        errorResult.setErrorInfo(error);
                        return Mono.just(errorResult);
                    });
        }

        /**
         * To keep things backward compatible, if model doesn't belong to claude 3, format response in form of claude completion API
         */
        private Object formatResponseBodyAsCompletionAPI(String model, byte[] response) {
            try {
                MessageDTO messageDTO = objectMapper.readValue(response, MessageDTO.class);
                CompletionDTO completionDTO = new CompletionDTO();
                completionDTO.setId(messageDTO.getId());
                completionDTO.setType("completion");
                completionDTO.setStopReason(messageDTO.getStopReason());
                completionDTO.setModel(model);
                completionDTO.setCompletion(messageDTO.getFirstMessage());
                return completionDTO;
            } catch (IOException e) {
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR, new String(response));
            }
        }

        @Override
        public Mono<TriggerResultDTO> trigger(
                APIConnection connection, DatasourceConfiguration datasourceConfiguration, TriggerRequestDTO request) {
            String printMessage = Thread.currentThread().getName() + ": trigger() called for Anthropic plugin.";
            log.debug(printMessage);
            final ApiKeyAuth apiKeyAuth = (ApiKeyAuth) datasourceConfiguration.getAuthentication();
            if (!StringUtils.hasText(apiKeyAuth.getValue())) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, EMPTY_API_KEY));
            }
            if (!StringUtils.hasText(request.getRequestType())) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "request type is missing");
            }
            String requestType = request.getRequestType();

            AnthropicCommand anthropicCommand = AnthropicMethodStrategy.selectTriggerMethod(request, gson);
            HttpMethod httpMethod = anthropicCommand.getTriggerHTTPMethod();
            URI uri = anthropicCommand.createTriggerUri();

            TriggerResultDTO triggerResultDTO = triggerResponseCache.getIfPresent(requestType);
            if (triggerResultDTO != null) {
                return Mono.just(triggerResultDTO);
            }
            return RequestUtils.makeRequest(httpMethod, uri, apiKeyAuth, BodyInserters.empty())
                    .flatMap(responseEntity -> {
                        if (responseEntity.getStatusCode().is4xxClientError()) {
                            return Mono.error(
                                    new AppsmithPluginException(AppsmithPluginError.PLUGIN_AUTHENTICATION_ERROR));
                        }

                        if (!responseEntity.getStatusCode().is2xxSuccessful()) {
                            return Mono.error(
                                    new AppsmithPluginException(AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR));
                        }

                        // link to get response data https://platform.openai.com/docs/api-reference/models/list
                        return Mono.just(new JSONObject(new String(responseEntity.getBody())));
                    })
                    .map(jsonObject -> {
                        JSONArray jsonArray = jsonObject.getJSONArray("data");
                        int len = jsonArray.length();
                        List<String> models = new ArrayList<>();
                        for (int i = 0; i < len; i++) {
                            models.add(jsonArray.getString(i));
                        }
                        return getDataToMap(models);
                    })
                    .onErrorResume(error -> {
                        log.debug("Error while fetching Anthropic models list", error);
                        if (ANTHROPIC_MODELS.containsKey(requestType)) {
                            return Mono.just(getDataToMap(ANTHROPIC_MODELS.get(requestType)));
                        }
                        return Mono.error(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, error.getMessage()));
                    })
                    .map(trigger -> {
                        TriggerResultDTO triggerResult = new TriggerResultDTO(trigger);
                        // saving response on request type
                        triggerResponseCache.put(requestType, triggerResult);
                        return triggerResult;
                    });
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            String printMessage =
                    Thread.currentThread().getName() + ": validateDatasource() called for Anthropic plugin.";
            log.debug(printMessage);
            return RequestUtils.validateApiKeyAuthDatasource(datasourceConfiguration);
        }

        private List<Map<String, String>> getDataToMap(List<String> data) {
            return data.stream().map(x -> Map.of(LABEL, x, VALUE, x)).collect(Collectors.toList());
        }
    }
}
