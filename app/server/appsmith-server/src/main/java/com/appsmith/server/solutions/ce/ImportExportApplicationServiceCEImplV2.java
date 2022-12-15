package com.appsmith.server.solutions.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.converters.GsonISOStringToInstantConverter;
import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.AuthenticationResponse;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.BasicAuth;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DecryptedSensitiveFields;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.OAuth2;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ExportFileDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.DefaultResourcesUtils;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.migrations.ApplicationVersion;
import com.appsmith.server.migrations.JsonSchemaMigration;
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
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang.StringUtils;
import org.bson.types.ObjectId;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_THEMES;
import static com.appsmith.server.constants.ResourceModes.EDIT;
import static com.appsmith.server.constants.ResourceModes.VIEW;
import static com.appsmith.external.constants.GitConstants.NAME_SEPARATOR;
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
    private final PolicyUtils policyUtils;
    private final AnalyticsService analyticsService;
    private final DatasourcePermission datasourcePermission;
    private final WorkspacePermission workspacePermission;
    private final ApplicationPermission applicationPermission;
    private final PagePermission pagePermission;
    private final ActionPermission actionPermission;

    private static final Set<MediaType> ALLOWED_CONTENT_TYPES = Set.of(MediaType.APPLICATION_JSON);
    private static final String INVALID_JSON_FILE = "invalid json file";

    /**
     * This function will give the application resource to rebuild the application in import application flow
     *
     * @param applicationId which needs to be exported
     * @return application reference from which entire application can be rehydrated
     */
    public Mono<ApplicationJson> exportApplicationById(String applicationId, SerialiseApplicationObjective serialiseFor) {

        // Start the stopwatch to log the execution time
        Stopwatch stopwatch = new Stopwatch(AnalyticsEvents.EXPORT.getEventName());
        /*
            1. Fetch application by id
            2. Fetch pages from the application
            3. Fetch datasources from workspace
            4. Fetch actions from the application
            5. Filter out relevant datasources using actions reference
            6. Fetch action collections from the application
         */
        ApplicationJson applicationJson = new ApplicationJson();
        Map<String, String> pluginMap = new HashMap<>();
        Map<String, String> datasourceIdToNameMap = new HashMap<>();
        Map<String, String> pageIdToNameMap = new HashMap<>();
        Map<String, String> actionIdToNameMap = new HashMap<>();
        Map<String, String> collectionIdToNameMap = new HashMap<>();

        if (applicationId == null || applicationId.isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID));
        }

        // Check permissions depending upon the serialization objective:
        // Git-sync => Manage permission
        // Share application
        //      : Normal apps => Export permission
        //      : Sample apps where datasource config needs to be shared => Read permission

        boolean isGitSync = SerialiseApplicationObjective.VERSION_CONTROL.equals(serialiseFor);

        // If Git-sync, then use MANAGE_APPLICATIONS, else use EXPORT_APPLICATION permission to fetch application
        AclPermission permission = isGitSync ? applicationPermission.getEditPermission() : applicationPermission.getExportPermission();

        Mono<User> currentUserMono = sessionUserService.getCurrentUser().cache();

        Mono<Application> applicationMono =
                // Find the application with appropriate permission
                applicationService.findById(applicationId, permission)
                        // Find the application without permissions if it is a template application
                        .switchIfEmpty(applicationService.findByIdAndExportWithConfiguration(applicationId, TRUE))
                        .switchIfEmpty(Mono.error(
                                new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION_ID, applicationId))
                        )
                        .map(application -> {
                            if (!TRUE.equals(application.getExportWithConfiguration())) {
                                // Explicitly setting the boolean to avoid NPE for future checks
                                application.setExportWithConfiguration(false);
                            }

                            return application;
                        });

        // Set json schema version which will be used to check the compatibility while importing the JSON
        applicationJson.setServerSchemaVersion(JsonSchemaVersions.serverVersion);
        applicationJson.setClientSchemaVersion(JsonSchemaVersions.clientVersion);

        Mono<Theme> defaultThemeMono = themeService.getSystemTheme(Theme.DEFAULT_THEME_NAME)
                .map(theme -> {
                    log.debug("Default theme found: {}", theme.getName());
                    return theme;
                })
                .cache();

        return pluginRepository
                .findAll()
                .map(plugin -> {
                    pluginMap.put(plugin.getId(), plugin.getPluginName() == null ? plugin.getPackageName() : plugin.getPluginName());
                    return plugin;
                })
                .then(applicationMono)
                .flatMap(application -> themeService.getThemeById(application.getEditModeThemeId(), READ_THEMES)
                        .switchIfEmpty(defaultThemeMono) // setting default theme if theme is missing
                        .zipWith(themeService
                                .getThemeById(application.getPublishedModeThemeId(), READ_THEMES)
                                .switchIfEmpty(defaultThemeMono)// setting default theme if theme is missing
                        )
                        .map(themesTuple -> {
                            Theme editModeTheme = themesTuple.getT1();
                            Theme publishedModeTheme = themesTuple.getT2();
                            editModeTheme.sanitiseToExportDBObject();
                            publishedModeTheme.sanitiseToExportDBObject();
                            applicationJson.setEditModeTheme(editModeTheme);
                            applicationJson.setPublishedTheme(publishedModeTheme);
                            return themesTuple;
                        }).thenReturn(application))
                .flatMap(application -> {

                    // Refactor application to remove the ids
                    final String workspaceId = application.getWorkspaceId();
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    Instant applicationLastCommittedAt = gitApplicationMetadata != null ? gitApplicationMetadata.getLastCommittedAt() : null;
                    boolean isClientSchemaMigrated = !JsonSchemaVersions.clientVersion.equals(application.getClientSchemaVersion());
                    boolean isServerSchemaMigrated = !JsonSchemaVersions.serverVersion.equals(application.getServerSchemaVersion());
                    examplesWorkspaceCloner.makePristine(application);
                    application.sanitiseToExportDBObject();
                    applicationJson.setExportedApplication(application);
                    Set<String> dbNamesUsedInActions = new HashSet<>();

                    Flux<NewPage> pageFlux = TRUE.equals(application.getExportWithConfiguration())
                            ? newPageRepository.findByApplicationId(applicationId, pagePermission.getReadPermission())
                            : newPageRepository.findByApplicationId(applicationId, pagePermission.getEditPermission());

                    return pageFlux
                            .collectList()
                            .flatMap(newPageList -> {
                                // Extract mongoEscapedWidgets from pages and save it to applicationJson object as this
                                // field is JsonIgnored. Also remove any ids those are present in the page objects

                                Set<String> updatedPageSet = new HashSet<String>();
                                newPageList.forEach(newPage -> {
                                    if (newPage.getUnpublishedPage() != null) {
                                        pageIdToNameMap.put(
                                                newPage.getId() + EDIT, newPage.getUnpublishedPage().getName()
                                        );
                                        PageDTO unpublishedPageDTO = newPage.getUnpublishedPage();
                                        if (!CollectionUtils.isEmpty(unpublishedPageDTO.getLayouts())) {
                                            unpublishedPageDTO.getLayouts().forEach(layout -> {
                                                layout.setId(unpublishedPageDTO.getName());
                                            });
                                        }
                                    }

                                    if (newPage.getPublishedPage() != null) {
                                        pageIdToNameMap.put(
                                                newPage.getId() + VIEW, newPage.getPublishedPage().getName()
                                        );
                                        PageDTO publishedPageDTO = newPage.getPublishedPage();
                                        if (!CollectionUtils.isEmpty(publishedPageDTO.getLayouts())) {
                                            publishedPageDTO.getLayouts().forEach(layout -> {
                                                layout.setId(publishedPageDTO.getName());
                                            });
                                        }
                                    }
                                    // Including updated pages list for git file storage
                                    Instant newPageUpdatedAt = newPage.getUpdatedAt();
                                    boolean isNewPageUpdated = isClientSchemaMigrated || isServerSchemaMigrated || applicationLastCommittedAt == null || newPageUpdatedAt == null || applicationLastCommittedAt.isBefore(newPageUpdatedAt);
                                    String newPageName = newPage.getUnpublishedPage() != null ? newPage.getUnpublishedPage().getName() : newPage.getPublishedPage() != null ? newPage.getPublishedPage().getName() : null;
                                    if (isNewPageUpdated && newPageName != null) {
                                        updatedPageSet.add(newPageName);
                                    }
                                    newPage.sanitiseToExportDBObject();
                                });
                                applicationJson.setPageList(newPageList);
                                applicationJson.setUpdatedResources(new HashMap<String, Set<String>>() {{
                                    put(FieldName.PAGE_LIST, updatedPageSet);
                                }});

                                Flux<Datasource> datasourceFlux = TRUE.equals(application.getExportWithConfiguration())
                                        ? datasourceRepository.findAllByWorkspaceId(workspaceId, datasourcePermission.getReadPermission())
                                        : datasourceRepository.findAllByWorkspaceId(workspaceId, datasourcePermission.getEditPermission());

                                return datasourceFlux.collectList();
                            })
                            .flatMapMany(datasourceList -> {
                                datasourceList.forEach(datasource ->
                                        datasourceIdToNameMap.put(datasource.getId(), datasource.getName()));
                                applicationJson.setDatasourceList(datasourceList);

                                Flux<ActionCollection> actionCollectionFlux = TRUE.equals(application.getExportWithConfiguration())
                                        ? actionCollectionRepository.findByApplicationId(applicationId, actionPermission.getReadPermission(), null)
                                        : actionCollectionRepository.findByApplicationId(applicationId, actionPermission.getEditPermission(), null);
                                return actionCollectionFlux;
                            })
                            .map(actionCollection -> {
                                // Remove references to ids since the serialized version does not have this information
                                actionCollection.setWorkspaceId(null);
                                actionCollection.setPolicies(null);
                                actionCollection.setApplicationId(null);
                                // Set unique ids for actionCollection, also populate collectionIdToName map which will
                                // be used to replace collectionIds in action
                                if (actionCollection.getUnpublishedCollection() != null) {
                                    ActionCollectionDTO actionCollectionDTO = actionCollection.getUnpublishedCollection();
                                    actionCollectionDTO.setPageId(pageIdToNameMap.get(actionCollectionDTO.getPageId() + EDIT));
                                    actionCollectionDTO.setPluginId(pluginMap.get(actionCollectionDTO.getPluginId()));

                                    final String updatedCollectionId = actionCollectionDTO.getPageId() + "_" + actionCollectionDTO.getName();
                                    collectionIdToNameMap.put(actionCollection.getId(), updatedCollectionId);
                                    actionCollection.setId(updatedCollectionId);
                                }
                                if (actionCollection.getPublishedCollection() != null) {
                                    ActionCollectionDTO actionCollectionDTO = actionCollection.getPublishedCollection();
                                    actionCollectionDTO.setPageId(pageIdToNameMap.get(actionCollectionDTO.getPageId() + VIEW));
                                    actionCollectionDTO.setPluginId(pluginMap.get(actionCollectionDTO.getPluginId()));

                                    if (!collectionIdToNameMap.containsValue(actionCollection.getId())) {
                                        final String updatedCollectionId = actionCollectionDTO.getPageId() + "_" + actionCollectionDTO.getName();
                                        collectionIdToNameMap.put(actionCollection.getId(), updatedCollectionId);
                                        actionCollection.setId(updatedCollectionId);
                                    }
                                }
                                return actionCollection;
                            })
                            .collectList()
                            .flatMapMany(actionCollections -> {
                                // This object won't have the list of actions but we don't care about that today
                                // Because the actions will have a reference to the collection

                                Set<String> updatedActionCollectionSet = new HashSet<>();
                                actionCollections.forEach(actionCollection -> {
                                    ActionCollectionDTO publishedActionCollectionDTO = actionCollection.getPublishedCollection();
                                    ActionCollectionDTO unpublishedActionCollectionDTO = actionCollection.getUnpublishedCollection();
                                    ActionCollectionDTO actionCollectionDTO = unpublishedActionCollectionDTO != null ? unpublishedActionCollectionDTO : publishedActionCollectionDTO;
                                    String actionCollectionName = actionCollectionDTO != null ? actionCollectionDTO.getName() + NAME_SEPARATOR + actionCollectionDTO.getPageId() : null;
                                    Instant actionCollectionUpdatedAt = actionCollection.getUpdatedAt();
                                    boolean isActionCollectionUpdated = isClientSchemaMigrated || isServerSchemaMigrated || applicationLastCommittedAt == null || actionCollectionUpdatedAt == null || applicationLastCommittedAt.isBefore(actionCollectionUpdatedAt);
                                    if (isActionCollectionUpdated && actionCollectionName != null) {
                                        updatedActionCollectionSet.add(actionCollectionName);
                                    }
                                    actionCollection.sanitiseToExportDBObject();
                                });

                                applicationJson.setActionCollectionList(actionCollections);
                                applicationJson.getUpdatedResources().put(FieldName.ACTION_COLLECTION_LIST, updatedActionCollectionSet);

                                Flux<NewAction> actionFlux = TRUE.equals(application.getExportWithConfiguration())
                                        ? newActionRepository.findByApplicationId(applicationId, actionPermission.getReadPermission(), null)
                                        : newActionRepository.findByApplicationId(applicationId, actionPermission.getEditPermission(), null);

                                return actionFlux;
                            })
                            .map(newAction -> {
                                newAction.setPluginId(pluginMap.get(newAction.getPluginId()));
                                newAction.setWorkspaceId(null);
                                newAction.setPolicies(null);
                                newAction.setApplicationId(null);
                                dbNamesUsedInActions.add(
                                        sanitizeDatasourceInActionDTO(newAction.getPublishedAction(), datasourceIdToNameMap, pluginMap, null, true)
                                );
                                dbNamesUsedInActions.add(
                                        sanitizeDatasourceInActionDTO(newAction.getUnpublishedAction(), datasourceIdToNameMap, pluginMap, null, true)
                                );

                                // Set unique id for action
                                if (newAction.getUnpublishedAction() != null) {
                                    ActionDTO actionDTO = newAction.getUnpublishedAction();
                                    actionDTO.setPageId(pageIdToNameMap.get(actionDTO.getPageId() + EDIT));

                                    if (!StringUtils.isEmpty(actionDTO.getCollectionId())
                                            && collectionIdToNameMap.containsKey(actionDTO.getCollectionId())) {
                                        actionDTO.setCollectionId(collectionIdToNameMap.get(actionDTO.getCollectionId()));
                                    }

                                    final String updatedActionId = actionDTO.getPageId() + "_" + actionDTO.getValidName();
                                    actionIdToNameMap.put(newAction.getId(), updatedActionId);
                                    newAction.setId(updatedActionId);
                                }
                                if (newAction.getPublishedAction() != null) {
                                    ActionDTO actionDTO = newAction.getPublishedAction();
                                    actionDTO.setPageId(pageIdToNameMap.get(actionDTO.getPageId() + VIEW));

                                    if (!StringUtils.isEmpty(actionDTO.getCollectionId())
                                            && collectionIdToNameMap.containsKey(actionDTO.getCollectionId())) {
                                        actionDTO.setCollectionId(collectionIdToNameMap.get(actionDTO.getCollectionId()));
                                    }

                                    if (!actionIdToNameMap.containsValue(newAction.getId())) {
                                        final String updatedActionId = actionDTO.getPageId() + "_" + actionDTO.getValidName();
                                        actionIdToNameMap.put(newAction.getId(), updatedActionId);
                                        newAction.setId(updatedActionId);
                                    }
                                }
                                return newAction;
                            })
                            .collectList()
                            .map(actionList -> {
                                Set<String> updatedActionSet = new HashSet<>();
                                actionList.forEach(newAction -> {
                                    ActionDTO unpublishedActionDTO = newAction.getUnpublishedAction();
                                    ActionDTO publishedActionDTO = newAction.getPublishedAction();
                                    ActionDTO actionDTO = unpublishedActionDTO != null ? unpublishedActionDTO : publishedActionDTO;
                                    String newActionName = actionDTO != null ? actionDTO.getValidName() + NAME_SEPARATOR + actionDTO.getPageId() : null;
                                    Instant newActionUpdatedAt = newAction.getUpdatedAt();
                                    boolean isNewActionUpdated = isClientSchemaMigrated || isServerSchemaMigrated || applicationLastCommittedAt == null || newActionUpdatedAt == null || applicationLastCommittedAt.isBefore(newActionUpdatedAt);
                                    if (isNewActionUpdated && newActionName != null) {
                                        updatedActionSet.add(newActionName);
                                    }
                                    newAction.sanitiseToExportDBObject();
                                });
                                applicationJson.getUpdatedResources().put(FieldName.ACTION_LIST, updatedActionSet);
                                applicationJson.setActionList(actionList);
                                // This is where we're removing global datasources that are unused in this application
                                applicationJson
                                        .getDatasourceList()
                                        .removeIf(datasource -> !dbNamesUsedInActions.contains(datasource.getName()));

                                // Save decrypted fields for datasources for internally used sample apps and templates only
                                // when serialising for file sharing
                                if (TRUE.equals(application.getExportWithConfiguration()) && SerialiseApplicationObjective.SHARE.equals(serialiseFor)) {
                                    // Save decrypted fields for datasources
                                    Map<String, DecryptedSensitiveFields> decryptedFields = new HashMap<>();
                                    applicationJson.getDatasourceList().forEach(datasource -> {
                                        decryptedFields.put(datasource.getName(), getDecryptedFields(datasource));
                                        datasource.sanitiseToExportResource(pluginMap);
                                    });
                                    applicationJson.setDecryptedFields(decryptedFields);
                                } else {
                                    applicationJson.getDatasourceList().forEach(datasource -> {
                                        // Remove the datasourceConfiguration object as user will configure it once imported to other instance
                                        datasource.setDatasourceConfiguration(null);
                                        datasource.sanitiseToExportResource(pluginMap);
                                    });
                                }

                                // Update ids for layoutOnLoadAction
                                for (NewPage newPage : applicationJson.getPageList()) {
                                    updateIdsForLayoutOnLoadAction(newPage.getUnpublishedPage(), actionIdToNameMap, collectionIdToNameMap);
                                    updateIdsForLayoutOnLoadAction(newPage.getPublishedPage(), actionIdToNameMap, collectionIdToNameMap);
                                }

                                application.exportApplicationPages(pageIdToNameMap);
                                // Disable exporting the application with datasource config once imported in destination instance
                                application.setExportWithConfiguration(null);
                                return applicationJson;
                            });
                })
                .then(currentUserMono)
                .map(user -> {
                    stopwatch.stopTimer();
                    final Map<String, Object> data = Map.of(
                            FieldName.APPLICATION_ID, applicationId,
                            "pageCount", applicationJson.getPageList().size(),
                            "actionCount", applicationJson.getActionList().size(),
                            "JSObjectCount", applicationJson.getActionCollectionList().size(),
                            FieldName.FLOW_NAME, stopwatch.getFlow(),
                            "executionTime", stopwatch.getExecutionTime()
                    );
                    analyticsService.sendEvent(AnalyticsEvents.UNIT_EXECUTION_TIME.getEventName(), user.getUsername(), data);
                    return applicationJson;
                })
                .then(sendImportExportApplicationAnalyticsEvent(applicationId, AnalyticsEvents.EXPORT))
                .thenReturn(applicationJson);
    }

    public Mono<ApplicationJson> exportApplicationById(String applicationId, String branchName) {
        return applicationService.findBranchedApplicationId(branchName, applicationId, applicationPermission.getExportPermission())
                .flatMap(branchedAppId -> exportApplicationById(branchedAppId, SerialiseApplicationObjective.SHARE));
    }

    private void updateIdsForLayoutOnLoadAction(PageDTO page,
                                                Map<String, String> actionIdToNameMap,
                                                Map<String, String> collectionIdToNameMap) {

        if (page != null && !CollectionUtils.isEmpty(page.getLayouts())) {
            for (Layout layout : page.getLayouts()) {
                if (!CollectionUtils.isEmpty(layout.getLayoutOnLoadActions())) {
                    layout.getLayoutOnLoadActions().forEach(onLoadAction -> onLoadAction
                            .forEach(actionDTO -> {
                                if (actionIdToNameMap.containsKey(actionDTO.getId())) {
                                    actionDTO.setId(actionIdToNameMap.get(actionDTO.getId()));
                                }
                                if (collectionIdToNameMap.containsKey(actionDTO.getCollectionId())) {
                                    actionDTO.setCollectionId(collectionIdToNameMap.get(actionDTO.getCollectionId()));
                                }
                            })
                    );
                }
            }
        }
    }

    public Mono<ExportFileDTO> getApplicationFile(String applicationId, String branchName) {
        return this.exportApplicationById(applicationId, branchName)
                .map(applicationJson -> {
                    Gson gson = new GsonBuilder()
                            .registerTypeAdapter(Instant.class, new GsonISOStringToInstantConverter())
                            .create();

                    String stringifiedFile = gson.toJson(applicationJson);
                    String applicationName = applicationJson.getExportedApplication().getName();
                    Object jsonObject = gson.fromJson(stringifiedFile, Object.class);
                    HttpHeaders responseHeaders = new HttpHeaders();
                    ContentDisposition contentDisposition = ContentDisposition
                            .builder("attachment")
                            .filename(applicationName + ".json", StandardCharsets.UTF_8)
                            .build();
                    responseHeaders.setContentDisposition(contentDisposition);
                    responseHeaders.setContentType(MediaType.APPLICATION_JSON);

                    ExportFileDTO exportFileDTO = new ExportFileDTO();
                    exportFileDTO.setApplicationResource(jsonObject);
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
                    Gson gson = new GsonBuilder()
                            .registerTypeAdapter(Instant.class, new GsonISOStringToInstantConverter())
                            .create();
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

    /**
     * This function will save the application to workspace from the application resource
     *
     * @param workspaceId workspace to which application is going to be stored
     * @param importedDoc application resource which contains necessary information to save the application
     * @return saved application in DB
     */
    public Mono<Application> importApplicationInWorkspace(String workspaceId, ApplicationJson importedDoc) {
        return importApplicationInWorkspace(workspaceId, importedDoc, null, null);
    }

    public Mono<Application> importApplicationInWorkspace(String workspaceId,
                                                          ApplicationJson applicationJson,
                                                          String applicationId,
                                                          String branchName) {
        return importApplicationInWorkspace(workspaceId, applicationJson, applicationId, branchName, false);
    }

    /**
     * validates whether a ApplicationJSON contains the required fields or not.
     *
     * @param importedDoc ApplicationJSON object that needs to be validated
     * @return Name of the field that have error. Empty string otherwise
     */
    private String validateApplicationJson(ApplicationJson importedDoc) {
        String errorField = "";
        if (CollectionUtils.isEmpty(importedDoc.getPageList())) {
            errorField = FieldName.PAGES;
        } else if (importedDoc.getExportedApplication() == null) {
            errorField = FieldName.APPLICATION;
        } else if (importedDoc.getActionList() == null) {
            errorField = FieldName.ACTIONS;
        } else if (importedDoc.getDatasourceList() == null) {
            errorField = FieldName.DATASOURCE;
        }

        return errorField;
    }

    /**
     * This function will take the application reference object to hydrate the application in mongoDB
     *
     * @param workspaceId     workspace to which application is going to be stored
     * @param applicationJson application resource which contains necessary information to import the application
     * @param applicationId   application which needs to be saved with the updated resources
     * @param branchName      name of the branch of application with applicationId
     * @param appendToApp     whether applicationJson will be appended to the existing app or not
     * @return Updated application
     */
    private Mono<Application> importApplicationInWorkspace(String workspaceId,
                                                           ApplicationJson applicationJson,
                                                           String applicationId,
                                                           String branchName,
                                                           boolean appendToApp) {
        /*
            1. Migrate resource to latest schema
            2. Fetch workspace by id
            3. Extract datasources and update plugin information
            4. Create new datasource if same datasource is not present
            5. Extract and save application
            6. Extract and save pages in the application
            7. Extract and save actions in the application
         */
        ApplicationJson importedDoc = JsonSchemaMigration.migrateApplicationToLatestSchema(applicationJson);

        // check for validation error and raise exception if error found
        String errorField = validateApplicationJson(importedDoc);
        if (!errorField.isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, errorField, INVALID_JSON_FILE));
        }

        Map<String, String> pluginMap = new HashMap<>();
        Map<String, String> datasourceMap = new HashMap<>();
        Map<String, NewPage> pageNameMap = new HashMap<>();
        Map<String, String> actionIdMap = new HashMap<>();
        // Datastructures to create a link between collectionId to embedded action ids
        Map<String, Map<String, String>> unpublishedCollectionIdToActionIdsMap = new HashMap<>();
        Map<String, Map<String, String>> publishedCollectionIdToActionIdsMap = new HashMap<>();
        // Datastructures to create a link between actionIds to collectionIds
        // <actionId, [collectionId, defaultCollectionId]>
        Map<String, List<String>> unpublishedActionIdToCollectionIdMap = new HashMap<>();
        Map<String, List<String>> publishedActionIdToCollectionIdMap = new HashMap<>();

        Application importedApplication = importedDoc.getExportedApplication();

        List<Datasource> importedDatasourceList = importedDoc.getDatasourceList();
        List<NewPage> importedNewPageList = importedDoc.getPageList();
        List<NewAction> importedNewActionList = importedDoc.getActionList();
        List<ActionCollection> importedActionCollectionList = importedDoc.getActionCollectionList();

        Mono<User> currUserMono = sessionUserService.getCurrentUser().cache();
        final Flux<Datasource> existingDatasourceFlux = datasourceRepository
                .findAllByWorkspaceId(workspaceId, datasourcePermission.getEditPermission())
                .cache();

        assert importedApplication != null : "Received invalid application object!";
        if (importedApplication.getApplicationVersion() == null) {
            importedApplication.setApplicationVersion(ApplicationVersion.EARLIEST_VERSION);
        }

        final List<ApplicationPage> publishedPages = importedApplication.getPublishedPages();
        importedApplication.setViewMode(false);
        final List<ApplicationPage> unpublishedPages = importedApplication.getPages();

        importedApplication.setPages(null);
        importedApplication.setPublishedPages(null);
        // Start the stopwatch to log the execution time
        Stopwatch stopwatch = new Stopwatch(AnalyticsEvents.IMPORT.getEventName());
        Mono<Application> importedApplicationMono = pluginRepository.findAll()
                .map(plugin -> {
                    final String pluginReference = plugin.getPluginName() == null ? plugin.getPackageName() : plugin.getPluginName();
                    pluginMap.put(pluginReference, plugin.getId());
                    return plugin;
                })
                .then(workspaceService.findById(workspaceId, workspacePermission.getApplicationCreatePermission()))
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId))
                )
                .flatMap(workspace -> {
                    // Check if the request is to hydrate the application to DB for particular branch
                    // Application id will be present for GIT sync
                    if (applicationId != null) {
                        // No need to hydrate the datasource as we expect user will configure the datasource
                        return existingDatasourceFlux.collectList();
                    }
                    return Mono.just(new ArrayList<Datasource>());
                })
                .flatMapMany(existingDatasources -> {
                    if (CollectionUtils.isEmpty(importedDatasourceList)) {
                        return Mono.empty();
                    }
                    Map<String, Datasource> savedDatasourcesGitIdToDatasourceMap = new HashMap<>();

                    existingDatasources.stream()
                            .filter(datasource -> datasource.getGitSyncId() != null)
                            .forEach(datasource -> savedDatasourcesGitIdToDatasourceMap.put(datasource.getGitSyncId(), datasource));

                    // Check if the destination org have all the required plugins installed
                    for (Datasource datasource : importedDatasourceList) {
                        if (StringUtils.isEmpty(pluginMap.get(datasource.getPluginId()))) {
                            log.error("Unable to find the plugin ", datasource.getPluginId());
                            return Mono.error(new AppsmithException(AppsmithError.UNKNOWN_PLUGIN_REFERENCE, datasource.getPluginId()));
                        }
                    }
                    return Flux.fromIterable(importedDatasourceList)
                            // Check for duplicate datasources to avoid duplicates in target workspace
                            .flatMap(datasource -> {

                                final String importedDatasourceName = datasource.getName();
                                // Check if the datasource has gitSyncId and if it's already in DB
                                if (datasource.getGitSyncId() != null
                                        && savedDatasourcesGitIdToDatasourceMap.containsKey(datasource.getGitSyncId())) {

                                    // Since the resource is already present in DB, just update resource
                                    Datasource existingDatasource = savedDatasourcesGitIdToDatasourceMap.get(datasource.getGitSyncId());
                                    datasource.setId(null);
                                    // Don't update datasource config as the saved datasource is already configured by user
                                    // for this instance
                                    datasource.setDatasourceConfiguration(null);
                                    datasource.setPluginId(null);
                                    copyNestedNonNullProperties(datasource, existingDatasource);
                                    existingDatasource.setStructure(null);
                                    // Don't update the datasource configuration for already available datasources
                                    existingDatasource.setDatasourceConfiguration(null);
                                    return datasourceService.update(existingDatasource.getId(), existingDatasource)
                                            .map(datasource1 -> {
                                                datasourceMap.put(importedDatasourceName, datasource1.getId());
                                                return datasource1;
                                            });
                                }

                                // This is explicitly copied over from the map we created before
                                datasource.setPluginId(pluginMap.get(datasource.getPluginId()));
                                datasource.setWorkspaceId(workspaceId);

                                // Check if any decrypted fields are present for datasource
                                if (importedDoc.getDecryptedFields() != null
                                        && importedDoc.getDecryptedFields().get(datasource.getName()) != null) {

                                    DecryptedSensitiveFields decryptedFields =
                                            importedDoc.getDecryptedFields().get(datasource.getName());

                                    updateAuthenticationDTO(datasource, decryptedFields);
                                }

                                return createUniqueDatasourceIfNotPresent(existingDatasourceFlux, datasource, workspaceId)
                                        .map(datasource1 -> {
                                            datasourceMap.put(importedDatasourceName, datasource1.getId());
                                            return datasource1;
                                        });
                            });
                })
                .then(
                        // 1. Assign the policies for the imported application
                        // 2. Check for possible duplicate names,
                        // 3. Save the updated application

                        Mono.just(importedApplication)
                                .zipWith(currUserMono)
                                .map(objects -> {
                                    Application application = objects.getT1();
                                    application.setModifiedBy(objects.getT2().getUsername());
                                    return application;
                                })
                                .flatMap(application -> {
                                    importedApplication.setWorkspaceId(workspaceId);
                                    // Application Id will be present for GIT sync
                                    if (!StringUtils.isEmpty(applicationId)) {
                                        return applicationService.findById(applicationId, applicationPermission.getEditPermission())
                                                .switchIfEmpty(
                                                        Mono.error(new AppsmithException(
                                                                AppsmithError.ACL_NO_RESOURCE_FOUND,
                                                                FieldName.APPLICATION_ID,
                                                                applicationId))
                                                )
                                                .flatMap(existingApplication -> {
                                                    if (appendToApp) {
                                                        // When we are appending the pages to the existing application
                                                        // e.g. import template we are only importing this in unpublished
                                                        // version. At the same time we want to keep the existing page ref
                                                        unpublishedPages.addAll(existingApplication.getPages());
                                                        return Mono.just(existingApplication);
                                                    }
                                                    importedApplication.setId(existingApplication.getId());
                                                    // For the existing application we don't need to default value of the flag
                                                    // The isPublic flag has a default value as false and this would be confusing to user
                                                    // when it is reset to false during importing where the application already is present in DB
                                                    importedApplication.setIsPublic(null);
                                                    copyNestedNonNullProperties(importedApplication, existingApplication);
                                                    // We are expecting the changes present in DB are committed to git directory
                                                    // so that these won't be lost when we are pulling changes from remote and
                                                    // rehydrate the application. We are now rehydrating the application with/without
                                                    // the changes from remote
                                                    // We are using the save instead of update as we are using @Encrypted
                                                    // for GitAuth
                                                    return applicationService.findById(existingApplication.getGitApplicationMetadata().getDefaultApplicationId())
                                                            .flatMap(application1 -> {
                                                                // Set the policies from the defaultApplication
                                                                existingApplication.setPolicies(application1.getPolicies());
                                                                importedApplication.setPolicies(application1.getPolicies());
                                                                return applicationService.save(existingApplication)
                                                                        .onErrorResume(DuplicateKeyException.class, error -> {
                                                                            if (error.getMessage() != null) {
                                                                                return applicationPageService
                                                                                        .createOrUpdateSuffixedApplication(
                                                                                                existingApplication,
                                                                                                existingApplication.getName(),
                                                                                                0
                                                                                        );
                                                                            }
                                                                            throw error;
                                                                        });
                                                            });
                                                });
                                    }
                                    return applicationPageService.createOrUpdateSuffixedApplication(application, application.getName(), 0);
                                })
                )
                .flatMap(savedApp -> importThemes(savedApp, importedDoc, appendToApp))
                .flatMap(savedApp -> {
                    importedApplication.setId(savedApp.getId());
                    if (savedApp.getGitApplicationMetadata() != null) {
                        importedApplication.setGitApplicationMetadata(savedApp.getGitApplicationMetadata());
                    }

                    // Import and save pages, also update the pages related fields in saved application
                    assert importedNewPageList != null : "Unable to find pages in the imported application";

                    if (appendToApp) {
                        // add existing pages to importedApplication so that they are not lost
                        // when we update application from importedApplication
                        importedApplication.setPages(savedApp.getPages());
                    }

                    // For git-sync this will not be empty
                    Mono<List<NewPage>> existingPagesMono = newPageService
                            .findNewPagesByApplicationId(importedApplication.getId(), pagePermission.getEditPermission())
                            .collectList()
                            .cache();

                    Flux<NewPage> importNewPageFlux = importAndSavePages(
                            importedNewPageList,
                            savedApp,
                            branchName,
                            existingPagesMono
                    );
                    Flux<NewPage> importedNewPagesMono;

                    if (appendToApp) {
                        // we need to rename page if there is a conflict
                        // also need to remap the renamed page
                        importedNewPagesMono = updateNewPagesBeforeMerge(existingPagesMono, importedNewPageList)
                                .flatMapMany(newToOldNameMap ->
                                        importNewPageFlux.map(newPage -> {
                                            // we need to map the newly created page with old name
                                            // because other related resources e.g. actions will refer the page with old name
                                            String newPageName = newPage.getUnpublishedPage().getName();
                                            String oldPageName = newToOldNameMap.get(newPageName);
                                            if (!newPageName.equals(oldPageName)) {
                                                renamePageInActions(importedNewActionList, oldPageName, newPageName);
                                                renamePageInActionCollections(importedActionCollectionList, oldPageName, newPageName);
                                                unpublishedPages.stream()
                                                        .filter(applicationPage -> oldPageName.equals(applicationPage.getId()))
                                                        .findAny()
                                                        .ifPresent(applicationPage -> applicationPage.setId(newPageName));
                                            }
                                            return newPage;
                                        })
                                );
                    } else {
                        importedNewPagesMono = importNewPageFlux;
                    }
                    importedNewPagesMono = importedNewPagesMono
                            .map(newPage -> {
                                // Save the map of pageName and NewPage
                                if (newPage.getUnpublishedPage() != null && newPage.getUnpublishedPage().getName() != null) {
                                    pageNameMap.put(newPage.getUnpublishedPage().getName(), newPage);
                                }
                                if (newPage.getPublishedPage() != null && newPage.getPublishedPage().getName() != null) {
                                    pageNameMap.put(newPage.getPublishedPage().getName(), newPage);
                                }
                                return newPage;
                            });

                    return importedNewPagesMono
                            .collectList()
                            .map(newPageList -> {
                                Map<ResourceModes, List<ApplicationPage>> applicationPages = new HashMap<>();
                                applicationPages.put(EDIT, unpublishedPages);
                                applicationPages.put(VIEW, publishedPages);

                                Iterator<ApplicationPage> unpublishedPageItr = unpublishedPages.iterator();
                                while (unpublishedPageItr.hasNext()) {
                                    ApplicationPage applicationPage = unpublishedPageItr.next();
                                    NewPage newPage = pageNameMap.get(applicationPage.getId());
                                    if (newPage == null) {
                                        if (appendToApp) {
                                            // Don't remove the page reference if doing the partial import and appending
                                            // to the existing application
                                            continue;
                                        }
                                        log.debug("Unable to find the page during import for appId {}, with name {}", applicationId, applicationPage.getId());
                                        unpublishedPageItr.remove();
                                    } else {
                                        applicationPage.setId(newPage.getId());
                                        applicationPage.setDefaultPageId(newPage.getDefaultResources().getPageId());
                                        // Keep the existing page as the default one
                                        if (appendToApp) {
                                            applicationPage.setIsDefault(false);
                                        }
                                    }
                                }

                                Iterator<ApplicationPage> publishedPagesItr;
                                // Remove the newly added pages from merge app flow. Keep only the existing page from the old app
                                if(appendToApp) {
                                    List<String> existingPagesId = savedApp.getPublishedPages().stream().map(applicationPage -> applicationPage.getId()).collect(Collectors.toList());
                                    List<ApplicationPage> publishedApplicationPages = publishedPages.stream().filter(applicationPage -> existingPagesId.contains(applicationPage.getId())).collect(Collectors.toList());
                                    applicationPages.replace(VIEW, publishedApplicationPages);
                                    publishedPagesItr = publishedApplicationPages.iterator();
                                } else {
                                    publishedPagesItr = publishedPages.iterator();
                                }
                                while (publishedPagesItr.hasNext()) {
                                    ApplicationPage applicationPage = publishedPagesItr.next();
                                    NewPage newPage = pageNameMap.get(applicationPage.getId());
                                    if (newPage == null) {
                                        log.debug("Unable to find the page during import for appId {}, with name {}", applicationId, applicationPage.getId());
                                        if (!appendToApp) {
                                            publishedPagesItr.remove();
                                        }
                                    } else {
                                        applicationPage.setId(newPage.getId());
                                        applicationPage.setDefaultPageId(newPage.getDefaultResources().getPageId());
                                        if (appendToApp) {
                                            applicationPage.setIsDefault(false);
                                        }
                                    }
                                }

                                return applicationPages;
                            })
                            .flatMap(applicationPages -> {
                                // During partial import/appending to the existing application keep the resources
                                // attached to the application:
                                // Delete the invalid resources (which are not the part of applicationJsonDTO) in
                                // the git flow only
                                if (!StringUtils.isEmpty(applicationId) && !appendToApp) {
                                    Set<String> validPageIds = applicationPages.get(EDIT).stream()
                                            .map(ApplicationPage::getId)
                                            .collect(Collectors.toSet());

                                    validPageIds.addAll(applicationPages.get(VIEW)
                                            .stream()
                                            .map(ApplicationPage::getId)
                                            .collect(Collectors.toSet()));

                                    return existingPagesMono
                                            .flatMap(existingPagesList -> {
                                                Set<String> invalidPageIds = new HashSet<>();
                                                for (NewPage newPage : existingPagesList) {
                                                    if (!validPageIds.contains(newPage.getId())) {
                                                        invalidPageIds.add(newPage.getId());
                                                    }
                                                }

                                                // Delete the pages which were removed during git merge operation
                                                // This does not apply to the traditional import via file approach
                                                return Flux.fromIterable(invalidPageIds)
                                                        .flatMap(applicationPageService::deleteUnpublishedPage)
                                                        .flatMap(page -> newPageService.archiveById(page.getId())
                                                                .onErrorResume(e -> {
                                                                    log.debug("Unable to archive page {} with error {}", page.getId(), e.getMessage());
                                                                    return Mono.empty();
                                                                })
                                                        )
                                                        .then()
                                                        .thenReturn(applicationPages);
                                            });
                                }
                                return Mono.just(applicationPages);
                            });
                })
                .flatMap(applicationPageMap -> {

                    // Set page sequence based on the order for published and unpublished pages
                    importedApplication.setPages(applicationPageMap.get(EDIT));
                    importedApplication.setPublishedPages(applicationPageMap.get(VIEW));
                    // This will be non-empty for GIT sync
                    return newActionRepository.findByApplicationId(importedApplication.getId())
                            .collectList();
                })
                .flatMap(existingActions ->
                        importAndSaveAction(
                                importedNewActionList,
                                existingActions,
                                importedApplication,
                                branchName,
                                pageNameMap,
                                actionIdMap,
                                pluginMap,
                                datasourceMap,
                                unpublishedCollectionIdToActionIdsMap,
                                publishedCollectionIdToActionIdsMap
                        )
                                .map(NewAction::getId)
                                .collectList()
                                .flatMap(savedActionIds -> {
                                    // Updating the existing application for git-sync
                                    // During partial import/appending to the existing application keep the resources
                                    // attached to the application:
                                    // Delete the invalid resources (which are not the part of applicationJsonDTO) in
                                    // the git flow only
                                    if (!StringUtils.isEmpty(applicationId) && !appendToApp) {
                                        // Remove unwanted actions
                                        Set<String> invalidActionIds = new HashSet<>();
                                        for (NewAction action : existingActions) {
                                            if (!savedActionIds.contains(action.getId())) {
                                                invalidActionIds.add(action.getId());
                                            }
                                        }
                                        return Flux.fromIterable(invalidActionIds)
                                                .flatMap(actionId -> newActionService.deleteUnpublishedAction(actionId)
                                                        // return an empty action so that the filter can remove it from the list
                                                        .onErrorResume(throwable -> {
                                                            log.debug("Failed to delete action with id {} during import", actionId);
                                                            log.error(throwable.getMessage());
                                                            return Mono.empty();
                                                        })
                                                )
                                                .then()
                                                .thenReturn(savedActionIds);
                                    }
                                    return Mono.just(savedActionIds);
                                })
                                .thenMany(actionCollectionRepository.findByApplicationId(importedApplication.getId()))
                                .collectList()
                )
                .flatMap(existingActionCollections -> {
                    if (importedActionCollectionList == null) {
                        return Mono.just(true);
                    }
                    Set<String> savedCollectionIds = new HashSet<>();
                    return importAndSaveActionCollection(
                            importedActionCollectionList,
                            existingActionCollections,
                            importedApplication,
                            branchName,
                            pageNameMap,
                            pluginMap,
                            unpublishedCollectionIdToActionIdsMap,
                            publishedCollectionIdToActionIdsMap,
                            appendToApp
                    )
                            .flatMap(tuple -> {
                                final String importedActionCollectionId = tuple.getT1();
                                ActionCollection savedActionCollection = tuple.getT2();
                                savedCollectionIds.add(savedActionCollection.getId());
                                return updateActionsWithImportedCollectionIds(
                                        importedActionCollectionId,
                                        savedActionCollection,
                                        unpublishedCollectionIdToActionIdsMap,
                                        publishedCollectionIdToActionIdsMap,
                                        unpublishedActionIdToCollectionIdMap,
                                        publishedActionIdToCollectionIdMap
                                );
                            })
                            .collectList()
                            .flatMap(ignore -> {
                                // Updating the existing application for git-sync
                                // During partial import/appending to the existing application keep the resources
                                // attached to the application:
                                // Delete the invalid resources (which are not the part of applicationJsonDTO) in
                                // the git flow only
                                if (!StringUtils.isEmpty(applicationId) && !appendToApp) {
                                    // Remove unwanted action collections
                                    Set<String> invalidCollectionIds = new HashSet<>();
                                    for (ActionCollection collection : existingActionCollections) {
                                        if (!savedCollectionIds.contains(collection.getId())) {
                                            invalidCollectionIds.add(collection.getId());
                                        }
                                    }
                                    return Flux.fromIterable(invalidCollectionIds)
                                            .flatMap(collectionId -> actionCollectionService.deleteUnpublishedActionCollection(collectionId)
                                                    // return an empty collection so that the filter can remove it from the list
                                                    .onErrorResume(throwable -> {
                                                        log.debug("Failed to delete collection with id {} during import", collectionId);
                                                        log.error(throwable.getMessage());
                                                        return Mono.empty();
                                                    })
                                            )
                                            .then()
                                            .thenReturn(savedCollectionIds);
                                }
                                return Mono.just(savedCollectionIds);
                            })
                            .thenReturn(true);
                })
                .flatMap(ignored -> {
                    // Don't update gitAuth as we are using @Encrypted for private key
                    importedApplication.setGitApplicationMetadata(null);
                    // Map layoutOnLoadActions ids with relevant actions
                    return newPageService.findNewPagesByApplicationId(importedApplication.getId(), pagePermission.getEditPermission())
                            .flatMap(newPage -> {
                                if (newPage.getDefaultResources() != null) {
                                    newPage.getDefaultResources().setBranchName(branchName);
                                }
                                return mapActionAndCollectionIdWithPageLayout(
                                        newPage, actionIdMap, unpublishedActionIdToCollectionIdMap, publishedActionIdToCollectionIdMap
                                );
                            })
                            .collectList()
                            .flatMapMany(newPageService::saveAll)
                            .then(applicationService.update(importedApplication.getId(), importedApplication))
                            .then(sendImportExportApplicationAnalyticsEvent(importedApplication.getId(), AnalyticsEvents.IMPORT))
                            .zipWith(currUserMono)
                            .map(tuple -> {
                                Application application = tuple.getT1();
                                stopwatch.stopTimer();
                                stopwatch.stopAndLogTimeInMillis();
                                final Map<String, Object> data = Map.of(
                                        FieldName.APPLICATION_ID, application.getId(),
                                        FieldName.ORGANIZATION_ID, application.getWorkspaceId(),
                                        "pageCount", applicationJson.getPageList().size(),
                                        "actionCount", applicationJson.getActionList().size(),
                                        "JSObjectCount", applicationJson.getActionCollectionList().size(),
                                        FieldName.FLOW_NAME, stopwatch.getFlow(),
                                        "executionTime", stopwatch.getExecutionTime()
                                );
                                analyticsService.sendEvent(AnalyticsEvents.UNIT_EXECUTION_TIME.getEventName(), tuple.getT2().getUsername(), data);
                                return application;
                            });
                })
                .onErrorResume(throwable -> {
                    log.error("Error while importing the application ", throwable.getMessage());
                    if (importedApplication.getId() != null && applicationId == null) {
                        return applicationPageService.deleteApplication(importedApplication.getId())
                                .then(Mono.error(new AppsmithException(AppsmithError.GENERIC_JSON_IMPORT_ERROR, workspaceId, throwable.getMessage())));
                    }
                    return Mono.error(new AppsmithException(AppsmithError.UNKNOWN_PLUGIN_REFERENCE));
                });

        // Import Application is currently a slow API because it needs to import and create application, pages, actions
        // and action collection. This process may take time and the client may cancel the request. This leads to the flow
        // getting stopped midway producing corrupted objects in DB. The following ensures that even though the client may have
        // cancelled the flow, the importing the application should proceed uninterrupted and whenever the user refreshes
        // the page, the imported application is available and is in sane state.
        // To achieve this, we use a synchronous sink which does not take subscription cancellations into account. This
        // means that even if the subscriber has cancelled its subscription, the create method still generates its event.
        return Mono.create(sink -> importedApplicationMono
                .subscribe(sink::success, sink::error, null, sink.currentContext())
        );
    }

    private void renamePageInActions(List<NewAction> newActionList, String oldPageName, String newPageName) {
        for (NewAction newAction : newActionList) {
            if (newAction.getUnpublishedAction().getPageId().equals(oldPageName)) {
                newAction.getUnpublishedAction().setPageId(newPageName);
            }
        }
    }

    private void renamePageInActionCollections(List<ActionCollection> actionCollectionList, String oldPageName, String newPageName) {
        for (ActionCollection actionCollection : actionCollectionList) {
            if (actionCollection.getUnpublishedCollection().getPageId().equals(oldPageName)) {
                actionCollection.getUnpublishedCollection().setPageId(newPageName);
            }
        }
    }

    /**
     * This function will respond with unique suffixed number for the entity to avoid duplicate names
     *
     * @param sourceEntity for which the suffixed number is required to avoid duplication
     * @param workspaceId  workspace in which entity should be searched
     * @return next possible number in case of duplication
     */
    private Mono<String> getUniqueSuffixForDuplicateNameEntity(BaseDomain sourceEntity, String workspaceId) {
        if (sourceEntity != null) {
            return sequenceService
                    .getNextAsSuffix(sourceEntity.getClass(), " for workspace with _id : " + workspaceId)
                    .map(sequenceNumber -> {
                        // sequence number will be empty if no duplicate is found
                        return sequenceNumber.isEmpty() ? " #1" : " #" + sequenceNumber.trim();
                    });
        }
        return Mono.just("");
    }

    /**
     * Method to
     * - save imported pages
     * - update the mongoEscapedWidgets if present in the page
     * - set the policies for the page
     * - update default resource ids along with branch-name if the application is connected to git
     *
     * @param pages         pagelist extracted from the imported JSON file
     * @param application   saved application where pages needs to be added
     * @param branchName    to which branch pages should be imported if application is connected to git
     * @param existingPages existing pages in DB if the application is connected to git
     * @return flux of saved pages in DB
     */
    private Flux<NewPage> importAndSavePages(List<NewPage> pages,
                                             Application application,
                                             String branchName,
                                             Mono<List<NewPage>> existingPages) {

        Map<String, String> oldToNewLayoutIds = new HashMap<>();
        pages.forEach(newPage -> {
            newPage.setApplicationId(application.getId());
            if (newPage.getUnpublishedPage() != null) {
                applicationPageService.generateAndSetPagePolicies(application, newPage.getUnpublishedPage());
                newPage.setPolicies(newPage.getUnpublishedPage().getPolicies());
                newPage.getUnpublishedPage().getLayouts().forEach(layout -> {
                    String layoutId = new ObjectId().toString();
                    oldToNewLayoutIds.put(layout.getId(), layoutId);
                    layout.setId(layoutId);
                });
            }

            if (newPage.getPublishedPage() != null) {
                applicationPageService.generateAndSetPagePolicies(application, newPage.getPublishedPage());
                newPage.getPublishedPage().getLayouts().forEach(layout -> {
                    String layoutId = oldToNewLayoutIds.containsKey(layout.getId())
                            ? oldToNewLayoutIds.get(layout.getId()) : new ObjectId().toString();
                    layout.setId(layoutId);
                });
            }
        });

        return existingPages.flatMapMany(existingSavedPages -> {
            Map<String, NewPage> savedPagesGitIdToPageMap = new HashMap<>();

            existingSavedPages.stream()
                    .filter(newPage -> !StringUtils.isEmpty(newPage.getGitSyncId()))
                    .forEach(newPage -> savedPagesGitIdToPageMap.put(newPage.getGitSyncId(), newPage));

            return Flux.fromIterable(pages)
                    .flatMap(newPage -> {

                        // Check if the page has gitSyncId and if it's already in DB
                        if (newPage.getGitSyncId() != null && savedPagesGitIdToPageMap.containsKey(newPage.getGitSyncId())) {
                            //Since the resource is already present in DB, just update resource
                            NewPage existingPage = savedPagesGitIdToPageMap.get(newPage.getGitSyncId());
                            copyNestedNonNullProperties(newPage, existingPage);
                            // Update branchName
                            existingPage.getDefaultResources().setBranchName(branchName);
                            // Recover the deleted state present in DB from imported page
                            existingPage.getUnpublishedPage().setDeletedAt(newPage.getUnpublishedPage().getDeletedAt());
                            existingPage.setDeletedAt(newPage.getDeletedAt());
                            existingPage.setDeleted(newPage.getDeleted());
                            return newPageService.save(existingPage);
                        } else if (application.getGitApplicationMetadata() != null) {
                            final String defaultApplicationId = application.getGitApplicationMetadata().getDefaultApplicationId();
                            return newPageService.findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, newPage.getGitSyncId(), pagePermission.getEditPermission())
                                    .switchIfEmpty(Mono.defer(() -> {
                                        // This is the first page we are saving with given gitSyncId in this instance
                                        DefaultResources defaultResources = new DefaultResources();
                                        defaultResources.setApplicationId(defaultApplicationId);
                                        defaultResources.setBranchName(branchName);
                                        newPage.setDefaultResources(defaultResources);
                                        return saveNewPageAndUpdateDefaultResources(newPage, branchName);
                                    }))
                                    .flatMap(branchedPage -> {
                                        DefaultResources defaultResources = branchedPage.getDefaultResources();
                                        // Create new page but keep defaultApplicationId and defaultPageId same for both the pages
                                        defaultResources.setBranchName(branchName);
                                        newPage.setDefaultResources(defaultResources);
                                        newPage.getUnpublishedPage().setDeletedAt(branchedPage.getUnpublishedPage().getDeletedAt());
                                        newPage.setDeletedAt(branchedPage.getDeletedAt());
                                        newPage.setDeleted(branchedPage.getDeleted());
                                        // Set policies from existing branch object
                                        newPage.setPolicies(branchedPage.getPolicies());
                                        return newPageService.save(newPage);
                                    });
                        }
                        return saveNewPageAndUpdateDefaultResources(newPage, branchName);
                    });
        });
    }

    /**
     * Method to
     * - save imported actions with updated policies
     * - update default resource ids along with branch-name if the application is connected to git
     * - update the map of imported collectionIds to the actionIds in saved in DB
     *
     * @param importedNewActionList                 action list extracted from the imported JSON file
     * @param existingActions                       actions already present in DB connected to the application
     * @param importedApplication                   imported and saved application in DB
     * @param branchName                            branch to which the actions needs to be saved if the application is connected to git
     * @param pageNameMap                           map of page name to saved page in DB
     * @param actionIdMap                           empty map which will be used to store actionIds from imported file to actual actionIds from DB
     *                                              this will eventually be used to update on page load actions
     * @param pluginMap                             map of plugin name to saved plugin id in DB
     * @param datasourceMap                         map of plugin name to saved datasource id in DB
     * @param unpublishedCollectionIdToActionIdsMap empty map which will be used to store unpublished collectionId from imported file to
     *                                              actual actionIds from DB, format for value will be <defaultActionId, actionId>
     *                                              for more details please check defaultToBranchedActionIdsMap {@link ActionCollectionDTO}
     * @param publishedCollectionIdToActionIdsMap   empty map which will be used to store published collectionId from imported file to
     *                                              actual actionIds from DB, format for value will be <defaultActionId, actionId>
     *                                              for more details please check defaultToBranchedActionIdsMap{@link ActionCollectionDTO}
     * @return saved actions in DB
     */
    private Flux<NewAction> importAndSaveAction(List<NewAction> importedNewActionList,
                                                List<NewAction> existingActions,
                                                Application importedApplication,
                                                String branchName,
                                                Map<String, NewPage> pageNameMap,
                                                Map<String, String> actionIdMap,
                                                Map<String, String> pluginMap,
                                                Map<String, String> datasourceMap,
                                                Map<String, Map<String, String>> unpublishedCollectionIdToActionIdsMap,
                                                Map<String, Map<String, String>> publishedCollectionIdToActionIdsMap) {

        Map<String, NewAction> savedActionsGitIdToActionsMap = new HashMap<>();
        final String workspaceId = importedApplication.getWorkspaceId();
        if (CollectionUtils.isEmpty(importedNewActionList)) {
            return Flux.fromIterable(new ArrayList<>());
        }
        existingActions.stream()
                .filter(newAction -> newAction.getGitSyncId() != null)
                .forEach(newAction -> savedActionsGitIdToActionsMap.put(newAction.getGitSyncId(), newAction));


        return Flux.fromIterable(importedNewActionList)
                .filter(action -> action.getUnpublishedAction() != null
                        && !StringUtils.isEmpty(action.getUnpublishedAction().getPageId()))
                .flatMap(newAction -> {
                    NewPage parentPage = new NewPage();
                    ActionDTO unpublishedAction = newAction.getUnpublishedAction();
                    ActionDTO publishedAction = newAction.getPublishedAction();

                    // If pageId is missing in the actionDTO create a fallback pageId
                    final String fallbackParentPageId = unpublishedAction.getPageId();

                    if (unpublishedAction.getValidName() != null) {
                        unpublishedAction.setId(newAction.getId());
                        parentPage = updatePageInAction(unpublishedAction, pageNameMap, actionIdMap);
                        sanitizeDatasourceInActionDTO(unpublishedAction, datasourceMap, pluginMap, workspaceId, false);
                    }

                    if (publishedAction != null && publishedAction.getValidName() != null) {
                        publishedAction.setId(newAction.getId());
                        if (StringUtils.isEmpty(publishedAction.getPageId())) {
                            publishedAction.setPageId(fallbackParentPageId);
                        }
                        NewPage publishedActionPage = updatePageInAction(publishedAction, pageNameMap, actionIdMap);
                        parentPage = parentPage == null ? publishedActionPage : parentPage;
                        sanitizeDatasourceInActionDTO(publishedAction, datasourceMap, pluginMap, workspaceId, false);
                    }

                    examplesWorkspaceCloner.makePristine(newAction);
                    newAction.setWorkspaceId(workspaceId);
                    newAction.setApplicationId(importedApplication.getId());
                    newAction.setPluginId(pluginMap.get(newAction.getPluginId()));
                    newActionService.generateAndSetActionPolicies(parentPage, newAction);

                    // Check if the action has gitSyncId and if it's already in DB
                    if (newAction.getGitSyncId() != null
                            && savedActionsGitIdToActionsMap.containsKey(newAction.getGitSyncId())) {

                        //Since the resource is already present in DB, just update resource
                        NewAction existingAction = savedActionsGitIdToActionsMap.get(newAction.getGitSyncId());
                        copyNestedNonNullProperties(newAction, existingAction);
                        // Update branchName
                        existingAction.getDefaultResources().setBranchName(branchName);
                        // Recover the deleted state present in DB from imported action
                        existingAction.getUnpublishedAction().setDeletedAt(newAction.getUnpublishedAction().getDeletedAt());
                        existingAction.setDeletedAt(newAction.getDeletedAt());
                        existingAction.setDeleted(newAction.getDeleted());
                        return newActionService.save(existingAction);
                    } else if (importedApplication.getGitApplicationMetadata() != null) {
                        final String defaultApplicationId = importedApplication.getGitApplicationMetadata().getDefaultApplicationId();
                        return newActionRepository.findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, newAction.getGitSyncId(), actionPermission.getEditPermission())
                                .switchIfEmpty(Mono.defer(() -> {
                                    // This is the first page we are saving with given gitSyncId in this instance
                                    DefaultResources defaultResources = new DefaultResources();
                                    defaultResources.setApplicationId(defaultApplicationId);
                                    defaultResources.setBranchName(branchName);
                                    newAction.setDefaultResources(defaultResources);
                                    return saveNewActionAndUpdateDefaultResources(newAction, branchName);
                                }))
                                .flatMap(branchedAction -> {
                                    DefaultResources defaultResources = branchedAction.getDefaultResources();
                                    // Create new action but keep defaultApplicationId and defaultActionId same for both the actions
                                    defaultResources.setBranchName(branchName);
                                    newAction.setDefaultResources(defaultResources);

                                    String defaultPageId = branchedAction.getUnpublishedAction() != null
                                            ? branchedAction.getUnpublishedAction().getDefaultResources().getPageId()
                                            : branchedAction.getPublishedAction().getDefaultResources().getPageId();
                                    DefaultResources defaultsDTO = new DefaultResources();
                                    defaultsDTO.setPageId(defaultPageId);
                                    if (newAction.getUnpublishedAction() != null) {
                                        newAction.getUnpublishedAction().setDefaultResources(defaultsDTO);
                                    }
                                    if (newAction.getPublishedAction() != null) {
                                        newAction.getPublishedAction().setDefaultResources(defaultsDTO);
                                    }

                                    newAction.getUnpublishedAction().setDeletedAt(branchedAction.getUnpublishedAction().getDeletedAt());
                                    newAction.setDeletedAt(branchedAction.getDeletedAt());
                                    newAction.setDeleted(branchedAction.getDeleted());
                                    // Set policies from existing branch object
                                    newAction.setPolicies(branchedAction.getPolicies());
                                    return newActionService.save(newAction);
                                });
                    }

                    return saveNewActionAndUpdateDefaultResources(newAction, branchName);
                })
                .map(newAction -> {
                    // Populate actionIdsMap to associate the appropriate actions to run on page load
                    if (newAction.getUnpublishedAction() != null) {
                        ActionDTO unpublishedAction = newAction.getUnpublishedAction();
                        actionIdMap.put(
                                actionIdMap.get(unpublishedAction.getValidName() + unpublishedAction.getPageId()),
                                newAction.getId()
                        );

                        if (unpublishedAction.getCollectionId() != null) {
                            unpublishedCollectionIdToActionIdsMap.putIfAbsent(unpublishedAction.getCollectionId(), new HashMap<>());
                            final Map<String, String> actionIds = unpublishedCollectionIdToActionIdsMap.get(unpublishedAction.getCollectionId());
                            actionIds.put(newAction.getDefaultResources().getActionId(), newAction.getId());
                        }
                    }
                    if (newAction.getPublishedAction() != null) {
                        ActionDTO publishedAction = newAction.getPublishedAction();
                        actionIdMap.put(
                                actionIdMap.get(publishedAction.getValidName() + publishedAction.getPageId()),
                                newAction.getId()
                        );

                        if (publishedAction.getCollectionId() != null) {
                            publishedCollectionIdToActionIdsMap.putIfAbsent(publishedAction.getCollectionId(), new HashMap<>());
                            final Map<String, String> actionIds = publishedCollectionIdToActionIdsMap.get(publishedAction.getCollectionId());
                            actionIds.put(newAction.getDefaultResources().getActionId(), newAction.getId());
                        }
                    }
                    return newAction;
                });
    }

    /**
     * Method to
     * - save imported actionCollections with updated policies
     * - update default resource ids along with branch-name if the application is connected to git
     *
     * @param importedActionCollectionList          action list extracted from the imported JSON file
     * @param existingActionCollections             actions already present in DB connected to the application
     * @param importedApplication                   imported and saved application in DB
     * @param branchName                            branch to which the actions needs to be saved if the application is connected to git
     * @param pageNameMap                           map of page name to saved page in DB
     * @param pluginMap                             map of plugin name to saved plugin id in DB
     * @param unpublishedCollectionIdToActionIdsMap
     * @param publishedCollectionIdToActionIdsMap   map of importedCollectionId to saved actions in DB
     *                                              <defaultActionId, actionId> for more details please check
     *                                              defaultToBranchedActionIdsMap {@link ActionCollectionDTO}
     * @return tuple of imported actionCollectionId and saved actionCollection in DB
     */
    private Flux<Tuple2<String, ActionCollection>> importAndSaveActionCollection(
            List<ActionCollection> importedActionCollectionList,
            List<ActionCollection> existingActionCollections,
            Application importedApplication,
            String branchName,
            Map<String, NewPage> pageNameMap,
            Map<String, String> pluginMap,
            Map<String, Map<String, String>> unpublishedCollectionIdToActionIdsMap,
            Map<String, Map<String, String>> publishedCollectionIdToActionIdsMap,
            boolean appendToApp) {

        final String workspaceId = importedApplication.getWorkspaceId();
        return Flux.fromIterable(importedActionCollectionList)
                .filter(actionCollection -> actionCollection.getUnpublishedCollection() != null
                        && !StringUtils.isEmpty(actionCollection.getUnpublishedCollection().getPageId()))
                .flatMap(actionCollection -> {
                    final String importedActionCollectionId = actionCollection.getId();
                    NewPage parentPage = new NewPage();
                    final ActionCollectionDTO unpublishedCollection = actionCollection.getUnpublishedCollection();
                    final ActionCollectionDTO publishedCollection = actionCollection.getPublishedCollection();

                    // If pageId is missing in the actionCollectionDTO create a fallback pageId
                    final String fallbackParentPageId = unpublishedCollection.getPageId();

                    if (unpublishedCollection.getName() != null) {
                        unpublishedCollection.setDefaultToBranchedActionIdsMap(unpublishedCollectionIdToActionIdsMap.get(importedActionCollectionId));
                        unpublishedCollection.setPluginId(pluginMap.get(unpublishedCollection.getPluginId()));
                        parentPage = updatePageInActionCollection(unpublishedCollection, pageNameMap);
                    }

                    if (publishedCollection != null && publishedCollection.getName() != null) {
                        publishedCollection.setDefaultToBranchedActionIdsMap(publishedCollectionIdToActionIdsMap.get(importedActionCollectionId));
                        publishedCollection.setPluginId(pluginMap.get(publishedCollection.getPluginId()));
                        if (StringUtils.isEmpty(publishedCollection.getPageId())) {
                            publishedCollection.setPageId(fallbackParentPageId);
                        }
                        NewPage publishedCollectionPage = updatePageInActionCollection(publishedCollection, pageNameMap);
                        parentPage = parentPage == null ? publishedCollectionPage : parentPage;
                    }

                    examplesWorkspaceCloner.makePristine(actionCollection);
                    actionCollection.setWorkspaceId(workspaceId);
                    actionCollection.setApplicationId(importedApplication.getId());
                    actionCollectionService.generateAndSetPolicies(parentPage, actionCollection);

                    Map<String, ActionCollection> savedActionCollectionGitIdToCollectionsMap = new HashMap<>();

                    existingActionCollections.stream()
                            .filter(collection -> collection.getGitSyncId() != null)
                            .forEach(collection -> savedActionCollectionGitIdToCollectionsMap.put(collection.getGitSyncId(), collection));
                    // Check if the action has gitSyncId and if it's already in DB
                    if (actionCollection.getGitSyncId() != null
                            && savedActionCollectionGitIdToCollectionsMap.containsKey(actionCollection.getGitSyncId())) {

                        //Since the resource is already present in DB, just update resource
                        ActionCollection existingActionCollection = savedActionCollectionGitIdToCollectionsMap.get(actionCollection.getGitSyncId());
                        copyNestedNonNullProperties(actionCollection, existingActionCollection);
                        // Update branchName
                        existingActionCollection.getDefaultResources().setBranchName(branchName);
                        // Recover the deleted state present in DB from imported actionCollection
                        existingActionCollection.getUnpublishedCollection().setDeletedAt(actionCollection.getUnpublishedCollection().getDeletedAt());
                        existingActionCollection.setDeletedAt(actionCollection.getDeletedAt());
                        existingActionCollection.setDeleted(actionCollection.getDeleted());
                        return Mono.zip(
                                Mono.just(importedActionCollectionId),
                                actionCollectionService.save(existingActionCollection)
                        );
                    } else if (importedApplication.getGitApplicationMetadata() != null) {
                        final String defaultApplicationId = importedApplication.getGitApplicationMetadata().getDefaultApplicationId();
                        return actionCollectionRepository.findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, actionCollection.getGitSyncId(), actionPermission.getEditPermission())
                                .switchIfEmpty(Mono.defer(() -> {
                                    // This is the first page we are saving with given gitSyncId in this instance
                                    DefaultResources defaultResources = new DefaultResources();
                                    defaultResources.setApplicationId(defaultApplicationId);
                                    defaultResources.setBranchName(branchName);
                                    actionCollection.setDefaultResources(defaultResources);
                                    return saveNewCollectionAndUpdateDefaultResources(actionCollection, branchName);
                                }))
                                .flatMap(branchedActionCollection -> {
                                    DefaultResources defaultResources = branchedActionCollection.getDefaultResources();
                                    // Create new action but keep defaultApplicationId and defaultActionId same for both the actions
                                    defaultResources.setBranchName(branchName);
                                    actionCollection.setDefaultResources(defaultResources);

                                    String defaultPageId = branchedActionCollection.getUnpublishedCollection() != null
                                            ? branchedActionCollection.getUnpublishedCollection().getDefaultResources().getPageId()
                                            : branchedActionCollection.getPublishedCollection().getDefaultResources().getPageId();
                                    DefaultResources defaultsDTO = new DefaultResources();
                                    defaultsDTO.setPageId(defaultPageId);
                                    if (actionCollection.getUnpublishedCollection() != null) {
                                        actionCollection.getUnpublishedCollection().setDefaultResources(defaultsDTO);
                                    }
                                    if (actionCollection.getPublishedCollection() != null) {
                                        actionCollection.getPublishedCollection().setDefaultResources(defaultsDTO);
                                    }
                                    actionCollection.getUnpublishedCollection()
                                            .setDeletedAt(branchedActionCollection.getUnpublishedCollection().getDeletedAt());
                                    actionCollection.setDeletedAt(branchedActionCollection.getDeletedAt());
                                    actionCollection.setDeleted(branchedActionCollection.getDeleted());
                                    // Set policies from existing branch object
                                    actionCollection.setPolicies(branchedActionCollection.getPolicies());
                                    return Mono.zip(
                                            Mono.just(importedActionCollectionId),
                                            actionCollectionService.save(actionCollection)
                                    );
                                });
                    }

                    return Mono.zip(
                            Mono.just(importedActionCollectionId),
                            saveNewCollectionAndUpdateDefaultResources(actionCollection, branchName)
                    );
                });
    }

    private Flux<NewAction> updateActionsWithImportedCollectionIds(
            String importedActionCollectionId,
            ActionCollection savedActionCollection,
            Map<String, Map<String, String>> unpublishedCollectionIdToActionIdsMap,
            Map<String, Map<String, String>> publishedCollectionIdToActionIdsMap,
            Map<String, List<String>> unpublishedActionIdToCollectionIdMap,
            Map<String, List<String>> publishedActionIdToCollectionIdMap) {

        final String savedActionCollectionId = savedActionCollection.getId();
        final String defaultCollectionId = savedActionCollection.getDefaultResources().getCollectionId();
        List<String> collectionIds = List.of(savedActionCollectionId, defaultCollectionId);
        unpublishedCollectionIdToActionIdsMap
                .getOrDefault(importedActionCollectionId, Map.of())
                .forEach((defaultActionId, actionId) -> {
                    unpublishedActionIdToCollectionIdMap.putIfAbsent(actionId, collectionIds);
                });
        publishedCollectionIdToActionIdsMap
                .getOrDefault(importedActionCollectionId, Map.of())
                .forEach((defaultActionId, actionId) -> {
                    publishedActionIdToCollectionIdMap.putIfAbsent(actionId, collectionIds);
                });
        final HashSet<String> actionIds = new HashSet<>();
        actionIds.addAll(unpublishedActionIdToCollectionIdMap.keySet());
        actionIds.addAll(publishedActionIdToCollectionIdMap.keySet());
        return Flux.fromIterable(actionIds)
                .flatMap(actionId -> newActionRepository.findById(actionId, actionPermission.getEditPermission()))
                .map(newAction -> {
                    // Update collectionId and defaultCollectionIds in actionDTOs
                    ActionDTO unpublishedAction = newAction.getUnpublishedAction();
                    ActionDTO publishedAction = newAction.getPublishedAction();
                    if (!CollectionUtils.sizeIsEmpty(unpublishedActionIdToCollectionIdMap)
                            && !CollectionUtils.isEmpty(unpublishedActionIdToCollectionIdMap.get(newAction.getId()))) {

                        unpublishedAction.setCollectionId(
                                unpublishedActionIdToCollectionIdMap.get(newAction.getId()).get(0)
                        );
                        if (unpublishedAction.getDefaultResources() != null
                                && StringUtils.isEmpty(unpublishedAction.getDefaultResources().getCollectionId())) {

                            unpublishedAction.getDefaultResources().setCollectionId(
                                    unpublishedActionIdToCollectionIdMap.get(newAction.getId()).get(1)
                            );
                        }
                    }
                    if (!CollectionUtils.sizeIsEmpty(publishedActionIdToCollectionIdMap)
                            && !CollectionUtils.isEmpty(publishedActionIdToCollectionIdMap.get(newAction.getId()))) {

                        publishedAction.setCollectionId(
                                publishedActionIdToCollectionIdMap.get(newAction.getId()).get(0)
                        );

                        if (publishedAction.getDefaultResources() != null
                                && StringUtils.isEmpty(publishedAction.getDefaultResources().getCollectionId())) {

                            publishedAction.getDefaultResources().setCollectionId(
                                    publishedActionIdToCollectionIdMap.get(newAction.getId()).get(1)
                            );
                        }
                    }
                    return newAction;
                })
                .collectList()
                .flatMapMany(newActionService::saveAll);
    }

    private Mono<NewPage> saveNewPageAndUpdateDefaultResources(NewPage newPage, String branchName) {
        NewPage update = new NewPage();
        return newPageService.save(newPage)
                .flatMap(page -> {
                    update.setDefaultResources(DefaultResourcesUtils.createDefaultIdsOrUpdateWithGivenResourceIds(page, branchName).getDefaultResources());
                    return newPageService.update(page.getId(), update);
                });
    }

    private Mono<NewAction> saveNewActionAndUpdateDefaultResources(NewAction newAction, String branchName) {
        return newActionService.save(newAction)
                .flatMap(action -> {
                    NewAction update = new NewAction();
                    update.setDefaultResources(
                            DefaultResourcesUtils
                                    .createDefaultIdsOrUpdateWithGivenResourceIds(action, branchName).getDefaultResources()
                    );
                    return newActionService.update(action.getId(), update);
                });
    }

    private Mono<ActionCollection> saveNewCollectionAndUpdateDefaultResources(ActionCollection actionCollection, String branchName) {
        return actionCollectionService.create(actionCollection)
                .flatMap(actionCollection1 -> {
                    ActionCollection update = new ActionCollection();
                    update.setDefaultResources(
                            DefaultResourcesUtils
                                    .createDefaultIdsOrUpdateWithGivenResourceIds(actionCollection1, branchName)
                                    .getDefaultResources()
                    );
                    return actionCollectionService.update(actionCollection1.getId(), update);
                });
    }

    private NewPage updatePageInAction(ActionDTO action,
                                       Map<String, NewPage> pageNameMap,
                                       Map<String, String> actionIdMap) {
        NewPage parentPage = pageNameMap.get(action.getPageId());
        if (parentPage == null) {
            return null;
        }
        actionIdMap.put(action.getValidName() + parentPage.getId(), action.getId());
        action.setPageId(parentPage.getId());

        // Update defaultResources in actionDTO
        DefaultResources defaultResources = new DefaultResources();
        defaultResources.setPageId(parentPage.getDefaultResources().getPageId());
        action.setDefaultResources(defaultResources);

        return parentPage;
    }

    private NewPage updatePageInActionCollection(ActionCollectionDTO collectionDTO,
                                                 Map<String, NewPage> pageNameMap) {
        NewPage parentPage = pageNameMap.get(collectionDTO.getPageId());
        if (parentPage == null) {
            return null;
        }
        collectionDTO.setPageId(parentPage.getId());

        // Update defaultResources in actionCollectionDTO
        DefaultResources defaultResources = new DefaultResources();
        defaultResources.setPageId(parentPage.getDefaultResources().getPageId());
        collectionDTO.setDefaultResources(defaultResources);

        return parentPage;
    }

    /**
     * This function will be used to sanitise datasource within the actionDTO
     *
     * @param actionDTO     for which the datasource needs to be sanitised as per import format expected
     * @param datasourceMap datasource id to name map
     * @param pluginMap     plugin id to name map
     * @param workspaceId   workspace in which the application supposed to be imported
     * @return
     */
    private String sanitizeDatasourceInActionDTO(ActionDTO actionDTO,
                                                 Map<String, String> datasourceMap,
                                                 Map<String, String> pluginMap,
                                                 String workspaceId,
                                                 boolean isExporting) {

        if (actionDTO != null && actionDTO.getDatasource() != null) {

            Datasource ds = actionDTO.getDatasource();
            if (isExporting) {
                ds.setUpdatedAt(null);
            }
            if (ds.getId() != null) {
                //Mapping ds name in id field
                ds.setId(datasourceMap.get(ds.getId()));
                ds.setWorkspaceId(null);
                if (ds.getPluginId() != null) {
                    ds.setPluginId(pluginMap.get(ds.getPluginId()));
                }
                return ds.getId();
            } else {
                // This means we don't have regular datasource it can be simple REST_API and will also be used when
                // importing the action to populate the data
                ds.setWorkspaceId(workspaceId);
                ds.setPluginId(pluginMap.get(ds.getPluginId()));
                return "";
            }
        }

        return "";
    }

    // This method will update the action id in saved page for layoutOnLoadAction
    private Mono<NewPage> mapActionAndCollectionIdWithPageLayout(NewPage page,
                                                                 Map<String, String> actionIdMap,
                                                                 Map<String, List<String>> unpublishedActionIdToCollectionIdsMap,
                                                                 Map<String, List<String>> publishedActionIdToCollectionIdsMap) {

        Set<String> layoutOnLoadActions = new HashSet<>();
        if (page.getUnpublishedPage().getLayouts() != null) {

            page.getUnpublishedPage().getLayouts().forEach(layout -> {
                if (layout.getLayoutOnLoadActions() != null) {
                    layout.getLayoutOnLoadActions().forEach(onLoadAction -> onLoadAction
                            .forEach(actionDTO -> {
                                actionDTO.setId(actionIdMap.get(actionDTO.getId()));
                                if (!CollectionUtils.sizeIsEmpty(unpublishedActionIdToCollectionIdsMap)
                                        && !CollectionUtils.isEmpty(unpublishedActionIdToCollectionIdsMap.get(actionDTO.getId()))) {
                                    actionDTO.setCollectionId(unpublishedActionIdToCollectionIdsMap.get(actionDTO.getId()).get(0));
                                }
                                layoutOnLoadActions.add(actionDTO.getId());
                            }));
                }
            });
        }

        if (page.getPublishedPage() != null && page.getPublishedPage().getLayouts() != null) {

            page.getPublishedPage().getLayouts().forEach(layout -> {
                if (layout.getLayoutOnLoadActions() != null) {
                    layout.getLayoutOnLoadActions().forEach(onLoadAction -> onLoadAction
                            .forEach(actionDTO -> {
                                actionDTO.setId(actionIdMap.get(actionDTO.getId()));
                                if (!CollectionUtils.sizeIsEmpty(publishedActionIdToCollectionIdsMap)
                                        && !CollectionUtils.isEmpty(publishedActionIdToCollectionIdsMap.get(actionDTO.getId()))) {
                                    actionDTO.setCollectionId(publishedActionIdToCollectionIdsMap.get(actionDTO.getId()).get(0));
                                }
                                layoutOnLoadActions.add(actionDTO.getId());
                            }));
                }
            });
        }

        layoutOnLoadActions.remove(null);
        return Flux.fromIterable(layoutOnLoadActions)
                .flatMap(newActionService::findById)
                .map(newAction -> {
                    final String defaultActionId = newAction.getDefaultResources().getActionId();
                    if (page.getUnpublishedPage().getLayouts() != null) {
                        final String defaultCollectionId = newAction.getUnpublishedAction().getDefaultResources().getCollectionId();
                        page.getUnpublishedPage().getLayouts().forEach(layout -> {
                            if (layout.getLayoutOnLoadActions() != null) {
                                layout.getLayoutOnLoadActions()
                                        .forEach(onLoadAction -> onLoadAction
                                                .stream()
                                                .filter(actionDTO -> StringUtils.equals(actionDTO.getId(), newAction.getId()))
                                                .forEach(actionDTO -> {
                                                    actionDTO.setDefaultActionId(defaultActionId);
                                                    actionDTO.setDefaultCollectionId(defaultCollectionId);
                                                })
                                        );
                            }
                        });
                    }

                    if (page.getPublishedPage() != null && page.getPublishedPage().getLayouts() != null) {
                        page.getPublishedPage().getLayouts().forEach(layout -> {
                            if (layout.getLayoutOnLoadActions() != null) {
                                layout.getLayoutOnLoadActions().forEach(onLoadAction -> onLoadAction
                                        .stream()
                                        .filter(actionDTO -> StringUtils.equals(actionDTO.getId(), newAction.getId()))
                                        .forEach(actionDTO -> {
                                            actionDTO.setDefaultActionId(defaultActionId);
                                            if (newAction.getPublishedAction() != null
                                                    && newAction.getPublishedAction().getDefaultResources() != null) {
                                                actionDTO.setDefaultCollectionId(
                                                        newAction.getPublishedAction().getDefaultResources().getCollectionId()
                                                );
                                            }
                                        })
                                );
                            }
                        });
                    }
                    return newAction;
                })
                .then(Mono.just(page));
    }

    /**
     * This will check if the datasource is already present in the workspace and create a new one if unable to find one
     *
     * @param existingDatasourceFlux already present datasource in the workspace
     * @param datasource             which will be checked against existing datasources
     * @param workspaceId            workspace where duplicate datasource should be checked
     * @return already present or brand new datasource depending upon the equality check
     */
    private Mono<Datasource> createUniqueDatasourceIfNotPresent(Flux<Datasource> existingDatasourceFlux,
                                                                Datasource datasource,
                                                                String workspaceId) {
        /*
            1. If same datasource is present return
            2. If unable to find the datasource create a new datasource with unique name and return
         */
        final DatasourceConfiguration datasourceConfig = datasource.getDatasourceConfiguration();
        AuthenticationResponse authResponse = new AuthenticationResponse();
        if (datasourceConfig != null && datasourceConfig.getAuthentication() != null) {
            copyNestedNonNullProperties(
                    datasourceConfig.getAuthentication().getAuthenticationResponse(), authResponse);
            datasourceConfig.getAuthentication().setAuthenticationResponse(null);
            datasourceConfig.getAuthentication().setAuthenticationType(null);
        }

        return existingDatasourceFlux
                // For git import exclude datasource configuration
                .filter(ds -> ds.getName().equals(datasource.getName()) && datasource.getPluginId().equals(ds.getPluginId()))
                .next()  // Get the first matching datasource, we don't need more than one here.
                .switchIfEmpty(Mono.defer(() -> {
                    if (datasourceConfig != null && datasourceConfig.getAuthentication() != null) {
                        datasourceConfig.getAuthentication().setAuthenticationResponse(authResponse);
                    }
                    // No matching existing datasource found, so create a new one.
                    datasource.setIsConfigured(datasourceConfig != null && datasourceConfig.getAuthentication() != null);
                    return datasourceService
                            .findByNameAndWorkspaceId(datasource.getName(), workspaceId, datasourcePermission.getEditPermission())
                            .flatMap(duplicateNameDatasource ->
                                    getUniqueSuffixForDuplicateNameEntity(duplicateNameDatasource, workspaceId)
                            )
                            .map(suffix -> {
                                datasource.setName(datasource.getName() + suffix);
                                return datasource;
                            })
                            .then(datasourceService.create(datasource));
                }));
    }

    /**
     * Here we will be rehydrating the sensitive fields like password, secrets etc. in datasource while importing the application
     *
     * @param datasource      for which sensitive fields should be rehydrated
     * @param decryptedFields sensitive fields
     * @return updated datasource with rehydrated sensitive fields
     */
    private Datasource updateAuthenticationDTO(Datasource datasource, DecryptedSensitiveFields decryptedFields) {

        final DatasourceConfiguration dsConfig = datasource.getDatasourceConfiguration();
        String authType = decryptedFields.getAuthType();
        if (dsConfig == null || authType == null) {
            return datasource;
        }

        if (StringUtils.equals(authType, DBAuth.class.getName())) {
            final DBAuth dbAuth = decryptedFields.getDbAuth();
            dbAuth.setPassword(decryptedFields.getPassword());
            datasource.getDatasourceConfiguration().setAuthentication(dbAuth);
        } else if (StringUtils.equals(authType, BasicAuth.class.getName())) {
            final BasicAuth basicAuth = decryptedFields.getBasicAuth();
            basicAuth.setPassword(decryptedFields.getPassword());
            datasource.getDatasourceConfiguration().setAuthentication(basicAuth);
        } else if (StringUtils.equals(authType, OAuth2.class.getName())) {
            OAuth2 auth2 = decryptedFields.getOpenAuth2();
            AuthenticationResponse authResponse = new AuthenticationResponse();
            auth2.setClientSecret(decryptedFields.getPassword());
            authResponse.setToken(decryptedFields.getToken());
            authResponse.setRefreshToken(decryptedFields.getRefreshToken());
            authResponse.setTokenResponse(decryptedFields.getTokenResponse());
            authResponse.setExpiresAt(Instant.now());
            auth2.setAuthenticationResponse(authResponse);
            datasource.getDatasourceConfiguration().setAuthentication(auth2);
        }
        return datasource;
    }

    private Mono<Application> importThemes(Application application, ApplicationJson importedApplicationJson, boolean appendToApp) {
        if (appendToApp) {
            // appending to existing app, theme should not change
            return Mono.just(application);
        }
        return themeService.importThemesToApplication(application, importedApplicationJson);
    }

    /**
     * This will be used to dehydrate sensitive fields from the datasource while exporting the application
     *
     * @param datasource entity from which sensitive fields need to be dehydrated
     * @return sensitive fields which then will be deserialized and exported in JSON file
     */
    private DecryptedSensitiveFields getDecryptedFields(Datasource datasource) {
        final AuthenticationDTO authentication = datasource.getDatasourceConfiguration() == null
                ? null : datasource.getDatasourceConfiguration().getAuthentication();

        if (authentication != null) {
            DecryptedSensitiveFields dsDecryptedFields =
                    authentication.getAuthenticationResponse() == null
                            ? new DecryptedSensitiveFields()
                            : new DecryptedSensitiveFields(authentication.getAuthenticationResponse());

            if (authentication instanceof DBAuth) {
                DBAuth auth = (DBAuth) authentication;
                dsDecryptedFields.setPassword(auth.getPassword());
                dsDecryptedFields.setDbAuth(auth);
            } else if (authentication instanceof OAuth2) {
                OAuth2 auth = (OAuth2) authentication;
                dsDecryptedFields.setPassword(auth.getClientSecret());
                dsDecryptedFields.setOpenAuth2(auth);
            } else if (authentication instanceof BasicAuth) {
                BasicAuth auth = (BasicAuth) authentication;
                dsDecryptedFields.setPassword(auth.getPassword());
                dsDecryptedFields.setBasicAuth(auth);
            }
            dsDecryptedFields.setAuthType(authentication.getClass().getName());
            return dsDecryptedFields;
        }
        return null;
    }

    public Mono<List<Datasource>> findDatasourceByApplicationId(String applicationId, String workspaceId) {
        // TODO: Investigate further why datasourcePermission.getReadPermission() is not being used.
        Mono<List<Datasource>> listMono = datasourceService.findAllByWorkspaceId(workspaceId, datasourcePermission.getEditPermission()).collectList();
        return newActionService.findAllByApplicationIdAndViewMode(applicationId, false, actionPermission.getReadPermission(), null)
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

    /**
     * @param applicationId   default ID of the application where this ApplicationJSON is going to get merged with
     * @param branchName      name of the branch of the application where this ApplicationJSON is going to get merged with
     * @param applicationJson ApplicationJSON of the application that will be merged to
     * @param pagesToImport   Name of the pages that should be merged from the ApplicationJSON.
     *                        If null or empty, all pages will be merged.
     * @return Merged Application
     */
    @Override
    public Mono<Application> mergeApplicationJsonWithApplication(String workspaceId,
                                                                 String applicationId,
                                                                 String branchName,
                                                                 ApplicationJson applicationJson,
                                                                 List<String> pagesToImport) {
        // Update the application JSON to prepare it for merging inside an existing application
        if (applicationJson.getExportedApplication() != null) {
            // setting some properties to null so that target application is not updated by these properties
            applicationJson.getExportedApplication().setName(null);
            applicationJson.getExportedApplication().setSlug(null);
            applicationJson.getExportedApplication().setForkingEnabled(null);
            applicationJson.getExportedApplication().setClonedFromApplicationId(null);
        }

        // need to remove git sync id. Also filter pages if pageToImport is not empty
        if (applicationJson.getPageList() != null) {
            List<ApplicationPage> applicationPageList = new ArrayList<>(applicationJson.getPageList().size());
            List<String> pageNames = new ArrayList<>(applicationJson.getPageList().size());
            List<NewPage> importedNewPageList = applicationJson.getPageList().stream()
                    .filter(newPage -> newPage.getUnpublishedPage() != null &&
                            (CollectionUtils.isEmpty(pagesToImport) ||
                                    pagesToImport.contains(newPage.getUnpublishedPage().getName()))
                    )
                    .peek(newPage -> {
                        ApplicationPage applicationPage = new ApplicationPage();
                        applicationPage.setId(newPage.getUnpublishedPage().getName());
                        applicationPage.setIsDefault(false);
                        applicationPageList.add(applicationPage);
                        pageNames.add(applicationPage.getId());
                    })
                    .peek(newPage -> newPage.setGitSyncId(null))
                    .collect(Collectors.toList());
            applicationJson.setPageList(importedNewPageList);
            // Remove the pages from the exported Application inside the json based on the pagesToImport
            applicationJson.getExportedApplication().setPages(applicationPageList);
            applicationJson.getExportedApplication().setPublishedPages(applicationPageList);
//            if (!CollectionUtils.isEmpty(applicationJson.getExportedApplication().getPages())) {
//                applicationJson.getExportedApplication().getPages().addAll(applicationPageList);
//            } else {
//                // If the pages are not emebedded inside the application object we have to add these to pageOrder as
//                // JSONSchema migration only works with pageOrder
//                applicationJson.getPageOrder().addAll(pageNames);
//            }
        }
        if (applicationJson.getActionList() != null) {
            List<NewAction> importedNewActionList = applicationJson.getActionList().stream()
                    .filter(newAction ->
                            newAction.getUnpublishedAction() != null &&
                                    (CollectionUtils.isEmpty(pagesToImport) ||
                                            pagesToImport.contains(newAction.getUnpublishedAction().getPageId()))
                    ).peek(newAction -> newAction.setGitSyncId(null)) // setting this null so that this action can be imported again
                    .collect(Collectors.toList());
            applicationJson.setActionList(importedNewActionList);
        }
        if (applicationJson.getActionCollectionList() != null) {
            List<ActionCollection> importedActionCollectionList = applicationJson.getActionCollectionList().stream()
                    .filter(actionCollection ->
                            (CollectionUtils.isEmpty(pagesToImport) ||
                                    pagesToImport.contains(actionCollection.getUnpublishedCollection().getPageId()))
                    ).peek(actionCollection -> actionCollection.setGitSyncId(null)) // setting this null so that this action collection can be imported again
                    .collect(Collectors.toList());
            applicationJson.setActionCollectionList(importedActionCollectionList);
        }

        return importApplicationInWorkspace(workspaceId, applicationJson, applicationId, branchName, true);
    }

    private Mono<Map<String, String>> updateNewPagesBeforeMerge(Mono<List<NewPage>> existingPagesMono, List<NewPage> newPagesList) {
        return existingPagesMono.map(newPages -> {
            Map<String, String> newToOldToPageNameMap = new HashMap<>(); // maps new names with old names

            // get a list of unpublished page names that already exists
            List<String> unpublishedPageNames = newPages.stream()
                    .filter(newPage -> newPage.getUnpublishedPage() != null)
                    .map(newPage -> newPage.getUnpublishedPage().getName())
                    .collect(Collectors.toList());

            // modify each new page
            for (NewPage newPage : newPagesList) {
                newPage.setPublishedPage(null); // we'll not merge published pages so removing this

                // let's check if page name conflicts, rename in that case
                String oldPageName = newPage.getUnpublishedPage().getName(),
                        newPageName = newPage.getUnpublishedPage().getName();

                int i = 1;
                while (unpublishedPageNames.contains(newPageName)) {
                    i++;
                    newPageName = oldPageName + i;
                }
                newPage.getUnpublishedPage().setName(newPageName); // set new name. may be same as before or not
                newPage.getUnpublishedPage().setSlug(TextUtils.makeSlug(newPageName)); // set the slug also
                newToOldToPageNameMap.put(newPageName, oldPageName); // map: new name -> old name
            }
            return newToOldToPageNameMap;
        });
    }

    /**
     * To send analytics event for import and export of application
     *
     * @param applicationId Id of application being imported or exported
     * @param event         AnalyticsEvents event
     * @return The application which is imported or exported
     */
    private Mono<Application> sendImportExportApplicationAnalyticsEvent(String applicationId, AnalyticsEvents event) {

        return applicationService.findById(applicationId, applicationPermission.getReadPermission())
                .flatMap(application -> {
                    return Mono.zip(Mono.just(application), workspaceService.getById(application.getWorkspaceId()));
                })
                .flatMap(tuple -> {
                    Application application = tuple.getT1();
                    Workspace workspace = tuple.getT2();
                    final Map<String, Object> eventData = Map.of(
                            FieldName.APPLICATION, application,
                            FieldName.WORKSPACE, workspace
                    );

                    final Map<String, Object> data = Map.of(
                            FieldName.APPLICATION_ID, application.getId(),
                            FieldName.WORKSPACE_ID, workspace.getId(),
                            FieldName.EVENT_DATA, eventData
                    );

                    return analyticsService.sendObjectEvent(event, application, data);
                });
    }
}
