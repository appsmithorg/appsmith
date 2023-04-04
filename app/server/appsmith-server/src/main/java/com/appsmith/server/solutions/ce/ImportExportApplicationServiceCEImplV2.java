package com.appsmith.server.solutions.ce;

import static com.appsmith.server.constants.ResourceModes.VIEW;

import java.io.IOException;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.stream.Collectors;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import org.springframework.transaction.reactive.TransactionalOperator;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.views.Views;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ExportFileDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ImportExportHelper;
import com.appsmith.server.helpers.ImportExportUtils;
import com.appsmith.server.interfaces.PublishableResource;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.ApplicationSnapshotService;
import com.appsmith.server.services.CustomJSLibService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.SequenceService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.ThemeService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.ExamplesWorkspaceCloner;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.ser.std.StdSerializer;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Slf4j
@RequiredArgsConstructor
public class ImportExportApplicationServiceCEImplV2 implements ImportExportApplicationServiceCE {

    private final DatasourceService datasourceService;
    private final SessionUserService sessionUserService;
    private final NewActionRepository newActionRepository;
    private final DatasourceRepository datasourceRepository;
    private final PluginRepository pluginRepository;
    private final WorkspaceService workspaceService;
    private final ApplicationService applicationService;
    private final NewPageService newPageService;
    private final ApplicationPageService applicationPageService;
    private final NewPageRepository newPageRepository;
    private final NewActionService newActionService;
    private final SequenceService sequenceService;
    private final ExamplesWorkspaceCloner examplesWorkspaceCloner;
    private final ActionCollectionRepository actionCollectionRepository;
    private final ActionCollectionService actionCollectionService;
    private final ThemeService themeService;
    private final AnalyticsService analyticsService;
    private final CustomJSLibService customJSLibService;
    private final DatasourcePermission datasourcePermission;
    private final WorkspacePermission workspacePermission;
    private final ApplicationPermission applicationPermission;
    private final PagePermission pagePermission;
    private final ActionPermission actionPermission;
    private final Gson gson;
    private final TransactionalOperator transactionalOperator;
    private final ApplicationSnapshotService applicationSnapshotService;
    private final ImportExportHelper importExportHelper;

    private static final Set<MediaType> ALLOWED_CONTENT_TYPES = Set.of(MediaType.APPLICATION_JSON);
    private static final String INVALID_JSON_FILE = "invalid json file";

    /**
     * This function processed Theme object for export
     * @param theme theme object
     * @return Mono of Theme
     */
    public Mono<Theme> processThemeForExport(Theme theme) {
        if(theme.isSystemTheme()) {
            // for system theme, we only need theme name and isSystemTheme properties so set null to others
            theme.setProperties(null);
            theme.setConfig(null);
            theme.setStylesheet(null);
        }
        return Mono.just(theme);
    }

    /**
     * This function processed action collection object for export
     * @param actionCollection action collection object
     * @return Mono of ActionCollection
     */
    public Mono<ActionCollection> processActionCollectionForExport(ActionCollection actionCollection) {
        return Mono.just(actionCollection);
    }

    /**
     * This function process datasource object for export
     */
    public Mono<Datasource> processDatasourceForExport(Datasource datasource) {
        return Mono.just(datasource);
    }

    /**
     * This function processed action object for export
     * @param action action object
     * @return Mono of NewAction
     */
    public Mono<NewAction> processActionForExport(NewAction action) {
        return Mono.just(action);
    }

    /**
     * This function processed page object for export
     * @param page page object
     * @return Mono of NewPage
     */
    public Mono<NewPage> processPageForExport(NewPage page, ResourceModes resourceMode) {
        return Mono.just(page);
    }

    /**
     * This function processed application object for export
     * @param application application object
     * @return Mono of Application
     */
    public Mono<Application> processApplicationForExport(Application application) {
        return Mono.just(application);
    }

    /**
     * This function fixes the references for export
     * @param pages list of pages
     * @param actionCollections list of action collections
     * @param actions list of actions
     * @param plugins list of plugins
     * @param datasources list of datasources
     */
    public void fixReferencesForExport(Application application, List<NewPage> pages, List<ActionCollection> actionCollections, List<NewAction> actions, List<Plugin> plugins, List<Datasource> datasources, ResourceModes resourceMode) {
        // Calculate pageId to name map
        Map<String, String> pageIdToNameMap = ImportExportUtils.calculatePageIdToNameMap(pages.stream().collect(Collectors.toList()), resourceMode);
        // Calculate pluginId to name map
        Map<String, String> pluginIdToNameMap = ImportExportUtils.calculatePluginIdToNameMap(plugins);
        // Calculate collectionId to name map
        Map<String, String> actionCollectionIdToNameMap = ImportExportUtils.calculateActionCollectionIdToNameMap(actionCollections, resourceMode);
        // Calculate datasourceId to name map
        Map<String, String> datasourceIdToNameMap = ImportExportUtils.calculateDatasourceIdToNameMap(datasources);

        // Fix references for action collections
        actionCollections.stream()
                .forEach(actionCollection -> {
                    ActionCollectionDTO actionCollectionDTO = actionCollection.select(resourceMode);
                    actionCollectionDTO.setPageId(pageIdToNameMap.get(actionCollectionDTO.getPageId()));
                    actionCollectionDTO.setPluginId(pluginIdToNameMap.get(actionCollectionDTO.getPluginId()));
                });
        
        // Fix references for actions
        actions.stream()
                .forEach(action -> {
                    ActionDTO actionDTO = action.select(resourceMode);
                    actionDTO.setPageId(pageIdToNameMap.get(actionDTO.getPageId()));
                    if (!StringUtils.isEmpty(actionDTO.getCollectionId())
                            && actionCollectionIdToNameMap.containsKey(actionDTO.getCollectionId())) {
                                actionDTO.setCollectionId(actionCollectionIdToNameMap.get(actionDTO.getCollectionId()));
                    }
                    Datasource ds = actionDTO.getDatasource();
                    if(ds != null) {
                        if(ds.getId() != null) {
                            ds.setId(datasourceIdToNameMap.get(ds.getId()));
                        }
                        if (ds.getPluginId() != null) {
                            ds.setPluginId(pluginIdToNameMap.get(ds.getPluginId()));
                        }
                    }
                });

        application.getPages()
                .forEach(page -> {
                    page.setId(pageIdToNameMap.get(page.getId()));
                });

        pages.forEach(page -> {
            PageDTO pageDTO = page.select(resourceMode);
            if (!CollectionUtils.isEmpty(pageDTO.getLayouts())) {
                pageDTO.getLayouts().forEach(layout -> {
                    layout.setId(pageDTO.getName());
                });
            }
        });
    }

    boolean shouldIncludeResourceForExport(PublishableResource resource, ResourceModes resourceMode) {
        return !ImportExportUtils.isResourceDeleted(resource.select(resourceMode));
    }

    /**
     * This function will give the application resource to rebuild the application in import application flow
     *
     * @param applicationId which needs to be exported
     * @return application reference from which entire application can be rehydrated
     */
    public Mono<ApplicationJson> exportApplicationById(String applicationId, SerialiseApplicationObjective serialiseFor, ResourceModes resourceMode) {

        // Start the stopwatch to log the execution time
        // Stopwatch stopwatch = new Stopwatch(AnalyticsEvents.EXPORT.getEventName());
        /*
            1. Fetch application by id
            2. Fetch pages from the application
            3. Fetch datasources from workspace
            4. Fetch actions from the application
            5. Filter out relevant datasources using actions reference
            6. Fetch action collections from the application
         */

        if (applicationId == null || applicationId.isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID));
        }

        Mono<User> currentUserMono = sessionUserService.getCurrentUser().cache();

        Mono<Application> applicationMono = importExportHelper.fetchApplication(applicationId, serialiseFor, false)
                .flatMap(this::processApplicationForExport)
                .cache();

        /**
         * Since we are exporting for git, we only consider unpublished JS libraries
         * Ref: https://theappsmith.slack.com/archives/CGBPVEJ5C/p1672225134025919
         */
        Flux<CustomJSLib> allCustomJSLibListFlux = applicationMono
                .flatMapMany(application -> importExportHelper.getAllCustomJSLibsForApplication(application))
                .cache();

        Mono<Theme> editModeThemeMono = applicationMono
                .flatMap(application -> importExportHelper.getApplicationEditModeThemeOrDefault(application))
                .flatMap(this::processThemeForExport);

        Mono<Theme> publishedThemeMono = applicationMono
                .flatMap(application -> importExportHelper.getAplicationPublishedThemeOrDefault(application))
                .flatMap(this::processThemeForExport);

        Flux<NewPage> pagesFlux = applicationMono
                .flatMapMany(application -> importExportHelper.fetchPagesForApplication(application, serialiseFor, false))
                // Filter out pages which are deleted or does not exist
                .filter(page -> shouldIncludeResourceForExport(page, resourceMode))
                .cache();

        Flux<ActionCollection> actionCollectionFlux = applicationMono
                .flatMapMany(application -> importExportHelper.fetchCollectionsForApplication(application, serialiseFor, false))
                // Filter out action collections which are deleted or does not exist
                .filter(collection -> shouldIncludeResourceForExport(collection, resourceMode))
                .flatMap(this::processActionCollectionForExport)
                .cache();

        Flux<NewAction> actionFlux = applicationMono
                .flatMapMany(application -> importExportHelper.fetchActionsForApplication(application, serialiseFor, false))
                // Filter out actions which are deleted or does not exist
                .filter(action -> shouldIncludeResourceForExport(action, resourceMode))
                .flatMap(this::processActionForExport)
                .cache();
        
        Flux<Plugin> pluginFlux = pluginRepository.findAll();

        Flux<Datasource> datasourceFlux = applicationMono
                .flatMapMany(application -> importExportHelper.fetchDatasourcesForWorkspace(application.getWorkspaceId(), serialiseFor, false))
                .flatMap(this::processDatasourceForExport)
                .cache();

        return Mono.zip(
                allCustomJSLibListFlux.collectList(),
                pluginFlux.collectList(),
                editModeThemeMono,
                publishedThemeMono,
                applicationMono,
                pagesFlux.collectList(),
                actionCollectionFlux.collectList(),
                Mono.zip(
                        actionFlux.collectList(),
                        datasourceFlux.collectList())
                )
                .map(tuple -> {
                    List<CustomJSLib> allCustomJSLibs = tuple.getT1();
                    List<Plugin> plugins = tuple.getT2();
                    Theme editModeTheme = tuple.getT3();
                    Theme publishedTheme = tuple.getT4();
                    Application application = tuple.getT5();
                    List<NewPage> pages = tuple.getT6();
                    List<ActionCollection> actionCollections = tuple.getT7();
                    List<NewAction> actions = tuple.getT8().getT1();
                    List<Datasource> datasources = tuple.getT8().getT2();

                    Map<String, Set<String>> updatedResources = new HashMap<>();
                    
                    ApplicationJson applicationJson = new ApplicationJson();

                    // Set json schema version which will be used to check the compatibility while importing the JSON
                    applicationJson.setServerSchemaVersion(JsonSchemaVersions.serverVersion);
                    applicationJson.setClientSchemaVersion(JsonSchemaVersions.clientVersion);

                    // Populate custom JS libs
                    applicationJson.setCustomJSLibList(allCustomJSLibs);
                    updatedResources.put(FieldName.CUSTOM_JS_LIB_LIST, ImportExportUtils.getUpdatedCustomJSLibsForApplication(application, allCustomJSLibs));

                    // Populate themes
                    applicationJson.setEditModeTheme(editModeTheme);
                    applicationJson.setPublishedTheme(publishedTheme);

                    // Populate application
                    applicationJson.setExportedApplication(application);

                    // Populate pages
                    applicationJson.setPageList(pages);
                    updatedResources.put(FieldName.PAGE_LIST, ImportExportUtils.getUpdatedPagesForApplication(application, pages, resourceMode));

                    // Populate action collections
                    applicationJson.setActionCollectionList(actionCollections);
                    updatedResources.put(FieldName.ACTION_COLLECTION_LIST, ImportExportUtils.getUpdatedActionCollectionsForApplication(application, actionCollections, resourceMode));

                    // Populate actions
                    applicationJson.setActionList(actions);
                    updatedResources.put(FieldName.ACTION_LIST, ImportExportUtils.getUpdatedActionsForApplication(application, actions, resourceMode));

                    // Fix references
                    fixReferencesForExport(application, pages, actionCollections, actions, plugins, datasources, resourceMode);

                    applicationJson.setUpdatedResources(updatedResources);

                    return applicationJson;
                });
    }

    public Mono<ApplicationJson> exportApplicationById(String applicationId, String branchName) {
        return applicationService.findBranchedApplicationId(branchName, applicationId, applicationPermission.getExportPermission())
                .flatMap(branchedAppId -> exportApplicationById(branchedAppId, SerialiseApplicationObjective.SHARE));
    }

    // private void updateIdsForLayoutOnLoadAction(PageDTO page,
    //                                             Map<String, String> actionIdToNameMap,
    //                                             Map<String, String> collectionIdToNameMap) {

    //     if (page != null && !CollectionUtils.isEmpty(page.getLayouts())) {
    //         for (Layout layout : page.getLayouts()) {
    //             if (!CollectionUtils.isEmpty(layout.getLayoutOnLoadActions())) {
    //                 layout.getLayoutOnLoadActions().forEach(onLoadAction -> onLoadAction
    //                         .forEach(actionDTO -> {
    //                             if (actionIdToNameMap.containsKey(actionDTO.getId())) {
    //                                 actionDTO.setId(actionIdToNameMap.get(actionDTO.getId()));
    //                             }
    //                             if (collectionIdToNameMap.containsKey(actionDTO.getCollectionId())) {
    //                                 actionDTO.setCollectionId(collectionIdToNameMap.get(actionDTO.getCollectionId()));
    //                             }
    //                         })
    //                 );
    //             }
    //         }
    //     }
    // }

    public static class JSONObjectSerializer extends StdSerializer<JSONObject> {

        public JSONObjectSerializer() {
            this(null);
        }
      
        public JSONObjectSerializer(Class<JSONObject> t) {
            super(t);
        }

        @Override
        public void serialize(JSONObject value, JsonGenerator generator, SerializerProvider provider) throws IOException {
            generator.writeStartObject();
            for (Object key : value.keySet()) {
                log.debug("key: {}, value: {}", key, value.get(key));
                generator.writeObjectField((String) key,  value.get(key));
            }
            generator.writeEndObject();
        }
    }

    public static class JSONObjectDeserializer extends JsonDeserializer<JSONObject> {

        @Override
        public JSONObject deserialize(JsonParser parser, DeserializationContext context) throws IOException {
            JSONObject jsonObject = new JSONObject();
            JsonNode node = parser.getCodec().readTree(parser);
            Iterator<Entry<String, JsonNode>> fields = node.fields();
            while (fields.hasNext()) {
                Entry<String, JsonNode> field = fields.next();
                String key = field.getKey();
                JsonNode value = field.getValue();
                if (value.isObject()) {
                    jsonObject.put(key, deserialize(parser, context));
                } else if (value.isArray()) {
                    JSONArray jsonArray = new JSONArray();
                    for (JsonNode jsonNode : (ArrayNode) value) {
                        if (jsonNode.isObject()) {
                            jsonArray.add(deserialize(parser, context));
                        } else {
                            jsonArray.add(jsonNode.asText());
                        }
                    }
                    jsonObject.put(key, jsonArray);
                } else {
                    jsonObject.put(key, value.asText());
                }
            }
            return jsonObject;
        }
    }
    
    public Mono<ExportFileDTO> getApplicationFile(String applicationId, String branchName) {
        return this.exportApplicationById(applicationId, branchName)
                .map(applicationJson -> {
                    ObjectMapper mapper = new ObjectMapper();
                    mapper.setSerializationInclusion(Include.NON_NULL);
                    SimpleModule module = new SimpleModule();
                    module.addSerializer(JSONObject.class, new JSONObjectSerializer());
                    module.addDeserializer(JSONObject.class, new JSONObjectDeserializer());
                    mapper.registerModule(module);
                    String stringifiedFile = "";
                    try {
                        stringifiedFile = mapper.writerWithView(Views.ExportUnpublished.class).writeValueAsString(applicationJson);
                    } catch (JsonProcessingException e) {
                        // TODO Auto-generated catch block
                        e.printStackTrace();
                    }
                    String applicationName = applicationJson.getExportedApplication().getName();
                    
                    HttpHeaders responseHeaders = new HttpHeaders();
                    ContentDisposition contentDisposition = ContentDisposition
                            .builder("attachment")
                            .filename(applicationName + ".json", StandardCharsets.UTF_8)
                            .build();
                    responseHeaders.setContentDisposition(contentDisposition);
                    responseHeaders.setContentType(MediaType.APPLICATION_JSON);

                    ExportFileDTO exportFileDTO = new ExportFileDTO();
                    exportFileDTO.setApplicationResource(stringifiedFile);
                    exportFileDTO.setHttpHeaders(responseHeaders);
                    return exportFileDTO;
                });
    }

    /**
     * This function will take the Json filepart and saves the application in workspace
     *
     * @param workspaceId workspace to which the application needs to be hydrated
     * @param filePart    Json file which contains the entire application object
     * @return saved application in DB
     */
    public Mono<ApplicationImportDTO> extractFileAndSaveApplication(String workspaceId, Part filePart) {

        /*
            1. Check the validity of file part
            2. Save application to workspace
         */

        final MediaType contentType = filePart.headers().getContentType();

        if (workspaceId == null || workspaceId.isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            log.error("Invalid content type, {}", contentType);
            return Mono.error(new AppsmithException(AppsmithError.VALIDATION_FAILURE, INVALID_JSON_FILE));
        }

        Mono<String> stringifiedFile = DataBufferUtils.join(filePart.content())
                .map(dataBuffer -> {
                    byte[] data = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(data);
                    DataBufferUtils.release(dataBuffer);
                    return new String(data);
                });

        Mono<ApplicationImportDTO> importedApplicationMono = stringifiedFile
                .flatMap(data -> {
                    /*
                    // Use JsonObject to migrate when we remove some field from the collection which is being exported
                    JsonObject json = gson.fromJson(data, JsonObject.class);
                    JsonObject update = new JsonObject();
                    update.addProperty("slug", "update_name");
                    update.addProperty("name", "update name");
                    ((JsonObject) json.get("exportedApplication")).add("name", update);
                    json.get("random") == null => true
                    ((JsonArray) json.get("pageList"))
                    */

                    Type fileType = new TypeToken<ApplicationJson>() {
                    }.getType();
                    ApplicationJson jsonFile = gson.fromJson(data, fileType);
                    return importApplicationInWorkspace(workspaceId, jsonFile)
                            .onErrorResume(error -> {
                                if (error instanceof AppsmithException) {
                                    return Mono.error(error);
                                }
                                return Mono.error(new AppsmithException(AppsmithError.GENERIC_JSON_IMPORT_ERROR, workspaceId, error.getMessage()));
                            });
                })
                // Add un-configured datasource to the list to response
                .flatMap(application -> getApplicationImportDTO(application.getId(), application.getWorkspaceId(), application));

        return Mono.create(sink -> importedApplicationMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
    }

    @Override
    public Mono<Application> mergeApplicationJsonWithApplication(String organizationId, String applicationId,
            String branchName, ApplicationJson applicationJson, List<String> pagesToImport) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'mergeApplicationJsonWithApplication'");
    }

    @Override
    public Mono<Application> importApplicationInWorkspace(String workspaceId, ApplicationJson importedDoc) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'importApplicationInWorkspace'");
    }

    @Override
    public Mono<Application> importApplicationInWorkspace(String workspaceId, ApplicationJson importedDoc,
            String applicationId, String branchName) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'importApplicationInWorkspace'");
    }

    @Override
    public Mono<List<Datasource>> findDatasourceByApplicationId(String applicationId, String orgId) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'findDatasourceByApplicationId'");
    }

    @Override
    public Mono<ApplicationImportDTO> getApplicationImportDTO(String applicationId, String workspaceId,
            Application application) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getApplicationImportDTO'");
    }

    public Mono<Application> importApplicationInWorkspace(String workspaceId, String applicationId, ApplicationJson applicationJson, SerialiseApplicationObjective serialiseFor) {
        
        // TODO migration and data validation

        //Following data has to be imported
        Application applicationToImport = applicationJson.getExportedApplication();
        List<Datasource> datasourcesToImport = applicationJson.getDatasourceList();
        List<NewPage> pagesToImport = applicationJson.getPageList();
        List<NewAction> actionsToImport = applicationJson.getActionList();
        List<ActionCollection> actionCollectionsToImport = applicationJson.getActionCollectionList();
        List<CustomJSLib> customJSLibsToImport = applicationJson.getCustomJSLibList();

        // fetch the workspace
        Mono<Workspace> workspaceMono = importExportHelper.fetchWorkspace(workspaceId);

        // fetch the current user
        Mono<User> currentUserMono = sessionUserService.getCurrentUser().cache();

        // fetch the application from DB if present or create one
        Mono<Application> applicationMono = importExportHelper.fetchOrCreateApplicationForImport(applicationId, applicationToImport)
                .cache();

        // fetch datasources from DB
        Flux<Datasource> datasourceFlux = importExportHelper.fetchDatasourcesForWorkspace(workspaceId, serialiseFor, true)
                .cache();

        // fetch pages from DB
        Flux<NewPage> pageFlux = applicationMono
                .flatMapMany(application -> importExportHelper.fetchPagesForApplication(application, serialiseFor, true))
                .cache();

        // fetch plugins from DB
        Flux<Plugin> pluginFlux = pluginRepository.findAll();

        Mono.zip(pluginFlux.collectList(), workspaceMono)
                .flatMap(tuple -> {
                    List<Plugin> plugins = tuple.getT1();
                    Workspace workspace = tuple.getT2();

                    List<ApplicationPage> applicationPagesToImport = applicationToImport.getPages();
                    applicationToImport.setPublishedPages(List.of()); //TODO not sure why it was set to null, changed it to empty list


                    return Mono.empty();
                });
    }
   
    public Mono<?> importPages(Application) {
        return Mono.empty();
    }