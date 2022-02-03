package com.appsmith.server.solutions.ce;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.Property;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.CustomDatasourceRepository;
import com.appsmith.server.services.AuthenticationValidator;
import com.appsmith.server.services.DatasourceContextService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.PluginService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeoutException;

@RequiredArgsConstructor
@Slf4j
public class DatasourceStructureSolutionCEImpl implements DatasourceStructureSolutionCE {

    public static final int GET_STRUCTURE_TIMEOUT_SECONDS = 15;

    private final DatasourceService datasourceService;
    private final PluginExecutorHelper pluginExecutorHelper;
    private final PluginService pluginService;
    private final DatasourceContextService datasourceContextService;
    private final CustomDatasourceRepository datasourceRepository;
    private final AuthenticationValidator authenticationValidator;

    public Mono<DatasourceStructure> getStructure(String datasourceId, boolean ignoreCache) {
        return datasourceService.getById(datasourceId)
                .flatMap(datasource -> getStructure(datasource, ignoreCache))
                .defaultIfEmpty(new DatasourceStructure())
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

    public Mono<DatasourceStructure> getStructure(Datasource datasource, boolean ignoreCache) {
        if (!CollectionUtils.isEmpty(datasource.getInvalids())) {
            // Don't attempt to get structure for invalid datasources.
            return Mono.empty();
        }

        if (!ignoreCache && datasource.getStructure() != null) {
            // Return the cached structure if available.
            return Mono.just(datasource.getStructure());
        }

        // This mono, when computed, will load the structure of the datasource by calling the plugin method.
        return pluginExecutorHelper
                .getPluginExecutor(pluginService.findById(datasource.getPluginId()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PLUGIN, datasource.getPluginId())))
                .flatMap(pluginExecutor -> datasourceContextService
                        .retryOnce(
                                datasource,
                                resourceContext -> ((PluginExecutor<Object>) pluginExecutor)
                                        .getStructure(resourceContext.getConnection(), datasource.getDatasourceConfiguration())
                        )
                )
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
                .flatMap(structure -> datasource.getId() == null
                        ? Mono.empty()
                        : datasourceRepository.saveStructure(datasource.getId(), structure).thenReturn(structure)
                );
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
        Mono<Datasource> datasourceMono = datasourceService.findById(datasourceId, AclPermission.MANAGE_DATASOURCES)
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


}
