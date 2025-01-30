package com.appsmith.server.git.fs;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.dtos.GitBranchDTO;
import com.appsmith.external.dtos.GitRefDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.external.git.constants.GitConstants;
import com.appsmith.external.git.constants.GitSpan;
import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.external.git.dtos.FetchRemoteDTO;
import com.appsmith.external.git.handler.FSGitHandler;
import com.appsmith.git.dto.CommitDTO;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitDeployKeys;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitMergeDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.git.GitRedisUtils;
import com.appsmith.server.git.autocommit.helpers.GitAutoCommitHelper;
import com.appsmith.server.git.central.GitHandlingServiceCE;
import com.appsmith.server.git.dtos.ArtifactJsonTransformationDTO;
import com.appsmith.server.git.resolver.GitArtifactHelperResolver;
import com.appsmith.server.git.utils.GitAnalyticsUtils;
import com.appsmith.server.git.utils.GitProfileUtils;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.helpers.GitUtils;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.GitDeployKeysRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.GitArtifactHelper;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.DatasourcePermission;
import io.micrometer.observation.ObservationRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.errors.CannotDeleteCurrentBranchException;
import org.eclipse.jgit.api.errors.EmptyCommitException;
import org.eclipse.jgit.api.errors.InvalidRemoteException;
import org.eclipse.jgit.api.errors.TransportException;
import org.eclipse.jgit.errors.RepositoryNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import org.springframework.util.StringUtils;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.io.IOException;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeoutException;

import static com.appsmith.external.git.constants.ce.GitConstantsCE.EMPTY_COMMIT_ERROR_MESSAGE;
import static com.appsmith.external.git.constants.ce.GitConstantsCE.GIT_CONFIG_ERROR;

@Slf4j
@Service
@RequiredArgsConstructor
public class GitFSServiceCEImpl implements GitHandlingServiceCE {

    private final GitDeployKeysRepository gitDeployKeysRepository;
    private final GitPrivateRepoHelper gitPrivateRepoHelper;
    private final CommonGitFileUtils commonGitFileUtils;
    private final GitRedisUtils gitRedisUtils;
    protected final SessionUserService sessionUserService;
    private final UserDataService userDataService;
    protected final UserService userService;
    private final EmailConfig emailConfig;
    private final TransactionalOperator transactionalOperator;

    protected final AnalyticsService analyticsService;
    private final ObservationRegistry observationRegistry;

    private final WorkspaceService workspaceService;
    private final DatasourceService datasourceService;
    private final DatasourcePermission datasourcePermission;
    private final PluginService pluginService;

    private final ExportService exportService;
    private final ImportService importService;

    private final FSGitHandler fsGitHandler;
    private final GitAutoCommitHelper gitAutoCommitHelper;

    private final GitProfileUtils gitProfileUtils;
    private final GitAnalyticsUtils gitAnalyticsUtils;

    protected final GitArtifactHelperResolver gitArtifactHelperResolver;

    private static final String ORIGIN = "origin/";
    private static final String REMOTE_NAME_REPLACEMENT = "";

    @Override
    public Set<String> validateGitConnectDTO(GitConnectDTO gitConnectDTO) {
        Set<String> errors = new HashSet<>();

        if (!StringUtils.hasText(gitConnectDTO.getRemoteUrl())) {
            errors.add("remoteUrl");
        }

        try {
            GitUtils.convertSshUrlToBrowserSupportedUrl(gitConnectDTO.getRemoteUrl());
        } catch (AppsmithException error) {
            errors.add("browserSupportedRemoteUrl");
        }

        return errors;
    }

    @Override
    public String getRepoName(GitConnectDTO gitConnectDTO) {
        return GitUtils.getRepoName(gitConnectDTO.getRemoteUrl());
    }

    @Override
    public Mono<Boolean> isRepoPrivate(GitConnectDTO gitConnectDTO) {
        return isRepoPrivate(gitConnectDTO.getRemoteUrl());
    }

    @Override
    public Mono<Boolean> isRepoPrivate(GitArtifactMetadata gitArtifactMetadata) {
        return isRepoPrivate(gitArtifactMetadata.getRemoteUrl());
    }

    private Mono<Boolean> isRepoPrivate(String remoteUrl) {
        return GitUtils.isRepoPrivate(GitUtils.convertSshUrlToBrowserSupportedUrl(remoteUrl));
    }

    @Override
    public Mono<GitAuth> getGitAuthForUser() {
        return sessionUserService
                .getCurrentUser()
                .flatMap(user -> gitDeployKeysRepository.findByEmail(user.getEmail()))
                .map(GitDeployKeys::getGitAuth)
                .switchIfEmpty(
                        Mono.error(
                                new AppsmithException(
                                        AppsmithError.INVALID_GIT_CONFIGURATION,
                                        "Unable to find git configuration for logged-in user. Please contact Appsmith team for support")));
    }

    @Override
    public Boolean isGitAuthInvalid(GitAuth gitAuth) {
        return !StringUtils.hasText(gitAuth.getPrivateKey()) || !StringUtils.hasText(gitAuth.getPublicKey());
    }

    @Override
    public Mono<String> fetchRemoteRepository(
            GitConnectDTO gitConnectDTO, GitAuth gitAuth, Artifact artifact, String repoName) {

        GitArtifactHelper<?> gitArtifactHelper =
                gitArtifactHelperResolver.getArtifactHelper(artifact.getArtifactType());
        Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(artifact.getWorkspaceId(), artifact.getId(), repoName);

        return fsGitHandler
                .cloneRemoteIntoArtifactRepo(
                        repoSuffix, gitConnectDTO.getRemoteUrl(), gitAuth.getPrivateKey(), gitAuth.getPublicKey())
                .onErrorResume(error -> {
                    log.error("Error while cloning the remote repo, {}", error.getMessage());
                    return gitAnalyticsUtils
                            .addAnalyticsForGitOperation(
                                    AnalyticsEvents.GIT_IMPORT,
                                    artifact,
                                    error.getClass().getName(),
                                    error.getMessage(),
                                    false)
                            .flatMap(user -> commonGitFileUtils
                                    .deleteLocalRepo(repoSuffix)
                                    .then(gitArtifactHelper.deleteArtifact(artifact.getId())))
                            .flatMap(artifact1 -> {
                                if (error instanceof TransportException) {
                                    return Mono.error(
                                            new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                                } else if (error instanceof InvalidRemoteException) {
                                    return Mono.error(
                                            new AppsmithException(AppsmithError.INVALID_PARAMETER, "remote url"));
                                } else if (error instanceof TimeoutException) {
                                    return Mono.error(new AppsmithException(AppsmithError.GIT_EXECUTION_TIMEOUT));
                                }
                                return Mono.error(new AppsmithException(
                                        AppsmithError.GIT_ACTION_FAILED, "clone", error.getMessage()));
                            });
                });
    }

    @Override
    public void setRepositoryDetailsInGitArtifactMetadata(
            GitConnectDTO gitConnectDTO, GitArtifactMetadata gitArtifactMetadata) {
        gitArtifactMetadata.setRemoteUrl(gitConnectDTO.getRemoteUrl());
        gitArtifactMetadata.setBrowserSupportedRemoteUrl(
                GitUtils.convertSshUrlToBrowserSupportedUrl(gitConnectDTO.getRemoteUrl()));
    }

    @Override
    public Mono<? extends ArtifactExchangeJson> reconstructArtifactJsonFromGitRepository(
            ArtifactJsonTransformationDTO artifactJsonTransformationDTO) {
        return commonGitFileUtils.constructArtifactExchangeJsonFromGitRepositoryWithAnalytics(
                artifactJsonTransformationDTO);
    }

    @Override
    public Mono<Boolean> removeRepository(ArtifactJsonTransformationDTO artifactJsonTransformationDTO) {
        GitArtifactHelper<?> gitArtifactHelper =
                gitArtifactHelperResolver.getArtifactHelper(artifactJsonTransformationDTO.getArtifactType());
        Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(
                artifactJsonTransformationDTO.getWorkspaceId(),
                artifactJsonTransformationDTO.getBaseArtifactId(),
                artifactJsonTransformationDTO.getRepoName());
        return commonGitFileUtils.deleteLocalRepo(repoSuffix);
    }

    /**
     * List all the local branches present in the file system
     * @param artifactJsonTransformationDTO
     * @return
     */
    @Override
    public Mono<List<String>> listBranches(ArtifactJsonTransformationDTO artifactJsonTransformationDTO) {
        return listBranches(artifactJsonTransformationDTO, Boolean.FALSE);
    }

    @Override
    public Mono<List<String>> listBranches(
            ArtifactJsonTransformationDTO jsonTransformationDTO, Boolean listRemoteBranches) {
        GitArtifactHelper<?> gitArtifactHelper =
                gitArtifactHelperResolver.getArtifactHelper(jsonTransformationDTO.getArtifactType());

        Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(
                jsonTransformationDTO.getWorkspaceId(),
                jsonTransformationDTO.getBaseArtifactId(),
                jsonTransformationDTO.getRepoName());

        return fsGitHandler
                .listBranches(repoSuffix)
                .flatMapMany(Flux::fromIterable)
                .filter(gitBranchDTO -> {
                    boolean branchToBeListed = !gitBranchDTO.getBranchName().startsWith("origin")
                            || Boolean.TRUE.equals(listRemoteBranches);

                    return StringUtils.hasText(gitBranchDTO.getBranchName()) && branchToBeListed;
                })
                .map(GitBranchDTO::getBranchName)
                .collectList();
    }

    @Override
    public Mono<List<String>> listReferences(
            ArtifactJsonTransformationDTO artifactJsonTransformationDTO, Boolean checkRemoteReferences) {
        if (RefType.branch.equals(artifactJsonTransformationDTO.getRefType())) {
            return listBranches(artifactJsonTransformationDTO, checkRemoteReferences);
        }

        // TODO: Add logic for other reference types (e.g., tags)
        return Mono.just(List.of());
    }

    @Override
    public Mono<String> getDefaultBranchFromRepository(
            ArtifactJsonTransformationDTO jsonTransformationDTO, GitArtifactMetadata baseGitData) {
        if (isGitAuthInvalid(baseGitData.getGitAuth())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
        }

        String publicKey = baseGitData.getGitAuth().getPublicKey();
        String privateKey = baseGitData.getGitAuth().getPrivateKey();

        GitArtifactHelper<?> gitArtifactHelper =
                gitArtifactHelperResolver.getArtifactHelper(jsonTransformationDTO.getArtifactType());

        Path repoSuffixPath = gitArtifactHelper.getRepoSuffixPath(
                jsonTransformationDTO.getWorkspaceId(),
                jsonTransformationDTO.getBaseArtifactId(),
                jsonTransformationDTO.getRepoName());

        return fsGitHandler.getRemoteDefaultBranch(repoSuffixPath, baseGitData.getRemoteUrl(), privateKey, publicKey);
    }

    @Override
    public Mono<Boolean> validateEmptyRepository(ArtifactJsonTransformationDTO artifactJsonTransformationDTO) {
        GitArtifactHelper<?> gitArtifactHelper =
                gitArtifactHelperResolver.getArtifactHelper(artifactJsonTransformationDTO.getArtifactType());
        Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(
                artifactJsonTransformationDTO.getWorkspaceId(),
                artifactJsonTransformationDTO.getBaseArtifactId(),
                artifactJsonTransformationDTO.getRepoName());

        try {
            return commonGitFileUtils.checkIfDirectoryIsEmpty(repoSuffix);
        } catch (IOException ioException) {
            log.error("Error while validating empty repository, {}", ioException.getMessage());
            return Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, ioException.getMessage()));
        }
    }

    @Override
    public Mono<Boolean> initialiseReadMe(
            ArtifactJsonTransformationDTO jsonTransformationDTO,
            Artifact artifact,
            String readmeFileName,
            String originHeader) {
        GitArtifactHelper<?> gitArtifactHelper =
                gitArtifactHelperResolver.getArtifactHelper(jsonTransformationDTO.getArtifactType());
        Path readmePath = gitArtifactHelper.getRepoSuffixPath(
                jsonTransformationDTO.getWorkspaceId(),
                jsonTransformationDTO.getBaseArtifactId(),
                jsonTransformationDTO.getRepoName(),
                readmeFileName);
        try {
            return gitArtifactHelper
                    .intialiseReadMe(artifact, readmePath, originHeader)
                    .map(path -> Boolean.TRUE);
        } catch (IOException ioException) {
            log.error("Error while creating readme file in the repository, {}", ioException.getMessage());
            return Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, ioException.getMessage()));
        }
    }

    @Override
    public Mono<String> createFirstCommit(ArtifactJsonTransformationDTO jsonTransformationDTO, CommitDTO commitDTO) {
        GitArtifactHelper<?> gitArtifactHelper =
                gitArtifactHelperResolver.getArtifactHelper(jsonTransformationDTO.getArtifactType());
        Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(
                jsonTransformationDTO.getWorkspaceId(),
                jsonTransformationDTO.getBaseArtifactId(),
                jsonTransformationDTO.getRepoName());

        return fsGitHandler
                .commitArtifact(
                        repoSuffix,
                        commitDTO.getMessage(),
                        commitDTO.getAuthor().getName(),
                        commitDTO.getAuthor().getEmail(),
                        true,
                        commitDTO.getIsAmendCommit())
                .onErrorResume(error -> Mono.error(
                        new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "commit", error.getMessage())));
    }

    @Override
    public Mono<Boolean> prepareChangesToBeCommitted(
            ArtifactJsonTransformationDTO jsonTransformationDTO, ArtifactExchangeJson artifactExchangeJson) {
        String workspaceId = jsonTransformationDTO.getWorkspaceId();
        String baseArtifactId = jsonTransformationDTO.getBaseArtifactId();
        String repoName = jsonTransformationDTO.getRepoName();
        String branchName = jsonTransformationDTO.getRefName();

        ArtifactType artifactType = jsonTransformationDTO.getArtifactType();
        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(workspaceId, baseArtifactId, repoName);

        return commonGitFileUtils
                .saveArtifactToLocalRepoNew(repoSuffix, artifactExchangeJson, branchName)
                .map(ignore -> Boolean.TRUE)
                .onErrorResume(e -> {
                    log.error("Error in commit flow: ", e);
                    if (e instanceof RepositoryNotFoundException) {
                        return Mono.error(new AppsmithException(AppsmithError.REPOSITORY_NOT_FOUND, baseArtifactId));
                    } else if (e instanceof AppsmithException) {
                        return Mono.error(e);
                    }

                    return Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, e.getMessage()));
                });
    }

    @Override
    public Mono<Tuple2<? extends Artifact, String>> commitArtifact(
            Artifact branchedArtifact, CommitDTO commitDTO, ArtifactJsonTransformationDTO jsonTransformationDTO) {
        String workspaceId = jsonTransformationDTO.getWorkspaceId();
        String baseArtifactId = jsonTransformationDTO.getBaseArtifactId();
        String repoName = jsonTransformationDTO.getRepoName();

        ArtifactType artifactType = jsonTransformationDTO.getArtifactType();
        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(workspaceId, baseArtifactId, repoName);

        StringBuilder result = new StringBuilder();
        result.append("Commit Result : ");

        Mono<String> gitCommitMono = fsGitHandler
                .commitArtifact(
                        repoSuffix,
                        commitDTO.getMessage(),
                        commitDTO.getAuthor().getName(),
                        commitDTO.getAuthor().getEmail(),
                        true,
                        false)
                .onErrorResume(error -> {
                    if (error instanceof EmptyCommitException) {
                        return Mono.just(EMPTY_COMMIT_ERROR_MESSAGE);
                    }

                    return Mono.error(error);
                });

        return Mono.zip(gitCommitMono, gitArtifactHelper.getArtifactById(branchedArtifact.getId(), null))
                .flatMap(tuple -> {
                    String commitStatus = tuple.getT1();
                    result.append(commitStatus);

                    result.append(".\nPush Result : ");
                    return Mono.zip(
                            Mono.just(tuple.getT2()),
                            pushArtifact(tuple.getT2(), false)
                                    .map(pushResult -> result.append(pushResult).toString()));
                });
    }

    /**
     * Push flow for dehydrated apps
     *
     * @param branchedArtifact application which needs to be pushed to remote repo
     * @return Success message
     */
    protected Mono<String> pushArtifact(Artifact branchedArtifact, boolean isFileLock) {
        ArtifactType artifactType = branchedArtifact.getArtifactType();
        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        Mono<GitArtifactMetadata> gitArtifactMetadataMono = Mono.just(branchedArtifact.getGitArtifactMetadata());

        if (!branchedArtifact
                .getId()
                .equals(branchedArtifact.getGitArtifactMetadata().getDefaultArtifactId())) {
            gitArtifactMetadataMono = gitArtifactHelper
                    .getArtifactById(branchedArtifact.getGitArtifactMetadata().getDefaultArtifactId(), null)
                    .map(baseArtifact -> {
                        branchedArtifact
                                .getGitArtifactMetadata()
                                .setGitAuth(
                                        baseArtifact.getGitArtifactMetadata().getGitAuth());
                        return branchedArtifact.getGitArtifactMetadata();
                    });
        }

        // Make sure that ssh Key is unEncrypted for the use.
        Mono<String> gitPushResult = gitArtifactMetadataMono
                .flatMap(gitMetadata -> {
                    return gitRedisUtils
                            .acquireGitLock(
                                    artifactType,
                                    gitMetadata.getDefaultArtifactId(),
                                    GitConstants.GitCommandConstants.PUSH,
                                    isFileLock)
                            .thenReturn(branchedArtifact);
                })
                .flatMap(artifact -> {
                    GitArtifactMetadata gitData = artifact.getGitArtifactMetadata();

                    if (gitData == null
                            || !StringUtils.hasText(gitData.getRefName())
                            || !StringUtils.hasText(gitData.getDefaultArtifactId())
                            || !StringUtils.hasText(gitData.getGitAuth().getPrivateKey())) {

                        return Mono.error(
                                new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
                    }

                    Path baseRepoSuffix = gitArtifactHelper.getRepoSuffixPath(
                            artifact.getWorkspaceId(), gitData.getDefaultArtifactId(), gitData.getRepoName());
                    GitAuth gitAuth = gitData.getGitAuth();

                    return fsGitHandler
                            .checkoutToBranch(
                                    baseRepoSuffix,
                                    artifact.getGitArtifactMetadata().getRefName())
                            .then(Mono.defer(() -> fsGitHandler
                                    .pushApplication(
                                            baseRepoSuffix,
                                            gitData.getRemoteUrl(),
                                            gitAuth.getPublicKey(),
                                            gitAuth.getPrivateKey(),
                                            gitData.getRefName())
                                    .zipWith(Mono.just(artifact))))
                            .onErrorResume(error -> gitAnalyticsUtils
                                    .addAnalyticsForGitOperation(
                                            AnalyticsEvents.GIT_PUSH,
                                            artifact,
                                            error.getClass().getName(),
                                            error.getMessage(),
                                            artifact.getGitArtifactMetadata().getIsRepoPrivate())
                                    .flatMap(application1 -> {
                                        if (error instanceof TransportException) {
                                            return Mono.error(
                                                    new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                                        }
                                        return Mono.error(new AppsmithException(
                                                AppsmithError.GIT_ACTION_FAILED, "push", error.getMessage()));
                                    }));
                })
                .flatMap(tuple -> {
                    String pushResult = tuple.getT1();
                    Artifact artifact = tuple.getT2();
                    return pushArtifactErrorRecovery(pushResult, artifact).zipWith(Mono.just(artifact));
                })
                // Add BE analytics
                .flatMap(tuple2 -> {
                    String pushStatus = tuple2.getT1();
                    Artifact artifact = tuple2.getT2();
                    Mono<Boolean> fileLockReleasedMono = Mono.just(Boolean.TRUE).flatMap(flag -> {
                        if (!Boolean.TRUE.equals(isFileLock)) {
                            return Mono.just(flag);
                        }
                        return Mono.defer(() -> gitRedisUtils.releaseFileLock(
                                artifactType, artifact.getGitArtifactMetadata().getDefaultArtifactId(), true));
                    });

                    return pushArtifactErrorRecovery(pushStatus, artifact)
                            .then(fileLockReleasedMono)
                            .then(gitAnalyticsUtils.addAnalyticsForGitOperation(
                                    AnalyticsEvents.GIT_PUSH,
                                    artifact,
                                    artifact.getGitArtifactMetadata().getIsRepoPrivate()))
                            .thenReturn(pushStatus);
                })
                .name(GitSpan.OPS_PUSH)
                .tap(Micrometer.observation(observationRegistry));

        return Mono.create(sink -> gitPushResult.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    /**
     * This method is used to recover from the errors that can occur during the push operation
     * Mostly happens when the remote branch is protected or any specific rules in place on the branch.
     * Since the users will be in a bad state where the changes are committed locally, but they are
     * not able to push them changes or revert the changes either.
     * 1. Push rejected due to branch protection rules on remote, reset hard prev commit
     *
     * @param pushResult  status of git push operation
     * @param artifact artifact data to be used for analytics
     * @return status of the git push flow
     */
    private Mono<String> pushArtifactErrorRecovery(String pushResult, Artifact artifact) {
        GitArtifactMetadata gitMetadata = artifact.getGitArtifactMetadata();
        GitArtifactHelper<?> gitArtifactHelper =
                gitArtifactHelperResolver.getArtifactHelper(artifact.getArtifactType());

        if (pushResult.contains("REJECTED_NONFASTFORWARD")) {
            return gitAnalyticsUtils
                    .addAnalyticsForGitOperation(
                            AnalyticsEvents.GIT_PUSH,
                            artifact,
                            AppsmithError.GIT_UPSTREAM_CHANGES.getErrorType(),
                            AppsmithError.GIT_UPSTREAM_CHANGES.getMessage(),
                            gitMetadata.getIsRepoPrivate())
                    .flatMap(application1 -> Mono.error(new AppsmithException(AppsmithError.GIT_UPSTREAM_CHANGES)));
        } else if (pushResult.contains("REJECTED_OTHERREASON") || pushResult.contains("pre-receive hook declined")) {

            Path path = gitArtifactHelper.getRepoSuffixPath(
                    artifact.getWorkspaceId(), gitMetadata.getDefaultArtifactId(), gitMetadata.getRepoName());

            return fsGitHandler
                    .resetHard(path, gitMetadata.getRefName())
                    .then(Mono.error(new AppsmithException(
                            AppsmithError.GIT_ACTION_FAILED,
                            "push",
                            "Unable to push changes as pre-receive hook declined. Please make sure that you don't have any rules enabled on the branch "
                                    + gitMetadata.getRefName())));
        }
        return Mono.just(pushResult);
    }

    /**
     * File system implementation of fetching remote changes. equivalent to git fetch <ref-name>
     * @param jsonTransformationDTO : DTO to create path and other ref related details
     * @param gitAuth : authentication holder
     * @return : returns string for remote fetch
     */
    @Override
    public Mono<String> fetchRemoteReferences(
            ArtifactJsonTransformationDTO jsonTransformationDTO, GitAuth gitAuth, Boolean isFetchAll) {

        String workspaceId = jsonTransformationDTO.getWorkspaceId();
        String baseArtifactId = jsonTransformationDTO.getBaseArtifactId();
        String repoName = jsonTransformationDTO.getRepoName();
        String refName = jsonTransformationDTO.getRefName();

        ArtifactType artifactType = jsonTransformationDTO.getArtifactType();
        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(workspaceId, baseArtifactId, repoName);

        Mono<String> fetchRemoteMono = fsGitHandler.fetchRemote(
                repoSuffix, gitAuth.getPublicKey(), gitAuth.getPrivateKey(), false, refName, isFetchAll);

        // TODO : check if we require to checkout the reference
        Mono<Boolean> checkoutBranchMono = fsGitHandler.checkoutToBranch(repoSuffix, refName);

        return fetchRemoteMono.flatMap(remoteFetched -> checkoutBranchMono.thenReturn(remoteFetched));
    }

    @Override
    public Mono<String> fetchRemoteReferences(
            ArtifactJsonTransformationDTO jsonTransformationDTO, FetchRemoteDTO fetchRemoteDTO, GitAuth gitAuth) {
        String workspaceId = jsonTransformationDTO.getWorkspaceId();
        String baseArtifactId = jsonTransformationDTO.getBaseArtifactId();
        String repoName = jsonTransformationDTO.getRepoName();

        ArtifactType artifactType = jsonTransformationDTO.getArtifactType();
        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(workspaceId, baseArtifactId, repoName);

        String publicKey = gitAuth.getPublicKey();
        String privateKey = gitAuth.getPrivateKey();

        if (CollectionUtils.isNullOrEmpty(fetchRemoteDTO.getRefNames())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION));
        }

        return fsGitHandler.fetchRemote(repoSuffix, false, fetchRemoteDTO, publicKey, privateKey);
    }

    @Override
    public Mono<String> mergeBranches(ArtifactJsonTransformationDTO jsonTransformationDTO, GitMergeDTO gitMergeDTO) {
        String workspaceId = jsonTransformationDTO.getWorkspaceId();
        String baseArtifactId = jsonTransformationDTO.getBaseArtifactId();
        String repoName = jsonTransformationDTO.getRepoName();

        ArtifactType artifactType = jsonTransformationDTO.getArtifactType();
        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(workspaceId, baseArtifactId, repoName);

        // At this point the assumption is that the repository has already checked out the destination branch
        return fsGitHandler.mergeBranch(repoSuffix, gitMergeDTO.getSourceBranch(), gitMergeDTO.getDestinationBranch());
    }

    @Override
    public Mono<MergeStatusDTO> isBranchMergable(
            ArtifactJsonTransformationDTO jsonTransformationDTO, GitMergeDTO gitMergeDTO) {
        String workspaceId = jsonTransformationDTO.getWorkspaceId();
        String baseArtifactId = jsonTransformationDTO.getBaseArtifactId();
        String repoName = jsonTransformationDTO.getRepoName();

        ArtifactType artifactType = jsonTransformationDTO.getArtifactType();
        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(workspaceId, baseArtifactId, repoName);

        // At this point the assumption is that the repository has already checked out the destination branch
        return fsGitHandler.isMergeBranch(
                repoSuffix, gitMergeDTO.getSourceBranch(), gitMergeDTO.getDestinationBranch());
    }

    @Override
    public Mono<? extends ArtifactExchangeJson> recreateArtifactJsonFromLastCommit(
            ArtifactJsonTransformationDTO jsonTransformationDTO) {

        String workspaceId = jsonTransformationDTO.getWorkspaceId();
        String baseArtifactId = jsonTransformationDTO.getBaseArtifactId();
        String repoName = jsonTransformationDTO.getRepoName();
        String refName = jsonTransformationDTO.getRefName();

        ArtifactType artifactType = jsonTransformationDTO.getArtifactType();
        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(workspaceId, baseArtifactId, repoName);

        return fsGitHandler.rebaseBranch(repoSuffix, refName).flatMap(rebaseStatus -> {
            return commonGitFileUtils.constructArtifactExchangeJsonFromGitRepository(jsonTransformationDTO);
        });
    }

    @Override
    public Mono<GitStatusDTO> getStatus(ArtifactJsonTransformationDTO jsonTransformationDTO) {
        String workspaceId = jsonTransformationDTO.getWorkspaceId();
        String baseArtifactId = jsonTransformationDTO.getBaseArtifactId();
        String repoName = jsonTransformationDTO.getRepoName();
        String refName = jsonTransformationDTO.getRefName();

        ArtifactType artifactType = jsonTransformationDTO.getArtifactType();
        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);
        Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(workspaceId, baseArtifactId, repoName);

        Path repoPath = fsGitHandler.createRepoPath(repoSuffix);
        return fsGitHandler.getStatus(repoPath, refName);
    }

    @Override
    public Mono<String> createGitReference(
            ArtifactJsonTransformationDTO jsonTransformationDTO, GitArtifactMetadata baseGitData, GitRefDTO gitRefDTO) {
        GitArtifactHelper<?> gitArtifactHelper =
                gitArtifactHelperResolver.getArtifactHelper(jsonTransformationDTO.getArtifactType());

        String remoteUrl = baseGitData.getRemoteUrl();
        String publicKey = baseGitData.getGitAuth().getPublicKey();
        String privateKey = baseGitData.getGitAuth().getPrivateKey();

        Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(
                jsonTransformationDTO.getWorkspaceId(),
                jsonTransformationDTO.getBaseArtifactId(),
                jsonTransformationDTO.getRepoName());

        // TODO: add the checkout to the current branch as well.
        return fsGitHandler
                .createAndCheckoutReference(repoSuffix, gitRefDTO)
                .then(fsGitHandler.pushApplication(
                        repoSuffix, remoteUrl, publicKey, privateKey, gitRefDTO.getRefName()));
    }

    @Override
    public Mono<String> checkoutRemoteReference(ArtifactJsonTransformationDTO jsonTransformationDTO) {
        GitArtifactHelper<?> gitArtifactHelper =
                gitArtifactHelperResolver.getArtifactHelper(jsonTransformationDTO.getArtifactType());

        Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(
                jsonTransformationDTO.getWorkspaceId(),
                jsonTransformationDTO.getBaseArtifactId(),
                jsonTransformationDTO.getRepoName());

        return fsGitHandler.checkoutRemoteBranch(repoSuffix, jsonTransformationDTO.getRefName());
    }

    @Override
    public Mono<Boolean> deleteGitReference(ArtifactJsonTransformationDTO jsonTransformationDTO) {
        ArtifactType artifactType = jsonTransformationDTO.getArtifactType();
        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);

        Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(
                jsonTransformationDTO.getWorkspaceId(),
                jsonTransformationDTO.getBaseArtifactId(),
                jsonTransformationDTO.getRepoName());

        return fsGitHandler
                .deleteBranch(repoSuffix, jsonTransformationDTO.getRefName())
                .onErrorResume(throwable -> {
                    log.error("Delete branch failed {}", throwable.getMessage());

                    Mono<Boolean> releaseLockMono = gitRedisUtils.releaseFileLock(
                            artifactType, jsonTransformationDTO.getBaseArtifactId(), Boolean.TRUE);

                    if (throwable instanceof CannotDeleteCurrentBranchException) {
                        return releaseLockMono.then(Mono.error(new AppsmithException(
                                AppsmithError.GIT_ACTION_FAILED,
                                "delete branch",
                                "Cannot delete current checked out branch")));
                    }

                    return releaseLockMono.then(Mono.error(new AppsmithException(
                            AppsmithError.GIT_ACTION_FAILED, "delete branch", throwable.getMessage())));
                });
    }

    @Override
    public Mono<Boolean> checkoutArtifact(ArtifactJsonTransformationDTO jsonTransformationDTO) {
        GitArtifactHelper<?> gitArtifactHelper =
                gitArtifactHelperResolver.getArtifactHelper(jsonTransformationDTO.getArtifactType());

        Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(
                jsonTransformationDTO.getWorkspaceId(),
                jsonTransformationDTO.getBaseArtifactId(),
                jsonTransformationDTO.getRepoName());

        // Tags and branch checkout with the same mechanism.
        return fsGitHandler.checkoutToBranch(repoSuffix, jsonTransformationDTO.getRefName());
    }

    @Override
    public Mono<MergeStatusDTO> pullArtifact(
            ArtifactJsonTransformationDTO jsonTransformationDTO, GitArtifactMetadata baseMetadata) {
        GitArtifactHelper<?> gitArtifactHelper =
                gitArtifactHelperResolver.getArtifactHelper(jsonTransformationDTO.getArtifactType());

        Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(
                jsonTransformationDTO.getWorkspaceId(),
                jsonTransformationDTO.getBaseArtifactId(),
                jsonTransformationDTO.getRepoName());

        String branchName = jsonTransformationDTO.getRefName();

        // git checkout and pull origin branchName
        try {
            return fsGitHandler
                    .checkoutToBranch(repoSuffix, jsonTransformationDTO.getRefName())
                    .then(fsGitHandler.pullApplication(
                            repoSuffix,
                            baseMetadata.getRemoteUrl(),
                            branchName,
                            baseMetadata.getGitAuth().getPrivateKey(),
                            baseMetadata.getGitAuth().getPublicKey()))
                    .onErrorResume(error -> {
                        if (error.getMessage().contains("conflict")) {
                            return Mono.error(
                                    new AppsmithException(AppsmithError.GIT_PULL_CONFLICTS, error.getMessage()));
                        } else if (error.getMessage().contains("Nothing to fetch")) {
                            MergeStatusDTO mergeStatus = new MergeStatusDTO();
                            mergeStatus.setStatus("Nothing to fetch from remote. All changes are up to date.");
                            mergeStatus.setMergeAble(true);
                            return Mono.just(mergeStatus);
                        }
                        return Mono.error(
                                new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "pull", error.getMessage()));
                    });
        } catch (IOException e) {
            return Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, e.getMessage()));
        }
    }
}
