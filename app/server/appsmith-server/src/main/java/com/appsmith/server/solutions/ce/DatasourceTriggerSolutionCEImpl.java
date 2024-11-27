package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.ClientDataDisplayType;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.AuthenticationValidator;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.DatasourceContextService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.DatasourceStructureSolution;
import com.appsmith.server.solutions.EnvironmentPermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.constants.FieldName.DISPLAY_TYPE;
import static com.appsmith.server.constants.FieldName.REQUEST_TYPE;

@RequiredArgsConstructor
@Slf4j
public class DatasourceTriggerSolutionCEImpl implements DatasourceTriggerSolutionCE {

    private final DatasourceService datasourceService;
    private final DatasourceStorageService datasourceStorageService;
    private final PluginExecutorHelper pluginExecutorHelper;
    private final PluginService pluginService;
    private final DatasourceStructureSolution datasourceStructureSolution;
    private final AuthenticationValidator authenticationValidator;
    private final DatasourceContextService datasourceContextService;
    private final DatasourcePermission datasourcePermission;
    private final EnvironmentPermission environmentPermission;
    private final ConfigService configService;
    private final TenantService tenantService;
    private final FeatureFlagService featureFlagService;

    public Mono<TriggerResultDTO> trigger(
            String datasourceId, String environmentId, TriggerRequestDTO triggerRequestDTO) {

        Mono<Datasource> datasourceMonoCached = datasourceService
                .findById(datasourceId, datasourcePermission.getExecutePermission())
                .cache();

        Mono<DatasourceStorage> datasourceStorageMonoCached = datasourceMonoCached
                .flatMap(datasource1 -> datasourceService
                        .getTrueEnvironmentId(
                                datasource1.getWorkspaceId(),
                                environmentId,
                                datasource1.getPluginId(),
                                environmentPermission.getExecutePermission())
                        .zipWhen(trueEnvironmentId ->
                                datasourceStorageService.findByDatasourceAndEnvironmentIdForExecution(
                                        datasource1, trueEnvironmentId))
                        .map(Tuple2::getT2))
                .cache();

        final Mono<Plugin> pluginMono = datasourceStorageMonoCached
                .map(datasourceStorage -> datasourceStorage.getPluginId())
                .flatMap(pluginId -> pluginService.findById(pluginId))
                .cache();

        Mono<PluginExecutor> pluginExecutorMono = pluginMono
                .flatMap(plugin -> pluginExecutorHelper.getPluginExecutor(Mono.just(plugin)))
                .cache();

        if (triggerRequestDTO.getRequestType() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, REQUEST_TYPE));
        }

        if (triggerRequestDTO.getParameters() == null) {
            triggerRequestDTO.setParameters(new HashMap<>());
        }

        final ClientDataDisplayType displayType = triggerRequestDTO.getDisplayType();

        Mono<DatasourceStorage> validatedDatasourceStorageMono =
                datasourceStorageMonoCached.flatMap(authenticationValidator::validateAuthentication);

        // If the plugin has overridden and implemented the same, use the plugin result
        Mono<TriggerResultDTO> resultFromPluginMono = Mono.zip(
                        validatedDatasourceStorageMono, pluginMono, pluginExecutorMono)
                .flatMap(tuple -> {
                    final DatasourceStorage datasourceStorage = tuple.getT1();
                    final Plugin plugin = tuple.getT2();
                    final PluginExecutor pluginExecutor = tuple.getT3();

                    // Flags are needed here for google sheets integration to support shared drive behind a flag
                    // Once thoroughly tested, this flag can be removed
                    Map<String, Boolean> featureFlagMap =
                            featureFlagService.getCachedTenantFeatureFlags().getFeatures();

                    return datasourceContextService
                            .getDatasourceContext(datasourceStorage, plugin)
                            // Now that we have the context (connection details), execute the action.
                            // datasource remains unevaluated for datasource of DBAuth Type Authentication,
                            // However the context comes from evaluated datasource.
                            .flatMap(resourceContext -> setTenantAndInstanceId(triggerRequestDTO)
                                    .flatMap(updatedTriggerRequestDTO -> ((PluginExecutor<Object>) pluginExecutor)
                                            .triggerWithFlags(
                                                    resourceContext.getConnection(),
                                                    datasourceStorage.getDatasourceConfiguration(),
                                                    updatedTriggerRequestDTO,
                                                    featureFlagMap)));
                });

        // If the plugin hasn't implemented the trigger function, go for the default implementation
        Mono<TriggerResultDTO> defaultResultMono = datasourceMonoCached
                .flatMap(datasource1 -> datasourceService
                        .getTrueEnvironmentId(
                                datasource1.getWorkspaceId(),
                                environmentId,
                                datasource1.getPluginId(),
                                environmentPermission.getExecutePermission())
                        .zipWhen(trueEnvironmentId ->
                                entitySelectorTriggerSolution(datasourceId, triggerRequestDTO, trueEnvironmentId))
                        .map(Tuple2::getT2))
                .map(entityNames -> {
                    List<Map<String, String>> result = new ArrayList<>();

                    if (ClientDataDisplayType.DROP_DOWN.equals(displayType)) {
                        // Create maps and add them to the result list
                        for (String entityName : entityNames) {
                            Map<String, String> entity = new HashMap<>();
                            entity.put("label", entityName);
                            entity.put("value", entityName);
                            result.add(entity);
                        }
                        // Sort the list of maps based on the 'label' value
                        result.sort(Comparator.comparing(
                                entity -> entity.get("label").toLowerCase()));
                    }
                    // Convert the result into a list of objects
                    List<Object> objectResult = new ArrayList<>(result);
                    return new TriggerResultDTO(objectResult);
                });

        return resultFromPluginMono.switchIfEmpty(defaultResultMono);
    }

    private Mono<TriggerRequestDTO> setTenantAndInstanceId(TriggerRequestDTO triggerRequestDTO) {
        return tenantService
                .getDefaultTenantId()
                .zipWith(configService.getInstanceId())
                .map(tuple -> {
                    triggerRequestDTO.setTenantId(tuple.getT1());
                    triggerRequestDTO.setInstanceId(tuple.getT2());
                    return triggerRequestDTO;
                });
    }

    private Mono<Set<String>> entitySelectorTriggerSolution(
            String datasourceId, TriggerRequestDTO request, String environmentId) {

        if (request.getDisplayType() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, DISPLAY_TYPE));
        }

        final Map<String, Object> parameters = request.getParameters();
        Mono<DatasourceStructure> structureMono =
                datasourceStructureSolution.getStructure(datasourceId, false, environmentId);

        return structureMono.map(structure -> {
            Set<String> entityNames = new HashSet<>();
            List<DatasourceStructure.Table> tables = structure.getTables();
            if (tables != null && !tables.isEmpty()) {

                if (parameters == null || parameters.isEmpty()) {
                    // Top level entity requested.
                    for (DatasourceStructure.Table table : tables) {
                        entityNames.add(table.getName());
                    }

                } else if (parameters.size() == 1) {
                    // Given a table name, return all the columns
                    String tableName = (String) parameters.get("tableName");
                    Optional<DatasourceStructure.Table> tableNamePresent = tables.stream()
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
