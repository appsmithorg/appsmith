package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.ClientDataDisplayType;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.domains.DatasourceContextIdentifier;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.services.AuthenticationValidator;
import com.appsmith.server.services.DatasourceContextService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.DatasourceStructureSolution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple5;

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
    private final PluginExecutorHelper pluginExecutorHelper;
    private final PluginService pluginService;
    private final DatasourceStructureSolution datasourceStructureSolution;
    private final AuthenticationValidator authenticationValidator;
    private final DatasourceContextService datasourceContextService;
    private final DatasourcePermission datasourcePermission;

    public Mono<TriggerResultDTO> trigger(String datasourceId, TriggerRequestDTO triggerRequestDTO, String environmentName) {

        Mono<Datasource> datasourceMono = datasourceService.findById(datasourceId, datasourcePermission.getReadPermission())
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "datasourceId")))
                .cache();
        final Mono<Plugin> pluginMono = datasourceMono
                .map(datasource -> datasource.getPluginId())
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

        Mono<Tuple5> datasourceAndPluginEssentialsMono =
                datasourceMono.flatMap(datasource -> {
                    return datasourceService.getEvaluatedDSAndDsContextKeyWithEnvMap(datasource, environmentName)
                            .flatMap(tuple3-> {
                                Datasource datasource1 = tuple3.getT1();
                                DatasourceContextIdentifier datasourceContextIdentifier = tuple3.getT2();
                                Map<String, BaseDomain> environmentMap = tuple3.getT3();

                                Mono<Datasource> validatedDatasourceMono =
                                        authenticationValidator
                                                .validateAuthentication(datasource1, datasourceContextIdentifier.getEnvironmentId())
                                                .cache();

                                return Mono.zip(validatedDatasourceMono, pluginMono, pluginExecutorMono,
                                         Mono.just(datasourceContextIdentifier), Mono.just(environmentMap));
                            });
                });

        // If the plugin has overridden and implemented the same, use the plugin result
        Mono<TriggerResultDTO> resultFromPluginMono = datasourceAndPluginEssentialsMono
                .flatMap(tuple -> {
                    final Datasource datasource = (Datasource) tuple.getT1();
                    final Plugin plugin = (Plugin) tuple.getT2();
                    final PluginExecutor pluginExecutor = (PluginExecutor) tuple.getT3();
                    DatasourceContextIdentifier datasourceContextIdentifier = (DatasourceContextIdentifier) tuple.getT4();
                    Map<String, BaseDomain> environmentMap = (Map<String, BaseDomain>) tuple.getT5();

                    final Mono<Datasource> validDatasourceMono = authenticationValidator
                            .validateAuthentication(datasource, datasourceContextIdentifier.getEnvironmentId());

                    return validDatasourceMono
                            .flatMap(datasource1 -> {
                                if (plugin.isRemotePlugin()) {
                                    return datasourceContextService.getRemoteDatasourceContext(plugin, datasource1);
                                } else {
                                    return datasourceContextService.getDatasourceContext(datasource, datasourceContextIdentifier,
                                                                                                     environmentMap);
                                }
                            })
                            // Now that we have the context (connection details), execute the action.
                            // datasource remains unevaluated for datasource of DBAuth Type Authentication,
                            // However the context comes from evaluated datasource.
                            .flatMap(resourceContext -> {
                                return (Mono<TriggerResultDTO>) pluginExecutor.trigger(resourceContext.getConnection(),
                                                                                       datasource.getDatasourceConfiguration(),
                                                                                       triggerRequestDTO);
                            });
                });

        // If the plugin hasn't, go for the default implementation
        Mono<TriggerResultDTO> defaultResultMono = datasourceMono
                .flatMap(datasource -> entitySelectorTriggerSolution(datasource, triggerRequestDTO, environmentName))
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

    private Mono<Set<String>> entitySelectorTriggerSolution(Datasource datasource, TriggerRequestDTO request,
                                                            String environmentName) {
        if (request.getDisplayType() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, DISPLAY_TYPE));
        }

        final Map<String, Object> parameters = request.getParameters();
        Mono<DatasourceStructure> structureMono = datasourceStructureSolution.getStructure(datasource, false,
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
