package com.appsmith.server.solutions.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfigurationStructure;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.Property;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.DatasourceContextIdentifier;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.services.AuthenticationValidator;
import com.appsmith.server.services.DatasourceContextService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.DatasourceConfigurationStructureService;
import com.appsmith.server.solutions.DatasourcePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeoutException;

import static com.appsmith.server.helpers.DatasourceAnalyticsUtils.getAnalyticsProperties;
import static com.appsmith.server.helpers.DatasourceAnalyticsUtils.getAnalyticsPropertiesForTestEventStatus;

@RequiredArgsConstructor
@Slf4j
public class DatasourceStructureSolutionCEImpl implements DatasourceStructureSolutionCE {

    public static final int GET_STRUCTURE_TIMEOUT_SECONDS = 15;

    private final DatasourceService datasourceService;
    private final PluginExecutorHelper pluginExecutorHelper;
    private final PluginService pluginService;
    private final DatasourceContextService datasourceContextService;
    private final AuthenticationValidator authenticationValidator;
    private final DatasourcePermission datasourcePermission;
    private final DatasourceConfigurationStructureService datasourceConfigurationStructureService;
    private final AnalyticsService analyticsService;

    public Mono<DatasourceStructure> getStructure(String datasourceId, boolean ignoreCache, String environmentName) {
        return datasourceService.getById(datasourceId)
                .flatMap(datasource -> analyticsService.sendObjectEvent(AnalyticsEvents.DS_SCHEMA_FETCH_EVENT,
                        datasource, getAnalyticsProperties(datasource)).thenReturn(datasource))
                .flatMap(datasource -> getStructure(datasource, ignoreCache, environmentName))
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

    public Mono<DatasourceStructure> getStructure(Datasource datasource,
                                                  boolean ignoreCache,
                                                  String environmentName) {

        if (Boolean.TRUE.equals(datasourceHasInvalids(datasource))) {
            return analyticsService.sendObjectEvent(AnalyticsEvents.DS_SCHEMA_FETCH_EVENT_FAILED,
                    datasource, getAnalyticsPropertiesForTestEventStatus(datasource,false))
                    .then(Mono.empty());
        }

        Mono<DatasourceConfigurationStructure> configurationStructureMono = datasourceConfigurationStructureService.getByDatasourceId(datasource.getId());

        Mono<DatasourceStructure> fetchAndStoreNewStructureMono = pluginExecutorHelper
                .getPluginExecutor(pluginService.findById(datasource.getPluginId()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PLUGIN, datasource.getPluginId())))
                .flatMap(pluginExecutor -> datasourceService
                        .getEvaluatedDSAndDsContextKeyWithEnvMap(datasource, environmentName)
                        .flatMap(tuple3 -> {
                            Datasource datasource2 = tuple3.getT1();
                            DatasourceContextIdentifier datasourceContextIdentifier = tuple3.getT2();
                            Map<String, BaseDomain> environmentMap = tuple3.getT3();
                            return datasourceContextService
                                    .retryOnce(datasource2, datasourceContextIdentifier, environmentMap,
                                            resourceContext -> ((PluginExecutor<Object>) pluginExecutor)
                                                    .getStructure(resourceContext.getConnection(),
                                                            datasource2.getDatasourceConfiguration())); // this datasourceConfiguration is unevaluated for DBAuth type.
                        }))
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
                    log.error("In the datasource structure error mode.", e);
                    if (!(e instanceof AppsmithPluginException)) {
                        return new AppsmithPluginException(AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR, e.getMessage());
                    }

                    return e;

                })
                .flatMap(structure -> analyticsService.sendObjectEvent(AnalyticsEvents.DS_SCHEMA_FETCH_EVENT_SUCCESS,
                        datasource, getAnalyticsPropertiesForTestEventStatus(datasource,true,null))
                        .then(datasource.getId() == null ? Mono.empty() : datasourceConfigurationStructureService.
                                saveStructure(datasource.getId(), structure)).thenReturn(structure));


        // This mono, when computed, will load the structure of the datasource by calling the plugin method.
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
    public Mono<ActionExecutionResult> getDatasourceMetadata(String datasourceId, List<Property> pluginSpecifiedTemplates) {

        /*
            1. Check if the datasource is present
            2. Check plugin is present
            3. Execute DB query from the information provided present in pluginSpecifiedTemplates
         */
        Mono<Datasource> datasourceMono = datasourceService.findById(datasourceId, datasourcePermission.getEditPermission())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.DATASOURCE, datasourceId
                )))
                .flatMap(authenticationValidator::validateAuthentication);

        return datasourceMono.flatMap(datasource -> {

            AuthenticationDTO auth = datasource.getDatasourceConfiguration() == null
                    || datasource.getDatasourceConfiguration().getAuthentication() == null ?
                    null : datasource.getDatasourceConfiguration().getAuthentication();
            if (auth == null) {
                // Don't attempt to run query for invalid datasources.
                return Mono.error(new AppsmithException(
                        AppsmithError.INVALID_DATASOURCE,
                        datasource.getName(),
                        "Authentication failure for datasource, please re-authenticate and try again!"
                ));
            }
            // check if the plugin is present and call method from plugin executor
            return pluginExecutorHelper
                    .getPluginExecutor(pluginService.findById(datasource.getPluginId()))
                    .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PLUGIN, datasource.getPluginId())))
                    .flatMap(pluginExecutor ->
                            pluginExecutor.getDatasourceMetadata(pluginSpecifiedTemplates, datasource.getDatasourceConfiguration())
                    )
                    .timeout(Duration.ofSeconds(GET_STRUCTURE_TIMEOUT_SECONDS));
        });
    }

    /**
     * Checks if the datasource has any invalids.
     * This will have EE overrides.
     *
     * @param datasource
     * @return true if datasource has invalids, otherwise a false
     */
    protected Boolean datasourceHasInvalids(Datasource datasource) {
        if (!CollectionUtils.isEmpty(datasource.getInvalids())) {
            // Don't attempt to get structure for invalid datasources.
            return Boolean.TRUE;
        }

        return Boolean.FALSE;
    }

}
