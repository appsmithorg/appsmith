package com.appsmith.server.solutions;

import com.appsmith.external.helpers.BeanCopyUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceStructure.Column;
import com.appsmith.external.models.DatasourceStructure.PrimaryKey;
import com.appsmith.external.models.DatasourceStructure.Table;
import com.appsmith.external.models.Property;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ApplicationJson;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.CRUDPageResourceDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.PluginService;
import com.google.common.collect.ImmutableMap;
import com.google.common.collect.Maps;
import com.google.common.collect.Streams;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.lang.WordUtils;
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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class CreateDBTablePageSolution {

    private final DatasourceStructureSolution datasourceStructureSolution;
    private final DatasourceService datasourceService;
    private final NewPageService newPageService;
    private final ApplicationService applicationService;
    private final LayoutActionService layoutActionService;
    private final ApplicationPageService applicationPageService;
    private final PluginService pluginService;
    
    private final String DATABASE_TABLE = "database table";
    
    private final String FILE_PATH = "CRUD-DB-Table-Template-Application.json";

    private final String TEMPLATE_TABLE_NAME = "public.template_table";

    private final String TEMPLATE_APPLICATION_FILE = "template application file";

    private final String DELETE_FIELD = "deleteThisFieldFromActionsAndLayout";

    private final String SELECT_QUERY = "SelectQuery";

    private final String FIND_QUERY = "FindQuery";

    // This column will be used to map filter in Find and Select query. This particular field is added to have
    // uniformity across different datasources
    private final String DEFAULT_SEARCH_COLUMN = "col3";

    private final long MIN_TABLE_COLUMNS = 2;

    // These fields contain the widget fields those need to be mapped between template DB table and DB table in
    // current context
    private final Set<String> WIDGET_FIELDS = Set.of(
        "defaultText", "placeholderText", "text", "options", "defaultOptionValue", "primaryColumns", "isVisible"
    );

    // Map to select page from the template application for specific datasource
    private final Map<String, String> templatePluginPackageToPageNamesMap = ImmutableMap.<String, String> builder()
        .put("postgres-plugin", "SQL")
        .put("mongo-plugin", "Mongo")
        .put("mysql-plugin", "SQL")
        .put("elasticsearch-plugin", "Elasticsearch")
        .put("dynamo-plugin","Dynamo")
        .put("redis-plugin","Redis")
        .put("mssql-plugin", "SQL")
        .put("firestore-plugin", "Firestore")
        .put("redshift-plugin", "SQL")
        .put("amazons3-plugin", "S3Assets")
        .put("google-sheets-plugin", "GSheets")
        .put("snowflake-plugin", "Snowflake")
        .build();

    // Pattern to break string in separate words
    final static Pattern wordPattern = Pattern.compile("[^\\W]+");

    // Pattern to get string between "_" and ._} : "templateTableColumnName" => templateTableColumnName mapped to tableColumnName
    final static Pattern fieldNamePattern = Pattern.compile("(?<=[\".])([^ ,.{}]*?)(?=[\"}])");

    /**
     * @param pageId for which the template page needs to be replicated
     * @param pageResourceDTO
     * @return generated pageDTO from the template resource
     */
    public Mono<PageDTO> createPageFromDBTable(String pageId, CRUDPageResourceDTO pageResourceDTO) {

        AtomicReference<String> savedPageId = new AtomicReference<>(pageId);
        if (pageResourceDTO.getTableName() == null || pageResourceDTO.getDatasourceId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, ", tableName and datasourceId must be present"));
        } else if (pageResourceDTO.getApplicationId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID));
        }

        final String tableName =  pageResourceDTO.getTableName();
        final String datasourceId =  pageResourceDTO.getDatasourceId();
        final String applicationId = pageResourceDTO.getApplicationId();
        final String searchColumn = pageResourceDTO.getSearchColumn();
        final Set<String> columns = pageResourceDTO.getColumns();

        //Mapped columns along with table name between template and concerned DB table
        Map<String, String> mappedColumnsAndTableName = new HashMap<>();

        Mono<NewPage> pageMono = getOrCreatePage(applicationId, savedPageId.get(), tableName).cache();

        Mono<Datasource> datasourceMono = pageMono
            .flatMap(newPage -> {
                savedPageId.set(newPage.getId());
                return applicationService.findById(newPage.getApplicationId());
            })
            .flatMap(application ->
                datasourceService
                    .findById(datasourceId, AclPermission.MANAGE_DATASOURCES)
                    .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.DATASOURCE, datasourceId))
                    )
                    .filter(datasource -> datasource.getStructure() != null
                        && !CollectionUtils.isEmpty(datasource.getStructure().getTables()))
                    .filter(datasource -> datasource.getStructure().getTables().stream()
                        .anyMatch(table -> StringUtils.equals(table.getName(), tableName)))
                    .switchIfEmpty(Mono.error(
                        new AppsmithException(
                            AppsmithError.NO_RESOURCE_FOUND,
                            FieldName.DATASOURCE_STRUCTURE,
                            "containing table with name " + tableName
                        ))
                    )
            );

        
        return datasourceMono
            .zipWhen(datasource -> Mono.zip(
                    getTable(datasource, tableName),
                    pageMono,
                    pluginService.findById(datasource.getPluginId())
                )
            )
            .flatMap(tuple -> {
                Datasource datasource = tuple.getT1();
                Table table = tuple.getT2().getT1();
                NewPage page = tuple.getT2().getT2();
                Plugin plugin = tuple.getT2().getT3();
                String layoutId = page.getUnpublishedPage().getLayouts().get(0).getId();

                ApplicationJson applicationJson = new ApplicationJson();
                try {
                    BeanCopyUtils.copyNestedNonNullProperties(fetchTemplateApplication(FILE_PATH), applicationJson);
                } catch (IOException e) {
                    log.error(e.getMessage());
                }
                List<NewPage> pageList = applicationJson.getPageList();

                if (pageList.isEmpty()) {
                    return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, TEMPLATE_APPLICATION_FILE));
                }

                NewPage templatePage = pageList.stream()
                    .filter(newPage -> StringUtils.equals(
                            newPage.getUnpublishedPage().getName(),
                            templatePluginPackageToPageNamesMap.get(plugin.getPackageName())
                        )
                    )
                    .findAny()
                    .orElse(null);

                if (templatePage == null) {
                    return Mono.error(
                        new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION, plugin.getName())
                    );
                }

                Layout layout = templatePage.getUnpublishedPage()
                    .getLayouts()
                    .get(0);

                if (layout == null) {
                    return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE));
                }
                layout.setId(null);
                // onLoadActions will be set after it's stored in DB
                layout.setLayoutOnLoadActions(null);

                final String templateTableRef =  TEMPLATE_TABLE_NAME.split("\\.", 2)[1];
                Datasource templateDatasource = applicationJson
                    .getDatasourceList()
                    .stream()
                    .filter(datasource1 -> StringUtils.equals(datasource1.getPluginId(), plugin.getPackageName()))
                    .findAny()
                    .orElse(null);

                if (templateDatasource == null) {
                    return Mono.error(
                        new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION, plugin.getName())
                    );
                }

                DatasourceStructure templateStructure = templateDatasource.getStructure();
                Table templateTable = templateStructure.getTables()
                    .stream()
                    .filter(table1 -> StringUtils.contains(table1.getName(), templateTableRef))
                    .findAny()
                    .orElse(null);

                mappedColumnsAndTableName.putAll(mapTableColumnNames(templateTable, table, searchColumn, columns));
                mappedColumnsAndTableName.put(
                    templateTableRef,
                    tableName.contains(".") ? tableName.split("\\.", 2)[1] : tableName);

                Set<String> deletedWidgets = new HashSet<>();
                layout.setDsl(
                    extractAndUpdateAllWidgetFromDSL(layout.getDsl(), mappedColumnsAndTableName, deletedWidgets)
                );

                List<NewAction> templateActionList = applicationJson.getActionList()
                    .stream()
                    .filter(newAction -> StringUtils.equals(
                            newAction.getUnpublishedAction().getPageId(),
                            templatePluginPackageToPageNamesMap.get(plugin.getPackageName())
                        )
                    )
                    .collect(Collectors.toList());

                return layoutActionService.updateLayout(savedPageId.get(), layoutId, layout)
                    .then(Mono.zip(
                        Mono.just(datasource),
                        Mono.just(templateActionList),
                        Mono.just(deletedWidgets)
                    ));
            })
            .flatMap(tuple -> {

                Datasource datasource = tuple.getT1();
                List<NewAction> templateActionList = tuple.getT2();
                Set<String> deletedWidgets = tuple.getT3();
                return cloneActionsFromTemplateApplication(
                    datasource, tableName, savedPageId.get(), templateActionList, mappedColumnsAndTableName, deletedWidgets)
                    .flatMap(actionDTO -> StringUtils.equals(actionDTO.getName(), SELECT_QUERY)
                        || StringUtils.equals(actionDTO.getName(), FIND_QUERY) ?
                            layoutActionService.setExecuteOnLoad(actionDTO.getId(), true)
                            : Mono.just(actionDTO))
                    .then(applicationPageService.getPage(savedPageId.get(), false));
            });
    }


    /**
     * @param applicationId
     * @param pageId
     * @param tableName
     * @return NewPage if not present already with the incremental suffix number to avoid duplicate application names
     */
    private Mono<NewPage> getOrCreatePage(String applicationId, String pageId, String tableName) {

        log.debug("Fetching page from application {}", applicationId);
        if(pageId != null) {
            return newPageService.findById(pageId, AclPermission.MANAGE_PAGES)
                .switchIfEmpty(Mono.error(new AppsmithException(
                    AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, pageId))
                );
        }

        return newPageService.findByApplicationId(applicationId, AclPermission.MANAGE_PAGES, false)
            .collectList()
            .flatMap(pages -> {
                // Avoid duplicating page names
                String pageName = "Admin Page:" + WordUtils.capitalize(tableName);
                long maxCount = 0L;
                for (PageDTO pageDTO : pages) {
                    if (pageDTO.getName().matches("^" + Pattern.quote(pageName) + "\\d*$")) {
                        long count = 1L;
                        String pageCount = pageDTO.getName().substring(pageName.length());
                        if (!pageCount.isEmpty()) {
                            count = Long.parseLong(pageCount);
                        }
                        maxCount = maxCount <= count ? count + 1 : maxCount;
                    }

                }
                pageName = maxCount != 0 ? pageName + maxCount : pageName;
                PageDTO page = new PageDTO();
                page.setApplicationId(applicationId);
                page.setName(pageName);
                return applicationPageService.createPage(page);
            })
            .flatMap(pageDTO -> newPageService.findById(pageDTO.getId(), AclPermission.MANAGE_PAGES));
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

    /**
     * @param filePath template application path
     * @return application resource
     * @throws IOException
     */
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

    /**
     * @param datasource
     * @param tableName
     * @param pageId
     * @param templateActionList Actions from the template application related to specific datasource
     * @param mappedColumns Mapped column names between template and resource table under consideration
     * @param deletedWidgetNames Deleted column ref when template application have more # of columns than the users table
     * @return cloned actions from template application actions
     */
    private Flux<ActionDTO> cloneActionsFromTemplateApplication(Datasource datasource,
                                                                String tableName,
                                                                String pageId,
                                                                List<NewAction> templateActionList,
                                                                Map<String, String> mappedColumns,
                                                                Set<String> deletedWidgetNames
    ) {
        log.debug("Cloning actions from template application for pageId {}", pageId);
        return Flux.fromIterable(templateActionList)
            .flatMap(templateAction -> {
                ActionDTO actionDTO = new ActionDTO();
                ActionConfiguration templateActionConfiguration = templateAction.getUnpublishedAction().getActionConfiguration();
                actionDTO.setPluginId(datasource.getPluginId());
                actionDTO.setId(null);
                actionDTO.setDatasource(datasource);
                actionDTO.setPageId(pageId);
                actionDTO.setName(templateAction.getUnpublishedAction().getName());

                String actionBody = templateActionConfiguration.getBody();
                actionDTO.setActionConfiguration(templateActionConfiguration);
                ActionConfiguration actionConfiguration = actionDTO.getActionConfiguration();

                List<Property> pluginSpecifiedTemplates = actionConfiguration.getPluginSpecifiedTemplates();
                // SQL
                if (actionBody != null) {
                    String body = actionBody.replaceFirst(TEMPLATE_TABLE_NAME, tableName);
                    final Matcher matcher = fieldNamePattern.matcher(body);
                    actionConfiguration.setBody(matcher.replaceAll(key ->
                        mappedColumns.get(key.group()) == null ? key.group() : mappedColumns.get(key.group()))
                    );
                }

                if ( pluginSpecifiedTemplates != null) {
                    pluginSpecifiedTemplates.forEach(property -> {
                        if (property != null && property.getValue() instanceof String) {
                            final Matcher matcher = wordPattern.matcher(property.getValue().toString());
                            property.setValue(matcher.replaceAll(key ->
                                mappedColumns.get(key.group()) == null ? key.group() : mappedColumns.get(key.group()))
                            );
                        }
                    });
                }

                actionDTO.setActionConfiguration(deleteUnwantedWidgetReferenceInActions(actionConfiguration, deletedWidgetNames));
                return layoutActionService.createAction(actionDTO);
            });
    }

    /**
     * @param sourceTable provides keys for Map from column names
     * @param destTable provides values for Map from column names
     * @param searchColumn specific column provided to implement the filter for Select and Find query
     * @param tableColumns Specific columns provided by higher order function to act as values for Map
     * @return Map of sourceColumnNames to tableColumns
     */
    private Map<String, String> mapTableColumnNames(Table sourceTable,
                                                    Table destTable,
                                                    final String searchColumn,
                                                    Set<String> tableColumns) {

        log.debug("Mapping column names with template application for table {}", destTable.getName());
        Map<String, String> mappedTableColumns = new HashMap<>();

        if (searchColumn != null && !searchColumn.isEmpty()) {
            mappedTableColumns.put(DEFAULT_SEARCH_COLUMN, searchColumn);
            sourceTable.getColumns().removeIf(column -> column.getName().equals(DEFAULT_SEARCH_COLUMN));
            destTable.getColumns().removeIf(column -> column.getName().equals(searchColumn));
        }
        List<Column> sourceTableColumns = sourceTable.getColumns(), destTableColumns = destTable.getColumns();
        if (!CollectionUtils.isEmpty(tableColumns) && tableColumns.size() > MIN_TABLE_COLUMNS) {
            destTableColumns = destTableColumns.stream()
                .filter(column -> tableColumns.contains(column.getName()))
                .collect(Collectors.toList());
        }
        mappedTableColumns.putAll(mapKeys(sourceTable, destTable));
        sourceTableColumns = sourceTableColumns.stream()
            .filter(key -> !mappedTableColumns.containsKey(key.toString()))
            .collect(Collectors.toList());

        destTableColumns = destTableColumns.stream()
            .filter(key -> !mappedTableColumns.containsValue(key.toString()))
            .collect(Collectors.toList());

        int idx = 0;
        while (idx < sourceTableColumns.size() && idx < destTableColumns.size()) {
            if (!mappedTableColumns.containsKey(sourceTableColumns.get(idx).getName())) {
                mappedTableColumns.put(sourceTableColumns.get(idx).getName(), destTableColumns.get(idx).getName());
            }
            idx++;
        }
        
        if (idx < sourceTableColumns.size()) {
            while (idx < sourceTableColumns.size()) {
                //This will act as a ref to delete the unwanted fields from actions and layout
                mappedTableColumns.put(sourceTableColumns.get(idx).getName(), DELETE_FIELD);
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

    /**
     * @param dsl
     * @param mappedColumnsAndTableNames map to replace column names
     * @param deletedWidgets return the widgets those are deleted from the dsl
     * @return updated dsl for the widget
     */
    private JSONObject extractAndUpdateAllWidgetFromDSL(JSONObject dsl,
                                                        Map<String, String> mappedColumnsAndTableNames,
                                                        Set<String> deletedWidgets) {

        if (dsl.get(FieldName.WIDGET_NAME) == null) {
            // This isn't a valid widget configuration. No need to traverse this.
            return dsl;
        }

        updateTemplateWidgets(dsl, mappedColumnsAndTableNames);

        // Updates in dynamicBindingPathlist not required as it updates on the fly by FE code
        // Fetch the children of the current node in the DSL and recursively iterate over them
        ArrayList<Object> children = (ArrayList<Object>) dsl.get(FieldName.CHILDREN);
        ArrayList<Object> newChildren = new ArrayList<>();
        if (children != null) {
            for (Object obj : children) {
                if (!(obj instanceof Map)) {
                    log.error("Child in DSL is not instanceof Map, {}", obj);
                    continue;
                }
                Map data = (Map) obj;
                JSONObject object = new JSONObject();
                // If the children tag exists and there are entries within it
                if (!CollectionUtils.isEmpty(data)) {
                    object.putAll(data);
                    JSONObject child =
                        extractAndUpdateAllWidgetFromDSL(object, mappedColumnsAndTableNames, deletedWidgets);
                    String widgetType = child.getAsString(FieldName.WIDGET_TYPE);
                    if (FieldName.TABLE_WIDGET.equals(widgetType)
                        || FieldName.CONTAINER_WIDGET.equals(widgetType)
                        || FieldName.CANVAS_WIDGET.equals(widgetType)
                        || FieldName.FORM_WIDGET.equals(widgetType)
                        || !child.toString().contains(DELETE_FIELD)
                    ) {
                        newChildren.add(child);
                    } else {
                        deletedWidgets.add(child.getAsString(FieldName.WIDGET_NAME));
                    }
                }
            }
            dsl.put(FieldName.CHILDREN, newChildren);
        }

        return dsl;
    }

    private JSONObject updateTemplateWidgets(JSONObject widgetDsl, Map<String, String> mappedColumnsAndTableNames) {

        List<String> keys = widgetDsl.keySet().stream().filter(WIDGET_FIELDS::contains).collect(Collectors.toList());
        for (String key : keys) {
            //Get separate words and map to tableColumns from widgetDsl
            if (key.equals(FieldName.PRIMARY_COLUMNS)) {
                Map primaryColumns = (Map) widgetDsl.get(FieldName.PRIMARY_COLUMNS);
                Map newPrimaryColumns = new HashMap();
                Boolean updateRequired = false;
                for (String columnName : (Set<String>) primaryColumns.keySet()) {
                    if (columnName.equals(FieldName.MONGO_ESCAPE_ID)) {
                        updateRequired = true;
                        newPrimaryColumns.put(FieldName.MONGO_UNESCAPED_ID, primaryColumns.get(columnName));
                    } else if (columnName.equals(FieldName.MONGO_ESCAPE_CLASS)) {
                        updateRequired = true;
                        newPrimaryColumns.put(FieldName.MONGO_UNESCAPED_CLASS, primaryColumns.get(columnName));
                    } else {
                        newPrimaryColumns.put(columnName, primaryColumns.get(columnName));
                    }
                }
                if (updateRequired) {
                    widgetDsl.put(FieldName.PRIMARY_COLUMNS, newPrimaryColumns);
                }
            } else {
                Matcher matcher = wordPattern.matcher(widgetDsl.getAsString(key));
                widgetDsl.put(key, matcher.replaceAll(field ->
                    mappedColumnsAndTableNames.get(field.group()) == null ?
                        field.group() : mappedColumnsAndTableNames.get(field.group())
                ));
            }
        }
        return widgetDsl;
    }

    /**
     * @param actionConfiguration
     * @param deletedWidgetNames widgets for which references to be removed from the actions
     * @return updated ActionConfiguration with deleteWidgets ref removed
     */
    private ActionConfiguration deleteUnwantedWidgetReferenceInActions(ActionConfiguration actionConfiguration, Set<String> deletedWidgetNames) {

        // Need to delete widget names from body when template datasource have more number of columns

        // We need to check this for insertQuery for SQL
        if (StringUtils.containsIgnoreCase(actionConfiguration.getBody(), "VALUES")) {

            // Get separate words and map to tableColumns from widgetDsl

            Matcher matcher = wordPattern.matcher(actionConfiguration.getBody());
            actionConfiguration.setBody(matcher.replaceAll(field -> deletedWidgetNames.contains(field.group())
                ? DELETE_FIELD : field.group()
            ));
        }

        // When the connected datasource have less number of columns than template datasource, delete the unwanted fields
        // \n"DELETE_FIELD" : '{{Widget.property}}',\n => "" : As mapping is not present
        final String regex = "[\"\n].*" + DELETE_FIELD + ".*[,\n]";
        if (actionConfiguration.getBody() != null) {
            actionConfiguration.setBody(actionConfiguration.getBody().replaceAll(regex, ""));
            // This will remove the unwanted comma after fields deletion if present at the end of body
            // "field1\","field2\",\n\t\"field3" \n,{non-word-characters})\n => insertQuery
            if (actionConfiguration.getBody().matches("(?s).*,[\\W]*?\\).*")) {
                actionConfiguration.setBody(actionConfiguration.getBody().replaceAll(",[\\W]*?\\)", ")"));
            }
            // "field1\","field2\",\n\t\"field3\" ,{non-word-characters => \n\t} WHERE => WHERE condition
            else if (actionConfiguration.getBody().matches("(?s).*,[\\W]*?(?i)WHERE.*")) {
                actionConfiguration.setBody(actionConfiguration.getBody().replaceAll(",[\\W]*?WHERE", "\nWHERE"));
            }
        }

        if ( actionConfiguration.getPluginSpecifiedTemplates() != null) {
            actionConfiguration.getPluginSpecifiedTemplates().forEach(property -> {
                if (property != null && property.getValue() instanceof String) {
                    property.setValue(property.getValue().toString().replaceAll(regex, ""));
                    // This will remove the unwanted comma after fields deletion if present at the end of body
                    // "field1\","field2\",\n\t\"field3" \n,{non-word-characters})\n
                    if (property.getValue().toString().matches("(?s).*,[\\W]*?}.*")) {
                        property.setValue(property.getValue().toString().replaceAll(",[\\W]*?}", "\n}"));
                    }
                }
            });
        }
        return actionConfiguration;
    }
}