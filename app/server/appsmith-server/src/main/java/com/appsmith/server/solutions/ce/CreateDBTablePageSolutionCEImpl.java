package com.appsmith.server.solutions.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.converters.HttpMethodConverter;
import com.appsmith.external.converters.ISOStringToInstantConverter;
import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceStructure.Column;
import com.appsmith.external.models.DatasourceStructure.PrimaryKey;
import com.appsmith.external.models.DatasourceStructure.Table;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Property;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.Assets;
import com.appsmith.server.constants.Entity;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.CRUDPageResourceDTO;
import com.appsmith.server.dtos.CRUDPageResponseDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.DatasourceStructureSolution;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.appsmith.server.solutions.PagePermission;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.lang.WordUtils;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.http.HttpMethod;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StreamUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.charset.Charset;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Slf4j
public class CreateDBTablePageSolutionCEImpl implements CreateDBTablePageSolutionCE {

    private final DatasourceService datasourceService;
    private final DatasourceStorageService datasourceStorageService;
    private final NewPageService newPageService;
    private final LayoutActionService layoutActionService;
    private final UpdateLayoutService updateLayoutService;
    private final ApplicationPageService applicationPageService;
    private final ApplicationService applicationService;
    private final PluginService pluginService;
    private final AnalyticsService analyticsService;
    private final SessionUserService sessionUserService;
    private final ResponseUtils responseUtils;
    private final PluginExecutorHelper pluginExecutorHelper;
    private final DatasourcePermission datasourcePermission;
    private final ApplicationPermission applicationPermission;
    private final PagePermission pagePermission;
    private final DatasourceStructureSolution datasourceStructureSolution;
    private final EnvironmentPermission environmentPermission;

    private static final String FILE_PATH = "CRUD-DB-Table-Template-Application.json";

    private static final String TEMPLATE_TABLE_NAME = "public.template_table";

    private static final String TEMPLATE_APPLICATION_FILE = "template application file";

    private static final String DELETE_FIELD = "deleteThisFieldFromActionsAndLayout";

    private static final String SELECT_QUERY = "SelectQuery";

    private static final String FIND_QUERY = "FindQuery";

    private static final String LIST_QUERY = "ListFiles";

    private static final String INSERT_QUERY = "InsertQuery";

    // Default SelectWidget dropdown value for SQL and Postgres template pages which will be used in select query for
    // sort operator
    private static final String SQL_DEFAULT_DROPDOWN_VALUE = "asc";

    // Default SelectWidget dropdown value for MongoDB template page which will be used in find query for sort operator
    private static final String MONGO_DEFAULT_DROPDOWN_VALUE = "1";

    // This column will be used to map filter in Find and Select query. This particular field is added to have
    // uniformity across different datasources
    private static final String DEFAULT_SEARCH_COLUMN = "col2";

    private static final long MIN_TABLE_COLUMNS = 2;

    private static final long TEMPLATE_COLUMN_COUNT = 12;

    private static final String INSERT_FORM = "insert_form";

    private static final String PRIMARY_KEY = "__primaryKey__";

    // Widget fields those need to be mapped between template DB table and user's DB table in for which we are
    // generating
    // a CRUD page
    private static final Set<String> WIDGET_FIELDS = Set.of(
            "defaultText",
            "placeholderText",
            "text",
            "options",
            "defaultOptionValue",
            "primaryColumns",
            "isVisible",
            "sourceData",
            "title",
            "primaryColumnId");

    // Currently, we only support string matching (like/ilike etc) for WHERE operator in SelectQuery so the allowed
    // types will refer to the equivalent datatype in different databases
    private static final Set<String> ALLOWED_TYPE_FOR_WHERE_CLAUSE =
            Set.of("string", "text", "varchar", "char", "character");

    // Pattern to match all words in the text
    private static final Pattern WORD_PATTERN = Pattern.compile("\\w+");

    private final Gson gson = new GsonBuilder()
            .registerTypeAdapter(DatasourceStructure.Key.class, new DatasourceStructure.KeyInstanceCreator())
            .registerTypeAdapter(Instant.class, new ISOStringToInstantConverter())
            .registerTypeAdapter(HttpMethod.class, new HttpMethodConverter())
            .create();

    public Mono<CRUDPageResponseDTO> createPageFromDBTable(
            String defaultPageId,
            CRUDPageResourceDTO pageResourceDTO,
            String environmentId,
            String branchName,
            Boolean isTrueEnvironmentIdRequired) {
        if (Boolean.TRUE.equals(isTrueEnvironmentIdRequired)) {
            return datasourceService
                    .findById(pageResourceDTO.getDatasourceId())
                    .flatMap(datasource -> {
                        return datasourceService.getTrueEnvironmentId(
                                datasource.getWorkspaceId(),
                                environmentId,
                                datasource.getPluginId(),
                                environmentPermission.getExecutePermission());
                    })
                    .flatMap(trueEnvironmentId ->
                            createPageFromDBTable(defaultPageId, pageResourceDTO, trueEnvironmentId, branchName));
        }

        return createPageFromDBTable(defaultPageId, pageResourceDTO, environmentId, branchName);
    }

    /**
     * This function will clone template page along with the actions. DatasourceStructure is used to map the
     * templateColumns with the datasource under consideration
     *
     * @param defaultPageId   for which the template page needs to be replicated
     * @param pageResourceDTO
     * @param environmentId
     * @return generated pageDTO from the template resource
     */
    public Mono<CRUDPageResponseDTO> createPageFromDBTable(
            String defaultPageId, CRUDPageResourceDTO pageResourceDTO, String environmentId, String branchName) {

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
        final Set<String> sqlPackageNames =
                Set.of("mysql-plugin", "mssql-plugin", "redshift-plugin", "snowflake-plugin");
        StringBuffer templateAutogeneratedKey = new StringBuffer();
        if (pageResourceDTO.getTableName() == null || pageResourceDTO.getDatasourceId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "tableName and datasourceId"));
        } else if (pageResourceDTO.getApplicationId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID));
        }

        final String tableName = pageResourceDTO.getTableName();
        final String datasourceId = pageResourceDTO.getDatasourceId();
        final String defaultApplicationId = pageResourceDTO.getApplicationId();
        final String searchColumn = pageResourceDTO.getSearchColumn();
        final Set<String> columns = pageResourceDTO.getColumns();
        final Map<String, String> pluginSpecificParams = pageResourceDTO.getPluginSpecificParams();

        // Mapped columns along with table name between template and concerned DB table
        Map<String, String> mappedColumnsAndTableName = new HashMap<>();

        // Fetch branched applicationId if connected to git
        Mono<NewPage> pageMono = getOrCreatePage(defaultApplicationId, defaultPageId, tableName, branchName);

        Mono<DatasourceStorage> datasourceStorageMono = datasourceService
                .findById(datasourceId, datasourcePermission.getActionCreatePermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.DATASOURCE, datasourceId)))
                .flatMap(datasource -> datasourceStorageService.findByDatasourceAndEnvironmentIdForExecution(
                        datasource, environmentId))
                .filter(DatasourceStorage::getIsValid)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.INVALID_DATASOURCE, FieldName.DATASOURCE, datasourceId)));

        return datasourceStorageMono
                .zipWhen(datasourceStorage -> Mono.zip(
                        pageMono,
                        pluginService.findById(datasourceStorage.getPluginId()),
                        datasourceStructureSolution.getStructure(datasourceStorage, false)))
                .flatMap(tuple -> {
                    DatasourceStorage datasourceStorage = tuple.getT1();
                    NewPage page = tuple.getT2().getT1();
                    Plugin plugin = tuple.getT2().getT2();
                    DatasourceStructure datasourceStructure = tuple.getT2().getT3();

                    final String layoutId =
                            page.getUnpublishedPage().getLayouts().get(0).getId();
                    final String savedPageId = page.getId();

                    ApplicationJson applicationJson = new ApplicationJson();
                    try {
                        AppsmithBeanUtils.copyNestedNonNullProperties(
                                fetchTemplateApplication(FILE_PATH), applicationJson);
                    } catch (IOException e) {
                        log.error(e.getMessage());
                    }
                    List<NewPage> pageList = applicationJson.getPageList();

                    if (pageList.isEmpty()) {
                        return Mono.error(
                                new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, TEMPLATE_APPLICATION_FILE));
                    }

                    NewPage templatePage = pageList.stream()
                            .filter(newPage -> StringUtils.equalsIgnoreCase(
                                    newPage.getUnpublishedPage().getName(), plugin.getGenerateCRUDPageComponent()))
                            .findAny()
                            .orElse(null);

                    if (templatePage == null) {
                        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION, plugin.getName()));
                    }

                    Layout layout =
                            templatePage.getUnpublishedPage().getLayouts().get(0);

                    if (layout == null) {
                        return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE));
                    }
                    layout.setId(null);
                    // onLoadActions will be set after actions are stored in DB
                    layout.setLayoutOnLoadActions(null);

                    // Extract table names : public.templateTable => templateTable
                    final String templateTableRef = TEMPLATE_TABLE_NAME.split("\\.", 2)[1];
                    final String tableRef = tableName.contains(".") ? tableName.split("\\.", 2)[1] : tableName;

                    DatasourceStorage templateDatasource = applicationJson.getDatasourceList().stream()
                            .filter(datasource1 -> {
                                final String pluginRef = plugin.getPluginName() == null
                                        ? plugin.getPackageName()
                                        : plugin.getPluginName();
                                return StringUtils.equals(datasource1.getPluginId(), pluginRef)
                                        // In template resource we have used Postgresql as a representative of all sql
                                        // datasource
                                        // as the actionBodies will be same
                                        || (StringUtils.equals(
                                                        datasource1.getPluginId(), Entity.POSTGRES_PLUGIN_PACKAGE_NAME)
                                                && sqlPackageNames.contains(pluginRef));
                            })
                            .findAny()
                            .orElse(null);

                    if (templateDatasource == null) {
                        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION, plugin.getName()));
                    }

                    DatasourceStorageStructure templateDatasourceStorageStructure =
                            applicationJson.getDatasourceConfigurationStructureList().stream()
                                    .filter(configurationStructure -> StringUtils.equals(
                                            configurationStructure.getDatasourceId(), templateDatasource.getName()))
                                    .findAny()
                                    .orElse(null);

                    DatasourceStructure templateStructure = templateDatasourceStorageStructure.getStructure();
                    // We are supporting datasources for both with and without datasource structure. So if datasource
                    // structure is present then we can assign the mapping dynamically as per the template datasource
                    // tables.
                    // Those datasources for which we don't have structure like Google sheet etc we are following a
                    // protocol in template application that all the column headers should be named as col1, col2,....
                    // colx

                    String tableNameUsedInAction = tableName;
                    if (templateStructure != null && !CollectionUtils.isEmpty(templateStructure.getTables())) {
                        Table templateTable = templateStructure.getTables().stream()
                                .filter(table1 -> StringUtils.contains(table1.getName(), templateTableRef))
                                .findAny()
                                .orElse(null);

                        Table table = getTable(datasourceStructure, tableName);
                        if (table == null) {
                            return Mono.error(new AppsmithException(
                                    AppsmithError.NO_RESOURCE_FOUND,
                                    FieldName.DATASOURCE_STRUCTURE,
                                    datasourceStorage.getName()));
                        }

                        // Use template body to extract the table name usage in actions
                        // Sample template body : SELECT * FROM public."templateTable" LIMIT 10;
                        if (!CollectionUtils.isEmpty(table.getTemplates())
                                && table.getTemplates().get(0).getBody() != null) {
                            final Pattern pattern = Pattern.compile("[^ ]*" + tableRef + "[^ ,]*");
                            final Matcher matcher =
                                    pattern.matcher(table.getTemplates().get(0).getBody());

                            tableNameUsedInAction = matcher.find() ? matcher.group(0) : tableName;
                        }
                        mappedColumnsAndTableName.putAll(mapTableColumnNames(
                                templateTable, table, searchColumn, columns, templateAutogeneratedKey));
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
                            if (colCount <= TEMPLATE_COLUMN_COUNT) {
                                for (String column : columns) {
                                    mappedColumnsAndTableName.put("col" + colCount, DELETE_FIELD);
                                    colCount++;
                                }
                            }
                        }
                    }

                    // Map table names : public.templateTable => <"templateTable","userTable">
                    mappedColumnsAndTableName.put(templateTableRef, tableName);

                    Set<String> deletedWidgets = new HashSet<>();
                    layout.setDsl(extractAndUpdateAllWidgetFromDSL(
                            layout.getDsl(),
                            mappedColumnsAndTableName,
                            deletedWidgets,
                            templateAutogeneratedKey.toString()));

                    List<NewAction> templateActionList = applicationJson.getActionList().stream()
                            .filter(newAction -> StringUtils.equalsIgnoreCase(
                                    newAction.getUnpublishedAction().getPageId(),
                                    plugin.getGenerateCRUDPageComponent()))
                            .peek(newAction -> newAction.setDefaultResources(page.getDefaultResources()))
                            .collect(Collectors.toList());

                    List<ActionConfiguration> templateUnpublishedActionConfigList = templateActionList.stream()
                            .map(NewAction::getUnpublishedAction)
                            .map(ActionDTO::getActionConfiguration)
                            .collect(Collectors.toList());

                    /**
                     * Any plugin specific update to the template queries should be defined by overriding the
                     * `sanitizeGenerateCRUDPageTemplateInfo` method in the respective plugin. In the default case no
                     * changes are made to the template. e.g. please check the sanitizeGenerateCRUDPageTemplateInfo
                     * method defined in AmazonS3Plugin.java .
                     */
                    Mono<Void> sanitizeTemplateInfoMono = pluginExecutorHelper
                            .getPluginExecutorFromPackageName(plugin.getPackageName())
                            .flatMap(pluginExecutor -> pluginExecutor.sanitizeGenerateCRUDPageTemplateInfo(
                                    templateUnpublishedActionConfigList, mappedColumnsAndTableName, tableName));

                    log.debug("Going to update layout for page {} and layout {}", savedPageId, layoutId);
                    return sanitizeTemplateInfoMono
                            .then(updateLayoutService.updateLayout(
                                    savedPageId, page.getApplicationId(), layoutId, layout))
                            .then(Mono.zip(
                                    Mono.just(datasourceStorage),
                                    Mono.just(templateActionList),
                                    Mono.just(deletedWidgets),
                                    Mono.just(plugin),
                                    Mono.just(tableNameUsedInAction),
                                    Mono.just(savedPageId)));
                })
                .flatMap(tuple -> {
                    DatasourceStorage datasourceStorage = tuple.getT1();
                    List<NewAction> templateActionList = tuple.getT2();
                    Set<String> deletedWidgets = tuple.getT3();
                    Plugin plugin = tuple.getT4();
                    String tableNameInAction = tuple.getT5();
                    String savedPageId = tuple.getT6();
                    log.debug("Going to clone actions from template application for page {}", savedPageId);
                    return cloneActionsFromTemplateApplication(
                                    datasourceStorage,
                                    tableNameInAction,
                                    savedPageId,
                                    templateActionList,
                                    mappedColumnsAndTableName,
                                    deletedWidgets,
                                    pluginSpecificParams,
                                    templateAutogeneratedKey.toString())
                            .flatMap(actionDTO -> StringUtils.equals(actionDTO.getName(), SELECT_QUERY)
                                            || StringUtils.equals(actionDTO.getName(), FIND_QUERY)
                                            || StringUtils.equals(actionDTO.getName(), LIST_QUERY)
                                    ? layoutActionService.setExecuteOnLoad(actionDTO.getId(), true)
                                    : Mono.just(actionDTO))
                            .then(applicationPageService
                                    .getPage(savedPageId, false)
                                    .flatMap(pageDTO -> {
                                        CRUDPageResponseDTO crudPage = new CRUDPageResponseDTO();
                                        crudPage.setPage(pageDTO);
                                        createSuccessMessageAndSetAsset(plugin, crudPage);
                                        return sendGenerateCRUDPageAnalyticsEvent(
                                                        crudPage, datasourceStorage, plugin.getName())
                                                .map(res -> {
                                                    PageDTO sanitisedResponse =
                                                            responseUtils.updatePageDTOWithDefaultResources(
                                                                    res.getPage());
                                                    crudPage.setPage(sanitisedResponse);
                                                    return crudPage;
                                                });
                                    }));
                });
    }

    /**
     * @param defaultApplicationId application from which the page should be fetched
     * @param defaultPageId        default page for which equivalent branched page is going to be fetched
     * @param tableName            if page is not present then name of the page name should include tableName
     * @param branchName           branch of which the page needs to be fetched
     * @return NewPage if not present already with the incremental suffix number to avoid duplicate application names
     */
    private Mono<NewPage> getOrCreatePage(
            String defaultApplicationId, String defaultPageId, String tableName, String branchName) {

        /*
            1. Check if the page is already available
            2. If present return the same page
            3. If page is not present create new page and return
        */

        log.debug(
                "Fetching page from application {}, defaultPageId {}, branchName {}",
                defaultApplicationId,
                defaultPageId,
                branchName);
        if (defaultPageId != null) {
            return newPageService
                    .findByBranchNameAndDefaultPageId(branchName, defaultPageId, pagePermission.getEditPermission())
                    .switchIfEmpty(Mono.error(
                            new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE, defaultPageId)))
                    .map(newPage -> {
                        Layout layout =
                                newPage.getUnpublishedPage().getLayouts().get(0);
                        if (!CollectionUtils.isEmpty(layout.getWidgetNames())
                                && layout.getWidgetNames().size() > 1) {
                            throw new AppsmithException(
                                    AppsmithError.INVALID_CRUD_PAGE_REQUEST, "please use empty layout");
                        }
                        return newPage;
                    });
        }

        return applicationService
                .findBranchedApplicationId(
                        branchName, defaultApplicationId, applicationPermission.getPageCreatePermission())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, defaultApplicationId)))
                .flatMapMany(childApplicationId -> newPageService.findByApplicationId(
                        childApplicationId, pagePermission.getEditPermission(), false))
                .collectList()
                .flatMap(pages -> {
                    // Avoid duplicating page names
                    String applicationId = pages.get(0).getApplicationId();
                    String pageName = WordUtils.capitalize(tableName);
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
                    DefaultResources defaultResources = new DefaultResources();
                    defaultResources.setBranchName(branchName);
                    defaultResources.setApplicationId(defaultApplicationId);
                    page.setDefaultResources(defaultResources);
                    return applicationPageService.createPage(page);
                })
                .flatMap(pageDTO -> newPageService.findById(pageDTO.getId(), pagePermission.getEditPermission()));
    }

    /**
     * @param datasourceStructure resource from which table has to be filtered
     * @param tableName           to filter the available tables in the datasource
     * @return Table from the provided datasource if structure is present
     */
    private Table getTable(DatasourceStructure datasourceStructure, String tableName) {
        /*
            1. Get structure from datasource
            2. Filter by tableName
        */
        if (datasourceStructure != null) {
            return datasourceStructure.getTables().stream()
                    .filter(table1 -> StringUtils.equals(table1.getName(), tableName))
                    .findAny()
                    .orElse(null);
        }
        return null;
    }

    /**
     * This will fetch the template application resource which then act as a reference to clone layouts and actions
     *
     * @param filePath template application path
     * @return template application file
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
                new DefaultResourceLoader().getResource(filePath).getInputStream(), Charset.defaultCharset());

        ApplicationJson applicationJson = gson.fromJson(jsonContent, ApplicationJson.class);
        return JsonSchemaMigration.migrateApplicationToLatestSchema(applicationJson);
    }

    /**
     * This function will clone actions from the template application and update action configuration using mapped
     * columns between the template datasource and datasource in context
     *
     * @param datasourceStorage  datasource storage connected by user
     * @param tableName          Table name provided by the user
     * @param pageId             Page to which actions needs to be cloned
     * @param templateActionList Actions from the template application related to specific datasource
     * @param mappedColumns      Mapped column names between template and resource table under consideration
     * @param deletedWidgetNames Deleted column ref when template application have more # of columns than the users table
     * @return cloned and updated actions from template application actions
     */
    private Flux<ActionDTO> cloneActionsFromTemplateApplication(
            DatasourceStorage datasourceStorage,
            String tableName,
            String pageId,
            List<NewAction> templateActionList,
            Map<String, String> mappedColumns,
            Set<String> deletedWidgetNames,
            Map<String, String> pluginSpecificTemplateParams,
            final String templateAutogeneratedKey) {
        /*
           1. Clone actions from the template pages
           2. Update actionConfiguration to replace the template table fields with users datasource fields
           stored in mapped columns
           3. Create new action
        */
        log.debug("Cloning actions from template application for pageId {}", pageId);
        return Flux.fromIterable(templateActionList).flatMap(templateAction -> {
            ActionDTO actionDTO = new ActionDTO();
            ActionConfiguration templateActionConfiguration =
                    templateAction.getUnpublishedAction().getActionConfiguration();
            actionDTO.setPluginId(datasourceStorage.getPluginId());
            actionDTO.setId(null);
            actionDTO.setDatasource(datasourceService.createDatasourceFromDatasourceStorage(datasourceStorage));
            actionDTO.setPageId(pageId);
            actionDTO.setName(templateAction.getUnpublishedAction().getName());
            actionDTO.setDefaultResources(templateAction.getDefaultResources());

            String actionBody = templateActionConfiguration.getBody();
            actionDTO.setActionConfiguration(templateActionConfiguration);
            ActionConfiguration actionConfiguration = actionDTO.getActionConfiguration();

            List<Property> pluginSpecifiedTemplates = actionConfiguration.getPluginSpecifiedTemplates();
            if (actionBody != null) {
                // If the primary key is autogenerated remove primaryKey's reference from InsertQuery
                final String temp = mappedColumns.get(templateAutogeneratedKey);
                if (!templateAutogeneratedKey.isEmpty() && INSERT_QUERY.equals(actionDTO.getName())) {
                    mappedColumns.put(templateAutogeneratedKey, DELETE_FIELD);
                }
                String body = actionBody.replaceFirst(TEMPLATE_TABLE_NAME, tableName);
                final Matcher matcher = WORD_PATTERN.matcher(body);
                actionConfiguration.setBody(matcher.replaceAll(
                        key -> mappedColumns.get(key.group()) == null ? key.group() : mappedColumns.get(key.group())));

                // Reassign the previous column mapping
                if (!templateAutogeneratedKey.isEmpty() && INSERT_QUERY.equals(actionDTO.getName())) {
                    mappedColumns.put(templateAutogeneratedKey, temp);
                }
            }

            log.debug("Cloning plugin specified templates for action ");
            if (!CollectionUtils.isEmpty(pluginSpecifiedTemplates)) {
                pluginSpecifiedTemplates.forEach(property -> {
                    if (property != null && property.getValue() instanceof String) {
                        if (Entity.S3_PLUGIN_PACKAGE_NAME.equals(templateAction.getPluginId())
                                && mappedColumns.containsKey(property.getValue().toString())) {
                            // Replace template S3 bucket with user's  bucket. Here we can't apply WORD_PATTERN
                            // matcher as the bucket name can be test.appsmith etc
                            property.setValue(
                                    mappedColumns.get(property.getValue().toString()));
                        } else if (property.getKey() != null
                                && !CollectionUtils.isEmpty(pluginSpecificTemplateParams)
                                && pluginSpecificTemplateParams.get(property.getKey()) != null) {
                            property.setValue(pluginSpecificTemplateParams.get(property.getKey()));
                        } else {
                            final Matcher matcher =
                                    WORD_PATTERN.matcher(property.getValue().toString());
                            property.setValue(matcher.replaceAll(key -> mappedColumns.get(key.group()) == null
                                    ? key.group()
                                    : mappedColumns.get(key.group())));
                        }
                    }
                });
            }

            log.debug("Cloning form data for action ");
            Map<String, Object> formData = actionConfiguration.getFormData();
            return pluginExecutorHelper
                    .getPluginExecutorFromPackageName(templateAction.getPluginId())
                    .map(pluginExecutor -> {
                        if (!CollectionUtils.isEmpty(formData)) {
                            pluginExecutor.updateCrudTemplateFormData(
                                    formData, mappedColumns, pluginSpecificTemplateParams);
                        }
                        actionDTO.setActionConfiguration(
                                deleteUnwantedWidgetReferenceInActions(actionConfiguration, deletedWidgetNames));
                        return actionDTO;
                    })
                    .flatMap(action -> layoutActionService.createSingleAction(action, Boolean.FALSE));
        });
    }

    /**
     * This function maps the column names between the template datasource table and the user's table
     *
     * @param sourceTable  provides keys for Map from column names
     * @param destTable    provides values for Map from column names
     * @param searchColumn specific column provided to implement the filter for Select and Find query
     * @param tableColumns Specific columns provided by higher order function to act as values for Map
     * @return
     */
    private Map<String, String> mapTableColumnNames(
            Table sourceTable,
            Table destTable,
            final String searchColumn,
            Set<String> tableColumns,
            StringBuffer templateAutogeneratedKey) {

        /*
           1. Fetch and map primary keys for source and destination columns if available
           2. Map remaining column names between the sourceTable(key) and destinationTable(value)
        */
        log.debug("Mapping column names with template application for table {}", destTable.getName());
        Map<String, String> mappedTableColumns = new HashMap<>();

        // Assign string type column as default search column. We are only supporting String matching for filter clause
        if (searchColumn != null && !searchColumn.isEmpty()) {
            mappedTableColumns.put(DEFAULT_SEARCH_COLUMN, searchColumn);
            sourceTable.getColumns().removeIf(column -> DEFAULT_SEARCH_COLUMN.equals(column.getName()));
            destTable.getColumns().removeIf(column -> searchColumn.equals(column.getName()));
        } else {
            final String tempSearchColumn = destTable.getColumns().stream()
                    .filter(column -> ALLOWED_TYPE_FOR_WHERE_CLAUSE.contains(
                            column.getType().replaceAll("[^A-Za-z]+", "").toLowerCase()))
                    .findAny()
                    .map(Column::getName)
                    .orElse(null);
            mappedTableColumns.put(DEFAULT_SEARCH_COLUMN, Objects.requireNonNullElse(tempSearchColumn, DELETE_FIELD));
        }
        mappedTableColumns.putAll(mapKeys(sourceTable, destTable, templateAutogeneratedKey));
        List<Column> sourceTableColumns = sourceTable.getColumns(), destTableColumns = destTable.getColumns();
        if (!CollectionUtils.isEmpty(tableColumns) && tableColumns.size() > MIN_TABLE_COLUMNS) {
            destTableColumns = destTableColumns.stream()
                    .filter(column -> tableColumns.contains(column.getName()))
                    .collect(Collectors.toList());
        }

        // Remove column names which are already mapped
        sourceTableColumns = sourceTableColumns.stream()
                .filter(key -> !mappedTableColumns.containsKey(key.getName()))
                .collect(Collectors.toList());

        destTableColumns = destTableColumns.stream()
                .filter(key -> !mappedTableColumns.containsValue(key.getName()))
                .collect(Collectors.toList());

        int idx = 0;
        while (idx < sourceTableColumns.size() && idx < destTableColumns.size()) {
            if (!mappedTableColumns.containsKey(sourceTableColumns.get(idx).getName())) {
                mappedTableColumns.put(
                        sourceTableColumns.get(idx).getName(),
                        destTableColumns.get(idx).getName());
            }
            idx++;
        }

        if (idx < sourceTableColumns.size()) {
            while (idx < sourceTableColumns.size()) {
                // This will act as a ref to delete the unwanted fields from actions and layout
                mappedTableColumns.put(sourceTableColumns.get(idx).getName(), DELETE_FIELD);
                idx++;
            }
        }
        return mappedTableColumns;
    }

    /**
     * This function maps the primary key names between the template datasource table and the user's table
     *
     * @param sourceTable Template table whose pKey will act as key for the MAP
     * @param destTable   Table from the users datasource whose keys will act as values for the MAP
     * @return Map of <sourceKeyColumnName, destinationKeyColumnName>
     */
    private Map<String, String> mapKeys(Table sourceTable, Table destTable, StringBuffer templateAutogeneratedKey) {

        /*
            1. Get pKey for source table and destination table
            2. Map column names from source pKey to destination pKey
        */
        Map<String, String> primaryKeyNameMap = new HashMap<>();
        // Map keys for SQL datasources
        if (DatasourceStructure.TableType.TABLE.equals(sourceTable.getType())) {
            final String sourceKey = "col1";
            DatasourceStructure.Key primaryKey = destTable.getKeys().stream()
                    .filter(key -> key instanceof PrimaryKey)
                    .findAny()
                    .orElse(null);

            if (primaryKey != null) {
                PrimaryKey key = (PrimaryKey) primaryKey;
                final String destKey = key.getColumnNames().get(0);
                primaryKeyNameMap.put(sourceKey, destKey);

                // In updated template we are using __primaryKey__ inside JsonForm to omit the field which will prevent
                // the
                // duplicate key exception
                primaryKeyNameMap.put(PRIMARY_KEY, destKey);

                // Check if the destKey is autogenerated, and save source column name which will be used to remove
                // reference
                // from InsertQuery otherwise InsertQuery will fail with error : Trying to insert autogenerated field
                templateAutogeneratedKey.append(destTable.getColumns().stream()
                        .filter(column -> column.getIsAutogenerated() != null
                                && column.getIsAutogenerated()
                                && destKey.equals(column.getName()))
                        .findAny()
                        .map(column -> sourceKey)
                        .orElse(""));
            }
        }
        // Map keys for NoSQL datasources like MongoDB
        else if (DatasourceStructure.TableType.COLLECTION.equals(sourceTable.getType())) {
            final String sourceKey = FieldName.MONGO_UNESCAPED_ID;
            List<Column> autogeneratedColumns = destTable.getColumns().stream()
                    // This makes sure only keys with instance of objectId will be considered as we don't have
                    // definitive
                    // structure like primaryKey in SQL for MongoDB. We can safely assume that these field will act as a
                    // unique key which will then be used for update query
                    .filter(column -> FieldName.OBJECT_ID.equals(column.getType()))
                    .collect(Collectors.toList());

            String destKey = autogeneratedColumns.stream()
                    .filter(column -> sourceKey.equals(column.getName()))
                    .findAny()
                    .map(Column::getName)
                    .orElse(null);

            // If column name "_id" is present in user's collection then map template datasource key "_id" with column
            // name ,
            // else map template datasource key "_id" to any autogenerated field from user's collection
            if (destKey != null) {
                primaryKeyNameMap.put(sourceKey, destKey);
            } else if (!CollectionUtils.isEmpty(autogeneratedColumns)) {
                destKey = autogeneratedColumns.get(0).getName();
                primaryKeyNameMap.put(sourceKey, destKey);
            }
            // In updated template we are using __primaryKey__ inside JsonForm to omit the field which will prevent the
            // duplicate key exception
            primaryKeyNameMap.put(PRIMARY_KEY, destKey);
        }
        return primaryKeyNameMap;
    }

    /**
     * This function updates the dsl of current node and recursively iterate over it's children
     *
     * @param dsl
     * @param mappedColumnsAndTableNames map to replace column names and update dsl
     * @param deletedWidgets             store the widgets those are deleted from the dsl
     * @return updated dsl for the widget
     */
    private JSONObject extractAndUpdateAllWidgetFromDSL(
            JSONObject dsl,
            Map<String, String> mappedColumnsAndTableNames,
            Set<String> deletedWidgets,
            final String templateAutogeneratedKey) {

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

        updateTemplateWidgets(dsl, mappedColumnsAndTableNames, templateAutogeneratedKey);

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
                    JSONObject child = extractAndUpdateAllWidgetFromDSL(
                            object, mappedColumnsAndTableNames, deletedWidgets, templateAutogeneratedKey);
                    String widgetType = child.getAsString(FieldName.WIDGET_TYPE);
                    if (FieldName.TABLE_WIDGET.equals(widgetType)
                            || FieldName.CONTAINER_WIDGET.equals(widgetType)
                            || FieldName.CANVAS_WIDGET.equals(widgetType)
                            || FieldName.FORM_WIDGET.equals(widgetType)
                            || FieldName.JSON_FORM_WIDGET.equals(widgetType)
                            || !child.toString().contains(DELETE_FIELD)) {
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
    private JSONObject updateTemplateWidgets(
            JSONObject widgetDsl, Map<String, String> mappedColumnsAndTableNames, String templateAutogeneratedKey) {

        /*
            1. Check the keys in widget dsl if needs to be changed
            2. Replace the template column names with the user connected datasource column names
            using mappedColumnsAndTableNames
        */
        List<String> keys =
                widgetDsl.keySet().stream().filter(WIDGET_FIELDS::contains).collect(Collectors.toList());

        // This field will be used to check the default dropdown value for SelectWidget and only required SelectWidget's
        // options will be updated
        String defaultDropdownValue =
                widgetDsl.containsKey(FieldName.DEFAULT_OPTION) ? widgetDsl.getAsString(FieldName.DEFAULT_OPTION) : "";

        // Handle special case for insert_modal for JSON form when auto-update is disabled for primary key. Don't
        // exclude
        // the primary key from JSON form. InsertQuery also needs to add primary key in such events
        final String temp = mappedColumnsAndTableNames.get(PRIMARY_KEY);
        if (StringUtils.isEmpty(templateAutogeneratedKey)
                && widgetDsl.getAsString(FieldName.WIDGET_NAME).equals(INSERT_FORM)) {
            mappedColumnsAndTableNames.remove(PRIMARY_KEY);
        }

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
                    && !(SQL_DEFAULT_DROPDOWN_VALUE.equalsIgnoreCase(defaultDropdownValue)
                            || MONGO_DEFAULT_DROPDOWN_VALUE.equals(defaultDropdownValue))) {

                if (FieldName.OPTIONS.equals(key)) {
                    // This will update the options field to include all the column names as label and value
                    // in SelectWidget except for SelectWidget with DefaultOptionValue SQL(DefaultValue : "ASC")
                    // and Mongo(DefaultValue : "1") check template application layout for more details
                    List<String> dropdownOptions = new ArrayList<>();
                    mappedColumnsAndTableNames.forEach((colKey, colVal) -> {
                        if (colKey.toLowerCase().contains("col") && !colVal.equals(DELETE_FIELD)) {
                            dropdownOptions.add("\n{\n\t\"label\": \"" + colVal.replaceAll("\\W+", "_")
                                    + "\",\n\t\"value\": \"" + colVal + "\"\n}");
                        }
                    });
                    widgetDsl.put(FieldName.OPTIONS, dropdownOptions.toString());
                } else if (FieldName.DEFAULT_OPTION.equals(key)) {
                    widgetDsl.put(key, mappedColumnsAndTableNames.get(widgetDsl.getAsString(key)));
                }
            } else {
                // Get separate words and map to tableColumns from widgetDsl
                Matcher matcher = WORD_PATTERN.matcher(widgetDsl.getAsString(key));
                widgetDsl.put(
                        key,
                        matcher.replaceAll(field ->
                                // Replace any special characters with "_" as all the special characters are replaced
                                // with "_" in
                                // table column widget
                                mappedColumnsAndTableNames.get(field.group()) == null
                                        ? field.group()
                                        : mappedColumnsAndTableNames
                                                .get(field.group())
                                                .replaceAll("\\W+", "_")));
            }
        }

        mappedColumnsAndTableNames.put(PRIMARY_KEY, temp);

        return widgetDsl;
    }

    /**
     * This will delete widget names from body when template datasource have more number of columns than the user
     * connected datasource. Also it will replace the template column names with the user connected datasource column names
     *
     * @param actionConfiguration resource which needs to be updated
     * @param deletedWidgetNames  widgets for which references to be removed from the actionConfiguration
     * @return updated ActionConfiguration with deleteWidgets ref removed
     */
    private ActionConfiguration deleteUnwantedWidgetReferenceInActions(
            ActionConfiguration actionConfiguration, Set<String> deletedWidgetNames) {

        /*
           1. Check for any delete widget reference within actionConfiguration
           2. Remove the fields related to delete widget from actionBody and pluginSpecifiedTemplates
           3. Return updated actionConfiguration
        */
        // We need to check this for insertQuery for SQL
        if (StringUtils.containsIgnoreCase(actionConfiguration.getBody(), "VALUES")) {

            // Get separate words and map to tableColumns from widgetDsl

            Matcher matcher = WORD_PATTERN.matcher(actionConfiguration.getBody());
            actionConfiguration.setBody(matcher.replaceAll(
                    field -> deletedWidgetNames.contains(field.group()) ? DELETE_FIELD : field.group()));
        }

        // When the connected datasource have less number of columns than template datasource, delete the unwanted
        // fields
        /*
        Example 1: SQL
            UPDATE PUBLIC.USER SET
                    NAME = '{{update_col_2.text}}',
                    delete = '{{update_col_4.text}}',
                    delete = '{{update_col_6.text}}',
                    NAME2 = '{{update_col_7.text}}',
                    delete = '{{update_col_8.text}}'
            WHERE AGE = {{Table1.selectedRow.AGE}};
            UPDATE PUBLIC.USER SET
                    NAME = '{{update_col_2.text}}',
                    NAME2 = '{{update_col_7.text}}'
            WHERE AGE = {{Table1.selectedRow.AGE}};
            Example 2:
            INSERT INTO tableName (
                col1,
                delete,
                col2,
                delete,
                delete,
                delete
            )
            VALUES (
                {{insert_col_input1.text}},
                {{insert_col_input3.text}},
                {{insert_col_input2.text}},
                {{insert_col_input4.text}},
                {{insert_col_input5.text}},
                {{insert_col_input6.text}}
            );
            INSERT INTO tableName (
                col1,
                col2
            )
            VALUES (
                {{insert_col_input1.text}},
                {{insert_col_input2.text}}
            );
            Example 3: (Postgres)
            UPDATE public."tableName" SET
                "col1" = '{{update_col_3.text}}',
                "delete" = '{{update_col_5.text}}'
                "col2" = '{{update_col_4.text}}',
                "delete" = '{{update_col_5.text}}'
              WHERE "id" = {{Table1.selectedRow.id}};
            UPDATE public."tableName" SET
                "col1" = '{{update_col_3.text}}',
                "col2" = '{{update_col_4.text}}'
              WHERE "id" = {{Table1.selectedRow.id}};
         */
        final String regex = "[\"\n{\t ].*" + DELETE_FIELD + ".*[,\n}]";
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

        if (actionConfiguration.getPluginSpecifiedTemplates() != null) {
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

        if (actionConfiguration.getFormData() != null) {
            removeUnwantedFieldRefFromFormData(actionConfiguration.getFormData(), regex);
        }

        return actionConfiguration;
    }

    /**
     * This method removes the unwanted fields like column names and widget names from formData.
     *
     * @param formData where updates required as per user db table
     * @param regex    to replace the unwanted field this will be useful when the connected datasource have less number of
     *                 columns than template datasource
     */
    private void removeUnwantedFieldRefFromFormData(Map<String, Object> formData, String regex) {
        for (Map.Entry<String, Object> property : formData.entrySet()) {
            if (property.getValue() != null) {
                if (property.getValue() instanceof String) {
                    property.setValue(property.getValue().toString().replaceAll(regex, ""));
                    // This will remove the unwanted comma after fields deletion if present at the end of body
                    // "field1\","field2\",\n\t\"field3" \n,{non-word-characters})\n
                    if (property.getValue().toString().matches("(?s).*,[\\W]*?}.*")) {
                        property.setValue(property.getValue().toString().replaceAll(",[\\W]*?}", "\n}"));
                    }
                }
                if (property.getValue() instanceof Map) {
                    removeUnwantedFieldRefFromFormData((Map<String, Object>) property.getValue(), regex);
                }
            }
        }
    }

    private void createSuccessMessageAndSetAsset(Plugin plugin, CRUDPageResponseDTO crudPage) {

        String displayWidget = Entity.S3_PLUGIN_PACKAGE_NAME.equals(plugin.getPackageName()) ? "List" : "Table";
        String updateWidget = Entity.S3_PLUGIN_PACKAGE_NAME.equals(plugin.getPackageName()) ? "Filepicker" : "Form";

        String successUrl = Entity.S3_PLUGIN_PACKAGE_NAME.equals(plugin.getPackageName())
                ? Assets.GENERATE_CRUD_PAGE_SUCCESS_URL_S3
                : Assets.GENERATE_CRUD_PAGE_SUCCESS_URL_TABULAR;
        crudPage.setSuccessImageUrl(successUrl);

        // Field used to send success message after the successful page creation
        String successMessage = "We have generated the <b>" + displayWidget + "</b> from the <b>" + plugin.getName()
                + " datasource</b>. You can use the <b>" + updateWidget + "</b> to modify it. Since all your "
                + "data is already connected you can add more queries and modify the bindings";

        crudPage.setSuccessMessage(successMessage);
    }

    private Mono<CRUDPageResponseDTO> sendGenerateCRUDPageAnalyticsEvent(
            CRUDPageResponseDTO crudPage, DatasourceStorage datasourceStorage, String pluginName) {
        PageDTO page = crudPage.getPage();
        return sessionUserService.getCurrentUser().flatMap(currentUser -> {
            try {
                final Map<String, Object> data = Map.of(
                        "applicationId", page.getApplicationId(),
                        "pageId", page.getId(),
                        "pageName", page.getName(),
                        "pluginName", pluginName,
                        "datasourceId", datasourceStorage.getDatasourceId(),
                        "organizationId", datasourceStorage.getWorkspaceId(),
                        "orgId", datasourceStorage.getWorkspaceId());
                return analyticsService
                        .sendEvent(AnalyticsEvents.GENERATE_CRUD_PAGE.getEventName(), currentUser.getUsername(), data)
                        .thenReturn(crudPage);
            } catch (Exception e) {
                log.warn("Error sending generate CRUD DB table page data point", e);
            }
            return Mono.just(crudPage);
        });
    }
}
