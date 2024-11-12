package com.appsmith.server.solutions.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceStructure.Template;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.DatasourceContextService;
import com.appsmith.server.services.DatasourceStructureService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.EnvironmentPermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.concurrent.TimeoutException;

import static com.appsmith.server.helpers.DatasourceAnalyticsUtils.getAnalyticsPropertiesForTestEventStatus;
import static org.springframework.util.StringUtils.hasText;

@RequiredArgsConstructor
@Slf4j
public class DatasourceStructureSolutionCEImpl implements DatasourceStructureSolutionCE {

    public static final int GET_STRUCTURE_TIMEOUT_SECONDS = 15;

    private final DatasourceService datasourceService;
    private final DatasourceStorageService datasourceStorageService;
    private final PluginExecutorHelper pluginExecutorHelper;
    private final PluginService pluginService;
    private final DatasourceContextService datasourceContextService;
    private final DatasourcePermission datasourcePermission;
    private final DatasourceStructureService datasourceStructureService;
    private final AnalyticsService analyticsService;
    private final EnvironmentPermission environmentPermission;
    private final FeatureFlagService featureFlagService;

    @Override
    public Mono<DatasourceStructure> getStructure(String datasourceId, boolean ignoreCache, String environmentId) {
        return datasourceService
                .findById(datasourceId, datasourcePermission.getExecutePermission())
                .zipWhen(datasource -> datasourceService.getTrueEnvironmentId(
                        datasource.getWorkspaceId(),
                        environmentId,
                        datasource.getPluginId(),
                        environmentPermission.getExecutePermission()))
                .flatMap(tuple2 -> datasourceStorageService.findByDatasourceAndEnvironmentIdForExecution(
                        tuple2.getT1(), tuple2.getT2()))
                .flatMap(datasourceStorage -> getStructure(datasourceStorage, ignoreCache))
                .onErrorMap(
                        IllegalArgumentException.class,
                        error -> new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, error.getMessage()))
                .onErrorMap(e -> {
                    if (!(e instanceof AppsmithPluginException)) {
                        return new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR, e.getMessage());
                    }

                    return e;
                })
                .onErrorResume(error -> {
                    DatasourceStructure dsStructure = new DatasourceStructure();
                    dsStructure.setErrorInfo(error);
                    return Mono.just(dsStructure);
                });
    }

    @Override
    public Mono<DatasourceStructure> getStructure(DatasourceStorage datasourceStorage, boolean ignoreCache) {

        Mono<String> environmentNameMonoCached = datasourceStorageService
                .getEnvironmentNameFromEnvironmentIdForAnalytics(datasourceStorage.getEnvironmentId())
                .cache();

        if (Boolean.FALSE.equals(datasourceStorage.getIsValid())) {
            return environmentNameMonoCached
                    .zipWhen(environmentName -> analyticsService.sendObjectEvent(
                            AnalyticsEvents.DS_SCHEMA_FETCH_EVENT,
                            datasourceStorage,
                            getAnalyticsPropertiesForTestEventStatus(datasourceStorage, false, environmentName)))
                    .then(Mono.just(new DatasourceStructure()));
        }

        Mono<DatasourceStorageStructure> configurationStructureMono =
                datasourceStructureService.getByDatasourceIdAndEnvironmentId(
                        datasourceStorage.getDatasourceId(), datasourceStorage.getEnvironmentId());

        Mono<DatasourceStructure> fetchAndStoreNewStructureMono = pluginExecutorHelper
                .getPluginExecutor(pluginService.findById(datasourceStorage.getPluginId()))
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.PLUGIN, datasourceStorage.getPluginId())))
                .flatMap(pluginExecutor -> {
                    return datasourceContextService.retryOnce(
                            datasourceStorage, resourceContext -> ((PluginExecutor<Object>) pluginExecutor)
                                    .getStructure(
                                            resourceContext.getConnection(),
                                            datasourceStorage.getDatasourceConfiguration(),
                                            datasourceStorage.getIsMock()));
                })
                .timeout(Duration.ofSeconds(GET_STRUCTURE_TIMEOUT_SECONDS))
                .onErrorMap(TimeoutException.class, error -> new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_GET_STRUCTURE_TIMEOUT_ERROR,
                                "Appsmith server timed out when fetching structure. Please reach out to appsmith "
                                        + "customer support to resolve this.")
                        .hideStackTraceInLogs())
                .onErrorMap(
                        StaleConnectionException.class,
                        error -> new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_ERROR,
                                "Appsmith server found a secondary stale connection. Please reach out to appsmith "
                                        + "customer support to resolve this."))
                .onErrorMap(
                        IllegalArgumentException.class,
                        error -> new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, error.getMessage()))
                .onErrorMap(e -> {
                    log.error("In the datasourceStorage structure error mode.", e);

                    if (!(e instanceof AppsmithPluginException)) {
                        return new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR, e.getMessage());
                    }

                    return e;
                })
                .onErrorResume(error -> environmentNameMonoCached
                        .zipWhen(environmentName -> analyticsService.sendObjectEvent(
                                AnalyticsEvents.DS_SCHEMA_FETCH_EVENT,
                                datasourceStorage,
                                getAnalyticsPropertiesForTestEventStatus(
                                        datasourceStorage, false, error, environmentName)))
                        .then(Mono.error(error)))
                .flatMap(structure -> {
                    String datasourceId = datasourceStorage.getDatasourceId();
                    String environmentId = datasourceStorage.getEnvironmentId();

                    return environmentNameMonoCached
                            .zipWhen(environmentName -> analyticsService.sendObjectEvent(
                                    AnalyticsEvents.DS_SCHEMA_FETCH_EVENT,
                                    datasourceStorage,
                                    getAnalyticsPropertiesForTestEventStatus(
                                            datasourceStorage, true, null, environmentName)))
                            .then(
                                    !hasText(datasourceId)
                                            ? Mono.empty()
                                            : datasourceStructureService
                                                    .saveStructure(datasourceId, environmentId, structure)
                                                    .thenReturn(structure));
                });

        // This mono, when computed, will load the structure of the datasourceStorage by calling the plugin method.
        return configurationStructureMono
                .flatMap(configurationStructure -> {
                    if (!ignoreCache && configurationStructure.getStructure() != null) {

                        // Return the cached structure if available.
                        return Mono.just(configurationStructure.getStructure());
                    } else return Mono.empty();
                })
                .switchIfEmpty(fetchAndStoreNewStructureMono)
                .defaultIfEmpty(new DatasourceStructure());
    }

    @Override
    public Mono<ActionExecutionResult> getSchemaPreviewData(
            String datasourceId, String environmentId, Template queryTemplate) {
        return datasourceService
                .findById(datasourceId, datasourcePermission.getActionCreatePermission())
                .zipWhen(datasource -> datasourceService.getTrueEnvironmentId(
                        datasource.getWorkspaceId(),
                        environmentId,
                        datasource.getPluginId(),
                        environmentPermission.getExecutePermission()))
                .flatMap(tuple -> {
                    Datasource datasource = tuple.getT1();
                    String trueEnvironmentId = tuple.getT2();
                    return datasourceStorageService.findByDatasourceAndEnvironmentIdForExecution(
                            datasource, trueEnvironmentId);
                })
                .flatMap(datasourceStorage -> getSchemaPreviewData(datasourceStorage, queryTemplate))
                .onErrorMap(e -> {
                    if (!(e instanceof AppsmithPluginException)) {
                        return new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_GET_PREVIEW_DATA_ERROR, e.getMessage());
                    }

                    return e;
                })
                .onErrorResume(error -> {
                    ActionExecutionResult result = new ActionExecutionResult();
                    result.setErrorInfo(error);
                    return Mono.just(result);
                });
    }

    private Mono<ActionExecutionResult> getSchemaPreviewData(
            DatasourceStorage datasourceStorage, Template queryTemplate) {
        if (Boolean.FALSE.equals(datasourceStorage.getIsValid())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_DATASOURCE));
        }

        return pluginExecutorHelper
                .getPluginExecutor(pluginService.findById(datasourceStorage.getPluginId()))
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.PLUGIN, datasourceStorage.getPluginId())))
                .flatMap(pluginExecutor -> {
                    ActionConfiguration actionConfig = ((PluginExecutor<Object>) pluginExecutor)
                            .getSchemaPreviewActionConfig(queryTemplate, datasourceStorage.getIsMock());
                    // actionConfig will be null for plugins which do not have this functionality yet
                    // Currently its only implemented for PostgreSQL, to be added subsequently for MySQL as well
                    if (actionConfig != null) {
                        return datasourceContextService.retryOnce(
                                datasourceStorage, resourceContext -> ((PluginExecutor<Object>) pluginExecutor)
                                        .executeParameterized(
                                                resourceContext.getConnection(),
                                                null,
                                                datasourceStorage.getDatasourceConfiguration(),
                                                actionConfig));
                    } else {
                        return Mono.error(
                                new AppsmithPluginException(AppsmithPluginError.PLUGIN_UNSUPPORTED_OPERATION));
                    }
                })
                .onErrorMap(
                        StaleConnectionException.class,
                        error -> new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_ERROR,
                                "Appsmith server found a secondary stale connection. Please reach out to appsmith "
                                        + "customer support to resolve this."))
                .onErrorMap(e -> {
                    log.error("In the datasourceStorage fetching preview data error mode.", e);
                    if (!(e instanceof AppsmithPluginException)) {
                        return new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_GET_PREVIEW_DATA_ERROR, e.getMessage());
                    }
                    return e;
                });
    }
}
