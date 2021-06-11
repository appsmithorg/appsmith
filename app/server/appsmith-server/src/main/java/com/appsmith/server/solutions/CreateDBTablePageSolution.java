package com.appsmith.server.solutions;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceStructure.Column;
import com.appsmith.external.models.DatasourceStructure.PrimaryKey;
import com.appsmith.external.models.DatasourceStructure.Table;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ApplicationJson;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.PluginService;
import com.google.common.collect.Maps;
import com.google.common.collect.Streams;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class CreateDBTablePageSolution {
    
    private DatasourceStructureSolution datasourceStructureSolution;
    
    private DatasourceService datasourceService;
    
    private PluginService pluginService;
    
    private NewPageService newPageService;
    
    private NewActionService newActionService;
    
    private ApplicationService applicationService;
    
    private LayoutActionService layoutActionService;
    
    private PluginExecutor pluginExecutor;
    
    private String templateDBName = "mock-DB-to-create-CRUD-page";
    
    private String templateApplicationName = "template-CRUD-DB-table-app";
    
    private final String DATABASE_TABLE = "database table";
    
    private final String FILE_PATH = "CRUD-DB-Table-Template-Application.json";
    
    @Autowired
    public CreateDBTablePageSolution(NewPageService newPageService,
                                     DatasourceService datasourceService,
                                     ApplicationService applicationService,
                                     NewActionService newActionService,
                                     LayoutActionService layoutActionService) {
        this.newPageService = newPageService;
        this.datasourceService = datasourceService;
        this.applicationService = applicationService;
        this.newActionService = newActionService;
        this.layoutActionService = layoutActionService;
    }
    
    private enum DBActionType {
        CREATE, READ, SELECT, UPDATE, DELETE
    }
    
    public Mono<PageDTO> createPageFromDBTable(String pageId, Object tableObject) {
    
        final String tableName = ((HashMap<String, String>) tableObject).get("tableName");
        Mono<Datasource> datasourceMono = newPageService.findById(pageId, AclPermission.MANAGE_PAGES)
            .switchIfEmpty(Mono.error(new AppsmithException(
                AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, pageId))
            )
            .flatMap(newPage -> applicationService.findById(newPage.getApplicationId()))
            .flatMap(application ->
                datasourceService
                    .findAllByOrganizationId(application.getOrganizationId(), AclPermission.MANAGE_DATASOURCES)
                    .filter(datasource ->
                        datasource.getStructure() != null && !datasource.getStructure().getTables().isEmpty()
                        && datasource.getStructure().getTables()
                            .stream().filter(table -> StringUtils.equals(table.getName(), tableName)).findFirst() != null
                    )
                    .next()
            )
            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.DATASOURCE)))
            .cache();
        
        Mono<NewPage> pageMono = newPageService.findById(pageId, AclPermission.MANAGE_PAGES)
            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, pageId)));
        
        return datasourceMono
            .zipWhen(datasource -> getTable(datasource, tableName))
            .flatMap(tuple -> {
                Datasource datasource = tuple.getT1();
                Table table = tuple.getT2();
            
                ApplicationJson applicationJson = new ApplicationJson();
                try {
                    applicationJson = fetchTemplateApplication(FILE_PATH);
                } catch (IOException e) {
                    e.printStackTrace();
                }
                //We are expecting only one table will be present
                Table templateTable = applicationJson.getDatasourceList().get(0).getStructure().getTables().get(0);
                Map<String, Column> templateTableNameToColumnMap = new HashMap<>();
                Map<String, Column> currTableNameToColumnMap = new HashMap<>();
                List<Map<String, Column>> columnMapList = List.of(templateTableNameToColumnMap, currTableNameToColumnMap);
                Map<String, String> mappedColumns = mapTableColumnNames(templateTable, table, columnMapList);
                
                List<NewAction> templateActionList = applicationJson.getActionList();
                return cloneActions(datasource, tableName, pageId, templateActionList, mappedColumns)
                    .collectList();
            })
            .map(actionList -> {
                
                PageDTO generatedPage = new PageDTO();
                return generatedPage;
            });
    }
    
    private Mono<Table> getTable(Datasource datasource, String tableName) {
        DatasourceStructure datasourceStructure = datasource.getStructure();
        if (datasourceStructure != null) {
            return Mono.justOrEmpty(getTable(datasourceStructure, tableName))
            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, DATABASE_TABLE, tableName)));
        }
        return datasourceStructureSolution.getStructure(datasource.getId(), true)
            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, DATABASE_TABLE, tableName)))
            .map(datasourceStructure1 -> getTable(datasourceStructure1, tableName));
    }
    
    private Table getTable(DatasourceStructure datasourceStructure, String tableName) {
        return datasourceStructure.getTables()
            .stream()
            .filter(table1 -> StringUtils.equals(table1.getName(),tableName))
            .findAny()
            .orElse(null);
    }
    
    private ApplicationJson fetchTemplateApplication(String filePath) throws IOException {
        final String jsonContent = StreamUtils.copyToString(
            new DefaultResourceLoader().getResource(filePath).getInputStream(),
            Charset.defaultCharset()
        );
        GsonBuilder gsonBuilder = new GsonBuilder();
        Gson gson = gsonBuilder.registerTypeAdapter(DatasourceStructure.Key.class, new DatasourceStructure.KeyInstanceCreator())
            .create();
        
        return gson.fromJson(jsonContent, ApplicationJson.class);
    }
    
    
    private Flux<ActionDTO> cloneActions(Datasource datasource, String tableName, String pageId,
                                         List<NewAction> templateActionList, Map<String, String> mappedColumns) {
        
        return Flux.fromIterable(templateActionList)
            .flatMap(templateAction -> {
                ActionDTO actionDTO = new ActionDTO();
                ActionConfiguration actionConfiguration = templateAction.getUnpublishedAction().getActionConfiguration();
                actionDTO.setPluginId(datasource.getPluginId());
                actionDTO.setId(null);
                actionDTO.setDatasource(datasource);
                actionDTO.setPageId(pageId);
                actionDTO.setName(templateAction.getUnpublishedAction().getName());
                return Mono.zip(layoutActionService.createAction(actionDTO), Mono.just(actionConfiguration));
            })
            .flatMap(tuple -> {
                ActionDTO actionDTO = tuple.getT1();
                ActionConfiguration actionConfiguration = tuple.getT2();
                String actionBody = actionConfiguration.getBody();
                actionDTO.setActionConfiguration(actionConfiguration);
                
                String fieldRegex = "(?<=\")([^ \n,{}]*?)(?=\")";
                
                String body = actionBody.replaceFirst("tableName", tableName);
                final Pattern pattern = Pattern.compile(fieldRegex);
                final Matcher matcher = pattern.matcher(body);
                
                actionDTO.getActionConfiguration().setBody(matcher.replaceAll(key -> mappedColumns.get(key.group())));
                actionDTO.setActionConfiguration(actionConfiguration);
                return layoutActionService.updateAction(actionDTO.getId(), actionDTO);
            });
    }
    
    private Map<String, String> mapTableColumnNames(Table sourceTable, Table destTable, List<Map<String, Column>> columnMapList) {
        Map<String, String> mappedTableColumns = new HashMap<>();
        Map<String, Column> templateColumnMap = columnMapList.get(0);
        Map<String, Column> currTableColumnMap = columnMapList.get(1);
        List<Column> sourceTableColumns = sourceTable.getColumns(), destTableColumns = destTable.getColumns();
        
        mappedTableColumns = mapKeys(sourceTable, destTable);
        int idx = 0;
        while (idx < sourceTableColumns.size() && idx < destTableColumns.size()) {
            
            templateColumnMap.put(sourceTableColumns.get(idx).getName(), sourceTableColumns.get(idx));
            currTableColumnMap.put(destTableColumns.get(idx).getName(), destTableColumns.get(idx));
            if (!mappedTableColumns.containsKey(sourceTableColumns.get(idx).getName())) {
                mappedTableColumns.put(sourceTableColumns.get(idx).getName(), destTableColumns.get(idx).getName());
            }
            idx++;
        }
        
        if (idx < destTableColumns.size()) {
            while (idx < destTableColumns.size()) {
                currTableColumnMap.put(destTableColumns.get(idx).getName(), destTableColumns.get(idx));
                idx++;
            }
        }
        return mappedTableColumns;
    }
    
    private Map<String, String> mapKeys(Table sourceTable, Table destTable) {
        Map<String, String> primaryKeyNameMap = new HashMap<>();
        //keyType vs keyName
        List<String> sourceKeys = new ArrayList<>();
        List<String> destKeys = new ArrayList<>();
        
        if (sourceTable.getKeys() == null || sourceTable.getKeys().isEmpty()
            || destTable.getKeys() == null || destTable.getKeys().isEmpty()) {
            return primaryKeyNameMap;
        }
        sourceTable.getKeys().stream().forEach(key -> {
            if (key instanceof PrimaryKey) {
                PrimaryKey pKey = (PrimaryKey) key;
                sourceKeys.addAll(pKey.getColumnNames());
            }
        });
        destTable.getKeys().stream().forEach(key -> {
            if (key instanceof PrimaryKey) {
                PrimaryKey pKey = (PrimaryKey) key;
                destKeys.addAll(pKey.getColumnNames());
            }
        });
        return Streams.zip(sourceKeys.stream(), destKeys.stream(), Maps::immutableEntry)
            .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }
}


/*
String widgetType = dsl.getAsString(FieldName.WIDGET_TYPE);

// Only Table widget has this behaviour.
if (widgetType != null && widgetType.equals(FieldName.TABLE_WIDGET)) {
    return WidgetSpecificUtils.escapeTableWidgetPrimaryColumns(dsl, escapedWidgetNames);
}
 */