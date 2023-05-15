package com.appsmith.server.solutions.ce;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.DatasourceConfigurationStructure;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.Property;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.services.AuthenticationValidator;
import com.appsmith.server.services.DatasourceConfigurationStructureService;
import com.appsmith.server.services.DatasourceContextService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.DatasourceStorageService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.solutions.DatasourcePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeoutException;

@RequiredArgsConstructor
@Slf4j
public class DatasourceStructureSolutionCEImpl implements DatasourceStructureSolutionCE {

    public static final int GET_STRUCTURE_TIMEOUT_SECONDS = 15;

    private final DatasourceService datasourceService;
    private final DatasourceStorageService datasourceStorageService;
    private final PluginExecutorHelper pluginExecutorHelper;
    private final PluginService pluginService;
    private final DatasourceContextService datasourceContextService;
    private final AuthenticationValidator authenticationValidator;
    private final DatasourcePermission datasourcePermission;
    private final DatasourceConfigurationStructureService datasourceConfigurationStructureService;

    @Override
    public Mono<DatasourceStructure> getStructure(String datasourceId, boolean ignoreCache, String environmentId) {
        String trueEnvironmentId = datasourceService.getTrueEnvironmentId(environmentId);
        return datasourceService.findById(datasourceId, datasourcePermission.getExecutePermission())
                .flatMap(datasource1 -> datasourceStorageService.findByDatasourceAndEnvironmentId(
                        datasource1,
                        trueEnvironmentId))
                .flatMap(datasourceStorage -> getStructure(datasourceStorage, ignoreCache))
                .onErrorMap(
                        IllegalArgumentException.class,
                        error ->
                                new AppsmithPluginException(
                                        AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                        error.getMessage()
                                )
                )
                .onErrorMap(e -> {
                    if (!(e instanceof AppsmithPluginException)) {
                        return new AppsmithPluginException(AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR, e.getMessage());
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
    public Mono<DatasourceStructure> getStructure(DatasourceStorage datasourceStorage,
                                                  boolean ignoreCache) {

        if (Boolean.FALSE.equals(datasourceStorage.getIsValid())) {
            return Mono.empty();
        }

        Mono<DatasourceConfigurationStructure> configurationStructureMono = datasourceConfigurationStructureService
                .getByDatasourceIdAndEnvironmentId(datasourceStorage.getDatasourceId(), datasourceStorage.getEnvironmentId());

        Mono<DatasourceStructure> fetchAndStoreNewStructureMono = pluginExecutorHelper
                .getPluginExecutor(pluginService.findById(datasourceStorage.getPluginId()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PLUGIN, datasourceStorage.getPluginId())))
                .flatMap(pluginExecutor -> {
                    return datasourceContextService
                            .retryOnce(datasourceStorage,
                                    resourceContext -> ((PluginExecutor<Object>) pluginExecutor)
                                            .getStructure(resourceContext.getConnection(),
                                                    datasourceStorage.getDatasourceConfiguration()));
                })
                .timeout(Duration.ofSeconds(GET_STRUCTURE_TIMEOUT_SECONDS))
                .onErrorMap(
                        TimeoutException.class,
                        error -> new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_GET_STRUCTURE_TIMEOUT_ERROR,
                                "Appsmith server timed out when fetching structure. Please reach out to appsmith " +
                                        "customer support to resolve this."
                        )
                )
                .onErrorMap(
                        StaleConnectionException.class,
                        error -> new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_ERROR,
                                "Appsmith server found a secondary stale connection. Please reach out to appsmith " +
                                        "customer support to resolve this."
                        )
                )
                .onErrorMap(
                        IllegalArgumentException.class,
                        error ->
                                new AppsmithPluginException(
                                        AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                        error.getMessage()
                                )
                )
                .onErrorMap(e -> {
                    log.error("In the datasourceStorage structure error mode.", e);

                    if (!(e instanceof AppsmithPluginException)) {
                        return new AppsmithPluginException(AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR, e.getMessage());
                    }

                    return e;
                })
                .flatMap(structure -> datasourceStorage.getId() == null
                        ? Mono.empty()
                        : datasourceConfigurationStructureService.saveStructure(datasourceStorage.getId(), structure).thenReturn(structure)
                );


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

    /**
     * This function will be used to execute queries on datasource without creating the new action
     * e.g. get all spreadsheets from google drive, fetch 1st row from the table etc
     *
     * @param datasourceId
     * @param pluginSpecifiedTemplates
     * @return
     */
    @Override
    public Mono<ActionExecutionResult> getDatasourceMetadata(String datasourceId, String environmentId, List<Property> pluginSpecifiedTemplates) {

        /*
            1. Check if the datasource is present
            2. Check plugin is present
            3. Execute DB query from the information provided present in pluginSpecifiedTemplates
         */
        Mono<DatasourceStorage> datasourceStorageMono = datasourceService
                .findById(datasourceId, datasourcePermission.getExecutePermission())
                .flatMap(datasource1 -> datasourceStorageService
                        .findByDatasourceAndEnvironmentId(
                                datasource1,
                                environmentId))
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.DATASOURCE, datasourceId
                )))
                .flatMap(authenticationValidator::validateAuthentication);

        return datasourceStorageMono.flatMap(datasourceStorage -> {

            AuthenticationDTO auth = datasourceStorage.getDatasourceConfiguration() == null
                    || datasourceStorage.getDatasourceConfiguration().getAuthentication() == null ?
                    null : datasourceStorage.getDatasourceConfiguration().getAuthentication();
            if (auth == null) {
                // Don't attempt to run query for invalid datasources.
                return Mono.error(new AppsmithException(
                        AppsmithError.INVALID_DATASOURCE,
                        datasourceStorage.getName(),
                        "Authentication failure for datasource, please re-authenticate and try again!"
                ));
            }
            // check if the plugin is present and call method from plugin executor
            return pluginExecutorHelper
                    .getPluginExecutor(pluginService.findById(datasourceStorage.getPluginId()))
                    .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PLUGIN, datasourceStorage.getPluginId())))
                    .flatMap(pluginExecutor ->
                            ((PluginExecutor<Object>) pluginExecutor).getDatasourceMetadata(
                                    pluginSpecifiedTemplates,
                                    datasourceStorage.getDatasourceConfiguration()))
                    .timeout(Duration.ofSeconds(GET_STRUCTURE_TIMEOUT_SECONDS));
        });
    }
}
