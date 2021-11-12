package com.appsmith.server.solutions;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.ClientDataDisplayType;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerRequestType;
import com.appsmith.external.models.TriggerResultDTO;
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeoutException;

import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatasourceStructureSolution {

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

    private Mono<DatasourceStructure> getStructure(Datasource datasource, boolean ignoreCache) {
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

    public Mono<TriggerResultDTO> trigger(String datasourceId, TriggerRequestDTO request) {

        Mono<Datasource> datasourceMono = datasourceService.findById(datasourceId, READ_DATASOURCES)
                .cache();

        Mono<PluginExecutor> pluginExecutorMono = datasourceMono
                .map(datasource -> datasource.getPluginId())
                .flatMap(pluginId -> pluginService.findById(pluginId))
                .flatMap(plugin -> pluginExecutorHelper.getPluginExecutor(Mono.just(plugin)))
                .cache();

        // If the plugin has overridden and implemented the same, use the plugin result
        Mono<TriggerResultDTO> resultFromPluginMono = pluginExecutorMono
                .flatMap(pluginExecutor -> pluginExecutor.trigger(request));

        // If the plugin hasn't, go for the default implementation
        Mono<TriggerResultDTO> defaultResultMono = datasourceMono
                .flatMap(datasource -> entitySelectorTriggerSolution(datasource, request))
                .map(entityNames -> {
                    ClientDataDisplayType displayType = request.getDisplayType();
                    List<Object> result = new ArrayList<>();

                    if (ClientDataDisplayType.DROPDOWN.equals(displayType)) {
                        // label, value
                        for (String entityName : entityNames) {
                            Map<String, String> entity = new HashMap<>();
                            entity.put("label", entityName);
                            entity.put("value", entityName);
                            result.add(entity);
                        }
                    }

                    TriggerResultDTO output = new TriggerResultDTO(result);

                    return output;
                });

        return resultFromPluginMono
                .switchIfEmpty(defaultResultMono);
    }

    private Mono<Set<String>> entitySelectorTriggerSolution(Datasource datasource, TriggerRequestDTO request) {
        if (!TriggerRequestType.ENTITY_SELECTOR.equals(request.getRequestType())) {
            return Mono.just(new HashSet<String>());
        }

        List<Object> parameters = request.getParameters();
        Mono<DatasourceStructure> structureMono = getStructure(datasource, false);


        return structureMono
                .map(structure -> {
                    Set<String> entityNames = new HashSet<>();
                    List<DatasourceStructure.Table> tables = structure.getTables();
                    if (tables != null && !tables.isEmpty()) {

                        if (parameters.isEmpty()) {
                            // Top level entity requested.
                            for (DatasourceStructure.Table table : tables) {
                                entityNames.add(table.getName());
                            }

                        } else if (parameters.size() == 1) {
                            // Given a table name, return all the columns
                            String tableName = (String) parameters.get(0);
                            Optional<DatasourceStructure.Table> tableNamePresent = tables
                                    .stream()
                                    .filter(table -> table.getName().equals(tableName))
                                    .findFirst();

                            if (tableNamePresent.isPresent()) {
                                DatasourceStructure.Table table = tableNamePresent.get();
                                List<DatasourceStructure.Column> columns = table.getColumns();
                                for (DatasourceStructure.Column column : columns) {
                                    entityNames.add(column.getName());
                                }
                            }
                        }
                    }

                    return entityNames;
                });
    }
}
