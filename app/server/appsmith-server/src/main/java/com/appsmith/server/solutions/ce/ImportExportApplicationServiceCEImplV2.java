package com.appsmith.server.solutions.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.BasicAuth;
import com.appsmith.external.models.BearerTokenAuth;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DecryptedSensitiveFields;
import com.appsmith.external.models.OAuth2;
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
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuples;

import java.io.IOException;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;
import static java.lang.Boolean.TRUE;

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
     * @return Theme object
     */
    public Theme processThemeForExport(Theme theme) {
        if(theme.isSystemTheme()) {
            // for system theme, we only need theme name and isSystemTheme properties so set null to others
            theme.setProperties(null);
            theme.setConfig(null);
            theme.setStylesheet(null);
        }
        return theme;
    }

    /**
     * This function fixes the references for export
     * @param pages list of pages
     * @param collections list of action collections
     * @param actions list of actions
     * @param plugins list of plugins
     * @param datasources list of datasources
     */
    public void fixReferencesForExport(Application application, List<NewPage> pages, List<ActionCollection> collections, List<NewAction> actions, List<Plugin> plugins, List<Datasource> datasources, ResourceModes resourceMode) {
        // Calculate pageId to name map
        Map<String, PageDTO> pageIdToPageDTOMap = ImportExportUtils.computePageIdToPageDTOMap(pages.stream().collect(Collectors.toList()), resourceMode);
        // Calculate pluginId to name map
        Map<String, Plugin> pluginIdToPluginMap = ImportExportUtils.computePluginIdToPluginMap(plugins);
        // Calculate collectionId to name map
        Map<String, ActionCollectionDTO> collectionIdToCollectionDTOMap = ImportExportUtils.computeCollectionIdToCollectionDTOMap(collections, resourceMode);
        // Calculate datasourceId to name map
        Map<String, Datasource> datasourceIdToDatasourceMap = ImportExportUtils.computeDatasourceIdToDatasourceMap(datasources);
        // Calculate actionId to name map
        Map<String, ActionDTO> actionIdToActionMap = ImportExportUtils.computeActionIdToActionDTOMap(actions, resourceMode);

        // Fix references for action collections
        collections.stream()
                .forEach(collection -> {
                    ActionCollectionDTO collectionDTO = collection.select(resourceMode);
                    collectionDTO.setPageId(pageIdToPageDTOMap.get(collectionDTO.getPageId()).getName());
                    collectionDTO.setPluginId(ImportExportUtils.getPluginReference(pluginIdToPluginMap.get(collectionDTO.getPluginId())));
                });

        // Fix references for actions
        actions.stream()
                .forEach(action -> {
                    ActionDTO actionDTO = action.select(resourceMode);
                    actionDTO.setPageId(pageIdToPageDTOMap.get(actionDTO.getPageId()).getName());
                    if (!StringUtils.isEmpty(actionDTO.getCollectionId())
                            && collectionIdToCollectionDTOMap.containsKey(actionDTO.getCollectionId())) {
                                actionDTO.setCollectionId(collectionIdToCollectionDTOMap.get(actionDTO.getCollectionId()).getName());
                    }
                    Datasource ds = actionDTO.getDatasource();
                    if(ds != null) {
                        if(ds.getId() != null) {
                            ds.setId(datasourceIdToDatasourceMap.get(ds.getId()).getName());
                        }
                        if (ds.getPluginId() != null) {
                            ds.setPluginId(pluginIdToPluginMap.get(ds.getPluginId()).getName());
                        }
                    }
                    action.setPluginId(pluginIdToPluginMap.get(action.getPluginId()).getName());
                    action.setId(actionDTO.getName());
                });

        application.getPages()
                .forEach(page -> {
                    page.setId(pageIdToPageDTOMap.get(page.getId()).getName());
                });

        pages.forEach(page -> {
            PageDTO pageDTO = page.select(resourceMode);
            if (!CollectionUtils.isEmpty(pageDTO.getLayouts())) {
                pageDTO.getLayouts().forEach(layout -> {
                    layout.setId(pageDTO.getName());
                    if(!CollectionUtils.isEmpty(layout.getLayoutOnLoadActions())) {
                        layout.getLayoutOnLoadActions().forEach(onLoadAction -> onLoadAction
                            .forEach(actionDTO -> {
                                if (actionIdToActionMap.containsKey(actionDTO.getId())) {
                                    actionDTO.setId(actionIdToActionMap.get(actionDTO.getId()).getName());
                                }
                                if (collectionIdToCollectionDTOMap.containsKey(actionDTO.getCollectionId())) {
                                    actionDTO.setCollectionId(collectionIdToCollectionDTOMap.get(actionDTO.getCollectionId()).getName());
                                }
                            })
                        );
                    }
                });
            }
        });

        datasources.forEach(datasource -> {
            datasource.setPluginId(ImportExportUtils.getPluginReference(pluginIdToPluginMap.get(datasource.getPluginId())));
        });
    }

    /**
     * This will be used to dehydrate sensitive fields from the datasource while exporting the application
     *
     * @param datasource entity from which sensitive fields need to be dehydrated
     * @return sensitive fields which then will be deserialized and exported in JSON file
     */
    private DecryptedSensitiveFields getDecryptedFields(Datasource datasource) {

        if(datasource.getDatasourceConfiguration() != null || datasource.getDatasourceConfiguration().getAuthentication() == null) {
            return null;
        }

        AuthenticationDTO authentication = datasource.getDatasourceConfiguration().getAuthentication();

        DecryptedSensitiveFields dsDecryptedFields = null;

        if(authentication.getAuthenticationResponse() != null && authentication.getAuthenticationResponse() != null) {
            dsDecryptedFields = new DecryptedSensitiveFields(authentication.getAuthenticationResponse());
        } else {

            dsDecryptedFields = new DecryptedSensitiveFields();
        }

        if (authentication instanceof DBAuth auth) {
            dsDecryptedFields.setPassword(auth.getPassword());
            dsDecryptedFields.setDbAuth(auth);

        } else if (authentication instanceof OAuth2 auth) {
            dsDecryptedFields.setPassword(auth.getClientSecret());
            dsDecryptedFields.setOpenAuth2(auth);

        } else if (authentication instanceof BasicAuth auth) {
            dsDecryptedFields.setPassword(auth.getPassword());
            dsDecryptedFields.setBasicAuth(auth);

        } else if (authentication instanceof BearerTokenAuth auth) {
            dsDecryptedFields.setBearerTokenAuth(auth);
        }

        dsDecryptedFields.setAuthType(authentication.getClass().getName());
        return dsDecryptedFields;
    }

    List<Datasource> processDatasourceConfigurationForExport(ApplicationJson applicationJson, Application application, List<Datasource> datasources, SerialiseApplicationObjective serialiseFor) {
        if (TRUE.equals(application.getExportWithConfiguration()) && SerialiseApplicationObjective.SHARE.equals(serialiseFor)) {
            // Save decrypted fields for datasources
            Map<String, DecryptedSensitiveFields> decryptedFields = new HashMap<>();
            datasources.forEach(datasource -> {
                decryptedFields.put(datasource.getName(), getDecryptedFields(datasource));
            });
            applicationJson.setDecryptedFields(decryptedFields);
            return datasources;
        }
        return datasources.stream()
                // Remove the datasourceConfiguration object as user will configure it once imported to other instance
                .peek(datasource -> datasource.setDatasourceConfiguration(null))
                .collect(Collectors.toList());
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
        Stopwatch stopwatch = new Stopwatch(AnalyticsEvents.EXPORT.getEventName());

        if (applicationId == null || applicationId.isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID));
        }

        Mono<User> currentUserMono = sessionUserService.getCurrentUser().cache();

        Mono<ApplicationAndPagesDTO> applicationMono = importExportHelper.fetchApplication(applicationId, true, serialiseFor)
                .map(application -> {
                    List<String> unPublishedPages = application.getPages().stream().map(ApplicationPage::getId)
                            .collect(Collectors.toList());
                    return new ApplicationAndPagesDTO(application, unPublishedPages);
                })
                .cache();

        /**
         * Since we are exporting for git, we only consider unpublished JS libraries
         * Ref: https://theappsmith.slack.com/archives/CGBPVEJ5C/p1672225134025919
         */
        Flux<CustomJSLib> allCustomJSLibListFlux = applicationMono
                .flatMapMany(applicationAndPagesDTO -> importExportHelper.getAllCustomJSLibsForApplication(applicationAndPagesDTO.getApplication().getId()))
                .cache();

        Mono<Theme> editModeThemeMono = applicationMono
                .flatMap(applicationAndPagesDTO -> importExportHelper.getApplicationEditModeThemeOrDefault(applicationAndPagesDTO.getApplication()));

        Mono<Theme> publishedThemeMono = applicationMono
                .flatMap(applicationAndPagesDTO -> importExportHelper.getAplicationPublishedThemeOrDefault(applicationAndPagesDTO.getApplication()));

        Flux<NewPage> pagesFlux = applicationMono
                .flatMapMany(applicationAndPagesDTO -> importExportHelper.fetchPagesForApplication(applicationAndPagesDTO.getPageIds(), true,serialiseFor))
                // Filter out pages which are deleted or does not exist
                .filter(page -> shouldIncludeResourceForExport(page, resourceMode))
                .cache();

        Flux<ActionCollection> collectionFlux = applicationMono
                .flatMapMany(applicationAndPagesDTO -> importExportHelper.fetchCollectionsForApplication(applicationAndPagesDTO.getPageIds(), true, serialiseFor))
                // Filter out action collections which are deleted or does not exist
                .filter(collection -> shouldIncludeResourceForExport(collection, resourceMode))
                .cache();

        Flux<NewAction> actionFlux = applicationMono
                .flatMapMany(applicationAndPagesDTO -> importExportHelper.fetchActionsForApplication(applicationAndPagesDTO.getPageIds(), true, serialiseFor))
                // Filter out actions which are deleted or does not exist
                .filter(action -> shouldIncludeResourceForExport(action, resourceMode))
                .cache();

        Flux<Plugin> pluginFlux = pluginRepository.findAll();

        Flux<Datasource> datasourceFlux = applicationMono
                .flatMapMany(applicationAndPagesDTO -> importExportHelper.fetchDatasourcesForWorkspace(applicationAndPagesDTO.getApplication().getWorkspaceId(), true, serialiseFor))
                .cache();

        return Mono.zip(
                allCustomJSLibListFlux.collectList(),
                pluginFlux.collectList(),
                editModeThemeMono,
                publishedThemeMono,
                applicationMono,
                pagesFlux.collectList(),
                collectionFlux.collectList(),
                Mono.zip(
                        actionFlux.collectList(),
                        datasourceFlux.collectList(),
                        currentUserMono)
                )
                .map(tuple -> {
                    // Unwrap all the values from the tuple
                    List<CustomJSLib> allCustomJSLibs = tuple.getT1();
                    List<Plugin> plugins = tuple.getT2();
                    Theme editModeTheme = tuple.getT3();
                    Theme publishedTheme = tuple.getT4();
                    Application application = tuple.getT5().getApplication();
                    List<NewPage> pages = tuple.getT6();
                    List<ActionCollection> collections = tuple.getT7();
                    List<NewAction> actions = tuple.getT8().getT1();
                    List<Datasource> datasources = tuple.getT8().getT2();
                    User currentUser = tuple.getT8().getT3();

                    // Map to store the set of updated resource ids
                    Map<String, Set<String>> updatedResources = new HashMap<>();

                    ApplicationJson applicationJson = new ApplicationJson();

                    // Set json schema version which will be used to check the compatibility while importing the JSON
                    applicationJson.setServerSchemaVersion(JsonSchemaVersions.serverVersion);
                    applicationJson.setClientSchemaVersion(JsonSchemaVersions.clientVersion);

                    // Populate custom JS libs with set of updated ids
                    applicationJson.setCustomJSLibList(allCustomJSLibs);
                    updatedResources.put(FieldName.CUSTOM_JS_LIB_LIST, ImportExportUtils.getUpdatedCustomJSLibsForApplication(application, allCustomJSLibs));

                    // Populate edit mode and published mode theme
                    processThemeForExport(editModeTheme);
                    processThemeForExport(publishedTheme);
                    applicationJson.setEditModeTheme(editModeTheme);
                    applicationJson.setPublishedTheme(publishedTheme);

                    // Populate application
                    applicationJson.setExportedApplication(application);

                    // Populate pages with set of updated ids
                    applicationJson.setPageList(pages);
                    updatedResources.put(FieldName.PAGE_LIST, ImportExportUtils.getUpdatedPagesForApplication(application, pages, resourceMode));

                    // Populate action collections with set of updated ids
                    applicationJson.setActionCollectionList(collections);
                    updatedResources.put(FieldName.ACTION_COLLECTION_LIST, ImportExportUtils.getUpdatedCollectionsForApplication(application, collections, resourceMode));

                    // Populate actions with set of updated ids
                    applicationJson.setActionList(actions);
                    updatedResources.put(FieldName.ACTION_LIST, ImportExportUtils.getUpdatedActionsForApplication(application, actions, resourceMode));

                    // Populate datasources
                    Set<String> datasourceIds = actions.stream()
                            .map(action -> action.select(resourceMode).getDatasource().getId())
                            .filter(StringUtils::isNotBlank)
                            .collect(Collectors.toSet());

                    datasources = datasources.stream()
                            .filter(datasource -> datasourceIds.contains(datasource.getId()))
                            .collect(Collectors.toList());

                    datasources = processDatasourceConfigurationForExport(applicationJson, application, datasources, serialiseFor);

                    applicationJson.setDatasourceList(datasources);

                    // Fix references, this basically replaces the ids of resources and the reference fields with curresponding name
                    // of the resource
                    fixReferencesForExport(application, pages, collections, actions, plugins, datasources, resourceMode);

                    // Set the updated resources
                    applicationJson.setUpdatedResources(updatedResources);

                    return Tuples.of(applicationJson, currentUser);
                }).flatMap(tuple -> {

                    ApplicationJson applicationJson = tuple.getT1();
                    User currentUser = tuple.getT2();

                    // When we land here, we have the applicationJson object with all the resources populated.
                    // So we will stop the timer and send the analytics event
                    stopwatch.stopTimer();
                    final Map<String, Object> data = Map.of(
                            FieldName.APPLICATION_ID, applicationId,
                            "pageCount", applicationJson.getPageList().size(),
                            "actionCount", applicationJson.getActionList().size(),
                            "JSObjectCount", applicationJson.getActionCollectionList().size(),
                            FieldName.FLOW_NAME, stopwatch.getFlow(),
                            "executionTime", stopwatch.getExecutionTime()
                    );
                    return analyticsService.sendEvent(AnalyticsEvents.UNIT_EXECUTION_TIME.getEventName(), currentUser.getUsername(), data)
                            .thenReturn(applicationJson);
                });
    }

    public Mono<ApplicationJson> exportApplicationById(String applicationId, String branchName) {
        return applicationService.findBranchedApplicationId(branchName, applicationId, applicationPermission.getExportPermission())
                .flatMap(branchedAppId -> exportApplicationById(branchedAppId, SerialiseApplicationObjective.SHARE));
    }

    public Mono<ExportFileDTO> getApplicationFile(String applicationId, String branchName) {
        return this.exportApplicationById(applicationId, branchName)
                .map(applicationJson -> {
                    ObjectMapper mapper = new ObjectMapper();
                    mapper.setSerializationInclusion(Include.NON_NULL);
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
                    ObjectMapper mapper = new ObjectMapper();
                    mapper.setSerializationInclusion(Include.NON_NULL);
                    SimpleModule module = new SimpleModule();
                    //module.addSerializer(JSONObject.class, new JSONObjectSerializer());
                    //module.addDeserializer(JSONObject.class, new JSONObjectDeserializer());
                    //mapper.registerModule(module);
                    ApplicationJson jsonFile = null;
                    try {
                        jsonFile = mapper.readerWithView(Views.Import.class).readValue(data, ApplicationJson.class);
                    } catch (IOException e) {
                        // TODO Auto-generated catch block
                        e.printStackTrace();
                    }
                    return importApplicationInWorkspace(workspaceId, jsonFile);
                            // .onErrorResume(error -> {
                            //     if (error instanceof AppsmithException) {
                            //         return Mono.error(error);
                            //     }
                            //     return Mono.error(new AppsmithException(AppsmithError.GENERIC_JSON_IMPORT_ERROR, workspaceId, error.getMessage()));
                            // });
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
        return importApplicationInWorkspace(workspaceId, null, importedDoc, SerialiseApplicationObjective.SHARE);
    }

    @Override
    public Mono<Application> importApplicationInWorkspace(String workspaceId, ApplicationJson importedDoc,
            String applicationId, String branchName) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'importApplicationInWorkspace'");
    }

    public Mono<List<Datasource>> findDatasourceByApplicationId(String applicationId, String workspaceId) {
        // TODO: Investigate further why datasourcePermission.getReadPermission() is not being used.
        Mono<List<Datasource>> listMono = datasourceService.findAllByWorkspaceId(workspaceId, Optional.empty()).collectList();
        return newActionService.findAllByApplicationIdAndViewMode(applicationId, false, Optional.empty(), Optional.empty())
                .collectList()
                .zipWith(listMono)
                .flatMap(objects -> {
                    List<Datasource> datasourceList = objects.getT2();
                    List<NewAction> actionList = objects.getT1();
                    List<String> usedDatasource = actionList.stream()
                            .map(newAction -> newAction.getUnpublishedAction().getDatasource().getId())
                            .collect(Collectors.toList());

                    datasourceList.removeIf(datasource -> !usedDatasource.contains(datasource.getId()));

                    return Mono.just(datasourceList);
                });
    }

    @Override
    public Mono<ApplicationImportDTO> getApplicationImportDTO(String applicationId, String workspaceId, Application application) {
        return findDatasourceByApplicationId(applicationId, workspaceId)
                .map(datasources -> {
                    ApplicationImportDTO applicationImportDTO = new ApplicationImportDTO();
                    applicationImportDTO.setApplication(application);
                    Boolean isUnConfiguredDatasource = datasources.stream().anyMatch(datasource -> Boolean.FALSE.equals(datasource.getIsConfigured()));
                    if (Boolean.TRUE.equals(isUnConfiguredDatasource)) {
                        applicationImportDTO.setIsPartialImport(true);
                        applicationImportDTO.setUnConfiguredDatasourceList(datasources);
                    } else {
                        applicationImportDTO.setIsPartialImport(false);
                    }
                    return applicationImportDTO;
                });
    }

    Mono<List<Datasource>> checkIfAllPluginInstalled(List<Datasource> datasourceToImportList, Mono<Map<String, Plugin>> installedPluginReferenceToPluginMapMono) {
        return Flux.fromIterable(datasourceToImportList)
                .zipWith(installedPluginReferenceToPluginMapMono.repeat())
                .flatMap(tuple -> {
                    Datasource datasourceToImport = tuple.getT1();
                    Map<String, Plugin> installedPluginReferenceToPluginMap = tuple.getT2();
                    if (!installedPluginReferenceToPluginMap.containsKey(datasourceToImport.getPluginId())) {
                        log.error("Unable to find the plugin {}, available plugins are: {}", datasourceToImport.getPluginId(), installedPluginReferenceToPluginMap.keySet());
                        return Mono.error(new AppsmithException(AppsmithError.UNKNOWN_PLUGIN_REFERENCE, datasourceToImport.getPluginId()));
                    }
                    return Mono.just(datasourceToImport);
                })
                .collectList();
    }

    public Mono<Application> importApplicationInWorkspace(final String workspaceId, String applicationId, final ApplicationJson applicationJson, SerialiseApplicationObjective serialiseFor) {

        // Read plugins from DB
        Mono<List<Plugin>> installedPluginListMono = pluginRepository.findAll().collectList().cache();
        // Create maps for further processing
        Mono<Map<String, Plugin>> installedPluginIdToPluginMapMono = installedPluginListMono.map(ImportExportUtils::computePluginIdToPluginMap).cache();
        Mono<Map<String, Plugin>> installedPluginReferenceToPluginMapMono = installedPluginListMono.map(ImportExportUtils::computePluginReferenceToPluginMap).cache();

        // Everything to import
        Mono<Application> applicationToImportMono = Mono.just(applicationJson.getExportedApplication()).cache();
        Mono<List<NewPage>> pageToImportListMono = Mono.just(applicationJson.getPageList()).map(Collections::unmodifiableList).cache();
        Mono<List<NewAction>> actionToImportListMono = Mono.just(applicationJson.getActionList()).map(Collections::unmodifiableList).cache();
        Mono<List<ActionCollection>> collectionToImportListMono = Mono.just(applicationJson.getActionCollectionList()).map(Collections::unmodifiableList).cache();
        Mono<List<Datasource>> datasourceToImportListMono = Mono.just(applicationJson.getDatasourceList()).map(Collections::unmodifiableList).cache()
                .flatMap(datasourceToImportList -> {
                    return checkIfAllPluginInstalled(datasourceToImportList, installedPluginReferenceToPluginMapMono);
                }).cache();

        // fetch workspace
        Mono<Workspace> workspaceMono = importExportHelper.fetchWorkspace(workspaceId, serialiseFor);

        //fetch or create application
        Mono<Application> importedApplicationMono = applicationToImportMono
                .flatMap(applicationToImport -> {
                    applicationToImport.setWorkspaceId(workspaceId);
                    return importExportHelper.fetchOrCreateApplicationForImport(applicationId, applicationToImport, serialiseFor);
                }).cache();

        // Fetch existing datasources
        Mono<List<Datasource>> existingDatasourcesMono = importExportHelper.fetchDatasourcesForWorkspace(workspaceId, false, serialiseFor)
                .collectList().cache();

        Mono<Map<String, Datasource>> existingDatasourceNameToDatasourceMapMono = existingDatasourcesMono.map(ImportExportUtils::computeDatasourceNameToDatasourceMap).cache();

        Mono<List<Datasource>> importedDatasourceListMono = Mono.zip(datasourceToImportListMono, existingDatasourceNameToDatasourceMapMono, installedPluginReferenceToPluginMapMono)
                .flatMap((tuple) -> {
                    List<Datasource> datasourceToImportList = tuple.getT1();
                    Map<String, Datasource> existingDatasourceNameToDatasourceMap = tuple.getT2();
                    Map<String, Plugin> installedPluginReferenceToPluginMap = tuple.getT3();
                    return importDatasources(workspaceId, datasourceToImportList, existingDatasourceNameToDatasourceMap, installedPluginReferenceToPluginMap);
                }).cache();

        return importedDatasourceListMono.then(importedApplicationMono);
    }

    private Mono<List<Datasource>> importDatasources(String workspaceId, List<Datasource> datasourcesToImport, Map<String, Datasource> existingDatasourceNameToDatasourceMap, Map<String, Plugin> pluginReferenceToPluginMap) {
        return Flux.fromIterable(datasourcesToImport)
                .flatMap(datasource -> importDatasource(workspaceId, datasource, existingDatasourceNameToDatasourceMap, pluginReferenceToPluginMap))
                .collectList();
                //new ObjectId();
    }

    // private Mono<List<NewPage>> importPages(String applicationId, List<NewPage> pagesToImport, Map<String, Datasource> existingDatasourceNameToDatasourceMap, Map<String, Plugin> pluginReferenceToPluginMap) {
    //     return importPages(applicationId, pagesToImport, null, null, null);
    // }

    // private Mono<List<ActionCollection>> importCollections(String applicationId, List<ActionCollection> collectionsToImport, Map<String, Datasource> existingDatasourceNameToDatasourceMap, Map<String, Plugin> pluginReferenceToPluginMap) {
    //     return importCollections(applicationId, collectionsToImport, null, null, null);
    // }

    // private Mono<List<NewAction>> importActions(String applicationId, List<NewAction> actionsToImport, Map<String, Datasource> existingDatasourceNameToDatasourceMap, Map<String, Plugin> pluginReferenceToPluginMap) {
    //     return importActions(applicationId, actionsToImport, null, null, null);
    // }

    private Mono<Datasource> importDatasource(String workspaceId, Datasource datasourceToImport, Map<String, Datasource> existingDatasourceNameToDatasourceMap, Map<String, Plugin> pluginReferenceToPluginMap) {

        Datasource existingDatasource = existingDatasourceNameToDatasourceMap.get(datasourceToImport.getName());
        if(existingDatasource != null && datasourceToImport.getPluginId().equals(existingDatasource.getPluginName())) {
            // If the datasource exists, update it
            copyNestedNonNullProperties(datasourceToImport, existingDatasource);
            return datasourceService.update(existingDatasource.getId(), existingDatasource)
                    .as(transactionalOperator::transactional);
        } else {
            // If the datasource does not exist, create it
            datasourceToImport.setExplicitId(new ObjectId().toString());
            log.debug("Importing datasource with id: {}", datasourceToImport.getExplicitId());
            datasourceToImport.setWorkspaceId(workspaceId);
            datasourceToImport.setPluginId(pluginReferenceToPluginMap.get(datasourceToImport.getPluginId()).getId());
            return datasourceService.create(datasourceToImport)
                    .as(transactionalOperator::transactional).log();
        }
     }

    // private Mono<Datasource> importPage(String workspaceId, NewPage pageToImport, Map<String, Datasource> existingDatasourceNameToDatasourceMap, Map<String, NewPage> existingPageNameToPageMap) {

    //     NewPage existingPage = existingPageNameToPageMap.get(pageToImport.getId());
    //     if(existingPage != null) {
    //         // If the datasource exists, update it
    //         copyNestedNonNullProperties(pageToImport, existingPage);
    //         return applicationPageService.addPageToApplication(null, null, TRUE).update(existingPage.getId(), existingPage)
    //                 .as(transactionalOperator::transactional);
    //     } else {
    //         // If the datasource does not exist, create it
    //         return applicationPageService.createPage(pageToImport).as(transactionalOperator::transactional);
    //     }
    // }

    // private Mono<Datasource> importCollection(String workspaceId, ActionCollection actionCollection, Map<String, Datasource> existingDatasourceNameToDatasourceMap, Map<String, Plugin> pluginReferenceToPluginMap) {

    //     NewPage existingPage = existingPageNameToPageMap.get(pageToImport.getId());
    //     if(existingPage != null) {
    //         // If the datasource exists, update it
    //         copyNestedNonNullProperties(pageToImport, existingPage);
    //         return applicationPageService.addPageToApplication(null, null, TRUE).update(existingPage.getId(), existingPage)
    //                 .as(transactionalOperator::transactional);
    //     } else {
    //         // If the datasource does not exist, create it
    //         return applicationPageService.createPage(pageToImport).as(transactionalOperator::transactional);
    //     }
    // }

    // private Mono<Datasource> importAction(String workspaceId, NewAction actionToImport, Map<String, Datasource> existingDatasourceNameToDatasourceMap, Map<String, Plugin> pluginReferenceToPluginMap) {

    //     Datasource existingDatasource = existingDatasourceNameToDatasourceMap.get(datasourceToImport.getName());
    //     if(existingDatasource != null && datasourceToImport.getPluginName().equals(existingDatasource.getPluginName())) {
    //         // If the datasource exists, update it
    //         copyNestedNonNullProperties(datasourceToImport, existingDatasource);
    //         return datasourceService.update(existingDatasource.getId(), existingDatasource)
    //                 .as(transactionalOperator::transactional);
    //     } else {
    //         // If the datasource does not exist, create it
    //         datasourceToImport.setWorkspaceId(workspaceId);
    //         return datasourceService.create(datasourceToImport)
    //                 .as(transactionalOperator::transactional).log();
    //     }
    // }

//     Mono<Void> importPages(List<NewPage> pagesToImport, List<NewPage> existingPages, List<Datasource> existingDatasources) {
//         Map<String, NewPage> existingPageIdToPageMap = existingPages.stream()
//         .collect(Collectors.toMap(page -> page.getId(), page -> page));

//         // This list will contain existing pages that are marked for update
//         List<NewPage> existingPagesMarkedForUpdate = new ArrayList<>();

//         // This list will contain existing pages that are marked for delete
//         List<NewPage> existingPagesMarkedForDelete = new ArrayList<>();

// for(NewPage pageToImport : pagesToImport) {
//     String existingPageName = pageToImport.select(ResourceModes.EDIT).getName();

//     if(existingEditModePageNames.contains(existingPageName)) {
//         // If the page of same name exists in the edit mode
//         String existingPageId = existingEditModePageNameToPageIdMap.get(existingPageName);
//         NewPage existingPage = existingPageIdToPageMap.get(existingPageId);

//         // Adding this page to update list
//         existingPagesMarkedForUpdate.add(existingPage);

//         copyNestedNonNullProperties(pageToImport.select(ResourceModes.EDIT), existingPage.select(ResourceModes.EDIT));

//     } else if(existingViewModeOnlyPageNames.contains(existingPageName)) {
//         // Page with same name exists in view mode (but not in edit mode)
//         String existingPageId = existingViewModePageNameToPageIdMap.get(existingPageName);
//         NewPage existingPage = existingPageIdToPageMap.get(existingPageId);

//         // Adding this page to update list
//         existingPagesMarkedForUpdate.add(existingPage);

//         copyNestedNonNullProperties(pageToImport.select(ResourceModes.EDIT), existingPage.select(ResourceModes.EDIT));

//     } else {

//         //newPageService.
//     }
// }

// Set<String> existingPageIdsMarkedForUpdate = existingPagesMarkedForUpdate.stream()
//         .map(page -> page.getId())
//         .collect(Collectors.toSet());

// for(NewPage existingPage : existingPages) {
//     if(!existingPageIdsMarkedForUpdate.contains(existingPage.getId())) {
//         existingPagesMarkedForDelete.add(existingPage);
//     }
// }

// //List<ApplicationPage> toImportpplicationPages = applicationToImport.getPages();
// applicationToImport.setPublishedPages(List.of()); //TODO not sure why it was set to null, changed it to empty list
//     }

//     Mono<NewPage> importPageInEditMode(NewPage pageToImport, List<NewPage> existingPages, List<Plugin> plugins) {
//         // Strategy for importing pages
//         // 1. If page with same name exists in edit mode, we update that page, also undelete if page is deleted
//         // 2. If a page with same name exists in view mode and edit mode page is deleted, we update that page
//         // 3. If a page with same name does not exist in edit mode or view mode, we create a new page
//         Map<String, Plugin> pluginNameToPluginMap = ImportExportUtils.calculatePluginIdToPluginMap(plugins);
//         existingDatasources.stream()
//                 .forEach(pageToImport -> {

//                 });
//         return Mono.just(pageToImport)
//                 .flatMap(page -> {
//                     // Check if the page already exists
//                     Optional<NewPage> existingPage = existingPages.stream()
//                             .filter(page1 -> page1.getName().equals(page.getName()))
//                             .findFirst();

//                     if(existingPage.isPresent()) {
//                         // If the page exists, update it
//                         return newPageService.update(page.getId(), page);
//                     } else {
//                         // If the page does not exist, create it
//                         return newPageService.create(page);
//                     }
//                 });
//     }

    @Override
    public Mono<ApplicationJson> exportApplicationById(String applicationId,
            SerialiseApplicationObjective serialiseFor) {
        return exportApplicationById(applicationId, serialiseFor, ResourceModes.EDIT);
    }
}

/**
 * DTO class to hold the application and the list of pages to be exported.
 */
@Getter
@AllArgsConstructor
class ApplicationAndPagesDTO {
    private Application application;
    private List<String> pageIds;
}