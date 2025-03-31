package com.appsmith.server.git.central;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.constants.ErrorReferenceDocUrl;
import com.appsmith.external.dtos.GitRefDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.external.git.constants.GitConstants;
import com.appsmith.external.git.constants.GitConstants.GitCommandConstants;
import com.appsmith.external.git.constants.GitSpan;
import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.external.git.dtos.FetchRemoteDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.git.dto.CommitDTO;
import com.appsmith.git.dto.GitUser;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.Assets;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.GitDefaultCommitMessage;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.AutoCommitConfig;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitDeployKeys;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ArtifactImportDTO;
import com.appsmith.server.dtos.AutoCommitResponseDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitDocsDTO;
import com.appsmith.server.dtos.GitMergeDTO;
import com.appsmith.server.dtos.GitPullDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.git.GitRedisUtils;
import com.appsmith.server.git.autocommit.helpers.GitAutoCommitHelper;
import com.appsmith.server.git.dtos.ArtifactJsonTransformationDTO;
import com.appsmith.server.git.resolver.GitArtifactHelperResolver;
import com.appsmith.server.git.resolver.GitHandlingServiceResolver;
import com.appsmith.server.git.utils.GitAnalyticsUtils;
import com.appsmith.server.git.utils.GitProfileUtils;
import com.appsmith.server.helpers.GitDeployKeyGenerator;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.helpers.GitUtils;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.GitDeployKeysRepository;
import com.appsmith.server.services.GitArtifactHelper;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.DatasourcePermission;
import io.micrometer.observation.ObservationRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.InvalidRemoteException;
import org.eclipse.jgit.api.errors.RefNotFoundException;
import org.eclipse.jgit.api.errors.TransportException;
import org.eclipse.jgit.errors.RepositoryNotFoundException;
import org.eclipse.jgit.lib.BranchTrackingStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeoutException;

import static com.appsmith.external.git.constants.ce.GitConstantsCE.DEFAULT_COMMIT_MESSAGE;
import static com.appsmith.external.git.constants.ce.GitConstantsCE.GIT_CONFIG_ERROR;
import static com.appsmith.external.git.constants.ce.GitConstantsCE.GIT_PROFILE_ERROR;
import static com.appsmith.external.git.constants.ce.GitSpanCE.OPS_COMMIT;
import static com.appsmith.external.git.constants.ce.GitSpanCE.OPS_STATUS;
import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;
import static com.appsmith.server.constants.FieldName.BRANCH_NAME;
import static com.appsmith.server.constants.FieldName.DEFAULT;
import static com.appsmith.server.constants.FieldName.REF_NAME;
import static com.appsmith.server.constants.FieldName.REF_TYPE;
import static com.appsmith.server.constants.SerialiseArtifactObjective.VERSION_CONTROL;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.springframework.util.StringUtils.hasText;

@Slf4j
@Service
@RequiredArgsConstructor
public class CentralGitServiceCEImpl implements CentralGitServiceCE {

    protected final GitRedisUtils gitRedisUtils;
    protected final GitProfileUtils gitProfileUtils;
    protected final GitAnalyticsUtils gitAnalyticsUtils;
    private final UserDataService userDataService;
    protected final SessionUserService sessionUserService;

    protected final GitArtifactHelperResolver gitArtifactHelperResolver;
    protected final GitHandlingServiceResolver gitHandlingServiceResolver;

    private final GitPrivateRepoHelper gitPrivateRepoHelper;
    private final GitDeployKeysRepository gitDeployKeysRepository;

    private final DatasourceService datasourceService;
    private final DatasourcePermission datasourcePermission;

    private final WorkspaceService workspaceService;
    private final PluginService pluginService;

    protected final ImportService importService;
    protected final ExportService exportService;

    private final GitAutoCommitHelper gitAutoCommitHelper;
    private final TransactionalOperator transactionalOperator;
    protected final ObservationRegistry observationRegistry;

    protected static final String ORIGIN = "origin/";
    protected static final String REMOTE_NAME_REPLACEMENT = "";

    protected Mono<Boolean> isRepositoryLimitReachedForWorkspace(String workspaceId, Boolean isRepositoryPrivate) {
        if (!isRepositoryPrivate) {
            return Mono.just(FALSE);
        }

        return gitPrivateRepoHelper.isRepoLimitReached(workspaceId, true);
    }

    @Override
    public Mono<? extends ArtifactImportDTO> importArtifactFromGit(
            String workspaceId, GitConnectDTO gitConnectDTO, GitType gitType) {
        if (!StringUtils.hasText(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        GitHandlingService gitHandlingService = gitHandlingServiceResolver.getGitHandlingService(gitType);
        Set<String> errors = gitHandlingService.validateGitConnectDTO(gitConnectDTO);

        if (!CollectionUtils.isEmpty(errors)) {
            return Mono.error(new AppsmithException(
                    AppsmithError.INVALID_PARAMETER, errors.stream().findAny().get()));
        }

        final String repoName = gitHandlingService.getRepoName(gitConnectDTO);

        // since at this point in the import flow, there is no context about the artifact type
        // it needs to be retrieved from the fetched repository itself. however, in order to retrieve
        // the artifact type from repository, the repository needs to be saved.
        // for saving the repo an identifier is required (which usually is the artifact id);
        // however, the artifact could only be generated after the artifact type is known.
        // hence this is a temporary placeholder to hold the repository and it's components
        String placeholder = "temp" + UUID.randomUUID();
        ArtifactJsonTransformationDTO tempJsonTransformationDTO =
                new ArtifactJsonTransformationDTO(workspaceId, placeholder, repoName);

        ArtifactJsonTransformationDTO jsonDTOPostRefCreation =
                new ArtifactJsonTransformationDTO(workspaceId, placeholder, repoName);

        Mono<Boolean> isRepositoryPrivateMonoCached =
                gitHandlingService.isRepoPrivate(gitConnectDTO).cache();

        Mono<Boolean> isRepositoryLimitReachedForWorkspaceMono = isRepositoryPrivateMonoCached.flatMap(
                isRepositoryPrivate -> isRepositoryLimitReachedForWorkspace(workspaceId, isRepositoryPrivate));

        Mono<GitAuth> gitAuthMonoCached = gitHandlingService.getGitAuthForUser().cache();

        Mono<? extends Artifact> blankArtifactForImportMono = isRepositoryLimitReachedForWorkspaceMono
                .flatMap(isLimitReachedForPrivateRepositories -> {
                    if (!TRUE.equals(isLimitReachedForPrivateRepositories)) {
                        return gitAuthMonoCached;
                    }

                    return gitAnalyticsUtils
                            .addAnalyticsForGitOperation(
                                    AnalyticsEvents.GIT_IMPORT,
                                    workspaceId,
                                    AppsmithError.GIT_APPLICATION_LIMIT_ERROR.getErrorType(),
                                    AppsmithError.GIT_APPLICATION_LIMIT_ERROR.getMessage(),
                                    true,
                                    false)
                            .then(Mono.error(new AppsmithException(AppsmithError.GIT_APPLICATION_LIMIT_ERROR)));
                })
                .flatMap(gitAuth -> {
                    return gitHandlingService
                            .fetchRemoteRepository(gitConnectDTO, gitAuth, tempJsonTransformationDTO)
                            .flatMap(defaultBranch -> {
                                return Mono.zip(
                                        Mono.just(defaultBranch),
                                        gitHandlingService.obtainArtifactTypeFromGitRepository(
                                                tempJsonTransformationDTO),
                                        isRepositoryPrivateMonoCached,
                                        Mono.just(gitAuth));
                            });
                })
                .flatMap(tuple4 -> {
                    String defaultBranch = tuple4.getT1();
                    ArtifactType artifactType = tuple4.getT2();
                    Boolean isRepoPrivate = tuple4.getT3();
                    GitAuth gitAuth = tuple4.getT4();

                    GitArtifactHelper<?> contextHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
                    AclPermission workspacePermission = contextHelper.getWorkspaceArtifactCreationPermission();

                    Mono<Workspace> workspaceMono = workspaceService
                            .findById(workspaceId, workspacePermission)
                            .switchIfEmpty(Mono.error(new AppsmithException(
                                    AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId)));

                    return workspaceMono
                            .flatMap(workspace -> contextHelper.createArtifactForImport(workspaceId, repoName))
                            .map(baseArtifact -> {
                                GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
                                gitArtifactMetadata.setGitAuth(gitAuth);
                                gitArtifactMetadata.setDefaultArtifactId(baseArtifact.getId());
                                gitArtifactMetadata.setDefaultBranchName(defaultBranch);
                                gitArtifactMetadata.setRefName(defaultBranch);
                                gitArtifactMetadata.setRepoName(repoName);
                                gitArtifactMetadata.setIsRepoPrivate(isRepoPrivate);
                                gitArtifactMetadata.setLastCommittedAt(Instant.now());

                                gitHandlingService.setRepositoryDetailsInGitArtifactMetadata(
                                        gitConnectDTO, gitArtifactMetadata);
                                baseArtifact.setGitArtifactMetadata(gitArtifactMetadata);
                                return baseArtifact;
                            });
                });

        Mono<? extends Artifact> containerArtifactForImport = Mono.usingWhen(
                blankArtifactForImportMono,
                baseArtifact -> {
                    GitArtifactMetadata baseGitMetadata = baseArtifact.getGitArtifactMetadata();
                    String defaultBranch = baseGitMetadata.getDefaultBranchName();

                    jsonDTOPostRefCreation.setBaseArtifactId(baseGitMetadata.getDefaultArtifactId());
                    jsonDTOPostRefCreation.setRefType(RefType.branch);
                    jsonDTOPostRefCreation.setRefName(defaultBranch);
                    jsonDTOPostRefCreation.setArtifactType(baseArtifact.getArtifactType());

                    return Mono.just(baseArtifact);
                },
                // in any case repository details needs to be updated with the base artifact id
                baseArtifact ->
                        gitHandlingService.updateImportedRepositoryDetails(baseArtifact, tempJsonTransformationDTO));

        Mono<? extends ArtifactImportDTO> importGitArtifactMono = Mono.usingWhen(
                containerArtifactForImport,
                baseArtifact -> {
                    GitArtifactMetadata baseGitMetadata = baseArtifact.getGitArtifactMetadata();
                    String defaultBranch = baseGitMetadata.getDefaultBranchName();
                    GitArtifactHelper<?> gitArtifactHelper =
                            gitArtifactHelperResolver.getArtifactHelper(baseArtifact.getArtifactType());

                    Mono<List<Datasource>> datasourceMono = datasourceService
                            .getAllByWorkspaceIdWithStorages(workspaceId, datasourcePermission.getEditPermission())
                            .collectList();

                    Mono<List<Plugin>> pluginMono =
                            pluginService.getDefaultPlugins().collectList();

                    Mono<? extends ArtifactExchangeJson> artifactExchangeJsonMono = gitHandlingService
                            .reconstructArtifactJsonFromGitRepository(jsonDTOPostRefCreation)
                            .onErrorResume(error -> {
                                log.error("Error while constructing artifact from git repo", error);
                                return Mono.error(
                                        new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, error.getMessage()));
                            });

                    return Mono.zip(artifactExchangeJsonMono, datasourceMono, pluginMono)
                            .flatMap(data -> {
                                ArtifactExchangeJson artifactExchangeJson = data.getT1();
                                List<Datasource> datasourceList = data.getT2();
                                List<Plugin> pluginList = data.getT3();

                                if (artifactExchangeJson.getArtifact() == null
                                        || gitArtifactHelper.isContextInArtifactEmpty(artifactExchangeJson)) {
                                    return Mono.error(new AppsmithException(
                                            AppsmithError.GIT_ACTION_FAILED,
                                            "import",
                                            "Cannot import artifact from an empty repo"));
                                }

                                // If there is an existing datasource with the same name but a different type from that
                                // in the repo, the import api should fail
                                // TODO: change the implementation to compare datasource with gitSyncIds instead.
                                if (checkIsDatasourceNameConflict(
                                        datasourceList, artifactExchangeJson.getDatasourceList(), pluginList)) {
                                    return Mono.error(new AppsmithException(
                                            AppsmithError.GIT_ACTION_FAILED,
                                            "import",
                                            "Datasource already exists with the same name"));
                                }

                                artifactExchangeJson.getArtifact().setGitArtifactMetadata(baseGitMetadata);
                                return importService
                                        .importArtifactInWorkspaceFromGit(
                                                workspaceId, baseArtifact.getId(), artifactExchangeJson, defaultBranch)
                                        .onErrorResume(throwable -> {
                                            log.error("Error in importing the artifact {}", baseArtifact.getId());
                                            return Mono.error(new AppsmithException(
                                                    AppsmithError.GIT_FILE_SYSTEM_ERROR, throwable.getMessage()));
                                        });
                            })
                            .flatMap(artifact -> gitArtifactHelper.publishArtifact(artifact, false))
                            .flatMap(artifact -> importService.getArtifactImportDTO(
                                    artifact.getWorkspaceId(), artifact.getId(), artifact, artifact.getArtifactType()));
                },
                baseArtifact -> {
                    // on success send analytics
                    return gitAnalyticsUtils.addAnalyticsForGitOperation(
                            AnalyticsEvents.GIT_IMPORT,
                            baseArtifact,
                            baseArtifact.getGitArtifactMetadata().getIsRepoPrivate());
                },
                (baseArtifact, throwableError) -> {
                    // on error
                    return deleteArtifactCreatedFromGitImport(jsonDTOPostRefCreation, gitType);
                },
                baseArtifact -> {
                    // on publisher cancellation
                    return deleteArtifactCreatedFromGitImport(jsonDTOPostRefCreation, gitType);
                });

        return Mono.create(
                sink -> importGitArtifactMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    @Override
    public Mono<? extends ArtifactImportDTO> importArtifactFromGit(
            String workspaceId, GitConnectDTO gitConnectDTO, ArtifactType artifactType, GitType gitType) {
        // 1. Check private repo limit for workspace
        // 2. Create dummy artifact, clone repo from remote
        // 3. Re-hydrate artifact to DB from local repo
        //    a. Save the ssh keys in artifact object with other details
        //    b. During import-export need to handle the DS(empty vs non-empty)
        // 4. Return artifact

        if (!StringUtils.hasText(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Invalid workspace id"));
        }

        GitHandlingService gitHandlingService = gitHandlingServiceResolver.getGitHandlingService(gitType);
        Set<String> errors = gitHandlingService.validateGitConnectDTO(gitConnectDTO);

        if (!CollectionUtils.isEmpty(errors)) {
            return Mono.error(new AppsmithException(
                    AppsmithError.INVALID_PARAMETER, errors.stream().findAny().get()));
        }

        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        AclPermission artifactCreatePermission = gitArtifactHelper.getWorkspaceArtifactCreationPermission();

        // TODO: permission bit deferred to gitArtifactHelper
        Mono<Workspace> workspaceMono = workspaceService
                .findById(workspaceId, artifactCreatePermission)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId)));

        final String repoName = gitHandlingService.getRepoName(gitConnectDTO);
        Mono<Boolean> isRepositoryPrivateMono =
                gitHandlingService.isRepoPrivate(gitConnectDTO).cache();
        Mono<Boolean> isRepositoryLimitReachedForWorkspaceMono = isRepositoryPrivateMono.flatMap(
                isRepositoryPrivate -> isRepositoryLimitReachedForWorkspace(workspaceId, isRepositoryPrivate));

        Mono<? extends ArtifactImportDTO> importedArtifactMono = workspaceMono
                .then(Mono.defer(() -> isRepositoryLimitReachedForWorkspaceMono))
                .flatMap(isRepositoryLimitReached -> {
                    Mono<GitAuth> gitAuthForUserMono =
                            gitHandlingService.getGitAuthForUser().cache();
                    Mono<? extends Artifact> createArtifactMono = gitArtifactHelper
                            .createArtifactForImport(workspaceId, repoName)
                            .cache();

                    if (FALSE.equals(isRepositoryLimitReached)) {
                        return gitAuthForUserMono.zipWith(createArtifactMono);
                    }

                    // TODO: Change errors to artifact level.
                    return gitAnalyticsUtils
                            .addAnalyticsForGitOperation(
                                    AnalyticsEvents.GIT_IMPORT,
                                    gitArtifactHelper.getNewArtifact(workspaceId, repoName),
                                    AppsmithError.GIT_APPLICATION_LIMIT_ERROR.getErrorType(),
                                    AppsmithError.GIT_APPLICATION_LIMIT_ERROR.getMessage(),
                                    true)
                            .then(Mono.error(new AppsmithException(AppsmithError.GIT_APPLICATION_LIMIT_ERROR)));
                })
                .flatMap(tuple2 -> {
                    GitAuth gitAuth = tuple2.getT1();
                    Artifact artifact = tuple2.getT2();

                    Mono<Map<String, GitProfile>> profileMono = gitProfileUtils.updateOrCreateGitProfileForCurrentUser(
                            gitConnectDTO.getGitProfile(), artifact.getId());

                    Mono<String> fetchRemoteRepository =
                            gitHandlingService.fetchRemoteRepository(gitConnectDTO, gitAuth, artifact, repoName);

                    return fetchRemoteRepository
                            .zipWith(isRepositoryPrivateMono)
                            .flatMap(tuple -> {
                                String defaultBranch = tuple.getT1();
                                Boolean isRepoPrivate = tuple.getT2();

                                GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
                                gitArtifactMetadata.setGitAuth(gitAuth);
                                gitArtifactMetadata.setDefaultArtifactId(artifact.getId());
                                gitArtifactMetadata.setDefaultBranchName(defaultBranch);
                                gitArtifactMetadata.setRefName(defaultBranch);
                                gitArtifactMetadata.setRepoName(repoName);
                                gitArtifactMetadata.setIsRepoPrivate(isRepoPrivate);
                                gitArtifactMetadata.setLastCommittedAt(Instant.now());

                                gitHandlingService.setRepositoryDetailsInGitArtifactMetadata(
                                        gitConnectDTO, gitArtifactMetadata);
                                artifact.setGitArtifactMetadata(gitArtifactMetadata);
                                return Mono.just(artifact).zipWith(profileMono);
                            });
                })
                .flatMap(tuple2 -> {
                    Artifact artifact = tuple2.getT1();
                    GitArtifactMetadata gitArtifactMetadata = artifact.getGitArtifactMetadata();
                    String defaultBranch = gitArtifactMetadata.getDefaultBranchName();

                    Mono<List<Datasource>> datasourceMono = datasourceService
                            .getAllByWorkspaceIdWithStorages(workspaceId, datasourcePermission.getEditPermission())
                            .collectList();

                    Mono<List<Plugin>> pluginMono =
                            pluginService.getDefaultPlugins().collectList();

                    ArtifactJsonTransformationDTO jsonMorphDTO = new ArtifactJsonTransformationDTO();
                    jsonMorphDTO.setWorkspaceId(workspaceId);
                    jsonMorphDTO.setBaseArtifactId(artifact.getId());
                    jsonMorphDTO.setArtifactType(artifactType);
                    jsonMorphDTO.setRepoName(gitArtifactMetadata.getRepoName());
                    jsonMorphDTO.setRefType(RefType.branch);
                    jsonMorphDTO.setRefName(defaultBranch);

                    Mono<? extends ArtifactExchangeJson> artifactExchangeJsonMono = gitHandlingService
                            .reconstructArtifactJsonFromGitRepository(jsonMorphDTO)
                            .onErrorResume(error -> {
                                log.error("Error while constructing artifact from git repo", error);
                                return deleteArtifactCreatedFromGitImport(jsonMorphDTO, gitType)
                                        .then(Mono.error(new AppsmithException(
                                                AppsmithError.GIT_FILE_SYSTEM_ERROR, error.getMessage())));
                            });

                    return Mono.zip(artifactExchangeJsonMono, datasourceMono, pluginMono)
                            .flatMap(data -> {
                                ArtifactExchangeJson artifactExchangeJson = data.getT1();
                                List<Datasource> datasourceList = data.getT2();
                                List<Plugin> pluginList = data.getT3();

                                if (artifactExchangeJson.getArtifact() == null
                                        || gitArtifactHelper.isContextInArtifactEmpty(artifactExchangeJson)) {
                                    return deleteArtifactCreatedFromGitImport(jsonMorphDTO, gitType)
                                            .then(Mono.error(new AppsmithException(
                                                    AppsmithError.GIT_ACTION_FAILED,
                                                    "import",
                                                    "Cannot import artifact from an empty repo")));
                                }
                                // If there is an existing datasource with the same name but a different type from that
                                // in the repo, the import api should fail
                                // TODO: change the implementation to compare datasource with gitSyncIds instead.
                                if (checkIsDatasourceNameConflict(
                                        datasourceList, artifactExchangeJson.getDatasourceList(), pluginList)) {
                                    return deleteArtifactCreatedFromGitImport(jsonMorphDTO, gitType)
                                            .then(Mono.error(new AppsmithException(
                                                    AppsmithError.GIT_ACTION_FAILED,
                                                    "import",
                                                    "Datasource already exists with the same name")));
                                }

                                artifactExchangeJson.getArtifact().setGitArtifactMetadata(gitArtifactMetadata);
                                return importService
                                        .importArtifactInWorkspaceFromGit(
                                                workspaceId, artifact.getId(), artifactExchangeJson, defaultBranch)
                                        .onErrorResume(throwable -> deleteArtifactCreatedFromGitImport(
                                                        jsonMorphDTO, gitType)
                                                .then(Mono.error(new AppsmithException(
                                                        AppsmithError.GIT_FILE_SYSTEM_ERROR, throwable.getMessage()))));
                            });
                })
                .flatMap(artifact -> gitArtifactHelper.publishArtifact(artifact, false))
                // Add un-configured datasource to the list to response
                .flatMap(artifact -> importService.getArtifactImportDTO(
                        artifact.getWorkspaceId(), artifact.getId(), artifact, artifactType))
                // Add analytics event
                .flatMap(artifactImportDTO -> {
                    Artifact artifact = artifactImportDTO.getArtifact();
                    return gitAnalyticsUtils
                            .addAnalyticsForGitOperation(
                                    AnalyticsEvents.GIT_IMPORT,
                                    artifact,
                                    artifact.getGitArtifactMetadata().getIsRepoPrivate())
                            .thenReturn(artifactImportDTO);
                });

        return Mono.create(
                sink -> importedArtifactMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    private Mono<? extends Artifact> deleteArtifactCreatedFromGitImport(
            ArtifactJsonTransformationDTO artifactJsonTransformationDTO, GitType gitType) {

        GitArtifactHelper<?> gitArtifactHelper =
                gitArtifactHelperResolver.getArtifactHelper(artifactJsonTransformationDTO.getArtifactType());
        GitHandlingService gitHandlingService = gitHandlingServiceResolver.getGitHandlingService(gitType);

        return gitHandlingService
                .removeRepository(artifactJsonTransformationDTO)
                .zipWith(gitArtifactHelper.deleteArtifact(artifactJsonTransformationDTO.getBaseArtifactId()))
                .map(Tuple2::getT2);
    }

    private boolean checkIsDatasourceNameConflict(
            List<Datasource> existingDatasources,
            List<DatasourceStorage> importedDatasources,
            List<Plugin> pluginList) {
        // If we have an existing datasource with the same name but a different type from that in the repo, the import
        // api should fail
        for (DatasourceStorage datasourceStorage : importedDatasources) {
            // Collect the datasource(existing in workspace) which has same as of imported datasource
            // As names are unique we will need filter first element to check if the plugin id is matched
            Datasource filteredDatasource = existingDatasources.stream()
                    .filter(datasource1 -> datasource1.getName().equals(datasourceStorage.getName()))
                    .findFirst()
                    .orElse(null);

            // Check if both of the datasource's are of the same plugin type
            if (filteredDatasource != null) {
                long matchCount = pluginList.stream()
                        .filter(plugin -> {
                            final String pluginReference =
                                    plugin.getPluginName() == null ? plugin.getPackageName() : plugin.getPluginName();

                            return plugin.getId().equals(filteredDatasource.getPluginId())
                                    && !datasourceStorage.getPluginId().equals(pluginReference);
                        })
                        .count();
                if (matchCount > 0) {
                    return true;
                }
            }
        }
        return false;
    }

    @Override
    public Mono<? extends Artifact> checkoutReference(
            String referenceArtifactId,
            ArtifactType artifactType,
            GitRefDTO gitRefDTO,
            boolean addFileLock,
            GitType gitType) {

        if (gitRefDTO == null || !hasText(gitRefDTO.getRefName())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.REF_NAME));
        }

        if (gitRefDTO.getRefType() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, REF_TYPE));
        }

        Mono<Tuple2<? extends Artifact, ? extends Artifact>> baseAndBranchedArtifactMono =
                getBaseAndBranchedArtifacts(referenceArtifactId, artifactType);

        return baseAndBranchedArtifactMono.flatMap(artifactTuples -> {
            Artifact baseArtifact = artifactTuples.getT1();
            return checkoutReference(baseArtifact, gitRefDTO, addFileLock, gitType);
        });
    }

    protected Mono<? extends Artifact> checkoutReference(
            Artifact baseArtifact, GitRefDTO gitRefDTO, boolean addFileLock, GitType gitType) {

        if (gitRefDTO == null || !hasText(gitRefDTO.getRefName())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.REF_NAME));
        }

        if (gitRefDTO.getRefType() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, REF_TYPE));
        }

        RefType refType = gitRefDTO.getRefType();
        GitArtifactMetadata baseGitMetadata = baseArtifact.getGitArtifactMetadata();

        if (isBaseGitMetadataInvalid(baseGitMetadata, gitType)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
        }

        if (RefType.tag.equals(refType)) {
            return checkoutTag(baseArtifact, gitRefDTO, gitType);
        }

        String baseArtifactId = baseGitMetadata.getDefaultArtifactId();
        final String finalRefName = gitRefDTO.getRefName().replaceFirst(ORIGIN, REMOTE_NAME_REPLACEMENT);
        ArtifactType artifactType = baseArtifact.getArtifactType();

        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        GitHandlingService gitHandlingService = gitHandlingServiceResolver.getGitHandlingService(gitType);

        Mono<Boolean> acquireFileLock = gitRedisUtils.acquireGitLock(
                baseArtifact.getArtifactType(), baseArtifactId, GitCommandConstants.CHECKOUT_REF, addFileLock);

        Mono<? extends Artifact> checkedOutArtifactMono;
        // If the user is trying to check out remote reference, create a new reference if it does not exist already

        ArtifactJsonTransformationDTO jsonTransformationDTO = new ArtifactJsonTransformationDTO();
        jsonTransformationDTO.setWorkspaceId(baseArtifact.getWorkspaceId());
        jsonTransformationDTO.setBaseArtifactId(baseGitMetadata.getDefaultArtifactId());
        jsonTransformationDTO.setRefName(finalRefName);
        jsonTransformationDTO.setRefType(refType);
        jsonTransformationDTO.setArtifactType(artifactType);
        jsonTransformationDTO.setRepoName(baseGitMetadata.getRepoName());

        if (gitRefDTO.getRefName().startsWith(ORIGIN)) {
            // checking for local present references first
            checkedOutArtifactMono = gitHandlingService
                    .listReferences(jsonTransformationDTO, FALSE)
                    .flatMap(gitRefs -> {
                        long branchMatchCount = gitRefs.stream()
                                .filter(gitRef -> gitRef.equals(finalRefName))
                                .count();

                        if (branchMatchCount == 0) {
                            return checkoutRemoteReference(baseArtifact, gitRefDTO, gitType);
                        }

                        return Mono.error(new AppsmithException(
                                AppsmithError.GIT_ACTION_FAILED,
                                GitCommandConstants.CHECKOUT_REF,
                                gitRefDTO.getRefName() + " already exists in local - " + finalRefName));
                    });
        } else {
            // TODO refactor method to account for RefName as well
            checkedOutArtifactMono = gitHandlingService
                    .checkoutArtifact(jsonTransformationDTO)
                    .flatMap(isCheckedOut -> gitArtifactHelper.getArtifactByBaseIdAndBranchName(
                            baseArtifactId, finalRefName, gitArtifactHelper.getArtifactReadPermission()))
                    .flatMap(artifact -> gitAnalyticsUtils.addAnalyticsForGitOperation(
                            AnalyticsEvents.GIT_CHECKOUT_BRANCH,
                            artifact,
                            artifact.getGitArtifactMetadata().getIsRepoPrivate()));
        }

        return acquireFileLock
                .then(checkedOutArtifactMono)
                .flatMap(checkedOutArtifact -> gitRedisUtils
                        .releaseFileLock(artifactType, baseArtifactId, addFileLock)
                        .thenReturn(checkedOutArtifact))
                .onErrorResume(error -> {
                    log.error("An error occurred while checking out the reference. error {}", error.getMessage());
                    return gitRedisUtils
                            .releaseFileLock(artifactType, baseArtifactId, addFileLock)
                            .then(Mono.error(error));
                })
                .tag(GitConstants.GitMetricConstants.CHECKOUT_REMOTE, FALSE.toString())
                .name(GitSpan.OPS_CHECKOUT_BRANCH)
                .tap(Micrometer.observation(observationRegistry));
    }

    protected Mono<? extends Artifact> checkoutTag(Artifact baseArtifact, GitRefDTO gitRefDTO, GitType gitType) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    protected Mono<? extends Artifact> checkoutRemoteReference(
            String baseArtifactId, ArtifactType artifactType, GitRefDTO gitRefDTO, GitType gitType) {

        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<? extends Artifact> baseArtifactMono = gitArtifactHelper
                .getArtifactById(baseArtifactId, artifactEditPermission)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.GIT_GENERIC_ERROR)))
                .cache();

        return baseArtifactMono.flatMap(baseArtifact -> checkoutRemoteReference(baseArtifact, gitRefDTO, gitType));
    }

    private Mono<? extends Artifact> checkoutRemoteReference(
            Artifact baseArtifact, GitRefDTO gitRefDTO, GitType gitType) {

        GitHandlingService gitHandlingService = gitHandlingServiceResolver.getGitHandlingService(gitType);
        GitArtifactHelper<?> gitArtifactHelper =
                gitArtifactHelperResolver.getArtifactHelper(baseArtifact.getArtifactType());

        GitArtifactMetadata baseGitMetadata = baseArtifact.getGitArtifactMetadata();

        if (isBaseGitMetadataInvalid(baseGitMetadata, gitType)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
        }

        final String repoName = baseGitMetadata.getRepoName();
        final String baseArtifactId = baseGitMetadata.getDefaultArtifactId();
        final String baseRefName = baseGitMetadata.getRefName();
        final String workspaceId = baseArtifact.getWorkspaceId();
        final String finalRemoteRefName = gitRefDTO.getRefName().replaceFirst(ORIGIN, REMOTE_NAME_REPLACEMENT);

        ArtifactJsonTransformationDTO jsonTransformationDTO = new ArtifactJsonTransformationDTO(
                workspaceId, baseArtifactId, repoName, baseArtifact.getArtifactType());

        jsonTransformationDTO.setRefType(gitRefDTO.getRefType());
        jsonTransformationDTO.setRefName(finalRemoteRefName);

        FetchRemoteDTO fetchRemoteDTO = new FetchRemoteDTO(List.of(finalRemoteRefName), gitRefDTO.getRefType(), false);

        Mono<? extends Artifact> artifactMono;
        if (baseRefName.equals(finalRemoteRefName)) {
            /*
             in this case, user deleted the initial default branch and now wants to check out to that branch.
             as we didn't delete the artifact object but only the branch from git repo,
             we can just use this existing artifact without creating a new one.
            */
            artifactMono = Mono.just(baseArtifact);
        } else {
            // create new Artifact
            artifactMono = generateArtifactForRefCreation(baseArtifact, finalRemoteRefName, gitRefDTO.getRefType());
        }

        Mono<? extends Artifact> checkedOutRemoteArtifactMono = gitHandlingService
                .fetchRemoteReferences(jsonTransformationDTO, fetchRemoteDTO, baseGitMetadata.getGitAuth())
                .flatMap(ignoredFetchString -> gitHandlingService.checkoutRemoteReference(jsonTransformationDTO))
                .onErrorResume(error -> Mono.error(
                        new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "checkout branch", error.getMessage())))
                .flatMap(ignoreRemoteChanges -> {
                    return gitHandlingService
                            .reconstructArtifactJsonFromGitRepository(jsonTransformationDTO)
                            .zipWith(artifactMono);
                })
                .flatMap(tuple -> {
                    // Get the latest artifact mono with all the changes
                    ArtifactExchangeJson artifactExchangeJson = tuple.getT1();
                    Artifact artifact = tuple.getT2();
                    return importService.importArtifactInWorkspaceFromGit(
                            artifact.getWorkspaceId(), artifact.getId(), artifactExchangeJson, finalRemoteRefName);
                })
                .flatMap(importedArtifact -> gitArtifactHelper.publishArtifact(importedArtifact, false))
                .flatMap(publishedArtifact -> gitAnalyticsUtils.addAnalyticsForGitOperation(
                        AnalyticsEvents.GIT_CHECKOUT_REMOTE_BRANCH,
                        publishedArtifact,
                        Boolean.TRUE.equals(
                                publishedArtifact.getGitArtifactMetadata().getIsRepoPrivate())))
                .tag(GitConstants.GitMetricConstants.CHECKOUT_REMOTE, TRUE.toString())
                .name(GitSpan.OPS_CHECKOUT_BRANCH)
                .tap(Micrometer.observation(observationRegistry));

        return Mono.create(sink ->
                checkedOutRemoteArtifactMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    @Override
    public Mono<? extends Artifact> createReference(
            String referencedArtifactId, ArtifactType artifactType, GitRefDTO refDTO, GitType gitType) {

        /*
        1. Check if the src artifact is available and user have sufficient permissions
        2. Create and checkout to requested branch
        3. Rehydrate the artifact from source artifact reference
         */

        if (refDTO.getRefType() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, REF_TYPE));
        }

        if (!hasText(refDTO.getRefName()) || refDTO.getRefName().startsWith(ORIGIN)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, REF_NAME));
        }

        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<Tuple2<? extends Artifact, ? extends Artifact>> baseAndBranchedArtifactMono =
                getBaseAndBranchedArtifacts(referencedArtifactId, artifactType, artifactEditPermission);

        return baseAndBranchedArtifactMono.flatMap(artifactTuples -> {
            Artifact baseArtifact = artifactTuples.getT1();
            Artifact parentArtifact = artifactTuples.getT2();

            return createReference(baseArtifact, parentArtifact, refDTO, gitType);
        });
    }

    protected Mono<? extends Artifact> createReference(
            Artifact baseArtifact, Artifact sourceArtifact, GitRefDTO refDTO, GitType gitType) {

        RefType refType = refDTO.getRefType();
        GitArtifactMetadata baseGitMetadata = baseArtifact.getGitArtifactMetadata();
        GitAuth baseGitAuth = baseGitMetadata.getGitAuth();
        GitArtifactMetadata sourceGitMetadata = sourceArtifact.getGitArtifactMetadata();

        if (sourceGitMetadata == null
                || !hasText(sourceGitMetadata.getDefaultArtifactId())
                || !hasText(sourceGitMetadata.getRepoName())) {
            // TODO: add refType in error
            return Mono.error(new AppsmithException(
                    AppsmithError.INVALID_GIT_CONFIGURATION,
                    "Unable to find the parent reference. Please create a reference from other available references"));
        }

        ArtifactType artifactType = baseArtifact.getArtifactType();
        String workspaceId = baseArtifact.getWorkspaceId();
        String baseArtifactId = baseGitMetadata.getDefaultArtifactId();
        String repoName = baseGitMetadata.getRepoName();

        String sourceArtifactId = sourceArtifact.getId();

        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        GitHandlingService gitHandlingService = gitHandlingServiceResolver.getGitHandlingService(gitType);

        ArtifactJsonTransformationDTO baseRefTransformationDTO =
                new ArtifactJsonTransformationDTO(workspaceId, baseArtifactId, repoName, artifactType);
        baseRefTransformationDTO.setRefName(sourceGitMetadata.getRefName());
        baseRefTransformationDTO.setRefType(refType);

        ArtifactJsonTransformationDTO createRefTransformationDTO =
                new ArtifactJsonTransformationDTO(workspaceId, baseArtifactId, repoName, artifactType);
        createRefTransformationDTO.setRefType(refType);
        createRefTransformationDTO.setRefName(refDTO.getRefName());

        Mono<Boolean> acquireGitLockMono = gitRedisUtils.acquireGitLock(
                artifactType, baseGitMetadata.getDefaultArtifactId(), GitCommandConstants.CREATE_REF, FALSE);

        FetchRemoteDTO fetchRemoteDTO = new FetchRemoteDTO();
        fetchRemoteDTO.setRefType(refType);
        fetchRemoteDTO.setIsFetchAll(TRUE);

        Mono<String> fetchRemoteMono =
                gitHandlingService.fetchRemoteReferences(baseRefTransformationDTO, fetchRemoteDTO, baseGitAuth);

        Mono<? extends Artifact> createBranchMono = acquireGitLockMono
                .flatMap(ignoreLockAcquisition ->
                        fetchRemoteMono.onErrorResume(error -> Mono.error(new AppsmithException(
                                AppsmithError.GIT_ACTION_FAILED, GitCommandConstants.FETCH_REMOTE, error))))
                .flatMap(ignoreFetchString -> gitHandlingService
                        .listReferences(createRefTransformationDTO, TRUE)
                        .flatMap(gitRefDTOs -> {
                            Mono<? extends ArtifactExchangeJson> artifactExchangeJsonMono =
                                    getArtifactExchangeJsonForRefCreation(sourceArtifact, refType, gitType)
                                            .cache();

                            return artifactExchangeJsonMono.flatMap(artifactExchangeJson -> {
                                Mono<Boolean> refCreationValidationMono = isValidationForRefCreationComplete(
                                        baseArtifact,
                                        sourceArtifact,
                                        gitType,
                                        gitRefDTOs,
                                        refDTO,
                                        artifactExchangeJson);

                                return refCreationValidationMono.flatMap(isOkayToProceed -> {
                                    if (!TRUE.equals(isOkayToProceed)) {
                                        return Mono.error(
                                                new AppsmithException(
                                                        AppsmithError.GIT_ACTION_FAILED,
                                                        "ref creation",
                                                        "either ref name is already exists or it doesn't meet naming criteria, or the artifact is not in a publishable state"));
                                    }

                                    Mono<? extends Artifact> newArtifactFromSourceMono = generateArtifactForRefCreation(
                                            sourceArtifact, refDTO.getRefName(), refDTO.getRefType());

                                    return Mono.zip(newArtifactFromSourceMono, artifactExchangeJsonMono);
                                });
                            });
                        }))
                .flatMap(tuple -> {
                    ArtifactExchangeJson exportedJson = tuple.getT2();
                    Artifact newRefArtifact = tuple.getT1();

                    Mono<String> refCreationMono = gitHandlingService
                            .createGitReference(
                                    baseRefTransformationDTO, createRefTransformationDTO, baseGitMetadata, refDTO)
                            // TODO: this error could be shipped to handling layer as well?
                            .onErrorResume(error -> Mono.error(new AppsmithException(
                                    AppsmithError.GIT_ACTION_FAILED, "ref creation preparation", error.getMessage())));

                    return refCreationMono
                            .flatMap(ignoredString -> {
                                return importService.importArtifactInWorkspaceFromGit(
                                        newRefArtifact.getWorkspaceId(),
                                        newRefArtifact.getId(),
                                        exportedJson,
                                        refDTO.getRefName());
                            })
                            .flatMap(importedArtifact -> {
                                return gitArtifactHelper.publishArtifactPostRefCreation(
                                        importedArtifact, refType, TRUE);
                            })
                            .flatMap(newImportedArtifact -> {
                                if (RefType.tag.equals(refType)) {
                                    return Mono.just(newImportedArtifact);
                                }

                                // after a new branch is created, the parent branch should be reset to a
                                // clean status, i.e. last commit
                                return discardChanges(sourceArtifact, gitType).thenReturn(newImportedArtifact);
                            });
                })
                .flatMap(newImportedArtifact -> gitRedisUtils
                        .releaseFileLock(artifactType, baseArtifactId, TRUE)
                        .then(gitAnalyticsUtils.addAnalyticsForGitOperation(
                                AnalyticsEvents.GIT_CREATE_BRANCH,
                                newImportedArtifact,
                                newImportedArtifact.getGitArtifactMetadata().getIsRepoPrivate())))
                .onErrorResume(error -> {
                    log.error("An error occurred while creating reference. error {}", error.getMessage());
                    return gitRedisUtils
                            .releaseFileLock(artifactType, baseArtifactId, TRUE)
                            .then(Mono.error(new AppsmithException(
                                    AppsmithError.GIT_ACTION_FAILED,
                                    GitCommandConstants.CREATE_REF,
                                    error.getMessage())));
                })
                .name(GitSpan.OPS_CREATE_BRANCH)
                .tap(Micrometer.observation(observationRegistry));

        return Mono.create(sink -> createBranchMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    protected Mono<? extends ArtifactExchangeJson> getArtifactExchangeJsonForRefCreation(
            Artifact sourceArtifact, RefType refType, GitType gitType) {
        if (RefType.tag.equals(refType)) {
            return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
        }

        return exportService.exportByArtifactId(
                sourceArtifact.getId(), VERSION_CONTROL, sourceArtifact.getArtifactType());
    }

    protected Mono<Boolean> isValidationForRefCreationComplete(
            Artifact baseArtifact,
            Artifact parentArtifact,
            GitType gitType,
            List<GitRefDTO> fetchedGitRefDTOS,
            GitRefDTO incomingGitRefDTO,
            ArtifactExchangeJson artifactExchangeJson) {

        RefType refType = incomingGitRefDTO.getRefType();
        if (RefType.tag.equals(refType)) {
            return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
        }

        // We are only supporting origin as the remote name so this is safe
        // but needs to be altered if we start supporting user defined remote
        // names
        Boolean isDuplicateName = fetchedGitRefDTOS.stream()
                .map(GitRefDTO::getRefName)
                .anyMatch(refName -> refName.replaceFirst(ORIGIN, REMOTE_NAME_REPLACEMENT)
                        .equals(incomingGitRefDTO.getRefName().replaceFirst(ORIGIN, REMOTE_NAME_REPLACEMENT)));

        if (TRUE.equals(isDuplicateName)) {
            return Mono.error(new AppsmithException(
                    AppsmithError.DUPLICATE_KEY_USER_ERROR,
                    "remotes/origin/" + incomingGitRefDTO.getRefName(),
                    BRANCH_NAME));
        }

        // in CE only branch creation is allowed
        return Mono.just(TRUE);
    }

    @Override
    public Mono<? extends Artifact> deleteGitReference(
            String baseArtifactId, ArtifactType artifactType, String refName, RefType refType, GitType gitType) {

        if (refType == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, REF_TYPE));
        }

        if (!hasText(refName)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, REF_NAME));
        }

        if (!hasText(baseArtifactId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<? extends Artifact> baseArtifactMono =
                gitArtifactHelper.getArtifactById(baseArtifactId, artifactEditPermission);

        Mono<? extends Artifact> branchedArtifactMono =
                gitArtifactHelper.getArtifactByBaseIdAndBranchName(baseArtifactId, refName, artifactEditPermission);

        return Mono.zip(baseArtifactMono, branchedArtifactMono).flatMap(tuple2 -> {
            Artifact baseArtifact = tuple2.getT1();
            Artifact referenceArtifact = tuple2.getT2();
            return deleteGitReference(baseArtifact, referenceArtifact, gitType, refType);
        });
    }

    protected Mono<? extends Artifact> deleteGitReference(
            Artifact baseArtifact, Artifact referenceArtifact, GitType gitType, RefType refType) {

        GitArtifactMetadata baseGitMetadata = baseArtifact.getGitArtifactMetadata();
        GitArtifactMetadata referenceArtifactMetadata = referenceArtifact.getGitArtifactMetadata();
        ArtifactType artifactType = baseArtifact.getArtifactType();

        GitHandlingService gitHandlingService = gitHandlingServiceResolver.getGitHandlingService(gitType);
        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);

        // TODO: write a migration to shift everything to refName in gitMetadata
        final String finalRefName = referenceArtifactMetadata.getRefName();
        final String baseArtifactId = referenceArtifact.getGitArtifactMetadata().getDefaultArtifactId();

        if (finalRefName.equals(baseGitMetadata.getDefaultBranchName())) {
            return Mono.error(new AppsmithException(
                    AppsmithError.GIT_ACTION_FAILED, "delete ref", " Cannot delete default branch"));
        }

        Mono<? extends Artifact> deleteReferenceMono = gitPrivateRepoHelper
                .isBranchProtected(baseGitMetadata, finalRefName)
                .flatMap(isBranchProtected -> {
                    if (!TRUE.equals(isBranchProtected)) {
                        return gitRedisUtils.acquireGitLock(
                                artifactType, baseArtifactId, GitConstants.GitCommandConstants.DELETE, TRUE);
                    }

                    return Mono.error(new AppsmithException(
                            AppsmithError.GIT_ACTION_FAILED,
                            "delete",
                            "Cannot delete protected branch " + finalRefName));
                })
                .flatMap(ignoreLockAcquisition -> {
                    ArtifactJsonTransformationDTO jsonTransformationDTO = new ArtifactJsonTransformationDTO();
                    jsonTransformationDTO.setWorkspaceId(baseArtifact.getWorkspaceId());
                    jsonTransformationDTO.setArtifactType(baseArtifact.getArtifactType());
                    jsonTransformationDTO.setRefType(refType);
                    jsonTransformationDTO.setRefName(finalRefName);
                    jsonTransformationDTO.setBaseArtifactId(baseArtifactId);
                    jsonTransformationDTO.setRepoName(referenceArtifactMetadata.getRepoName());

                    return gitHandlingService
                            .deleteGitReference(jsonTransformationDTO)
                            .flatMap(isReferenceDeleted -> gitRedisUtils
                                    .releaseFileLock(artifactType, baseArtifactId, TRUE)
                                    .thenReturn(isReferenceDeleted))
                            .flatMap(isReferenceDeleted -> {
                                if (FALSE.equals(isReferenceDeleted)) {
                                    return Mono.error(new AppsmithException(
                                            AppsmithError.GIT_ACTION_FAILED,
                                            " delete branch. Branch does not exists in the repo"));
                                }

                                if (referenceArtifact.getId().equals(baseArtifactId)) {
                                    return Mono.just(referenceArtifact);
                                }

                                return gitArtifactHelper
                                        .deleteArtifactByResource(referenceArtifact)
                                        .onErrorResume(throwable -> {
                                            log.error(
                                                    "An error occurred while deleting db artifact and resources for reference {}",
                                                    throwable.getMessage(),
                                                    throwable);

                                            return gitAnalyticsUtils
                                                    .addAnalyticsForGitOperation(
                                                            AnalyticsEvents.GIT_DELETE_BRANCH,
                                                            referenceArtifact,
                                                            throwable.getClass().getName(),
                                                            throwable.getMessage(),
                                                            baseGitMetadata.getIsRepoPrivate())
                                                    .then(Mono.error(new AppsmithException(
                                                            AppsmithError.GIT_ACTION_FAILED,
                                                            "Cannot delete branch from database")));
                                        });
                            });
                })
                .flatMap(deletedArtifact -> gitAnalyticsUtils.addAnalyticsForGitOperation(
                        AnalyticsEvents.GIT_DELETE_BRANCH,
                        deletedArtifact,
                        deletedArtifact.getGitArtifactMetadata().getIsRepoPrivate()))
                .onErrorResume(error -> {
                    log.error(
                            "An error occurred while deleting the git reference : {}, with base id {}",
                            referenceArtifactMetadata.getRefName(),
                            baseArtifactId);

                    return gitRedisUtils
                            .releaseFileLock(artifactType, baseArtifactId, TRUE)
                            .then(Mono.error(error));
                })
                .name(GitSpan.OPS_DELETE_BRANCH)
                .tap(Micrometer.observation(observationRegistry));

        return Mono.create(
                sink -> deleteReferenceMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    /**
     * Connect the artifact from Appsmith to a git repo
     * This is the prerequisite step needed to perform all the git operation for an artifact
     * We are implementing the deployKey approach and since the deploy-keys are repo level these keys are store under artifact.
     * Each artifact is equal to a repo in the git(and each branch creates a new artifact with default artifact as parent)
     *
     * @param baseArtifactId : artifactId of the artifact which is getting connected to git
     * @param artifactType
     * @param gitConnectDTO  artifactId - this is used to link the local git repo to an artifact
     *                       remoteUrl - used for connecting to remote repo etc
     * @param originHeader
     * @param gitType
     * @return an artifact with git metadata
     */
    @Override
    public Mono<? extends Artifact> connectArtifactToGit(
            String baseArtifactId,
            ArtifactType artifactType,
            GitConnectDTO gitConnectDTO,
            String originHeader,
            GitType gitType) {
        /*
         *  Connecting the artifact for the first time
         *  The ssh keys is already present in artifact object from generate SSH key step
         *  We would be updating the remote url and default branchName
         * */

        GitHandlingService gitHandlingService = gitHandlingServiceResolver.getGitHandlingService(gitType);
        Set<String> validationErrors = gitHandlingService.validateGitConnectDTO(gitConnectDTO);

        if (!CollectionUtils.isEmpty(validationErrors)) {
            return Mono.error(new AppsmithException(
                    AppsmithError.INVALID_PARAMETER,
                    validationErrors.stream().findFirst().get()));
        }

        if (!StringUtils.hasText(originHeader)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORIGIN));
        }

        Mono<GitUser> gitUserMono = getGitUserForArtifactId(baseArtifactId);

        Mono<Map<String, GitProfile>> profileMono = gitProfileUtils
                .updateOrCreateGitProfileForCurrentUser(gitConnectDTO.getGitProfile(), baseArtifactId)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_PROFILE_ERROR)))
                .cache();

        String repoName = gitHandlingService.getRepoName(gitConnectDTO);

        Mono<Boolean> isPrivateRepoMono = gitHandlingService.isRepoPrivate(gitConnectDTO);
        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        AclPermission connectToGitPermission = gitArtifactHelper.getArtifactGitConnectPermission();

        Mono<? extends Artifact> artifactToConnectMono = gitArtifactHelper
                .getArtifactById(baseArtifactId, connectToGitPermission)
                .cache();
        Mono<? extends Artifact> connectedArtifactMono = Mono.zip(profileMono, isPrivateRepoMono, artifactToConnectMono)
                .flatMap(tuple -> {
                    Artifact artifact = tuple.getT3();
                    Boolean isRepoPrivate = tuple.getT2();

                    return isRepositoryLimitReachedForWorkspace(artifact.getWorkspaceId(), isRepoPrivate)
                            .flatMap(isLimitReached -> {
                                if (FALSE.equals(isLimitReached)) {
                                    return Mono.just(artifact);
                                }

                                return gitAnalyticsUtils
                                        .addAnalyticsForGitOperation(
                                                AnalyticsEvents.GIT_PRIVATE_REPO_LIMIT_EXCEEDED,
                                                artifact,
                                                AppsmithError.GIT_APPLICATION_LIMIT_ERROR.getErrorType(),
                                                AppsmithError.GIT_APPLICATION_LIMIT_ERROR.getMessage(),
                                                isRepoPrivate)
                                        .then(Mono.error(
                                                new AppsmithException(AppsmithError.GIT_APPLICATION_LIMIT_ERROR)));
                            });
                })
                .flatMap(artifact -> {
                    GitArtifactMetadata gitArtifactMetadata = artifact.getGitArtifactMetadata();
                    if (isBaseGitMetadataInvalid(gitArtifactMetadata, gitType)) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                    } else {
                        GitAuth gitAuth = gitArtifactMetadata.getGitAuth();
                        Mono<String> defaultBranchMono = gitHandlingService
                                .fetchRemoteRepository(gitConnectDTO, gitAuth, artifact, repoName)
                                .onErrorResume(error -> {
                                    log.error("Error while cloning the remote repo, ", error);

                                    AppsmithException appsmithException = null;
                                    if (error instanceof AppsmithException e) {
                                        appsmithException = e;
                                    } else if (error instanceof TransportException) {
                                        appsmithException =
                                                new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION);
                                    } else if (error instanceof InvalidRemoteException) {
                                        appsmithException = new AppsmithException(
                                                AppsmithError.INVALID_GIT_CONFIGURATION, error.getMessage());
                                    } else if (error instanceof TimeoutException) {
                                        appsmithException = new AppsmithException(AppsmithError.GIT_EXECUTION_TIMEOUT);
                                    } else if (error instanceof ClassCastException) {
                                        // To catch TransportHttp cast error in case HTTP URL is passed
                                        // instead of SSH URL
                                        if (error.getMessage().contains("TransportHttp")) {
                                            appsmithException =
                                                    new AppsmithException(AppsmithError.INVALID_GIT_SSH_URL);
                                        }
                                    } else {
                                        appsmithException = new AppsmithException(
                                                AppsmithError.GIT_GENERIC_ERROR, error.getMessage());
                                    }

                                    ArtifactJsonTransformationDTO jsonTransformationDTO =
                                            new ArtifactJsonTransformationDTO();
                                    jsonTransformationDTO.setWorkspaceId(artifact.getWorkspaceId());
                                    jsonTransformationDTO.setBaseArtifactId(artifact.getId());
                                    jsonTransformationDTO.setRepoName(repoName);
                                    jsonTransformationDTO.setArtifactType(artifactType);

                                    return gitHandlingService
                                            .removeRepository(jsonTransformationDTO)
                                            .then(gitAnalyticsUtils.addAnalyticsForGitOperation(
                                                    AnalyticsEvents.GIT_CONNECT,
                                                    artifact,
                                                    error.getClass().getName(),
                                                    error.getMessage(),
                                                    artifact.getGitArtifactMetadata()
                                                            .getIsRepoPrivate()))
                                            .then(Mono.error(appsmithException));
                                });

                        return Mono.zip(Mono.just(artifact), defaultBranchMono);
                    }
                })
                .flatMap(tuple -> {
                    Artifact artifact = tuple.getT1();
                    String defaultBranch = tuple.getT2();

                    ArtifactJsonTransformationDTO jsonTransformationDTO = new ArtifactJsonTransformationDTO();
                    jsonTransformationDTO.setWorkspaceId(artifact.getWorkspaceId());
                    jsonTransformationDTO.setBaseArtifactId(artifact.getId());
                    jsonTransformationDTO.setRepoName(repoName);
                    jsonTransformationDTO.setArtifactType(artifactType);

                    final String artifactId = artifact.getId();
                    final String workspaceId = artifact.getWorkspaceId();

                    Mono<Boolean> isClonedRepositoryEmptyMono =
                            gitHandlingService.validateEmptyRepository(jsonTransformationDTO);
                    return isClonedRepositoryEmptyMono
                            .zipWith(isPrivateRepoMono)
                            .flatMap(objects -> {
                                Boolean isEmpty = objects.getT1();
                                Boolean isRepoPrivate = objects.getT2();
                                if (FALSE.equals(isEmpty)) {
                                    return gitAnalyticsUtils
                                            .addAnalyticsForGitOperation(
                                                    AnalyticsEvents.GIT_CONNECT,
                                                    artifact,
                                                    AppsmithError.INVALID_GIT_REPO.getErrorType(),
                                                    AppsmithError.INVALID_GIT_REPO.getMessage(),
                                                    isRepoPrivate)
                                            .then(Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_REPO)));
                                }

                                GitArtifactMetadata gitArtifactMetadata = artifact.getGitArtifactMetadata();
                                gitArtifactMetadata.setDefaultArtifactId(artifactId);
                                gitArtifactMetadata.setRefName(defaultBranch);
                                gitArtifactMetadata.setDefaultBranchName(defaultBranch);
                                gitArtifactMetadata.setRepoName(repoName);
                                gitArtifactMetadata.setIsRepoPrivate(isRepoPrivate);
                                gitArtifactMetadata.setLastCommittedAt(Instant.now());

                                gitHandlingService.setRepositoryDetailsInGitArtifactMetadata(
                                        gitConnectDTO, gitArtifactMetadata);

                                // Set branchName for each artifact resource
                                return exportService
                                        .exportByArtifactId(artifactId, VERSION_CONTROL, artifactType)
                                        .flatMap(artifactJson -> {
                                            artifactJson.getArtifact().setGitArtifactMetadata(gitArtifactMetadata);
                                            return importService.importArtifactInWorkspaceFromGit(
                                                    workspaceId, artifactId, artifactJson, defaultBranch);
                                        });
                            })
                            .onErrorResume(e -> {
                                if (e instanceof IOException) {
                                    return Mono.error(
                                            new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, e.getMessage()));
                                }
                                return Mono.error(e);
                            });
                })
                .flatMap(artifact -> {
                    ArtifactJsonTransformationDTO jsonTransformationDTO = new ArtifactJsonTransformationDTO();
                    jsonTransformationDTO.setWorkspaceId(artifact.getWorkspaceId());
                    jsonTransformationDTO.setBaseArtifactId(artifact.getId());
                    jsonTransformationDTO.setArtifactType(artifactType);
                    jsonTransformationDTO.setRepoName(repoName);

                    final String README_FILE_NAME = GitConstants.README_FILE_NAME;
                    Mono<Boolean> readMeIntialisationMono = gitHandlingService.initialiseReadMe(
                            jsonTransformationDTO, artifact, README_FILE_NAME, originHeader);

                    return Mono.zip(readMeIntialisationMono, gitUserMono)
                            .flatMap(tuple2 -> {
                                String commitMessage = GitConstants.FIRST_COMMIT;
                                GitUser author = tuple2.getT2();
                                CommitDTO commitDTO = new CommitDTO();
                                commitDTO.setAuthor(author);
                                commitDTO.setCommitter(author);
                                commitDTO.setIsAmendCommit(FALSE);
                                commitDTO.setMessage(commitMessage);
                                return gitHandlingService
                                        .createFirstCommit(jsonTransformationDTO, commitDTO)
                                        .then(gitUserMono);
                            })
                            .flatMap(author -> {
                                // Commit and push artifact to check if the SSH key has the write access
                                String commitMessage =
                                        DEFAULT_COMMIT_MESSAGE + GitDefaultCommitMessage.CONNECT_FLOW.getReason();
                                CommitDTO commitDTO = new CommitDTO();
                                commitDTO.setAuthor(author);
                                commitDTO.setCommitter(author);
                                commitDTO.setIsAmendCommit(FALSE);
                                commitDTO.setMessage(commitMessage);

                                return this.commitArtifact(commitDTO, artifact.getId(), artifactType, gitType)
                                        .onErrorResume(error -> {
                                            log.error("Error while committing", error);
                                            // If the push fails remove all the cloned files from local repo
                                            return this.detachRemote(baseArtifactId, artifactType, gitType)
                                                    .flatMap(isDeleted -> {
                                                        if (error instanceof TransportException) {
                                                            return gitAnalyticsUtils
                                                                    .addAnalyticsForGitOperation(
                                                                            AnalyticsEvents.GIT_CONNECT,
                                                                            artifact,
                                                                            error.getClass()
                                                                                    .getName(),
                                                                            error.getMessage(),
                                                                            artifact.getGitArtifactMetadata()
                                                                                    .getIsRepoPrivate())
                                                                    .then(Mono.error(new AppsmithException(
                                                                            AppsmithError.INVALID_GIT_SSH_CONFIGURATION,
                                                                            error.getMessage())));
                                                        }
                                                        return Mono.error(new AppsmithException(
                                                                AppsmithError.GIT_ACTION_FAILED,
                                                                "push",
                                                                error.getMessage()));
                                                    });
                                        });
                            })
                            .then(gitAnalyticsUtils.addAnalyticsForGitOperation(
                                    AnalyticsEvents.GIT_CONNECT,
                                    artifact,
                                    artifact.getGitArtifactMetadata().getIsRepoPrivate()));
                });

        return Mono.create(
                sink -> connectedArtifactMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    @Override
    public Mono<String> commitArtifact(
            CommitDTO commitDTO, String branchedArtifactId, ArtifactType artifactType, GitType gitType) {
        return commitArtifact(commitDTO, branchedArtifactId, artifactType, gitType, TRUE);
    }

    public Mono<String> commitArtifact(
            CommitDTO commitDTO,
            String branchedArtifactId,
            ArtifactType artifactType,
            GitType gitType,
            Boolean isFileLock) {
        /*
        1. Check if artifact exists and user have sufficient permissions
        2. Check if branch name exists in git metadata
        3. Save artifact to the existing local repo
        4. Commit artifact : git add, git commit (Also check if git init required)
         */

        String commitMessage = commitDTO.getMessage();

        if (commitMessage == null || commitMessage.isEmpty()) {
            commitDTO.setMessage(DEFAULT_COMMIT_MESSAGE + GitDefaultCommitMessage.CONNECT_FLOW.getReason());
        }

        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();
        Mono<Tuple2<? extends Artifact, ? extends Artifact>> baseAndBranchedArtifactMono = getBaseAndBranchedArtifacts(
                        branchedArtifactId, artifactType, artifactEditPermission)
                .cache();

        return baseAndBranchedArtifactMono.flatMap(artifactTuples -> {
            Artifact baseArtifact = artifactTuples.getT1();
            Artifact branchedArtifact = artifactTuples.getT2();

            GitUser author = commitDTO.getAuthor();
            Mono<GitUser> gitUserMono = Mono.justOrEmpty(author)
                    .flatMap(gitUser -> {
                        if (author == null
                                || !StringUtils.hasText(author.getEmail())
                                || !StringUtils.hasText(author.getName())) {
                            return getGitUserForArtifactId(baseArtifact.getId());
                        }

                        return Mono.just(gitUser);
                    })
                    .switchIfEmpty(getGitUserForArtifactId(baseArtifact.getId()));

            return gitUserMono.flatMap(gitUser -> {
                commitDTO.setAuthor(gitUser);
                commitDTO.setCommitter(gitUser);
                return commitArtifact(commitDTO, baseArtifact, branchedArtifact, gitType, isFileLock);
            });
        });
    }

    private Mono<String> commitArtifact(
            CommitDTO commitDTO,
            Artifact baseArtifact,
            Artifact branchedArtifact,
            GitType gitType,
            boolean isFileLock) {

        String commitMessage = commitDTO.getMessage();

        if (commitMessage == null || commitMessage.isEmpty()) {
            commitDTO.setMessage(DEFAULT_COMMIT_MESSAGE + GitDefaultCommitMessage.CONNECT_FLOW.getReason());
        }

        GitUser author = commitDTO.getAuthor();
        if (author == null || !StringUtils.hasText(author.getEmail()) || !StringUtils.hasText(author.getName())) {

            String errorMessage = "Unable to find git author configuration for logged-in user. You can set "
                    + "up a git profile from the user profile section.";

            return gitAnalyticsUtils
                    .addAnalyticsForGitOperation(
                            AnalyticsEvents.GIT_COMMIT,
                            branchedArtifact,
                            AppsmithError.INVALID_GIT_CONFIGURATION.getErrorType(),
                            AppsmithError.INVALID_GIT_CONFIGURATION.getMessage(errorMessage),
                            branchedArtifact.getGitArtifactMetadata().getIsRepoPrivate())
                    .then(Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, errorMessage)));
        }

        boolean isSystemGenerated = commitDTO.getMessage().contains(DEFAULT_COMMIT_MESSAGE);

        ArtifactType artifactType = baseArtifact.getArtifactType();
        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        GitHandlingService gitHandlingService = gitHandlingServiceResolver.getGitHandlingService(gitType);
        GitArtifactMetadata baseGitMetadata = baseArtifact.getGitArtifactMetadata();
        GitArtifactMetadata branchedGitMetadata = branchedArtifact.getGitArtifactMetadata();

        if (isBaseGitMetadataInvalid(baseGitMetadata, gitType)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
        }

        if (branchedGitMetadata == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
        }

        final String branchName = branchedGitMetadata.getRefName();
        if (!hasText(branchName)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        }

        Mono<Boolean> isBranchProtectedMono = gitPrivateRepoHelper.isBranchProtected(baseGitMetadata, branchName);
        Mono<String> commitMono = isBranchProtectedMono
                .flatMap(isBranchProtected -> {
                    if (!TRUE.equals(isBranchProtected)) {
                        return gitRedisUtils.acquireGitLock(
                                artifactType,
                                baseGitMetadata.getDefaultArtifactId(),
                                GitConstants.GitCommandConstants.COMMIT,
                                isFileLock);
                    }

                    return Mono.error(new AppsmithException(
                            AppsmithError.GIT_ACTION_FAILED,
                            "commit",
                            "Cannot commit to protected branch " + branchName));
                })
                .flatMap(fileLocked -> {
                    // Check if the repo is public for current artifact and if the user have changed the access after
                    // the connection

                    return gitHandlingService.isRepoPrivate(baseGitMetadata).flatMap(isPrivate -> {
                        // Check the repo limit if the visibility status is updated, or it is private
                        // TODO: split both of these conditions @Manish
                        if (isPrivate.equals(baseGitMetadata.getIsRepoPrivate() && !Boolean.TRUE.equals(isPrivate))) {
                            return Mono.just(baseArtifact);
                        }

                        baseGitMetadata.setIsRepoPrivate(isPrivate);
                        baseArtifact.setGitArtifactMetadata(baseGitMetadata);

                        /**
                         * A separate GitAuth object has been created in which the private key for
                         * authentication is held. It's done to avoid getting the encrypted value back
                         * for private key after mongo save.
                         *
                         * When an object having an encrypted attribute is saved, the response is still encrypted.
                         * The value in db would be corrupted if it's saved again,
                         * as it would encrypt and already encrypted field
                         * Private key is using encrypted annotation, which means that it's encrypted before
                         * being persisted in the db. When it's fetched from db, the listener decrypts it.
                         */
                        GitAuth copiedGitAuth = new GitAuth();
                        copyNestedNonNullProperties(baseGitMetadata.getGitAuth(), copiedGitAuth);

                        return gitArtifactHelper
                                .saveArtifact(baseArtifact)
                                .map(artifact -> {
                                    baseArtifact.getGitArtifactMetadata().setGitAuth(copiedGitAuth);
                                    return artifact;
                                })
                                .then(Mono.defer(
                                        () -> gitArtifactHelper.isPrivateRepoLimitReached(baseArtifact, false)));
                    });
                })
                .flatMap(artifact -> {
                    String errorEntity = "";
                    if (!StringUtils.hasText(branchedGitMetadata.getRefName())) {
                        errorEntity = "branch name";
                    } else if (!StringUtils.hasText(branchedGitMetadata.getDefaultArtifactId())) {
                        errorEntity = "default artifact";
                    } else if (!StringUtils.hasText(branchedGitMetadata.getRepoName())) {
                        errorEntity = "repository name";
                    }

                    if (!errorEntity.isEmpty()) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION, "Unable to find " + errorEntity));
                    }

                    return exportService.exportByArtifactId(
                            branchedArtifact.getId(), VERSION_CONTROL, branchedArtifact.getArtifactType());
                })
                .flatMap(artifactExchangeJson -> {
                    ArtifactJsonTransformationDTO jsonTransformationDTO = new ArtifactJsonTransformationDTO();
                    jsonTransformationDTO.setRefType(RefType.branch);
                    jsonTransformationDTO.setWorkspaceId(baseArtifact.getWorkspaceId());
                    jsonTransformationDTO.setBaseArtifactId(baseArtifact.getId());
                    jsonTransformationDTO.setRepoName(
                            branchedArtifact.getGitArtifactMetadata().getRepoName());
                    jsonTransformationDTO.setArtifactType(artifactExchangeJson.getArtifactJsonType());
                    jsonTransformationDTO.setRefName(
                            branchedArtifact.getGitArtifactMetadata().getRefName());

                    return gitHandlingService
                            .prepareChangesToBeCommitted(jsonTransformationDTO, artifactExchangeJson)
                            .then(updateArtifactWithGitMetadataGivenPermission(branchedArtifact, branchedGitMetadata));
                })
                .flatMap(updatedBranchedArtifact -> {
                    GitArtifactMetadata gitArtifactMetadata = updatedBranchedArtifact.getGitArtifactMetadata();
                    ArtifactJsonTransformationDTO jsonTransformationDTO = new ArtifactJsonTransformationDTO();
                    jsonTransformationDTO.setRefType(RefType.branch);
                    jsonTransformationDTO.setWorkspaceId(updatedBranchedArtifact.getWorkspaceId());
                    jsonTransformationDTO.setBaseArtifactId(gitArtifactMetadata.getDefaultArtifactId());
                    jsonTransformationDTO.setRepoName(gitArtifactMetadata.getRepoName());
                    jsonTransformationDTO.setArtifactType(branchedArtifact.getArtifactType());
                    jsonTransformationDTO.setRefName(gitArtifactMetadata.getRefName());

                    return gitHandlingService
                            .commitArtifact(updatedBranchedArtifact, commitDTO, jsonTransformationDTO)
                            .onErrorResume(error -> {
                                return gitRedisUtils
                                        .releaseFileLock(artifactType, baseArtifact.getId(), TRUE)
                                        .then(gitAnalyticsUtils.addAnalyticsForGitOperation(
                                                AnalyticsEvents.GIT_COMMIT,
                                                updatedBranchedArtifact,
                                                error.getClass().getName(),
                                                error.getMessage(),
                                                gitArtifactMetadata.getIsRepoPrivate()))
                                        .then(Mono.error(new AppsmithException(
                                                AppsmithError.GIT_ACTION_FAILED, "commit", error.getMessage())));
                            });
                })
                .flatMap(tuple2 -> {
                    return Mono.zip(
                            Mono.just(tuple2.getT2()), gitArtifactHelper.publishArtifactPostCommit(tuple2.getT1()));
                })
                .flatMap(tuple -> {
                    String status = tuple.getT1();
                    Artifact artifactFromBranch = tuple.getT2();
                    Mono<Boolean> releaseFileLockMono = gitRedisUtils.releaseFileLock(
                            artifactType,
                            artifactFromBranch.getGitArtifactMetadata().getDefaultArtifactId(),
                            isFileLock);

                    Mono<? extends Artifact> updatedArtifactMono =
                            gitArtifactHelper.updateArtifactWithSchemaVersions(artifactFromBranch);

                    return Mono.zip(updatedArtifactMono, releaseFileLockMono)
                            .then(gitAnalyticsUtils.addAnalyticsForGitOperation(
                                    AnalyticsEvents.GIT_COMMIT,
                                    artifactFromBranch,
                                    "",
                                    "",
                                    artifactFromBranch.getGitArtifactMetadata().getIsRepoPrivate(),
                                    isSystemGenerated))
                            .thenReturn(status)
                            .name(OPS_COMMIT)
                            .tap(Micrometer.observation(observationRegistry));
                })
                .onErrorResume(error -> {
                    log.error(
                            "An error occurred while committing changes to artifact with base id: {} and branch: {}",
                            branchedGitMetadata.getDefaultArtifactId(),
                            branchedGitMetadata.getRefName());

                    return gitRedisUtils
                            .releaseFileLock(artifactType, branchedGitMetadata.getDefaultArtifactId(), TRUE)
                            .then(Mono.error(error));
                });

        return Mono.create(sink -> {
            commitMono.subscribe(sink::success, sink::error, null, sink.currentContext());
        });
    }

    /**
     * Method to remove all the git metadata for the artifact and connected resources. This will remove:
     * - local repo
     * - all the branched artifacts present in DB except for base artifact
     *
     * @param branchedArtifactId : id of any branched artifact for the given repo
     * @param artifactType : type of artifact
     * @param gitType: type of git service
     * @return : the base artifact after removal of git attributes and other branches.
     */
    @Override
    public Mono<? extends Artifact> detachRemote(
            String branchedArtifactId, ArtifactType artifactType, GitType gitType) {

        GitHandlingService gitHandlingService = gitHandlingServiceResolver.getGitHandlingService(gitType);
        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        AclPermission gitConnectPermission = gitArtifactHelper.getArtifactGitConnectPermission();

        Mono<? extends Artifact> branchedArtifactMono =
                gitArtifactHelper.getArtifactById(branchedArtifactId, gitConnectPermission);

        Mono<? extends Artifact> disconnectMono = branchedArtifactMono
                .flatMap(branchedArtifact -> {
                    GitArtifactMetadata branchedGitMetadata = branchedArtifact.getGitArtifactMetadata();

                    if (branchedArtifact.getGitArtifactMetadata() == null) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION,
                                "Please reconfigure the artifact to connect to git repo"));
                    }

                    String baseArtifactId = branchedGitMetadata.getDefaultArtifactId();
                    String repoName = branchedGitMetadata.getRepoName();
                    String workspaceId = branchedArtifact.getWorkspaceId();
                    String refName = branchedGitMetadata.getRefName();
                    RefType refType = RefType.branch;

                    ArtifactJsonTransformationDTO jsonTransformationDTO =
                            new ArtifactJsonTransformationDTO(workspaceId, baseArtifactId, repoName, artifactType);

                    jsonTransformationDTO.setRefName(refName);
                    jsonTransformationDTO.setRefType(refType);

                    // Remove the parent artifact branch name from the list
                    Mono<Boolean> removeRepoMono = gitHandlingService.removeRepository(jsonTransformationDTO);

                    AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

                    Mono<? extends Artifact> deleteAllBranchesExceptBase = gitArtifactHelper
                            .getAllArtifactByBaseId(baseArtifactId, artifactEditPermission)
                            .flatMap(artifact -> {
                                if (artifact.getGitArtifactMetadata() == null
                                        || RefType.tag.equals(artifact.getGitArtifactMetadata()
                                                .getRefType())) {
                                    return Mono.just(artifact);
                                }

                                // it's established that git artifact metadata is not null
                                if (!artifact.getId().equals(baseArtifactId)) {
                                    return gitArtifactHelper.deleteArtifactByResource(artifact);
                                }

                                // base Artifact condition fulfilled
                                artifact.setGitArtifactMetadata(null);
                                gitArtifactHelper.resetAttributeInBaseArtifact(artifact);

                                return gitArtifactHelper.saveArtifact(artifact).flatMap(baseArtifact -> {
                                    return gitArtifactHelper.disconnectEntitiesOfBaseArtifact(baseArtifact);
                                });
                            })
                            .filter(artifact -> {
                                return artifact.getId().equals(baseArtifactId);
                            })
                            .collectList()
                            .flatMap(filteredBaseArtifact -> {
                                if (!filteredBaseArtifact.isEmpty()) {
                                    return Mono.just(filteredBaseArtifact.get(0));
                                }

                                return Mono.error(new AppsmithException(
                                        AppsmithError.GIT_GENERIC_ERROR, GitCommandConstants.DELETE));
                            });

                    return Mono.zip(deleteAllBranchesExceptBase, removeRepoMono).map(Tuple2::getT1);
                })
                .flatMap(disconnectedBaseArtifact -> {
                    return gitAnalyticsUtils.addAnalyticsForGitOperation(
                            AnalyticsEvents.GIT_DISCONNECT, disconnectedBaseArtifact, false);
                })
                .name(GitSpan.OPS_DETACH_REMOTE)
                .tap(Micrometer.observation(observationRegistry));

        return Mono.create(sink -> disconnectMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    private boolean isBaseGitMetadataInvalid(GitArtifactMetadata gitArtifactMetadata, GitType gitType) {
        return gitArtifactMetadata == null
                || gitArtifactMetadata.getGitAuth() == null
                || gitHandlingServiceResolver
                        .getGitHandlingService(gitType)
                        .isGitAuthInvalid(gitArtifactMetadata.getGitAuth());
    }

    private Mono<GitStatusDTO> getStatusAfterComparingWithRemote(
            String baseArtifactId, ArtifactType artifactType, boolean isFileLock, GitType gitType) {
        return getStatus(baseArtifactId, artifactType, isFileLock, true, gitType);
    }

    @Override
    public Mono<GitStatusDTO> getStatus(
            String branchedArtifactId, ArtifactType artifactType, boolean compareRemote, GitType gitType) {
        return getStatus(branchedArtifactId, artifactType, true, compareRemote, gitType);
    }

    /**
     * Get the status of the artifact for given branched id
     *
     * @param branchedArtifactId branched id of the artifact
     * @param artifactType       Type of artifact in context
     * @param isFileLock         if the locking is required, since the status API is used in the other flows of git
     *                           Only for the direct hits from the client the locking will be added
     * @param gitType            Type of the service
     * @return Map of json file names which are added, modified, conflicting, removed and the working tree if this is clean
     */
    private Mono<GitStatusDTO> getStatus(
            String branchedArtifactId,
            ArtifactType artifactType,
            boolean isFileLock,
            boolean compareRemote,
            GitType gitType) {

        Mono<Tuple2<? extends Artifact, ? extends Artifact>> baseAndBranchedArtifacts =
                getBaseAndBranchedArtifacts(branchedArtifactId, artifactType);

        return baseAndBranchedArtifacts.flatMap(artifactTuple -> {
            Artifact baseArtifact = artifactTuple.getT1();
            Artifact branchedArtifact = artifactTuple.getT2();
            return getStatus(baseArtifact, branchedArtifact, isFileLock, compareRemote, gitType);
        });
    }

    protected Mono<GitStatusDTO> getStatus(
            Artifact baseArtifact,
            Artifact branchedArtifact,
            boolean isFileLock,
            boolean compareRemote,
            GitType gitType) {

        GitHandlingService gitHandlingService = gitHandlingServiceResolver.getGitHandlingService(gitType);
        GitArtifactMetadata baseGitMetadata = baseArtifact.getGitArtifactMetadata();

        GitArtifactMetadata branchedGitMetadata = branchedArtifact.getGitArtifactMetadata();
        branchedGitMetadata.setGitAuth(baseGitMetadata.getGitAuth());

        final String finalBranchName = branchedGitMetadata.getRefName();
        RefType refType = branchedGitMetadata.getRefType();

        if (!StringUtils.hasText(finalBranchName)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        }

        ArtifactType artifactType = baseArtifact.getArtifactType();
        final String baseArtifactId = baseGitMetadata.getDefaultArtifactId();
        String workspaceId = baseArtifact.getWorkspaceId();
        String repoName = baseGitMetadata.getRepoName();

        ArtifactJsonTransformationDTO jsonTransformationDTO =
                new ArtifactJsonTransformationDTO(workspaceId, baseArtifactId, repoName, artifactType);
        jsonTransformationDTO.setRefName(finalBranchName);
        jsonTransformationDTO.setRefType(refType);

        FetchRemoteDTO fetchRemoteDTO = new FetchRemoteDTO();
        fetchRemoteDTO.setRefNames(List.of(finalBranchName));
        fetchRemoteDTO.setRefType(refType);
        fetchRemoteDTO.setIsFetchAll(false);

        Mono<? extends ArtifactExchangeJson> exportedArtifactJsonMono = exportService
                .exportByArtifactId(branchedArtifact.getId(), VERSION_CONTROL, artifactType)
                .zipWhen(exportedArtifactJson -> gitRedisUtils.acquireGitLock(
                        artifactType, baseArtifactId, GitCommandConstants.STATUS, isFileLock))
                .map(Tuple2::getT1);

        // This block only enters when a redis lock is acquired
        Mono<GitStatusDTO> lockHandledStatusMono = Mono.usingWhen(
                exportedArtifactJsonMono,
                artifactExchangeJson -> {
                    Mono<Boolean> prepareForStatus =
                            gitHandlingService.prepareChangesToBeCommitted(jsonTransformationDTO, artifactExchangeJson);

                    Mono<String> fetchRemoteMono = Mono.just("ignored");

                    if (compareRemote) {
                        if (isBaseGitMetadataInvalid(baseGitMetadata, gitType)) {
                            return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION));
                        }

                        fetchRemoteMono = Mono.defer(() -> gitHandlingService
                                .fetchRemoteReferences(
                                        jsonTransformationDTO, fetchRemoteDTO, baseGitMetadata.getGitAuth())
                                .onErrorResume(error -> Mono.error(new AppsmithException(
                                        AppsmithError.GIT_ACTION_FAILED,
                                        GitCommandConstants.FETCH_REMOTE,
                                        error.getMessage()))));
                    }

                    return Mono.zip(prepareForStatus, fetchRemoteMono)
                            .then(Mono.defer(() -> gitHandlingService.getStatus(jsonTransformationDTO)))
                            .onErrorResume(throwable -> {
                                /*
                                 in case of any error, the global exception handler will release the lock
                                 hence we don't need to do that manually
                                */
                                log.error(
                                        "Error to get status for artifact: {}, branch: {}",
                                        baseArtifactId,
                                        finalBranchName,
                                        throwable);
                                if (throwable instanceof AppsmithException) {
                                    return Mono.error(throwable);
                                }

                                return Mono.error(new AppsmithException(
                                        AppsmithError.GIT_ACTION_FAILED,
                                        GitCommandConstants.STATUS,
                                        throwable.getMessage()));
                            });
                },
                artifactExchangeJson -> gitRedisUtils.releaseFileLock(artifactType, baseArtifactId, isFileLock));

        return Mono.zip(lockHandledStatusMono, sessionUserService.getCurrentUser())
                .elapsed()
                .flatMap(objects -> {
                    Long elapsedTime = objects.getT1();
                    GitStatusDTO gitStatusDTO = objects.getT2().getT1();
                    User currentUser = objects.getT2().getT2();
                    String flowName;
                    if (compareRemote) {
                        flowName = AnalyticsEvents.GIT_STATUS.getEventName();
                    } else {
                        flowName = AnalyticsEvents.GIT_STATUS_WITHOUT_FETCH.getEventName();
                    }

                    return gitAnalyticsUtils
                            .sendUnitExecutionTimeAnalyticsEvent(flowName, elapsedTime, currentUser, branchedArtifact)
                            .thenReturn(gitStatusDTO);
                })
                .name(OPS_STATUS)
                .tap(Micrometer.observation(observationRegistry));
    }

    /**
     * Method to pull artifact json files from remote repo, make a commit with the changes present in local DB and
     * make a system commit to remote repo
     *
     * @param branchedArtifactId artifact for which we want to pull remote changes and merge
     * @param artifactType
     * @return return the status of pull operation
     */
    @Override
    public Mono<GitPullDTO> pullArtifact(String branchedArtifactId, ArtifactType artifactType, GitType gitType) {
        /*
         * 1.Dehydrate the artifact from DB so that the file system has the latest artifact data
         * 2.Do git pull after the rehydration and merge the remote changes to the current branch
         *   On Merge conflict - throw exception and ask user to resolve these conflicts on remote
         *   TODO create new branch and push the changes to remote and ask the user to resolve it on github/gitlab UI
         * 3.Then rehydrate from the file system to DB so that the latest changes from remote are rendered to the artifact
         * 4.Get the latest artifact from the DB and send it back to client
         * */

        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<Tuple2<? extends Artifact, ? extends Artifact>> baseAndBranchedArtifactMono =
                getBaseAndBranchedArtifacts(branchedArtifactId, artifactType, artifactEditPermission);

        return baseAndBranchedArtifactMono.flatMap(artifactTuple -> {
            Artifact baseArtifact = artifactTuple.getT1();
            Artifact branchedArtifact = artifactTuple.getT2();

            return pullArtifact(baseArtifact, branchedArtifact, gitType);
        });
    }

    protected Mono<GitPullDTO> pullArtifact(Artifact baseArtifact, Artifact branchedArtifact, GitType gitType) {

        GitArtifactMetadata branchedGitMetadata = branchedArtifact.getGitArtifactMetadata();
        ArtifactType artifactType = baseArtifact.getArtifactType();
        String baseArtifactId = branchedGitMetadata.getDefaultArtifactId();

        Mono<GitPullDTO> lockHandledpullDTOMono = Mono.usingWhen(
                        gitRedisUtils.acquireGitLock(artifactType, baseArtifactId, GitCommandConstants.PULL, TRUE),
                        ignoreLock -> {
                            // TODO: verifying why remote needs to be fetched for status, when only modified is checked
                            Mono<GitStatusDTO> statusMono =
                                    getStatus(baseArtifact, branchedArtifact, false, false, gitType);

                            return statusMono.flatMap(gitStatusDTO -> {
                                // Check if the repo is clean
                                if (!CollectionUtils.isEmpty(gitStatusDTO.getModified())) {
                                    return Mono.error(
                                            new AppsmithException(
                                                    AppsmithError.GIT_ACTION_FAILED,
                                                    GitCommandConstants.PULL,
                                                    "There are uncommitted changes present in your local. Please commit them first and then try git pull"));
                                }
                                return pullAndRehydrateArtifact(baseArtifact, branchedArtifact, gitType)
                                        .onErrorResume(exception -> {
                                            if (exception instanceof AppsmithException) {
                                                return Mono.error(exception);
                                            }

                                            return Mono.error(new AppsmithException(
                                                    AppsmithError.GIT_ACTION_FAILED,
                                                    GitCommandConstants.PULL,
                                                    exception.getMessage()));
                                        });
                            });
                        },
                        ignoreLock -> gitRedisUtils.releaseFileLock(artifactType, baseArtifactId, TRUE))
                .name(GitSpan.OPS_PULL)
                .tap(Micrometer.observation(observationRegistry));

        return Mono.create(
                sink -> lockHandledpullDTOMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    /**
     * Method to pull the files from remote repo and rehydrate the artifact
     *
     * @param baseArtifact     : base artifact
     * @param branchedArtifact : a branch created from branches of base artifact
     * @return pull DTO with updated artifact
     */
    private Mono<GitPullDTO> pullAndRehydrateArtifact(
            Artifact baseArtifact, Artifact branchedArtifact, GitType gitType) {
        /*
        1. Checkout to the concerned branch
        2. Do git pull after
            On Merge conflict - throw exception and ask user to resolve these conflicts on remote
            TODO create new branch and push the changes to remote and ask the user to resolve it on github/gitlab UI
        3. Rehydrate the artifact from filesystem so that the latest changes from remote are rendered to the artifact
        */

        ArtifactType artifactType = baseArtifact.getArtifactType();
        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        GitHandlingService gitHandlingService = gitHandlingServiceResolver.getGitHandlingService(gitType);

        GitArtifactMetadata baseGitMetadata = baseArtifact.getGitArtifactMetadata();

        if (isBaseGitMetadataInvalid(baseGitMetadata, gitType)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
        }

        GitArtifactMetadata branchedGitMetadata = branchedArtifact.getGitArtifactMetadata();

        final String workspaceId = branchedArtifact.getWorkspaceId();
        final String baseArtifactId = branchedGitMetadata.getDefaultArtifactId();
        final String repoName = branchedGitMetadata.getRepoName();
        final String branchName = branchedGitMetadata.getRefName();

        ArtifactJsonTransformationDTO jsonTransformationDTO = new ArtifactJsonTransformationDTO(
                workspaceId, baseArtifactId, repoName, baseArtifact.getArtifactType());

        jsonTransformationDTO.setRefType(RefType.branch);
        jsonTransformationDTO.setRefName(branchName);

        return Mono.defer(() -> {
                    // Rehydrate the artifact from git system
                    Mono<MergeStatusDTO> mergeStatusDTOMono = gitHandlingService
                            .pullArtifact(jsonTransformationDTO, baseGitMetadata)
                            .cache();

                    Mono<ArtifactExchangeJson> artifactExchangeJsonMono = mergeStatusDTOMono.flatMap(status ->
                            gitHandlingService.reconstructArtifactJsonFromGitRepository(jsonTransformationDTO));

                    return Mono.zip(mergeStatusDTOMono, artifactExchangeJsonMono);
                })
                .flatMap(tuple -> {
                    MergeStatusDTO status = tuple.getT1();
                    ArtifactExchangeJson artifactExchangeJson = tuple.getT2();
                    // Get the latest artifact with all the changes
                    // Commit and push changes to sync with remote
                    return importService
                            .importArtifactInWorkspaceFromGit(
                                    workspaceId, branchedArtifact.getId(), artifactExchangeJson, branchName)
                            .flatMap(importedBranchedArtifact -> gitAnalyticsUtils.addAnalyticsForGitOperation(
                                    AnalyticsEvents.GIT_PULL,
                                    importedBranchedArtifact,
                                    importedBranchedArtifact
                                            .getGitArtifactMetadata()
                                            .getIsRepoPrivate()))
                            .flatMap(importedBranchedArtifact -> {
                                return gitArtifactHelper
                                        .publishArtifact(importedBranchedArtifact, false)
                                        .then(getGitUserForArtifactId(baseArtifactId))
                                        .flatMap(gitAuthor -> {
                                            CommitDTO commitDTO = new CommitDTO();
                                            commitDTO.setMessage(DEFAULT_COMMIT_MESSAGE
                                                    + GitDefaultCommitMessage.SYNC_WITH_REMOTE_AFTER_PULL.getReason());
                                            commitDTO.setAuthor(gitAuthor);

                                            GitPullDTO gitPullDTO = new GitPullDTO();
                                            gitPullDTO.setMergeStatus(status);
                                            gitPullDTO.setArtifact(importedBranchedArtifact);

                                            return Mono.defer(() -> commitArtifact(
                                                            commitDTO,
                                                            baseArtifact,
                                                            importedBranchedArtifact,
                                                            gitType,
                                                            false))
                                                    .thenReturn(gitPullDTO);
                                        });
                            });
                });
    }

    public Mono<String> fetchRemoteChanges(
            Artifact baseArtifact, Artifact refArtifact, boolean isFileLock, GitType gitType, RefType refType) {

        if (refArtifact == null
                || baseArtifact == null
                || isBaseGitMetadataInvalid(baseArtifact.getGitArtifactMetadata(), gitType)) {
            return Mono.error(new AppsmithException(AppsmithError.GIT_GENERIC_ERROR));
        }

        GitArtifactMetadata baseArtifactGitData = baseArtifact.getGitArtifactMetadata();
        GitArtifactMetadata refArtifactGitData = refArtifact.getGitArtifactMetadata();
        ArtifactType artifactType = baseArtifact.getArtifactType();

        String baseArtifactId = baseArtifactGitData.getDefaultArtifactId();

        // TODO add gitType in all error messages.
        if (refArtifactGitData == null || !hasText(refArtifactGitData.getRefName())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, BRANCH_NAME));
        }

        Mono<User> currUserMono = sessionUserService.getCurrentUser().cache(); // will be used to send analytics event
        Mono<Boolean> acquireGitLockMono = gitRedisUtils.acquireGitLock(
                artifactType, baseArtifactId, GitConstants.GitCommandConstants.FETCH_REMOTE, isFileLock);

        ArtifactJsonTransformationDTO jsonTransformationDTO = new ArtifactJsonTransformationDTO();
        jsonTransformationDTO.setWorkspaceId(baseArtifact.getWorkspaceId());
        jsonTransformationDTO.setBaseArtifactId(baseArtifactGitData.getDefaultArtifactId());
        jsonTransformationDTO.setRepoName(baseArtifactGitData.getRepoName());
        jsonTransformationDTO.setArtifactType(baseArtifact.getArtifactType());
        jsonTransformationDTO.setRefName(refArtifactGitData.getRefName());
        jsonTransformationDTO.setRefType(refType);

        GitHandlingService gitHandlingService = gitHandlingServiceResolver.getGitHandlingService(gitType);

        // current user mono has been zipped just to run in parallel.
        Mono<String> fetchRemoteMono = acquireGitLockMono
                .then(Mono.defer(() -> gitHandlingService.fetchRemoteReferences(
                        jsonTransformationDTO, baseArtifactGitData.getGitAuth(), FALSE)))
                .flatMap(fetchedRemoteStatusString -> {
                    return gitRedisUtils
                            .releaseFileLock(artifactType, baseArtifactId, isFileLock)
                            .thenReturn(fetchedRemoteStatusString);
                })
                .onErrorResume(throwable -> {
                    /*
                     in case of any error, the global exception handler will release the lock
                     hence we don't need to do that manually
                    */
                    log.error(
                            "Error to fetch from remote for artifact: {}, ref: {}, git type {}",
                            baseArtifactId,
                            refArtifactGitData.getRefName(),
                            gitType,
                            throwable);
                    return Mono.error(
                            new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "fetch", throwable.getMessage()));
                })
                .elapsed()
                .zipWith(currUserMono)
                .flatMap(objects -> {
                    Long elapsedTime = objects.getT1().getT1();
                    String fetchRemote = objects.getT1().getT2();
                    User currentUser = objects.getT2();
                    return gitAnalyticsUtils
                            .sendUnitExecutionTimeAnalyticsEvent(
                                    AnalyticsEvents.GIT_FETCH.getEventName(), elapsedTime, currentUser, refArtifact)
                            .thenReturn(fetchRemote);
                })
                .name(GitSpan.OPS_FETCH_REMOTE)
                .tap(Micrometer.observation(observationRegistry));

        return Mono.create(sink -> {
            fetchRemoteMono.subscribe(sink::success, sink::error, null, sink.currentContext());
        });
    }

    /**
     * This method is responsible to compare the current branch with the remote branch.
     * Comparing means finding two numbers - how many commits ahead and behind the local branch is.
     * It'll do the following things -
     * 1. Checkout (if required) to the branch to make sure we are comparing the right branch
     * 2. Run a git fetch command to fetch the latest changes from the remote
     *
     * @param refArtifactId id of the reference
     * @param artifactType
     * @param isFileLock    whether to add file lock or not
     * @return Mono of {@link BranchTrackingStatus}
     */
    @Override
    public Mono<String> fetchRemoteChanges(
            String refArtifactId, ArtifactType artifactType, boolean isFileLock, GitType gitType, RefType refType) {
        GitArtifactHelper<?> artifactGitHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        AclPermission artifactEditPermission = artifactGitHelper.getArtifactEditPermission();

        Mono<Tuple2<? extends Artifact, ? extends Artifact>> baseAndBranchedArtifactMono =
                getBaseAndBranchedArtifacts(refArtifactId, artifactType, artifactEditPermission);

        return baseAndBranchedArtifactMono.flatMap(artifactTuples -> {
            Artifact baseArtifact = artifactTuples.getT1();
            Artifact refArtifact = artifactTuples.getT2();

            return fetchRemoteChanges(baseArtifact, refArtifact, isFileLock, gitType, refType);
        });
    }

    /**
     * Returns baseArtifact and branchedArtifact
     * This operation is quite frequently used, hence providing the right set
     *
     * @param branchedArtifactId : id of the branchedArtifactId
     * @param artifactPermission : permission required for getting artifact.
     * @return : A tuple of Artifacts
     */
    protected Mono<Tuple2<? extends Artifact, ? extends Artifact>> getBaseAndBranchedArtifacts(
            String branchedArtifactId, ArtifactType artifactType, AclPermission artifactPermission) {
        if (!hasText(branchedArtifactId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        GitArtifactHelper<?> artifactGitHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        Mono<? extends Artifact> branchedArtifactMono = artifactGitHelper
                .getArtifactById(branchedArtifactId, artifactPermission)
                .cache();

        return branchedArtifactMono.flatMap(branchedArtifact -> {
            GitArtifactMetadata branchedMetadata = branchedArtifact.getGitArtifactMetadata();
            if (branchedMetadata == null || !hasText(branchedMetadata.getDefaultArtifactId())) {
                return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
            }

            String baseArtifactId = branchedMetadata.getDefaultArtifactId();
            Mono<? extends Artifact> baseArtifactMono = Mono.just(branchedArtifact);

            if (!baseArtifactId.equals(branchedArtifactId)) {
                baseArtifactMono = artifactGitHelper.getArtifactById(baseArtifactId, artifactPermission);
            }

            return baseArtifactMono.zipWith(branchedArtifactMono);
        });
    }

    protected Mono<Tuple2<? extends Artifact, ? extends Artifact>> getBaseAndBranchedArtifacts(
            String branchedArtifactId, ArtifactType artifactType) {
        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        AclPermission artifactPermission = gitArtifactHelper.getArtifactEditPermission();
        return getBaseAndBranchedArtifacts(branchedArtifactId, artifactType, artifactPermission);
    }

    private Mono<GitUser> getGitUserForArtifactId(String baseArtifactId) {
        Mono<UserData> currentUserMono = userDataService
                .getForCurrentUser()
                .filter(userData -> !CollectionUtils.isEmpty(userData.getGitProfiles()))
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_PROFILE_ERROR)));

        return currentUserMono.map(userData -> {
            GitProfile profile = userData.getGitProfileByKey(baseArtifactId);
            if (profile == null
                    || Boolean.TRUE.equals(profile.getUseGlobalProfile())
                    || !StringUtils.hasText(profile.getAuthorName())) {
                profile = userData.getGitProfileByKey(DEFAULT);
            }

            GitUser gitUser = new GitUser();
            gitUser.setName(profile.getAuthorName());
            gitUser.setEmail(profile.getAuthorEmail());
            return gitUser;
        });
    }

    private Mono<? extends Artifact> updateArtifactWithGitMetadataGivenPermission(
            Artifact branchedArtifact, GitArtifactMetadata branchedGitMetadata) {

        if (branchedGitMetadata == null) {
            return Mono.error(
                    new AppsmithException(AppsmithError.INVALID_PARAMETER, "Git metadata values cannot be null"));
        }

        branchedGitMetadata.setLastCommittedAt(Instant.now());
        branchedArtifact.setGitArtifactMetadata(branchedGitMetadata);
        // For base branchedArtifact we expect a GitAuth to be a part of branchedGitMetadata.
        // We are using save method to leverage @Encrypted annotation used for private SSH keys
        // saveArtifact method sets the transient fields so no need to set it again from this method
        return gitArtifactHelperResolver
                .getArtifactHelper(branchedArtifact.getArtifactType())
                .saveArtifact(branchedArtifact);
    }

    /**
     * Resets the artifact to last commit, all uncommitted changes are lost in the process.
     * @param branchedArtifactId : id of the branchedArtifact
     * @param artifactType type of the artifact
     * @param gitType what is the intended implementation type
     * @return : a publisher of an artifact.
     */
    @Override
    public Mono<? extends Artifact> discardChanges(
            String branchedArtifactId, ArtifactType artifactType, GitType gitType) {

        if (!hasText(branchedArtifactId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ARTIFACT_ID));
        }

        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        return gitArtifactHelper
                .getArtifactById(branchedArtifactId, artifactEditPermission)
                .flatMap(branchedArtifact -> discardChanges(branchedArtifact, gitType));
    }

    protected Mono<? extends Artifact> discardChanges(Artifact branchedArtifact, GitType gitType) {

        ArtifactType artifactType = branchedArtifact.getArtifactType();
        GitArtifactMetadata branchedGitData = branchedArtifact.getGitArtifactMetadata();

        if (branchedGitData == null || !hasText(branchedGitData.getDefaultArtifactId())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
        }

        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        GitHandlingService gitHandlingService = gitHandlingServiceResolver.getGitHandlingService(gitType);

        final String workspaceId = branchedArtifact.getWorkspaceId();
        final String baseArtifactId = branchedGitData.getDefaultArtifactId();
        final String repoName = branchedGitData.getRepoName();
        final String branchName = branchedGitData.getRefName();

        ArtifactJsonTransformationDTO jsonTransformationDTO = new ArtifactJsonTransformationDTO(
                workspaceId, baseArtifactId, repoName, branchedArtifact.getArtifactType());

        // Because this operation is only valid for branches
        jsonTransformationDTO.setRefType(RefType.branch);
        jsonTransformationDTO.setRefName(branchName);

        Mono<? extends Artifact> artifactFromLastCommitMono = Mono.usingWhen(
                        gitRedisUtils.acquireGitLock(artifactType, baseArtifactId, GitCommandConstants.DISCARD, TRUE),
                        ignoreLockAcquisition -> {
                            Mono<? extends ArtifactExchangeJson> artifactJsonFromLastCommitMono = gitHandlingService
                                    .recreateArtifactJsonFromLastCommit(jsonTransformationDTO)
                                    .onErrorResume(exception -> {
                                        log.error(
                                                "Git recreate Artifact Json Failed : {}",
                                                exception.getMessage(),
                                                exception);

                                        return Mono.error(
                                                new AppsmithException(
                                                        AppsmithError.GIT_ACTION_FAILED,
                                                        GitCommandConstants.DISCARD,
                                                        "Please create a new branch and resolve conflicts in the remote repository before proceeding."));
                                    });

                            return artifactJsonFromLastCommitMono
                                    .flatMap(artifactExchangeJson -> importService.importArtifactInWorkspaceFromGit(
                                            workspaceId, branchedArtifact.getId(), artifactExchangeJson, branchName))
                                    .flatMap(artifactFromLastCommit ->
                                            gitArtifactHelper.validateAndPublishArtifact(artifactFromLastCommit, true))
                                    .flatMap(publishedArtifact -> gitAnalyticsUtils.addAnalyticsForGitOperation(
                                            AnalyticsEvents.GIT_DISCARD_CHANGES, publishedArtifact, null))
                                    .onErrorResume(exception -> {
                                        log.error(
                                                "An error occurred while discarding branched artifact id {}. error {}",
                                                branchedArtifact.getId(),
                                                exception.getMessage());

                                        if (exception instanceof AppsmithException) {
                                            return Mono.error(exception);
                                        }

                                        return Mono.error(new AppsmithException(
                                                AppsmithError.GIT_ACTION_FAILED,
                                                GitCommandConstants.DISCARD,
                                                exception.getMessage()));
                                    });
                        },
                        ignoreLockAcquisition -> gitRedisUtils.releaseFileLock(artifactType, baseArtifactId, TRUE))
                .name(GitSpan.OPS_DISCARD_CHANGES)
                .tap(Micrometer.observation(observationRegistry));

        return Mono.create(
                sink -> artifactFromLastCommitMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    public Mono<List<GitRefDTO>> listBranchForArtifact(
            String branchedArtifactId, ArtifactType artifactType, Boolean pruneBranches, GitType gitType) {
        return getBranchList(branchedArtifactId, artifactType, pruneBranches, true, gitType);
    }

    protected Mono<List<GitRefDTO>> getBranchList(
            String branchedArtifactId,
            ArtifactType artifactType,
            Boolean pruneBranches,
            boolean syncDefaultBranchWithRemote,
            GitType gitType) {

        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<Tuple2<? extends Artifact, ? extends Artifact>> baseAndBranchedArtifactMono =
                getBaseAndBranchedArtifacts(branchedArtifactId, artifactType, artifactEditPermission);

        return baseAndBranchedArtifactMono.flatMap(artifactTuples -> {
            return getBranchList(
                    artifactTuples.getT1(),
                    artifactTuples.getT2(),
                    pruneBranches,
                    syncDefaultBranchWithRemote,
                    gitType);
        });
    }

    protected Mono<List<GitRefDTO>> getBranchList(
            Artifact baseArtifact,
            Artifact branchedArtifact,
            Boolean pruneBranches,
            boolean syncDefaultBranchWithRemote,
            GitType gitType) {

        GitArtifactMetadata baseGitData = baseArtifact.getGitArtifactMetadata();
        GitArtifactMetadata branchedGitData = branchedArtifact.getGitArtifactMetadata();

        if (isBaseGitMetadataInvalid(baseGitData, gitType) || branchedGitData == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
        }

        final String workspaceId = baseArtifact.getWorkspaceId();
        final String baseArtifactId = baseGitData.getDefaultArtifactId();
        final String repoName = baseGitData.getRepoName();
        final String currentBranch = branchedGitData.getRefName();

        if (!hasText(baseArtifactId) || !hasText(repoName) || !hasText(currentBranch)) {
            log.error(
                    "Git config is not present for artifact {} of type {}",
                    baseArtifact.getId(),
                    baseArtifact.getArtifactType());
            return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
        }

        ArtifactJsonTransformationDTO jsonTransformationDTO = new ArtifactJsonTransformationDTO(
                workspaceId, baseArtifactId, repoName, baseArtifact.getArtifactType());

        jsonTransformationDTO.setRefName(currentBranch);
        jsonTransformationDTO.setRefType(branchedGitData.getRefType());

        Mono<String> baseBranchMono;
        if (TRUE.equals(pruneBranches) && syncDefaultBranchWithRemote) {
            baseBranchMono = syncDefaultBranchNameFromRemote(baseGitData, jsonTransformationDTO, gitType);
        } else {
            baseBranchMono = Mono.just(GitUtils.getDefaultBranchName(baseGitData));
        }

        Mono<List<GitRefDTO>> branchMono = baseBranchMono
                .flatMap(baseBranchName -> {
                    return getBranchListWithDefaultBranchName(
                            baseArtifact, baseBranchName, currentBranch, pruneBranches, gitType);
                })
                .onErrorResume(throwable -> {
                    if (throwable instanceof RepositoryNotFoundException) {
                        return handleRepoNotFoundException(jsonTransformationDTO, gitType);
                    }
                    return Mono.error(throwable);
                });

        return Mono.create(sink -> branchMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    private Mono<String> syncDefaultBranchNameFromRemote(
            GitArtifactMetadata metadata, ArtifactJsonTransformationDTO jsonTransformationDTO, GitType gitType) {
        ArtifactType artifactType = jsonTransformationDTO.getArtifactType();
        GitHandlingService gitHandlingService = gitHandlingServiceResolver.getGitHandlingService(gitType);

        return gitRedisUtils
                .acquireGitLock(
                        jsonTransformationDTO.getArtifactType(),
                        metadata.getDefaultArtifactId(),
                        GitConstants.GitCommandConstants.SYNC_BRANCH,
                        TRUE)
                .then(gitHandlingService
                        .getDefaultBranchFromRepository(jsonTransformationDTO, metadata)
                        .flatMap(defaultBranchNameInRemote -> {
                            String defaultBranchInDb = GitUtils.getDefaultBranchName(metadata);
                            // If the default branch name in remote is empty or same as the one in DB, nothing to do

                            if (!hasText(defaultBranchNameInRemote)
                                    || defaultBranchNameInRemote.equals(defaultBranchInDb)) {
                                return Mono.just(defaultBranchInDb);
                            }

                            // default branch has been changed in remote
                            return updateDefaultBranchName(
                                            metadata.getDefaultArtifactId(),
                                            artifactType,
                                            defaultBranchNameInRemote,
                                            jsonTransformationDTO,
                                            gitType)
                                    .then()
                                    .thenReturn(defaultBranchNameInRemote);
                        })
                        .flatMap(branchName -> gitRedisUtils
                                .releaseFileLock(
                                        jsonTransformationDTO.getArtifactType(), metadata.getDefaultArtifactId(), TRUE)
                                .thenReturn(branchName)));
    }

    private Flux<? extends Artifact> updateDefaultBranchName(
            String baseArtifactId,
            ArtifactType artifactType,
            String newDefaultBranchName,
            ArtifactJsonTransformationDTO jsonTransformationDTO,
            GitType gitType) {
        // Get the artifact from DB by new defaultBranchName
        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<? extends Artifact> baseArtifactMono =
                gitArtifactHelper.getArtifactById(baseArtifactId, artifactEditPermission);

        GitRefDTO gitRefDTO = new GitRefDTO();
        gitRefDTO.setRefName(newDefaultBranchName);
        gitRefDTO.setRefType(RefType.branch);
        gitRefDTO.setDefault(true);

        // potentially problem in the flow,
        // we are checking out to the branch after creation,
        // and this is just a remote reference
        return baseArtifactMono
                .flatMap(baseArtifact -> {
                    // if the artifact with newDefaultBranch name is present locally then it could be checked out
                    // since this operation would happen inside a file lock, we don't require it.
                    return checkoutReference(baseArtifact, gitRefDTO, false, gitType)
                            .map(newDefaultBranchArtifact -> (Artifact) newDefaultBranchArtifact)
                            .onErrorResume(error -> {
                                if (error instanceof RefNotFoundException
                                        || (error instanceof AppsmithException appsmithException
                                                && appsmithException
                                                        .getAppErrorCode()
                                                        .equals(AppsmithError.NO_RESOURCE_FOUND.getAppErrorCode()))) {
                                    log.error(
                                            "Artifact with base id {} and  branch name {} not found locally",
                                            baseArtifactId,
                                            newDefaultBranchName);
                                    return checkoutRemoteReference(baseArtifact, gitRefDTO, gitType);
                                }

                                return Mono.error(error);
                            });
                })
                .thenMany(Flux.defer(
                        () -> gitArtifactHelper.getAllArtifactByBaseId(baseArtifactId, artifactEditPermission)))
                .flatMap(artifact -> {
                    artifact.getGitArtifactMetadata().setDefaultBranchName(newDefaultBranchName);
                    // clear the branch protection rules as the default branch name has been changed
                    artifact.getGitArtifactMetadata().setBranchProtectionRules(null);
                    return gitArtifactHelper.saveArtifact(artifact);
                });
    }

    private Mono<List<GitRefDTO>> handleRepoNotFoundException(
            ArtifactJsonTransformationDTO jsonTransformationDTO, GitType gitType) {
        // clone artifact to the local git system again and update the defaultBranch for the artifact
        // list branch and compare with branch artifacts and checkout if not exists

        GitHandlingService gitHandlingService = gitHandlingServiceResolver.getGitHandlingService(gitType);
        GitArtifactHelper<?> gitArtifactHelper =
                gitArtifactHelperResolver.getArtifactHelper(jsonTransformationDTO.getArtifactType());
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();
        AclPermission artifactReadPermission = gitArtifactHelper.getArtifactReadPermission();

        Mono<? extends Artifact> baseArtifactMono =
                gitArtifactHelper.getArtifactById(jsonTransformationDTO.getBaseArtifactId(), artifactEditPermission);

        return baseArtifactMono.flatMap(baseArtifact -> {
            GitArtifactMetadata baseGitMetadata = baseArtifact.getGitArtifactMetadata();
            GitAuth gitAuth = baseGitMetadata.getGitAuth();
            GitConnectDTO gitConnectDTO = new GitConnectDTO();
            gitConnectDTO.setRemoteUrl(baseGitMetadata.getRemoteUrl());

            return gitHandlingService
                    .fetchRemoteRepository(gitConnectDTO, gitAuth, baseArtifact, baseGitMetadata.getRepoName())
                    .flatMap(defaultBranch -> gitHandlingService.listReferences(jsonTransformationDTO, true))
                    .flatMap(refDTOs -> {
                        List<String> branchesToCheckout = new ArrayList<>();
                        List<GitRefDTO> gitRefDTOs = new ArrayList<>();

                        for (GitRefDTO gitRefDTO : refDTOs) {
                            if (!gitRefDTO.getRefName().startsWith(ORIGIN)) {
                                continue;
                            }

                            // remove `origin/` prefix from the remote branch name
                            String branchName = gitRefDTO.getRefName().replace(ORIGIN, REMOTE_NAME_REPLACEMENT);

                            // The baseArtifact is cloned already, hence no need to check out it again
                            if (!branchName.equals(baseGitMetadata.getBranchName())) {
                                branchesToCheckout.add(branchName);
                            }
                        }

                        ArtifactJsonTransformationDTO branchCheckoutDTO = new ArtifactJsonTransformationDTO();
                        branchCheckoutDTO.setWorkspaceId(baseArtifact.getWorkspaceId());
                        branchCheckoutDTO.setArtifactType(baseArtifact.getArtifactType());
                        branchCheckoutDTO.setRepoName(baseGitMetadata.getRepoName());
                        branchCheckoutDTO.setRefType(jsonTransformationDTO.getRefType());

                        return Flux.fromIterable(branchesToCheckout)
                                .flatMap(branchName -> gitArtifactHelper
                                        .getArtifactByBaseIdAndBranchName(
                                                baseGitMetadata.getDefaultArtifactId(),
                                                branchName,
                                                artifactReadPermission)
                                        // checkout the branch locally
                                        .flatMap(artifact -> {
                                            // Add the locally checked out branch to the branchList
                                            GitRefDTO gitRefDTO = new GitRefDTO();
                                            gitRefDTO.setRefName(branchName);

                                            // set the default branch flag if there's a match.
                                            // This can happen when user has changed the default branch other
                                            // than remote
                                            gitRefDTO.setDefault(baseGitMetadata
                                                    .getDefaultBranchName()
                                                    .equals(branchName));

                                            gitRefDTOs.add(gitRefDTO);
                                            branchCheckoutDTO.setRefName(branchName);
                                            return gitHandlingService.checkoutRemoteReference(branchCheckoutDTO);
                                        })
                                        // Return empty mono when the branched defaultArtifact is not in db
                                        .onErrorResume(throwable -> Mono.empty()))
                                .then(Mono.just(gitRefDTOs));
                    });
        });
    }

    private Mono<List<GitRefDTO>> getBranchListWithDefaultBranchName(
            Artifact baseArtifact,
            String defaultBranchName,
            String currentBranch,
            boolean pruneBranches,
            GitType gitType) {

        GitArtifactMetadata baseGitData = baseArtifact.getGitArtifactMetadata();

        String workspaceId = baseArtifact.getWorkspaceId();
        String baseArtifactId = baseGitData.getDefaultArtifactId();
        String repoName = baseGitData.getRepoName();
        RefType refType = RefType.branch; // baseGitData.getRefType();
        ArtifactType artifactType = baseArtifact.getArtifactType();

        return Mono.usingWhen(
                gitRedisUtils.acquireGitLock(
                        artifactType, baseArtifactId, GitConstants.GitCommandConstants.LIST_BRANCH, TRUE),
                ignoreLock -> {
                    GitHandlingService gitHandlingService = gitHandlingServiceResolver.getGitHandlingService(gitType);
                    ArtifactJsonTransformationDTO jsonTransformationDTO =
                            new ArtifactJsonTransformationDTO(workspaceId, baseArtifactId, repoName, artifactType);
                    jsonTransformationDTO.setRefName(currentBranch);
                    jsonTransformationDTO.setRefType(refType);

                    Mono<String> fetchRemoteMono = Mono.just("");

                    if (TRUE.equals(pruneBranches)) {
                        fetchRemoteMono = gitHandlingService.fetchRemoteReferences(
                                jsonTransformationDTO, baseGitData.getGitAuth(), TRUE);
                    }

                    Mono<List<GitRefDTO>> listBranchesMono =
                            Mono.defer(() -> gitHandlingService.listReferences(jsonTransformationDTO, true));

                    return fetchRemoteMono
                            .then(listBranchesMono)
                            .onErrorResume(Mono::error)
                            .map(refDTOs -> {
                                refDTOs.forEach(refDTO -> {
                                    refDTO.setRefType(refType);
                                    refDTO.setDefault(refDTO.getRefName().equalsIgnoreCase(defaultBranchName));
                                });

                                return refDTOs;
                            })
                            .flatMap(gitRefDTOs -> {
                                if (!TRUE.equals(pruneBranches)) {
                                    return Mono.just(gitRefDTOs);
                                }

                                return gitAnalyticsUtils
                                        .addAnalyticsForGitOperation(
                                                AnalyticsEvents.GIT_PRUNE, baseArtifact, baseGitData.getIsRepoPrivate())
                                        .thenReturn(gitRefDTOs);
                            });
                },
                ignoreLock -> gitRedisUtils.releaseFileLock(artifactType, baseArtifactId, TRUE));
    }

    @Override
    public Mono<List<String>> updateProtectedBranches(
            String baseArtifactId, ArtifactType artifactType, List<String> branchNames) {

        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        AclPermission artifactManageProtectedBranchPermission =
                gitArtifactHelper.getArtifactManageProtectedBranchPermission();

        Mono<? extends Artifact> baseArtifactMono =
                gitArtifactHelper.getArtifactById(baseArtifactId, artifactManageProtectedBranchPermission);

        return baseArtifactMono
                .flatMap(baseArtifact -> {
                    GitArtifactMetadata baseGitData = baseArtifact.getGitArtifactMetadata();
                    final String defaultBranchName = baseGitData.getDefaultBranchName();
                    final List<String> incomingProtectedBranches =
                            CollectionUtils.isEmpty(branchNames) ? new ArrayList<>() : branchNames;

                    // user cannot protect multiple branches
                    if (incomingProtectedBranches.size() > 1) {
                        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
                    }

                    // user cannot protect a branch which is not default
                    if (incomingProtectedBranches.size() == 1
                            && !defaultBranchName.equals(incomingProtectedBranches.get(0))) {
                        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
                    }

                    return updateProtectedBranchesInArtifactAfterVerification(baseArtifact, incomingProtectedBranches);
                })
                .as(transactionalOperator::transactional);
    }

    protected Mono<List<String>> updateProtectedBranchesInArtifactAfterVerification(
            Artifact baseArtifact, List<String> branchNames) {
        GitArtifactHelper<?> gitArtifactHelper =
                gitArtifactHelperResolver.getArtifactHelper(baseArtifact.getArtifactType());
        GitArtifactMetadata baseGitData = baseArtifact.getGitArtifactMetadata();

        // keep a copy of old protected branches as it's required to send analytics event later
        List<String> oldProtectedBranches = baseGitData.getBranchProtectionRules() == null
                ? new ArrayList<>()
                : baseGitData.getBranchProtectionRules();

        baseGitData.setBranchProtectionRules(branchNames);
        return gitArtifactHelper
                .saveArtifact(baseArtifact)
                .then(gitArtifactHelper.updateArtifactWithProtectedBranches(baseArtifact.getId(), branchNames))
                .then(gitAnalyticsUtils.sendBranchProtectionAnalytics(baseArtifact, oldProtectedBranches, branchNames))
                .thenReturn(branchNames);
    }

    @Override
    public Mono<List<String>> getProtectedBranches(String baseArtifactId, ArtifactType artifactType) {

        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<? extends Artifact> baseArtifactMono =
                gitArtifactHelper.getArtifactById(baseArtifactId, artifactEditPermission);

        return baseArtifactMono.map(defaultArtifact -> {
            GitArtifactMetadata gitArtifactMetadata = defaultArtifact.getGitArtifactMetadata();
            /*
             user may have multiple branches as protected, but we only return the default branch
             as protected branch if it's present in the list of protected branches
            */
            List<String> protectedBranches = gitArtifactMetadata.getBranchProtectionRules();
            String defaultBranchName = gitArtifactMetadata.getDefaultBranchName();

            if (CollectionUtils.isEmpty(protectedBranches) || !protectedBranches.contains(defaultBranchName)) {
                return List.of();
            }

            return List.of(defaultBranchName);
        });
    }

    @Override
    public Mono<Boolean> toggleAutoCommitEnabled(String baseArtifactId, ArtifactType artifactType) {

        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        AclPermission artifactAutoCommitPermission = gitArtifactHelper.getArtifactAutoCommitPermission();

        Mono<? extends Artifact> baseArtifactMono =
                gitArtifactHelper.getArtifactById(baseArtifactId, artifactAutoCommitPermission);
        // get base app

        return baseArtifactMono
                .map(baseArtifact -> {
                    GitArtifactMetadata baseGitMetadata = baseArtifact.getGitArtifactMetadata();
                    if (!baseArtifact.getId().equals(baseGitMetadata.getDefaultArtifactId())) {
                        log.error(
                                "failed to toggle auto commit. reason: {} is not the id of the base Artifact",
                                baseArtifactId);
                        throw new AppsmithException(AppsmithError.INVALID_PARAMETER, "default baseArtifact id");
                    }

                    AutoCommitConfig autoCommitConfig = baseGitMetadata.getAutoCommitConfig();
                    if (autoCommitConfig.getEnabled()) {
                        autoCommitConfig.setEnabled(FALSE);
                    } else {
                        autoCommitConfig.setEnabled(TRUE);
                    }
                    // need to call the setter because getter returns a default config if attribute is null
                    baseArtifact.getGitArtifactMetadata().setAutoCommitConfig(autoCommitConfig);
                    return baseArtifact;
                })
                .flatMap(baseArtifact -> gitArtifactHelper
                        .saveArtifact(baseArtifact)
                        .thenReturn(baseArtifact
                                .getGitArtifactMetadata()
                                .getAutoCommitConfig()
                                .getEnabled()));
    }

    @Override
    public Mono<AutoCommitResponseDTO> getAutoCommitProgress(
            String artifactId, ArtifactType artifactType, String branchName) {
        return gitAutoCommitHelper.getAutoCommitProgress(artifactId, branchName);
    }

    @Override
    public Mono<GitAuth> generateSSHKey(String keyType) {
        GitAuth gitAuth = GitDeployKeyGenerator.generateSSHKey(keyType);

        GitDeployKeys gitDeployKeys = new GitDeployKeys();
        gitDeployKeys.setGitAuth(gitAuth);

        return sessionUserService
                .getCurrentUser()
                .flatMap(user -> {
                    gitDeployKeys.setEmail(user.getEmail());
                    return gitDeployKeysRepository
                            .findByEmail(user.getEmail())
                            .switchIfEmpty(gitDeployKeysRepository.save(gitDeployKeys))
                            .flatMap(gitDeployKeys1 -> {
                                if (gitDeployKeys.equals(gitDeployKeys1)) {
                                    return Mono.just(gitDeployKeys1);
                                }
                                // Overwrite the existing keys
                                gitDeployKeys1.setGitAuth(gitDeployKeys.getGitAuth());
                                return gitDeployKeysRepository.save(gitDeployKeys1);
                            });
                })
                .thenReturn(gitAuth);
    }

    @Override
    public Mono<GitArtifactMetadata> getGitArtifactMetadata(String baseArtifactId, ArtifactType artifactType) {

        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<? extends Artifact> baseArtifactMono =
                gitArtifactHelper.getArtifactById(baseArtifactId, artifactEditPermission);

        return Mono.zip(baseArtifactMono, userDataService.getForCurrentUser()).map(tuple -> {
            Artifact baseArtifact = tuple.getT1();
            UserData userData = tuple.getT2();
            Map<String, GitProfile> gitProfiles = new HashMap<>();
            GitArtifactMetadata baseGitMetadata = baseArtifact.getGitArtifactMetadata();

            if (!CollectionUtils.isEmpty(userData.getGitProfiles())) {
                gitProfiles.put(DEFAULT, userData.getGitProfileByKey(DEFAULT));
                gitProfiles.put(baseArtifactId, userData.getGitProfileByKey(baseArtifactId));
            }
            if (baseGitMetadata == null) {
                GitArtifactMetadata res = new GitArtifactMetadata();
                res.setGitProfiles(gitProfiles);
                return res;
            }

            baseGitMetadata.setGitProfiles(gitProfiles);
            if (baseGitMetadata.getGitAuth() != null) {
                baseGitMetadata.setPublicKey(baseGitMetadata.getGitAuth().getPublicKey());
            }

            baseGitMetadata.setDocUrl(Assets.GIT_DEPLOY_KEY_DOC_URL);
            return baseGitMetadata;
        });
    }

    protected Mono<? extends Artifact> generateArtifactForRefCreation(
            Artifact branchedArtifact, String refName, RefType refType) {
        ArtifactType artifactType = branchedArtifact.getArtifactType();
        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        AclPermission editPermission = gitArtifactHelper.getArtifactEditPermission();

        return gitArtifactHelper
                .getArtifactById(branchedArtifact.getId(), editPermission)
                .flatMap(sourceArtifact ->
                        gitArtifactHelper.createNewArtifactForCheckout(sourceArtifact, refName, refType));
    }

    /**
     * In some scenarios:
     * connect: after loading the modal, keyTypes is not available, so a network call has to be made to ssh-keypair.
     * import: cannot make a ssh-keypair call because artifact Id doesn’t exist yet, so API fails.
     *
     * @return Git docs urls for all the scenarios, client will cache this data and use it
     */
    @Override
    public Mono<List<GitDocsDTO>> getGitDocUrls() {
        ErrorReferenceDocUrl[] docSet = ErrorReferenceDocUrl.values();
        List<GitDocsDTO> gitDocsDTOList = new ArrayList<>();
        for (ErrorReferenceDocUrl docUrl : docSet) {
            GitDocsDTO gitDocsDTO = new GitDocsDTO();
            gitDocsDTO.setDocKey(docUrl);
            gitDocsDTO.setDocUrl(docUrl.getDocUrl());
            gitDocsDTOList.add(gitDocsDTO);
        }
        return Mono.just(gitDocsDTOList);
    }

    @Override
    public Mono<MergeStatusDTO> mergeBranch(
            String branchedArtifactId, ArtifactType artifactType, GitMergeDTO gitMergeDTO, GitType gitType) {
        /*
         * 1.Dehydrate the artifact from Mongodb so that the file system has the latest artifact data for both the source and destination branch artifact
         * 2.Do git checkout destinationBranch ---> git merge sourceBranch after the rehydration
         *   On Merge conflict - create new branch and push the changes to remote and ask the user to resolve it on Github/Gitlab UI
         * 3.Then rehydrate from the file system to mongodb so that the latest changes from remote are rendered to the artifact
         * 4.Get the latest artifact mono from the mongodb and send it back to client
         * */

        final String sourceBranch = gitMergeDTO.getSourceBranch();
        final String destinationBranch = gitMergeDTO.getDestinationBranch();

        if (!hasText(sourceBranch) || !hasText(destinationBranch)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        } else if (sourceBranch.startsWith(ORIGIN)) {
            return Mono.error(
                    new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION_FOR_REMOTE_BRANCH, sourceBranch));
        } else if (destinationBranch.startsWith(ORIGIN)) {
            return Mono.error(
                    new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION_FOR_REMOTE_BRANCH, destinationBranch));
        }

        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<Tuple2<? extends Artifact, ? extends Artifact>> baseAndBranchedArtifactsMono =
                getBaseAndBranchedArtifacts(branchedArtifactId, artifactType).cache();

        Mono<? extends Artifact> destinationArtifactMono = baseAndBranchedArtifactsMono.flatMap(artifactTuples -> {
            Artifact baseArtifact = artifactTuples.getT1();
            if (destinationBranch.equals(baseArtifact.getGitArtifactMetadata().getRefName())) {
                return Mono.just(baseArtifact);
            }

            return gitArtifactHelper.getArtifactByBaseIdAndBranchName(
                    baseArtifact.getId(), destinationBranch, artifactEditPermission);
        });

        Mono<MergeStatusDTO> mergeMono = baseAndBranchedArtifactsMono
                .zipWith(destinationArtifactMono)
                .flatMap(artifactTuples -> {
                    Artifact baseArtifact = artifactTuples.getT1().getT1();
                    Artifact sourceArtifact = artifactTuples.getT1().getT2();
                    Artifact destinationArtifact = artifactTuples.getT2();

                    GitArtifactMetadata baseGitMetadata = baseArtifact.getGitArtifactMetadata();
                    if (isBaseGitMetadataInvalid(baseArtifact.getGitArtifactMetadata(), gitType)) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                    }

                    final String workspaceId = baseArtifact.getWorkspaceId();
                    final String baseArtifactId = baseGitMetadata.getDefaultArtifactId();
                    final String repoName = baseGitMetadata.getRepoName();

                    // 1. Hydrate from db to git system for both ref Artifacts
                    // Update function call
                    return Mono.usingWhen(
                            gitRedisUtils.acquireGitLock(
                                    artifactType, baseArtifactId, GitConstants.GitCommandConstants.MERGE_BRANCH, TRUE),
                            ignoreLock -> {
                                ArtifactJsonTransformationDTO jsonTransformationDTO =
                                        new ArtifactJsonTransformationDTO(workspaceId, baseArtifactId, repoName);
                                jsonTransformationDTO.setArtifactType(artifactType);

                                FetchRemoteDTO fetchRemoteDTO = new FetchRemoteDTO();
                                fetchRemoteDTO.setRefNames(List.of(sourceBranch, destinationBranch));

                                GitHandlingService gitHandlingService =
                                        gitHandlingServiceResolver.getGitHandlingService(gitType);

                                Mono<String> fetchingRemoteMono = gitHandlingService.fetchRemoteReferences(
                                        jsonTransformationDTO, fetchRemoteDTO, baseGitMetadata.getGitAuth());

                                Mono<Tuple2<GitStatusDTO, GitStatusDTO>> statusTupleMono = fetchingRemoteMono
                                        .flatMap(remoteSpecs -> {
                                            Mono<GitStatusDTO> sourceBranchStatusMono = Mono.defer(() -> getStatus(
                                                            baseArtifact, sourceArtifact, false, false, gitType)
                                                    .flatMap(srcBranchStatus -> {
                                                        if (srcBranchStatus.getIsClean()) {
                                                            return Mono.just(srcBranchStatus);
                                                        }

                                                        AppsmithException statusFailureException;

                                                        if (!Integer.valueOf(0)
                                                                .equals(srcBranchStatus.getBehindCount())) {
                                                            statusFailureException = new AppsmithException(
                                                                    AppsmithError.GIT_MERGE_FAILED_REMOTE_CHANGES,
                                                                    srcBranchStatus.getBehindCount(),
                                                                    sourceBranch);
                                                        } else {
                                                            statusFailureException = new AppsmithException(
                                                                    AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES,
                                                                    sourceBranch);
                                                        }

                                                        return Mono.error(statusFailureException);
                                                    }));

                                            Mono<GitStatusDTO> destinationBranchStatusMono = Mono.defer(() -> getStatus(
                                                            baseArtifact, destinationArtifact, false, false, gitType)
                                                    .flatMap(destinationBranchStatus -> {
                                                        if (destinationBranchStatus.getIsClean()) {
                                                            return Mono.just(destinationBranchStatus);
                                                        }

                                                        AppsmithException statusFailureException;

                                                        if (!Integer.valueOf(0)
                                                                .equals(destinationBranchStatus.getBehindCount())) {
                                                            statusFailureException = new AppsmithException(
                                                                    AppsmithError.GIT_MERGE_FAILED_REMOTE_CHANGES,
                                                                    destinationBranchStatus.getBehindCount(),
                                                                    destinationBranch);
                                                        } else {
                                                            statusFailureException = new AppsmithException(
                                                                    AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES,
                                                                    destinationBranch);
                                                        }

                                                        return Mono.error(statusFailureException);
                                                    }));

                                            return sourceBranchStatusMono.zipWhen(
                                                    sourceStatusDTO -> destinationBranchStatusMono);
                                        })
                                        .onErrorResume(error -> {
                                            log.error(
                                                    "Error in repo status check for artifact: {}, Details: {}",
                                                    branchedArtifactId,
                                                    error.getMessage());

                                            if (error instanceof AppsmithException) {
                                                Mono.error(error);
                                            }

                                            return Mono.error(new AppsmithException(
                                                    AppsmithError.GIT_ACTION_FAILED, "status", error));
                                        });

                                return statusTupleMono
                                        .flatMap(statusTuples -> {
                                            GitMergeDTO mergeDTO = new GitMergeDTO();
                                            mergeDTO.setSourceBranch(sourceBranch);
                                            mergeDTO.setDestinationBranch(destinationBranch);

                                            Mono<String> mergeBranchesMono =
                                                    gitHandlingService.mergeBranches(jsonTransformationDTO, mergeDTO);

                                            return mergeBranchesMono.onErrorResume(error -> gitAnalyticsUtils
                                                    .addAnalyticsForGitOperation(
                                                            AnalyticsEvents.GIT_MERGE,
                                                            baseArtifact,
                                                            error.getClass().getName(),
                                                            error.getMessage(),
                                                            baseGitMetadata.getIsRepoPrivate())
                                                    .flatMap(artifact -> {
                                                        if (error instanceof GitAPIException) {
                                                            return Mono.error(new AppsmithException(
                                                                    AppsmithError.GIT_MERGE_CONFLICTS,
                                                                    error.getMessage()));
                                                        }

                                                        return Mono.error(new AppsmithException(
                                                                AppsmithError.GIT_ACTION_FAILED,
                                                                "merge",
                                                                error.getMessage()));
                                                    }));
                                        })
                                        .zipWhen(mergeStatus -> {
                                            ArtifactJsonTransformationDTO constructJsonDTO =
                                                    new ArtifactJsonTransformationDTO(
                                                            workspaceId, baseArtifactId, repoName);
                                            constructJsonDTO.setArtifactType(artifactType);
                                            constructJsonDTO.setRefName(destinationBranch);
                                            return gitHandlingService.reconstructArtifactJsonFromGitRepository(
                                                    constructJsonDTO);
                                        })
                                        .flatMap(tuple2 -> {
                                            ArtifactExchangeJson artifactExchangeJson = tuple2.getT2();
                                            MergeStatusDTO mergeStatusDTO = new MergeStatusDTO();
                                            mergeStatusDTO.setStatus(tuple2.getT1());
                                            mergeStatusDTO.setMergeAble(TRUE);

                                            // 4. Get the latest artifact mono with all the changes
                                            return importService
                                                    .importArtifactInWorkspaceFromGit(
                                                            workspaceId,
                                                            destinationArtifact.getId(),
                                                            artifactExchangeJson,
                                                            destinationBranch.replaceFirst(
                                                                    ORIGIN, REMOTE_NAME_REPLACEMENT))
                                                    .flatMap(importedDestinationArtifact -> {
                                                        CommitDTO commitDTO = new CommitDTO();
                                                        commitDTO.setMessage(DEFAULT_COMMIT_MESSAGE
                                                                + GitDefaultCommitMessage.SYNC_REMOTE_AFTER_MERGE
                                                                        .getReason()
                                                                + sourceBranch);

                                                        return commitArtifact(
                                                                        commitDTO,
                                                                        importedDestinationArtifact.getId(),
                                                                        artifactType,
                                                                        gitType,
                                                                        false)
                                                                .then(gitAnalyticsUtils.addAnalyticsForGitOperation(
                                                                        AnalyticsEvents.GIT_MERGE,
                                                                        importedDestinationArtifact,
                                                                        importedDestinationArtifact
                                                                                .getGitArtifactMetadata()
                                                                                .getIsRepoPrivate()))
                                                                .thenReturn(mergeStatusDTO);
                                                    });
                                        });
                            },
                            ignoreLock -> gitRedisUtils.releaseFileLock(artifactType, baseArtifactId, TRUE));
                })
                .name(GitSpan.OPS_MERGE_BRANCH)
                .tap(Micrometer.observation(observationRegistry));

        return Mono.create(sink -> mergeMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    @Override
    public Mono<MergeStatusDTO> isBranchMergable(
            String branchedArtifactId, ArtifactType artifactType, GitMergeDTO gitMergeDTO, GitType gitType) {

        final String sourceBranch = gitMergeDTO.getSourceBranch();
        final String destinationBranch = gitMergeDTO.getDestinationBranch();

        if (!hasText(sourceBranch) || !hasText(destinationBranch)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        } else if (sourceBranch.startsWith(ORIGIN)) {
            return Mono.error(
                    new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION_FOR_REMOTE_BRANCH, sourceBranch));
        } else if (destinationBranch.startsWith(ORIGIN)) {
            return Mono.error(
                    new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION_FOR_REMOTE_BRANCH, destinationBranch));
        }

        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<Tuple2<? extends Artifact, ? extends Artifact>> baseAndBranchedArtifactsMono =
                getBaseAndBranchedArtifacts(branchedArtifactId, artifactType).cache();

        Mono<? extends Artifact> destinationArtifactMono = baseAndBranchedArtifactsMono.flatMap(artifactTuples -> {
            Artifact baseArtifact = artifactTuples.getT1();
            if (destinationBranch.equals(baseArtifact.getGitArtifactMetadata().getRefName())) {
                return Mono.just(baseArtifact);
            }

            return gitArtifactHelper.getArtifactByBaseIdAndBranchName(
                    baseArtifact.getId(), destinationBranch, artifactEditPermission);
        });

        Mono<MergeStatusDTO> mergeableStatusMono = baseAndBranchedArtifactsMono
                .zipWith(destinationArtifactMono)
                .flatMap(artifactTuples -> {
                    Artifact baseArtifact = artifactTuples.getT1().getT1();
                    Artifact sourceArtifact = artifactTuples.getT1().getT2();
                    Artifact destinationArtifact = artifactTuples.getT2();

                    GitArtifactMetadata baseGitMetadata = baseArtifact.getGitArtifactMetadata();
                    if (isBaseGitMetadataInvalid(baseArtifact.getGitArtifactMetadata(), gitType)) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                    }

                    final String workspaceId = baseArtifact.getWorkspaceId();
                    final String baseArtifactId = baseGitMetadata.getDefaultArtifactId();
                    final String repoName = baseGitMetadata.getRepoName();

                    // 1. Hydrate from db to git system for both ref Artifacts
                    // Update function call
                    return Mono.usingWhen(
                            gitRedisUtils.acquireGitLock(
                                    artifactType, baseArtifactId, GitConstants.GitCommandConstants.MERGE_BRANCH, TRUE),
                            ignoreLock -> {
                                ArtifactJsonTransformationDTO jsonTransformationDTO =
                                        new ArtifactJsonTransformationDTO(workspaceId, baseArtifactId, repoName);
                                jsonTransformationDTO.setArtifactType(artifactType);

                                FetchRemoteDTO fetchRemoteDTO = new FetchRemoteDTO();
                                fetchRemoteDTO.setRefNames(List.of(sourceBranch, destinationBranch));

                                GitHandlingService gitHandlingService =
                                        gitHandlingServiceResolver.getGitHandlingService(gitType);

                                Mono<String> fetchRemoteReferencesMono = gitHandlingService.fetchRemoteReferences(
                                        jsonTransformationDTO, fetchRemoteDTO, baseGitMetadata.getGitAuth());

                                Mono<Tuple2<GitStatusDTO, GitStatusDTO>> statusTupleMono = fetchRemoteReferencesMono
                                        .flatMap(remoteSpecs -> {
                                            Mono<GitStatusDTO> sourceBranchStatusMono = Mono.defer(() -> getStatus(
                                                            baseArtifact, sourceArtifact, false, false, gitType)
                                                    .flatMap(srcBranchStatus -> {
                                                        if (srcBranchStatus.getIsClean()) {
                                                            return Mono.just(srcBranchStatus);
                                                        }

                                                        AppsmithError uncleanStatusError;
                                                        AppsmithException uncleanStatusException;

                                                        if (!Integer.valueOf(0)
                                                                .equals(srcBranchStatus.getBehindCount())) {
                                                            uncleanStatusError =
                                                                    AppsmithError.GIT_MERGE_FAILED_REMOTE_CHANGES;
                                                            uncleanStatusException = new AppsmithException(
                                                                    uncleanStatusError,
                                                                    srcBranchStatus.getBehindCount(),
                                                                    sourceBranch);
                                                        } else {
                                                            uncleanStatusError =
                                                                    AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES;
                                                            uncleanStatusException = new AppsmithException(
                                                                    uncleanStatusError, sourceBranch);
                                                        }

                                                        return gitAnalyticsUtils
                                                                .addAnalyticsForGitOperation(
                                                                        AnalyticsEvents.GIT_MERGE_CHECK,
                                                                        baseArtifact,
                                                                        uncleanStatusError.name(),
                                                                        uncleanStatusException.getMessage(),
                                                                        baseGitMetadata.getIsRepoPrivate(),
                                                                        false,
                                                                        false)
                                                                .then(Mono.error(uncleanStatusException));
                                                    }));

                                            Mono<GitStatusDTO> destinationBranchStatusMono = Mono.defer(() -> getStatus(
                                                            baseArtifact, destinationArtifact, false, false, gitType)
                                                    .flatMap(destinationBranchStatus -> {
                                                        if (destinationBranchStatus.getIsClean()) {
                                                            return Mono.just(destinationBranchStatus);
                                                        }

                                                        AppsmithError uncleanStatusError;
                                                        AppsmithException uncleanStatusException;

                                                        if (!Integer.valueOf(0)
                                                                .equals(destinationBranchStatus.getBehindCount())) {
                                                            uncleanStatusError =
                                                                    AppsmithError.GIT_MERGE_FAILED_REMOTE_CHANGES;
                                                            uncleanStatusException = new AppsmithException(
                                                                    uncleanStatusError,
                                                                    destinationBranchStatus.getBehindCount(),
                                                                    destinationBranch);
                                                        } else {
                                                            uncleanStatusError =
                                                                    AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES;
                                                            uncleanStatusException = new AppsmithException(
                                                                    uncleanStatusError, destinationBranch);
                                                        }

                                                        return gitAnalyticsUtils
                                                                .addAnalyticsForGitOperation(
                                                                        AnalyticsEvents.GIT_MERGE_CHECK,
                                                                        baseArtifact,
                                                                        uncleanStatusError.name(),
                                                                        uncleanStatusException.getMessage(),
                                                                        baseGitMetadata.getIsRepoPrivate(),
                                                                        false,
                                                                        false)
                                                                .then(Mono.error(uncleanStatusException));
                                                    }));

                                            return sourceBranchStatusMono.zipWhen(
                                                    sourceStatusDTO -> destinationBranchStatusMono);
                                        })
                                        .onErrorResume(error -> {
                                            log.error(
                                                    "Error in merge status check for baseArtifact {} ",
                                                    baseArtifactId,
                                                    error);
                                            if (error instanceof AppsmithException) {
                                                Mono.error(error);
                                            }

                                            return Mono.error(new AppsmithException(
                                                    AppsmithError.GIT_ACTION_FAILED, "status", error));
                                        });

                                return statusTupleMono
                                        .flatMap(statusTuple -> {
                                            GitMergeDTO mergeDTO = new GitMergeDTO();
                                            mergeDTO.setSourceBranch(sourceBranch);
                                            mergeDTO.setDestinationBranch(destinationBranch);
                                            return gitHandlingService.isBranchMergable(jsonTransformationDTO, mergeDTO);
                                        })
                                        .onErrorResume(error -> {
                                            MergeStatusDTO mergeStatus = new MergeStatusDTO();
                                            mergeStatus.setMergeAble(false);
                                            mergeStatus.setStatus("Merge check failed!");
                                            mergeStatus.setMessage(error.getMessage());

                                            return gitAnalyticsUtils
                                                    .addAnalyticsForGitOperation(
                                                            AnalyticsEvents.GIT_MERGE_CHECK,
                                                            baseArtifact,
                                                            error.getClass().getName(),
                                                            error.getMessage(),
                                                            baseGitMetadata.getIsRepoPrivate(),
                                                            false,
                                                            false)
                                                    .thenReturn(mergeStatus);
                                        });
                            },
                            ignoreLock -> gitRedisUtils.releaseFileLock(artifactType, baseArtifactId, TRUE));
                });

        return Mono.create(
                sink -> mergeableStatusMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }
}
