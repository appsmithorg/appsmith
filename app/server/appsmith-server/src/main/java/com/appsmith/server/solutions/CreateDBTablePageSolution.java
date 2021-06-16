package com.appsmith.server.solutions;

import com.appsmith.external.helpers.BeanCopyUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceStructure.Column;
import com.appsmith.external.models.DatasourceStructure.PrimaryKey;
import com.appsmith.external.models.DatasourceStructure.Table;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ApplicationJson;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.PluginService;
import com.google.common.collect.Maps;
import com.google.common.collect.Streams;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.apache.commons.lang.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StreamUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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

    private LayoutService layoutService;

    private ApplicationPageService applicationPageService;
    
    private final String DATABASE_TABLE = "database table";
    
    private final String FILE_PATH = "CRUD-DB-Table-Template-Application.json";

    private final String TEMPLATE_TABLE_NAME = "templateTableName";

    private final String TEMPLATE_APPLICATION_FILE = "template application file";
    
    @Autowired
    public CreateDBTablePageSolution(NewPageService newPageService,
                                     DatasourceService datasourceService,
                                     ApplicationService applicationService,
                                     NewActionService newActionService,
                                     LayoutActionService layoutActionService,
                                     LayoutService layoutService,
                                     ApplicationPageService applicationPageService) {
        this.newPageService = newPageService;
        this.datasourceService = datasourceService;
        this.applicationService = applicationService;
        this.newActionService = newActionService;
        this.layoutActionService = layoutActionService;
        this.layoutService = layoutService;
        this.applicationPageService = applicationPageService;
    }

    // These fields contain the mapping fields between template DB table and DB table in current context
    private final Set<String> WIDGET_FIELDS = Set.of("defaultText", "placeholderText", "text", "options", "defaultOptionValue");

    public Mono<PageDTO> createPageFromDBTable(String pageId, Object requestBody) {

        final Map<String, Object> tableObject = (HashMap<String, Object>) requestBody;
        if (tableObject.get("tableName") == null || tableObject.get("datasourceName") == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, ", tableName and datasourceName must be present"));
        }
        final String tableName =  tableObject.get("tableName").toString();
        final String datasourceName =  tableObject.get("datasourceName").toString();

        Map<String, Column> templateTableNameToColumnMap = new HashMap<>();
        Map<String, Column> currTableNameToColumnMap = new HashMap<>();
        List<Map<String, Column>> columnMapList = List.of(templateTableNameToColumnMap, currTableNameToColumnMap);
        //Mapped columns along with table name between template and concerned DB table
        Map<String, String> mappedColumnsAndTableName = new HashMap<>();

        Mono<Datasource> datasourceMono = newPageService.findById(pageId, AclPermission.MANAGE_PAGES)
            .switchIfEmpty(Mono.error(new AppsmithException(
                AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, pageId))
            )
            .flatMap(newPage -> applicationService.findById(newPage.getApplicationId()))
            .flatMap(application ->
                datasourceService
                    .findAllByOrganizationId(application.getOrganizationId(), AclPermission.MANAGE_DATASOURCES)
                    .filter(datasource -> datasource.getStructure() != null && !datasource.getStructure().getTables().isEmpty())
                    .filter(datasource -> StringUtils.equals(datasource.getName(), datasourceName))
                    .filter(datasource -> datasource.getStructure().getTables()
                        .stream().filter(table -> StringUtils.equals(table.getName(), tableName)).findFirst() != null)
                    .next()
            )
            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.DATASOURCE)));
        
        Mono<NewPage> pageMono = newPageService.findById(pageId, AclPermission.MANAGE_PAGES)
            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, pageId)));
        
        return datasourceMono
            .zipWhen(datasource -> getTable(datasource, tableName))
            .zipWith(pageMono)
            .flatMap(tuple -> {
                Datasource datasource = tuple.getT1().getT1();
                Table table = tuple.getT1().getT2();
                NewPage page = tuple.getT2();
                String layoutId = page.getUnpublishedPage().getLayouts().get(0).getId();
            
                ApplicationJson applicationJson = new ApplicationJson();
                try {
                    BeanCopyUtils.copyNestedNonNullProperties(fetchTemplateApplication(FILE_PATH), applicationJson);
                } catch (IOException e) {
                    e.printStackTrace();
                }
                List<NewPage> pageList = applicationJson.getPageList();

                if (pageList.isEmpty()) {
                    return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, TEMPLATE_APPLICATION_FILE));
                }

                //TODO for MVP we are supporting single page with only one layout
                Layout layout = pageList.get(0).getUnpublishedPage().getLayouts().get(0);
                layout.setId(null);

                //We are expecting only one table will be present for MVP
                Table templateTable = applicationJson.getDatasourceList().get(0).getStructure().getTables().get(0);

                mappedColumnsAndTableName.putAll(mapTableColumnNames(templateTable, table, columnMapList));
                mappedColumnsAndTableName.put(TEMPLATE_TABLE_NAME, tableName);
                List<NewAction> templateActionList = applicationJson.getActionList();

                return cloneActions(datasource, tableName, pageId, templateActionList, mappedColumnsAndTableName)
                    .then(Mono.zip(layoutActionService.updateLayout(pageId, layoutId, layout), Mono.just(layout)));
            })
            .flatMap(tuple -> {
                LayoutDTO savedLayout = tuple.getT1();
                Layout layout = tuple.getT2();
                savedLayout.setDsl(extractAndUpdateAllWidgetFromDSL(savedLayout.getDsl(), mappedColumnsAndTableName));
                layout.setDsl(savedLayout.getDsl());
                return layoutActionService.updateLayout(pageId, savedLayout.getId(), layout);
            })
            .then(applicationPageService.getPage(pageId, false));
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
                ActionConfiguration templateActionConfiguration = tuple.getT2();
                String actionBody = templateActionConfiguration.getBody();
                actionDTO.setActionConfiguration(templateActionConfiguration);
                ActionConfiguration actionConfiguration = actionDTO.getActionConfiguration();

                /**
                 * "templateTableColumnName" => templateTableColumnName mapped to tableColumnName
                 */
                String fieldRegex = "(?<=\")([^ \n,{}]*?)(?=\")";
                
                String body = actionBody.replaceFirst(TEMPLATE_TABLE_NAME, tableName);
                final Pattern pattern = Pattern.compile(fieldRegex);
                final Matcher matcher = pattern.matcher(body);
                
                actionConfiguration.setBody(matcher.replaceAll(key ->
                    mappedColumns.get(key.group()) == null ? key.group() : mappedColumns.get(key.group()))
                );

                /** When the connected datasource have less number of columns than template datasource, delete the
                 * unwanted fields
                 * "delete" : '{{Widget.property}}', => "" : As mapping is not present
                 */
                actionConfiguration.setBody(actionConfiguration.getBody().replaceAll("\\\"delete.*,", ""));
                actionDTO.setActionConfiguration(actionConfiguration);
                return layoutActionService.updateAction(actionDTO.getId(), actionDTO);
            });
    }
    
    private Map<String, String> mapTableColumnNames(Table sourceTable, Table destTable, List<Map<String, Column>> columnMapList) {
        Map<String, String> mappedTableColumns;
        List<Column> sourceTableColumns = sourceTable.getColumns(), destTableColumns = destTable.getColumns();
        
        mappedTableColumns = mapKeys(sourceTable, destTable);
        int idx = 0;
        while (idx < sourceTableColumns.size() && idx < destTableColumns.size()) {
            
            if (!mappedTableColumns.containsKey(sourceTableColumns.get(idx).getName())) {
                mappedTableColumns.put(sourceTableColumns.get(idx).getName(), destTableColumns.get(idx).getName());
            }
            idx++;
        }
        
        if (idx < sourceTableColumns.size()) {
            while (idx < sourceTableColumns.size()) {
                //We can put delete logic here
                mappedTableColumns.put(sourceTableColumns.get(idx).getName(), "delete");
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
        sourceTable.getKeys().forEach(key -> {
            if (key instanceof PrimaryKey) {
                PrimaryKey pKey = (PrimaryKey) key;
                sourceKeys.addAll(pKey.getColumnNames());
            }
        });
        destTable.getKeys().forEach(key -> {
            if (key instanceof PrimaryKey) {
                PrimaryKey pKey = (PrimaryKey) key;
                destKeys.addAll(pKey.getColumnNames());
            }
        });
        return Streams.zip(sourceKeys.stream(), destKeys.stream(), Maps::immutableEntry)
            .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    private JSONObject extractAndUpdateAllWidgetFromDSL(JSONObject dsl, Map<String, String> mappedColumnsAndTableNames) {

        if (dsl.get(FieldName.WIDGET_NAME) == null) {
            // This isn't a valid widget configuration. No need to traverse this.
            return dsl;
        }

        updateTemplateWidget(dsl, mappedColumnsAndTableNames);

        // Updates in dynamicBindingPathlist not required as it updates on the fly by FE code
        // Fetch the children of the current node in the DSL and recursively iterate over them to extract bindings
        ArrayList<Object> children = (ArrayList<Object>) dsl.get(FieldName.CHILDREN);
        ArrayList<Object> newChildren = new ArrayList<>();
        if (children != null) {
            for (Object obj : children) {
                Map data = (Map) obj;
                JSONObject object = new JSONObject();
                // If the children tag exists and there are entries within it
                if (!CollectionUtils.isEmpty(data)) {
                    object.putAll(data);
                    JSONObject child = extractAndUpdateAllWidgetFromDSL(object, mappedColumnsAndTableNames);
                    newChildren.add(child);
                }
            }
            dsl.put(FieldName.CHILDREN, newChildren);
        }

        return dsl;
    }

    private JSONObject updateTemplateWidget(JSONObject widgetDsl, Map<String, String> mappedColumnsAndTableNames) {

        /**
         * Get separate words and map to tableColumns from widgetDsl
         */
        String fieldRegex = "[^\\W]+";
        final Pattern pattern = Pattern.compile(fieldRegex);
        List<String> keys = widgetDsl.keySet().stream().filter(key -> WIDGET_FIELDS.contains(key)).collect(Collectors.toList());

        for (String key : keys) {
            Matcher matcher = pattern.matcher(widgetDsl.getAsString(key));
            widgetDsl.put(key, matcher.replaceAll(field ->
                mappedColumnsAndTableNames.get(field.group()) == null ?
                    field.group() : mappedColumnsAndTableNames.get(field.group())
            ));
        }
        return widgetDsl;
    }
}