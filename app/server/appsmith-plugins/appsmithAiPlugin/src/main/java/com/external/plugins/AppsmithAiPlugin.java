package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.restApiUtils.connections.APIConnection;
import com.appsmith.external.helpers.restApiUtils.connections.ApiKeyAuthentication;
import com.appsmith.external.helpers.restApiUtils.helpers.RequestCaptureFilter;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.ApiKeyAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.BaseRestApiPluginExecutor;
import com.appsmith.external.services.SharedConfig;
import com.external.plugins.dtos.AiServerRequestDTO;
import com.external.plugins.dtos.AssociateDTO;
import com.external.plugins.dtos.Query;
import com.external.plugins.dtos.SourceDetails;
import com.external.plugins.models.Feature;
import com.external.plugins.services.AiFeatureService;
import com.external.plugins.services.AiFeatureServiceFactory;
import com.external.plugins.services.AiServerService;
import com.external.plugins.services.AiServerServiceImpl;
import com.external.plugins.services.TriggerService;
import com.external.plugins.services.TriggerServiceImpl;
import com.external.plugins.utils.RequestUtils;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.PluginWrapper;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.external.plugins.constants.AppsmithAiConstants.USECASE;
import static com.external.plugins.utils.FileUtils.getFileIds;
import static com.external.plugins.utils.FileUtils.hasFiles;

@Slf4j
public class AppsmithAiPlugin extends BasePlugin {

    public AppsmithAiPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    public static class AppsmithAiPluginExecutor extends BaseRestApiPluginExecutor {
        private static final AiServerService aiServerService = new AiServerServiceImpl();

        private static final TriggerService triggerService = new TriggerServiceImpl(aiServerService, objectMapper);
        private static final Gson gson = new GsonBuilder().create();

        public AppsmithAiPluginExecutor(SharedConfig config) {
            super(config);
        }

        @Override
        public Mono<APIConnection> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            log.debug(Thread.currentThread().getName() + ": datasourceCreate() called for AppsmithAI plugin.");
            ApiKeyAuth apiKeyAuth = new ApiKeyAuth();
            apiKeyAuth.setValue("test-key");
            return ApiKeyAuthentication.create(apiKeyAuth)
                    .flatMap(apiKeyAuthentication -> Mono.just((APIConnection) apiKeyAuthentication));
        }

        /**
         * In list files trigger, if no files received from the AI server then show a disabled:true and `Upload files first in datasource configuration`.
         * In-case of upload files, datasource configuration will be null since we are triggering without creating any datasource.
         */
        @Override
        public Mono<TriggerResultDTO> trigger(
                APIConnection connection, DatasourceConfiguration datasourceConfiguration, TriggerRequestDTO request) {
            log.debug(Thread.currentThread().getName() + ": trigger() called for AppsmithAI plugin.");
            return triggerService.executeTrigger(connection, datasourceConfiguration, request);
        }

        private Mono<TriggerResultDTO> handleError(String message, Throwable error) {
            log.error("{}. Error: {}", message, error.getMessage());
            if (!(error instanceof AppsmithPluginException)) {
                error = new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, error.getMessage(), error);
            }
            return Mono.error(error);
        }

        @Override
        public Mono<ActionExecutionResult> executeParameterized(
                APIConnection connection,
                ExecuteActionDTO executeActionDTO,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {

            log.debug(Thread.currentThread().getName() + ": executeParameterized() called for AppsmithAI plugin.");
            // Get input from action configuration
            List<Map.Entry<String, String>> parameters = new ArrayList<>();

            prepareConfigurationsForExecution(executeActionDTO, actionConfiguration, datasourceConfiguration);
            // Filter out any empty headers
            headerUtils.removeEmptyHeaders(actionConfiguration);
            headerUtils.setHeaderFromAutoGeneratedHeaders(actionConfiguration);

            return this.executeCommon(
                    connection, datasourceConfiguration, actionConfiguration, parameters, executeActionDTO);
        }

        public Mono<ActionExecutionResult> executeCommon(
                APIConnection apiConnection,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration,
                List<Map.Entry<String, String>> insertedParams,
                ExecuteActionDTO executeActionDTO) {

            log.debug(Thread.currentThread().getName() + ": executeCommon() called for AppsmithAI plugin.");
            Feature feature =
                    Feature.valueOf(RequestUtils.extractDataFromFormData(actionConfiguration.getFormData(), USECASE));
            AiFeatureService aiFeatureService = AiFeatureServiceFactory.getAiFeatureService(feature);
            Query query = aiFeatureService.createQuery(actionConfiguration, datasourceConfiguration, executeActionDTO);
            AiServerRequestDTO aiServerRequestDTO = new AiServerRequestDTO(feature, query);

            ActionExecutionRequest actionExecutionRequest = RequestCaptureFilter.populateRequestFields(
                    actionConfiguration, RequestUtils.getQueryUri(), insertedParams, objectMapper);

            SourceDetails sourceDetails = SourceDetails.createSourceDetails(executeActionDTO);

            return handleExecution(aiFeatureService, aiServerRequestDTO, sourceDetails, actionExecutionRequest);
        }

        private Mono<ActionExecutionResult> handleExecution(
                AiFeatureService aiFeatureService,
                AiServerRequestDTO aiServerRequestDTO,
                SourceDetails sourceDetails,
                ActionExecutionRequest actionExecutionRequest) {
            Mono<ActionExecutionResult> actionExecutionResultMono;
            actionExecutionResultMono =
                    handleExecuteForAiServerService(aiServerRequestDTO, sourceDetails, actionExecutionRequest);
            return actionExecutionResultMono.onErrorResume(this::handleError);
        }

        private Mono<ActionExecutionResult> handleExecuteForAiServerService(
                AiServerRequestDTO aiServerRequestDTO,
                SourceDetails sourceDetails,
                ActionExecutionRequest actionExecutionRequest) {
            return aiServerService
                    .executeQuery(aiServerRequestDTO, sourceDetails)
                    .map(response -> {
                        ActionExecutionResult actionExecutionResult = new ActionExecutionResult();
                        actionExecutionResult.setIsExecutionSuccess(true);
                        actionExecutionResult.setBody(response);
                        actionExecutionResult.setRequest(actionExecutionRequest);
                        return actionExecutionResult;
                    });
        }

        private Mono<ActionExecutionResult> handleError(Throwable error) {
            ActionExecutionResult errorResult = new ActionExecutionResult();
            initUtils.initializeResponseWithError(errorResult);
            log.error(
                    "An error has occurred while trying to run the AI server API query. Error: {}", error.getMessage());
            if (!(error instanceof AppsmithPluginException)) {
                error = new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, error.getMessage(), error);
            }
            errorResult.setErrorInfo(error);
            return Mono.just(errorResult);
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration, boolean isEmbedded) {
            log.debug(Thread.currentThread().getName() + ": validateDatasource() called for AppsmithAI plugin.");
            return Set.of();
        }

        @Override
        public Mono<DatasourceStorage> preSaveHook(DatasourceStorage datasourceStorage) {
            log.debug(Thread.currentThread().getName() + ": preSaveHook() called for AppsmithAI plugin.");
            return aiServerService
                    .associateDatasource(createAssociateDTO(datasourceStorage))
                    .thenReturn(datasourceStorage);
        }

        @Override
        public Mono<DatasourceStorage> preDeleteHook(DatasourceStorage datasourceStorage) {
            log.debug(Thread.currentThread().getName() + ": preDeleteHook() called for AppsmithAI plugin.");
            DatasourceConfiguration datasourceConfiguration = datasourceStorage.getDatasourceConfiguration();
            if (hasFiles(datasourceConfiguration)) {
                return aiServerService
                        .disassociateDatasource(createAssociateDTO(datasourceStorage))
                        .thenReturn(datasourceStorage);
            }
            return super.preDeleteHook(datasourceStorage);
        }

        private AssociateDTO createAssociateDTO(DatasourceStorage datasourceStorage) {
            DatasourceConfiguration datasourceConfiguration = datasourceStorage.getDatasourceConfiguration();
            String datasourceId = datasourceStorage.getDatasourceId();
            String workspaceId = datasourceStorage.getWorkspaceId();
            AssociateDTO associateDTO = new AssociateDTO();
            associateDTO.setWorkspaceId(workspaceId);
            associateDTO.setDatasourceId(datasourceId);
            associateDTO.setFileIds(getFileIds(datasourceConfiguration));
            return associateDTO;
        }
    }
}
