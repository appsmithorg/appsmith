package com.appsmith.server.solutions.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.AuthenticationResponse;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.BasicAuth;
import com.appsmith.external.models.BearerTokenAuth;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.DecryptedSensitiveFields;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ExportFileDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.ce.ImportActionCollectionResultDTO;
import com.appsmith.server.dtos.ce.ImportActionResultDTO;
import com.appsmith.server.dtos.ce.ImportedActionAndCollectionMapsDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.DefaultResourcesUtils;
import com.appsmith.server.helpers.ImportExportUtils;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.helpers.ce.ImportApplicationPermissionProvider;
import com.appsmith.server.migrations.ApplicationVersion;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.CustomJSLibService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.DatasourceStorageService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.SequenceService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.ThemeService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.GitConstants.NAME_SEPARATOR;
import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;
import static com.appsmith.server.acl.AclPermission.READ_THEMES;
import static com.appsmith.server.constants.ResourceModes.EDIT;
import static com.appsmith.server.constants.ResourceModes.VIEW;
import static com.appsmith.server.helpers.ImportExportUtils.sanitizeDatasourceInActionDTO;
import static com.appsmith.server.helpers.ImportExportUtils.setPropertiesToExistingApplication;
import static java.lang.Boolean.TRUE;

@Slf4j
@RequiredArgsConstructor
public class ImportExportApplicationServiceCEImpl implements ImportExportApplicationServiceCE {

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
    private final DatasourceStorageService datasourceStorageService;
    private final PermissionGroupRepository permissionGroupRepository;

    private static final Set<MediaType> ALLOWED_CONTENT_TYPES = Set.of(MediaType.APPLICATION_JSON);
    private static final String INVALID_JSON_FILE = "invalid json file";

    /**
     * This function will give the application resource to rebuild the application in import application flow
     *
     * @param applicationId which needs to be exported
     * @return application reference from which entire application can be rehydrated
     */
    public Mono<ApplicationJson> exportApplicationById(
            String applicationId, SerialiseApplicationObjective serialiseFor) {

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
        AtomicReference<Boolean> exportWithConfiguration = new AtomicReference<>(false);

        // If Git-sync, then use MANAGE_APPLICATIONS, else use EXPORT_APPLICATION permission to fetch application
        AclPermission permission =
                isGitSync ? applicationPermission.getEditPermission() : applicationPermission.getExportPermission();

        Mono<User> currentUserMono = sessionUserService.getCurrentUser().cache();

        Mono<Application> applicationMono =
                // Find the application with appropriate permission
                applicationService
                        .findById(applicationId, permission)
                        // Find the application without permissions if it is a template application
                        .switchIfEmpty(applicationService.findByIdAndExportWithConfiguration(applicationId, TRUE))
                        .switchIfEmpty(Mono.error(new AppsmithException(
                                AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION_ID, applicationId)))
                        .map(application -> {
                            if (!TRUE.equals(application.getExportWithConfiguration())) {
                                // Explicitly setting the boolean to avoid NPE for future checks
                                application.setExportWithConfiguration(false);
                            }
                            exportWithConfiguration.set(application.getExportWithConfiguration());
                            return application;
                        })
                        .cache();

        Mono<String> defaultEnvironmentIdMono = applicationService
                .findById(applicationId)
                .flatMap(application -> workspaceService.getDefaultEnvironmentId(application.getWorkspaceId()));

        /**
         * Since we are exporting for git, we only consider unpublished JS libraries
         * Ref: https://theappsmith.slack.com/archives/CGBPVEJ5C/p1672225134025919
         */
        Mono<List<CustomJSLib>> allCustomJSLibListMono = customJSLibService
                .getAllJSLibsInApplicationForExport(applicationId, null, false)
                .zipWith(applicationMono)
                .map(tuple2 -> {
                    Application application = tuple2.getT2();
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    Instant applicationLastCommittedAt =
                            gitApplicationMetadata != null ? gitApplicationMetadata.getLastCommittedAt() : null;

                    List<CustomJSLib> unpublishedCustomJSLibList = tuple2.getT1();
                    List<String> updatedCustomJSLibList;
                    if (applicationLastCommittedAt != null) {
                        updatedCustomJSLibList = unpublishedCustomJSLibList.stream()
                                .filter(lib -> lib.getUpdatedAt() == null
                                        || applicationLastCommittedAt.isBefore(lib.getUpdatedAt()))
                                .map(lib -> lib.getUidString())
                                .collect(Collectors.toList());
                    } else {
                        updatedCustomJSLibList = unpublishedCustomJSLibList.stream()
                                .map(lib -> lib.getUidString())
                                .collect(Collectors.toList());
                    }
                    applicationJson
                            .getUpdatedResources()
                            .put(FieldName.CUSTOM_JS_LIB_LIST, new HashSet<>(updatedCustomJSLibList));

                    /**
                     * Previously it was a Set and as Set is an unordered collection of elements that
                     * resulted in uncommitted changes. Making it a list and sorting it by the UidString
                     * ensure that the order will be maintained. And this solves the issue.
                     */
                    Collections.sort(unpublishedCustomJSLibList, Comparator.comparing(CustomJSLib::getUidString));
                    return unpublishedCustomJSLibList;
                });

        // Set json schema version which will be used to check the compatibility while importing the JSON
        applicationJson.setServerSchemaVersion(JsonSchemaVersions.serverVersion);
        applicationJson.setClientSchemaVersion(JsonSchemaVersions.clientVersion);

        Mono<Theme> defaultThemeMono = themeService
                .getSystemTheme(Theme.DEFAULT_THEME_NAME)
                .map(theme -> {
                    log.debug("Default theme found: {}", theme.getName());
                    return theme;
                })
                .cache();

        return pluginRepository
                .findAll()
                .map(plugin -> {
                    pluginMap.put(
                            plugin.getId(),
                            plugin.getPluginName() == null ? plugin.getPackageName() : plugin.getPluginName());
                    return plugin;
                })
                .then(applicationMono)
                .flatMap(application -> themeService
                        .getThemeById(application.getEditModeThemeId(), READ_THEMES)
                        .switchIfEmpty(defaultThemeMono) // setting default theme if theme is missing
                        .zipWith(
                                themeService
                                        .getThemeById(application.getPublishedModeThemeId(), READ_THEMES)
                                        .switchIfEmpty(defaultThemeMono) // setting default theme if theme is missing
                                )
                        .map(themesTuple -> {
                            Theme editModeTheme = themesTuple.getT1();
                            Theme publishedModeTheme = themesTuple.getT2();
                            editModeTheme.sanitiseToExportDBObject();
                            publishedModeTheme.sanitiseToExportDBObject();
                            applicationJson.setEditModeTheme(editModeTheme);
                            applicationJson.setPublishedTheme(publishedModeTheme);
                            return themesTuple;
                        })
                        .thenReturn(application))
                .flatMap(application -> {

                    // Refactor application to remove the ids
                    final String workspaceId = application.getWorkspaceId();
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    Instant applicationLastCommittedAt =
                            gitApplicationMetadata != null ? gitApplicationMetadata.getLastCommittedAt() : null;
                    boolean isClientSchemaMigrated =
                            !JsonSchemaVersions.clientVersion.equals(application.getClientSchemaVersion());
                    boolean isServerSchemaMigrated =
                            !JsonSchemaVersions.serverVersion.equals(application.getServerSchemaVersion());
                    application.makePristine();
                    application.sanitiseToExportDBObject();
                    applicationJson.setExportedApplication(application);
                    Set<String> dbNamesUsedInActions = new HashSet<>();

                    Optional<AclPermission> optionalPermission = isGitSync
                            ? Optional.empty()
                            : TRUE.equals(exportWithConfiguration.get())
                                    ? Optional.of(pagePermission.getReadPermission())
                                    : Optional.of(pagePermission.getEditPermission());
                    Flux<NewPage> pageFlux = newPageRepository.findByApplicationId(applicationId, optionalPermission);

                    List<String> unPublishedPages = application.getPages().stream()
                            .map(ApplicationPage::getId)
                            .collect(Collectors.toList());

                    return pageFlux.collectList()
                            .flatMap(newPageList -> {
                                // Extract mongoEscapedWidgets from pages and save it to applicationJson object as this
                                // field is JsonIgnored. Also remove any ids those are present in the page objects

                                Set<String> updatedPageSet = new HashSet<String>();

                                // check the application object for the page reference in the page list
                                // Exclude the deleted pages that are present in view mode  because the app is not
                                // published yet
                                newPageList.removeIf(newPage -> !unPublishedPages.contains(newPage.getId()));
                                newPageList.forEach(newPage -> {
                                    if (newPage.getUnpublishedPage() != null) {
                                        pageIdToNameMap.put(
                                                newPage.getId() + EDIT,
                                                newPage.getUnpublishedPage().getName());
                                        PageDTO unpublishedPageDTO = newPage.getUnpublishedPage();
                                        if (!CollectionUtils.isEmpty(unpublishedPageDTO.getLayouts())) {
                                            unpublishedPageDTO.getLayouts().forEach(layout -> {
                                                layout.setId(unpublishedPageDTO.getName());
                                            });
                                        }
                                    }

                                    if (newPage.getPublishedPage() != null) {
                                        pageIdToNameMap.put(
                                                newPage.getId() + VIEW,
                                                newPage.getPublishedPage().getName());
                                        PageDTO publishedPageDTO = newPage.getPublishedPage();
                                        if (!CollectionUtils.isEmpty(publishedPageDTO.getLayouts())) {
                                            publishedPageDTO.getLayouts().forEach(layout -> {
                                                layout.setId(publishedPageDTO.getName());
                                            });
                                        }
                                    }
                                    // Including updated pages list for git file storage
                                    Instant newPageUpdatedAt = newPage.getUpdatedAt();
                                    boolean isNewPageUpdated = isClientSchemaMigrated
                                            || isServerSchemaMigrated
                                            || applicationLastCommittedAt == null
                                            || newPageUpdatedAt == null
                                            || applicationLastCommittedAt.isBefore(newPageUpdatedAt);
                                    String newPageName = newPage.getUnpublishedPage() != null
                                            ? newPage.getUnpublishedPage().getName()
                                            : newPage.getPublishedPage() != null
                                                    ? newPage.getPublishedPage().getName()
                                                    : null;
                                    if (isNewPageUpdated && newPageName != null) {
                                        updatedPageSet.add(newPageName);
                                    }
                                    newPage.sanitiseToExportDBObject();
                                });
                                applicationJson.setPageList(newPageList);
                                applicationJson.setUpdatedResources(new HashMap<>() {
                                    {
                                        put(FieldName.PAGE_LIST, updatedPageSet);
                                    }
                                });

                                Optional<AclPermission> optionalPermission3 = isGitSync
                                        ? Optional.empty()
                                        : TRUE.equals(exportWithConfiguration.get())
                                                ? Optional.of(datasourcePermission.getReadPermission())
                                                : Optional.of(datasourcePermission.getEditPermission());

                                Flux<Datasource> datasourceFlux = datasourceService.getAllByWorkspaceIdWithStorages(
                                        workspaceId, optionalPermission3);
                                return datasourceFlux.collectList().zipWith(defaultEnvironmentIdMono);
                            })
                            .flatMapMany(tuple2 -> {
                                List<Datasource> datasourceList = tuple2.getT1();
                                String environmentId = tuple2.getT2();
                                datasourceList.forEach(datasource ->
                                        datasourceIdToNameMap.put(datasource.getId(), datasource.getName()));
                                List<DatasourceStorage> storageList = datasourceList.stream()
                                        .map(datasource -> datasourceStorageService.getDatasourceStorageFromDatasource(
                                                datasource, environmentId))
                                        .collect(Collectors.toList());
                                applicationJson.setDatasourceList(storageList);

                                Optional<AclPermission> optionalPermission1 = isGitSync
                                        ? Optional.empty()
                                        : TRUE.equals(exportWithConfiguration.get())
                                                ? Optional.of(actionPermission.getReadPermission())
                                                : Optional.of(actionPermission.getEditPermission());
                                Flux<ActionCollection> actionCollectionFlux =
                                        actionCollectionRepository.findByListOfPageIds(
                                                unPublishedPages, optionalPermission1);
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
                                    ActionCollectionDTO actionCollectionDTO =
                                            actionCollection.getUnpublishedCollection();
                                    actionCollectionDTO.setPageId(
                                            pageIdToNameMap.get(actionCollectionDTO.getPageId() + EDIT));
                                    actionCollectionDTO.setPluginId(pluginMap.get(actionCollectionDTO.getPluginId()));

                                    final String updatedCollectionId =
                                            actionCollectionDTO.getPageId() + "_" + actionCollectionDTO.getName();
                                    collectionIdToNameMap.put(actionCollection.getId(), updatedCollectionId);
                                    actionCollection.setId(updatedCollectionId);
                                }
                                if (actionCollection.getPublishedCollection() != null) {
                                    ActionCollectionDTO actionCollectionDTO = actionCollection.getPublishedCollection();
                                    actionCollectionDTO.setPageId(
                                            pageIdToNameMap.get(actionCollectionDTO.getPageId() + VIEW));
                                    actionCollectionDTO.setPluginId(pluginMap.get(actionCollectionDTO.getPluginId()));

                                    if (!collectionIdToNameMap.containsValue(actionCollection.getId())) {
                                        final String updatedCollectionId =
                                                actionCollectionDTO.getPageId() + "_" + actionCollectionDTO.getName();
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
                                    ActionCollectionDTO publishedActionCollectionDTO =
                                            actionCollection.getPublishedCollection();
                                    ActionCollectionDTO unpublishedActionCollectionDTO =
                                            actionCollection.getUnpublishedCollection();
                                    ActionCollectionDTO actionCollectionDTO = unpublishedActionCollectionDTO != null
                                            ? unpublishedActionCollectionDTO
                                            : publishedActionCollectionDTO;
                                    String actionCollectionName = actionCollectionDTO != null
                                            ? actionCollectionDTO.getName()
                                                    + NAME_SEPARATOR
                                                    + actionCollectionDTO.getPageId()
                                            : null;
                                    Instant actionCollectionUpdatedAt = actionCollection.getUpdatedAt();
                                    boolean isActionCollectionUpdated = isClientSchemaMigrated
                                            || isServerSchemaMigrated
                                            || applicationLastCommittedAt == null
                                            || actionCollectionUpdatedAt == null
                                            || applicationLastCommittedAt.isBefore(actionCollectionUpdatedAt);
                                    if (isActionCollectionUpdated && actionCollectionName != null) {
                                        updatedActionCollectionSet.add(actionCollectionName);
                                    }
                                    actionCollection.sanitiseToExportDBObject();
                                });

                                applicationJson.setActionCollectionList(actionCollections);
                                applicationJson
                                        .getUpdatedResources()
                                        .put(FieldName.ACTION_COLLECTION_LIST, updatedActionCollectionSet);

                                Optional<AclPermission> optionalPermission2 = isGitSync
                                        ? Optional.empty()
                                        : TRUE.equals(exportWithConfiguration.get())
                                                ? Optional.of(actionPermission.getReadPermission())
                                                : Optional.of(actionPermission.getEditPermission());

                                Flux<NewAction> actionFlux =
                                        newActionRepository.findByListOfPageIds(unPublishedPages, optionalPermission2);
                                return actionFlux;
                            })
                            .map(newAction -> {
                                newAction.setPluginId(pluginMap.get(newAction.getPluginId()));
                                newAction.setWorkspaceId(null);
                                newAction.setPolicies(null);
                                newAction.setApplicationId(null);
                                dbNamesUsedInActions.add(sanitizeDatasourceInActionDTO(
                                        newAction.getPublishedAction(), datasourceIdToNameMap, pluginMap, null, true));
                                dbNamesUsedInActions.add(sanitizeDatasourceInActionDTO(
                                        newAction.getUnpublishedAction(),
                                        datasourceIdToNameMap,
                                        pluginMap,
                                        null,
                                        true));

                                // Set unique id for action
                                if (newAction.getUnpublishedAction() != null) {
                                    ActionDTO actionDTO = newAction.getUnpublishedAction();
                                    actionDTO.setPageId(pageIdToNameMap.get(actionDTO.getPageId() + EDIT));

                                    if (!StringUtils.isEmpty(actionDTO.getCollectionId())
                                            && collectionIdToNameMap.containsKey(actionDTO.getCollectionId())) {
                                        actionDTO.setCollectionId(
                                                collectionIdToNameMap.get(actionDTO.getCollectionId()));
                                    }

                                    final String updatedActionId =
                                            actionDTO.getPageId() + "_" + actionDTO.getValidName();
                                    actionIdToNameMap.put(newAction.getId(), updatedActionId);
                                    newAction.setId(updatedActionId);
                                }
                                if (newAction.getPublishedAction() != null) {
                                    ActionDTO actionDTO = newAction.getPublishedAction();
                                    actionDTO.setPageId(pageIdToNameMap.get(actionDTO.getPageId() + VIEW));

                                    if (!StringUtils.isEmpty(actionDTO.getCollectionId())
                                            && collectionIdToNameMap.containsKey(actionDTO.getCollectionId())) {
                                        actionDTO.setCollectionId(
                                                collectionIdToNameMap.get(actionDTO.getCollectionId()));
                                    }

                                    if (!actionIdToNameMap.containsValue(newAction.getId())) {
                                        final String updatedActionId =
                                                actionDTO.getPageId() + "_" + actionDTO.getValidName();
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
                                    ActionDTO actionDTO =
                                            unpublishedActionDTO != null ? unpublishedActionDTO : publishedActionDTO;
                                    String newActionName = actionDTO != null
                                            ? actionDTO.getValidName() + NAME_SEPARATOR + actionDTO.getPageId()
                                            : null;
                                    Instant newActionUpdatedAt = newAction.getUpdatedAt();
                                    boolean isNewActionUpdated = isClientSchemaMigrated
                                            || isServerSchemaMigrated
                                            || applicationLastCommittedAt == null
                                            || newActionUpdatedAt == null
                                            || applicationLastCommittedAt.isBefore(newActionUpdatedAt);
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

                                // Save decrypted fields for datasources for internally used sample apps and templates
                                // only
                                // when serialising for file sharing
                                if (TRUE.equals(exportWithConfiguration.get())
                                        && SerialiseApplicationObjective.SHARE.equals(serialiseFor)) {
                                    // Save decrypted fields for datasources
                                    Map<String, DecryptedSensitiveFields> decryptedFields = new HashMap<>();
                                    applicationJson.getDatasourceList().forEach(datasourceStorage -> {
                                        decryptedFields.put(
                                                datasourceStorage.getName(), getDecryptedFields(datasourceStorage));
                                        datasourceStorage.sanitiseToExportResource(pluginMap);
                                    });
                                    applicationJson.setDecryptedFields(decryptedFields);
                                } else {
                                    applicationJson.getDatasourceList().forEach(datasourceStorage -> {
                                        // Remove the datasourceConfiguration object as user will configure it once
                                        // imported to other instance
                                        datasourceStorage.setDatasourceConfiguration(null);
                                        datasourceStorage.sanitiseToExportResource(pluginMap);
                                    });
                                }

                                // Update ids for layoutOnLoadAction
                                for (NewPage newPage : applicationJson.getPageList()) {
                                    updateIdsForLayoutOnLoadAction(
                                            newPage.getUnpublishedPage(), actionIdToNameMap, collectionIdToNameMap);
                                    updateIdsForLayoutOnLoadAction(
                                            newPage.getPublishedPage(), actionIdToNameMap, collectionIdToNameMap);
                                }

                                application.exportApplicationPages(pageIdToNameMap);
                                // Disable exporting the application with datasource config once imported in destination
                                // instance
                                application.setExportWithConfiguration(null);
                                return applicationJson;
                            });
                })
                .then(allCustomJSLibListMono)
                .map(allCustomLibList -> {
                    applicationJson.setCustomJSLibList(allCustomLibList);
                    return applicationJson;
                })
                .then(currentUserMono)
                .map(user -> {
                    stopwatch.stopTimer();
                    final Map<String, Object> data = Map.of(
                            FieldName.APPLICATION_ID,
                            applicationId,
                            "pageCount",
                            applicationJson.getPageList().size(),
                            "actionCount",
                            applicationJson.getActionList().size(),
                            "JSObjectCount",
                            applicationJson.getActionCollectionList().size(),
                            FieldName.FLOW_NAME,
                            stopwatch.getFlow(),
                            "executionTime",
                            stopwatch.getExecutionTime());
                    analyticsService.sendEvent(
                            AnalyticsEvents.UNIT_EXECUTION_TIME.getEventName(), user.getUsername(), data);
                    return applicationJson;
                })
                .then(sendImportExportApplicationAnalyticsEvent(applicationId, AnalyticsEvents.EXPORT))
                .thenReturn(applicationJson);
    }

    public Mono<ApplicationJson> exportApplicationById(String applicationId, String branchName) {
        return applicationService
                .findBranchedApplicationId(branchName, applicationId, applicationPermission.getExportPermission())
                .flatMap(branchedAppId -> exportApplicationById(branchedAppId, SerialiseApplicationObjective.SHARE));
    }

    private void updateIdsForLayoutOnLoadAction(
            PageDTO page, Map<String, String> actionIdToNameMap, Map<String, String> collectionIdToNameMap) {

        if (page != null && !CollectionUtils.isEmpty(page.getLayouts())) {
            for (Layout layout : page.getLayouts()) {
                if (!CollectionUtils.isEmpty(layout.getLayoutOnLoadActions())) {
                    layout.getLayoutOnLoadActions()
                            .forEach(onLoadAction -> onLoadAction.forEach(actionDTO -> {
                                if (actionIdToNameMap.containsKey(actionDTO.getId())) {
                                    actionDTO.setId(actionIdToNameMap.get(actionDTO.getId()));
                                }
                                if (collectionIdToNameMap.containsKey(actionDTO.getCollectionId())) {
                                    actionDTO.setCollectionId(collectionIdToNameMap.get(actionDTO.getCollectionId()));
                                }
                            }));
                }
            }
        }
    }

    public Mono<ExportFileDTO> getApplicationFile(String applicationId, String branchName) {
        return this.exportApplicationById(applicationId, branchName).map(applicationJson -> {
            String stringifiedFile = gson.toJson(applicationJson);
            String applicationName = applicationJson.getExportedApplication().getName();
            Object jsonObject = gson.fromJson(stringifiedFile, Object.class);
            HttpHeaders responseHeaders = new HttpHeaders();
            ContentDisposition contentDisposition = ContentDisposition.builder("attachment")
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

    public Mono<ApplicationImportDTO> extractFileAndSaveApplication(String workspaceId, Part filePart) {
        return extractFileAndSaveApplication(workspaceId, filePart, null);
    }

    /**
     * This function will take the Json filepart and saves the application in workspace
     *
     * @param workspaceId workspace to which the application needs to be hydrated
     * @param filePart    Json file which contains the entire application object
     * @return saved application in DB
     */
    @Override
    public Mono<ApplicationImportDTO> extractFileAndSaveApplication(
            String workspaceId, Part filePart, String applicationId) {
        // workspace id must be present and valid
        if (StringUtils.isEmpty(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        Mono<ApplicationImportDTO> importedApplicationMono = extractApplicationJson(filePart)
                .flatMap(applicationJson -> {
                    if (StringUtils.isEmpty(applicationId)) {
                        return importNewApplicationInWorkspaceFromJson(workspaceId, applicationJson);
                    } else {
                        return updateNonGitConnectedAppFromJson(workspaceId, applicationId, applicationJson);
                    }
                })
                .flatMap(application ->
                        getApplicationImportDTO(application.getId(), application.getWorkspaceId(), application));

        return Mono.create(
                sink -> importedApplicationMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    @Override
    public Mono<ApplicationJson> extractApplicationJson(Part filePart) {
        final MediaType contentType = filePart.headers().getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            log.error("Invalid content type, {}", contentType);
            return Mono.error(new AppsmithException(AppsmithError.VALIDATION_FAILURE, INVALID_JSON_FILE));
        }

        return DataBufferUtils.join(filePart.content())
                .map(dataBuffer -> {
                    byte[] data = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(data);
                    DataBufferUtils.release(dataBuffer);
                    return new String(data);
                })
                .map(jsonString -> {
                    Type fileType = new TypeToken<ApplicationJson>() {}.getType();
                    ApplicationJson jsonFile = gson.fromJson(jsonString, fileType);
                    return jsonFile;
                });
    }

    private Mono<ImportApplicationPermissionProvider> getPermissionProviderForUpdateNonGitConnectedAppFromJson() {
        return permissionGroupRepository.getCurrentUserPermissionGroups().map(permissionGroups -> {
            ImportApplicationPermissionProvider permissionProvider = ImportApplicationPermissionProvider.builder(
                            applicationPermission,
                            pagePermission,
                            actionPermission,
                            datasourcePermission,
                            workspacePermission)
                    .requiredPermissionOnTargetWorkspace(workspacePermission.getReadPermission())
                    .requiredPermissionOnTargetApplication(applicationPermission.getEditPermission())
                    .allPermissionsRequired()
                    .currentUserPermissionGroups(permissionGroups)
                    .build();
            return permissionProvider;
        });
    }

    /**
     * This function will take the Json filepart and updates/creates the application in workspace depending on presence
     * of applicationId field
     *
     * @param workspaceId     Workspace to which the application needs to be hydrated
     * @param applicationJson Json file which contains the entire application object
     * @param applicationId   Optional field for application ref which needs to be overridden by the incoming JSON file
     * @return saved application in DB
     */
    private Mono<Application> updateNonGitConnectedAppFromJson(
            String workspaceId, String applicationId, ApplicationJson applicationJson) {
        /*
           1. Verify if application is connected to git, in case if it's connected throw exception asking user to
           update app via git ops like pull, merge etc.
           2. Check the validity of file part
           3. Depending upon availability of applicationId update/save application to workspace
        */
        if (StringUtils.isEmpty(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        if (StringUtils.isEmpty(applicationId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID));
        }

        // Check if the application is connected to git and if it's connected throw exception asking user to update
        // app via git ops like pull, merge etc.
        Mono<Boolean> isConnectedToGitMono = Mono.just(false);
        if (!StringUtils.isEmpty(applicationId)) {
            isConnectedToGitMono = applicationService.isApplicationConnectedToGit(applicationId);
        }

        Mono<Application> importedApplicationMono = isConnectedToGitMono.flatMap(isConnectedToGit -> {
            if (isConnectedToGit) {
                return Mono.error(new AppsmithException(
                        AppsmithError.UNSUPPORTED_IMPORT_OPERATION_FOR_GIT_CONNECTED_APPLICATION));
            } else {
                return getPermissionProviderForUpdateNonGitConnectedAppFromJson()
                        .flatMap(permissionProvider -> {
                            if (!StringUtils.isEmpty(applicationId)
                                    && applicationJson.getExportedApplication() != null) {
                                // Remove the application name from JSON file as updating the application name is not
                                // supported
                                // via JSON import. This is to avoid name conflict during the import flow within the
                                // workspace
                                applicationJson.getExportedApplication().setName(null);
                                applicationJson.getExportedApplication().setSlug(null);
                            }

                            return importApplicationInWorkspace(
                                            workspaceId,
                                            applicationJson,
                                            applicationId,
                                            null,
                                            false,
                                            permissionProvider)
                                    .onErrorResume(error -> {
                                        if (error instanceof AppsmithException) {
                                            return Mono.error(error);
                                        }
                                        return Mono.error(new AppsmithException(
                                                AppsmithError.GENERIC_JSON_IMPORT_ERROR,
                                                workspaceId,
                                                error.getMessage()));
                                    });
                        });
            }
        });

        return Mono.create(
                sink -> importedApplicationMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    /**
     * This function will create the application to workspace from the application resource.
     *
     * @param workspaceId workspace to which application is going to be stored
     * @param importedDoc application resource which contains necessary information to save the application
     * @return saved application in DB
     */
    @Override
    public Mono<Application> importNewApplicationInWorkspaceFromJson(String workspaceId, ApplicationJson importedDoc) {
        // workspace id must be present and valid
        if (StringUtils.isEmpty(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        return permissionGroupRepository.getCurrentUserPermissionGroups().flatMap(userPermissionGroups -> {
            ImportApplicationPermissionProvider permissionProvider = ImportApplicationPermissionProvider.builder(
                            applicationPermission,
                            pagePermission,
                            actionPermission,
                            datasourcePermission,
                            workspacePermission)
                    .requiredPermissionOnTargetWorkspace(workspacePermission.getApplicationCreatePermission())
                    .permissionRequiredToCreateDatasource(true)
                    .permissionRequiredToEditDatasource(true)
                    .currentUserPermissionGroups(userPermissionGroups)
                    .build();

            return importApplicationInWorkspace(workspaceId, importedDoc, null, null, false, permissionProvider);
        });
    }

    /**
     * This function will update an existing application. The application is connected to Git.
     *
     * @param workspaceId   workspace to which application is going to be stored
     * @param importedDoc   application resource which contains necessary information to save the application
     * @param applicationId application which needs to be saved with the updated resources
     * @param branchName    name of the git branch. null if not connected to git.
     * @return saved application in DB
     */
    @Override
    public Mono<Application> importApplicationInWorkspaceFromGit(
            String workspaceId, ApplicationJson importedDoc, String applicationId, String branchName) {
        return permissionGroupRepository.getCurrentUserPermissionGroups().flatMap(userPermissionGroups -> {
            /**
             * If the application is connected to git, then the user must have edit permission on the application.
             * If user is importing application from Git, create application permission is already checked by the
             * caller method, so it's not required here.
             * Other permissions are not required because Git is the source of truth for the application and Git
             * Sync is a system level operation to get the latest code from Git. If the user does not have some
             * permissions on the Application e.g. create page, that'll be checked when the user tries to create a page.
             */
            ImportApplicationPermissionProvider permissionProvider = ImportApplicationPermissionProvider.builder(
                            applicationPermission,
                            pagePermission,
                            actionPermission,
                            datasourcePermission,
                            workspacePermission)
                    .requiredPermissionOnTargetApplication(applicationPermission.getEditPermission())
                    .currentUserPermissionGroups(userPermissionGroups)
                    .build();
            return importApplicationInWorkspace(
                    workspaceId, importedDoc, applicationId, branchName, false, permissionProvider);
        });
    }

    @Override
    public Mono<Application> restoreSnapshot(
            String workspaceId, ApplicationJson importedDoc, String applicationId, String branchName) {
        /**
         * Like Git, restore snapshot is a system level operation. So, we're not checking for any permissions here.
         * Only permission required is to edit the application.
         */
        return permissionGroupRepository.getCurrentUserPermissionGroups().flatMap(userPermissionGroups -> {
            ImportApplicationPermissionProvider permissionProvider = ImportApplicationPermissionProvider.builder(
                            applicationPermission,
                            pagePermission,
                            actionPermission,
                            datasourcePermission,
                            workspacePermission)
                    .requiredPermissionOnTargetWorkspace(workspacePermission.getReadPermission())
                    .requiredPermissionOnTargetApplication(applicationPermission.getEditPermission())
                    .currentUserPermissionGroups(userPermissionGroups)
                    .build();
            return importApplicationInWorkspace(
                    workspaceId, importedDoc, applicationId, branchName, false, permissionProvider);
        });
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
    private Mono<Application> importApplicationInWorkspace(
            String workspaceId,
            ApplicationJson applicationJson,
            String applicationId,
            String branchName,
            boolean appendToApp,
            ImportApplicationPermissionProvider permissionProvider) {
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
            log.error("Error in importing application. Field {} is missing", errorField);
            return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, errorField, INVALID_JSON_FILE));
        }

        Map<String, String> pluginMap = new HashMap<>();
        Map<String, String> datasourceMap = new HashMap<>();
        Map<String, NewPage> pageNameMap = new HashMap<>();

        Application importedApplication = importedDoc.getExportedApplication();

        List<DatasourceStorage> importedDatasourceList = importedDoc.getDatasourceList();
        List<NewPage> importedNewPageList = importedDoc.getPageList();
        List<NewAction> importedNewActionList = importedDoc.getActionList();
        List<ActionCollection> importedActionCollectionList =
                CollectionUtils.isEmpty(importedDoc.getActionCollectionList())
                        ? new ArrayList<>()
                        : importedDoc.getActionCollectionList();

        Mono<Workspace> workspaceMono = workspaceService
                .findById(workspaceId, permissionProvider.getRequiredPermissionOnTargetWorkspace())
                .switchIfEmpty(Mono.defer(() -> {
                    log.error(
                            "No workspace found with id: {} and permission: {}",
                            workspaceId,
                            permissionProvider.getRequiredPermissionOnTargetWorkspace());
                    return Mono.error(new AppsmithException(
                            AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId));
                }));

        /* We need to take care of the null case in case someone is trying to import an older app where JS libs did
        not exist */
        List<CustomJSLib> customJSLibs =
                importedDoc.getCustomJSLibList() == null ? new ArrayList<>() : importedDoc.getCustomJSLibList();

        Mono<Application> installedJSLibMono = Flux.fromIterable(customJSLibs)
                .flatMap(customJSLib -> {
                    customJSLib.setId(null);
                    customJSLib.setCreatedAt(null);
                    customJSLib.setUpdatedAt(null);
                    return customJSLibService.persistCustomJSLibMetaDataIfDoesNotExistAndGetDTO(customJSLib, false);
                })
                .collectList()
                .map(jsLibDTOList -> {
                    importedApplication.setUnpublishedCustomJSLibs(new HashSet<>(jsLibDTOList));
                    return importedApplication;
                });

        Mono<User> currUserMono = sessionUserService.getCurrentUser().cache();
        final Flux<Datasource> existingDatasourceFlux = datasourceService
                .getAllByWorkspaceIdWithStorages(workspaceId, Optional.empty())
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
        // re-setting the properties
        importedApplication.setForkWithConfiguration(null);
        importedApplication.setExportWithConfiguration(null);
        // Start the stopwatch to log the execution time
        Stopwatch stopwatch = new Stopwatch(AnalyticsEvents.IMPORT.getEventName());

        final Mono<Application> importedApplicationMono = pluginRepository
                .findAll()
                .map(plugin -> {
                    final String pluginReference = StringUtils.isEmpty(plugin.getPluginName())
                            ? plugin.getPackageName()
                            : plugin.getPluginName();
                    pluginMap.put(pluginReference, plugin.getId());
                    return plugin;
                })
                .then(installedJSLibMono)
                .then(workspaceMono)
                .flatMap(workspace -> {
                    Mono<List<Datasource>> existingDatasourceMono;
                    // Check if the request is to hydrate the application to DB for particular branch
                    // Application id will be present for GIT sync
                    if (!StringUtils.isEmpty(applicationId)) {
                        // No need to hydrate the datasource as we expect user will configure the datasource
                        existingDatasourceMono = existingDatasourceFlux.collectList();
                    } else {
                        existingDatasourceMono = Mono.just(new ArrayList<>());
                    }
                    return Mono.zip(existingDatasourceMono, Mono.just(workspace));
                })
                .zipWhen(objects -> workspaceService.getDefaultEnvironmentId(workspaceId))
                .flatMapMany(objects -> {
                    List<Datasource> existingDatasources = objects.getT1().getT1();
                    Workspace workspace = objects.getT1().getT2();
                    String environmentId = objects.getT2();
                    if (CollectionUtils.isEmpty(importedDatasourceList)) {
                        return Mono.empty();
                    }
                    Map<String, Datasource> savedDatasourcesGitIdToDatasourceMap = new HashMap<>();

                    existingDatasources.stream()
                            .filter(datasource -> datasource.getGitSyncId() != null)
                            .forEach(datasource ->
                                    savedDatasourcesGitIdToDatasourceMap.put(datasource.getGitSyncId(), datasource));

                    // Check if the destination org have all the required plugins installed
                    for (DatasourceStorage datasource : importedDatasourceList) {
                        if (StringUtils.isEmpty(pluginMap.get(datasource.getPluginId()))) {
                            log.error(
                                    "Unable to find the plugin: {}, available plugins are: {}",
                                    datasource.getPluginId(),
                                    pluginMap.keySet());
                            return Mono.error(new AppsmithException(
                                    AppsmithError.UNKNOWN_PLUGIN_REFERENCE, datasource.getPluginId()));
                        }
                    }
                    return Flux.fromIterable(importedDatasourceList)
                            // Check for duplicate datasources to avoid duplicates in target workspace
                            .flatMap(datasourceStorage -> {
                                final String importedDatasourceName = datasourceStorage.getName();
                                // Check if the datasource has gitSyncId and if it's already in DB
                                if (datasourceStorage.getGitSyncId() != null
                                        && savedDatasourcesGitIdToDatasourceMap.containsKey(
                                                datasourceStorage.getGitSyncId())) {

                                    // Since the resource is already present in DB, just update resource
                                    Datasource existingDatasource =
                                            savedDatasourcesGitIdToDatasourceMap.get(datasourceStorage.getGitSyncId());
                                    if (!permissionProvider.hasEditPermission(existingDatasource)) {
                                        log.error(
                                                "Trying to update datasource {} without edit permission",
                                                existingDatasource.getName());
                                        return Mono.error(new AppsmithException(
                                                AppsmithError.ACL_NO_RESOURCE_FOUND,
                                                FieldName.DATASOURCE,
                                                existingDatasource.getId()));
                                    }
                                    datasourceStorage.setId(null);
                                    // Don't update datasource config as the saved datasource is already configured by
                                    // user
                                    // for this instance
                                    datasourceStorage.setDatasourceConfiguration(null);
                                    datasourceStorage.setPluginId(null);
                                    datasourceStorage.setEnvironmentId(environmentId);
                                    Datasource newDatasource =
                                            datasourceService.createDatasourceFromDatasourceStorage(datasourceStorage);
                                    newDatasource.setPolicies(null);

                                    copyNestedNonNullProperties(newDatasource, existingDatasource);
                                    // Don't update the datasource configuration for already available datasources
                                    existingDatasource.setDatasourceConfiguration(null);
                                    return datasourceService.save(existingDatasource);
                                }

                                // This is explicitly copied over from the map we created before
                                datasourceStorage.setPluginId(pluginMap.get(datasourceStorage.getPluginId()));
                                datasourceStorage.setWorkspaceId(workspaceId);
                                datasourceStorage.setEnvironmentId(environmentId);

                                // Check if any decrypted fields are present for datasource
                                if (importedDoc.getDecryptedFields() != null
                                        && importedDoc.getDecryptedFields().get(datasourceStorage.getName()) != null) {

                                    DecryptedSensitiveFields decryptedFields =
                                            importedDoc.getDecryptedFields().get(datasourceStorage.getName());

                                    updateAuthenticationDTO(datasourceStorage, decryptedFields);
                                }

                                return createUniqueDatasourceIfNotPresent(
                                        existingDatasourceFlux,
                                        datasourceStorage,
                                        workspace,
                                        environmentId,
                                        permissionProvider);
                            });
                })
                .collectMap(Datasource::getName, Datasource::getId)
                .flatMap(map -> {
                    datasourceMap.putAll(map);
                    // 1. Assign the policies for the imported application
                    // 2. Check for possible duplicate names,
                    // 3. Save the updated application

                    return Mono.just(importedApplication)
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
                                    return applicationService
                                            .findById(
                                                    applicationId,
                                                    permissionProvider.getRequiredPermissionOnTargetApplication())
                                            .switchIfEmpty(Mono.defer(() -> {
                                                log.error(
                                                        "No application found with id: {} and permission: {}",
                                                        applicationId,
                                                        permissionProvider.getRequiredPermissionOnTargetApplication());
                                                return Mono.error(new AppsmithException(
                                                        AppsmithError.ACL_NO_RESOURCE_FOUND,
                                                        FieldName.APPLICATION,
                                                        applicationId));
                                            }))
                                            .flatMap(existingApplication -> {
                                                if (appendToApp) {
                                                    // When we are appending the pages to the existing application
                                                    // e.g. import template we are only importing this in unpublished
                                                    // version. At the same time we want to keep the existing page ref
                                                    unpublishedPages.addAll(existingApplication.getPages());
                                                    return Mono.just(existingApplication);
                                                }
                                                setPropertiesToExistingApplication(
                                                        importedApplication, existingApplication);
                                                // We are expecting the changes present in DB are committed to git
                                                // directory
                                                // so that these won't be lost when we are pulling changes from remote
                                                // and
                                                // rehydrate the application. We are now rehydrating the application
                                                // with/without
                                                // the changes from remote
                                                // We are using the save instead of update as we are using @Encrypted
                                                // for GitAuth
                                                Mono<Application> parentApplicationMono;
                                                if (existingApplication.getGitApplicationMetadata() != null) {
                                                    parentApplicationMono =
                                                            applicationService.findById(existingApplication
                                                                    .getGitApplicationMetadata()
                                                                    .getDefaultApplicationId());
                                                } else {
                                                    parentApplicationMono = Mono.just(existingApplication);
                                                }

                                                return parentApplicationMono.flatMap(application1 -> {
                                                    // Set the policies from the defaultApplication
                                                    existingApplication.setPolicies(application1.getPolicies());
                                                    importedApplication.setPolicies(application1.getPolicies());
                                                    return applicationService
                                                            .save(existingApplication)
                                                            .onErrorResume(DuplicateKeyException.class, error -> {
                                                                if (error.getMessage() != null) {
                                                                    return applicationPageService
                                                                            .createOrUpdateSuffixedApplication(
                                                                                    existingApplication,
                                                                                    existingApplication.getName(),
                                                                                    0);
                                                                }
                                                                throw error;
                                                            });
                                                });
                                            });
                                }
                                return applicationPageService.createOrUpdateSuffixedApplication(
                                        application, application.getName(), 0);
                            });
                })
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
                            .findNewPagesByApplicationId(importedApplication.getId(), Optional.empty())
                            .collectList()
                            .cache();

                    Flux<NewPage> importNewPageFlux = importAndSavePages(
                            importedNewPageList, savedApp, branchName, existingPagesMono, permissionProvider);
                    Flux<NewPage> importedNewPagesMono;

                    if (appendToApp) {
                        // we need to rename page if there is a conflict
                        // also need to remap the renamed page
                        importedNewPagesMono = updateNewPagesBeforeMerge(existingPagesMono, importedNewPageList)
                                .flatMapMany(newToOldNameMap -> importNewPageFlux.map(newPage -> {
                                    // we need to map the newly created page with old name
                                    // because other related resources e.g. actions will refer the page with old name
                                    String newPageName =
                                            newPage.getUnpublishedPage().getName();
                                    String oldPageName = newToOldNameMap.get(newPageName);
                                    if (!newPageName.equals(oldPageName)) {
                                        renamePageInActions(importedNewActionList, oldPageName, newPageName);
                                        renamePageInActionCollections(
                                                importedActionCollectionList, oldPageName, newPageName);
                                        unpublishedPages.stream()
                                                .filter(applicationPage -> oldPageName.equals(applicationPage.getId()))
                                                .findAny()
                                                .ifPresent(applicationPage -> applicationPage.setId(newPageName));
                                    }
                                    return newPage;
                                }));
                    } else {
                        importedNewPagesMono = importNewPageFlux;
                    }
                    importedNewPagesMono = importedNewPagesMono.map(newPage -> {
                        // Save the map of pageName and NewPage
                        if (newPage.getUnpublishedPage() != null
                                && newPage.getUnpublishedPage().getName() != null) {
                            pageNameMap.put(newPage.getUnpublishedPage().getName(), newPage);
                        }
                        if (newPage.getPublishedPage() != null
                                && newPage.getPublishedPage().getName() != null) {
                            pageNameMap.put(newPage.getPublishedPage().getName(), newPage);
                        }
                        return newPage;
                    });

                    return importedNewPagesMono
                            .collectList()
                            .map(newPageList -> {
                                log.info("New pages imported for application: {}", savedApp.getId());
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
                                        log.debug(
                                                "Unable to find the page during import for appId {}, with name {}",
                                                applicationId,
                                                applicationPage.getId());
                                        unpublishedPageItr.remove();
                                    } else {
                                        applicationPage.setId(newPage.getId());
                                        applicationPage.setDefaultPageId(
                                                newPage.getDefaultResources().getPageId());
                                        // Keep the existing page as the default one
                                        if (appendToApp) {
                                            applicationPage.setIsDefault(false);
                                        }
                                    }
                                }

                                Iterator<ApplicationPage> publishedPagesItr;
                                // Remove the newly added pages from merge app flow. Keep only the existing page from
                                // the old app
                                if (appendToApp) {
                                    List<String> existingPagesId = savedApp.getPublishedPages().stream()
                                            .map(applicationPage -> applicationPage.getId())
                                            .collect(Collectors.toList());
                                    List<ApplicationPage> publishedApplicationPages = publishedPages.stream()
                                            .filter(applicationPage ->
                                                    existingPagesId.contains(applicationPage.getId()))
                                            .collect(Collectors.toList());
                                    applicationPages.replace(VIEW, publishedApplicationPages);
                                    publishedPagesItr = publishedApplicationPages.iterator();
                                } else {
                                    publishedPagesItr = publishedPages.iterator();
                                }
                                while (publishedPagesItr.hasNext()) {
                                    ApplicationPage applicationPage = publishedPagesItr.next();
                                    NewPage newPage = pageNameMap.get(applicationPage.getId());
                                    if (newPage == null) {
                                        log.debug(
                                                "Unable to find the page during import for appId {}, with name {}",
                                                applicationId,
                                                applicationPage.getId());
                                        if (!appendToApp) {
                                            publishedPagesItr.remove();
                                        }
                                    } else {
                                        applicationPage.setId(newPage.getId());
                                        applicationPage.setDefaultPageId(
                                                newPage.getDefaultResources().getPageId());
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

                                    validPageIds.addAll(applicationPages.get(VIEW).stream()
                                            .map(ApplicationPage::getId)
                                            .collect(Collectors.toSet()));

                                    return existingPagesMono.flatMap(existingPagesList -> {
                                        Set<String> invalidPageIds = new HashSet<>();
                                        for (NewPage newPage : existingPagesList) {
                                            if (!validPageIds.contains(newPage.getId())) {
                                                invalidPageIds.add(newPage.getId());
                                            }
                                        }

                                        // Delete the pages which were removed during git merge operation
                                        // This does not apply to the traditional import via file approach
                                        return Flux.fromIterable(invalidPageIds)
                                                .flatMap(applicationPageService::deleteWithoutPermissionUnpublishedPage)
                                                .flatMap(page -> newPageService
                                                        .archiveWithoutPermissionById(page.getId())
                                                        .onErrorResume(e -> {
                                                            log.debug(
                                                                    "Unable to archive page {} with error {}",
                                                                    page.getId(),
                                                                    e.getMessage());
                                                            return Mono.empty();
                                                        }))
                                                .then()
                                                .thenReturn(applicationPages);
                                    });
                                }
                                return Mono.just(applicationPages);
                            });
                })
                .map(applicationPageMap -> {
                    log.info(
                            "Imported pages. Edit: {}, View: {}",
                            applicationPageMap.get(EDIT).size(),
                            applicationPageMap.get(VIEW).size());
                    log.info("Importing actions for applicationId: {}, ", importedApplication.getId());
                    // Set page sequence based on the order for published and unpublished pages
                    importedApplication.setPages(applicationPageMap.get(EDIT));
                    importedApplication.setPublishedPages(applicationPageMap.get(VIEW));
                    return applicationPageMap;
                })
                .flatMap(unused -> newActionService.importActions(importedNewActionList, importedApplication, branchName, pageNameMap, pluginMap, datasourceMap, permissionProvider))
                .flatMap(importActionResultDTO -> {
                    log.info(
                            "Actions imported. applicationId {}, result: {}",
                            importedApplication.getId(),
                            importActionResultDTO.getGist());
                    // Updating the existing application for git-sync
                    // During partial import/appending to the existing application keep the resources
                    // attached to the application:
                    // Delete the invalid resources (which are not the part of applicationJsonDTO) in
                    // the git flow only
                    if (!StringUtils.isEmpty(applicationId) && !appendToApp) {
                        // Remove unwanted actions
                        Set<String> invalidActionIds = new HashSet<>();
                        for (NewAction action : importActionResultDTO.getExistingActions()) {
                            if (!importActionResultDTO.getImportedActionIds().contains(action.getId())) {
                                invalidActionIds.add(action.getId());
                            }
                        }
                        log.info("Deleting {} actions which are no more used", invalidActionIds.size());
                        return Flux.fromIterable(invalidActionIds)
                                .flatMap(actionId -> newActionService
                                        .deleteUnpublishedAction(actionId)
                                        // return an empty action so that the filter can remove it from the list
                                        .onErrorResume(throwable -> {
                                            log.debug("Failed to delete action with id {} during import", actionId);
                                            log.error(throwable.getMessage());
                                            return Mono.empty();
                                        }))
                                .then()
                                .thenReturn(importActionResultDTO);
                    }
                    return Mono.just(importActionResultDTO);
                })
                .flatMap(importActionResultDTO -> {
                    log.info("Importing action collections for applicationId {}", importedApplication.getId());
                    return actionCollectionService
                            .importActionCollections(
                                    importActionResultDTO,
                                    importedApplication,
                                    branchName,
                                    importedActionCollectionList,
                                    pluginMap,
                                    pageNameMap,
                                    permissionProvider)
                            .zipWith(Mono.just(importActionResultDTO));
                })
                .flatMap(resultDtos -> {
                    ImportActionCollectionResultDTO importActionCollectionResultDTO = resultDtos.getT1();
                    ImportActionResultDTO importActionResultDTO = resultDtos.getT2();
                    List<String> savedCollectionIds = importActionCollectionResultDTO.getSavedActionCollectionIds();
                    log.info(
                            "Action collections imported. applicationId {}, result: {}",
                            importedApplication.getId(),
                            importActionCollectionResultDTO.getGist());
                    return newActionService
                            .updateActionsWithImportedCollectionIds(
                                    importActionCollectionResultDTO, importActionResultDTO)
                            .flatMap(actionAndCollectionMapsDTO -> {
                                log.info(
                                        "Updated actions with imported collection ids. applicationId {}",
                                        importedApplication.getId());
                                // Updating the existing application for git-sync
                                // During partial import/appending to the existing application keep the resources
                                // attached to the application:
                                // Delete the invalid resources (which are not the part of applicationJsonDTO) in
                                // the git flow only
                                if (!StringUtils.isEmpty(applicationId) && !appendToApp) {
                                    // Remove unwanted action collections
                                    Set<String> invalidCollectionIds = new HashSet<>();
                                    for (ActionCollection collection :
                                            importActionCollectionResultDTO.getExistingActionCollections()) {
                                        if (!savedCollectionIds.contains(collection.getId())) {
                                            invalidCollectionIds.add(collection.getId());
                                        }
                                    }
                                    log.info(
                                            "Deleting {} action collections which are no more used",
                                            invalidCollectionIds.size());
                                    return Flux.fromIterable(invalidCollectionIds)
                                            .flatMap(collectionId -> actionCollectionService
                                                    .deleteWithoutPermissionUnpublishedActionCollection(collectionId)
                                                    // return an empty collection so that the filter can remove it from
                                                    // the list
                                                    .onErrorResume(throwable -> {
                                                        log.debug(
                                                                "Failed to delete collection with id {} during import",
                                                                collectionId);
                                                        log.error(throwable.getMessage());
                                                        return Mono.empty();
                                                    }))
                                            .then()
                                            .thenReturn(actionAndCollectionMapsDTO);
                                }
                                return Mono.just(actionAndCollectionMapsDTO);
                            })
                            .zipWith(Mono.just(importActionResultDTO));
                })
                .flatMap(objects -> {
                    ImportedActionAndCollectionMapsDTO actionAndCollectionMapsDTO = objects.getT1();
                    ImportActionResultDTO importActionResultDTO = objects.getT2();
                    // Don't update gitAuth as we are using @Encrypted for private key
                    importedApplication.setGitApplicationMetadata(null);
                    // Map layoutOnLoadActions ids with relevant actions
                    return newPageService
                            .findNewPagesByApplicationId(importedApplication.getId(), Optional.empty())
                            .flatMap(newPage -> {
                                if (newPage.getDefaultResources() != null) {
                                    newPage.getDefaultResources().setBranchName(branchName);
                                }
                                return mapActionAndCollectionIdWithPageLayout(
                                        newPage,
                                        importActionResultDTO.getActionIdMap(),
                                        actionAndCollectionMapsDTO.getUnpublishedActionIdToCollectionIdMap(),
                                        actionAndCollectionMapsDTO.getPublishedActionIdToCollectionIdMap());
                            })
                            .collectList()
                            .flatMapMany(newPageService::saveAll)
                            .then(applicationService.update(importedApplication.getId(), importedApplication))
                            .then(sendImportExportApplicationAnalyticsEvent(
                                    importedApplication.getId(), AnalyticsEvents.IMPORT))
                            .zipWith(currUserMono)
                            .flatMap(tuple -> {
                                Application application = tuple.getT1();
                                stopwatch.stopTimer();
                                stopwatch.stopAndLogTimeInMillis();
                                final Map<String, Object> data = Map.of(
                                        FieldName.APPLICATION_ID,
                                        application.getId(),
                                        FieldName.WORKSPACE_ID,
                                        application.getWorkspaceId(),
                                        "pageCount",
                                        applicationJson.getPageList().size(),
                                        "actionCount",
                                        applicationJson.getActionList().size(),
                                        "JSObjectCount",
                                        applicationJson
                                                .getActionCollectionList()
                                                .size(),
                                        FieldName.FLOW_NAME,
                                        stopwatch.getFlow(),
                                        "executionTime",
                                        stopwatch.getExecutionTime());
                                return analyticsService
                                        .sendEvent(
                                                AnalyticsEvents.UNIT_EXECUTION_TIME.getEventName(),
                                                tuple.getT2().getUsername(),
                                                data)
                                        .thenReturn(application);
                            });
                })
                .onErrorResume(throwable -> {
                    String errorMessage = ImportExportUtils.getErrorMessage(throwable);
                    log.error("Error importing application. Error: {}", errorMessage, throwable);
                    return Mono.error(
                            new AppsmithException(AppsmithError.GENERIC_JSON_IMPORT_ERROR, workspaceId, errorMessage));
                })
                .as(transactionalOperator::transactional);

        // Import Application is currently a slow API because it needs to import and create application, pages, actions
        // and action collection. This process may take time and the client may cancel the request. This leads to the
        // flow
        // getting stopped midway producing corrupted objects in DB. The following ensures that even though the client
        // may have
        // cancelled the flow, the importing the application should proceed uninterrupted and whenever the user
        // refreshes
        // the page, the imported application is available and is in sane state.
        // To achieve this, we use a synchronous sink which does not take subscription cancellations into account. This
        // means that even if the subscriber has cancelled its subscription, the create method still generates its
        // event.
        return Mono.create(
                sink -> importedApplicationMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    private void renamePageInActions(List<NewAction> newActionList, String oldPageName, String newPageName) {
        for (NewAction newAction : newActionList) {
            if (newAction.getUnpublishedAction().getPageId().equals(oldPageName)) {
                newAction.getUnpublishedAction().setPageId(newPageName);
            }
        }
    }

    private void renamePageInActionCollections(
            List<ActionCollection> actionCollectionList, String oldPageName, String newPageName) {
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
    private Flux<NewPage> importAndSavePages(
            List<NewPage> pages,
            Application application,
            String branchName,
            Mono<List<NewPage>> existingPages,
            ImportApplicationPermissionProvider permissionProvider) {

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
                            ? oldToNewLayoutIds.get(layout.getId())
                            : new ObjectId().toString();
                    layout.setId(layoutId);
                });
            }
        });

        return existingPages.flatMapMany(existingSavedPages -> {
            Map<String, NewPage> savedPagesGitIdToPageMap = new HashMap<>();

            existingSavedPages.stream()
                    .filter(newPage -> !StringUtils.isEmpty(newPage.getGitSyncId()))
                    .forEach(newPage -> savedPagesGitIdToPageMap.put(newPage.getGitSyncId(), newPage));

            return Flux.fromIterable(pages).flatMap(newPage -> {

                // Check if the page has gitSyncId and if it's already in DB
                if (newPage.getGitSyncId() != null && savedPagesGitIdToPageMap.containsKey(newPage.getGitSyncId())) {
                    // Since the resource is already present in DB, just update resource
                    NewPage existingPage = savedPagesGitIdToPageMap.get(newPage.getGitSyncId());
                    if (!permissionProvider.hasEditPermission(existingPage)) {
                        log.error("User does not have permission to edit page with id: {}", existingPage.getId());
                        return Mono.error(new AppsmithException(
                                AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, existingPage.getId()));
                    }
                    Set<Policy> existingPagePolicy = existingPage.getPolicies();
                    copyNestedNonNullProperties(newPage, existingPage);
                    // Update branchName
                    existingPage.getDefaultResources().setBranchName(branchName);
                    // Recover the deleted state present in DB from imported page
                    existingPage
                            .getUnpublishedPage()
                            .setDeletedAt(newPage.getUnpublishedPage().getDeletedAt());
                    existingPage.setDeletedAt(newPage.getDeletedAt());
                    existingPage.setDeleted(newPage.getDeleted());
                    existingPage.setPolicies(existingPagePolicy);
                    return newPageService.save(existingPage);
                } else {
                    // check if user has permission to add new page to the application
                    if (!permissionProvider.canCreatePage(application)) {
                        log.error(
                                "User does not have permission to create page in application with id: {}",
                                application.getId());
                        return Mono.error(new AppsmithException(
                                AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION, application.getId()));
                    }
                    if (application.getGitApplicationMetadata() != null) {
                        final String defaultApplicationId =
                                application.getGitApplicationMetadata().getDefaultApplicationId();
                        return newPageService
                                .findByGitSyncIdAndDefaultApplicationId(
                                        defaultApplicationId, newPage.getGitSyncId(), Optional.empty())
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
                                    // Create new page but keep defaultApplicationId and defaultPageId same for both the
                                    // pages
                                    defaultResources.setBranchName(branchName);
                                    newPage.setDefaultResources(defaultResources);
                                    newPage.getUnpublishedPage()
                                            .setDeletedAt(branchedPage
                                                    .getUnpublishedPage()
                                                    .getDeletedAt());
                                    newPage.setDeletedAt(branchedPage.getDeletedAt());
                                    newPage.setDeleted(branchedPage.getDeleted());
                                    // Set policies from existing branch object
                                    newPage.setPolicies(branchedPage.getPolicies());
                                    return newPageService.save(newPage);
                                });
                    }
                    return saveNewPageAndUpdateDefaultResources(newPage, branchName);
                }
            });
        });
    }

    private Mono<NewPage> saveNewPageAndUpdateDefaultResources(NewPage newPage, String branchName) {
        NewPage update = new NewPage();
        return newPageService.save(newPage).flatMap(page -> {
            update.setDefaultResources(
                    DefaultResourcesUtils.createDefaultIdsOrUpdateWithGivenResourceIds(page, branchName)
                            .getDefaultResources());
            return newPageService.update(page.getId(), update);
        });
    }

    private Set<String> getLayoutOnLoadActionsForPage(
            NewPage page,
            Map<String, String> actionIdMap,
            Map<String, List<String>> unpublishedActionIdToCollectionIdsMap,
            Map<String, List<String>> publishedActionIdToCollectionIdsMap) {
        Set<String> layoutOnLoadActions = new HashSet<>();
        if (page.getUnpublishedPage().getLayouts() != null) {

            page.getUnpublishedPage().getLayouts().forEach(layout -> {
                if (layout.getLayoutOnLoadActions() != null) {
                    layout.getLayoutOnLoadActions()
                            .forEach(onLoadAction -> onLoadAction.forEach(actionDTO -> {
                                actionDTO.setId(actionIdMap.get(actionDTO.getId()));
                                if (!CollectionUtils.sizeIsEmpty(unpublishedActionIdToCollectionIdsMap)
                                        && !CollectionUtils.isEmpty(
                                                unpublishedActionIdToCollectionIdsMap.get(actionDTO.getId()))) {
                                    actionDTO.setCollectionId(unpublishedActionIdToCollectionIdsMap
                                            .get(actionDTO.getId())
                                            .get(0));
                                }
                                layoutOnLoadActions.add(actionDTO.getId());
                            }));
                }
            });
        }

        if (page.getPublishedPage() != null && page.getPublishedPage().getLayouts() != null) {

            page.getPublishedPage().getLayouts().forEach(layout -> {
                if (layout.getLayoutOnLoadActions() != null) {
                    layout.getLayoutOnLoadActions()
                            .forEach(onLoadAction -> onLoadAction.forEach(actionDTO -> {
                                actionDTO.setId(actionIdMap.get(actionDTO.getId()));
                                if (!CollectionUtils.sizeIsEmpty(publishedActionIdToCollectionIdsMap)
                                        && !CollectionUtils.isEmpty(
                                                publishedActionIdToCollectionIdsMap.get(actionDTO.getId()))) {
                                    actionDTO.setCollectionId(publishedActionIdToCollectionIdsMap
                                            .get(actionDTO.getId())
                                            .get(0));
                                }
                                layoutOnLoadActions.add(actionDTO.getId());
                            }));
                }
            });
        }

        layoutOnLoadActions.remove(null);
        return layoutOnLoadActions;
    }

    // This method will update the action id in saved page for layoutOnLoadAction
    private Mono<NewPage> mapActionAndCollectionIdWithPageLayout(
            NewPage newPage,
            Map<String, String> actionIdMap,
            Map<String, List<String>> unpublishedActionIdToCollectionIdsMap,
            Map<String, List<String>> publishedActionIdToCollectionIdsMap) {

        return Mono.just(newPage).flatMap(page -> {
            return newActionService
                    .findAllById(getLayoutOnLoadActionsForPage(
                            page,
                            actionIdMap,
                            unpublishedActionIdToCollectionIdsMap,
                            publishedActionIdToCollectionIdsMap))
                    .map(newAction -> {
                        final String defaultActionId =
                                newAction.getDefaultResources().getActionId();
                        if (page.getUnpublishedPage().getLayouts() != null) {
                            final String defaultCollectionId = newAction
                                    .getUnpublishedAction()
                                    .getDefaultResources()
                                    .getCollectionId();
                            page.getUnpublishedPage().getLayouts().forEach(layout -> {
                                if (layout.getLayoutOnLoadActions() != null) {
                                    layout.getLayoutOnLoadActions().forEach(onLoadAction -> onLoadAction.stream()
                                            .filter(actionDTO ->
                                                    StringUtils.equals(actionDTO.getId(), newAction.getId()))
                                            .forEach(actionDTO -> {
                                                actionDTO.setDefaultActionId(defaultActionId);
                                                actionDTO.setDefaultCollectionId(defaultCollectionId);
                                            }));
                                }
                            });
                        }

                        if (page.getPublishedPage() != null
                                && page.getPublishedPage().getLayouts() != null) {
                            page.getPublishedPage().getLayouts().forEach(layout -> {
                                if (layout.getLayoutOnLoadActions() != null) {
                                    layout.getLayoutOnLoadActions().forEach(onLoadAction -> onLoadAction.stream()
                                            .filter(actionDTO ->
                                                    StringUtils.equals(actionDTO.getId(), newAction.getId()))
                                            .forEach(actionDTO -> {
                                                actionDTO.setDefaultActionId(defaultActionId);
                                                if (newAction.getPublishedAction() != null
                                                        && newAction
                                                                        .getPublishedAction()
                                                                        .getDefaultResources()
                                                                != null) {
                                                    actionDTO.setDefaultCollectionId(newAction
                                                            .getPublishedAction()
                                                            .getDefaultResources()
                                                            .getCollectionId());
                                                }
                                            }));
                                }
                            });
                        }
                        return newAction;
                    })
                    .collectList()
                    .thenReturn(page);
        });
    }

    /**
     * This will check if the datasource is already present in the workspace and create a new one if unable to find one
     *
     * @param existingDatasourceFlux already present datasource in the workspace
     * @param datasourceStorage      which will be checked against existing datasources
     * @param workspace              workspace where duplicate datasource should be checked
     * @return already present or brand new datasource depending upon the equality check
     */
    private Mono<Datasource> createUniqueDatasourceIfNotPresent(
            Flux<Datasource> existingDatasourceFlux,
            DatasourceStorage datasourceStorage,
            Workspace workspace,
            String environmentId,
            ImportApplicationPermissionProvider permissionProvider) {
        /*
           1. If same datasource is present return
           2. If unable to find the datasource create a new datasource with unique name and return
        */
        final DatasourceConfiguration datasourceConfig = datasourceStorage.getDatasourceConfiguration();
        AuthenticationResponse authResponse = new AuthenticationResponse();
        if (datasourceConfig != null && datasourceConfig.getAuthentication() != null) {
            copyNestedNonNullProperties(datasourceConfig.getAuthentication().getAuthenticationResponse(), authResponse);
            datasourceConfig.getAuthentication().setAuthenticationResponse(null);
            datasourceConfig.getAuthentication().setAuthenticationType(null);
        }

        return existingDatasourceFlux
                // For git import exclude datasource configuration
                .filter(ds -> ds.getName().equals(datasourceStorage.getName())
                        && datasourceStorage.getPluginId().equals(ds.getPluginId()))
                .next() // Get the first matching datasource, we don't need more than one here.
                .switchIfEmpty(Mono.defer(() -> {
                    // check if user has permission to create datasource
                    if (!permissionProvider.canCreateDatasource(workspace)) {
                        log.error(
                                "Unauthorized to create datasource: {} in workspace: {}",
                                datasourceStorage.getName(),
                                workspace.getName());
                        return Mono.error(new AppsmithException(
                                AppsmithError.ACL_NO_RESOURCE_FOUND,
                                FieldName.DATASOURCE,
                                datasourceStorage.getName()));
                    }

                    if (datasourceConfig != null && datasourceConfig.getAuthentication() != null) {
                        datasourceConfig.getAuthentication().setAuthenticationResponse(authResponse);
                    }
                    // No matching existing datasource found, so create a new one.
                    datasourceStorage.setIsConfigured(
                            datasourceConfig != null && datasourceConfig.getAuthentication() != null);
                    datasourceStorage.setEnvironmentId(environmentId);

                    return datasourceService
                            .findByNameAndWorkspaceId(datasourceStorage.getName(), workspace.getId(), Optional.empty())
                            .flatMap(duplicateNameDatasource ->
                                    getUniqueSuffixForDuplicateNameEntity(duplicateNameDatasource, workspace.getId()))
                            .map(dsName -> {
                                datasourceStorage.setName(datasourceStorage.getName() + dsName);
                                return datasourceService.createDatasourceFromDatasourceStorage(datasourceStorage);
                            })
                            .switchIfEmpty(Mono.just(
                                    datasourceService.createDatasourceFromDatasourceStorage(datasourceStorage)))
                            .flatMap(datasourceService::createWithoutPermissions);
                }));
    }

    /**
     * Here we will be rehydrating the sensitive fields like password, secrets etc. in datasourceStorage while importing the application
     *
     * @param datasourceStorage for which sensitive fields should be rehydrated
     * @param decryptedFields   sensitive fields
     * @return updated datasourceStorage with rehydrated sensitive fields
     */
    private DatasourceStorage updateAuthenticationDTO(
            DatasourceStorage datasourceStorage, DecryptedSensitiveFields decryptedFields) {

        final DatasourceConfiguration dsConfig = datasourceStorage.getDatasourceConfiguration();
        String authType = decryptedFields.getAuthType();
        if (dsConfig == null || authType == null) {
            return datasourceStorage;
        }

        if (StringUtils.equals(authType, DBAuth.class.getName())) {
            final DBAuth dbAuth = decryptedFields.getDbAuth();
            dbAuth.setPassword(decryptedFields.getPassword());
            datasourceStorage.getDatasourceConfiguration().setAuthentication(dbAuth);
        } else if (StringUtils.equals(authType, BasicAuth.class.getName())) {
            final BasicAuth basicAuth = decryptedFields.getBasicAuth();
            basicAuth.setPassword(decryptedFields.getPassword());
            datasourceStorage.getDatasourceConfiguration().setAuthentication(basicAuth);
        } else if (StringUtils.equals(authType, OAuth2.class.getName())) {
            OAuth2 auth2 = decryptedFields.getOpenAuth2();
            AuthenticationResponse authResponse = new AuthenticationResponse();
            auth2.setClientSecret(decryptedFields.getPassword());
            authResponse.setToken(decryptedFields.getToken());
            authResponse.setRefreshToken(decryptedFields.getRefreshToken());
            authResponse.setTokenResponse(decryptedFields.getTokenResponse());
            authResponse.setExpiresAt(Instant.now());
            auth2.setAuthenticationResponse(authResponse);
            datasourceStorage.getDatasourceConfiguration().setAuthentication(auth2);
        } else if (StringUtils.equals(authType, BearerTokenAuth.class.getName())) {
            BearerTokenAuth auth = new BearerTokenAuth();
            auth.setBearerToken(decryptedFields.getBearerTokenAuth().getBearerToken());
            datasourceStorage.getDatasourceConfiguration().setAuthentication(auth);
        }
        return datasourceStorage;
    }

    private Mono<Application> importThemes(
            Application application, ApplicationJson importedApplicationJson, boolean appendToApp) {
        if (appendToApp) {
            // appending to existing app, theme should not change
            return Mono.just(application);
        }
        return themeService.importThemesToApplication(application, importedApplicationJson);
    }

    /**
     * This will be used to dehydrate sensitive fields from the datasourceStorage while exporting the application
     *
     * @param datasourceStorage entity from which sensitive fields need to be dehydrated
     * @return sensitive fields which then will be deserialized and exported in JSON file
     */
    private DecryptedSensitiveFields getDecryptedFields(DatasourceStorage datasourceStorage) {
        final AuthenticationDTO authentication = datasourceStorage.getDatasourceConfiguration() == null
                ? null
                : datasourceStorage.getDatasourceConfiguration().getAuthentication();

        if (authentication != null) {
            DecryptedSensitiveFields dsDecryptedFields = authentication.getAuthenticationResponse() == null
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
            } else if (authentication instanceof BearerTokenAuth auth) {
                dsDecryptedFields.setBearerTokenAuth(auth);
            }
            dsDecryptedFields.setAuthType(authentication.getClass().getName());
            return dsDecryptedFields;
        }
        return null;
    }

    public Mono<List<Datasource>> findDatasourceByApplicationId(String applicationId, String workspaceId) {
        // TODO: Investigate further why datasourcePermission.getReadPermission() is not being used.
        Mono<List<Datasource>> listMono = datasourceService
                .getAllByWorkspaceIdWithStorages(workspaceId, Optional.empty())
                .collectList();
        return newActionService
                .findAllByApplicationIdAndViewMode(applicationId, false, Optional.empty(), Optional.empty())
                .collectList()
                .zipWith(listMono)
                .flatMap(objects -> {
                    List<Datasource> datasourceList = objects.getT2();
                    List<NewAction> actionList = objects.getT1();
                    List<String> usedDatasource = actionList.stream()
                            .map(newAction -> newAction
                                    .getUnpublishedAction()
                                    .getDatasource()
                                    .getId())
                            .collect(Collectors.toList());

                    datasourceList.removeIf(datasource -> !usedDatasource.contains(datasource.getId()));

                    return Mono.just(datasourceList);
                });
    }

    @Override
    public Mono<ApplicationImportDTO> getApplicationImportDTO(
            String applicationId, String workspaceId, Application application) {
        return findDatasourceByApplicationId(applicationId, workspaceId)
                .zipWith(workspaceService.getDefaultEnvironmentId(workspaceId))
                .map(tuple2 -> {
                    List<Datasource> datasources = tuple2.getT1();
                    String environmentId = tuple2.getT2();
                    ApplicationImportDTO applicationImportDTO = new ApplicationImportDTO();
                    applicationImportDTO.setApplication(application);
                    Boolean isUnConfiguredDatasource = datasources.stream().anyMatch(datasource -> {
                        DatasourceStorageDTO datasourceStorageDTO =
                                datasource.getDatasourceStorages().get(environmentId);
                        return Boolean.FALSE.equals(datasourceStorageDTO.getIsConfigured());
                    });
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
    public Mono<Application> mergeApplicationJsonWithApplication(
            String workspaceId,
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
            applicationJson.getExportedApplication().setForkWithConfiguration(null);
            applicationJson.getExportedApplication().setClonedFromApplicationId(null);
            applicationJson.getExportedApplication().setExportWithConfiguration(null);
        }

        // need to remove git sync id. Also filter pages if pageToImport is not empty
        if (applicationJson.getPageList() != null) {
            List<ApplicationPage> applicationPageList =
                    new ArrayList<>(applicationJson.getPageList().size());
            List<String> pageNames =
                    new ArrayList<>(applicationJson.getPageList().size());
            List<NewPage> importedNewPageList = applicationJson.getPageList().stream()
                    .filter(newPage -> newPage.getUnpublishedPage() != null
                            && (CollectionUtils.isEmpty(pagesToImport)
                                    || pagesToImport.contains(
                                            newPage.getUnpublishedPage().getName())))
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
        }
        if (applicationJson.getActionList() != null) {
            List<NewAction> importedNewActionList = applicationJson.getActionList().stream()
                    .filter(newAction -> newAction.getUnpublishedAction() != null
                            && (CollectionUtils.isEmpty(pagesToImport)
                                    || pagesToImport.contains(
                                            newAction.getUnpublishedAction().getPageId())))
                    .peek(newAction ->
                            newAction.setGitSyncId(null)) // setting this null so that this action can be imported again
                    .collect(Collectors.toList());
            applicationJson.setActionList(importedNewActionList);
        }
        if (applicationJson.getActionCollectionList() != null) {
            List<ActionCollection> importedActionCollectionList = applicationJson.getActionCollectionList().stream()
                    .filter(actionCollection -> (CollectionUtils.isEmpty(pagesToImport)
                            || pagesToImport.contains(
                                    actionCollection.getUnpublishedCollection().getPageId())))
                    .peek(actionCollection -> actionCollection.setGitSyncId(
                            null)) // setting this null so that this action collection can be imported again
                    .collect(Collectors.toList());
            applicationJson.setActionCollectionList(importedActionCollectionList);
        }

        return permissionGroupRepository.getCurrentUserPermissionGroups().flatMap(userPermissionGroups -> {
            ImportApplicationPermissionProvider permissionProvider = ImportApplicationPermissionProvider.builder(
                            applicationPermission,
                            pagePermission,
                            actionPermission,
                            datasourcePermission,
                            workspacePermission)
                    .requiredPermissionOnTargetWorkspace(workspacePermission.getReadPermission())
                    .requiredPermissionOnTargetApplication(applicationPermission.getEditPermission())
                    .allPermissionsRequired()
                    .currentUserPermissionGroups(userPermissionGroups)
                    .build();
            return importApplicationInWorkspace(
                    workspaceId, applicationJson, applicationId, branchName, true, permissionProvider);
        });
    }

    private Mono<Map<String, String>> updateNewPagesBeforeMerge(
            Mono<List<NewPage>> existingPagesMono, List<NewPage> newPagesList) {
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
     * @param application Application object imported or exported
     * @param event       AnalyticsEvents event
     * @return The application which is imported or exported
     */
    private Mono<Application> sendImportExportApplicationAnalyticsEvent(
            Application application, AnalyticsEvents event) {
        return workspaceService.getById(application.getWorkspaceId()).flatMap(workspace -> {
            final Map<String, Object> eventData = Map.of(
                    FieldName.APPLICATION, application,
                    FieldName.WORKSPACE, workspace);

            final Map<String, Object> data = Map.of(
                    FieldName.APPLICATION_ID, application.getId(),
                    FieldName.WORKSPACE_ID, workspace.getId(),
                    FieldName.EVENT_DATA, eventData);

            return analyticsService.sendObjectEvent(event, application, data);
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
        return applicationService
                .findById(applicationId, Optional.empty())
                .flatMap(application -> sendImportExportApplicationAnalyticsEvent(application, event));
    }
}
