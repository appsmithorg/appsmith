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

        protected GoogleAiPluginExecutor(SharedConfig sharedConfig) {
            super(sharedConfig);
        }

        /**
         * Tries to fetch the models list from GoogleAI API and if request succeed, then datasource configuration is valid
         */
        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            String printMessage = Thread.currentThread().getName() + ": testDatasource() called for GoogleAI plugin.";
            log.debug(printMessage);
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
            String printMessage =
                    Thread.currentThread().getName() + ": executeParameterized() called for GoogleAI plugin.";
            log.debug(printMessage);
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
            String printMessage = Thread.currentThread().getName() + ": trigger() called for GoogleAI plugin.";
            log.debug(printMessage);
            return Mono.just(new TriggerResultDTO(getDataToMap(GoogleAIConstants.GOOGLE_AI_MODELS)));
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            String printMessage =
                    Thread.currentThread().getName() + ": validateDatasource() called for GoogleAI plugin.";
            log.debug(printMessage);
            return RequestUtils.validateApiKeyAuthDatasource(datasourceConfiguration);
        }

        private List<Map<String, String>> getDataToMap(List<String> data) {
            return data.stream().sorted().map(x -> Map.of(LABEL, x, VALUE, x)).collect(Collectors.toList());
        }
    }
}
