package com.appsmith.server.imports.internal;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.applications.imports.ApplicationImportService;
import com.appsmith.server.constants.ArtifactJsonType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.ImportableArtifact;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ImportableArtifactDTO;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ImportExportUtils;
import com.appsmith.server.helpers.ce.ImportArtifactPermissionProvider;
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

import static com.appsmith.server.constants.ArtifactJsonType.APPLICATION;

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
    private final Map<ArtifactJsonType, ContextBasedImportService<?, ?, ?>> serviceFactory = new HashMap<>();

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

    /**
     * This method provides the importService specific to context based on the ArtifactJsonType.
     * time complexity is O(1), as the map from which the service is being passes is pre-computed
     * @param importableContextJson : Entity Json which is implementing the importableContextJson
     * @return import-service which is implementing the ContextBasedServiceInterface
     */
    @Override
    public ContextBasedImportService<
                    ? extends ImportableArtifact, ? extends ImportableArtifactDTO, ? extends ArtifactExchangeJson>
            getContextBasedImportService(ArtifactExchangeJson importableContextJson) {
        return getContextBasedImportService(importableContextJson.getArtifactJsonType());
    }

    /**
     * This method provides the importService specific to context based on the ArtifactJsonType.
     * time complexity is O(1), as the map from which the service is being passes is pre-computed
     * @param artifactJsonType : Type of Json serialisation
     * @return import-service which is implementing the ContextBasedServiceInterface
     */
    @Override
    public ContextBasedImportService<
                    ? extends ImportableArtifact, ? extends ImportableArtifactDTO, ? extends ArtifactExchangeJson>
            getContextBasedImportService(ArtifactJsonType artifactJsonType) {
        return serviceFactory.getOrDefault(artifactJsonType, applicationImportService);
    }

    /**
     * This method takes a file part and makes a Json entity which implements the ArtifactExchangeJson interface
     *
     * @param filePart           : filePart from which the contents would be made
     * @param artifactJsonType : type of the json which is getting imported
     * @return : Json entity which implements ArtifactExchangeJson
     */
    public Mono<? extends ArtifactExchangeJson> extractImportableContextJson(
            Part filePart, ArtifactJsonType artifactJsonType) {

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
                .map(jsonString ->
                        getContextBasedImportService(artifactJsonType).extractImportableContextJson(jsonString));
    }

    /**
     * Hydrates an ImportableArtifact within the specified workspace by saving the provided JSON file.
     *
     * @param filePart    The filePart representing the ImportableArtifact object to be saved.
     *                    The ImportableArtifact implements the ImportableArtifact interface.
     * @param workspaceId The identifier for the destination workspace.
     */
    @Override
    public Mono<? extends ImportableArtifactDTO> extractAndSaveContext(
            Part filePart, String workspaceId, String contextId, ArtifactJsonType artifactJsonType) {

        if (StringUtils.isEmpty(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        Mono<ImportableArtifactDTO> importedContextMono = extractImportableContextJson(filePart, artifactJsonType)
                .zipWhen(contextJson -> {
                    if (StringUtils.isEmpty(contextId)) {
                        return importNewContextInWorkspaceFromJson(workspaceId, contextJson);
                    } else {
                        return updateNonGitConnectedContextFromJson(workspaceId, contextId, contextJson);
                    }
                })
                .flatMap(tuple2 -> {
                    ImportableArtifact context = tuple2.getT2();
                    ArtifactExchangeJson importableContextJson = tuple2.getT1();
                    return getContextImportDTO(
                            context.getWorkspaceId(), context.getId(), context, importableContextJson);
                });

        return Mono.create(
                sink -> importedContextMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    /**
     * Saves the provided ArtifactExchangeJson within the specified workspace.
     *
     * @param workspaceId          The identifier for the destination workspace.
     * @param contextJson The JSON file representing the ImportableArtifact object to be saved.
     *                              The ImportableArtifact implements the ImportableArtifact interface.
     */
    @Override
    public Mono<? extends ImportableArtifact> importNewContextInWorkspaceFromJson(
            String workspaceId, ArtifactExchangeJson contextJson) {

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
                    ImportArtifactPermissionProvider permissionProvider = tuple2.getT2();
                    return importContextInWorkspace(
                            workspaceId, contextJson, null, null, false, permissionProvider, userPermissionGroup);
                });
    }

    @Override
    public Mono<? extends ImportableArtifact> updateNonGitConnectedContextFromJson(
            String workspaceId, String contextId, ArtifactExchangeJson importableContextJson) {
        ContextBasedImportService<?, ?, ?> contextBasedImportService =
                getContextBasedImportService(importableContextJson);

        if (!StringUtils.isEmpty(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        if (StringUtils.isEmpty(contextId)) {
            // error message according to the context
            return Mono.error(new AppsmithException(
                    AppsmithError.INVALID_PARAMETER,
                    contextBasedImportService.getConstantsMap().get(FieldName.ID)));
        }

        Mono<Boolean> isContextConnectedToGitMono = Mono.just(Boolean.FALSE);

        Mono<ImportableArtifact> importedContextMono = isContextConnectedToGitMono.flatMap(isConnectedToGit -> {
            if (isConnectedToGit) {
                return Mono.error(new AppsmithException(
                        AppsmithError.UNSUPPORTED_IMPORT_OPERATION_FOR_GIT_CONNECTED_APPLICATION));
            } else {
                contextBasedImportService.setJsonContextNameToNullBeforeUpdate(contextId, importableContextJson);
                return permissionGroupRepository
                        .getCurrentUserPermissionGroups()
                        .zipWhen(userPermissionGroup -> {
                            return Mono.just(
                                    contextBasedImportService.getImportContextPermissionProviderForUpdatingContext(
                                            userPermissionGroup));
                        })
                        .flatMap(tuple2 -> {
                            Set<String> userPermissionGroup = tuple2.getT1();
                            ImportArtifactPermissionProvider permissionProvider = tuple2.getT2();
                            return importContextInWorkspace(
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

    /**
     * Updates an existing ImportableArtifact connected to Git within the specified workspace.
     *
     * @param workspaceId   The identifier for the destination workspace.
     * @param importableContextJson   The ImportableArtifact JSON containing necessary information to update the ImportableArtifact.
     * @param contextId The ImportableArtifact id that needs to be updated with the new resources.
     * @param branchName    The name of the Git branch. Set to null if not connected to Git.
     * @return The updated ImportableArtifact stored in the database.
     */
    @Override
    public Mono<? extends ImportableArtifact> importContextInWorkspaceFromGit(
            String workspaceId, String contextId, ArtifactExchangeJson importableContextJson, String branchName) {

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
                    ImportArtifactPermissionProvider contextPermissionProvider = tuple2.getT2();
                    return importContextInWorkspace(
                            workspaceId,
                            importableContextJson,
                            contextId,
                            branchName,
                            false,
                            contextPermissionProvider,
                            userPermissionGroup);
                });
    }

    public Mono<? extends ImportableArtifact> restoreSnapshot(
            String workspaceId, ArtifactExchangeJson importableContextJson, String contextId, String branchName) {

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
                    ImportArtifactPermissionProvider contextPermissionProvider = tuple2.getT2();
                    return importContextInWorkspace(
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
     * This function will take the Json filepart and saves the context (likely an application) in workspace.
     * It'll not create a new ImportableArtifact, it'll update the existing importableContext by appending the pages to the importableContext.
     * The destination ImportableArtifact will be as it is, only the pages will be appended.
     * This method will likely be only applicable for applications
     * @param workspaceId ID in which the context is to be merged
     * @param contextId   default ID of the importableContext where this importableContextJson is going to get merged with
     * @param branchName      name of the branch of the importableContext where this importableContextJson is going to get merged with
     * @param importableContextJson importableContextJson of the importableContext that will be merged to
     * @param pagesToImport   Name of the pages that should be merged from the importableContextJson.
     *                        If null or empty, all pages will be merged.
     * @return Merged ImportableArtifact
     */
    public Mono<? extends ImportableArtifact> mergeImportableContextJsonWithImportableContext(
            String workspaceId,
            String contextId,
            String branchName,
            ArtifactExchangeJson importableContextJson,
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
                    ImportArtifactPermissionProvider contextPermissionProvider = tuple2.getT2();
                    return importContextInWorkspace(
                            workspaceId,
                            importableContextJson,
                            contextId,
                            branchName,
                            true,
                            contextPermissionProvider,
                            userPermissionGroup);
                });
    }

    /**
     *
     * @param workspaceId ID in which the context is to be merged
     * @param contextId   default ID of the importableContext where this importableContextJson is going to get merged with
     * @param importableContext the context (i.e. application, packages which is imported)
     * @param importableContextJson the Json entity from which the import is happening
     * @return ImportableArtifactDTO
     */
    @Override
    public Mono<? extends ImportableArtifactDTO> getContextImportDTO(
            String workspaceId,
            String contextId,
            ImportableArtifact importableContext,
            ArtifactExchangeJson importableContextJson) {
        return getContextBasedImportService(importableContextJson)
                .getImportableContextDTO(workspaceId, contextId, importableContext);
    }

    /**
     * Imports an application into MongoDB based on the provided application reference object.
     *
     * @param workspaceId     The identifier for the destination workspace.
     * @param importableContextJson The application resource containing necessary information for importing the application.
     * @param contextId       The context identifier of the application that needs to be saved with the updated resources.
     * @param branchName      The name of the branch of the application with the specified contextId.
     * @param appendToContext     Indicates whether applicationJson will be appended to the existing application or not.
     * @return The updated application stored in MongoDB.
     */
    Mono<ImportableArtifact> importContextInWorkspace(
            String workspaceId,
            ArtifactExchangeJson importableContextJson,
            String contextId,
            String branchName,
            boolean appendToContext,
            ImportArtifactPermissionProvider permissionProvider,
            Set<String> permissionGroups) {

        ContextBasedImportService<?, ?, ?> contextBasedImportService =
                getContextBasedImportService(importableContextJson);

        String contextString = contextBasedImportService.getConstantsMap().get(FieldName.CONTEXT);

        // step 1: Schema Migration
        ArtifactExchangeJson importedDoc =
                ContextSchemaMigration.migrateImportableContextJsonToLatestSchema(importableContextJson);

        // Step 2: Validation of context Json
        // check for validation error and raise exception if error found
        String errorField = validateImportableContextJson(importedDoc);
        if (!errorField.isEmpty()) {
            log.error("Error in importing {}. Field {} is missing", contextString, errorField);
            if (errorField.equals(contextString)) {
                return Mono.error(
                        new AppsmithException(
                                AppsmithError.VALIDATION_FAILURE,
                                "Field '" + contextString
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
        final Mono<? extends ImportableArtifact> importedContextMono = workspaceMono
                .then(contextSpecificImportedEntities)
                .then(contextBasedImportService.updateAndSaveContextInFocus(
                        importedDoc.getImportableArtifact(),
                        importingMetaDTO,
                        mappedImportableResourcesDTO,
                        currUserMono))
                .cache();

        Mono<? extends ImportableArtifact> importMono = importedContextMono
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
                    log.error("Error importing {}. Error: {}", contextString, errorMessage, throwable);
                    return Mono.error(
                            new AppsmithException(AppsmithError.GENERIC_JSON_IMPORT_ERROR, workspaceId, errorMessage));
                })
                .as(transactionalOperator::transactional);

        final Mono<? extends ImportableArtifact> resultMono = importMono
                .flatMap(importableContext -> sendImportedContextAnalyticsEvent(
                        contextBasedImportService, importableContext, AnalyticsEvents.IMPORT))
                .zipWith(currUserMono)
                .flatMap(tuple -> {
                    ImportableArtifact importableContext = tuple.getT1();
                    User user = tuple.getT2();
                    stopwatch.stopTimer();
                    stopwatch.stopAndLogTimeInMillis();
                    return sendImportRelatedAnalyticsEvent(importedDoc, importableContext, stopwatch, user);
                });

        // Import Context is currently a slow API because it needs to import and create context, pages, actions
        // and action collection. This process may take time and the client may cancel the request. This leads to the
        // flow getting stopped midway producing corrupted objects in DB. The following ensures that even though the
        // client may have refreshes the page, the imported context is available and is in sane state.
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
    private String validateImportableContextJson(ArtifactExchangeJson importedDoc) {
        // validate common schema things
        ContextBasedImportService<?, ?, ?> contextBasedImportService = getContextBasedImportService(importedDoc);
        String errorField = "";
        if (importedDoc.getImportableArtifact() == null) {
            // the error field will be either application, packages, or workflows
            errorField = contextBasedImportService.getConstantsMap().get(FieldName.CONTEXT);
        } else {
            // validate contextSpecific-errors
            errorField = getContextBasedImportService(importedDoc).validateContextSpecificFields(importedDoc);
        }

        return errorField;
    }

    /**
     * Updates importable entities with the contextDetails.
     * @param contextBasedImportService
     * @param importableContext
     * @param mappedImportableResourcesDTO
     * @param importingMetaDTO
     * @return
     */
    private Mono<? extends ImportableArtifact> updateImportableEntities(
            ContextBasedImportService<?, ?, ?> contextBasedImportService,
            ImportableArtifact importableContext,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            ImportingMetaDTO importingMetaDTO) {
        return contextBasedImportService.updateImportableEntities(
                importableContext, mappedImportableResourcesDTO, importingMetaDTO);
    }

    /**
     * update the importable context with contextSpecific entities after the entities has been created.
     * @param contextBasedImportService
     * @param importableContext
     * @return
     */
    private Mono<? extends ImportableArtifact> updateImportableContext(
            ContextBasedImportService<?, ?, ?> contextBasedImportService, ImportableArtifact importableContext) {
        return contextBasedImportService.updateImportableContext(importableContext);
    }

    /**
     * This method creates the entities which are mentioned in the contextJson, these are imported in mongodb and then
     * the references are added to context
     * @param importingMetaDTO
     * @param mappedImportableResourcesDTO
     * @param workspaceMono
     * @param importedContextMono
     * @param importableContextJson
     * @return
     */
    private Mono<Void> getImportableEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends ImportableArtifact> importedContextMono,
            ArtifactExchangeJson importableContextJson) {

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

    /**
     * Generate the entities which should be imported irrespective of the context (be it application or packages).
     * some of these are plugin and datasources
     * @param importingMetaDTO
     * @param mappedImportableResourcesDTO
     * @param workspaceMono
     * @param importedContextMono
     * @param importableContextJson
     * @return
     */
    protected Flux<Void> obtainContextAgnosticImportables(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends ImportableArtifact> importedContextMono,
            ArtifactExchangeJson importableContextJson) {

        // Updates plugin map in importable resources
        Mono<Void> installedPluginsMono = pluginImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedContextMono,
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
                importedContextMono,
                importableContextJson,
                false,
                true));

        // Directly updates required theme information in DB
        Mono<Void> importedThemesMono = themeImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importedContextMono,
                importableContextJson,
                false,
                true);

        return Flux.merge(List.of(importedDatasourcesMono, importedThemesMono));
    }

    /**
     * To send analytics event for import and export of ImportableContexts i.e. application, packages
     *
     * @param importableContext ImportableArtifact object imported or exported
     * @param event             AnalyticsEvents event
     * @return The importableContext which is imported or exported
     */
    private Mono<? extends ImportableArtifact> sendImportedContextAnalyticsEvent(
            ContextBasedImportService<?, ?, ?> contextBasedImportService,
            ImportableArtifact importableContext,
            AnalyticsEvents event) {
        // this would result in "application", "packages", or "workflows"
        String contextString = contextBasedImportService.getConstantsMap().get(FieldName.CONTEXT);
        // this would result in "applicationId", "packageId", or "workflowId"
        String contextIdString = contextBasedImportService.getConstantsMap().get(FieldName.ID);
        return workspaceService.getById(importableContext.getWorkspaceId()).flatMap(workspace -> {
            final Map<String, Object> eventData =
                    Map.of(contextString, importableContext, FieldName.WORKSPACE, workspace);

            final Map<String, Object> data = Map.of(
                    contextIdString,
                    importableContext.getId(),
                    FieldName.WORKSPACE_ID,
                    workspace.getId(),
                    FieldName.EVENT_DATA,
                    eventData);

            return analyticsService.sendObjectEvent(event, importableContext, data);
        });
    }

    private Mono<ImportableArtifact> sendImportRelatedAnalyticsEvent(
            ArtifactExchangeJson importableContextJson,
            ImportableArtifact importableContext,
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
