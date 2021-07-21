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

    private final DatasourceService datasourceService;
    private final NewPageService newPageService;
    private final ApplicationService applicationService;
    private final LayoutActionService layoutActionService;
    private final ApplicationPageService applicationPageService;
    private final PluginService pluginService;
    
    private final String FILE_PATH = "CRUD-DB-Table-Template-Application.json";

    private final String TEMPLATE_TABLE_NAME = "public.template_table";

    private final String TEMPLATE_APPLICATION_FILE = "template application file";

    private final String DELETE_FIELD = "deleteThisFieldFromActionsAndLayout";

    private final String SELECT_QUERY = "SelectQuery";

    private final String FIND_QUERY = "FindQuery";

    private final String LIST_QUERY = "ListFiles";

    // This column will be used to map filter in Find and Select query. This particular field is added to have
    // uniformity across different datasources
    private final String DEFAULT_SEARCH_COLUMN = "col3";

    private final String TEMPLATE_S3_BUCKET = "assets-test.appsmith.com";

    private final long MIN_TABLE_COLUMNS = 2;

    // These fields contain the widget fields those need to be mapped between template DB table and DB table in
    // current context
    private final Set<String> WIDGET_FIELDS = Set.of(
        "defaultText", "placeholderText", "text", "options", "defaultOptionValue", "primaryColumns", "isVisible"
    );

    // Pattern to break string in separate words
    final static Pattern wordPattern = Pattern.compile("[^\\W]+");

    /**
     * This function will clone template page along with the actions. DatasourceStructure is used to map the
     * templateColumns with the datasource under consideration
     * @param pageId for which the template page needs to be replicated
     * @param pageResourceDTO
     * @return generated pageDTO from the template resource
     */
    public Mono<PageDTO> createPageFromDBTable(String pageId, CRUDPageResourceDTO pageResourceDTO) {

        /*
            1. Fetch page from the application
            2. Fetch datasource structure
            3. Fetch template application from json file
            4. Map template datasource columns with resource datasource
            5. Clone layout from template application page and update using the column map created in step 4
            6. Clone and update actions in page from the template application
         */

        // All SQL datasources will be mapped to postgresql as actionBody will be same and the same logic is used
        // in template application resource file : CRUD-DB-Table-Template-Application.json
        final Set<String> sqlPackageNames = Set.of(
            "mysql-plugin",
            "mssql-plugin",
            "redshift-plugin",
            "snowflake-plugin"
        );

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
        final Map<String, String> pluginSpecificParams = pageResourceDTO.getPluginSpecificParams();

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
            );

        return datasourceMono
            .zipWhen(datasource -> Mono.zip(
                    pageMono,
                    pluginService.findById(datasource.getPluginId())
                )
            )
            .flatMap(tuple -> {
                Datasource datasource = tuple.getT1();
                NewPage page = tuple.getT2().getT1();
                Plugin plugin = tuple.getT2().getT2();
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
                    .filter(newPage -> StringUtils.equalsIgnoreCase(
                            newPage.getUnpublishedPage().getName(),
                            plugin.getGenerateCRUDPageComponent()
                        )
                    )
                    .findAny()
                    .orElse(null);

                if (templatePage == null) {
                    return Mono.error(
                        new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION, plugin.getName())
                    );
                }

                Layout layout = templatePage.getUnpublishedPage().getLayouts().get(0);

                if (layout == null) {
                    return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE));
                }
                layout.setId(null);
                // onLoadActions will be set after actions are stored in DB
                layout.setLayoutOnLoadActions(null);

                final String templateTableRef =  TEMPLATE_TABLE_NAME.split("\\.", 2)[1];
                Datasource templateDatasource = applicationJson
                    .getDatasourceList()
                    .stream()
                    .filter(datasource1 ->
                        StringUtils.equals(datasource1.getPluginId(), plugin.getPackageName())
                            // In template resource we have used Postgresql as a representative of all sql datasource
                            // as the actionBodies will be same
                        || (StringUtils.equals(datasource1.getPluginId(), "postgres-plugin")
                            && sqlPackageNames.contains(plugin.getPackageName()))
                    )
                    .findAny()
                    .orElse(null);

                if (templateDatasource == null) {
                    return Mono.error(
                        new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION, plugin.getName())
                    );
                }

                DatasourceStructure templateStructure = templateDatasource.getStructure();
                if (templateStructure != null && !CollectionUtils.isEmpty(templateStructure.getTables())) {
                    Table templateTable = templateStructure.getTables()
                        .stream()
                        .filter(table1 -> StringUtils.contains(table1.getName(), templateTableRef))
                        .findAny()
                        .orElse(null);

                    Table table = getTable(datasource, tableName);
                    if (table == null) {
                        return Mono.error(
                            new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.DATASOURCE_STRUCTURE, datasource.getName())
                        );
                    }
                    mappedColumnsAndTableName.putAll(mapTableColumnNames(templateTable, table, searchColumn, columns));
                } else {
                    int colCount = 1;
                    // If the structure and tables not present in the template datasource then map the columns from
                    // template application where we are following the nomenclature of col1, col2, ...
                    if (!CollectionUtils.isEmpty(columns)) {
                        for (String column : columns) {
                            mappedColumnsAndTableName.put("col" + colCount, column);
                            colCount++;
                        }
                        // In template application we have used col1 - col5 so if users tables have less number of
                        // columns these fields need to be deleted
                        if (colCount <= 5) {
                            for (String column : columns) {
                                mappedColumnsAndTableName.put("col" + colCount, DELETE_FIELD);
                                colCount++;
                            }
                        }
                    }
                }

                // Map table names : public.templateTable => <"templateTable","userTable">
                mappedColumnsAndTableName.put(
                    templateTableRef,
                    tableName.contains(".") ? tableName.split("\\.", 2)[1] : tableName);


                Set<String> deletedWidgets = new HashSet<>();
                layout.setDsl(
                    extractAndUpdateAllWidgetFromDSL(layout.getDsl(), mappedColumnsAndTableName, deletedWidgets)
                );

                List<NewAction> templateActionList = applicationJson.getActionList()
                    .stream()
                    .filter(newAction -> StringUtils.equalsIgnoreCase(
                        newAction.getUnpublishedAction().getPageId(),
                        plugin.getGenerateCRUDPageComponent())
                    )
                    .collect(Collectors.toList());

                log.debug("Going to update layout for page {0} and layout {1}", savedPageId.get(), layoutId);
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
                log.debug("Going to clone actions from template application");
                return cloneActionsFromTemplateApplication(datasource,
                                                            tableName,
                                                            savedPageId.get(),
                                                            templateActionList,
                                                            mappedColumnsAndTableName,
                                                            deletedWidgets,
                                                            pluginSpecificParams)

                    .flatMap(actionDTO -> StringUtils.equals(actionDTO.getName(), SELECT_QUERY)
                        || StringUtils.equals(actionDTO.getName(), FIND_QUERY)
                        || StringUtils.equals(actionDTO.getName(), LIST_QUERY)
                        ? layoutActionService.setExecuteOnLoad(actionDTO.getId(), true) : Mono.just(actionDTO))
                    .then(applicationPageService.getPage(savedPageId.get(), false));
            });
    }


    /**
     * @param applicationId application from which the page should be fetched
     * @param pageId ref to page which is going to be fetched
     * @param tableName if page is not present then name of the page name should include tableName
     * @return NewPage if not present already with the incremental suffix number to avoid duplicate application names
     */
    private Mono<NewPage> getOrCreatePage(String applicationId, String pageId, String tableName) {

        /*
            1. Check if the page is already available
            2. If present return the same page
            3. If page is not present create new page and return
        */

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

    /**
     * @param datasource resource from which table has to be filtered
     * @param tableName to filter the available tables in the datasource
     * @return Table from the provided datasource if structure is present
     */
    private Table getTable(Datasource datasource, String tableName) {
        /*
            1. Get structure from datasource
            2. Filter by tableName
        */
        DatasourceStructure datasourceStructure = datasource.getStructure();
        if (datasourceStructure != null) {
            return datasourceStructure.getTables()
                .stream()
                .filter(table1 -> StringUtils.equals(table1.getName(),tableName))
                .findAny()
                .orElse(null);
        }
        return null;
    }

    /**
     * This will fetch the template application resource which then act as a reference to clone layouts and actions
     * @param filePath template application path
     * @return
     * @throws IOException
     */
    private ApplicationJson fetchTemplateApplication(String filePath) throws IOException {

        /*
            1. Fetch the content from the template json file
            2. De-Serialise data from the file
            3. Store the data in the application resource format
         */
        log.debug("Going to fetch template application");
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
     * This function will clone actions from the template application and update action configuration using mapped
     * columns between the template datasource and datasource in context
     * @param datasource
     * @param tableName
     * @param pageId
     * @param templateActionList Actions from the template application related to specific datasource
     * @param mappedColumns Mapped column names between template and resource table under consideration
     * @param deletedWidgetNames Deleted column ref when template application have more # of columns than the users table
     * @return cloned and updated actions from template application actions
     */
    private Flux<ActionDTO> cloneActionsFromTemplateApplication(Datasource datasource,
                                                                String tableName,
                                                                String pageId,
                                                                List<NewAction> templateActionList,
                                                                Map<String, String> mappedColumns,
                                                                Set<String> deletedWidgetNames,
                                                                Map<String, String> pluginSpecificTemplateParams
    ) {
        /*
            1. Clone actions from the template pages
            2. Update actionConfiguration to replace the template table fields with users datasource fields
            stored in mapped columns
            3. Create new action
         */
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
                if (actionBody != null) {
                    String body = actionBody.replaceFirst(TEMPLATE_TABLE_NAME, tableName);
                    final Matcher matcher = wordPattern.matcher(body);
                    actionConfiguration.setBody(matcher.replaceAll(key ->
                        mappedColumns.get(key.group()) == null ? key.group() : mappedColumns.get(key.group()))
                    );
                }

                log.debug("Cloning plugin specified templates for action {}", actionDTO.getId());
                if (!CollectionUtils.isEmpty(pluginSpecifiedTemplates)) {
                    pluginSpecifiedTemplates.forEach(property -> {
                        if (property != null && property.getValue() instanceof String) {
                            if (StringUtils.equals(property.getValue().toString(), TEMPLATE_S3_BUCKET)) {
                                property.setValue(tableName);
                            } else if (property.getKey() != null && !CollectionUtils.isEmpty(pluginSpecificTemplateParams)
                                && pluginSpecificTemplateParams.get(property.getKey()) != null){
                                property.setValue(pluginSpecificTemplateParams.get(property.getKey()));
                            } else {
                                final Matcher matcher = wordPattern.matcher(property.getValue().toString());
                                property.setValue(matcher.replaceAll(key ->
                                    mappedColumns.get(key.group()) == null ? key.group() : mappedColumns.get(key.group()))
                                );
                            }
                        }
                    });
                }

                actionDTO.setActionConfiguration(deleteUnwantedWidgetReferenceInActions(actionConfiguration, deletedWidgetNames));
                return layoutActionService.createAction(actionDTO);
            });
    }

    /**
     * This function maps the column names between the template datasource table and the user's table
     * @param sourceTable provides keys for Map from column names
     * @param destTable provides values for Map from column names
     * @param searchColumn specific column provided to implement the filter for Select and Find query
     * @param tableColumns Specific columns provided by higher order function to act as values for Map
     * @return
     */
    private Map<String, String> mapTableColumnNames(Table sourceTable,
                                                    Table destTable,
                                                    final String searchColumn,
                                                    Set<String> tableColumns) {

        /*
            1. Fetch and map primary keys for source and destination columns if available
            2. Map remaining column names between the sourceTable(key) and destinationTable(value)
         */
        log.debug("Mapping column names with template application for table {}", destTable.getName());
        Map<String, String> mappedTableColumns = new HashMap<>();

        if (searchColumn != null && !searchColumn.isEmpty()) {
            mappedTableColumns.put(DEFAULT_SEARCH_COLUMN, searchColumn);
            sourceTable.getColumns().removeIf(column -> DEFAULT_SEARCH_COLUMN.equals(column.getName()));
            destTable.getColumns().removeIf(column -> searchColumn.equals(column.getName()));
        }
        mappedTableColumns.putAll(mapKeys(sourceTable, destTable));
        List<Column> sourceTableColumns = sourceTable.getColumns(), destTableColumns = destTable.getColumns();
        if (!CollectionUtils.isEmpty(tableColumns) && tableColumns.size() > MIN_TABLE_COLUMNS) {
            destTableColumns = destTableColumns.stream()
                .filter(column -> tableColumns.contains(column.getName()))
                .collect(Collectors.toList());
        }
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

    /**
     * This function maps the primary key names between the template datasource table and the user's table
     * @param sourceTable Template table whose pKey will act as key for the MAP
     * @param destTable Table from the users datasource whose keys will act as values for the MAP
     * @return Map of <sourceKeyColumnName, destinationKeyColumnName>
     */

    private Map<String, String> mapKeys(Table sourceTable, Table destTable) {

        /*
            1. Get pKey for source table and destination table
            2. Map column names from source pKey to destination pKey
        */
        Map<String, String> primaryKeyNameMap = new HashMap<>();
        List<String> sourceKeys = new ArrayList<>();
        List<String> destKeys = new ArrayList<>();
        
        if (CollectionUtils.isEmpty(sourceTable.getKeys()) || CollectionUtils.isEmpty(destTable.getKeys())) {
            return primaryKeyNameMap;
        }
        if (DatasourceStructure.TableType.TABLE.equals(sourceTable.getType())) {
            sourceKeys.add("col1");
        } else if (DatasourceStructure.TableType.COLLECTION.equals(sourceTable.getType())) {
            sourceKeys.add("_id");
        }
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
     * This function updates the dsl of current node and recursively iterate over it's children
     * @param dsl
     * @param mappedColumnsAndTableNames map to replace column names and update dsl
     * @param deletedWidgets store the widgets those are deleted from the dsl
     * @return updated dsl for the widget
     */
    private JSONObject extractAndUpdateAllWidgetFromDSL(JSONObject dsl,
                                                        Map<String, String> mappedColumnsAndTableNames,
                                                        Set<String> deletedWidgets) {

        /*
            1. Update dsl : Replace names of template columns with the user connected datasource columns
            2. Fetch the children of the current node in the DSL and recursively iterate over them
            3. Delete unwanted children
            4. Save and return updated dsl
         */
        if (dsl.get(FieldName.WIDGET_NAME) == null) {
            // This isn't a valid widget configuration. No need to traverse this.
            return dsl;
        }

        updateTemplateWidgets(dsl, mappedColumnsAndTableNames);

        // Updates in dynamicBindingPathlist not required as it's updated by FE code
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

    /**
     * This function will update the widget dsl fields mentioned in WIDGET_FIELDS
     */
    private JSONObject updateTemplateWidgets(JSONObject widgetDsl, Map<String, String> mappedColumnsAndTableNames) {

        /*
            1. Check the keys in widget dsl if needs to be changed
            2. Replace the template column names with the user connected datasource column names
            using mappedColumnsAndTableNames
        */
        List<String> keys = widgetDsl.keySet().stream().filter(WIDGET_FIELDS::contains).collect(Collectors.toList());

        // This field will be used to check the default dropdown value for SelectWidget and only required SelectWidget's
        // options will be updated
        String defaultDropdownValue = widgetDsl.containsKey(FieldName.DEFAULT_OPTION)
            ? widgetDsl.getAsString(FieldName.DEFAULT_OPTION) : "";

        for (String key : keys) {
            if (FieldName.PRIMARY_COLUMNS.equals(key)) {
                Map primaryColumns = (Map) widgetDsl.get(FieldName.PRIMARY_COLUMNS);
                Map newPrimaryColumns = new HashMap();
                Boolean updateRequired = false;
                for (String columnName : (Set<String>) primaryColumns.keySet()) {
                    if (FieldName.MONGO_ESCAPE_ID.equals(columnName)) {
                        updateRequired = true;
                        newPrimaryColumns.put(FieldName.MONGO_UNESCAPED_ID, primaryColumns.get(columnName));
                    } else if (FieldName.MONGO_ESCAPE_CLASS.equals(columnName)) {
                        updateRequired = true;
                        newPrimaryColumns.put(FieldName.MONGO_UNESCAPED_CLASS, primaryColumns.get(columnName));
                    } else {
                        newPrimaryColumns.put(columnName, primaryColumns.get(columnName));
                    }
                }
                if (updateRequired) {
                    widgetDsl.put(FieldName.PRIMARY_COLUMNS, newPrimaryColumns);
                }
            } else if (FieldName.DROP_DOWN_WIDGET.equals(widgetDsl.getAsString(FieldName.TYPE))
                && FieldName.OPTIONS.equals(key)
                && !defaultDropdownValue.toLowerCase().contains("asc")) {
                // This will handle the options field in SelectWidget
                    List<String> dropdownOptions = new ArrayList<>();
                    mappedColumnsAndTableNames.forEach((colKey, colVal) -> {
                        if (colKey.toLowerCase().contains("col")) {
                            dropdownOptions.add("\n{\n\t\"label\": \"" + colVal + "\",\n\t\"value\": \"" + colVal + "\"\n}");
                        }
                    });
                    widgetDsl.put(FieldName.OPTIONS, dropdownOptions.toString());
            } else {
                //Get separate words and map to tableColumns from widgetDsl
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
     * This will delete widget names from body when template datasource have more number of columns than the user
     * connected datasource. Also it will replace the template column names with the user connected datasource column names
     * @param actionConfiguration resource which needs to be updated
     * @param deletedWidgetNames widgets for which references to be removed from the actionConfiguration
     * @return updated ActionConfiguration with deleteWidgets ref removed
     */
    private ActionConfiguration deleteUnwantedWidgetReferenceInActions(
                                                                        ActionConfiguration actionConfiguration,
                                                                        Set<String> deletedWidgetNames) {


        /*
            1. Check for any delete widget reference within actionConfiguration
            2. Remove the fields related to delete widget from actionBody and pluginSpecifiedTemplates
            3. Return updated actionConfiguration
         */
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
        final String regex = "[\"\n{].*" + DELETE_FIELD + ".*[,\n}]";
        if (actionConfiguration.getBody() != null) {
            actionConfiguration.setBody(actionConfiguration.getBody().replaceAll(regex, "\n"));
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