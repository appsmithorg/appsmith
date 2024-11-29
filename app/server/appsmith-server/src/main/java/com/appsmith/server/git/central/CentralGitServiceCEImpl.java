package com.appsmith.server.git.central;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.git.dto.CommitDTO;
import com.appsmith.git.dto.GitUser;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.GitDefaultCommitMessage;
import com.appsmith.server.constants.ce.RefType;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ArtifactImportDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.git.dtos.ArtifactJsonTransformationDTO;
import com.appsmith.server.git.resolver.GitArtifactHelperResolver;
import com.appsmith.server.git.resolver.GitHandlingServiceResolver;
import com.appsmith.server.git.utils.GitAnalyticsUtils;
import com.appsmith.server.git.utils.GitProfileUtils;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.GitArtifactHelper;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.DatasourcePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.errors.InvalidRemoteException;
import org.eclipse.jgit.api.errors.TransportException;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeoutException;

import static com.appsmith.external.git.constants.ce.GitConstantsCE.DEFAULT_COMMIT_MESSAGE;
import static com.appsmith.external.git.constants.ce.GitConstantsCE.GIT_PROFILE_ERROR;
import static com.appsmith.server.constants.FieldName.DEFAULT;
import static com.appsmith.server.constants.SerialiseArtifactObjective.VERSION_CONTROL;
import static java.lang.Boolean.FALSE;

@Slf4j
@Service
@RequiredArgsConstructor
public class CentralGitServiceCEImpl implements CentralGitServiceCE {

    private final GitProfileUtils gitProfileUtils;
    private final GitAnalyticsUtils gitAnalyticsUtils;
    private final UserDataService userDataService;

    protected final GitArtifactHelperResolver gitArtifactHelperResolver;
    protected final GitHandlingServiceResolver gitHandlingServiceResolver;

    private final GitPrivateRepoHelper gitPrivateRepoHelper;

    private final DatasourceService datasourceService;
    private final DatasourcePermission datasourcePermission;

    private final WorkspaceService workspaceService;
    private final PluginService pluginService;

    private final ImportService importService;
    private final ExportService exportService;

    protected Mono<Boolean> isRepositoryLimitReachedForWorkspace(String workspaceId, Boolean isRepositoryPrivate) {
        if (!isRepositoryPrivate) {
            return Mono.just(FALSE);
        }

        return gitPrivateRepoHelper.isRepoLimitReached(workspaceId, true);
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
                                gitArtifactMetadata.setBranchName(defaultBranch);
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
                    jsonMorphDTO.setArtifactId(artifact.getId());
                    jsonMorphDTO.setArtifactType(artifactType);
                    jsonMorphDTO.setRepoName(gitArtifactMetadata.getRepoName());
                    jsonMorphDTO.setRefType(RefType.BRANCH);
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
                .zipWith(gitArtifactHelper.deleteArtifact(artifactJsonTransformationDTO.getArtifactId()))
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

    /**
     * Connect the artifact from Appsmith to a git repo
     * This is the prerequisite step needed to perform all the git operation for an artifact
     * We are implementing the deployKey approach and since the deploy-keys are repo level these keys are store under artifact.
     * Each artifact is equal to a repo in the git(and each branch creates a new artifact with default artifact as parent)
     *
     * @param baseArtifactId : artifactId of the artifact which is getting connected to git
     * @param gitConnectDTO artifactId - this is used to link the local git repo to an artifact
     *                      remoteUrl - used for connecting to remote repo etc
     * @param originHeader
     * @param artifactType
     * @param gitType
     * @return an artifact with git metadata
     */
    @Override
    public Mono<? extends Artifact> connectArtifactToGit(
            String baseArtifactId,
            GitConnectDTO gitConnectDTO,
            String originHeader,
            ArtifactType artifactType,
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

        Mono<UserData> currentUserMono = userDataService
                .getForCurrentUser()
                .filter(userData -> !CollectionUtils.isEmpty(userData.getGitProfiles()))
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_PROFILE_ERROR)));

        Mono<GitUser> gitUserMono = currentUserMono
                .map(userData -> {
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
                })
                .cache();

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

                                    AppsmithException appsmithException =
                                            new AppsmithException(AppsmithError.GIT_GENERIC_ERROR, error.getMessage());
                                    if (error instanceof TransportException) {
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
                                    }

                                    ArtifactJsonTransformationDTO jsonTransformationDTO =
                                            new ArtifactJsonTransformationDTO();
                                    jsonTransformationDTO.setWorkspaceId(artifact.getWorkspaceId());
                                    jsonTransformationDTO.setArtifactId(artifact.getId());
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
                    jsonTransformationDTO.setArtifactId(artifact.getId());
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
                                gitArtifactMetadata.setBranchName(defaultBranch);
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
                    jsonTransformationDTO.setArtifactId(artifact.getId());
                    jsonTransformationDTO.setArtifactType(artifactType);
                    jsonTransformationDTO.setRepoName(repoName);

                    final String README_FILE_NAME = "README.md";
                    Mono<Boolean> readMeIntialisationMono = gitHandlingService.initialiseReadMe(
                            jsonTransformationDTO, artifact, README_FILE_NAME, originHeader);

                    return Mono.zip(readMeIntialisationMono, gitUserMono)
                            .flatMap(tuple2 -> {
                                String commitMessage =
                                        DEFAULT_COMMIT_MESSAGE + GitDefaultCommitMessage.CONNECT_FLOW.getReason();
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

                                return this.commitArtifact(baseArtifactId, commitDTO, artifactType, gitType)
                                        .onErrorResume(error ->
                                                // If the push fails remove all the cloned files from local repo
                                                this.detachRemote(baseArtifactId, artifactType)
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
                                                                                AppsmithError
                                                                                        .INVALID_GIT_SSH_CONFIGURATION,
                                                                                error.getMessage())));
                                                            }
                                                            return Mono.error(new AppsmithException(
                                                                    AppsmithError.GIT_ACTION_FAILED,
                                                                    "push",
                                                                    error.getMessage()));
                                                        }));
                            })
                            .then(gitAnalyticsUtils.addAnalyticsForGitOperation(
                                    AnalyticsEvents.GIT_CONNECT,
                                    artifact,
                                    artifact.getGitArtifactMetadata().getIsRepoPrivate()));
                });

        return Mono.create(
                sink -> connectedArtifactMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    /**
     * TODO: commit artifact
     * @return
     */
    public Mono<? extends Artifact> commitArtifact(
            String baseArtifactId, CommitDTO commitDTO, ArtifactType artifactType, GitType gitType) {
        return null;
    }

    /**
     * TODO: implementation quite similar to the disconnectGitRepo
     * @param baseArtifactId
     * @param artifactType
     * @return
     */
    protected Mono<? extends Artifact> detachRemote(String baseArtifactId, ArtifactType artifactType) {
        return null;
    }

    private boolean isBaseGitMetadataInvalid(GitArtifactMetadata gitArtifactMetadata, GitType gitType) {
        return gitArtifactMetadata == null
                || gitArtifactMetadata.getGitAuth() == null
                || gitHandlingServiceResolver
                        .getGitHandlingService(gitType)
                        .isGitAuthInvalid(gitArtifactMetadata.getGitAuth());
    }
}
