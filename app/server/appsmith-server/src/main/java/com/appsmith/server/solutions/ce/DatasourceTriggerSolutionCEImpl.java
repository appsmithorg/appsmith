package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.ClientDataDisplayType;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.services.AuthenticationValidator;
import com.appsmith.server.services.DatasourceContextService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.DatasourceStorageService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.DatasourceStructureSolution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
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

    public Mono<TriggerResultDTO> trigger(String datasourceId, String environmentId, TriggerRequestDTO triggerRequestDTO) {

        Mono<DatasourceStorage> datasourceStorageMono = datasourceService
                .findById(datasourceId, datasourcePermission.getExecutePermission())
                .flatMap(datasource1 -> datasourceStorageService
                        .findByDatasourceAndEnvironmentId(
                                datasource1,
                                environmentId))
                .cache();

        final Mono<Plugin> pluginMono = datasourceStorageMono
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

        Mono<DatasourceStorage> validatedDatasourceStorageMono = datasourceStorageMono
                .flatMap(authenticationValidator::validateAuthentication);

        // If the plugin has overridden and implemented the same, use the plugin result
        Mono<TriggerResultDTO> resultFromPluginMono = Mono.zip(
                        validatedDatasourceStorageMono,
                        pluginMono,
                        pluginExecutorMono)
                .flatMap(tuple -> {
                    final DatasourceStorage datasourceStorage = tuple.getT1();
                    final Plugin plugin = tuple.getT2();
                    final PluginExecutor pluginExecutor = tuple.getT3();

                    return datasourceContextService.getDatasourceContext(datasourceStorage, plugin)
                            // Now that we have the context (connection details), execute the action.
                            // datasource remains unevaluated for datasource of DBAuth Type Authentication,
                            // However the context comes from evaluated datasource.
                            .flatMap(resourceContext -> ((PluginExecutor<Object>) pluginExecutor)
                                    .trigger(resourceContext.getConnection(),
                                            datasourceStorage.getDatasourceConfiguration(),
                                            triggerRequestDTO));
                });

        // If the plugin hasn't implemented the trigger function, go for the default implementation
        Mono<TriggerResultDTO> defaultResultMono = datasourceStorageMono
                .flatMap(datasource -> entitySelectorTriggerSolution(datasourceId, triggerRequestDTO, environmentId))
                .map(entityNames -> {
                    List<Object> result = new ArrayList<>();

                    if (ClientDataDisplayType.DROP_DOWN.equals(displayType)) {
                        // label, value
                        for (String entityName : entityNames) {
                            Map<String, String> entity = new HashMap<>();
                            entity.put("label", entityName);
                            entity.put("value", entityName);
                            result.add(entity);
                        }
                    }

                    return new TriggerResultDTO(result);
                });

        return resultFromPluginMono
                .switchIfEmpty(defaultResultMono);
    }

    private Mono<Set<String>> entitySelectorTriggerSolution(String datasourceId, TriggerRequestDTO request,
                                                            String environmentName) {
        if (request.getDisplayType() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, DISPLAY_TYPE));
        }

        final Map<String, Object> parameters = request.getParameters();
        Mono<DatasourceStructure> structureMono = datasourceStructureSolution.getStructure(datasourceId, false,
                environmentName);

        return structureMono
                .map(structure -> {
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
