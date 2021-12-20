package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.ClientDataDisplayType;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerRequestType;
import com.appsmith.external.models.TriggerResultDTO;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.solutions.DatasourceStructureSolution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static com.appsmith.server.constants.FieldName.DISPLAY_TYPE;
import static com.appsmith.server.constants.FieldName.PARAMETERS;
import static com.appsmith.server.constants.FieldName.REQUEST_TYPE;

@RequiredArgsConstructor
@Slf4j
public class DatasourceTriggerSolutionCEImpl implements DatasourceTriggerSolutionCE {

    private final DatasourceService datasourceService;
    private final PluginExecutorHelper pluginExecutorHelper;
    private final PluginService pluginService;
    private final DatasourceStructureSolution datasourceStructureSolution;

    public Mono<TriggerResultDTO> trigger(String datasourceId, MultiValueMap<String, Object> params) {

        Mono<Datasource> datasourceMono = datasourceService.findById(datasourceId, READ_DATASOURCES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "datasourceId")))
                .cache();

        Mono<PluginExecutor> pluginExecutorMono = datasourceMono
                .map(datasource -> datasource.getPluginId())
                .flatMap(pluginId -> pluginService.findById(pluginId))
                .flatMap(plugin -> pluginExecutorHelper.getPluginExecutor(Mono.just(plugin)))
                .cache();

        Object requestTypeObject = params.getFirst(REQUEST_TYPE);
        Object parametersObject = params.getFirst(PARAMETERS);
        Object displayTypeObject = params.getFirst(DISPLAY_TYPE);

        if (requestTypeObject == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, REQUEST_TYPE));
        }
        TriggerRequestType requestType;
        try {
            requestType = TriggerRequestType.valueOf((String) requestTypeObject);
        } catch (IllegalArgumentException e) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, REQUEST_TYPE));
        }

        List<String> parameters;
        if (parametersObject == null || StringUtils.isBlank((CharSequence) parametersObject)) {
            parameters = null;
        } else  {
            parameters = new ArrayList<>(Arrays.asList(((String) parametersObject).split(",")));
        }

        ClientDataDisplayType displayType;
        if (displayTypeObject == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, DISPLAY_TYPE));
        }
        try {
            displayType = ClientDataDisplayType.valueOf((String) displayTypeObject);
        } catch (IllegalArgumentException e) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, DISPLAY_TYPE));
        }


        TriggerRequestDTO request = new TriggerRequestDTO(
                requestType,
                parameters,
                displayType
        );


        // If the plugin has overridden and implemented the same, use the plugin result
        Mono<TriggerResultDTO> resultFromPluginMono = pluginExecutorMono
                .flatMap(pluginExecutor -> pluginExecutor.trigger(request));

        // If the plugin hasn't, go for the default implementation
        Mono<TriggerResultDTO> defaultResultMono = datasourceMono
                .flatMap(datasource -> entitySelectorTriggerSolution(datasource, request))
                .map(entityNames -> {
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
            return Mono.just(new HashSet<>());
        }

        List<String> parameters = request.getParameters();
        Mono<DatasourceStructure> structureMono = datasourceStructureSolution.getStructure(datasource, false);

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
