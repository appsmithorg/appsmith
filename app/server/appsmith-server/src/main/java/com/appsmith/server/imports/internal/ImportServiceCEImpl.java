package com.appsmith.server.imports.internal;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.applications.imports.ApplicationImportService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ImportableJsonType;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.ImportableContext;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ImportableContextDTO;
import com.appsmith.server.dtos.ImportableContextJson;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ImportExportUtils;
import com.appsmith.server.helpers.ce.ImportApplicationPermissionProvider;
import com.appsmith.server.imports.importable.ImportServiceCE;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.migrations.ContextSchemaMigration;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.constants.ImportableJsonType.APPLICATION;

@Slf4j
public class ImportServiceCEImpl implements ImportServiceCE {

    public static final Set<MediaType> ALLOWED_CONTENT_TYPES = Set.of(MediaType.APPLICATION_JSON);
    private static final String INVALID_JSON_FILE = "invalid json file";
    private final ApplicationImportService applicationImportService;
    private final SessionUserService sessionUserService;
    private final WorkspaceService workspaceService;
    private final ImportableService<CustomJSLib> customJSLibImportableService;
    private final PermissionGroupRepository permissionGroupRepository;
    private final TransactionalOperator transactionalOperator;
    private final AnalyticsService analyticsService;
    private final ImportableService<Plugin> pluginImportableService;
    private final ImportableService<Datasource> datasourceImportableService;
    private final ImportableService<Theme> themeImportableService;
    private final Map<ImportableJsonType, ContextBasedImportService<?, ?, ?>> serviceFactory = new HashMap<>();

    public ImportServiceCEImpl(
            ApplicationImportService applicationImportService,
            SessionUserService sessionUserService,
            WorkspaceService workspaceService,
            ImportableService<CustomJSLib> customJSLibImportableService,
            PermissionGroupRepository permissionGroupRepository,
            TransactionalOperator transactionalOperator,
            AnalyticsService analyticsService,
            ImportableService<Plugin> pluginImportableService,
            ImportableService<Datasource> datasourceImportableService,
            ImportableService<Theme> themeImportableService) {
        this.applicationImportService = applicationImportService;
        this.workspaceService = workspaceService;
        this.sessionUserService = sessionUserService;
        this.customJSLibImportableService = customJSLibImportableService;
        this.permissionGroupRepository = permissionGroupRepository;
        this.transactionalOperator = transactionalOperator;
        this.analyticsService = analyticsService;
        this.pluginImportableService = pluginImportableService;
        this.datasourceImportableService = datasourceImportableService;
        this.themeImportableService = themeImportableService;
        serviceFactory.put(APPLICATION, applicationImportService);
    }

    @Override
    public ContextBasedImportService<
                    ? extends ImportableContext, ? extends ImportableContextDTO, ? extends ImportableContextJson>
            getContextBasedImportService(ImportableContextJson importableContextJson) {
        return getContextBasedImportService(importableContextJson.getImportableJsonType());
    }

    @Override
    public ContextBasedImportService<
                    ? extends ImportableContext, ? extends ImportableContextDTO, ? extends ImportableContextJson>
            getContextBasedImportService(ImportableJsonType importableJsonType) {
        return serviceFactory.getOrDefault(importableJsonType, applicationImportService);
    }

    @Override
    public ContextBasedImportService<
                    ? extends ImportableContext, ? extends ImportableContextDTO, ? extends ImportableContextJson>
            getContextBasedImportService(MediaType contentType) {
        if (MediaType.APPLICATION_JSON.equals(contentType)) {
            return applicationImportService;
        }

        return applicationImportService;
    }

    public Mono<? extends ImportableContextJson> extractImportableContextJson(Part filePart) {

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
                .map(jsonString -> getContextBasedImportService(contentType).extractImportableContextJson(jsonString));
    }

    @Override
    public Mono<? extends ImportableContextDTO> extractAndSaveContext(
            String workspaceId, Part filePart, String contextId) {

        if (StringUtils.isEmpty(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        Mono<ImportableContextDTO> importedContextMono = extractImportableContextJson(filePart)
                .zipWhen(contextJson -> {
                    if (StringUtils.isEmpty(contextId)) {
                        return importNewContextInWorkspaceFromJson(workspaceId, contextJson);
                    } else {
                        return updateNonGitConnectedContextFromJson(workspaceId, contextId, contextJson);
                    }
                })
                .flatMap(tuple2 -> {
                    ImportableContext context = tuple2.getT2();
                    ImportableContextJson importableContextJson = tuple2.getT1();
                    return getContextImportDTO(
                            context.getWorkspaceId(), context.getId(), context, importableContextJson);
                });

        return Mono.create(
                sink -> importedContextMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    @Override
    public Mono<? extends ImportableContext> importNewContextInWorkspaceFromJson(
            String workspaceId, ImportableContextJson contextJson) {

        // workspace id must be present and valid
        if (StringUtils.isEmpty(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        ContextBasedImportService<?, ?, ?> contextBasedImportService = getContextBasedImportService(contextJson);
        return permissionGroupRepository
                .getCurrentUserPermissionGroups()
                .zipWhen(userPermissionGroup -> {
                    return Mono.just(contextBasedImportService.getImportContextPermissionProviderForImportingContext(
                            userPermissionGroup));
                })
                .flatMap(tuple2 -> {
                    Set<String> userPermissionGroup = tuple2.getT1();
                    ImportApplicationPermissionProvider permissionProvider = tuple2.getT2();
                    return importApplicationInWorkspace(
                            workspaceId, contextJson, null, null, false, permissionProvider, userPermissionGroup);
                });
    }

    @Override
    public Mono<? extends ImportableContext> updateNonGitConnectedContextFromJson(
            String workspaceId, String contextId, ImportableContextJson importableContextJson) {

        if (!StringUtils.isEmpty(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        if (StringUtils.isEmpty(contextId)) {
            // error message according to the context
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID));
        }

        Mono<Boolean> isContextConnectedToGitMono = Mono.just(Boolean.FALSE);

        Mono<ImportableContext> importedContextMono = isContextConnectedToGitMono.flatMap(isConnectedToGit -> {
            if (isConnectedToGit) {
                return Mono.error(new AppsmithException(
                        AppsmithError.UNSUPPORTED_IMPORT_OPERATION_FOR_GIT_CONNECTED_APPLICATION));
            } else {
                ContextBasedImportService<?, ?, ?> contextBasedImportService =
                        getContextBasedImportService(importableContextJson);
                contextBasedImportService.dehydrateNameForContextUpdate(contextId, importableContextJson);
                return permissionGroupRepository
                        .getCurrentUserPermissionGroups()
                        .zipWhen(userPermissionGroup -> {
                            return Mono.just(
                                    contextBasedImportService.getImportContextPermissionProviderForUpdatingContext(
                                            userPermissionGroup));
                        })
                        .flatMap(tuple2 -> {
                            Set<String> userPermissionGroup = tuple2.getT1();
                            ImportApplicationPermissionProvider permissionProvider = tuple2.getT2();
                            return importApplicationInWorkspace(
                                    workspaceId,
                                    importableContextJson,
                                    contextId,
                                    null,
                                    false,
                                    permissionProvider,
                                    userPermissionGroup);
                        })
                        .onErrorResume(error -> {
                            if (error instanceof AppsmithException) {
                                return Mono.error(error);
                            }
                            return Mono.error(new AppsmithException(
                                    AppsmithError.GENERIC_JSON_IMPORT_ERROR, workspaceId, error.getMessage()));
                        });
            }
        });

        return Mono.create(
                sink -> importedContextMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    @Override
    public Mono<? extends ImportableContext> importContextInWorkspaceFromGit(
            String workspaceId, String contextId, ImportableContextJson importableContextJson, String branchName) {

        ContextBasedImportService<?, ?, ?> contextBasedImportService =
                getContextBasedImportService(importableContextJson);
        return permissionGroupRepository
                .getCurrentUserPermissionGroups()
                .zipWhen(userPermissionGroups -> {
                    return Mono.just(contextBasedImportService.getImportContextPermissionProviderForConnectingToGit(
                            userPermissionGroups));
                })
                .flatMap(tuple2 -> {
                    Set<String> userPermissionGroup = tuple2.getT1();
                    ImportApplicationPermissionProvider contextPermissionProvider = tuple2.getT2();
                    return importApplicationInWorkspace(
                            workspaceId,
                            importableContextJson,
                            contextId,
                            branchName,
                            false,
                            contextPermissionProvider,
                            userPermissionGroup);
                });
    }

    public Mono<? extends ImportableContext> restoreSnapshot(
            String workspaceId, ImportableContextJson importableContextJson, String contextId, String branchName) {

        /**
         * Like Git, restore snapshot is a system level operation. So, we're not checking for any permissions here.
         * Only permission required is to edit the Context.
         */
        ContextBasedImportService<?, ?, ?> contextBasedImportService =
                getContextBasedImportService(importableContextJson);
        return permissionGroupRepository
                .getCurrentUserPermissionGroups()
                .zipWhen(userPermissionGroups -> {
                    return Mono.just(contextBasedImportService.getImportContextPermissionProviderForRestoringSnapshot(
                            userPermissionGroups));
                })
                .flatMap(tuple2 -> {
                    Set<String> userPermissionGroup = tuple2.getT1();
                    ImportApplicationPermissionProvider contextPermissionProvider = tuple2.getT2();
                    return importApplicationInWorkspace(
                            workspaceId,
                            importableContextJson,
                            contextId,
                            branchName,
                            false,
                            contextPermissionProvider,
                            userPermissionGroup);
                });
    }

    /**
     * This function will take the Json filepart and saves the application in workspace.
     * It'll not create a new ImportableContext, it'll update the existing importableContext by appending the pages to the importableContext.
     * The destination ImportableContext will be as it is, only the pages will be appended.
     * This method will only be applicable for applications for now
     * @param workspaceId ID in which the context is to be merged
     * @param contextId   default ID of the importableContext where this importableContextJson is going to get merged with
     * @param branchName      name of the branch of the importableContext where this importableContextJson is going to get merged with
     * @param importableContextJson importableContextJson of the importableContext that will be merged to
     * @param pagesToImport   Name of the pages that should be merged from the importableContextJson.
     *                        If null or empty, all pages will be merged.
     * @return Merged ImportableContext
     */
    public Mono<? extends ImportableContext> mergeImportableContextJsonWithImportableContext(
            String workspaceId,
            String contextId,
            String branchName,
            ImportableContextJson importableContextJson,
            List<String> pagesToImport) {
        ContextBasedImportService<?, ?, ?> contextBasedImportService =
                getContextBasedImportService(importableContextJson);
        contextBasedImportService.updateContextJsonWithRequiredPagesToImport(importableContextJson, pagesToImport);
        return permissionGroupRepository
                .getCurrentUserPermissionGroups()
                .zipWhen(userPermissionGroups -> {
                    return Mono.just(
                            contextBasedImportService
                                    .getImportContextPermissionProviderForMergingImportableContextWithJson(
                                            userPermissionGroups));
                })
                .flatMap(tuple2 -> {
                    Set<String> userPermissionGroup = tuple2.getT1();
                    ImportApplicationPermissionProvider contextPermissionProvider = tuple2.getT2();
                    return importApplicationInWorkspace(
                            workspaceId,
                            importableContextJson,
                            contextId,
                            branchName,
                            true,
                            contextPermissionProvider,
                            userPermissionGroup);
                });
    }

    @Override
    public Mono<? extends ImportableContextDTO> getContextImportDTO(
            String workspaceId,
            String contextId,
            ImportableContext importableContext,
            ImportableContextJson importableContextJson) {
        return getContextBasedImportService(importableContextJson)
                .getImportableContextDTO(workspaceId, contextId, importableContext);
    }

    /**
     * This method is being used to generalise import procedure for packages and applications
     * @param workspaceId
     * @param importableContextJson
     * @param contextId
     * @param branchName
     * @param appendToContext
     * @param permissionProvider
     * @return
     */
    Mono<ImportableContext> importApplicationInWorkspace(
            String workspaceId,
            ImportableContextJson importableContextJson,
            String contextId,
            String branchName,
            boolean appendToContext,
            ImportApplicationPermissionProvider permissionProvider,
            Set<String> permissionGroups) {

        ContextBasedImportService<?, ?, ?> contextBasedImportService =
                getContextBasedImportService(importableContextJson);

        /**
         * Step 1: Schema Migration
         * Step 2: Validation of context Json
         * Step 3: create placeholder objects for internal stuffs
         * Step 4: set schema version and other stuffs common misc
         * Step 5: get workspace and user with right set of permission
         * Step 6: get application specific import entities
         * Step 7: get allImportEntities like plugins, datasource, action and other stuffs
         * Step 8: get update page and new action with already created references.
         */

        // step 1: Schema Migration
        ImportableContextJson importedDoc =
                ContextSchemaMigration.migrateImportableContextJsonToLatestSchema(importableContextJson);

        // Step 2: Validation of context Json
        // check for validation error and raise exception if error found
        String errorField = validateImportableContextJson(importedDoc);
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

        ImportingMetaDTO importingMetaDTO = new ImportingMetaDTO(
                workspaceId, contextId, branchName, appendToContext, permissionProvider, permissionGroups);

        MappedImportableResourcesDTO mappedImportableResourcesDTO = new MappedImportableResourcesDTO();
        contextBasedImportService.performAuxiliaryImportTasks(importedDoc);

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

        // Start the stopwatch to log the execution time
        Stopwatch stopwatch = new Stopwatch(AnalyticsEvents.IMPORT.getEventName());

        // this would import customJsLibs for both the contexts
        Mono<Void> contextSpecificImportedEntities = contextBasedImportService.contextSpecificImportedEntities(
                importedDoc, importingMetaDTO, mappedImportableResourcesDTO);

        /*
         Calling the workspaceMono first to avoid creating multiple mongo transactions.
         If the first db call inside a transaction is a Flux, then there's a chance of creating multiple mongo
         transactions which will lead to NoSuchTransaction exception.
        */
        final Mono<? extends ImportableContext> importedContextMono = workspaceMono
                .then(contextSpecificImportedEntities)
                .then(contextBasedImportService.updateAndSaveContextInFocus(
                        importedDoc.getImportableContext(),
                        importingMetaDTO,
                        mappedImportableResourcesDTO,
                        currUserMono))
                .cache();

        Mono<? extends ImportableContext> importMono = importedContextMono
                .then(getImportableEntities(
                        importingMetaDTO,
                        mappedImportableResourcesDTO,
                        workspaceMono,
                        importedContextMono,
                        importedDoc))
                .then(importedContextMono)
                .flatMap(importableContext -> updateImportableEntities(
                        contextBasedImportService, importableContext, mappedImportableResourcesDTO, importingMetaDTO))
                .flatMap(importableContext -> updateImportableContext(contextBasedImportService, importableContext))
                .onErrorResume(throwable -> {
                    String errorMessage = ImportExportUtils.getErrorMessage(throwable);
                    log.error("Error importing application. Error: {}", errorMessage, throwable);
                    return Mono.error(
                            new AppsmithException(AppsmithError.GENERIC_JSON_IMPORT_ERROR, workspaceId, errorMessage));
                })
                .as(transactionalOperator::transactional);

        final Mono<? extends ImportableContext> resultMono = importMono
                .flatMap(importableContext ->
                        sendImportedContextAnalyticsEvent(importableContext, AnalyticsEvents.IMPORT))
                .zipWith(currUserMono)
                .flatMap(tuple -> {
                    ImportableContext importableContext = tuple.getT1();
                    User user = tuple.getT2();
                    stopwatch.stopTimer();
                    stopwatch.stopAndLogTimeInMillis();
                    return sendImportRelatedAnalyticsEvent(importedDoc, importableContext, stopwatch, user);
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

    /**
     * validates whether a importableContextJson contains the required fields or not.
     *
     * @param importedDoc importableContextJSON object that needs to be validated
     * @return Name of the field that have error. Empty string otherwise
     */
    private String validateImportableContextJson(ImportableContextJson importedDoc) {
        // validate common schema things
        String errorField = "";
        if (importedDoc.getImportableContext() == null) {
            errorField = FieldName.APPLICATION;
        }

        // validate context specific errors
        return errorField;
    }

    private Mono<? extends ImportableContext> updateImportableEntities(
            ContextBasedImportService<?, ?, ?> contextBasedImportService,
            ImportableContext importableContext,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            ImportingMetaDTO importingMetaDTO) {
        return contextBasedImportService.updateImportableEntities(
                importableContext, mappedImportableResourcesDTO, importingMetaDTO);
    }

    private Mono<? extends ImportableContext> updateImportableContext(
            ContextBasedImportService<?, ?, ?> contextBasedImportService, ImportableContext importableContext) {
        return contextBasedImportService.updateImportableContext(importableContext);
    }

    private Mono<Void> getImportableEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends ImportableContext> importedContextMono,
            ImportableContextJson importableContextJson) {

        ContextBasedImportService<?, ?, ?> contextBasedImportService =
                getContextBasedImportService(importableContextJson);

        Flux<Void> contextAgnosticImportables = obtainContextAgnosticImportables(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedContextMono,
                importableContextJson);

        Flux<Void> contextSpecificImportables = contextBasedImportService.obtainContextSpecificImportables(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedContextMono,
                importableContextJson);

        Flux<Void> contextComponentDependentImportables =
                contextBasedImportService.obtainContextComponentDependentImportables(
                        importingMetaDTO,
                        mappedImportableResourcesDTO,
                        workspaceMono,
                        importedContextMono,
                        importableContextJson);

        return contextAgnosticImportables
                .thenMany(contextSpecificImportables)
                .thenMany(contextComponentDependentImportables)
                .then();
    }

    protected Flux<Void> obtainContextAgnosticImportables(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends ImportableContext> importedApplicationMono,
            ImportableContextJson importableContextJson) {

        // Updates plugin map in importable resources
        Mono<Void> installedPluginsMono = pluginImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                importableContextJson,
                false,
                true);

        // Requires pluginMap to be present in importable resources.
        // Updates datasourceNameToIdMap in importable resources.
        // Also directly updates required information in DB
        Mono<Void> importedDatasourcesMono = installedPluginsMono.then(datasourceImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                importableContextJson,
                false,
                true));

        // Not sure whether this would be used hence has put it here for now
        // Directly updates required theme information in DB
        Mono<Void> importedThemesMono = themeImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedApplicationMono,
                importableContextJson,
                false,
                true);

        return Flux.merge(List.of(importedDatasourcesMono, importedThemesMono));
    }

    /**
     * To send analytics event for import and export of application
     *
     * @param importableContext Application object imported or exported
     * @param event             AnalyticsEvents event
     * @return The application which is imported or exported
     */
    private Mono<? extends ImportableContext> sendImportedContextAnalyticsEvent(
            ImportableContext importableContext, AnalyticsEvents event) {
        return workspaceService.getById(importableContext.getWorkspaceId()).flatMap(workspace -> {
            final Map<String, Object> eventData = Map.of(
                    // this is to be decided by
                    FieldName.APPLICATION, importableContext,
                    FieldName.WORKSPACE, workspace);

            final Map<String, Object> data = Map.of(
                    FieldName.APPLICATION_ID, importableContext.getId(),
                    FieldName.WORKSPACE_ID, workspace.getId(),
                    FieldName.EVENT_DATA, eventData);

            return analyticsService.sendObjectEvent(event, importableContext, data);
        });
    }

    private Mono<ImportableContext> sendImportRelatedAnalyticsEvent(
            ImportableContextJson importableContextJson,
            ImportableContext importableContext,
            Stopwatch stopwatch,
            User currentUser) {

        Map<String, Object> analyticsData = new HashMap<>(getContextBasedImportService(importableContextJson)
                .createImportAnalyticsData(importableContextJson, importableContext));
        analyticsData.put(FieldName.FLOW_NAME, stopwatch.getFlow());
        analyticsData.put("executionTime", stopwatch.getExecutionTime());

        return analyticsService
                .sendEvent(AnalyticsEvents.UNIT_EXECUTION_TIME.getEventName(), currentUser.getUsername(), analyticsData)
                .thenReturn(importableContext);
    }
}
