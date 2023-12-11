package com.appsmith.server.imports.internal;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
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
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ImportExportUtils;
import com.appsmith.server.helpers.ce.ImportApplicationPermissionProvider;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.migrations.ApplicationVersion;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.SessionUserService;
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
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.helpers.ImportExportUtils.setPropertiesToExistingApplication;
import static com.appsmith.server.helpers.ImportExportUtils.setPublishedApplicationProperties;

@Slf4j
@RequiredArgsConstructor
public class ImportApplicationServiceCEImpl implements ImportApplicationServiceCE {

    private static final Set<MediaType> ALLOWED_CONTENT_TYPES = Set.of(MediaType.APPLICATION_JSON);
    private static final String INVALID_JSON_FILE = "invalid json file";
    private final DatasourceService datasourceService;
    private final SessionUserService sessionUserService;
    private final WorkspaceService workspaceService;
    private final ApplicationService applicationService;
    private final ApplicationPageService applicationPageService;
    private final NewActionService newActionService;
    private final AnalyticsService analyticsService;
    private final DatasourcePermission datasourcePermission;
    private final WorkspacePermission workspacePermission;
    private final ApplicationPermission applicationPermission;
    private final PagePermission pagePermission;
    private final ActionPermission actionPermission;
    private final Gson gson;
    private final TransactionalOperator transactionalOperator;
    private final PermissionGroupRepository permissionGroupRepository;
    private final ImportableService<Plugin> pluginImportableService;
    private final ImportableService<Theme> themeImportableService;
    private final ImportableService<NewPage> newPageImportableService;
    private final ImportableService<CustomJSLib> customJSLibImportableService;
    private final ImportableService<Datasource> datasourceImportableService;
    private final ImportableService<NewAction> newActionImportableService;
    private final ImportableService<ActionCollection> actionCollectionImportableService;

    @Override
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
        if (importedDoc.getExportedApplication() == null) {
            errorField = FieldName.APPLICATION;
        } else if (CollectionUtils.isEmpty(importedDoc.getPageList())) {
            errorField = FieldName.PAGE_LIST;
        } else if (importedDoc.getActionList() == null) {
            errorField = FieldName.ACTIONS;
        } else if (importedDoc.getDatasourceList() == null) {
            errorField = FieldName.DATASOURCE;
        }

        return errorField;
    }

    private Mono<Application> getImportApplicationMono(
            Application importedApplication,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<User> currUserMono) {
        Mono<Application> importApplicationMono = Mono.just(importedApplication)
                .map(application -> {
                    if (application.getApplicationVersion() == null) {
                        application.setApplicationVersion(ApplicationVersion.EARLIEST_VERSION);
                    }
                    application.setViewMode(false);
                    application.setForkWithConfiguration(null);
                    application.setExportWithConfiguration(null);
                    application.setWorkspaceId(importingMetaDTO.getWorkspaceId());
                    application.setIsPublic(null);
                    application.setPolicies(null);
                    application.setPages(null);
                    application.setPublishedPages(null);
                    return application;
                })
                .map(application -> {
                    application.setUnpublishedCustomJSLibs(
                            new HashSet<>(mappedImportableResourcesDTO.getInstalledJsLibsList()));
                    return application;
                });

        importApplicationMono = importApplicationMono.zipWith(currUserMono).map(objects -> {
            Application application = objects.getT1();
            application.setModifiedBy(objects.getT2().getUsername());
            return application;
        });

        if (StringUtils.isEmpty(importingMetaDTO.getApplicationId())) {
            importApplicationMono = importApplicationMono.flatMap(application -> {
                return applicationPageService.createOrUpdateSuffixedApplication(application, application.getName(), 0);
            });
        } else {
            Mono<Application> existingApplicationMono = applicationService
                    .findById(
                            importingMetaDTO.getApplicationId(),
                            importingMetaDTO.getPermissionProvider().getRequiredPermissionOnTargetApplication())
                    .switchIfEmpty(Mono.defer(() -> {
                        log.error(
                                "No application found with id: {} and permission: {}",
                                importingMetaDTO.getApplicationId(),
                                importingMetaDTO.getPermissionProvider().getRequiredPermissionOnTargetApplication());
                        return Mono.error(new AppsmithException(
                                AppsmithError.ACL_NO_RESOURCE_FOUND,
                                FieldName.APPLICATION,
                                importingMetaDTO.getApplicationId()));
                    }))
                    .cache();

            // this can be a git sync, import page from template, update app with json, restore snapshot
            if (importingMetaDTO.getAppendToApp()) { // we don't need to do anything with the imported application
                importApplicationMono = existingApplicationMono;
            } else {
                importApplicationMono = importApplicationMono
                        .zipWith(existingApplicationMono)
                        .map(objects -> {
                            Application newApplication = objects.getT1();
                            Application existingApplication = objects.getT2();
                            // This method sets the published mode properties in the imported
                            // application.When a user imports an application from the git repo,
                            // since the git only stores the unpublished version, the current
                            // deployed version in the newly imported app is not updated.
                            // This function sets the initial deployed version to the same as the
                            // edit mode one.
                            setPublishedApplicationProperties(newApplication);
                            setPropertiesToExistingApplication(newApplication, existingApplication);
                            return existingApplication;
                        })
                        .flatMap(application -> {
                            Mono<Application> parentApplicationMono;
                            if (application.getGitApplicationMetadata() != null) {
                                parentApplicationMono = applicationService.findById(
                                        application.getGitApplicationMetadata().getDefaultApplicationId());
                            } else {
                                parentApplicationMono = Mono.just(application);
                            }
                            return Mono.zip(Mono.just(application), parentApplicationMono);
                        })
                        .flatMap(objects -> {
                            Application application = objects.getT1();
                            Application parentApplication = objects.getT2();
                            application.setPolicies(parentApplication.getPolicies());
                            return applicationService
                                    .save(application)
                                    .onErrorResume(DuplicateKeyException.class, error -> {
                                        if (error.getMessage() != null) {
                                            return applicationPageService.createOrUpdateSuffixedApplication(
                                                    application, application.getName(), 0);
                                        }
                                        throw error;
                                    });
                        });
            }
        }
        return importApplicationMono
                .elapsed()
                .map(tuples -> {
                    log.debug("time to create or update application object: {}", tuples.getT1());
                    return tuples.getT2();
                })
                .onErrorResume(error -> {
                    log.error("Error while creating or updating application object", error);
                    return Mono.error(error);
                });
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
            if (errorField.equals(FieldName.APPLICATION)) {
                return Mono.error(
                        new AppsmithException(
                                AppsmithError.VALIDATION_FAILURE,
                                "Field '" + errorField
                                        + "' Sorry! Seems like you've imported a page-level json instead of an application. Please use the import within the page."));
            }
            return Mono.error(new AppsmithException(
                    AppsmithError.VALIDATION_FAILURE, "Field '" + errorField + "' is missing in the JSON."));
        }

        ImportingMetaDTO importingMetaDTO =
                new ImportingMetaDTO(workspaceId, applicationId, branchName, appendToApp, permissionProvider);

        MappedImportableResourcesDTO mappedImportableResourcesDTO = new MappedImportableResourcesDTO();

        Application importedApplication = importedDoc.getExportedApplication();
        importedApplication.setServerSchemaVersion(importedDoc.getServerSchemaVersion());
        importedApplication.setClientSchemaVersion(importedDoc.getClientSchemaVersion());

        Mono<Workspace> workspaceMono = workspaceService
                .findById(workspaceId, permissionProvider.getRequiredPermissionOnTargetWorkspace())
                .switchIfEmpty(Mono.defer(() -> {
                    log.error(
                            "No workspace found with id: {} and permission: {}",
                            workspaceId,
                            permissionProvider.getRequiredPermissionOnTargetWorkspace());
                    return Mono.error(new AppsmithException(
                            AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId));
                }))
                .cache();

        Mono<User> currUserMono = sessionUserService.getCurrentUser().cache();

        Mono<Void> applicationSpecificImportedEntitiesMono =
                applicationSpecificImportedEntities(applicationJson, importingMetaDTO, mappedImportableResourcesDTO);

        // Start the stopwatch to log the execution time
        Stopwatch stopwatch = new Stopwatch(AnalyticsEvents.IMPORT.getEventName());

        /*
         Calling the workspaceMono first to avoid creating multiple mongo transactions.
         If the first db call inside a transaction is a Flux, then there's a chance of creating multiple mongo
         transactions which will lead to NoSuchTransaction exception.
        */
        final Mono<Application> importedApplicationMono = workspaceMono
                .then(applicationSpecificImportedEntitiesMono)
                .then(getImportApplicationMono(
                        importedApplication, importingMetaDTO, mappedImportableResourcesDTO, currUserMono))
                .cache();

        Mono<Application> importMono = importedApplicationMono
                .then(getImportableEntities(
                        importingMetaDTO,
                        mappedImportableResourcesDTO,
                        workspaceMono,
                        importedApplicationMono,
                        applicationJson))
                .then(importedApplicationMono)
                .flatMap(application -> {
                    return newActionImportableService
                            .updateImportedEntities(application, importingMetaDTO, mappedImportableResourcesDTO, false)
                            .then(newPageImportableService.updateImportedEntities(
                                    application, importingMetaDTO, mappedImportableResourcesDTO, false))
                            .thenReturn(application);
                })
                .flatMap(application -> {
                    log.info("Imported application with id {}", application.getId());
                    // Need to update the application object with updated pages and publishedPages
                    Application updateApplication = new Application();
                    updateApplication.setPages(application.getPages());
                    updateApplication.setPublishedPages(application.getPublishedPages());

                    return applicationService.update(application.getId(), updateApplication);
                })
                .onErrorResume(throwable -> {
                    String errorMessage = ImportExportUtils.getErrorMessage(throwable);
                    log.error("Error importing application. Error: {}", errorMessage, throwable);
                    return Mono.error(
                            new AppsmithException(AppsmithError.GENERIC_JSON_IMPORT_ERROR, workspaceId, errorMessage));
                })
                .as(transactionalOperator::transactional);

        final Mono<Application> resultMono = importMono
                .flatMap(application ->
                        sendImportExportApplicationAnalyticsEvent(application.getId(), AnalyticsEvents.IMPORT))
                .zipWith(currUserMono)
                .flatMap(tuple -> {
                    Application application = tuple.getT1();
                    stopwatch.stopTimer();
                    stopwatch.stopAndLogTimeInMillis();
                    int jsObjectCount = CollectionUtils.isEmpty(applicationJson.getActionCollectionList())
                            ? 0
                            : applicationJson.getActionCollectionList().size();
                    int actionCount = CollectionUtils.isEmpty(applicationJson.getActionList())
                            ? 0
                            : applicationJson.getActionList().size();

                    final Map<String, Object> data = Map.of(
                            FieldName.APPLICATION_ID,
                            application.getId(),
                            FieldName.WORKSPACE_ID,
                            application.getWorkspaceId(),
                            "pageCount",
                            applicationJson.getPageList().size(),
                            "actionCount",
                            actionCount,
                            "JSObjectCount",
                            jsObjectCount,
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

        // Import Application is currently a slow API because it needs to import and create application, pages, actions
        // and action collection. This process may take time and the client may cancel the request. This leads to the
        // flow getting stopped midway producing corrupted objects in DB. The following ensures that even though the
        // client may have refreshes the page, the imported application is available and is in sane state.
        // To achieve this, we use a synchronous sink which does not take subscription cancellations into account. This
        // means that even if the subscriber has cancelled its subscription, the create method still generates its
        // event.
        return Mono.create(sink -> resultMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    private Mono<Void> getImportableEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<Application> importedApplicationMono,
            ApplicationJson applicationJson) {

        List<Mono<Void>> pageIndependentImportables = getPageIndependentImportables(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                applicationJson);

        List<Mono<Void>> pageDependentImportables = getPageDependentImportables(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                applicationJson);

        return Flux.merge(pageIndependentImportables)
                .thenMany(Flux.merge(pageDependentImportables))
                .then();
    }

    protected List<Mono<Void>> getPageIndependentImportables(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<Application> importedApplicationMono,
            ApplicationJson applicationJson) {

        // Updates plugin map in importable resources
        Mono<Void> installedPluginsMono = pluginImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                applicationJson,
                false);

        // Directly updates required theme information in DB
        Mono<Void> importedThemesMono = themeImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                applicationJson,
                false);

        // Updates pageNametoIdMap and pageNameMap in importable resources.
        // Also directly updates required information in DB
        Mono<Void> importedPagesMono = newPageImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                applicationJson,
                false);

        // Requires pluginMap to be present in importable resources.
        // Updates datasourceNameToIdMap in importable resources.
        // Also directly updates required information in DB
        Mono<Void> importedDatasourcesMono = installedPluginsMono.then(datasourceImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                applicationJson,
                false));

        return List.of(importedDatasourcesMono, importedPagesMono, importedThemesMono);
    }

    protected List<Mono<Void>> getPageDependentImportables(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<Application> importedApplicationMono,
            ApplicationJson applicationJson) {

        // Requires pageNameMap, pageNameToOldNameMap, pluginMap and datasourceNameToIdMap to be present in importable
        // resources.
        // Updates actionResultDTO in importable resources.
        // Also directly updates required information in DB
        Mono<Void> importedNewActionsMono = newActionImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                applicationJson,
                false);

        // Requires pageNameMap, pageNameToOldNameMap, pluginMap and actionResultDTO to be present in importable
        // resources.
        // Updates actionCollectionResultDTO in importable resources.
        // Also directly updates required information in DB
        Mono<Void> importedActionCollectionsMono = actionCollectionImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                applicationJson,
                false);

        Mono<Void> combinedActionExportablesMono = importedNewActionsMono.then(importedActionCollectionsMono);
        return List.of(combinedActionExportablesMono);
    }

    private Mono<Void> applicationSpecificImportedEntities(
            ApplicationJson applicationJson,
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO) {
        // Persists relevant information and updates mapped resources
        Mono<Void> installedJsLibsMono = customJSLibImportableService.importEntities(
                importingMetaDTO, mappedImportableResourcesDTO, null, null, applicationJson, false);
        return installedJsLibsMono;
    }

    @Override
    public Mono<ApplicationImportDTO> getApplicationImportDTO(
            String applicationId, String workspaceId, Application application) {
        return findDatasourceByApplicationId(applicationId, workspaceId)
                .zipWith(workspaceService.getDefaultEnvironmentId(workspaceId, null))
                .map(tuple2 -> {
                    List<Datasource> datasources = tuple2.getT1();
                    String environmentId = tuple2.getT2();
                    ApplicationImportDTO applicationImportDTO = new ApplicationImportDTO();
                    applicationImportDTO.setApplication(application);
                    Boolean isUnConfiguredDatasource = datasources.stream().anyMatch(datasource -> {
                        DatasourceStorageDTO datasourceStorageDTO =
                                datasource.getDatasourceStorages().get(environmentId);
                        if (datasourceStorageDTO == null) {
                            // If this environment has not been configured,
                            // We do not expect to find a storage, user will have to reconfigure
                            return Boolean.FALSE;
                        }
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

    @Override
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
