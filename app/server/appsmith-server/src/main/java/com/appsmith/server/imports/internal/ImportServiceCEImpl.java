package com.appsmith.server.imports.internal;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.converters.ArtifactExchangeJsonAdapter;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ArtifactImportDTO;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ImportArtifactPermissionProvider;
import com.appsmith.server.helpers.ImportExportUtils;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.imports.internal.artifactbased.ArtifactBasedImportService;
import com.appsmith.server.migrations.ArtifactSchemaMigration;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@RequiredArgsConstructor
@Service
public class ImportServiceCEImpl implements ImportServiceCE {

    public static final Set<MediaType> ALLOWED_CONTENT_TYPES = Set.of(MediaType.APPLICATION_JSON);
    private static final String INVALID_JSON_FILE = "invalid json file";
    private final ArtifactBasedImportService<Application, ApplicationImportDTO, ApplicationJson>
            applicationImportService;
    private final SessionUserService sessionUserService;
    private final WorkspaceService workspaceService;
    private final PermissionGroupRepository permissionGroupRepository;
    private final TransactionalOperator transactionalOperator;
    private final AnalyticsService analyticsService;
    private final ImportableService<Plugin> pluginImportableService;
    private final ImportableService<Datasource> datasourceImportableService;
    private final GsonBuilder gsonBuilder;
    private final ArtifactExchangeJsonAdapter artifactExchangeJsonAdapter;

    /**
     * This method provides the importService specific to the artifact based on the ArtifactType.
     * time complexity is O(1), as the map from which the service is being passes is pre-computed
     *
     * @param artifactExchangeJson : Entity Json which is implementing the artifactExchangeJson
     * @return import-service which is implementing the ContextBasedServiceInterface
     */
    @Override
    public ArtifactBasedImportService<? extends Artifact, ? extends ArtifactImportDTO, ? extends ArtifactExchangeJson>
            getArtifactBasedImportService(ArtifactExchangeJson artifactExchangeJson) {
        return getArtifactBasedImportService(artifactExchangeJson.getArtifactJsonType());
    }

    /**
     * This method provides the importService specific to the artifact based on the ArtifactType.
     * time complexity is O(1), as the map from which the service is being passes is pre-computed
     *
     * @param artifactType : Type of Json serialisation
     * @return import-service which is implementing the ContextBasedServiceInterface
     */
    @Override
    public ArtifactBasedImportService<? extends Artifact, ? extends ArtifactImportDTO, ? extends ArtifactExchangeJson>
            getArtifactBasedImportService(ArtifactType artifactType) {
        return switch (artifactType) {
            case APPLICATION -> applicationImportService;
            default -> applicationImportService;
        };
    }

    /**
     * This method takes a file part and makes a Json entity which implements the ArtifactExchangeJson interface
     *
     * @param filePart : filePart from which the contents would be made
     * @return : Json entity which implements ArtifactExchangeJson
     */
    public Mono<? extends ArtifactExchangeJson> extractArtifactExchangeJson(Part filePart) {

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
                    gsonBuilder.registerTypeAdapter(ArtifactExchangeJson.class, artifactExchangeJsonAdapter);
                    Gson gson = gsonBuilder.create();
                    return gson.fromJson(jsonString, ArtifactExchangeJson.class);
                });
    }

    /**
     * Hydrates an Artifact within the specified workspace by saving the provided JSON file.
     *
     * @param filePart    The filePart representing the Artifact object to be saved.
     *                    The Artifact implements the Artifact interface.
     * @param workspaceId The identifier for the destination workspace.
     */
    @Override
    public Mono<? extends ArtifactImportDTO> extractArtifactExchangeJsonAndSaveArtifact(
            Part filePart, String workspaceId, String artifactId) {

        if (StringUtils.isEmpty(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        Mono<ArtifactImportDTO> importedContextMono = extractArtifactExchangeJson(filePart)
                .zipWhen(contextJson -> {
                    if (StringUtils.isEmpty(artifactId)) {
                        return importNewArtifactInWorkspaceFromJson(workspaceId, contextJson);
                    } else {
                        return updateNonGitConnectedArtifactFromJson(workspaceId, artifactId, contextJson);
                    }
                })
                .flatMap(tuple2 -> {
                    ArtifactExchangeJson exchangeJson = tuple2.getT1();
                    Artifact context = tuple2.getT2();
                    return getArtifactImportDTO(
                            context.getWorkspaceId(), context.getId(), context, exchangeJson.getArtifactJsonType());
                });

        return Mono.create(
                sink -> importedContextMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    /**
     * Saves the provided ArtifactExchangeJson within the specified workspace.
     *
     * @param workspaceId          The identifier for the destination workspace.
     * @param artifactExchangeJson The JSON file representing the Artifact object to be saved.
     *                             The Artifact implements the Artifact interface.
     */
    @Override
    public Mono<? extends Artifact> importNewArtifactInWorkspaceFromJson(
            String workspaceId, ArtifactExchangeJson artifactExchangeJson) {

        // workspace id must be present and valid
        if (StringUtils.isEmpty(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        ArtifactBasedImportService<?, ?, ?> contextBasedImportService =
                getArtifactBasedImportService(artifactExchangeJson);
        return permissionGroupRepository
                .getCurrentUserPermissionGroups()
                .zipWhen(userPermissionGroup -> {
                    return Mono.just(contextBasedImportService.getImportArtifactPermissionProviderForImportingArtifact(
                            userPermissionGroup));
                })
                .flatMap(tuple2 -> {
                    Set<String> userPermissionGroup = tuple2.getT1();
                    ImportArtifactPermissionProvider permissionProvider = tuple2.getT2();
                    return importArtifactInWorkspace(
                            workspaceId,
                            artifactExchangeJson,
                            null,
                            null,
                            false,
                            permissionProvider,
                            userPermissionGroup);
                });
    }

    @Override
    public Mono<? extends Artifact> updateNonGitConnectedArtifactFromJson(
            String workspaceId, String artifactId, ArtifactExchangeJson artifactExchangeJson) {
        ArtifactBasedImportService<?, ?, ?> contextBasedImportService =
                getArtifactBasedImportService(artifactExchangeJson);

        if (StringUtils.isEmpty(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        if (StringUtils.isEmpty(artifactId)) {
            // error message according to the context
            return Mono.error(new AppsmithException(
                    AppsmithError.INVALID_PARAMETER,
                    contextBasedImportService.getArtifactSpecificConstantsMap().get(FieldName.ID)));
        }

        // Check if the application is connected to git and if it's connected throw exception asking user to update
        // app via git ops like pull, merge etc.
        Mono<Boolean> isArtifactConnectedToGitMono = Mono.just(Boolean.FALSE);
        if (!StringUtils.isEmpty(artifactId)) {
            isArtifactConnectedToGitMono = contextBasedImportService.isArtifactConnectedToGit(artifactId);
        }

        Mono<Artifact> importedContextMono = isArtifactConnectedToGitMono.flatMap(isConnectedToGit -> {
            if (isConnectedToGit) {
                return Mono.error(new AppsmithException(
                        AppsmithError.UNSUPPORTED_IMPORT_OPERATION_FOR_GIT_CONNECTED_APPLICATION));
            } else {
                contextBasedImportService.setJsonArtifactNameToNullBeforeUpdate(artifactId, artifactExchangeJson);
                return permissionGroupRepository
                        .getCurrentUserPermissionGroups()
                        .zipWhen(userPermissionGroup -> {
                            return Mono.just(
                                    contextBasedImportService.getImportArtifactPermissionProviderForUpdatingArtifact(
                                            userPermissionGroup));
                        })
                        .flatMap(tuple2 -> {
                            Set<String> userPermissionGroup = tuple2.getT1();
                            ImportArtifactPermissionProvider permissionProvider = tuple2.getT2();
                            return importArtifactInWorkspace(
                                    workspaceId,
                                    artifactExchangeJson,
                                    artifactId,
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
     * Updates an existing Artifact connected to Git within the specified workspace.
     *
     * @param workspaceId          The identifier for the destination workspace.
     * @param artifactId           The Artifact id that needs to be updated with the new resources.
     * @param artifactExchangeJson The Artifact JSON containing necessary information to update the Artifact.
     * @param branchName           The name of the Git branch. Set to null if not connected to Git.
     * @return The updated Artifact stored in the database.
     */
    @Override
    public Mono<? extends Artifact> importArtifactInWorkspaceFromGit(
            String workspaceId, String artifactId, ArtifactExchangeJson artifactExchangeJson, String branchName) {

        ArtifactBasedImportService<?, ?, ?> artifactBasedImportService =
                getArtifactBasedImportService(artifactExchangeJson);
        return permissionGroupRepository
                .getCurrentUserPermissionGroups()
                .zipWhen(userPermissionGroups -> {
                    return Mono.just(artifactBasedImportService.getImportArtifactPermissionProviderForConnectingToGit(
                            userPermissionGroups));
                })
                .flatMap(tuple2 -> {
                    Set<String> userPermissionGroup = tuple2.getT1();
                    ImportArtifactPermissionProvider artifactPermissionProvider = tuple2.getT2();
                    return importArtifactInWorkspace(
                            workspaceId,
                            artifactExchangeJson,
                            artifactId,
                            branchName,
                            false,
                            artifactPermissionProvider,
                            userPermissionGroup);
                });
    }

    @Override
    public Mono<? extends Artifact> restoreSnapshot(
            String workspaceId, String artifactId, String branchName, ArtifactExchangeJson artifactExchangeJson) {

        /**
         * Like Git, restore snapshot is a system level operation. So, we're not checking for any permissions here.
         * Only permission required is to edit the artifact.
         */
        ArtifactBasedImportService<?, ?, ?> contextBasedImportService =
                getArtifactBasedImportService(artifactExchangeJson);
        return permissionGroupRepository
                .getCurrentUserPermissionGroups()
                .zipWhen(userPermissionGroups -> {
                    return Mono.just(contextBasedImportService.getImportArtifactPermissionProviderForRestoringSnapshot(
                            userPermissionGroups));
                })
                .flatMap(tuple2 -> {
                    Set<String> userPermissionGroup = tuple2.getT1();
                    ImportArtifactPermissionProvider importArtifactPermissionProvider = tuple2.getT2();
                    return importArtifactInWorkspace(
                            workspaceId,
                            artifactExchangeJson,
                            artifactId,
                            branchName,
                            false,
                            importArtifactPermissionProvider,
                            userPermissionGroup);
                });
    }

    /**
     * This function will take the Json filePart and saves the artifact (likely an application) in workspace.
     * It'll not create a new Artifact, it'll update the existing Artifact by appending the pages to the Artifact.
     * The destination Artifact will be as it is, only the pages will be appended.
     * This method will likely be only applicable for applications
     *
     * @param workspaceId          ID in which the artifact is to be merged
     * @param artifactId           default ID of the importableArtifact where this artifactExchangeJson is going to get merged with
     * @param branchName           name of the branch of the importableArtifact where this artifactExchangeJson is going to get merged with
     * @param artifactExchangeJson artifactExchangeJson of the importableArtifact that will be merged to
     * @param entitiesToImport     Name of the pages that should be merged from the artifactExchangeJson.
     *                             If null or empty, all pages will be merged.
     * @return Merged Artifact
     */
    @Override
    public Mono<? extends Artifact> mergeArtifactExchangeJsonWithImportableArtifact(
            String workspaceId,
            String artifactId,
            String branchName,
            ArtifactExchangeJson artifactExchangeJson,
            List<String> entitiesToImport) {
        ArtifactBasedImportService<?, ?, ?> contextBasedImportService =
                getArtifactBasedImportService(artifactExchangeJson);
        contextBasedImportService.updateArtifactExchangeJsonWithEntitiesToBeConsumed(
                artifactExchangeJson, entitiesToImport);
        return permissionGroupRepository
                .getCurrentUserPermissionGroups()
                .zipWhen(userPermissionGroups -> {
                    return Mono.just(
                            contextBasedImportService.getImportArtifactPermissionProviderForMergingJsonWithArtifact(
                                    userPermissionGroups));
                })
                .flatMap(tuple2 -> {
                    Set<String> userPermissionGroup = tuple2.getT1();
                    ImportArtifactPermissionProvider contextPermissionProvider = tuple2.getT2();
                    return importArtifactInWorkspace(
                            workspaceId,
                            artifactExchangeJson,
                            artifactId,
                            branchName,
                            true,
                            contextPermissionProvider,
                            userPermissionGroup);
                });
    }

    /**
     * @param workspaceId        ID in which the context is to be merged
     * @param artifactId         default ID of the artifact where this artifactExchangeJson is going to get merged with
     * @param importableArtifact the context (i.e. application, packages which is imported)
     * @param artifactType   the Json entity from which the import is happening
     * @return ArtifactImportDTO
     */
    @Override
    public Mono<? extends ArtifactImportDTO> getArtifactImportDTO(
            String workspaceId, String artifactId, Artifact importableArtifact, ArtifactType artifactType) {

        ArtifactBasedImportService<?, ?, ?> contextBasedImportService = getArtifactBasedImportService(artifactType);

        return findDatasourceByArtifactId(workspaceId, artifactId, artifactType)
                .zipWith(workspaceService.getDefaultEnvironmentId(workspaceId, null))
                .map(tuple2 -> {
                    List<Datasource> datasourceList = tuple2.getT1();
                    String environmentId = tuple2.getT2();

                    return contextBasedImportService.getImportableArtifactDTO(
                            importableArtifact, datasourceList, environmentId);
                });
    }

    /**
     * Imports an application into MongoDB based on the provided application reference object.
     *
     * @param workspaceId          The identifier for the destination workspace.
     * @param artifactExchangeJson The application resource containing necessary information for importing the application.
     * @param artifactId           The context identifier of the application that needs to be saved with the updated resources.
     * @param branchName           The name of the branch of the artifact with the specified artifactId.
     * @param appendToArtifact     Indicates whether artifactExchangeJson will be appended to the existing application or not.
     * @return The updated artifact stored in MongoDB.
     */
    private Mono<Artifact> importArtifactInWorkspace(
            String workspaceId,
            ArtifactExchangeJson artifactExchangeJson,
            String artifactId,
            String branchName,
            boolean appendToArtifact,
            ImportArtifactPermissionProvider permissionProvider,
            Set<String> permissionGroups) {

        ArtifactBasedImportService<?, ?, ?> contextBasedImportService =
                getArtifactBasedImportService(artifactExchangeJson);

        Map<String, String> artifactSpecificConstantsMap = contextBasedImportService.getArtifactSpecificConstantsMap();

        String artifactContextString = artifactSpecificConstantsMap.get(FieldName.ARTIFACT_CONTEXT);

        // step 1: Schema Migration
        ArtifactExchangeJson importedDoc =
                ArtifactSchemaMigration.migrateArtifactExchangeJsonToLatestSchema(artifactExchangeJson);

        // Step 2: Validation of artifact Json
        // check for validation error and raise exception if error found
        String errorField = validateArtifactExchangeJson(importedDoc);
        if (!errorField.isEmpty()) {
            log.error("Error in importing {}. Field {} is missing", artifactContextString, errorField);
            if (errorField.equals(artifactContextString)) {
                return Mono.error(
                        new AppsmithException(
                                AppsmithError.VALIDATION_FAILURE,
                                "Field '" + artifactContextString
                                        + "' Sorry! Seems like you've imported a page-level json instead of an application. Please use the import within the page."));
            }
            return Mono.error(new AppsmithException(
                    AppsmithError.VALIDATION_FAILURE, "Field '" + errorField + "' is missing in the JSON."));
        }

        ImportingMetaDTO importingMetaDTO = new ImportingMetaDTO(
                workspaceId,
                artifactContextString,
                artifactId,
                branchName,
                appendToArtifact,
                false,
                permissionProvider,
                permissionGroups);

        MappedImportableResourcesDTO mappedImportableResourcesDTO = new MappedImportableResourcesDTO();
        contextBasedImportService.syncClientAndSchemaVersion(importedDoc);

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

        // this would import customJsLibs for all type of artifacts
        Mono<Void> artifactSpecificImportableEntities =
                contextBasedImportService.generateArtifactSpecificImportableEntities(
                        importedDoc, importingMetaDTO, mappedImportableResourcesDTO);

        /*
         Calling the workspaceMono first to avoid creating multiple mongo transactions.
         If the first db call inside a transaction is a Flux, then there's a chance of creating multiple mongo
         transactions which will lead to NoSuchTransaction exception.
        */
        final Mono<? extends Artifact> importableArtifactMono = workspaceMono
                .then(Mono.defer(() -> artifactSpecificImportableEntities))
                .then(Mono.defer(() -> contextBasedImportService.updateAndSaveArtifactInContext(
                        importedDoc.getArtifact(), importingMetaDTO, mappedImportableResourcesDTO, currUserMono)))
                .cache();

        final Mono<? extends Artifact> importMono = importableArtifactMono
                .then(Mono.defer(() -> generateImportableEntities(
                        importingMetaDTO,
                        mappedImportableResourcesDTO,
                        workspaceMono,
                        importableArtifactMono,
                        importedDoc)))
                .then(importableArtifactMono)
                .flatMap(importableArtifact -> updateImportableEntities(
                        contextBasedImportService, importableArtifact, mappedImportableResourcesDTO, importingMetaDTO))
                .flatMap(importableArtifact -> updateImportableArtifact(contextBasedImportService, importableArtifact))
                .onErrorResume(throwable -> {
                    String errorMessage = ImportExportUtils.getErrorMessage(throwable);
                    log.error("Error importing {}. Error: {}", artifactContextString, errorMessage, throwable);
                    return Mono.error(
                            new AppsmithException(AppsmithError.GENERIC_JSON_IMPORT_ERROR, workspaceId, errorMessage));
                })
                .as(transactionalOperator::transactional);

        final Mono<? extends Artifact> resultMono = importMono
                .flatMap(importableArtifact -> sendImportedContextAnalyticsEvent(
                        contextBasedImportService, importableArtifact, AnalyticsEvents.IMPORT))
                .zipWith(currUserMono)
                .flatMap(tuple -> {
                    Artifact importableArtifact = tuple.getT1();
                    User user = tuple.getT2();
                    stopwatch.stopTimer();
                    stopwatch.stopAndLogTimeInMillis();
                    return sendImportRelatedAnalyticsEvent(importedDoc, importableArtifact, stopwatch, user);
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
     * validates whether an artifactExchangeJson contains the required fields or not.
     *
     * @param importedDoc artifactExchangeJson object that needs to be validated
     * @return Name of the field that have error. Empty string otherwise
     */
    private String validateArtifactExchangeJson(ArtifactExchangeJson importedDoc) {
        // validate common schema things
        ArtifactBasedImportService<?, ?, ?> artifactBasedImportService = getArtifactBasedImportService(importedDoc);
        String errorField = "";
        if (importedDoc.getArtifact() == null) {
            // the error field will be either application, packages, or workflows
            errorField =
                    artifactBasedImportService.getArtifactSpecificConstantsMap().get(FieldName.ARTIFACT_CONTEXT);
        } else {
            // validate contextSpecific-errors
            errorField = getArtifactBasedImportService(importedDoc).validateArtifactSpecificFields(importedDoc);
        }

        return errorField;
    }

    /**
     * Updates importable entities with the contextDetails.
     *
     * @param contextBasedImportService
     * @param importableArtifact
     * @param mappedImportableResourcesDTO
     * @param importingMetaDTO
     * @return
     */
    private Mono<? extends Artifact> updateImportableEntities(
            ArtifactBasedImportService<?, ?, ?> contextBasedImportService,
            Artifact importableArtifact,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            ImportingMetaDTO importingMetaDTO) {
        return contextBasedImportService.updateImportableEntities(
                importableArtifact, mappedImportableResourcesDTO, importingMetaDTO);
    }

    /**
     * update the importable context with contextSpecific entities after the entities has been created.
     *
     * @param contextBasedImportService
     * @param importableArtifact
     * @return
     */
    private Mono<? extends Artifact> updateImportableArtifact(
            ArtifactBasedImportService<?, ?, ?> contextBasedImportService, Artifact importableArtifact) {
        return contextBasedImportService.updateImportableArtifact(importableArtifact);
    }

    /**
     * This method creates the entities which are mentioned in the contextJson, these are imported in mongodb and then
     * the references are added to context
     *
     * @param importingMetaDTO
     * @param mappedImportableResourcesDTO
     * @param workspaceMono
     * @param importableArtifactMono
     * @param artifactExchangeJson
     * @return
     */
    private Mono<Void> generateImportableEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends Artifact> importableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {

        ArtifactBasedImportService<?, ?, ?> contextBasedImportService =
                getArtifactBasedImportService(artifactExchangeJson);

        Flux<Void> artifactAgnosticImportables = generateArtifactIndependentImportableEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importableArtifactMono,
                artifactExchangeJson);

        Flux<Void> artifactSpecificImportables =
                contextBasedImportService.generateArtifactContextIndependentImportableEntities(
                        importingMetaDTO,
                        mappedImportableResourcesDTO,
                        workspaceMono,
                        importableArtifactMono,
                        artifactExchangeJson);

        Flux<Void> artifactContextDependentImportables =
                contextBasedImportService.generateArtifactContextDependentImportableEntities(
                        importingMetaDTO,
                        mappedImportableResourcesDTO,
                        workspaceMono,
                        importableArtifactMono,
                        artifactExchangeJson);

        return artifactAgnosticImportables
                .thenMany(artifactSpecificImportables)
                .thenMany(artifactContextDependentImportables)
                .then();
    }

    /**
     * Generate the entities which should be imported irrespective of the context (be it application or packages).
     * some of these are plugin and datasource
     *
     * @param importingMetaDTO
     * @param mappedImportableResourcesDTO
     * @param workspaceMono
     * @param importableArtifactMono
     * @param artifactExchangeJson
     * @return
     */
    protected Flux<Void> generateArtifactIndependentImportableEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends Artifact> importableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {

        // Updates plugin map in importable resources
        Mono<Void> installedPluginsMono = pluginImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importableArtifactMono,
                artifactExchangeJson,
                true);

        // Requires pluginMap to be present in importable resources.
        // Updates datasourceNameToIdMap in importable resources.
        // Also directly updates required information in DB
        Mono<Void> importedDatasourcesMono = installedPluginsMono.then(datasourceImportableService.importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importableArtifactMono,
                artifactExchangeJson,
                true));

        return Flux.merge(List.of(importedDatasourcesMono));
    }

    /**
     * To send analytics event for import and export of Artifact i.e. application, packages
     *
     * @param importableArtifact Artifact object imported or exported
     * @param event              AnalyticsEvents event
     * @return The Artifact which is imported or exported
     */
    private Mono<? extends Artifact> sendImportedContextAnalyticsEvent(
            ArtifactBasedImportService<?, ?, ?> contextBasedImportService,
            Artifact importableArtifact,
            AnalyticsEvents event) {
        // this would result in "application", "packages", or "workflows"
        String artifactContextString =
                contextBasedImportService.getArtifactSpecificConstantsMap().get(FieldName.ARTIFACT_CONTEXT);
        // this would result in "applicationId", "packageId", or "workflowId"
        String contextIdString =
                contextBasedImportService.getArtifactSpecificConstantsMap().get(FieldName.ID);
        return workspaceService.getById(importableArtifact.getWorkspaceId()).flatMap(workspace -> {
            final Map<String, Object> eventData =
                    Map.of(artifactContextString, importableArtifact, FieldName.WORKSPACE, workspace);

            final Map<String, Object> data = Map.of(
                    contextIdString,
                    importableArtifact.getId(),
                    FieldName.WORKSPACE_ID,
                    workspace.getId(),
                    FieldName.EVENT_DATA,
                    eventData);

            return analyticsService.sendObjectEvent(event, importableArtifact, data);
        });
    }

    /**
     * This method deals in data only pertaining to import flow i.e. time taken, entities size, e.t.c
     *
     * @param artifactExchangeJson : Json which has been used for importing the artifact
     * @param importableArtifact:  the artifact which is imported
     * @param stopwatch            : stopwatch
     * @param currentUser          : user which has initiated the import
     */
    private Mono<Artifact> sendImportRelatedAnalyticsEvent(
            ArtifactExchangeJson artifactExchangeJson,
            Artifact importableArtifact,
            Stopwatch stopwatch,
            User currentUser) {

        Map<String, Object> analyticsData = new HashMap<>(getArtifactBasedImportService(artifactExchangeJson)
                .createImportAnalyticsData(artifactExchangeJson, importableArtifact));
        analyticsData.put(FieldName.FLOW_NAME, stopwatch.getFlow());
        analyticsData.put("executionTime", stopwatch.getExecutionTime());

        return analyticsService
                .sendEvent(AnalyticsEvents.UNIT_EXECUTION_TIME.getEventName(), currentUser.getUsername(), analyticsData)
                .thenReturn(importableArtifact);
    }

    @Override
    public Mono<List<Datasource>> findDatasourceByArtifactId(
            String workspaceId, String defaultArtifactId, ArtifactType artifactType) {

        return getArtifactBasedImportService(artifactType)
                .getDatasourceIdSetConsumedInArtifact(defaultArtifactId)
                .flatMap(datasourceIdSet -> {
                    return datasourceImportableService
                            .getEntitiesPresentInWorkspace(workspaceId)
                            .filter(datasource -> datasourceIdSet.contains(datasource.getId()))
                            .collectList();
                })
                // if we didn't receive any actions then the list of importable datasource should be zero.
                .switchIfEmpty(Mono.just(new ArrayList<>()));
    }
}
