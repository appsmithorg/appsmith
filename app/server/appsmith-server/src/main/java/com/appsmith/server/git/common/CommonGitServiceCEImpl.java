package com.appsmith.server.git.common;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.constants.ErrorReferenceDocUrl;
import com.appsmith.external.dtos.GitBranchDTO;
import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.external.git.constants.GitConstants;
import com.appsmith.external.git.constants.GitConstants.GitCommandConstants;
import com.appsmith.external.git.constants.GitSpan;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.Assets;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.GitDefaultCommitMessage;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
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
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ArtifactImportDTO;
import com.appsmith.server.dtos.AutoCommitResponseDTO;
import com.appsmith.server.dtos.GitCommitDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitDocsDTO;
import com.appsmith.server.dtos.GitMergeDTO;
import com.appsmith.server.dtos.GitPullDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.git.GitRedisUtils;
import com.appsmith.server.git.autocommit.helpers.GitAutoCommitHelper;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.GitDeployKeyGenerator;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.helpers.GitUtils;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.cakes.GitDeployKeysRepositoryCake;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.GitArtifactHelper;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.DatasourcePermission;
import io.micrometer.observation.ObservationRegistry;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.errors.CannotDeleteCurrentBranchException;
import org.eclipse.jgit.api.errors.CheckoutConflictException;
import org.eclipse.jgit.api.errors.EmptyCommitException;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.InvalidRemoteException;
import org.eclipse.jgit.api.errors.TransportException;
import org.eclipse.jgit.errors.RepositoryNotFoundException;
import org.eclipse.jgit.lib.BranchTrackingStatus;
import org.eclipse.jgit.util.StringUtils;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import reactor.core.Exceptions;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuple3;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeoutException;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.AnalyticsEvents.GIT_ADD_PROTECTED_BRANCH;
import static com.appsmith.external.constants.AnalyticsEvents.GIT_REMOVE_PROTECTED_BRANCH;
import static com.appsmith.external.git.constants.GitConstants.DEFAULT_COMMIT_MESSAGE;
import static com.appsmith.external.git.constants.GitConstants.EMPTY_COMMIT_ERROR_MESSAGE;
import static com.appsmith.external.git.constants.GitConstants.GIT_CONFIG_ERROR;
import static com.appsmith.external.git.constants.GitConstants.GIT_PROFILE_ERROR;
import static com.appsmith.external.git.constants.ce.GitSpanCE.OPS_COMMIT;
import static com.appsmith.external.git.constants.ce.GitSpanCE.OPS_STATUS;
import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;
import static com.appsmith.server.constants.ArtifactType.APPLICATION;
import static com.appsmith.server.constants.SerialiseArtifactObjective.VERSION_CONTROL;
import static com.appsmith.server.constants.ce.FieldNameCE.BRANCH_NAME;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.apache.commons.lang.ObjectUtils.defaultIfNull;
import static org.springframework.util.StringUtils.hasText;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommonGitServiceCEImpl implements CommonGitServiceCE {

    private final GitDeployKeysRepositoryCake gitDeployKeysRepository;
    private final GitPrivateRepoHelper gitPrivateRepoHelper;
    private final CommonGitFileUtils commonGitFileUtils;
    private final GitRedisUtils gitRedisUtils;
    protected final SessionUserService sessionUserService;
    private final UserDataService userDataService;
    protected final UserService userService;
    private final EmailConfig emailConfig;
    // private final TransactionalOperator transactionalOperator;

    protected final AnalyticsService analyticsService;
    private final ObservationRegistry observationRegistry;

    private final WorkspaceService workspaceService;
    private final DatasourceService datasourceService;
    private final DatasourcePermission datasourcePermission;
    private final PluginService pluginService;

    private final ExportService exportService;
    private final ImportService importService;

    private final GitExecutor gitExecutor;
    private final GitArtifactHelper<Application> gitApplicationHelper;
    private final GitAutoCommitHelper gitAutoCommitHelper;

    private static final String ORIGIN = "origin/";
    private static final String REMOTE_NAME_REPLACEMENT = "";

    private Mono<Boolean> addFileLock(String baseArtifactId, String commandName, boolean isLockRequired) {
        if (!Boolean.TRUE.equals(isLockRequired)) {
            return Mono.just(Boolean.TRUE);
        }

        return Mono.defer(() -> addFileLock(baseArtifactId, commandName));
    }

    private Mono<Boolean> addFileLock(String baseArtifactId, String commandName) {
        return gitRedisUtils.addFileLock(baseArtifactId, commandName);
    }

    private Mono<Boolean> releaseFileLock(String baseArtifactId, boolean isLockRequired) {
        if (!Boolean.TRUE.equals(isLockRequired)) {
            return Mono.just(Boolean.TRUE);
        }

        return releaseFileLock(baseArtifactId);
    }

    private Mono<Boolean> releaseFileLock(String baseArtifactId) {
        return gitRedisUtils
                .releaseFileLock(baseArtifactId)
                .name(GitSpan.RELEASE_FILE_LOCK)
                .tap(Micrometer.observation(observationRegistry));
    }

    public GitArtifactHelper<?> getArtifactGitService(@NonNull ArtifactType artifactType) {
        return switch (artifactType) {
            case APPLICATION -> gitApplicationHelper;
            default -> gitApplicationHelper;
        };
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
    public Mono<? extends Artifact> updateGitMetadata(
            String baseArtifactId, GitArtifactMetadata gitArtifactMetadata, ArtifactType artifactType) {

        if (Optional.ofNullable(gitArtifactMetadata).isEmpty()) {
            return Mono.error(
                    new AppsmithException(AppsmithError.INVALID_PARAMETER, "Git metadata values cannot be null"));
        }

        // For default artifact we expect a GitAuth to be a part of gitMetadata.
        // We are using save method to leverage @Encrypted annotation used for private SSH keys.
        // TODO: ensure artifact.saveArtifact should set the transient fields
        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();
        return gitArtifactHelper
                .getArtifactById(baseArtifactId, artifactEditPermission)
                .flatMap(artifact -> updateArtifactWithGitMetadataGivenPermission(artifact, gitArtifactMetadata));
    }

    protected Mono<List<GitLogDTO>> getCommitHistory(Artifact branchedArtifact) {
        GitArtifactMetadata gitData = branchedArtifact.getGitArtifactMetadata();
        if (gitData == null
                || StringUtils.isEmptyOrNull(
                        branchedArtifact.getGitArtifactMetadata().getBranchName())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
        }

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(branchedArtifact.getArtifactType());
        Path baseRepoSuffix = gitArtifactHelper.getRepoSuffixPath(
                branchedArtifact.getWorkspaceId(), gitData.getDefaultArtifactId(), gitData.getRepoName());

        Mono<List<GitLogDTO>> commitHistoryMono = gitExecutor
                .checkoutToBranch(baseRepoSuffix, gitData.getBranchName())
                .onErrorResume(e ->
                        Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "checkout", e.getMessage())))
                .then(gitExecutor
                        .getCommitHistory(baseRepoSuffix)
                        .onErrorResume(e -> Mono.error(
                                new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "log", e.getMessage()))));

        return Mono.create(
                sink -> commitHistoryMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    @Override
    public Mono<GitStatusDTO> getStatus(String branchedArtifactId, boolean compareRemote, ArtifactType artifactType) {
        return getStatus(branchedArtifactId, true, compareRemote, artifactType);
    }

    private Mono<GitStatusDTO> getStatusAfterComparingWithRemote(
            String baseArtifactId, boolean isFileLock, ArtifactType artifactType) {
        return getStatus(baseArtifactId, isFileLock, true, artifactType);
    }

    protected Mono<GitStatusDTO> getStatus(
            Artifact baseArtifact, Artifact branchedArtifact, boolean isFileLock, boolean compareRemote) {

        ArtifactType artifactType = baseArtifact.getArtifactType();
        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);

        GitArtifactMetadata baseGitMetadata = baseArtifact.getGitArtifactMetadata();
        final String baseArtifactId = baseGitMetadata.getDefaultArtifactId();

        GitArtifactMetadata branchedGitMetadata = branchedArtifact.getGitArtifactMetadata();
        branchedGitMetadata.setGitAuth(baseGitMetadata.getGitAuth());

        final String finalBranchName = branchedGitMetadata.getBranchName();

        if (StringUtils.isEmptyOrNull(finalBranchName)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        }

        // create suffix to the git repository of the application.
        final Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(
                branchedArtifact.getWorkspaceId(),
                branchedGitMetadata.getDefaultArtifactId(),
                branchedGitMetadata.getRepoName());

        Mono<? extends ArtifactExchangeJson> exportedArtifactJsonMono =
                exportService.exportByArtifactId(branchedArtifact.getId(), VERSION_CONTROL, artifactType);

        Mono<GitStatusDTO> statusMono = exportedArtifactJsonMono
                .flatMap(artifactExchangeJson -> {
                    return addFileLock(baseArtifactId, GitCommandConstants.STATUS, isFileLock)
                            .thenReturn(artifactExchangeJson);
                })
                .flatMap(artifactExchangeJson -> {
                    try {
                        GitAuth gitAuth = branchedGitMetadata.getGitAuth();
                        Mono<String> fetchRemoteMono;

                        if (compareRemote) {
                            fetchRemoteMono = Mono.defer(() -> gitExecutor.fetchRemote(
                                            repoSuffix,
                                            gitAuth.getPublicKey(),
                                            gitAuth.getPrivateKey(),
                                            false,
                                            finalBranchName,
                                            false))
                                    .onErrorResume(error -> Mono.error(new AppsmithException(
                                            AppsmithError.GIT_GENERIC_ERROR, error.getMessage())));
                        } else {
                            fetchRemoteMono = Mono.just("ignored");
                        }

                        return Mono.zip(
                                commonGitFileUtils.saveArtifactToLocalRepo(
                                        repoSuffix, artifactExchangeJson, finalBranchName),
                                fetchRemoteMono);
                    } catch (IOException | GitAPIException e) {
                        return Mono.error(
                                new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "status", e.getMessage()));
                    }
                })
                .flatMap(tuple -> gitExecutor.getStatus(tuple.getT1(), finalBranchName))
                .flatMap(gitStatusDTO -> {
                    // release the lock if there's a successful response
                    return releaseFileLock(baseArtifactId, isFileLock).thenReturn(gitStatusDTO);
                })
                .onErrorResume(throwable -> {
                    /*
                     in case of any error, the global exception handler will release the lock
                     hence we don't need to do that manually
                    */
                    log.error(
                            "Error to get status for application: {}, branch: {}",
                            baseArtifactId,
                            finalBranchName,
                            throwable);
                    return Mono.error(new AppsmithException(AppsmithError.GIT_GENERIC_ERROR, throwable.getMessage()));
                });

        return Mono.zip(statusMono, sessionUserService.getCurrentUser())
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

                    return sendUnitExecutionTimeAnalyticsEvent(flowName, elapsedTime, currentUser, branchedArtifact)
                            .thenReturn(gitStatusDTO);
                })
                .name(OPS_STATUS)
                .tap(Micrometer.observation(observationRegistry));
    }

    /**
     * Get the status of the artifact for given branched id
     *
     * @param branchedArtifactId branched id of the artifact
     * @param isFileLock         if the locking is required, since the status API is used in the other flows of git
     *                           Only for the direct hits from the client the locking will be added
     * @param artifactType       Type of artifact in context
     * @return Map of json file names which are added, modified, conflicting, removed and the working tree if this is clean
     */
    private Mono<GitStatusDTO> getStatus(
            String branchedArtifactId, boolean isFileLock, boolean compareRemote, ArtifactType artifactType) {

        Mono<Tuple2<? extends Artifact, ? extends Artifact>> baseAndBranchedArtifacts =
                getBaseAndBranchedArtifacts(branchedArtifactId, artifactType);

        return baseAndBranchedArtifacts.flatMap(artifactTuple -> {
            Artifact baseArtifact = artifactTuple.getT1();
            Artifact branchedArtifact = artifactTuple.getT2();
            return getStatus(baseArtifact, branchedArtifact, isFileLock, compareRemote);
        });
    }

    @Override
    public Mono<BranchTrackingStatus> fetchRemoteChanges(
            Artifact baseArtifact, Artifact branchedArtifact, boolean isFileLock) {

        if (branchedArtifact == null || baseArtifact == null || baseArtifact.getGitArtifactMetadata() == null) {
            return Mono.error(new AppsmithException(AppsmithError.GIT_GENERIC_ERROR));
        }

        GitArtifactMetadata baseGitData = baseArtifact.getGitArtifactMetadata();
        GitArtifactMetadata branchedGitData = branchedArtifact.getGitArtifactMetadata();

        String baseArtifactId = baseGitData.getDefaultArtifactId();

        if (branchedGitData == null || !hasText(branchedGitData.getBranchName())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, BRANCH_NAME));
        }

        final String finalBranchName = branchedArtifact.getGitArtifactMetadata().getBranchName();

        GitArtifactHelper<?> artifactGitHelper = getArtifactGitService(baseArtifact.getArtifactType());
        Mono<User> currUserMono = sessionUserService.getCurrentUser().cache(); // will be used to send analytics event

        Mono<Boolean> addFileLockMono = addFileLock(baseArtifactId, GitCommandConstants.FETCH_REMOTE, isFileLock);

        /*
           1. Copy resources from DB to local repo
           2. Fetch the current status from local repo
        */

        // current user mono has been zipped just to run in parallel.
        Mono<BranchTrackingStatus> fetchRemoteStatusMono = addFileLockMono
                .flatMap(isFileLocked -> {
                    branchedGitData.setGitAuth(baseGitData.getGitAuth());

                    Path repoSuffix = artifactGitHelper.getRepoSuffixPath(
                            branchedArtifact.getWorkspaceId(),
                            branchedGitData.getDefaultArtifactId(),
                            branchedGitData.getRepoName());

                    Path repoPath = gitExecutor.createRepoPath(repoSuffix);
                    Mono<Boolean> checkoutBranchMono = gitExecutor.checkoutToBranch(repoSuffix, finalBranchName);
                    Mono<String> fetchRemoteMono = gitExecutor.fetchRemote(
                            repoPath,
                            branchedGitData.getGitAuth().getPublicKey(),
                            branchedGitData.getGitAuth().getPrivateKey(),
                            true,
                            finalBranchName,
                            false);

                    Mono<BranchTrackingStatus> branchedStatusMono =
                            gitExecutor.getBranchTrackingStatus(repoPath, finalBranchName);

                    return checkoutBranchMono
                            .then(Mono.defer(() -> fetchRemoteMono))
                            .then(Mono.defer(() -> branchedStatusMono))
                            .flatMap(branchTrackingStatus -> {
                                return releaseFileLock(baseArtifactId, isFileLock)
                                        .thenReturn(branchTrackingStatus);
                            })
                            .onErrorResume(throwable -> {
                                /*
                                 in case of any error, the global exception handler will release the lock
                                 hence we don't need to do that manually
                                */
                                log.error(
                                        "Error to fetch from remote for application: {}, branch: {}",
                                        baseArtifactId,
                                        finalBranchName,
                                        throwable);
                                return Mono.error(new AppsmithException(
                                        AppsmithError.GIT_ACTION_FAILED, "fetch", throwable.getMessage()));
                            });
                })
                .elapsed()
                .zipWith(currUserMono)
                .flatMap(objects -> {
                    Long elapsedTime = objects.getT1().getT1();
                    BranchTrackingStatus branchTrackingStatus = objects.getT1().getT2();
                    User currentUser = objects.getT2();
                    return sendUnitExecutionTimeAnalyticsEvent(
                                    AnalyticsEvents.GIT_FETCH.getEventName(),
                                    elapsedTime,
                                    currentUser,
                                    branchedArtifact)
                            .thenReturn(branchTrackingStatus);
                })
                .name(GitSpan.OPS_FETCH_REMOTE)
                .tap(Micrometer.observation(observationRegistry));

        return Mono.create(sink -> {
            fetchRemoteStatusMono.subscribe(sink::success, sink::error, null, sink.currentContext());
        });
    }

    /**
     * This method is responsible to compare the current branch with the remote branch.
     * Comparing means finding two numbers - how many commits ahead and behind the local branch is.
     * It'll do the following things -
     * 1. Checkout (if required) to the branch to make sure we are comparing the right branch
     * 2. Run a git fetch command to fetch the latest changes from the remote
     *
     * @param branchedArtifactId branched artifact id
     * @param isFileLock         whether to add file lock or not
     * @param artifactType
     * @return Mono of {@link BranchTrackingStatus}
     */
    @Override
    public Mono<BranchTrackingStatus> fetchRemoteChanges(
            String branchedArtifactId, boolean isFileLock, ArtifactType artifactType) {

        GitArtifactHelper<?> artifactGitHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = artifactGitHelper.getArtifactEditPermission();

        Mono<Tuple2<? extends Artifact, ? extends Artifact>> baseAndBranchedArtifactMono =
                getBaseAndBranchedArtifacts(branchedArtifactId, artifactType, artifactEditPermission);

        return baseAndBranchedArtifactMono.flatMap(artifactTuples -> {
            Artifact baseArtifact = artifactTuples.getT1();
            Artifact branchedArtifact = artifactTuples.getT2();

            return fetchRemoteChanges(baseArtifact, branchedArtifact, isFileLock);
        });
    }

    private Mono<Void> sendUnitExecutionTimeAnalyticsEvent(
            String flowName, Long elapsedTime, User currentUser, Artifact artifact) {
        GitArtifactMetadata gitArtifactMetadata = artifact.getGitArtifactMetadata();

        final Map<String, Object> data = Map.of(
                FieldName.FLOW_NAME,
                flowName,
                FieldName.APPLICATION_ID,
                gitArtifactMetadata.getDefaultArtifactId(),
                "appId",
                gitArtifactMetadata.getDefaultArtifactId(),
                FieldName.BRANCH_NAME,
                gitArtifactMetadata.getBranchName(),
                "organizationId",
                artifact.getWorkspaceId(),
                "repoUrl",
                gitArtifactMetadata.getRemoteUrl(),
                "executionTime",
                elapsedTime);
        return analyticsService.sendEvent(
                AnalyticsEvents.UNIT_EXECUTION_TIME.getEventName(), currentUser.getUsername(), data);
    }

    @Override
    public Mono<GitArtifactMetadata> getGitArtifactMetadata(String baseArtifactId, ArtifactType artifactType) {

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<? extends Artifact> baseArtifactMono =
                gitArtifactHelper.getArtifactById(baseArtifactId, artifactEditPermission);

        return Mono.zip(baseArtifactMono, userDataService.getForCurrentUser()).map(tuple -> {
            Artifact baseArtifact = tuple.getT1();
            UserData userData = tuple.getT2();
            Map<String, GitProfile> gitProfiles = new HashMap<>();
            GitArtifactMetadata baseGitMetadata = baseArtifact.getGitArtifactMetadata();

            if (!CollectionUtils.isNullOrEmpty(userData.getGitProfiles())) {
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

    /**
     * Connect the artifact from Appsmith to a git repo
     * This is the prerequisite step needed to perform all the git operation for an artifact
     * We are implementing the deployKey approach and since the deploy-keys are repo level these keys are store under artifact.
     * Each artifact is equal to a repo in the git(and each branch creates a new artifact with default artifact as parent)
     *
     * @param gitConnectDTO applicationId - this is used to link the local git repo to an application
     *                      remoteUrl - used for connecting to remote repo etc
     * @param artifactType
     * @return Application object with the updated data
     */
    @Override
    public Mono<? extends Artifact> connectArtifactToGit(
            String baseArtifactId, GitConnectDTO gitConnectDTO, String originHeader, ArtifactType artifactType) {
        /*
         *  Connecting the application for the first time
         *  The ssh keys is already present in application object from generate SSH key step
         *  We would be updating the remote url and default branchName
         * */

        if (StringUtils.isEmptyOrNull(gitConnectDTO.getRemoteUrl())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Remote Url"));
        }

        if (StringUtils.isEmptyOrNull(originHeader)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ORIGIN));
        }

        Mono<UserData> currentUserMono = userDataService
                .getForCurrentUser()
                .filter(userData -> !CollectionUtils.isNullOrEmpty(userData.getGitProfiles()))
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_PROFILE_ERROR)));

        Mono<Map<String, GitProfile>> profileMono = updateOrCreateGitProfileForCurrentUser(
                        gitConnectDTO.getGitProfile(), baseArtifactId)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_PROFILE_ERROR)));

        String browserSupportedUrl;
        try {
            browserSupportedUrl = GitUtils.convertSshUrlToBrowserSupportedUrl(gitConnectDTO.getRemoteUrl());
        } catch (AppsmithException error) {
            return Mono.error(error);
        }
        Mono<Boolean> isPrivateRepoMono =
                GitUtils.isRepoPrivate(browserSupportedUrl).cache();

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);

        AclPermission connectToGitPermission = gitArtifactHelper.getArtifactGitConnectPermission();

        Mono<? extends Artifact> artifactToConnectMono =
                gitArtifactHelper.getArtifactById(baseArtifactId, connectToGitPermission);

        Mono<? extends Artifact> connectedArtifactMono = Mono.zip(profileMono, isPrivateRepoMono, artifactToConnectMono)
                .flatMap(tuple -> {
                    Artifact artifact = tuple.getT3();
                    boolean isRepoPrivate = tuple.getT2();
                    // Check if the repo is public
                    if (!isRepoPrivate) {
                        return Mono.just(artifact);
                    }

                    // Check the limit for number of private repo
                    return gitPrivateRepoHelper
                            .isRepoLimitReached(artifact.getWorkspaceId(), true)
                            .flatMap(isRepoLimitReached -> {
                                if (Boolean.FALSE.equals(isRepoLimitReached)) {
                                    return Mono.just(artifact);
                                }

                                // TODO: change the exception to a generic exception
                                return addAnalyticsForGitOperation(
                                                AnalyticsEvents.GIT_PRIVATE_REPO_LIMIT_EXCEEDED,
                                                artifact,
                                                AppsmithError.GIT_APPLICATION_LIMIT_ERROR.getErrorType(),
                                                AppsmithError.GIT_APPLICATION_LIMIT_ERROR.getMessage(),
                                                true)
                                        .flatMap(ignore -> Mono.error(
                                                new AppsmithException(AppsmithError.GIT_APPLICATION_LIMIT_ERROR)));
                            });
                })
                .flatMap(artifact -> {
                    GitArtifactMetadata gitArtifactMetadata = artifact.getGitArtifactMetadata();
                    if (isBaseGitMetadataInvalid(artifact.getGitArtifactMetadata())) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                    } else {
                        String repoName = GitUtils.getRepoName(gitConnectDTO.getRemoteUrl());
                        Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(
                                artifact.getWorkspaceId(), baseArtifactId, repoName);

                        Mono<String> defaultBranchMono = gitExecutor
                                .cloneRemoteIntoArtifactRepo(
                                        repoSuffix,
                                        gitConnectDTO.getRemoteUrl(),
                                        gitArtifactMetadata.getGitAuth().getPrivateKey(),
                                        gitArtifactMetadata.getGitAuth().getPublicKey())
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

                                    return commonGitFileUtils
                                            .deleteLocalRepo(repoSuffix)
                                            .then(addAnalyticsForGitOperation(
                                                    AnalyticsEvents.GIT_CONNECT,
                                                    artifact,
                                                    error.getClass().getName(),
                                                    error.getMessage(),
                                                    artifact.getGitArtifactMetadata()
                                                            .getIsRepoPrivate()))
                                            .then(Mono.error(appsmithException));
                                });

                        return Mono.zip(
                                Mono.just(artifact), defaultBranchMono, Mono.just(repoName), Mono.just(repoSuffix));
                    }
                })
                .flatMap(tuple -> {
                    Artifact artifact = tuple.getT1();
                    String defaultBranch = tuple.getT2();
                    String repoName = tuple.getT3();
                    Path repoPath = tuple.getT4();
                    final String artifactId = artifact.getId();
                    final String workspaceId = artifact.getWorkspaceId();

                    try {
                        return commonGitFileUtils
                                .checkIfDirectoryIsEmpty(repoPath)
                                .zipWith(isPrivateRepoMono)
                                .flatMap(objects -> {
                                    boolean isEmpty = objects.getT1();
                                    boolean isRepoPrivate = objects.getT2();
                                    if (!isEmpty) {
                                        return addAnalyticsForGitOperation(
                                                        AnalyticsEvents.GIT_CONNECT,
                                                        artifact,
                                                        AppsmithError.INVALID_GIT_REPO.getErrorType(),
                                                        AppsmithError.INVALID_GIT_REPO.getMessage(),
                                                        isRepoPrivate)
                                                .then(Mono.error(
                                                        new AppsmithException(AppsmithError.INVALID_GIT_REPO)));
                                    } else {
                                        GitArtifactMetadata gitArtifactMetadata = artifact.getGitArtifactMetadata();
                                        gitArtifactMetadata.setDefaultApplicationId(artifactId);
                                        gitArtifactMetadata.setBranchName(defaultBranch);
                                        gitArtifactMetadata.setDefaultBranchName(defaultBranch);
                                        gitArtifactMetadata.setRemoteUrl(gitConnectDTO.getRemoteUrl());
                                        gitArtifactMetadata.setRepoName(repoName);
                                        gitArtifactMetadata.setBrowserSupportedRemoteUrl(browserSupportedUrl);
                                        gitArtifactMetadata.setIsRepoPrivate(isRepoPrivate);
                                        gitArtifactMetadata.setLastCommittedAt(Instant.now());

                                        // Set branchName for each artifact resource
                                        return exportService
                                                .exportByArtifactId(artifactId, VERSION_CONTROL, artifactType)
                                                .flatMap(artifactExchangeJson -> {
                                                    artifactExchangeJson
                                                            .getArtifact()
                                                            .setGitArtifactMetadata(gitArtifactMetadata);
                                                    return importService.importArtifactInWorkspaceFromGit(
                                                            workspaceId,
                                                            artifactId,
                                                            artifactExchangeJson,
                                                            defaultBranch);
                                                });
                                    }
                                })
                                .onErrorResume(e -> {
                                    if (e instanceof IOException) {
                                        return Mono.error(new AppsmithException(
                                                AppsmithError.GIT_FILE_SYSTEM_ERROR, e.getMessage()));
                                    }
                                    return Mono.error(e);
                                });
                    } catch (IOException e) {
                        log.error("Error while cloning the remote repo, {}", e.getMessage());
                        return Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, e.getMessage()));
                    }
                })
                .flatMap(artifact -> {
                    String repoName = GitUtils.getRepoName(gitConnectDTO.getRemoteUrl());
                    Path readMePath = gitArtifactHelper.getRepoSuffixPath(
                            artifact.getWorkspaceId(), baseArtifactId, repoName, "README.md");
                    try {
                        Mono<Path> readMeMono = gitArtifactHelper.intialiseReadMe(artifact, readMePath, originHeader);
                        return Mono.zip(readMeMono, currentUserMono)
                                .flatMap(tuple -> {
                                    UserData userData = tuple.getT2();
                                    GitProfile profile = userData.getGitProfileByKey(baseArtifactId);
                                    if (profile == null
                                            || StringUtils.isEmptyOrNull(profile.getAuthorName())
                                            || Boolean.TRUE.equals(profile.getUseGlobalProfile())) {

                                        profile = userData.getGitProfileByKey(DEFAULT);
                                    }

                                    return gitExecutor.commitArtifact(
                                            tuple.getT1(),
                                            DEFAULT_COMMIT_MESSAGE + GitDefaultCommitMessage.CONNECT_FLOW.getReason(),
                                            profile.getAuthorName(),
                                            profile.getAuthorEmail(),
                                            false,
                                            false);
                                })
                                .flatMap(ignore -> {
                                    // Commit and push artifact to check if the SSH key has the write access
                                    GitCommitDTO commitDTO = new GitCommitDTO();
                                    commitDTO.setDoPush(true);
                                    commitDTO.setCommitMessage(
                                            DEFAULT_COMMIT_MESSAGE + GitDefaultCommitMessage.CONNECT_FLOW.getReason());

                                    return this.commitArtifact(commitDTO, baseArtifactId, true, artifactType)
                                            .onErrorResume(error ->
                                                    // If the push fails remove all the cloned files from local repo
                                                    this.detachRemote(baseArtifactId, artifactType)
                                                            .flatMap(isDeleted -> {
                                                                if (error instanceof TransportException) {
                                                                    return addAnalyticsForGitOperation(
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
                                .then(addAnalyticsForGitOperation(
                                        AnalyticsEvents.GIT_CONNECT,
                                        artifact,
                                        artifact.getGitArtifactMetadata().getIsRepoPrivate()));
                    } catch (IOException e) {
                        log.error("Error while cloning the remote repo, {}", e.getMessage());
                        return Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, e.getMessage()));
                    }
                });

        return Mono.create(
                sink -> connectedArtifactMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    /**
     * This method will make a commit to local repo
     * This is used directly from client, and we need to acquire file lock before starting to keep the application in a sane state
     *
     * @param commitDTO          information required for making a commit
     * @param branchedArtifactId application branch on which the commit needs to be done
     * @param doAmend            if we want to amend the commit with the earlier one, used in connect flow
     * @param artifactType
     * @return success message
     */
    @Override
    public Mono<String> commitArtifact(
            GitCommitDTO commitDTO, String branchedArtifactId, boolean doAmend, ArtifactType artifactType) {
        return this.commitArtifact(commitDTO, branchedArtifactId, doAmend, true, artifactType);
    }

    /**
     * This method will make a commit to local repo and is used internally in flows like create, merge branch
     * Since the lock is already acquired by the other flows, we do not need to acquire file lock again
     *
     * @param commitDTO          information required for making a commit
     * @param branchedArtifactId application branch on which the commit needs to be done
     * @return success message
     */
    @Override
    public Mono<String> commitArtifact(GitCommitDTO commitDTO, String branchedArtifactId, ArtifactType artifactType) {
        return this.commitArtifact(commitDTO, branchedArtifactId, false, false, artifactType);
    }

    /**
     * @param commitDTO          information required for making a commit
     * @param branchedArtifactId application branch on which the commit needs to be done
     * @param doAmend            if we want to amend the commit with the earlier one, used in connect flow
     * @param isFileLock         boolean value indicates whether the file lock is needed to complete the operation
     * @return success message
     */
    private Mono<String> commitArtifact(
            GitCommitDTO commitDTO,
            String branchedArtifactId,
            boolean doAmend,
            boolean isFileLock,
            ArtifactType artifactType) {

        /*
        1. Check if application exists and user have sufficient permissions
        2. Check if branch name exists in git metadata
        3. Save application to the existing local repo
        4. Commit application : git add, git commit (Also check if git init required)
         */

        String commitMessage = commitDTO.getCommitMessage();

        if (commitMessage == null || commitMessage.isEmpty()) {
            commitDTO.setCommitMessage(DEFAULT_COMMIT_MESSAGE + GitDefaultCommitMessage.CONNECT_FLOW.getReason());
        }

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();
        Mono<Tuple2<? extends Artifact, ? extends Artifact>> baseAndBranchedArtifactMono = getBaseAndBranchedArtifacts(
                        branchedArtifactId, artifactType, artifactEditPermission)
                .cache();

        return baseAndBranchedArtifactMono.flatMap(artifactTuples -> {
            Artifact baseArtifact = artifactTuples.getT1();
            Artifact branchedArtifact = artifactTuples.getT2();
            return commitArtifact(commitDTO, baseArtifact, branchedArtifact, doAmend, isFileLock);
        });
    }

    private Mono<String> commitArtifact(
            GitCommitDTO commitDTO,
            Artifact baseArtifact,
            Artifact branchedArtifact,
            boolean doAmend,
            boolean isFileLock) {

        String commitMessage = commitDTO.getCommitMessage();
        StringBuilder result = new StringBuilder();

        if (commitMessage == null || commitMessage.isEmpty()) {
            commitDTO.setCommitMessage(DEFAULT_COMMIT_MESSAGE + GitDefaultCommitMessage.CONNECT_FLOW.getReason());
        }

        boolean isSystemGenerated = commitDTO.getCommitMessage().contains(DEFAULT_COMMIT_MESSAGE);

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(baseArtifact.getArtifactType());
        GitArtifactMetadata baseGitMetadata = baseArtifact.getGitArtifactMetadata();
        GitArtifactMetadata branchedGitMetadata = branchedArtifact.getGitArtifactMetadata();

        if (isBaseGitMetadataInvalid(baseGitMetadata)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
        }

        if (branchedGitMetadata == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
        }

        final String branchName = branchedGitMetadata.getBranchName();

        if (!hasText(branchName)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        }

        Mono<Boolean> isBranchProtectedMono = gitPrivateRepoHelper.isBranchProtected(baseGitMetadata, branchName);
        Mono<String> commitMono = isBranchProtectedMono
                .flatMap(isBranchProtected -> {
                    if (!TRUE.equals(isBranchProtected)) {
                        return addFileLock(
                                baseGitMetadata.getDefaultArtifactId(), GitCommandConstants.COMMIT, isFileLock);
                    }

                    return Mono.error(new AppsmithException(
                            AppsmithError.GIT_ACTION_FAILED,
                            "commit",
                            "Cannot commit to protected branch " + branchName));
                })
                .flatMap(fileLocked -> {
                    // Check if the repo is public for current artifact and if the user have changed the access after
                    // the connection

                    return GitUtils.isRepoPrivate(baseGitMetadata.getBrowserSupportedRemoteUrl())
                            .flatMap(isPrivate -> {
                                // Check the repo limit if the visibility status is updated, or it is private

                                if (isPrivate.equals(
                                        baseGitMetadata.getIsRepoPrivate() && !Boolean.TRUE.equals(isPrivate))) {
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
                                            baseArtifact
                                                    .getGitArtifactMetadata()
                                                    .setGitAuth(copiedGitAuth);
                                            return artifact;
                                        })
                                        .then(Mono.defer(() ->
                                                gitArtifactHelper.isPrivateRepoLimitReached(baseArtifact, false)));
                            });
                })
                .flatMap(artifact -> {
                    String errorEntity = "";
                    if (StringUtils.isEmptyOrNull(branchedGitMetadata.getBranchName())) {
                        errorEntity = "branch name";
                    } else if (StringUtils.isEmptyOrNull(branchedGitMetadata.getDefaultArtifactId())) {
                        // TODO: make this artifact
                        errorEntity = "default artifact";
                    } else if (StringUtils.isEmptyOrNull(branchedGitMetadata.getRepoName())) {
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
                    Path baseRepoSuffix = gitArtifactHelper.getRepoSuffixPath(
                            branchedArtifact.getWorkspaceId(),
                            branchedGitMetadata.getDefaultArtifactId(),
                            branchedGitMetadata.getRepoName());

                    Mono<Path> repoPathMono = commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                            baseRepoSuffix, artifactExchangeJson, branchName);

                    branchedGitMetadata.setLastCommittedAt(Instant.now());
                    Mono<? extends Artifact> branchedArtifactMono =
                            updateArtifactWithGitMetadataGivenPermission(branchedArtifact, branchedGitMetadata);

                    return Mono.zip(
                            repoPathMono,
                            userDataService.getGitProfileForCurrentUser(branchedGitMetadata.getDefaultArtifactId()),
                            branchedArtifactMono);
                })
                .onErrorResume(e -> {
                    log.error("Error in commit flow: ", e);
                    if (e instanceof RepositoryNotFoundException) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.REPOSITORY_NOT_FOUND, branchedGitMetadata.getDefaultArtifactId()));
                    } else if (e instanceof AppsmithException) {
                        return Mono.error(e);
                    }
                    return Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, e.getMessage()));
                })
                .flatMap(tuple -> {
                    Path baseRepoPath = tuple.getT1();
                    GitProfile authorProfile = tuple.getT2();
                    Artifact updatedBranchedArtifact = tuple.getT3();
                    GitArtifactMetadata gitArtifactMetadata = updatedBranchedArtifact.getGitArtifactMetadata();

                    if (authorProfile == null || StringUtils.isEmptyOrNull(authorProfile.getAuthorName())) {
                        String errorMessage = "Unable to find git author configuration for logged-in user. You can set "
                                + "up a git profile from the user profile section.";

                        return addAnalyticsForGitOperation(
                                        AnalyticsEvents.GIT_COMMIT,
                                        updatedBranchedArtifact,
                                        AppsmithError.INVALID_GIT_CONFIGURATION.getErrorType(),
                                        AppsmithError.INVALID_GIT_CONFIGURATION.getMessage(errorMessage),
                                        gitArtifactMetadata.getIsRepoPrivate())
                                .flatMap(user -> Mono.error(
                                        new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, errorMessage)));
                    }

                    result.append("Commit Result : ");
                    Mono<String> gitCommitMono = gitExecutor
                            .commitArtifact(
                                    baseRepoPath,
                                    commitMessage,
                                    authorProfile.getAuthorName(),
                                    authorProfile.getAuthorEmail(),
                                    false,
                                    doAmend)
                            .onErrorResume(error -> {
                                if (error instanceof EmptyCommitException) {
                                    return Mono.just(EMPTY_COMMIT_ERROR_MESSAGE);
                                }
                                return addAnalyticsForGitOperation(
                                                AnalyticsEvents.GIT_COMMIT,
                                                updatedBranchedArtifact,
                                                error.getClass().getName(),
                                                error.getMessage(),
                                                gitArtifactMetadata.getIsRepoPrivate())
                                        .then(Mono.error(new AppsmithException(
                                                AppsmithError.GIT_ACTION_FAILED, "commit", error.getMessage())));
                            });
                    return Mono.zip(
                            gitCommitMono, gitArtifactHelper.getArtifactById(updatedBranchedArtifact.getId(), null));
                })
                .flatMap(tuple -> {
                    String commitStatus = tuple.getT1();
                    Artifact artifactFromBranch = tuple.getT2();
                    result.append(commitStatus);
                    if (Boolean.TRUE.equals(commitDTO.getDoPush())) {
                        // Push flow
                        result.append(".\nPush Result : ");
                        return pushArtifact(artifactFromBranch, false, false)
                                .map(pushResult -> result.append(pushResult).toString())
                                .zipWith(Mono.just(artifactFromBranch));
                    }
                    return Mono.zip(Mono.just(result.toString()), Mono.just(artifactFromBranch));
                })
                .flatMap(tuple2 -> {
                    String status = tuple2.getT1();
                    Artifact artifactFromBranch = tuple2.getT2();
                    return Mono.zip(Mono.just(status), publishArtifact(artifactFromBranch, commitDTO.getDoPush()));
                })
                .flatMap(tuple -> {
                    String status = tuple.getT1();
                    Artifact artifactFromBranch = tuple.getT2();
                    Mono<Boolean> releaseFileLockMono = releaseFileLock(
                            artifactFromBranch.getGitArtifactMetadata().getDefaultArtifactId(), isFileLock);

                    Mono<? extends Artifact> updatedArtifactMono =
                            gitArtifactHelper.updateArtifactWithSchemaVersions(artifactFromBranch);

                    return Mono.zip(updatedArtifactMono, releaseFileLockMono)
                            .then(addAnalyticsForGitOperation(
                                    AnalyticsEvents.GIT_COMMIT,
                                    artifactFromBranch,
                                    "",
                                    "",
                                    artifactFromBranch.getGitArtifactMetadata().getIsRepoPrivate(),
                                    isSystemGenerated))
                            .thenReturn(status)
                            .name(OPS_COMMIT)
                            .tap(Micrometer.observation(observationRegistry));
                });

        return Mono.create(sink -> {
            commitMono.subscribe(sink::success, sink::error, null, sink.currentContext());
        });
    }

    private Mono<? extends Artifact> updateArtifactWithGitMetadataGivenPermission(
            Artifact artifact, GitArtifactMetadata gitMetadata) {

        if (Optional.ofNullable(gitMetadata).isEmpty()) {
            return Mono.error(
                    new AppsmithException(AppsmithError.INVALID_PARAMETER, "Git metadata values cannot be null"));
        }

        artifact.setGitArtifactMetadata(gitMetadata);
        // For default application we expect a GitAuth to be a part of gitMetadata. We are using save method to leverage
        // @Encrypted annotation used for private SSH keys
        // applicationService.save sets the transient fields so no need to set it again from this method
        return getArtifactGitService(artifact.getArtifactType()).saveArtifact(artifact);
    }

    @Override
    public Mono<String> pushArtifact(String branchedArtifactId, ArtifactType artifactType) {

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        return gitArtifactHelper
                .getArtifactById(branchedArtifactId, artifactEditPermission)
                .flatMap(branchedArtifact -> pushArtifact(branchedArtifact, true, true));
    }

    /**
     * Push flow for dehydrated apps
     *
     * @param branchedArtifact application which needs to be pushed to remote repo
     * @return Success message
     */
    protected Mono<String> pushArtifact(Artifact branchedArtifact, boolean doPublish, boolean isFileLock) {

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(branchedArtifact.getArtifactType());
        // Make sure that ssh Key is unEncrypted for the use.
        Mono<String> pushStatusMono = publishArtifact(branchedArtifact, doPublish)
                .flatMap(artifact -> {
                    if (branchedArtifact
                            .getId()
                            .equals(artifact.getGitArtifactMetadata().getDefaultArtifactId())) {
                        return Mono.just(artifact);
                    }

                    // TODO: check if permission null is okay.
                    return gitArtifactHelper
                            .getArtifactById(artifact.getGitArtifactMetadata().getDefaultArtifactId(), null)
                            .map(baseArtifact -> {
                                artifact.getGitArtifactMetadata()
                                        .setGitAuth(baseArtifact
                                                .getGitArtifactMetadata()
                                                .getGitAuth());
                                return artifact;
                            });
                })
                .flatMap(artifact -> {
                    if (!Boolean.TRUE.equals(isFileLock)) {
                        return Mono.just(artifact);
                    }

                    return addFileLock(
                                    artifact.getGitArtifactMetadata().getDefaultArtifactId(), GitCommandConstants.PUSH)
                            .map(status -> artifact);
                })
                .flatMap(artifact -> {
                    GitArtifactMetadata gitData = artifact.getGitArtifactMetadata();

                    if (gitData == null
                            || StringUtils.isEmptyOrNull(gitData.getBranchName())
                            || StringUtils.isEmptyOrNull(gitData.getDefaultArtifactId())
                            || StringUtils.isEmptyOrNull(gitData.getGitAuth().getPrivateKey())) {

                        return Mono.error(
                                new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
                    }

                    Path baseRepoSuffix = gitArtifactHelper.getRepoSuffixPath(
                            artifact.getWorkspaceId(), gitData.getDefaultArtifactId(), gitData.getRepoName());
                    GitAuth gitAuth = gitData.getGitAuth();

                    return gitExecutor
                            .checkoutToBranch(
                                    baseRepoSuffix,
                                    artifact.getGitArtifactMetadata().getBranchName())
                            .then(Mono.defer(() -> gitExecutor
                                    .pushApplication(
                                            baseRepoSuffix,
                                            gitData.getRemoteUrl(),
                                            gitAuth.getPublicKey(),
                                            gitAuth.getPrivateKey(),
                                            gitData.getBranchName())
                                    .zipWith(Mono.just(artifact))))
                            .onErrorResume(error -> addAnalyticsForGitOperation(
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
                        return Mono.defer(() -> releaseFileLock(
                                artifact.getGitArtifactMetadata().getDefaultArtifactId()));
                    });

                    return pushArtifactErrorRecovery(pushStatus, artifact)
                            .then(fileLockReleasedMono)
                            .then(addAnalyticsForGitOperation(
                                    AnalyticsEvents.GIT_PUSH,
                                    artifact,
                                    artifact.getGitArtifactMetadata().getIsRepoPrivate()))
                            .thenReturn(pushStatus);
                })
                .name(GitSpan.OPS_PUSH)
                .tap(Micrometer.observation(observationRegistry));

        return Mono.create(sink -> pushStatusMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    private Mono<? extends Artifact> publishArtifact(Artifact artifact, boolean publish) {
        if (!Boolean.TRUE.equals(publish)) {
            return Mono.just(artifact);
        }

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifact.getArtifactType());
        return gitArtifactHelper.publishArtifact(artifact, true);
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
        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifact.getArtifactType());

        if (pushResult.contains("REJECTED_NONFASTFORWARD")) {
            return addAnalyticsForGitOperation(
                            AnalyticsEvents.GIT_PUSH,
                            artifact,
                            AppsmithError.GIT_UPSTREAM_CHANGES.getErrorType(),
                            AppsmithError.GIT_UPSTREAM_CHANGES.getMessage(),
                            gitMetadata.getIsRepoPrivate())
                    .flatMap(application1 -> Mono.error(new AppsmithException(AppsmithError.GIT_UPSTREAM_CHANGES)));
        } else if (pushResult.contains("REJECTED_OTHERREASON") || pushResult.contains("pre-receive hook declined")) {

            Path path = gitArtifactHelper.getRepoSuffixPath(
                    artifact.getWorkspaceId(), gitMetadata.getDefaultArtifactId(), gitMetadata.getRepoName());

            return gitExecutor
                    .resetHard(path, gitMetadata.getBranchName())
                    .then(Mono.error(new AppsmithException(
                            AppsmithError.GIT_ACTION_FAILED,
                            "push",
                            "Unable to push changes as pre-receive hook declined. Please make sure that you don't have any rules enabled on the branch "
                                    + gitMetadata.getBranchName())));
        }
        return Mono.just(pushResult);
    }

    @Override
    public Mono<? extends Artifact> checkoutBranch(
            String branchedArtifactId, String branchToBeCheckedOut, boolean addFileLock, ArtifactType artifactType) {

        if (!hasText(branchToBeCheckedOut)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        }

        Mono<Tuple2<? extends Artifact, ? extends Artifact>> baseAndBranchedArtifactMono =
                getBaseAndBranchedArtifacts(branchedArtifactId, artifactType);

        return baseAndBranchedArtifactMono.flatMap(artifactTuples -> {
            Artifact sourceArtifact = artifactTuples.getT1();
            return checkoutBranch(sourceArtifact, branchToBeCheckedOut, addFileLock);
        });
    }

    protected Mono<? extends Artifact> checkoutBranch(
            Artifact baseArtifact, String branchToBeCheckedOut, boolean addFileLock) {

        if (!hasText(branchToBeCheckedOut)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        }

        GitArtifactMetadata baseGitMetadata = baseArtifact.getGitArtifactMetadata();

        if (isBaseGitMetadataInvalid(baseGitMetadata)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
        }

        String baseArtifactId = baseGitMetadata.getDefaultArtifactId();
        final String finalBranchName = branchToBeCheckedOut.replaceFirst(ORIGIN, REMOTE_NAME_REPLACEMENT);

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(baseArtifact.getArtifactType());

        Mono<Boolean> fileLockMono = addFileLock(baseArtifactId, GitCommandConstants.CHECKOUT_BRANCH, addFileLock);
        Mono<? extends Artifact> checkedOutArtifactMono;

        // If the user is trying to check out remote branch, create a new branch if the branch does not exist already
        if (branchToBeCheckedOut.startsWith(ORIGIN)) {

            Path repoPath = gitArtifactHelper.getRepoSuffixPath(
                    baseArtifact.getWorkspaceId(),
                    baseGitMetadata.getDefaultArtifactId(),
                    baseGitMetadata.getRepoName());

            checkedOutArtifactMono = gitExecutor.listBranches(repoPath).flatMap(gitBranchDTOList -> {
                long branchMatchCount = gitBranchDTOList.stream()
                        .filter(gitBranchDTO -> gitBranchDTO.getBranchName().equals(finalBranchName))
                        .count();

                if (branchMatchCount == 0) {
                    return checkoutRemoteBranch(baseArtifact, finalBranchName);
                }

                return Mono.error(new AppsmithException(
                        AppsmithError.GIT_ACTION_FAILED,
                        "checkout",
                        branchToBeCheckedOut + " already exists in local - " + finalBranchName));
            });
        } else {
            checkedOutArtifactMono = Mono.defer(() -> gitArtifactHelper
                    .getArtifactByBaseIdAndBranchName(
                            baseArtifactId, finalBranchName, gitArtifactHelper.getArtifactReadPermission())
                    .flatMap(artifact -> addAnalyticsForGitOperation(
                            AnalyticsEvents.GIT_CHECKOUT_BRANCH,
                            artifact,
                            artifact.getGitArtifactMetadata().getIsRepoPrivate())));
        }

        return checkedOutArtifactMono
                .flatMap(checkedOutArtifact ->
                        releaseFileLock(baseArtifactId, addFileLock).thenReturn(checkedOutArtifact))
                .tag(GitConstants.GitMetricConstants.CHECKOUT_REMOTE, FALSE.toString())
                .name(GitSpan.OPS_CHECKOUT_BRANCH)
                .tap(Micrometer.observation(observationRegistry))
                .onErrorResume(throwable -> {
                    return Mono.error(throwable);
                });
    }

    private Mono<? extends Artifact> checkoutRemoteBranch(
            String baseArtifactId, String remoteBranchName, ArtifactType artifactType) {

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<? extends Artifact> baseArtifactMono = gitArtifactHelper
                .getArtifactById(baseArtifactId, artifactEditPermission)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.GIT_GENERIC_ERROR)))
                .cache();

        return baseArtifactMono.flatMap(baseArtifact -> checkoutRemoteBranch(baseArtifact, remoteBranchName));
    }

    private Mono<? extends Artifact> checkoutRemoteBranch(Artifact baseArtifact, String remoteBranchName) {

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(baseArtifact.getArtifactType());
        GitArtifactMetadata baseGitMetadata = baseArtifact.getGitArtifactMetadata();

        if (isBaseGitMetadataInvalid(baseGitMetadata)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
        }

        final String repoName = baseGitMetadata.getRepoName();
        final String baseArtifactId = baseGitMetadata.getDefaultArtifactId();
        final String baseBranchName = baseGitMetadata.getBranchName();
        final String workspaceId = baseArtifact.getWorkspaceId();
        final String finalRemoteBranchName = remoteBranchName.replaceFirst(ORIGIN, REMOTE_NAME_REPLACEMENT);

        Path repoSuffixPath = gitArtifactHelper.getRepoSuffixPath(workspaceId, baseArtifactId, repoName);

        Mono<? extends Artifact> checkedOutRemoteArtifactMono = gitExecutor
                .fetchRemote(
                        repoSuffixPath,
                        baseGitMetadata.getGitAuth().getPublicKey(),
                        baseGitMetadata.getGitAuth().getPrivateKey(),
                        false,
                        remoteBranchName,
                        true)
                .flatMap(fetchStatus -> gitExecutor
                        .checkoutRemoteBranch(repoSuffixPath, remoteBranchName)
                        .onErrorResume(error -> Mono.error(new AppsmithException(
                                AppsmithError.GIT_ACTION_FAILED, "checkout branch", error.getMessage()))))
                .flatMap(checkedOutBranch -> {
                    /*
                     * create a new application(each application => git branch)
                     * Populate the application from the file system
                     * Check if the existing branch track the given remote branch using the StoredConfig
                     * Use the create branch method with isRemoteFlag or use the setStartPoint ,method in createBranch method
                     * */

                    Mono<? extends Artifact> artifactMono;
                    if (baseBranchName.equals(finalRemoteBranchName)) {
                        /*
                         in this case, user deleted the initial default branch and now wants to check out to that branch.
                         as we didn't delete the application object but only the branch from git repo,
                         we can just use this existing application without creating a new one.
                        */
                        artifactMono = Mono.just(baseArtifact);
                    } else {
                        // create new Artifact
                        artifactMono =
                                gitArtifactHelper.createNewArtifactForCheckout(baseArtifact, finalRemoteBranchName);
                    }

                    Mono<ArtifactExchangeJson> artifactExchangeJsonMono =
                            commonGitFileUtils.reconstructArtifactExchangeJsonFromGitRepoWithAnalytics(
                                    workspaceId,
                                    baseArtifactId,
                                    repoName,
                                    finalRemoteBranchName,
                                    baseArtifact.getArtifactType());

                    return artifactExchangeJsonMono.zipWith(artifactMono).onErrorResume(throwable -> {
                        if (throwable instanceof DuplicateKeyException) {
                            artifactExchangeJsonMono.zipWith(Mono.just(baseArtifact));
                        }

                        log.error(" Git checkout remote branch failed {}", throwable.getMessage());
                        return Mono.error(new AppsmithException(
                                AppsmithError.GIT_ACTION_FAILED, " --checkout", throwable.getMessage()));
                    });

                    // We need to handle the case specifically for default branch of Appsmith
                    // if user switches default branch and tries to delete the default branch we do not delete
                    // resource from db
                    // This is an exception only for the above case and in such case if the user tries to check
                    // out the branch again
                    // It results in an error as the resources are already present in db
                    // So we just rehydrate from the file system to the existing resource on the db

                })
                .flatMap(tuple -> {
                    // Get the latest artifact mono with all the changes
                    ArtifactExchangeJson artifactExchangeJson = tuple.getT1();
                    Artifact artifact = tuple.getT2();
                    return importService.importArtifactInWorkspaceFromGit(
                            artifact.getWorkspaceId(), artifact.getId(), artifactExchangeJson, finalRemoteBranchName);
                })
                .flatMap(importedArtifact -> gitArtifactHelper.publishArtifact(importedArtifact, false))
                .flatMap(publishedArtifact -> addAnalyticsForGitOperation(
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

    /**
     * Method to remove all the git metadata for the artifact and connected resources. This will remove:
     * - local repo
     * - all the branched applications present in DB except for default application
     *
     * @param branchedArtifactId : id of any branched artifact for the given repo
     * @param artifactType : type of artifact
     * @return : the base artifact after removal of git flow.
     */
    @Override
    public Mono<? extends Artifact> detachRemote(String branchedArtifactId, ArtifactType artifactType) {

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission gitConnectPermission = gitArtifactHelper.getArtifactGitConnectPermission();

        Mono<Tuple2<? extends Artifact, ? extends Artifact>> baseAndBranchedArtifactMono =
                getBaseAndBranchedArtifacts(branchedArtifactId, artifactType, gitConnectPermission);

        Mono<? extends Artifact> disconnectMono = baseAndBranchedArtifactMono
                .flatMap(artifactTuples -> {
                    Artifact baseArtifact = artifactTuples.getT1();
                    Artifact branchedArtifact = artifactTuples.getT2();

                    if (isBaseGitMetadataInvalid(baseArtifact.getGitArtifactMetadata())) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION,
                                "Please reconfigure the application to connect to git repo"));
                    }

                    // Remove the git contents from file system
                    GitArtifactMetadata baseGitMetadata = baseArtifact.getGitArtifactMetadata();
                    String repoName = baseGitMetadata.getRepoName();

                    Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(
                            baseArtifact.getWorkspaceId(), baseGitMetadata.getDefaultArtifactId(), repoName);

                    String baseApplicationBranchName = baseGitMetadata.getBranchName();
                    return Mono.zip(
                            gitExecutor.listBranches(repoSuffix),
                            Mono.just(baseArtifact),
                            Mono.just(repoSuffix),
                            Mono.just(baseApplicationBranchName));
                })
                .flatMap(tuple -> {
                    Artifact baseArtifact = tuple.getT2();
                    Path repoSuffix = tuple.getT3();
                    List<String> localBranches = tuple.getT1().stream()
                            .map(GitBranchDTO::getBranchName)
                            .filter(branchName -> !branchName.startsWith("origin"))
                            .collect(Collectors.toList());

                    // Remove the parent application branch name from the list
                    localBranches.remove(tuple.getT4());
                    baseArtifact.setGitArtifactMetadata(null);
                    gitArtifactHelper.resetAttributeInBaseArtifact(baseArtifact);

                    Mono<Boolean> removeRepoMono = commonGitFileUtils.deleteLocalRepo(repoSuffix);

                    Mono<? extends Artifact> updatedArtifactMono = gitArtifactHelper.saveArtifact(baseArtifact);

                    Flux<? extends Artifact> deleteAllBranchesFlux =
                            gitArtifactHelper.deleteAllBranches(branchedArtifactId, localBranches);

                    return Mono.zip(updatedArtifactMono, removeRepoMono, deleteAllBranchesFlux.collectList())
                            .map(Tuple3::getT1);
                })
                .flatMap(updatedBaseArtifact -> {
                    return gitArtifactHelper
                            .disconnectEntitiesOfBaseArtifact(updatedBaseArtifact)
                            .then(addAnalyticsForGitOperation(
                                    AnalyticsEvents.GIT_DISCONNECT, updatedBaseArtifact, false));
                })
                .name(GitSpan.OPS_DETACH_REMOTE)
                .tap(Micrometer.observation(observationRegistry));

        return Mono.create(sink -> disconnectMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    @Override
    public Mono<? extends Artifact> createBranch(
            String branchedArtifactId, GitBranchDTO branchDTO, ArtifactType artifactType) {
        /*
        1. Check if the src artifact is available and user have sufficient permissions
        2. Create and checkout to requested branch
        3. Rehydrate the artifact from source artifact reference
         */

        if (!hasText(branchDTO.getBranchName()) || branchDTO.getBranchName().startsWith(ORIGIN)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, BRANCH_NAME));
        }

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<Tuple2<? extends Artifact, ? extends Artifact>> baseAndBranchedArtifactMono =
                getBaseAndBranchedArtifacts(branchedArtifactId, artifactType, artifactEditPermission);

        Mono<? extends Artifact> createBranchMono = baseAndBranchedArtifactMono
                .flatMap(artifactTuples -> {
                    Artifact baseArtifact = artifactTuples.getT1();
                    Artifact parentArtifact = artifactTuples.getT2();

                    GitArtifactMetadata baseGitMetadata = baseArtifact.getGitArtifactMetadata();
                    GitAuth baseGitAuth = baseGitMetadata.getGitAuth();
                    GitArtifactMetadata parentGitMetadata = parentArtifact.getGitArtifactMetadata();

                    if (parentGitMetadata == null
                            || !hasText(parentGitMetadata.getDefaultArtifactId())
                            || !hasText(parentGitMetadata.getRepoName())) {
                        return Mono.error(
                                new AppsmithException(
                                        AppsmithError.INVALID_GIT_CONFIGURATION,
                                        "Unable to find the parent branch. Please create a branch from other available branches"));
                    }

                    Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(
                            baseArtifact.getWorkspaceId(),
                            baseGitMetadata.getDefaultArtifactId(),
                            baseGitMetadata.getRepoName());

                    // Create a new branch from the parent checked out branch
                    return addFileLock(baseGitMetadata.getDefaultArtifactId(), GitCommandConstants.CREATE_BRANCH)
                            .flatMap(status ->
                                    gitExecutor.checkoutToBranch(repoSuffix, parentGitMetadata.getBranchName()))
                            .onErrorResume(error -> Mono.error(new AppsmithException(
                                    AppsmithError.GIT_ACTION_FAILED,
                                    "checkout",
                                    "Unable to find " + parentGitMetadata.getBranchName())))
                            .zipWhen(isCheckedOut -> gitExecutor
                                    .fetchRemote(
                                            repoSuffix,
                                            baseGitAuth.getPublicKey(),
                                            baseGitAuth.getPrivateKey(),
                                            false,
                                            parentGitMetadata.getBranchName(),
                                            true)
                                    .onErrorResume(error -> Mono.error(
                                            new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "fetch", error))))
                            .flatMap(ignore -> gitExecutor
                                    .listBranches(repoSuffix)
                                    .flatMap(branchList -> {
                                        boolean isDuplicateName = branchList.stream()
                                                // We are only supporting origin as the remote name so this is safe
                                                //  but needs to be altered if we start supporting user defined remote
                                                // names
                                                .anyMatch(branch -> branch.getBranchName()
                                                        .replaceFirst(ORIGIN, REMOTE_NAME_REPLACEMENT)
                                                        .equals(branchDTO.getBranchName()));

                                        if (isDuplicateName) {
                                            return Mono.error(new AppsmithException(
                                                    AppsmithError.DUPLICATE_KEY_USER_ERROR,
                                                    "remotes/origin/" + branchDTO.getBranchName(),
                                                    FieldName.BRANCH_NAME));
                                        }
                                        return gitExecutor.createAndCheckoutToBranch(
                                                repoSuffix, branchDTO.getBranchName());
                                    }))
                            .flatMap(branchName -> {
                                Mono<? extends ArtifactExchangeJson> artifactExchangeJsonMono =
                                        exportService.exportByArtifactId(
                                                parentArtifact.getId(), VERSION_CONTROL, artifactType);
                                Mono<? extends Artifact> newArtifactFromSourceMono =
                                        gitArtifactHelper.createNewArtifactForCheckout(parentArtifact, branchName);

                                return Mono.zip(newArtifactFromSourceMono, artifactExchangeJsonMono);
                            })
                            .onErrorResume(error -> Mono.error(new AppsmithException(
                                    AppsmithError.GIT_ACTION_FAILED, "branch", error.getMessage())));
                })
                .flatMap(tuple -> {
                    Artifact newBranchedArtifact = tuple.getT1();
                    return importService
                            .importArtifactInWorkspaceFromGit(
                                    newBranchedArtifact.getWorkspaceId(),
                                    newBranchedArtifact.getId(),
                                    tuple.getT2(),
                                    branchDTO.getBranchName())
                            .flatMap(importedBranchedArtifact -> {
                                // Commit and push for new branch created this is to avoid issues when user tries to
                                // create a new branch from uncommitted branch
                                GitArtifactMetadata branchedGitMetadata =
                                        importedBranchedArtifact.getGitArtifactMetadata();
                                GitCommitDTO commitDTO = new GitCommitDTO();
                                commitDTO.setCommitMessage(DEFAULT_COMMIT_MESSAGE
                                        + GitDefaultCommitMessage.BRANCH_CREATED.getReason()
                                        + branchedGitMetadata.getBranchName());
                                commitDTO.setDoPush(true);
                                return commitArtifact(
                                                commitDTO, importedBranchedArtifact.getId(), false, false, artifactType)
                                        .thenReturn(importedBranchedArtifact);
                            });
                })
                .flatMap(importedBranchedArtifact -> releaseFileLock(importedBranchedArtifact
                                .getGitArtifactMetadata()
                                .getDefaultArtifactId())
                        .then(addAnalyticsForGitOperation(
                                AnalyticsEvents.GIT_CREATE_BRANCH,
                                importedBranchedArtifact,
                                importedBranchedArtifact
                                        .getGitArtifactMetadata()
                                        .getIsRepoPrivate())))
                .name(GitSpan.OPS_CREATE_BRANCH)
                .tap(Micrometer.observation(observationRegistry));

        return Mono.create(sink -> createBranchMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
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
    public Mono<GitPullDTO> pullArtifact(String branchedArtifactId, ArtifactType artifactType) {
        /*
         * 1.Dehydrate the artifact from DB so that the file system has the latest artifact data
         * 2.Do git pull after the rehydration and merge the remote changes to the current branch
         *   On Merge conflict - throw exception and ask user to resolve these conflicts on remote
         *   TODO create new branch and push the changes to remote and ask the user to resolve it on github/gitlab UI
         * 3.Then rehydrate from the file system to DB so that the latest changes from remote are rendered to the artifact
         * 4.Get the latest artifact from the DB and send it back to client
         * */

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<Tuple2<? extends Artifact, ? extends Artifact>> baseAndBranchedArtifactMono =
                getBaseAndBranchedArtifacts(branchedArtifactId, artifactType, artifactEditPermission);

        Mono<GitPullDTO> pullDTOMono = baseAndBranchedArtifactMono
                .flatMap(artifactTuples -> {
                    Artifact baseArtifact = artifactTuples.getT1();
                    Artifact branchedArtifact = artifactTuples.getT2();
                    GitArtifactMetadata branchedGitMetadata = branchedArtifact.getGitArtifactMetadata();

                    Mono<GitStatusDTO> statusMono = getStatus(baseArtifact, branchedArtifact, false, true);
                    return addFileLock(branchedGitMetadata.getDefaultArtifactId(), GitCommandConstants.PULL)
                            .then(Mono.zip(statusMono, Mono.just(baseArtifact), Mono.just(branchedArtifact)));
                })
                .flatMap(tuple -> {
                    GitStatusDTO status = tuple.getT1();
                    Artifact baseArtifact = tuple.getT2();
                    Artifact branchedArtifact = tuple.getT3();

                    // Check if the repo is clean
                    if (!CollectionUtils.isNullOrEmpty(status.getModified())) {
                        return Mono.error(
                                new AppsmithException(
                                        AppsmithError.GIT_ACTION_FAILED,
                                        "pull",
                                        "There are uncommitted changes present in your local. Please commit them first and then try git pull"));
                    }
                    return pullAndRehydrateArtifact(baseArtifact, branchedArtifact)
                            // Release file lock after the pull operation
                            .flatMap(gitPullDTO -> releaseFileLock(baseArtifact
                                            .getGitArtifactMetadata()
                                            .getDefaultArtifactId())
                                    .then(Mono.just(gitPullDTO)));
                })
                .name(GitSpan.OPS_PULL)
                .tap(Micrometer.observation(observationRegistry));

        return Mono.create(sink -> pullDTOMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    /**
     * Method to pull the files from remote repo and rehydrate the application
     *
     * @param baseArtifact     : base artifact
     * @param branchedArtifact : a branch created from branches of base artifact
     * @return pull DTO with updated application
     */
    private Mono<GitPullDTO> pullAndRehydrateArtifact(Artifact baseArtifact, Artifact branchedArtifact) {
        /*
        1. Checkout to the concerned branch
        2. Do git pull after
            On Merge conflict - throw exception and ask user to resolve these conflicts on remote
            TODO create new branch and push the changes to remote and ask the user to resolve it on github/gitlab UI
        3. Rehydrate the application from filesystem so that the latest changes from remote are rendered to the application
        */

        ArtifactType artifactType = baseArtifact.getArtifactType();
        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);

        GitArtifactMetadata baseGitMetadata = baseArtifact.getGitArtifactMetadata();
        if (isBaseGitMetadataInvalid(baseGitMetadata)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
        }

        GitArtifactMetadata branchedGitMetadata = branchedArtifact.getGitArtifactMetadata();

        final String workspaceId = branchedArtifact.getWorkspaceId();
        final String baseArtifactId = branchedGitMetadata.getDefaultArtifactId();
        final String repoName = branchedGitMetadata.getRepoName();
        final String branchName = branchedGitMetadata.getBranchName();

        Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(workspaceId, baseArtifactId, repoName);

        return Mono.defer(() -> {
                    // git checkout and pull origin branchName
                    try {
                        Mono<MergeStatusDTO> pullStatusMono = gitExecutor
                                .checkoutToBranch(repoSuffix, branchName)
                                .then(gitExecutor.pullApplication(
                                        repoSuffix,
                                        baseGitMetadata.getRemoteUrl(),
                                        branchName,
                                        baseGitMetadata.getGitAuth().getPrivateKey(),
                                        baseGitMetadata.getGitAuth().getPublicKey()))
                                .onErrorResume(error -> {
                                    if (error.getMessage().contains("conflict")) {
                                        return Mono.error(new AppsmithException(
                                                AppsmithError.GIT_PULL_CONFLICTS, error.getMessage()));
                                    } else if (error.getMessage().contains("Nothing to fetch")) {
                                        MergeStatusDTO mergeStatus = new MergeStatusDTO();
                                        mergeStatus.setStatus(
                                                "Nothing to fetch from remote. All changes are up to date.");
                                        mergeStatus.setMergeAble(true);
                                        return Mono.just(mergeStatus);
                                    }
                                    return Mono.error(new AppsmithException(
                                            AppsmithError.GIT_ACTION_FAILED, "pull", error.getMessage()));
                                })
                                .cache();
                        // Rehydrate the application from file system
                        Mono<ArtifactExchangeJson> artifactExchangeJsonMono = pullStatusMono.flatMap(
                                status -> commonGitFileUtils.reconstructArtifactExchangeJsonFromGitRepoWithAnalytics(
                                        workspaceId, baseArtifactId, repoName, branchName, artifactType));

                        return Mono.zip(pullStatusMono, artifactExchangeJsonMono);

                    } catch (IOException e) {
                        return Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, e.getMessage()));
                    }
                })
                .flatMap(tuple -> {
                    MergeStatusDTO status = tuple.getT1();
                    ArtifactExchangeJson artifactExchangeJson = tuple.getT2();
                    // Get the latest artifact with all the changes
                    // Commit and push changes to sync with remote
                    return importService
                            .importArtifactInWorkspaceFromGit(
                                    workspaceId, branchedArtifact.getId(), artifactExchangeJson, branchName)
                            .flatMap(importedBranchedArtifact -> addAnalyticsForGitOperation(
                                    AnalyticsEvents.GIT_PULL,
                                    importedBranchedArtifact,
                                    importedBranchedArtifact
                                            .getGitArtifactMetadata()
                                            .getIsRepoPrivate()))
                            .flatMap(importedBranchedArtifact -> {
                                GitCommitDTO commitDTO = new GitCommitDTO();
                                commitDTO.setCommitMessage(DEFAULT_COMMIT_MESSAGE
                                        + GitDefaultCommitMessage.SYNC_WITH_REMOTE_AFTER_PULL.getReason());
                                commitDTO.setDoPush(true);

                                GitPullDTO gitPullDTO = new GitPullDTO();
                                gitPullDTO.setMergeStatus(status);
                                gitPullDTO.setArtifact(importedBranchedArtifact);

                                return gitArtifactHelper
                                        .publishArtifact(importedBranchedArtifact, false)
                                        .then(commitArtifact(
                                                        commitDTO, baseArtifact, importedBranchedArtifact, false, false)
                                                .thenReturn(gitPullDTO));
                            });
                });
    }

    @Override
    public Mono<Map<String, GitProfile>> updateOrCreateGitProfileForCurrentUser(
            GitProfile gitProfile, String baseArtifactId) {

        // Throw error in following situations:
        // 1. Updating or creating global git profile (defaultApplicationId = "default") and update is made with empty
        //    authorName or authorEmail
        // 2. Updating or creating repo specific profile and user want to use repo specific profile but provided empty
        //    values for authorName and email

        if ((DEFAULT.equals(baseArtifactId) || Boolean.FALSE.equals(gitProfile.getUseGlobalProfile()))
                && StringUtils.isEmptyOrNull(gitProfile.getAuthorName())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Author Name"));
        } else if ((DEFAULT.equals(baseArtifactId) || Boolean.FALSE.equals(gitProfile.getUseGlobalProfile()))
                && StringUtils.isEmptyOrNull(gitProfile.getAuthorEmail())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Author Email"));
        } else if (StringUtils.isEmptyOrNull(baseArtifactId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ARTIFACT_ID));
        }

        if (DEFAULT.equals(baseArtifactId)) {
            gitProfile.setUseGlobalProfile(null);
        } else if (!Boolean.TRUE.equals(gitProfile.getUseGlobalProfile())) {
            gitProfile.setUseGlobalProfile(Boolean.FALSE);
        }

        return sessionUserService
                .getCurrentUser()
                .flatMap(user -> userService.findByEmail(user.getEmail()))
                .flatMap(user -> userDataService
                        .getForUser(user.getId())
                        .flatMap(userData -> {
                            // GitProfiles will be null if the user has not created any git profile.
                            GitProfile savedProfile = userData.getGitProfileByKey(baseArtifactId);
                            GitProfile defaultGitProfile = userData.getGitProfileByKey(DEFAULT);

                            if (savedProfile == null || !savedProfile.equals(gitProfile) || defaultGitProfile == null) {
                                userData.setGitProfiles(userData.setGitProfileByKey(baseArtifactId, gitProfile));

                                // Assign appsmith user profile as a fallback git profile
                                if (defaultGitProfile == null) {
                                    GitProfile userProfile = new GitProfile();
                                    String authorName = StringUtils.isEmptyOrNull(user.getName())
                                            ? user.getUsername().split("@")[0]
                                            : user.getName();
                                    userProfile.setAuthorEmail(user.getEmail());
                                    userProfile.setAuthorName(authorName);
                                    userProfile.setUseGlobalProfile(null);
                                    userData.setGitProfiles(userData.setGitProfileByKey(DEFAULT, userProfile));
                                }

                                // Update userData here
                                UserData requiredUpdates = new UserData();
                                requiredUpdates.setGitProfiles(userData.getGitProfiles());
                                return userDataService
                                        .updateForUser(user, requiredUpdates)
                                        .map(UserData::getGitProfiles);
                            }
                            return Mono.just(userData.getGitProfiles());
                        })
                        .switchIfEmpty(Mono.defer(() -> {
                            // If profiles are empty use Appsmith's user profile as git default profile
                            GitProfile profile = new GitProfile();
                            String authorName = StringUtils.isEmptyOrNull(user.getName())
                                    ? user.getUsername().split("@")[0]
                                    : user.getName();

                            profile.setAuthorName(authorName);
                            profile.setAuthorEmail(user.getEmail());

                            UserData requiredUpdates = new UserData();
                            requiredUpdates.setGitProfiles(Map.of(DEFAULT, gitProfile));
                            return userDataService
                                    .updateForUser(user, requiredUpdates)
                                    .map(UserData::getGitProfiles);
                        }))
                        .filter(profiles -> !CollectionUtils.isNullOrEmpty(profiles)));
    }

    @Override
    public Mono<Map<String, GitProfile>> updateOrCreateGitProfileForCurrentUser(GitProfile gitProfile) {
        gitProfile.setUseGlobalProfile(null);
        return updateOrCreateGitProfileForCurrentUser(gitProfile, DEFAULT);
    }

    @Override
    public Mono<GitProfile> getDefaultGitProfileOrCreateIfEmpty() {
        // Get default git profile if the default is empty then use Appsmith profile as a fallback value
        return getGitProfileForUser(DEFAULT).flatMap(gitProfile -> {
            if (StringUtils.isEmptyOrNull(gitProfile.getAuthorName())
                    || StringUtils.isEmptyOrNull(gitProfile.getAuthorEmail())) {
                return updateGitProfileWithAppsmithProfile(DEFAULT);
            }
            gitProfile.setUseGlobalProfile(null);
            return Mono.just(gitProfile);
        });
    }

    @Override
    public Mono<GitProfile> getGitProfileForUser(String baseArtifactId) {
        return userDataService.getForCurrentUser().map(userData -> {
            GitProfile gitProfile = userData.getGitProfileByKey(baseArtifactId);
            if (gitProfile != null && gitProfile.getUseGlobalProfile() == null) {
                gitProfile.setUseGlobalProfile(true);
            } else if (gitProfile == null) {
                // If the profile is requested for repo specific using the applicationId
                GitProfile gitProfile1 = new GitProfile();
                gitProfile1.setAuthorName("");
                gitProfile1.setAuthorEmail("");
                gitProfile1.setUseGlobalProfile(true);
                return gitProfile1;
            }
            return gitProfile;
        });
    }

    private Mono<GitProfile> updateGitProfileWithAppsmithProfile(String key) {
        return sessionUserService
                .getCurrentUser()
                .flatMap(user -> userService.findByEmail(user.getEmail()))
                .flatMap(currentUser -> {
                    GitProfile gitProfile = new GitProfile();
                    String authorName = StringUtils.isEmptyOrNull(currentUser.getName())
                            ? currentUser.getUsername().split("@")[0]
                            : currentUser.getName();
                    gitProfile.setAuthorEmail(currentUser.getEmail());
                    gitProfile.setAuthorName(authorName);
                    gitProfile.setUseGlobalProfile(null);
                    return userDataService.getForUser(currentUser).flatMap(userData -> {
                        UserData updates = new UserData();
                        if (CollectionUtils.isNullOrEmpty(userData.getGitProfiles())) {
                            updates.setGitProfiles(Map.of(key, gitProfile));
                        } else {
                            userData.getGitProfiles().put(key, gitProfile);
                            updates.setGitProfiles(userData.getGitProfiles());
                        }
                        return userDataService
                                .updateForUser(currentUser, updates)
                                .thenReturn(gitProfile);
                    });
                });
    }

    private Mono<? extends Artifact> addAnalyticsForGitOperation(
            AnalyticsEvents eventName, Artifact artifact, Boolean isRepoPrivate) {
        return addAnalyticsForGitOperation(eventName, artifact, "", "", isRepoPrivate, false);
    }

    private Mono<? extends Artifact> addAnalyticsForGitOperation(
            AnalyticsEvents eventName, String branchName, Artifact artifact) {
        return addAnalyticsForGitOperation(eventName, artifact, null, null, null, false, null, branchName);
    }

    private Mono<? extends Artifact> addAnalyticsForGitOperation(
            AnalyticsEvents eventName,
            Artifact artifact,
            String errorType,
            String errorMessage,
            Boolean isRepoPrivate) {
        return addAnalyticsForGitOperation(eventName, artifact, errorType, errorMessage, isRepoPrivate, false);
    }

    private Mono<? extends Artifact> addAnalyticsForGitOperation(
            AnalyticsEvents event,
            Artifact artifact,
            String errorType,
            String errorMessage,
            Boolean isRepoPrivate,
            Boolean isSystemGenerated) {
        return addAnalyticsForGitOperation(
                event, artifact, errorType, errorMessage, isRepoPrivate, isSystemGenerated, null);
    }

    private Mono<? extends Artifact> addAnalyticsForGitOperation(
            AnalyticsEvents event,
            Artifact artifact,
            String errorType,
            String errorMessage,
            Boolean isRepoPrivate,
            Boolean isSystemGenerated,
            Boolean isMergeable) {

        String branchName = artifact.getGitArtifactMetadata() != null
                ? artifact.getGitArtifactMetadata().getBranchName()
                : null;
        return addAnalyticsForGitOperation(
                event, artifact, errorType, errorMessage, isRepoPrivate, isSystemGenerated, isMergeable, branchName);
    }

    private Mono<? extends Artifact> addAnalyticsForGitOperation(
            AnalyticsEvents event,
            Artifact artifact,
            String errorType,
            String errorMessage,
            Boolean isRepoPrivate,
            Boolean isSystemGenerated,
            Boolean isMergeable,
            String branchName) {
        GitArtifactMetadata gitData = artifact.getGitArtifactMetadata();
        Map<String, Object> analyticsProps = new HashMap<>();
        if (gitData != null) {
            analyticsProps.put(FieldName.APPLICATION_ID, gitData.getDefaultArtifactId());
            analyticsProps.put("appId", gitData.getDefaultArtifactId());
            analyticsProps.put(FieldName.BRANCH_NAME, branchName);
            analyticsProps.put(FieldName.GIT_HOSTING_PROVIDER, GitUtils.getGitProviderName(gitData.getRemoteUrl()));
            analyticsProps.put(FieldName.REPO_URL, gitData.getRemoteUrl());
            if (event == AnalyticsEvents.GIT_COMMIT) {
                analyticsProps.put("isAutoCommit", false);
            }
        }
        // Do not include the error data points in the map for success states
        if (!StringUtils.isEmptyOrNull(errorMessage) || !StringUtils.isEmptyOrNull(errorType)) {
            analyticsProps.put("errorMessage", errorMessage);
            analyticsProps.put("errorType", errorType);
        }
        // Do not include the isMergeable for all the events
        if (isMergeable != null) {
            analyticsProps.put(FieldName.IS_MERGEABLE, isMergeable);
        }
        analyticsProps.putAll(Map.of(
                FieldName.ORGANIZATION_ID,
                defaultIfNull(artifact.getWorkspaceId(), ""),
                "orgId",
                defaultIfNull(artifact.getWorkspaceId(), ""),
                "branchApplicationId",
                defaultIfNull(artifact.getId(), ""),
                "isRepoPrivate",
                defaultIfNull(isRepoPrivate, ""),
                "isSystemGenerated",
                defaultIfNull(isSystemGenerated, "")));
        final Map<String, Object> eventData =
                Map.of(FieldName.APP_MODE, ApplicationMode.EDIT.toString(), FieldName.APPLICATION, artifact);
        analyticsProps.put(FieldName.EVENT_DATA, eventData);
        return sessionUserService.getCurrentUser().flatMap(user -> analyticsService
                .sendEvent(event.getEventName(), user.getUsername(), analyticsProps)
                .thenReturn(artifact));
    }

    private boolean isBaseGitMetadataInvalid(GitArtifactMetadata gitArtifactMetadata) {
        return Optional.ofNullable(gitArtifactMetadata).isEmpty()
                || Optional.ofNullable(gitArtifactMetadata.getGitAuth()).isEmpty()
                || StringUtils.isEmptyOrNull(gitArtifactMetadata.getGitAuth().getPrivateKey())
                || StringUtils.isEmptyOrNull(gitArtifactMetadata.getGitAuth().getPublicKey());
    }

    @Override
    public Mono<? extends Artifact> deleteBranch(String baseArtifactId, String branchName, ArtifactType artifactType) {

        if (!hasText(branchName)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, BRANCH_NAME));
        }

        if (!hasText(baseArtifactId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<? extends Artifact> baseArtifactMono =
                gitArtifactHelper.getArtifactById(baseArtifactId, artifactEditPermission);
        Mono<? extends Artifact> branchedArtifactMono =
                gitArtifactHelper.getArtifactByBaseIdAndBranchName(baseArtifactId, branchName, artifactEditPermission);

        Mono<? extends Artifact> deleteBranchMono = Mono.zip(baseArtifactMono, branchedArtifactMono)
                .flatMap(artifactTuples -> {
                    Artifact baseArtifact = artifactTuples.getT1();
                    Artifact branchedArtifact = artifactTuples.getT2();

                    GitArtifactMetadata baseGitMetadata = baseArtifact.getGitArtifactMetadata();
                    GitArtifactMetadata branchedGitMetadata = branchedArtifact.getGitArtifactMetadata();
                    final String finalBranchName = branchedGitMetadata.getBranchName();

                    return gitPrivateRepoHelper
                            .isBranchProtected(baseGitMetadata, finalBranchName)
                            .flatMap(isBranchProtected -> {
                                if (!TRUE.equals(isBranchProtected)) {
                                    return addFileLock(
                                            baseGitMetadata.getDefaultArtifactId(), GitCommandConstants.DELETE);
                                }

                                return Mono.error(new AppsmithException(
                                        AppsmithError.GIT_ACTION_FAILED,
                                        "delete",
                                        "Cannot delete protected branch " + finalBranchName));
                            })
                            .thenReturn(artifactTuples);
                })
                .flatMap(artifactTuples -> {
                    Artifact baseArtifact = artifactTuples.getT1();
                    Artifact branchedArtifact = artifactTuples.getT2();

                    GitArtifactMetadata baseGitMetadata = baseArtifact.getGitArtifactMetadata();
                    GitArtifactMetadata branchedGitMetadata = branchedArtifact.getGitArtifactMetadata();
                    final String finalBranchName = branchedGitMetadata.getBranchName();

                    Path repoPath = gitArtifactHelper.getRepoSuffixPath(
                            baseArtifact.getWorkspaceId(),
                            baseGitMetadata.getDefaultArtifactId(),
                            baseGitMetadata.getRepoName());

                    if (finalBranchName.equals(baseGitMetadata.getDefaultBranchName())) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.GIT_ACTION_FAILED, "delete branch", " Cannot delete default branch"));
                    }

                    return gitExecutor
                            .deleteBranch(repoPath, finalBranchName)
                            .onErrorResume(throwable -> {
                                log.error("Delete branch failed {}", throwable.getMessage());
                                if (throwable instanceof CannotDeleteCurrentBranchException) {
                                    return Mono.error(new AppsmithException(
                                            AppsmithError.GIT_ACTION_FAILED,
                                            "delete branch",
                                            "Cannot delete current checked out branch"));
                                }
                                return Mono.error(new AppsmithException(
                                        AppsmithError.GIT_ACTION_FAILED, "delete branch", throwable.getMessage()));
                            })
                            .flatMap(isBranchDeleted ->
                                    releaseFileLock(baseArtifactId).map(status -> isBranchDeleted))
                            .flatMap(isBranchDeleted -> {
                                if (FALSE.equals(isBranchDeleted)) {
                                    return Mono.error(new AppsmithException(
                                            AppsmithError.GIT_ACTION_FAILED,
                                            " delete branch. Branch does not exists in the repo"));
                                }

                                if (branchedArtifact.getId().equals(branchedGitMetadata.getDefaultArtifactId())) {
                                    return Mono.just(branchedArtifact);
                                }

                                return gitArtifactHelper
                                        .deleteArtifactByResource(branchedArtifact)
                                        .onErrorResume(throwable -> {
                                            return addAnalyticsForGitOperation(
                                                            AnalyticsEvents.GIT_DELETE_BRANCH,
                                                            branchedArtifact,
                                                            throwable.getClass().getName(),
                                                            throwable.getMessage(),
                                                            baseGitMetadata.getIsRepoPrivate())
                                                    .then(Mono.error(new AppsmithException(
                                                            AppsmithError.GIT_ACTION_FAILED,
                                                            "Cannot delete branch from database")));
                                        });
                            });
                })
                .flatMap(branchedArtifact -> addAnalyticsForGitOperation(
                        AnalyticsEvents.GIT_DELETE_BRANCH,
                        branchedArtifact,
                        branchedArtifact.getGitArtifactMetadata().getIsRepoPrivate()))
                .name(GitSpan.OPS_DELETE_BRANCH)
                .tap(Micrometer.observation(observationRegistry));

        return Mono.create(sink -> deleteBranchMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    @Override
    public Mono<? extends Artifact> discardChanges(String branchedArtifactId, ArtifactType artifactType) {

        if (!hasText(branchedArtifactId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID));
        }

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<? extends Artifact> branchedArtifactMonoCached =
                gitArtifactHelper.getArtifactById(branchedArtifactId, artifactEditPermission);
        Mono<? extends Artifact> discardChangeMono;

        // Rehydrate the artifact from local file system
        discardChangeMono = branchedArtifactMonoCached
                .flatMap(branchedArtifact -> {
                    GitArtifactMetadata branchedGitData = branchedArtifact.getGitArtifactMetadata();
                    if (branchedGitData == null || !hasText(branchedGitData.getDefaultArtifactId())) {
                        return Mono.error(
                                new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
                    }

                    return addFileLock(branchedGitData.getDefaultArtifactId(), GitCommandConstants.DISCARD)
                            .thenReturn(branchedArtifact);
                })
                .flatMap(branchedArtifact -> {
                    GitArtifactMetadata branchedGitData = branchedArtifact.getGitArtifactMetadata();
                    final String branchName = branchedGitData.getBranchName();
                    final String defaultArtifactId = branchedGitData.getDefaultArtifactId();
                    final String repoName = branchedGitData.getRepoName();
                    final String workspaceId = branchedArtifact.getWorkspaceId();

                    Path repoSuffix = Paths.get(workspaceId, defaultArtifactId, repoName);

                    return gitExecutor
                            .rebaseBranch(repoSuffix, branchName)
                            .flatMap(rebaseStatus -> {
                                return commonGitFileUtils.reconstructArtifactExchangeJsonFromGitRepoWithAnalytics(
                                        workspaceId, defaultArtifactId, repoName, branchName, artifactType);
                            })
                            .onErrorResume(throwable -> {
                                log.error("Git Discard & Rebase failed {}", throwable.getMessage());
                                return Mono.error(
                                        new AppsmithException(
                                                AppsmithError.GIT_ACTION_FAILED,
                                                "discard changes",
                                                "Please create a new branch and resolve the conflicts on remote repository before proceeding ahead."));
                            })
                            .flatMap(artifactExchangeJson -> importService.importArtifactInWorkspaceFromGit(
                                    branchedArtifact.getWorkspaceId(),
                                    branchedArtifact.getId(),
                                    artifactExchangeJson,
                                    branchName))
                            // Update the last deployed status after the rebase
                            .flatMap(importedArtifact -> publishArtifact(importedArtifact, true));
                })
                .flatMap(branchedArtifact -> releaseFileLock(
                                branchedArtifact.getGitArtifactMetadata().getDefaultArtifactId())
                        .then(this.addAnalyticsForGitOperation(
                                AnalyticsEvents.GIT_DISCARD_CHANGES, branchedArtifact, null)))
                .name(GitSpan.OPS_DISCARD_CHANGES)
                .tap(Micrometer.observation(observationRegistry));

        return Mono.create(
                sink -> discardChangeMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    @Override
    public Mono<MergeStatusDTO> mergeBranch(
            String branchedArtifactId, GitMergeDTO gitMergeDTO, ArtifactType artifactType) {
        /*
         * 1.Dehydrate the artifact from Mongodb so that the file system has the latest artifact data for both the source and destination branch artifact
         * 2.Do git checkout destinationBranch ---> git merge sourceBranch after the rehydration
         *   On Merge conflict - create new branch and push the changes to remote and ask the user to resolve it on Github/Gitlab UI
         * 3.Then rehydrate from the file system to mongodb so that the latest changes from remote are rendered to the artifact
         * 4.Get the latest artifact mono from the mongodb and send it back to client
         * */

        final String sourceBranch = gitMergeDTO.getSourceBranch();
        final String destinationBranch = gitMergeDTO.getDestinationBranch();

        if (StringUtils.isEmptyOrNull(sourceBranch) || StringUtils.isEmptyOrNull(destinationBranch)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        } else if (sourceBranch.startsWith(ORIGIN)) {
            return Mono.error(
                    new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION_FOR_REMOTE_BRANCH, sourceBranch));
        } else if (destinationBranch.startsWith(ORIGIN)) {
            return Mono.error(
                    new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION_FOR_REMOTE_BRANCH, destinationBranch));
        }

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<Tuple2<? extends Artifact, ? extends Artifact>> baseAndBranchedArtifactsMono =
                getBaseAndBranchedArtifacts(branchedArtifactId, artifactType).cache();

        Mono<? extends Artifact> destinationArtifactMono = baseAndBranchedArtifactsMono.flatMap(artifactTuples -> {
            Artifact baseArtifact = artifactTuples.getT1();
            if (destinationBranch.equals(baseArtifact.getGitArtifactMetadata().getBranchName())) {
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
                    if (isBaseGitMetadataInvalid(baseArtifact.getGitArtifactMetadata())) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                    }

                    final String workspaceId = baseArtifact.getWorkspaceId();
                    final String baseArtifactId = baseGitMetadata.getDefaultArtifactId();
                    final String repoName = baseGitMetadata.getRepoName();

                    final String publicKey = baseGitMetadata.getGitAuth().getPublicKey();
                    final String privateKey = baseGitMetadata.getGitAuth().getPrivateKey();

                    Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(workspaceId, baseArtifactId, repoName);

                    // 1. Hydrate from db to file system for both branch Applications
                    // Update function call
                    Mono<Path> pathFileMono = addFileLock(baseArtifactId, GitCommandConstants.MERGE_BRANCH)
                            .flatMap(fileLock -> gitExecutor.fetchRemote(
                                    repoSuffix, publicKey, privateKey, false, sourceBranch, destinationBranch))
                            .flatMap(fetchMessage -> {
                                Mono<GitStatusDTO> sourceBranchStatusMono =
                                        Mono.defer(() -> getStatus(baseArtifact, sourceArtifact, false, false)
                                                .flatMap(srcBranchStatus -> {
                                                    if (!Integer.valueOf(0).equals(srcBranchStatus.getBehindCount())) {
                                                        return releaseFileLock(baseArtifactId)
                                                                .then(Mono.error(new AppsmithException(
                                                                        AppsmithError.GIT_MERGE_FAILED_REMOTE_CHANGES,
                                                                        srcBranchStatus.getBehindCount(),
                                                                        sourceBranch)));
                                                    } else if (!srcBranchStatus.getIsClean()) {
                                                        return releaseFileLock(baseArtifactId)
                                                                .then(Mono.error(new AppsmithException(
                                                                        AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES,
                                                                        sourceBranch)));
                                                    }

                                                    return Mono.just(srcBranchStatus);
                                                }));

                                Mono<GitStatusDTO> destinationBranchStatusMono = Mono.defer(() -> getStatus(
                                                baseArtifact, destinationArtifact, false, false)
                                        .flatMap(destinationBranchStatus -> {
                                            if (!Integer.valueOf(0).equals(destinationBranchStatus.getBehindCount())) {
                                                return releaseFileLock(baseArtifactId)
                                                        .then(Mono.error(new AppsmithException(
                                                                AppsmithError.GIT_MERGE_FAILED_REMOTE_CHANGES,
                                                                destinationBranchStatus.getBehindCount(),
                                                                destinationBranch)));
                                            } else if (!destinationBranchStatus.getIsClean()) {
                                                return releaseFileLock(baseArtifactId)
                                                        .then(Mono.error(new AppsmithException(
                                                                AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES,
                                                                destinationBranch)));
                                            }
                                            return Mono.just(destinationBranchStatus);
                                        }));

                                return sourceBranchStatusMono.then(destinationBranchStatusMono);
                            })
                            .thenReturn(repoSuffix)
                            .onErrorResume(error -> {
                                log.error("Error in repo status check for application " + branchedArtifactId, error);
                                if (error instanceof AppsmithException) {
                                    return releaseFileLock(baseArtifactId).then(Mono.error(error));
                                }
                                return releaseFileLock(baseArtifactId)
                                        .then(Mono.error(new AppsmithException(
                                                AppsmithError.GIT_ACTION_FAILED, "status", error)));
                            });

                    return pathFileMono
                            // 2. git checkout destinationBranch ---> git merge sourceBranch
                            .then(Mono.defer(() -> gitExecutor.mergeBranch(repoSuffix, sourceBranch, destinationBranch))
                                    .onErrorResume(error -> addAnalyticsForGitOperation(
                                                    AnalyticsEvents.GIT_MERGE,
                                                    baseArtifact,
                                                    error.getClass().getName(),
                                                    error.getMessage(),
                                                    baseArtifact
                                                            .getGitArtifactMetadata()
                                                            .getIsRepoPrivate())
                                            .flatMap(artifact -> releaseFileLock(baseArtifactId)
                                                    .thenReturn(artifact))
                                            .flatMap(artifact -> {
                                                if (error instanceof GitAPIException) {
                                                    return Mono.error(new AppsmithException(
                                                            AppsmithError.GIT_MERGE_CONFLICTS, error.getMessage()));
                                                }
                                                return Mono.error(new AppsmithException(
                                                        AppsmithError.GIT_ACTION_FAILED, "merge", error.getMessage()));
                                            })))
                            // 3. rehydrate from file system to db
                            .zipWhen(mergeStatus ->
                                    Mono.defer(() -> commonGitFileUtils.reconstructArtifactExchangeJsonFromGitRepo(
                                            workspaceId, baseArtifactId, repoName, destinationBranch, artifactType)))
                            .flatMap(tuple -> {
                                ArtifactExchangeJson artifactExchangeJson = tuple.getT2();
                                MergeStatusDTO mergeStatusDTO = new MergeStatusDTO();
                                mergeStatusDTO.setStatus(tuple.getT1());
                                mergeStatusDTO.setMergeAble(TRUE);

                                // 4. Get the latest artifact mono with all the changes
                                return importService
                                        .importArtifactInWorkspaceFromGit(
                                                workspaceId,
                                                destinationArtifact.getId(),
                                                artifactExchangeJson,
                                                destinationBranch.replaceFirst(ORIGIN, REMOTE_NAME_REPLACEMENT))
                                        .flatMap(importedDestinationArtifact -> {
                                            GitCommitDTO commitDTO = new GitCommitDTO();
                                            commitDTO.setDoPush(true);
                                            commitDTO.setCommitMessage(DEFAULT_COMMIT_MESSAGE
                                                    + GitDefaultCommitMessage.SYNC_REMOTE_AFTER_MERGE.getReason()
                                                    + sourceBranch);

                                            return this.commitArtifact(
                                                            commitDTO,
                                                            importedDestinationArtifact.getId(),
                                                            artifactType)
                                                    .map(commitStatus -> mergeStatusDTO)
                                                    .zipWith(Mono.just(importedDestinationArtifact));
                                        });
                            })
                            .flatMap(tuple -> {
                                MergeStatusDTO mergeStatusDTO = tuple.getT1();
                                Artifact artifact = tuple.getT2();

                                // Send analytics event
                                return releaseFileLock(baseArtifactId).flatMap(status -> addAnalyticsForGitOperation(
                                                AnalyticsEvents.GIT_MERGE,
                                                artifact,
                                                artifact.getGitArtifactMetadata()
                                                        .getIsRepoPrivate())
                                        .thenReturn(mergeStatusDTO));
                            })
                            .onErrorResume(
                                    error -> releaseFileLock(baseArtifactId).then(Mono.error(error)));
                })
                .name(GitSpan.OPS_MERGE_BRANCH)
                .tap(Micrometer.observation(observationRegistry));

        return Mono.create(sink -> mergeMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    @Override
    public Mono<MergeStatusDTO> isBranchMergeable(
            String branchedArtifactId, GitMergeDTO gitMergeDTO, ArtifactType artifactType) {

        final String sourceBranch = gitMergeDTO.getSourceBranch();
        final String destinationBranch = gitMergeDTO.getDestinationBranch();

        if (StringUtils.isEmptyOrNull(sourceBranch) || StringUtils.isEmptyOrNull(destinationBranch)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        } else if (sourceBranch.startsWith(ORIGIN)) {
            return Mono.error(
                    new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION_FOR_REMOTE_BRANCH, sourceBranch));
        } else if (destinationBranch.startsWith(ORIGIN)) {
            return Mono.error(
                    new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION_FOR_REMOTE_BRANCH, destinationBranch));
        }

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<Tuple2<? extends Artifact, ? extends Artifact>> baseAndBranchedArtifactsMono =
                getBaseAndBranchedArtifacts(branchedArtifactId, artifactType).cache();

        Mono<? extends Artifact> destinationArtifactMono = baseAndBranchedArtifactsMono.flatMap(artifactTuples -> {
            Artifact baseArtifact = artifactTuples.getT1();
            if (destinationBranch.equals(baseArtifact.getGitArtifactMetadata().getBranchName())) {
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
                    if (isBaseGitMetadataInvalid(baseArtifact.getGitArtifactMetadata())) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                    }

                    final String workspaceId = baseArtifact.getWorkspaceId();
                    final String baseArtifactId = baseGitMetadata.getDefaultArtifactId();
                    final String repoName = baseGitMetadata.getRepoName();

                    final String publicKey = baseGitMetadata.getGitAuth().getPublicKey();
                    final String privateKey = baseGitMetadata.getGitAuth().getPrivateKey();

                    Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(workspaceId, baseArtifactId, repoName);

                    // 1. Hydrate from db to file system for both branch Applications
                    // Update function call
                    return addFileLock(baseArtifactId, GitCommandConstants.STATUS)
                            .flatMap(fileLock -> gitExecutor.fetchRemote(
                                    repoSuffix, publicKey, privateKey, false, sourceBranch, destinationBranch))
                            .flatMap(fetchMessage -> {
                                return getStatus(baseArtifact, sourceArtifact, false, false)
                                        .flatMap(srcBranchStatus -> {
                                            if (!Integer.valueOf(0).equals(srcBranchStatus.getBehindCount())) {
                                                return addAnalyticsForGitOperation(
                                                                AnalyticsEvents.GIT_MERGE_CHECK,
                                                                baseArtifact,
                                                                AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES.name(),
                                                                AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES.getMessage(
                                                                        srcBranchStatus.getBehindCount(),
                                                                        destinationBranch),
                                                                baseArtifact
                                                                        .getGitArtifactMetadata()
                                                                        .getIsRepoPrivate(),
                                                                false,
                                                                false)
                                                        .then(releaseFileLock(baseArtifactId))
                                                        .then(Mono.error(Exceptions.propagate(new AppsmithException(
                                                                AppsmithError.GIT_MERGE_FAILED_REMOTE_CHANGES,
                                                                srcBranchStatus.getBehindCount(),
                                                                sourceBranch))));
                                            } else if (!srcBranchStatus.getIsClean()) {
                                                return addAnalyticsForGitOperation(
                                                                AnalyticsEvents.GIT_MERGE_CHECK,
                                                                baseArtifact,
                                                                AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES.name(),
                                                                AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES.getMessage(
                                                                        destinationBranch),
                                                                baseArtifact
                                                                        .getGitArtifactMetadata()
                                                                        .getIsRepoPrivate(),
                                                                false,
                                                                false)
                                                        .then(releaseFileLock(baseArtifactId))
                                                        .then(Mono.error(Exceptions.propagate(new AppsmithException(
                                                                AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES,
                                                                sourceBranch))));
                                            }

                                            return Mono.just(srcBranchStatus);
                                        })
                                        .flatMap(srcBranchStatus -> {
                                            return getStatus(baseArtifact, destinationArtifact, false, false)
                                                    .flatMap(destBranchStatus -> {
                                                        if (!Integer.valueOf(0)
                                                                .equals(destBranchStatus.getBehindCount())) {
                                                            return addAnalyticsForGitOperation(
                                                                            AnalyticsEvents.GIT_MERGE_CHECK,
                                                                            baseArtifact,
                                                                            AppsmithError
                                                                                    .GIT_MERGE_FAILED_REMOTE_CHANGES
                                                                                    .name(),
                                                                            AppsmithError
                                                                                    .GIT_MERGE_FAILED_REMOTE_CHANGES
                                                                                    .getMessage(
                                                                                            destBranchStatus
                                                                                                    .getBehindCount(),
                                                                                            destinationBranch),
                                                                            baseArtifact
                                                                                    .getGitArtifactMetadata()
                                                                                    .getIsRepoPrivate(),
                                                                            false,
                                                                            false)
                                                                    .then(releaseFileLock(baseArtifactId))
                                                                    .then(Mono.error(Exceptions.propagate(
                                                                            new AppsmithException(
                                                                                    AppsmithError
                                                                                            .GIT_MERGE_FAILED_REMOTE_CHANGES,
                                                                                    destBranchStatus.getBehindCount(),
                                                                                    destinationBranch))));
                                                        } else if (!destBranchStatus.getIsClean()) {
                                                            return addAnalyticsForGitOperation(
                                                                            AnalyticsEvents.GIT_MERGE_CHECK,
                                                                            baseArtifact,
                                                                            AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES
                                                                                    .name(),
                                                                            AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES
                                                                                    .getMessage(destinationBranch),
                                                                            baseArtifact
                                                                                    .getGitArtifactMetadata()
                                                                                    .getIsRepoPrivate(),
                                                                            false,
                                                                            false)
                                                                    .then(releaseFileLock(baseArtifactId))
                                                                    .then(Mono.error(Exceptions.propagate(
                                                                            new AppsmithException(
                                                                                    AppsmithError
                                                                                            .GIT_MERGE_FAILED_LOCAL_CHANGES,
                                                                                    destinationBranch))));
                                                        }
                                                        return Mono.just(destBranchStatus);
                                                    });
                                        })
                                        .onErrorResume(error -> {
                                            log.error(
                                                    "Error in merge status check baseArtifact " + branchedArtifactId,
                                                    error);
                                            if (error instanceof AppsmithException) {
                                                return Mono.error(error);
                                            }
                                            return releaseFileLock(baseArtifactId)
                                                    .then(Mono.error(new AppsmithException(
                                                            AppsmithError.GIT_ACTION_FAILED, "status", error)));
                                        })
                                        .then(gitExecutor
                                                .isMergeBranch(repoSuffix, sourceBranch, destinationBranch)
                                                .flatMap(mergeStatusDTO -> releaseFileLock(baseArtifactId)
                                                        .flatMap(mergeStatus -> addAnalyticsForGitOperation(
                                                                AnalyticsEvents.GIT_MERGE_CHECK,
                                                                baseArtifact,
                                                                null,
                                                                null,
                                                                baseArtifact
                                                                        .getGitArtifactMetadata()
                                                                        .getIsRepoPrivate(),
                                                                false,
                                                                mergeStatusDTO.isMergeAble()))
                                                        .then(Mono.just(mergeStatusDTO))))
                                        .onErrorResume(error -> {
                                            try {
                                                return gitExecutor
                                                        .resetToLastCommit(repoSuffix, destinationBranch)
                                                        .map(reset -> {
                                                            MergeStatusDTO mergeStatus = new MergeStatusDTO();
                                                            mergeStatus.setMergeAble(false);
                                                            mergeStatus.setStatus("Merge check failed!");
                                                            mergeStatus.setMessage(error.getMessage());
                                                            if (error instanceof CheckoutConflictException) {
                                                                mergeStatus.setConflictingFiles(
                                                                        ((CheckoutConflictException) error)
                                                                                .getConflictingPaths());
                                                            }
                                                            mergeStatus.setReferenceDoc(
                                                                    ErrorReferenceDocUrl.GIT_MERGE_CONFLICT
                                                                            .getDocUrl());
                                                            return mergeStatus;
                                                        })
                                                        .flatMap(mergeStatusDTO -> addAnalyticsForGitOperation(
                                                                        AnalyticsEvents.GIT_MERGE_CHECK,
                                                                        baseArtifact,
                                                                        error.getClass()
                                                                                .getName(),
                                                                        error.getMessage(),
                                                                        baseArtifact
                                                                                .getGitArtifactMetadata()
                                                                                .getIsRepoPrivate(),
                                                                        false,
                                                                        false)
                                                                .flatMap(application1 -> releaseFileLock(baseArtifactId)
                                                                        .thenReturn(mergeStatusDTO)));
                                            } catch (GitAPIException | IOException e) {
                                                log.error("Error while resetting to last commit", e);
                                                return Mono.error(new AppsmithException(
                                                        AppsmithError.GIT_ACTION_FAILED,
                                                        "reset --hard HEAD",
                                                        e.getMessage()));
                                            }
                                        });
                            });
                });

        return Mono.create(
                sink -> mergeableStatusMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    /**
     * In some scenarios:
     * connect: after loading the modal, keyTypes is not available, so a network call has to be made to ssh-keypair.
     * import: cannot make a ssh-keypair call because application Id doesn’t exist yet, so API fails.
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
    public Mono<List<GitBranchDTO>> listBranchForArtifact(
            String branchedArtifactId, Boolean pruneBranches, ArtifactType artifactType) {
        return getBranchList(branchedArtifactId, pruneBranches, true, artifactType);
    }

    protected Mono<List<GitBranchDTO>> getBranchList(
            String branchedArtifactId,
            Boolean pruneBranches,
            boolean syncDefaultBranchWithRemote,
            ArtifactType artifactType) {

        // get the root artifact
        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<Tuple2<? extends Artifact, ? extends Artifact>> baseAndBranchedArtifactMono =
                getBaseAndBranchedArtifacts(branchedArtifactId, artifactType, artifactEditPermission);

        Mono<List<GitBranchDTO>> branchMono = baseAndBranchedArtifactMono
                .flatMap(artifactTuples -> {
                    Artifact baseArtifact = artifactTuples.getT1();
                    Artifact branchedArtifact = artifactTuples.getT2();

                    GitArtifactMetadata baseGitData = baseArtifact.getGitArtifactMetadata();
                    GitArtifactMetadata branchedGitData = branchedArtifact.getGitArtifactMetadata();

                    if (baseGitData == null || branchedGitData == null) {
                        return Mono.error(
                                new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
                    }

                    final String workspaceId = baseArtifact.getWorkspaceId();
                    final String baseArtifactId = baseGitData.getDefaultArtifactId();
                    final String repoName = baseGitData.getRepoName();
                    final String currentBranch = branchedGitData.getBranchName();

                    if (!hasText(baseArtifactId) || !hasText(repoName) || !hasText(currentBranch)) {
                        log.error(
                                "Git config is not present for artifact {} of type {}",
                                baseArtifact.getId(),
                                artifactType);
                        return Mono.error(
                                new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
                    }

                    Path repoPath = gitArtifactHelper.getRepoSuffixPath(workspaceId, baseArtifactId, repoName);
                    Mono<String> baseBranchMono;

                    if (TRUE.equals(pruneBranches) && syncDefaultBranchWithRemote) {
                        baseBranchMono = syncDefaultBranchNameFromRemote(baseArtifact, repoPath);
                    } else {
                        baseBranchMono =
                                Mono.just(GitUtils.getDefaultBranchName(baseArtifact.getGitArtifactMetadata()));
                    }

                    return baseBranchMono
                            .flatMap(baseBranchName -> {
                                return getBranchListWithDefaultBranchName(
                                        baseArtifact, repoPath, baseBranchName, currentBranch, pruneBranches);
                            })
                            .onErrorResume(throwable -> {
                                if (throwable instanceof RepositoryNotFoundException) {
                                    return handleRepoNotFoundException(baseArtifactId, artifactType);
                                }
                                return Mono.error(throwable);
                            });
                })
                .onErrorResume(Mono::error);

        return Mono.create(sink -> branchMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    private Mono<String> syncDefaultBranchNameFromRemote(Artifact baseArtifact, Path repoPath) {
        GitArtifactMetadata metadata = baseArtifact.getGitArtifactMetadata();
        GitAuth gitAuth = metadata.getGitAuth();
        return addFileLock(metadata.getDefaultArtifactId(), GitCommandConstants.SYNC_BRANCH)
                .then(gitExecutor.getRemoteDefaultBranch(
                        repoPath, metadata.getRemoteUrl(), gitAuth.getPrivateKey(), gitAuth.getPublicKey()))
                .flatMap(defaultBranchNameInRemote -> {
                    String defaultBranchInDb = GitUtils.getDefaultBranchName(metadata);
                    if (StringUtils.isEmptyOrNull(defaultBranchNameInRemote)) {
                        // If the default branch name in remote is empty or same as the one in DB, nothing to do
                        return Mono.just(defaultBranchInDb);
                    }
                    // check if default branch has been changed in remote
                    if (defaultBranchNameInRemote.equals(defaultBranchInDb)) {
                        return Mono.just(defaultBranchNameInRemote);
                    }

                    return updateDefaultBranchName(
                                    metadata.getDefaultArtifactId(),
                                    defaultBranchNameInRemote,
                                    repoPath,
                                    baseArtifact.getArtifactType())
                            .then()
                            .thenReturn(defaultBranchNameInRemote);
                })
                .flatMap(branchName ->
                        releaseFileLock(metadata.getDefaultArtifactId()).thenReturn(branchName));
    }

    private Flux<? extends Artifact> updateDefaultBranchName(
            String baseArtifactId, String defaultBranchName, Path repoPath, ArtifactType artifactType) {
        // Get the artifact from DB by new defaultBranch name
        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();
        Mono<Artifact> artifactMono = gitArtifactHelper
                .getArtifactByBaseIdAndBranchName(baseArtifactId, defaultBranchName, artifactEditPermission)
                .map(artifact -> (Artifact) artifact);

        Mono<? extends Artifact> fallbackArtifactMono =
                Mono.defer(() -> checkoutRemoteBranch(baseArtifactId, defaultBranchName, artifactType));

        // Check if the branch is already present, If not follow checkout remote flow
        return artifactMono
                .onErrorResume(throwable -> fallbackArtifactMono)
                // ensure the local branch exists
                .then(gitExecutor
                        .createAndCheckoutToBranch(repoPath, defaultBranchName)
                        .onErrorComplete())
                // Update the default branch name in all the child applications
                .thenMany(gitArtifactHelper.getAllArtifactByBaseId(baseArtifactId, artifactEditPermission))
                .flatMap(artifact -> {
                    artifact.getGitArtifactMetadata().setDefaultBranchName(defaultBranchName);
                    // clear the branch protection rules as the default branch name has been changed
                    artifact.getGitArtifactMetadata().setBranchProtectionRules(null);
                    return gitArtifactHelper.saveArtifact(artifact);
                });
    }

    private Mono<List<GitBranchDTO>> handleRepoNotFoundException(String baseArtifactId, ArtifactType artifactType) {

        // clone application to the local filesystem again and update the defaultBranch for the application
        // list branch and compare with branch applications and checkout if not exists

        // get the root artifact
        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();
        AclPermission artifactReadPermission = gitArtifactHelper.getArtifactReadPermission();

        Mono<? extends Artifact> baseArtifactMono =
                gitArtifactHelper.getArtifactById(baseArtifactId, artifactEditPermission);

        return baseArtifactMono.flatMap(baseArtifact -> {
            GitArtifactMetadata gitArtifactMetadata = baseArtifact.getGitArtifactMetadata();
            Path repoPath = gitArtifactHelper.getRepoSuffixPath(
                    baseArtifact.getWorkspaceId(), baseArtifact.getId(), gitArtifactMetadata.getRepoName());
            GitAuth gitAuth = gitArtifactMetadata.getGitAuth();
            return gitExecutor
                    .cloneRemoteIntoArtifactRepo(
                            repoPath,
                            gitArtifactMetadata.getRemoteUrl(),
                            gitAuth.getPrivateKey(),
                            gitAuth.getPublicKey())
                    .flatMap(defaultBranch -> gitExecutor.listBranches(repoPath))
                    .flatMap(gitBranchDTOList -> {
                        List<String> branchesToCheckout = new ArrayList<>();
                        for (GitBranchDTO gitBranchDTO : gitBranchDTOList) {
                            if (gitBranchDTO.getBranchName().startsWith("origin/")) {
                                // remove origin/ prefix from the remote branch name
                                String branchName = gitBranchDTO.getBranchName().replace("origin/", "");
                                // The root defaultArtifact is always there, no need to check out it again
                                if (!branchName.equals(gitArtifactMetadata.getBranchName())) {
                                    branchesToCheckout.add(branchName);
                                }
                            } else if (gitBranchDTO
                                    .getBranchName()
                                    .equals(gitArtifactMetadata.getDefaultBranchName())) {
                                /*
                                 We just cloned from the remote default branch.
                                 Update the isDefault flag If it's also set as default in DB
                                */
                                gitBranchDTO.setDefault(true);
                            }
                        }

                        return Flux.fromIterable(branchesToCheckout)
                                .flatMap(branchName -> gitArtifactHelper
                                        .getArtifactByBaseIdAndBranchName(
                                                baseArtifactId, branchName, artifactReadPermission)
                                        // checkout the branch locally
                                        .flatMap(artifact -> {
                                            // Add the locally checked out branch to the branchList
                                            GitBranchDTO gitBranchDTO = new GitBranchDTO();
                                            gitBranchDTO.setBranchName(branchName);
                                            // set the default branch flag if there's a match.
                                            // This can happen when user has changed the default branch other
                                            // than
                                            // remote
                                            gitBranchDTO.setDefault(gitArtifactMetadata
                                                    .getDefaultBranchName()
                                                    .equals(branchName));
                                            gitBranchDTOList.add(gitBranchDTO);
                                            return gitExecutor.checkoutRemoteBranch(repoPath, branchName);
                                        })
                                        // Return empty mono when the branched defaultArtifact is not in db
                                        .onErrorResume(throwable -> Mono.empty()))
                                .then(Mono.just(gitBranchDTOList));
                    });
        });
    }

    private Mono<List<GitBranchDTO>> getBranchListWithDefaultBranchName(
            Artifact baseArtifact,
            Path repoPath,
            String defaultBranchName,
            String currentBranch,
            boolean pruneBranches) {
        return addFileLock(baseArtifact.getId(), GitCommandConstants.LIST_BRANCH)
                .flatMap(objects -> {
                    GitArtifactMetadata gitArtifactMetadata = baseArtifact.getGitArtifactMetadata();

                    if (TRUE.equals(pruneBranches)) {
                        return gitExecutor
                                .fetchRemote(
                                        repoPath,
                                        gitArtifactMetadata.getGitAuth().getPublicKey(),
                                        gitArtifactMetadata.getGitAuth().getPrivateKey(),
                                        false,
                                        currentBranch,
                                        true)
                                .then(gitExecutor.listBranches(repoPath));
                    } else {
                        return gitExecutor.listBranches(repoPath);
                    }
                })
                .flatMap(branchDTOList -> releaseFileLock(baseArtifact.getId()).thenReturn(branchDTOList))
                .map(branchDTOList -> {
                    for (GitBranchDTO branchDTO : branchDTOList) {
                        if (StringUtils.equalsIgnoreCase(branchDTO.getBranchName(), defaultBranchName)) {
                            branchDTO.setDefault(true);
                            break;
                        }
                    }
                    return branchDTOList;
                })
                .flatMap(gitBranchDTOList -> FALSE.equals(pruneBranches)
                        ? Mono.just(gitBranchDTOList)
                        : addAnalyticsForGitOperation(
                                        AnalyticsEvents.GIT_PRUNE,
                                        baseArtifact,
                                        baseArtifact.getGitArtifactMetadata().getIsRepoPrivate())
                                .thenReturn(gitBranchDTOList));
    }

    @Override
    public Mono<List<String>> getProtectedBranches(String baseArtifactId, ArtifactType artifactType) {

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
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

            if (!CollectionUtils.isNullOrEmpty(protectedBranches) && protectedBranches.contains(defaultBranchName)) {
                return List.of(defaultBranchName);
            } else {
                return List.of();
            }
        });
    }

    @Override
    public Mono<AutoCommitResponseDTO> getAutoCommitProgress(
            String artifactId, String branchName, ArtifactType artifactType) {
        return gitAutoCommitHelper.getAutoCommitProgress(artifactId, branchName);
    }

    @Override
    public Mono<Boolean> toggleAutoCommitEnabled(String baseArtifactId, ArtifactType artifactType) {

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactAutoCommitPermission = gitArtifactHelper.getArtifactAutoCommitPermission();

        Mono<? extends Artifact> baseArtifactMono =
                gitArtifactHelper.getArtifactById(baseArtifactId, artifactAutoCommitPermission);
        // get base app

        return baseArtifactMono
                .map(baseArtifact -> {
                    GitArtifactMetadata baseGitMetadata = baseArtifact.getGitArtifactMetadata();
                    if (!baseArtifact.getId().equals(baseGitMetadata.getDefaultArtifactId())) {
                        log.error(
                                "failed tp toggle auto commit. reason: {} is not the id of the base Artifact",
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
    public Mono<List<String>> updateProtectedBranches(
            String baseArtifactId, List<String> branchNames, ArtifactType artifactType) {

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactManageProtectedBranchPermission =
                gitArtifactHelper.getArtifactManageProtectedBranchPermission();

        Mono<? extends Artifact> baseArtifactMono =
                gitArtifactHelper.getArtifactById(baseArtifactId, artifactManageProtectedBranchPermission);

        return baseArtifactMono.flatMap(baseArtifact -> {
            GitArtifactMetadata baseGitData = baseArtifact.getGitArtifactMetadata();
            final String defaultBranchName = baseGitData.getDefaultBranchName();
            final List<String> incomingProtectedBranches =
                    CollectionUtils.isNullOrEmpty(branchNames) ? new ArrayList<>() : branchNames;

            // user cannot protect multiple branches
            if (incomingProtectedBranches.size() > 1) {
                return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
            }

            // user cannot protect a branch which is not default
            if (incomingProtectedBranches.size() == 1 && !defaultBranchName.equals(incomingProtectedBranches.get(0))) {
                return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
            }

            return updateProtectedBranchesInArtifactAfterVerification(baseArtifact, incomingProtectedBranches);
        });
        /*.as(transactionalOperator::transactional);*/
    }

    protected Mono<List<String>> updateProtectedBranchesInArtifactAfterVerification(
            Artifact baseArtifact, List<String> branchNames) {
        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(baseArtifact.getArtifactType());
        GitArtifactMetadata baseGitData = baseArtifact.getGitArtifactMetadata();
        // keep a copy of old protected branches as it's required to send analytics event later
        List<String> oldProtectedBranches = baseGitData.getBranchProtectionRules() == null
                ? new ArrayList<>()
                : baseGitData.getBranchProtectionRules();

        baseGitData.setBranchProtectionRules(branchNames);
        return gitArtifactHelper
                .saveArtifact(baseArtifact)
                .then(gitArtifactHelper.updateArtifactWithProtectedBranches(baseArtifact.getId(), branchNames))
                .then(sendBranchProtectionAnalytics(baseArtifact, oldProtectedBranches, branchNames))
                .thenReturn(branchNames);
    }

    /**
     * Sends one or more analytics events when there's a change in protected branches.
     * If n number of branches are un-protected and m number of branches are protected, it'll send m+n number of
     * events. It receives the list of branches before and after the action.
     * For example, if user has "main" and "develop" branches as protected and wants to include "staging" branch as
     * protected as well, then oldProtectedBranches will be ["main", "develop"] and newProtectedBranches will be
     * ["main", "develop", "staging"]
     *
     * @param artifact          Application object of the root artifact
     * @param oldProtectedBranches List of branches that were protected before this action.
     * @param newProtectedBranches List of branches that are going to be protected.
     * @return An empty Mono
     */
    protected Mono<Void> sendBranchProtectionAnalytics(
            Artifact artifact, List<String> oldProtectedBranches, List<String> newProtectedBranches) {
        List<String> itemsAdded = new ArrayList<>(newProtectedBranches); // add all new items
        itemsAdded.removeAll(oldProtectedBranches); // remove the items that were present earlier

        List<String> itemsRemoved = new ArrayList<>(oldProtectedBranches); // add all old items
        itemsRemoved.removeAll(newProtectedBranches); // remove the items that are also present in new list

        List<Mono<? extends Artifact>> eventSenderMonos = new ArrayList<>();

        // send an analytics event for each removed branch
        for (String branchName : itemsRemoved) {
            eventSenderMonos.add(addAnalyticsForGitOperation(GIT_REMOVE_PROTECTED_BRANCH, branchName, artifact));
        }

        // send an analytics event for each newly protected branch
        for (String branchName : itemsAdded) {
            eventSenderMonos.add(addAnalyticsForGitOperation(GIT_ADD_PROTECTED_BRANCH, branchName, artifact));
        }

        return Flux.merge(eventSenderMonos).then();
    }

    @Override
    public Mono<? extends ArtifactImportDTO> importArtifactFromGit(
            String workspaceId, GitConnectDTO gitConnectDTO, ArtifactType artifactType) {
        // 1. Check private repo limit for workspace
        // 2. Create dummy application, clone repo from remote
        // 3. Re-hydrate application to DB from local repo
        //    1. Save the ssh keys in application object with other details
        //    2. During import-export need to handle the DS(empty vs non-empty)
        // 4. Return application

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);

        if (StringUtils.isEmptyOrNull(gitConnectDTO.getRemoteUrl())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Remote Url"));
        }

        if (StringUtils.isEmptyOrNull(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Invalid workspace id"));
        }

        Mono<Workspace> workspaceMono = workspaceService
                .findById(workspaceId, AclPermission.WORKSPACE_CREATE_APPLICATION)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId)));

        final String repoName = GitUtils.getRepoName(gitConnectDTO.getRemoteUrl());
        Mono<Boolean> isPrivateRepoMono = GitUtils.isRepoPrivate(
                        GitUtils.convertSshUrlToBrowserSupportedUrl(gitConnectDTO.getRemoteUrl()))
                .cache();
        Mono<? extends ArtifactImportDTO> importedArtifactMono = workspaceMono
                .then(getSSHKeyForCurrentUser())
                .zipWith(isPrivateRepoMono)
                .switchIfEmpty(
                        Mono.error(
                                new AppsmithException(
                                        AppsmithError.INVALID_GIT_CONFIGURATION,
                                        "Unable to find git configuration for logged-in user. Please contact Appsmith team for support")))
                // Check the limit for number of private repo
                .flatMap(tuple -> {
                    // Check if the repo is public
                    GitAuth gitAuth = tuple.getT1();
                    boolean isRepoPrivate = tuple.getT2();

                    Mono<? extends Artifact> createArtifactMono = gitArtifactHelper
                            .createArtifactForImport(workspaceId, repoName)
                            .cache();

                    if (!isRepoPrivate) {
                        return Mono.just(gitAuth).zipWith(createArtifactMono);
                    }

                    return gitPrivateRepoHelper
                            .isRepoLimitReached(workspaceId, true)
                            .zipWith(createArtifactMono)
                            .flatMap(tuple2 -> {
                                Boolean isRepoLimitReached = tuple2.getT1();
                                Artifact createdArtifact = tuple2.getT2();

                                if (FALSE.equals(isRepoLimitReached)) {
                                    return Mono.just(gitAuth).zipWith(createArtifactMono);
                                }

                                return addAnalyticsForGitOperation(
                                                AnalyticsEvents.GIT_IMPORT,
                                                createdArtifact,
                                                AppsmithError.GIT_APPLICATION_LIMIT_ERROR.getErrorType(),
                                                AppsmithError.GIT_APPLICATION_LIMIT_ERROR.getMessage(),
                                                true)
                                        .flatMap(user -> Mono.error(
                                                new AppsmithException(AppsmithError.GIT_APPLICATION_LIMIT_ERROR)));
                            });
                })
                .flatMap(tuple -> {
                    GitAuth gitAuth = tuple.getT1();
                    Artifact artifact = tuple.getT2();
                    Path repoSuffix =
                            gitArtifactHelper.getRepoSuffixPath(artifact.getWorkspaceId(), artifact.getId(), repoName);
                    Mono<Map<String, GitProfile>> profileMono =
                            updateOrCreateGitProfileForCurrentUser(gitConnectDTO.getGitProfile(), artifact.getId());

                    Mono<String> defaultBranchMono = gitExecutor
                            .cloneRemoteIntoArtifactRepo(
                                    repoSuffix,
                                    gitConnectDTO.getRemoteUrl(),
                                    gitAuth.getPrivateKey(),
                                    gitAuth.getPublicKey())
                            .onErrorResume(error -> {
                                log.error("Error while cloning the remote repo, {}", error.getMessage());
                                return addAnalyticsForGitOperation(
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
                                                return Mono.error(new AppsmithException(
                                                        AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                                            } else if (error instanceof InvalidRemoteException) {
                                                return Mono.error(new AppsmithException(
                                                        AppsmithError.INVALID_PARAMETER, "remote url"));
                                            } else if (error instanceof TimeoutException) {
                                                return Mono.error(
                                                        new AppsmithException(AppsmithError.GIT_EXECUTION_TIMEOUT));
                                            }
                                            return Mono.error(new AppsmithException(
                                                    AppsmithError.GIT_ACTION_FAILED, "clone", error));
                                        });
                            });

                    return defaultBranchMono.zipWith(isPrivateRepoMono).flatMap(tuple2 -> {
                        String defaultBranch = tuple2.getT1();
                        boolean isRepoPrivate = tuple2.getT2();
                        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
                        gitArtifactMetadata.setGitAuth(gitAuth);
                        gitArtifactMetadata.setDefaultApplicationId(artifact.getId());
                        gitArtifactMetadata.setBranchName(defaultBranch);
                        gitArtifactMetadata.setDefaultBranchName(defaultBranch);
                        gitArtifactMetadata.setRemoteUrl(gitConnectDTO.getRemoteUrl());
                        gitArtifactMetadata.setRepoName(repoName);
                        gitArtifactMetadata.setBrowserSupportedRemoteUrl(
                                GitUtils.convertSshUrlToBrowserSupportedUrl(gitConnectDTO.getRemoteUrl()));
                        gitArtifactMetadata.setIsRepoPrivate(isRepoPrivate);
                        gitArtifactMetadata.setLastCommittedAt(Instant.now());

                        artifact.setGitArtifactMetadata(gitArtifactMetadata);
                        return Mono.just(artifact).zipWith(profileMono);
                    });
                })
                .flatMap(objects -> {
                    Artifact artifact = objects.getT1();
                    GitArtifactMetadata gitArtifactMetadata = artifact.getGitArtifactMetadata();
                    String defaultBranch = gitArtifactMetadata.getDefaultBranchName();

                    Mono<List<Datasource>> datasourceMono = datasourceService
                            .getAllByWorkspaceIdWithStorages(workspaceId, datasourcePermission.getEditPermission())
                            .collectList();
                    Mono<List<Plugin>> pluginMono =
                            pluginService.getDefaultPlugins().collectList();
                    Mono<? extends ArtifactExchangeJson> applicationJsonMono = commonGitFileUtils
                            .reconstructArtifactExchangeJsonFromGitRepoWithAnalytics(
                                    workspaceId,
                                    artifact.getId(),
                                    gitArtifactMetadata.getRepoName(),
                                    defaultBranch,
                                    artifactType)
                            .onErrorResume(error -> {
                                log.error("Error while constructing artifact from git repo", error);
                                return deleteArtifactCreatedFromGitImport(
                                                artifact.getId(),
                                                artifact.getWorkspaceId(),
                                                gitArtifactMetadata.getRepoName(),
                                                artifactType)
                                        .flatMap(application1 -> Mono.error(new AppsmithException(
                                                AppsmithError.GIT_FILE_SYSTEM_ERROR, error.getMessage())));
                            });

                    return Mono.zip(applicationJsonMono, datasourceMono, pluginMono)
                            .flatMap(data -> {
                                ArtifactExchangeJson artifactExchangeJson = data.getT1();
                                List<Datasource> datasourceList = data.getT2();
                                List<Plugin> pluginList = data.getT3();

                                if (Optional.ofNullable(artifactExchangeJson.getArtifact())
                                                .isEmpty()
                                        || gitArtifactHelper.isContextInArtifactEmpty(artifactExchangeJson)) {

                                    return deleteArtifactCreatedFromGitImport(
                                                    artifact.getId(),
                                                    artifact.getWorkspaceId(),
                                                    gitArtifactMetadata.getRepoName(),
                                                    artifactType)
                                            .then(Mono.error(new AppsmithException(
                                                    AppsmithError.GIT_ACTION_FAILED,
                                                    "import",
                                                    "Cannot import app from an empty repo")));
                                }

                                // If there is an existing datasource with the same name but a different type from that
                                // in the repo, the import api should fail
                                if (checkIsDatasourceNameConflict(
                                        datasourceList, artifactExchangeJson.getDatasourceList(), pluginList)) {
                                    return deleteArtifactCreatedFromGitImport(
                                                    artifact.getId(),
                                                    artifact.getWorkspaceId(),
                                                    gitArtifactMetadata.getRepoName(),
                                                    artifactType)
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
                                                        artifact.getId(),
                                                        artifact.getWorkspaceId(),
                                                        gitArtifactMetadata.getRepoName(),
                                                        artifactType)
                                                .flatMap(application1 -> Mono.error(new AppsmithException(
                                                        AppsmithError.GIT_FILE_SYSTEM_ERROR, throwable.getMessage()))));
                            });
                })
                .flatMap(artifact -> gitArtifactHelper.publishArtifact(artifact, false))
                // Add un-configured datasource to the list to response
                .flatMap(artifact -> importService.getArtifactImportDTO(
                        artifact.getWorkspaceId(), artifact.getId(), artifact, APPLICATION))
                .map(importableArtifactDTO -> (ApplicationImportDTO) importableArtifactDTO)
                // Add analytics event
                .flatMap(applicationImportDTO -> {
                    Application application = applicationImportDTO.getApplication();
                    return addAnalyticsForGitOperation(
                                    AnalyticsEvents.GIT_IMPORT,
                                    application,
                                    application.getGitApplicationMetadata().getIsRepoPrivate())
                            .thenReturn(applicationImportDTO);
                });

        return Mono.create(
                sink -> importedArtifactMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    private Mono<GitAuth> getSSHKeyForCurrentUser() {
        return sessionUserService
                .getCurrentUser()
                .flatMap(user -> gitDeployKeysRepository.findByEmail(user.getEmail()))
                .map(GitDeployKeys::getGitAuth);
    }

    private Mono<? extends Artifact> deleteArtifactCreatedFromGitImport(
            String artifactId, String workspaceId, String repoName, ArtifactType artifactType) {

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);

        Path repoSuffix = Paths.get(workspaceId, artifactId, repoName);
        return commonGitFileUtils.deleteLocalRepo(repoSuffix).then(gitArtifactHelper.deleteArtifact(artifactId));
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

        GitArtifactHelper<?> artifactGitHelper = getArtifactGitService(artifactType);
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
        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactPermission = gitArtifactHelper.getArtifactEditPermission();
        return getBaseAndBranchedArtifacts(branchedArtifactId, artifactType, artifactPermission);
    }
}
