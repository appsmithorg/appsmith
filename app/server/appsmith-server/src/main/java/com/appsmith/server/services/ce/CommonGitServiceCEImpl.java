package com.appsmith.server.services.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.dtos.GitBranchDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.Assets;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.GitDefaultCommitMessage;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.GitCommitDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.helpers.GitUtils;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.GitArtifactHelper;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import io.micrometer.observation.ObservationRegistry;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.errors.EmptyCommitException;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.InvalidRemoteException;
import org.eclipse.jgit.api.errors.TransportException;
import org.eclipse.jgit.errors.RepositoryNotFoundException;
import org.eclipse.jgit.lib.BranchTrackingStatus;
import org.eclipse.jgit.util.StringUtils;
import org.springframework.stereotype.Service;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple3;
import reactor.util.retry.Retry;

import java.io.IOException;
import java.nio.file.Path;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeoutException;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.ce.GitConstantsCE.DEFAULT_COMMIT_MESSAGE;
import static com.appsmith.external.constants.ce.GitConstantsCE.EMPTY_COMMIT_ERROR_MESSAGE;
import static com.appsmith.external.constants.ce.GitConstantsCE.GIT_CONFIG_ERROR;
import static com.appsmith.external.constants.ce.GitConstantsCE.GIT_PROFILE_ERROR;
import static com.appsmith.server.constants.ArtifactType.APPLICATION;
import static com.appsmith.server.constants.SerialiseArtifactObjective.VERSION_CONTROL;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT;
import static com.appsmith.server.helpers.GitUtils.MAX_RETRIES;
import static com.appsmith.server.helpers.GitUtils.RETRY_DELAY;
import static org.apache.commons.lang.ObjectUtils.defaultIfNull;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommonGitServiceCEImpl implements CommonGitServiceCE {

    private final GitPrivateRepoHelper gitPrivateRepoHelper;
    private final CommonGitFileUtils commonGitFileUtils;
    private final RedisUtils redisUtils;
    private final SessionUserService sessionUserService;
    private final UserDataService userDataService;
    private final UserService userService;

    private final AnalyticsService analyticsService;
    private final ObservationRegistry observationRegistry;

    private final ExportService exportService;
    private final ImportService importService;

    private final GitExecutor gitExecutor;
    private final GitArtifactHelper<Application> gitApplicationHelper;
    private static final String ORIGIN = "origin/";
    private static final String REMOTE_NAME_REPLACEMENT = "";

    private Mono<Boolean> addFileLock(String defaultArtifactId) {
        return redisUtils
                .addFileLock(defaultArtifactId)
                .retryWhen(Retry.fixedDelay(MAX_RETRIES, RETRY_DELAY)
                        .onRetryExhaustedThrow((retryBackoffSpec, retrySignal) -> {
                            throw new AppsmithException(AppsmithError.GIT_FILE_IN_USE);
                        }));
    }

    private Mono<Boolean> releaseFileLock(String defaultArtifactId) {
        return redisUtils.releaseFileLock(defaultArtifactId);
    }

    public GitArtifactHelper<?> getArtifactGitService(@NonNull ArtifactType artifactType) {
        return switch (artifactType) {
            case APPLICATION -> gitApplicationHelper;
            default -> gitApplicationHelper;
        };
    }

    @Override
    public Mono<GitStatusDTO> getStatus(String defaultArtifactId, boolean compareRemote, String branchName) {
        return getStatus(defaultArtifactId, branchName, true, compareRemote);
    }

    private Mono<GitStatusDTO> getStatus(String defaultArtifactId, String branchName, boolean isFileLock) {
        return getStatus(defaultArtifactId, branchName, isFileLock, true);
    }

    /**
     * Get the status of the mentioned branch
     *
     * @param defaultArtifactId     root/default application
     * @param branchName           for which the status is required
     * @param isFileLock           if the locking is required, since the status API is used in the other flows of git
     *                             Only for the direct hits from the client the locking will be added
     * @return Map of json file names which are added, modified, conflicting, removed and the working tree if this is clean
     */
    private Mono<GitStatusDTO> getStatus(
            String defaultArtifactId, String branchName, boolean isFileLock, boolean compareRemote) {

        // This variable is just for testing purpose, will be removed with a method parameter.
        ArtifactType artifactType = ArtifactType.APPLICATION;

        if (StringUtils.isEmptyOrNull(branchName)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        }

        final String finalBranchName = branchName.replaceFirst(ORIGIN, REMOTE_NAME_REPLACEMENT);

        GitArtifactHelper<?> artifactGitHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = artifactGitHelper.getArtifactEditPermission();

        Mono<? extends Artifact> branchedAppMono = artifactGitHelper
                .getArtifactByDefaultIdAndBranchName(defaultArtifactId, finalBranchName, artifactEditPermission)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.GIT_GENERIC_ERROR)))
                .cache();

        /*
           1. Copy resources from DB to local repo
           2. Fetch the current status from local repo
        */
        Mono<GitStatusDTO> statusMono = Mono.zip(
                        getGitArtifactMetadata(defaultArtifactId, artifactType), branchedAppMono)
                .flatMap(tuple2 -> {
                    GitArtifactMetadata gitArtifactMetadata = tuple2.getT1();
                    Artifact branchedArtifact = tuple2.getT2();
                    Mono<? extends ArtifactExchangeJson> exportedArtifactJsonMono = exportService
                            .exportByArtifactId(branchedArtifact.getId(), VERSION_CONTROL, artifactType)
                            .elapsed()
                            .map(longTuple2 -> {
                                log.debug("export took: {}", longTuple2.getT1());
                                return longTuple2.getT2();
                            });
                    return Mono.zip(
                            Mono.just(gitArtifactMetadata), Mono.just(branchedArtifact), exportedArtifactJsonMono);
                })
                .flatMap(artifactAndJsonTuple3 -> {
                    if (!Boolean.TRUE.equals(isFileLock)) {
                        return Mono.just(artifactAndJsonTuple3);
                    }

                    Mono<Boolean> fileLockMono = Mono.defer(() -> addFileLock(defaultArtifactId));
                    return fileLockMono.elapsed().map(elapsedTuple -> {
                        log.debug("file lock took: {}", elapsedTuple.getT1());
                        return artifactAndJsonTuple3;
                    });
                })
                .flatMap(tuple -> {
                    GitArtifactMetadata defaultArtifactMetadata = tuple.getT1();
                    Artifact exportableArtifact = tuple.getT2();
                    ArtifactExchangeJson artifactExchangeJson = tuple.getT3();

                    GitArtifactMetadata gitData = exportableArtifact.getGitArtifactMetadata();
                    gitData.setGitAuth(defaultArtifactMetadata.getGitAuth());

                    Path repoSuffix = artifactGitHelper.getRepoSuffixPath(
                            exportableArtifact.getWorkspaceId(), gitData.getDefaultArtifactId(), gitData.getRepoName());

                    try {
                        // Create a Mono to fetch the status from remote
                        Path repoSuffixForFetchRemote = artifactGitHelper.getRepoSuffixPath(
                                exportableArtifact.getWorkspaceId(),
                                gitData.getDefaultArtifactId(),
                                gitData.getRepoName());

                        GitAuth gitAuth = gitData.getGitAuth();
                        Mono<String> fetchRemoteMono;

                        if (compareRemote) {
                            fetchRemoteMono = Mono.defer(() -> gitExecutor.fetchRemote(
                                            repoSuffixForFetchRemote,
                                            gitAuth.getPublicKey(),
                                            gitAuth.getPrivateKey(),
                                            false,
                                            branchName,
                                            false))
                                    .onErrorResume(error -> Mono.error(new AppsmithException(
                                            AppsmithError.GIT_GENERIC_ERROR, error.getMessage())));
                        } else {
                            fetchRemoteMono = Mono.just("ignored");
                        }

                        return Mono.zip(
                                commonGitFileUtils.saveArtifactToLocalRepo(
                                        repoSuffix, artifactExchangeJson, finalBranchName),
                                Mono.just(repoSuffix),
                                fetchRemoteMono);
                    } catch (IOException | GitAPIException e) {
                        return Mono.error(
                                new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "status", e.getMessage()));
                    }
                })
                .elapsed()
                .flatMap(tuple -> {
                    log.debug("saveApplicationToLocalRepo took: {}", tuple.getT1());
                    return gitExecutor
                            .getStatus(tuple.getT2().getT1(), finalBranchName)
                            .elapsed()
                            .flatMap(tuple2 -> {
                                log.debug("git status took: {}", tuple2.getT1());
                                // Remove any files which are copied by hard resetting the repo
                                try {
                                    GitStatusDTO result = tuple2.getT2();
                                    return gitExecutor
                                            .resetToLastCommit(tuple.getT2().getT2(), branchName)
                                            .thenReturn(result);
                                } catch (Exception e) {
                                    log.error(
                                            "failed to reset to last commit for application: {}, branch: {}",
                                            defaultArtifactId,
                                            branchName,
                                            e);
                                    return Mono.error(new AppsmithException(
                                            AppsmithError.GIT_ACTION_FAILED, "status", e.getMessage()));
                                }
                            });
                })
                .elapsed()
                .flatMap(tuple2 -> {
                    log.debug("reset to last commit took: {}", tuple2.getT1());
                    GitStatusDTO result = tuple2.getT2();
                    // release the lock if there's a successful response
                    if (isFileLock) {
                        return releaseFileLock(defaultArtifactId).thenReturn(result);
                    }
                    return Mono.just(result);
                })
                .onErrorResume(throwable -> {
                    /*
                     in case of any error, the global exception handler will release the lock
                     hence we don't need to do that manually
                    */
                    log.error(
                            "Error to get status for application: {}, branch: {}",
                            defaultArtifactId,
                            branchName,
                            throwable);
                    return Mono.error(new AppsmithException(AppsmithError.GIT_GENERIC_ERROR, throwable.getMessage()));
                })
                .tag("gitStatus", defaultArtifactId)
                .name(AnalyticsEvents.GIT_STATUS.getEventName())
                .tap(Micrometer.observation(observationRegistry));

        return Mono.zip(statusMono, sessionUserService.getCurrentUser(), branchedAppMono)
                .elapsed()
                .flatMap(objects -> {
                    Long elapsedTime = objects.getT1();
                    log.debug("Multi mono took: {}", elapsedTime);
                    GitStatusDTO gitStatusDTO = objects.getT2().getT1();
                    User currentUser = objects.getT2().getT2();
                    Artifact artifact = objects.getT2().getT3();
                    String flowName;
                    if (compareRemote) {
                        flowName = AnalyticsEvents.GIT_STATUS.getEventName();
                    } else {
                        flowName = AnalyticsEvents.GIT_STATUS_WITHOUT_FETCH.getEventName();
                    }
                    return sendUnitExecutionTimeAnalyticsEvent(flowName, elapsedTime, currentUser, artifact)
                            .thenReturn(gitStatusDTO);
                });
    }

    /**
     * This method is responsible to compare the current branch with the remote branch.
     * Comparing means finding two numbers - how many commits ahead and behind the local branch is.
     * It'll do the following things -
     * 1. Checkout (if required) to the branch to make sure we are comparing the right branch
     * 2. Run a git fetch command to fetch the latest changes from the remote
     *
     * @param defaultArtifactId Default application id
     * @param branchName        name of the branch to compare with remote
     * @param isFileLock        whether to add file lock or not
     * @param artifactType
     * @return Mono of {@link BranchTrackingStatus}
     */
    @Override
    public Mono<BranchTrackingStatus> fetchRemoteChanges(
            String defaultArtifactId, String branchName, boolean isFileLock, ArtifactType artifactType) {

        if (StringUtils.isEmptyOrNull(branchName)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        }

        final String finalBranchName = branchName.replaceFirst(ORIGIN, REMOTE_NAME_REPLACEMENT);

        GitArtifactHelper<?> artifactGitHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = artifactGitHelper.getArtifactEditPermission();

        Mono<? extends Artifact> branchedArtifactMono = artifactGitHelper
                .getArtifactByDefaultIdAndBranchName(defaultArtifactId, finalBranchName, artifactEditPermission)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.GIT_GENERIC_ERROR)))
                .cache();

        Mono<GitArtifactMetadata> gitDataMono = getGitArtifactMetadata(defaultArtifactId, artifactType);

        Mono<User> currUserMono = sessionUserService.getCurrentUser().cache(); // will be used to send analytics event

        /*
           1. Copy resources from DB to local repo
           2. Fetch the current status from local repo
        */

        // current user mono has been zipped just to run in parallel.
        Mono<BranchTrackingStatus> fetchRemoteStatusMono = Mono.zip(gitDataMono, branchedArtifactMono, currUserMono)
                .flatMap(tuple3 -> {
                    if (!Boolean.TRUE.equals(isFileLock)) {
                        return Mono.just(tuple3);
                    }

                    return addFileLock(tuple3.getT1().getDefaultArtifactId()).then(Mono.just(tuple3));
                })
                .flatMap(tuple3 -> {
                    GitArtifactMetadata defaultArtifactMetadata = tuple3.getT1();
                    Artifact artifact = tuple3.getT2();
                    GitArtifactMetadata gitData = artifact.getGitArtifactMetadata();
                    gitData.setGitAuth(defaultArtifactMetadata.getGitAuth());

                    Path repoSuffix = artifactGitHelper.getRepoSuffixPath(
                            artifact.getWorkspaceId(), gitData.getDefaultApplicationId(), gitData.getRepoName());

                    Path repoPath = gitExecutor.createRepoPath(repoSuffix);
                    Mono<Boolean> checkoutBranchMono = gitExecutor.checkoutToBranch(repoSuffix, finalBranchName);
                    Mono<String> fetchRemoteMono = gitExecutor.fetchRemote(
                            repoPath,
                            gitData.getGitAuth().getPublicKey(),
                            gitData.getGitAuth().getPrivateKey(),
                            true,
                            finalBranchName,
                            false);

                    Mono<BranchTrackingStatus> branchedStatusMono =
                            gitExecutor.getBranchTrackingStatus(repoPath, finalBranchName);

                    return checkoutBranchMono
                            .then(fetchRemoteMono)
                            .then(branchedStatusMono)
                            .flatMap(branchTrackingStatus -> {
                                if (isFileLock) {
                                    return releaseFileLock(defaultArtifactId).thenReturn(branchTrackingStatus);
                                }
                                return Mono.just(branchTrackingStatus);
                            })
                            .onErrorResume(throwable -> {
                                /*
                                 in case of any error, the global exception handler will release the lock
                                 hence we don't need to do that manually
                                */
                                log.error(
                                        "Error to fetch from remote for application: {}, branch: {}",
                                        defaultArtifactId,
                                        branchName,
                                        throwable);
                                return Mono.error(new AppsmithException(
                                        AppsmithError.GIT_ACTION_FAILED, "fetch", throwable.getMessage()));
                            });
                })
                .elapsed()
                .zipWith(Mono.zip(currUserMono, branchedArtifactMono))
                .flatMap(objects -> {
                    Long elapsedTime = objects.getT1().getT1();
                    BranchTrackingStatus branchTrackingStatus = objects.getT1().getT2();
                    User currentUser = objects.getT2().getT1();
                    Artifact artifact = objects.getT2().getT2();
                    return sendUnitExecutionTimeAnalyticsEvent(
                                    AnalyticsEvents.GIT_FETCH.getEventName(), elapsedTime, currentUser, artifact)
                            .thenReturn(branchTrackingStatus);
                });

        return Mono.create(sink -> {
            fetchRemoteStatusMono.subscribe(sink::success, sink::error, null, sink.currentContext());
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

    public Mono<GitArtifactMetadata> getGitArtifactMetadata(String defaultApplicationId, ArtifactType artifactType) {

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);

        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();
        Mono<? extends Artifact> defaultArtifactMono =
                gitArtifactHelper.getArtifactById(defaultApplicationId, artifactEditPermission);

        return Mono.zip(defaultArtifactMono, userDataService.getForCurrentUser())
                .map(tuple -> {
                    Artifact artifact = tuple.getT1();
                    UserData userData = tuple.getT2();
                    Map<String, GitProfile> gitProfiles = new HashMap<>();
                    GitArtifactMetadata gitData = artifact.getGitArtifactMetadata();

                    if (!CollectionUtils.isNullOrEmpty(userData.getGitProfiles())) {
                        gitProfiles.put(DEFAULT, userData.getGitProfileByKey(DEFAULT));
                        gitProfiles.put(defaultApplicationId, userData.getGitProfileByKey(defaultApplicationId));
                    }
                    if (gitData == null) {
                        GitArtifactMetadata res = new GitArtifactMetadata();
                        res.setGitProfiles(gitProfiles);
                        return res;
                    }
                    gitData.setGitProfiles(gitProfiles);
                    if (gitData.getGitAuth() != null) {
                        gitData.setPublicKey(gitData.getGitAuth().getPublicKey());
                    }
                    gitData.setDocUrl(Assets.GIT_DEPLOY_KEY_DOC_URL);
                    return gitData;
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
            String defaultArtifactId, GitConnectDTO gitConnectDTO, String originHeader, ArtifactType artifactType) {
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
                        gitConnectDTO.getGitProfile(), defaultArtifactId)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_PROFILE_ERROR)));

        final String browserSupportedUrl = GitUtils.convertSshUrlToBrowserSupportedUrl(gitConnectDTO.getRemoteUrl());
        Mono<Boolean> isPrivateRepoMono =
                GitUtils.isRepoPrivate(browserSupportedUrl).cache();

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);

        AclPermission connectToGitPermission = gitArtifactHelper.getArtifactGitConnectPermission();

        Mono<? extends Artifact> artifactToConnectMono =
                gitArtifactHelper.getArtifactById(defaultArtifactId, connectToGitPermission);

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
                    if (isDefaultGitMetadataInvalid(artifact.getGitArtifactMetadata())) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                    } else {
                        String repoName = GitUtils.getRepoName(gitConnectDTO.getRemoteUrl());
                        Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(
                                artifact.getWorkspaceId(), defaultArtifactId, repoName);

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
                                        gitArtifactMetadata.setDefaultArtifactId(artifactId);
                                        gitArtifactMetadata.setBranchName(defaultBranch);
                                        gitArtifactMetadata.setDefaultBranchName(defaultBranch);
                                        gitArtifactMetadata.setRemoteUrl(gitConnectDTO.getRemoteUrl());
                                        gitArtifactMetadata.setRepoName(repoName);
                                        gitArtifactMetadata.setBrowserSupportedRemoteUrl(browserSupportedUrl);
                                        gitArtifactMetadata.setIsRepoPrivate(isRepoPrivate);
                                        gitArtifactMetadata.setLastCommittedAt(Instant.now());

                                        // Set branchName for each artifact resource
                                        return exportService
                                                .exportByArtifactId(artifactId, VERSION_CONTROL, APPLICATION)
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
                            artifact.getWorkspaceId(), defaultArtifactId, repoName, "README.md");
                    try {
                        Mono<Path> readMeMono = gitArtifactHelper.intialiseReadMe(artifact, readMePath, originHeader);
                        return Mono.zip(readMeMono, currentUserMono)
                                .flatMap(tuple -> {
                                    UserData userData = tuple.getT2();
                                    GitProfile profile = userData.getGitProfileByKey(defaultArtifactId);
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

                                    return this.commitArtifact(
                                                    commitDTO,
                                                    defaultArtifactId,
                                                    artifact.getGitArtifactMetadata()
                                                            .getBranchName(),
                                                    true,
                                                    artifactType)
                                            .onErrorResume(error ->
                                                    // If the push fails remove all the cloned files from local repo
                                                    this.detachRemote(defaultArtifactId, artifactType)
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
                                        artifact.getGitArtifactMetadata().getIsRepoPrivate()))
                                .map(gitArtifactHelper::updateArtifactWithDefaultReponseUtils);
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
     * @param commitDTO         information required for making a commit
     * @param defaultArtifactId application branch on which the commit needs to be done
     * @param doAmend           if we want to amend the commit with the earlier one, used in connect flow
     * @param artifactType
     * @return success message
     */
    //    @Override
    public Mono<String> commitArtifact(
            GitCommitDTO commitDTO,
            String defaultArtifactId,
            String branchName,
            boolean doAmend,
            ArtifactType artifactType) {
        return this.commitArtifact(commitDTO, defaultArtifactId, branchName, doAmend, true, artifactType);
    }

    /**
     * This method will make a commit to local repo and is used internally in flows like create, merge branch
     * Since the lock is already acquired by the other flows, we do not need to acquire file lock again
     *
     * @param commitDTO            information required for making a commit
     * @param defaultArtifactId application branch on which the commit needs to be done
     * @return success message
     */
    public Mono<String> commitArtifact(
            GitCommitDTO commitDTO, String defaultArtifactId, String branchName, ArtifactType artifactType) {
        return this.commitArtifact(commitDTO, defaultArtifactId, branchName, false, false, artifactType);
    }

    /**
     * @param commitDTO            information required for making a commit
     * @param defaultArtifactId application branch on which the commit needs to be done
     * @param branchName           branch name for the commit flow
     * @param doAmend              if we want to amend the commit with the earlier one, used in connect flow
     * @param isFileLock           boolean value indicates whether the file lock is needed to complete the operation
     * @return success message
     */
    private Mono<String> commitArtifact(
            GitCommitDTO commitDTO,
            String defaultArtifactId,
            String branchName,
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
        StringBuilder result = new StringBuilder();

        if (commitMessage == null || commitMessage.isEmpty()) {
            commitDTO.setCommitMessage(DEFAULT_COMMIT_MESSAGE + GitDefaultCommitMessage.CONNECT_FLOW.getReason());
        }

        if (StringUtils.isEmptyOrNull(branchName)) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME);
        }
        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        boolean isSystemGenerated = commitDTO.getCommitMessage().contains(DEFAULT_COMMIT_MESSAGE);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();
        Mono<? extends Artifact> artifactMono =
                gitArtifactHelper.getArtifactById(defaultArtifactId, artifactEditPermission);

        Mono<String> commitMono = artifactMono
                .zipWhen(artifact ->
                        gitPrivateRepoHelper.isBranchProtected(artifact.getGitArtifactMetadata(), branchName))
                .map(objects -> {
                    if (objects.getT2()) {
                        throw new AppsmithException(
                                AppsmithError.GIT_ACTION_FAILED,
                                "commit",
                                "Cannot commit to protected branch " + branchName);
                    }
                    return objects.getT1();
                })
                .flatMap(artifact -> {
                    GitArtifactMetadata gitData = artifact.getGitArtifactMetadata();
                    if (Boolean.TRUE.equals(isFileLock)) {
                        return addFileLock(gitData.getDefaultArtifactId()).then(Mono.just(artifact));
                    }
                    return Mono.just(artifact);
                })
                .flatMap(defaultArtifact -> {
                    GitArtifactMetadata defaultGitMetadata = defaultArtifact.getGitArtifactMetadata();
                    if (Optional.ofNullable(defaultGitMetadata).isEmpty()) {
                        return Mono.error(
                                new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
                    }

                    // Check if the repo is public for current artifact and if the user have changed the access after
                    // the connection
                    final String workspaceId = defaultArtifact.getWorkspaceId();
                    return GitUtils.isRepoPrivate(defaultGitMetadata.getBrowserSupportedRemoteUrl())
                            .flatMap(isPrivate -> {
                                // Check the repo limit if the visibility status is updated, or it is private

                                if (isPrivate.equals(
                                        defaultGitMetadata.getIsRepoPrivate() && !Boolean.TRUE.equals(isPrivate))) {
                                    return Mono.just(defaultArtifact);
                                }

                                defaultGitMetadata.setIsRepoPrivate(isPrivate);
                                defaultArtifact.setGitArtifactMetadata(defaultGitMetadata);

                                return gitArtifactHelper
                                        .saveArtifact(defaultArtifact)
                                        .flatMap(savedArtifact ->
                                                gitArtifactHelper.isPrivateRepoLimitReached(savedArtifact, false));
                            });
                })
                .then(gitArtifactHelper.getArtifactByDefaultIdAndBranchName(
                        defaultArtifactId, branchName, artifactEditPermission))
                .flatMap((branchedArtifact) -> {
                    GitArtifactMetadata gitArtifactMetadata = branchedArtifact.getGitArtifactMetadata();
                    if (gitArtifactMetadata == null) {
                        return Mono.error(
                                new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
                    }

                    String errorEntity = "";
                    if (StringUtils.isEmptyOrNull(gitArtifactMetadata.getBranchName())) {
                        errorEntity = "branch name";
                    } else if (StringUtils.isEmptyOrNull(gitArtifactMetadata.getDefaultApplicationId())) {
                        // TODO: make this artifact
                        errorEntity = "default artifact";
                    } else if (StringUtils.isEmptyOrNull(gitArtifactMetadata.getRepoName())) {
                        errorEntity = "repository name";
                    }

                    if (!errorEntity.isEmpty()) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION, "Unable to find " + errorEntity));
                    }

                    return Mono.zip(
                            exportService.exportByArtifactId(branchedArtifact.getId(), VERSION_CONTROL, APPLICATION),
                            Mono.just(branchedArtifact));
                })
                .flatMap(tuple -> {
                    ArtifactExchangeJson artifactExchangeJson = tuple.getT1();
                    Artifact branchedArtifact = tuple.getT2();
                    GitArtifactMetadata gitData = branchedArtifact.getGitArtifactMetadata();
                    Path baseRepoSuffix = gitArtifactHelper.getRepoSuffixPath(
                            branchedArtifact.getWorkspaceId(), gitData.getDefaultArtifactId(), gitData.getRepoName());
                    Mono<Path> repoPathMono;

                    try {
                        repoPathMono = commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                                baseRepoSuffix, artifactExchangeJson, gitData.getBranchName());
                    } catch (IOException | GitAPIException e) {
                        return Mono.error(e);
                    }

                    gitData.setLastCommittedAt(Instant.now());
                    // We don't require to check for permission from this point because, permission is already
                    // established
                    Mono<? extends Artifact> branchedArtifactMono =
                            updateArtifactWithGitMetadataGivenPermission(branchedArtifact, gitData, artifactType);
                    return Mono.zip(
                            repoPathMono,
                            userDataService.getGitProfileForCurrentUser(defaultArtifactId),
                            branchedArtifactMono);
                })
                .onErrorResume(e -> {
                    log.error("Error in commit flow: ", e);
                    if (e instanceof RepositoryNotFoundException) {
                        return Mono.error(new AppsmithException(AppsmithError.REPOSITORY_NOT_FOUND, defaultArtifactId));
                    } else if (e instanceof AppsmithException) {
                        return Mono.error(e);
                    }
                    return Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, e.getMessage()));
                })
                .flatMap(tuple -> {
                    Path baseRepoPath = tuple.getT1();
                    GitProfile authorProfile = tuple.getT2();
                    Artifact branchedArtifact = tuple.getT3();
                    GitArtifactMetadata gitArtifactMetadata = branchedArtifact.getGitArtifactMetadata();
                    if (authorProfile == null || StringUtils.isEmptyOrNull(authorProfile.getAuthorName())) {
                        String errorMessage = "Unable to find git author configuration for logged-in user. You can set "
                                + "up a git profile from the user profile section.";

                        return addAnalyticsForGitOperation(
                                        AnalyticsEvents.GIT_COMMIT,
                                        branchedArtifact,
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
                                                branchedArtifact,
                                                error.getClass().getName(),
                                                error.getMessage(),
                                                gitArtifactMetadata.getIsRepoPrivate())
                                        .then(Mono.error(new AppsmithException(
                                                AppsmithError.GIT_ACTION_FAILED, "commit", error.getMessage())));
                            });
                    return Mono.zip(gitCommitMono, Mono.just(branchedArtifact));
                })
                .flatMap(tuple -> {
                    String commitStatus = tuple.getT1();
                    Artifact branchedArtifact = tuple.getT2();
                    result.append(commitStatus);
                    if (Boolean.TRUE.equals(commitDTO.getDoPush())) {
                        // Push flow
                        result.append(".\nPush Result : ");
                        return pushArtifact(branchedArtifact, false, false)
                                .map(pushResult -> result.append(pushResult).toString())
                                .zipWith(Mono.just(branchedArtifact));
                    }

                    return Mono.zip(Mono.just(result.toString()), Mono.just(branchedArtifact));
                })
                .flatMap(tuple2 -> {
                    String status = tuple2.getT1();
                    Artifact branchedArtifact = tuple2.getT2();
                    return Mono.zip(Mono.just(status), publishArtifact(branchedArtifact, commitDTO.getDoPush()));
                })
                // Add BE analytics
                .flatMap(tuple -> {
                    String status = tuple.getT1();
                    Artifact branchedArtifact = tuple.getT2();

                    Mono<Boolean> releaseFileLockMono = Mono.just(Boolean.TRUE).flatMap(flag -> {
                        if (!Boolean.TRUE.equals(isFileLock)) {
                            return Mono.just(flag);
                        }

                        return releaseFileLock(
                                branchedArtifact.getGitArtifactMetadata().getDefaultArtifactId());
                    });

                    Mono<? extends Artifact> updatedArtifactMono =
                            gitArtifactHelper.updateArtifactWithSchemaVersions(branchedArtifact);

                    return Mono.zip(updatedArtifactMono, releaseFileLockMono)
                            .then(addAnalyticsForGitOperation(
                                    AnalyticsEvents.GIT_COMMIT,
                                    branchedArtifact,
                                    "",
                                    "",
                                    branchedArtifact.getGitArtifactMetadata().getIsRepoPrivate(),
                                    isSystemGenerated))
                            .thenReturn(status)
                            .tag("gitCommit", defaultArtifactId)
                            .name(AnalyticsEvents.GIT_COMMIT.getEventName())
                            .tap(Micrometer.observation(observationRegistry));
                });

        return Mono.create(sink -> {
            commitMono.subscribe(sink::success, sink::error, null, sink.currentContext());
        });
    }

    private Mono<? extends Artifact> updateArtifactWithGitMetadataGivenPermission(
            Artifact artifact, GitArtifactMetadata gitMetadata, ArtifactType artifactType) {

        if (Optional.ofNullable(gitMetadata).isEmpty()) {
            return Mono.error(
                    new AppsmithException(AppsmithError.INVALID_PARAMETER, "Git metadata values cannot be null"));
        }

        artifact.setGitArtifactMetadata(gitMetadata);
        // For default application we expect a GitAuth to be a part of gitMetadata. We are using save method to leverage
        // @Encrypted annotation used for private SSH keys
        // applicationService.save sets the transient fields so no need to set it again from this method
        return getArtifactGitService(artifactType).saveArtifact(artifact);
    }

    /**
     * Push flow for dehydrated apps
     *
     * @param branchedArtifact application which needs to be pushed to remote repo
     * @return Success message
     */
    private Mono<String> pushArtifact(Artifact branchedArtifact, boolean doPublish, boolean isFileLock) {

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
                            .map(defaultArtifact -> {
                                artifact.getGitArtifactMetadata()
                                        .setGitAuth(defaultArtifact
                                                .getGitArtifactMetadata()
                                                .getGitAuth());
                                return artifact;
                            });
                })
                .flatMap(artifact -> {
                    if (!Boolean.TRUE.equals(isFileLock)) {
                        return Mono.just(artifact);
                    }

                    return addFileLock(artifact.getGitArtifactMetadata().getDefaultArtifactId())
                            .map(status -> artifact);
                })
                .flatMap(artifact -> {
                    GitArtifactMetadata gitData = artifact.getGitArtifactMetadata();

                    if (gitData == null
                            || StringUtils.isEmptyOrNull(gitData.getBranchName())
                            || StringUtils.isEmptyOrNull(gitData.getDefaultApplicationId())
                            || StringUtils.isEmptyOrNull(gitData.getGitAuth().getPrivateKey())) {

                        return Mono.error(
                                new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
                    }

                    Path baseRepoSuffix = gitArtifactHelper.getRepoSuffixPath(
                            artifact.getWorkspaceId(), gitData.getDefaultApplicationId(), gitData.getRepoName());
                    GitAuth gitAuth = gitData.getGitAuth();

                    return gitExecutor
                            .checkoutToBranch(
                                    baseRepoSuffix,
                                    artifact.getGitArtifactMetadata().getBranchName())
                            .then(gitExecutor
                                    .pushApplication(
                                            baseRepoSuffix,
                                            gitData.getRemoteUrl(),
                                            gitAuth.getPublicKey(),
                                            gitAuth.getPrivateKey(),
                                            gitData.getBranchName())
                                    .zipWith(Mono.just(artifact)))
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
                });

        return Mono.create(sink -> pushStatusMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    private Mono<? extends Artifact> publishArtifact(Artifact artifact, boolean publish) {
        if (!Boolean.TRUE.equals(publish)) {
            return Mono.just(artifact);
        }

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifact.getArtifactType());
        return gitArtifactHelper.publishArtifact(artifact);
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

    /**
     * Method to remove all the git metadata for the application and connected resources. This will remove:
     * - local repo
     * - all the branched applications present in DB except for default application
     *
     * @param defaultArtifactId application which needs to be disconnected from git connection
     * @return Application data
     */
    @Override
    public Mono<? extends Artifact> detachRemote(String defaultArtifactId, ArtifactType artifactType) {
        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission gitConnectPermission = gitArtifactHelper.getArtifactGitConnectPermission();

        Mono<? extends Artifact> disconnectMono = gitArtifactHelper
                .getArtifactById(defaultArtifactId, gitConnectPermission)
                .flatMap(defaultArtifact -> {
                    if (Optional.ofNullable(defaultArtifact.getGitArtifactMetadata())
                                    .isEmpty()
                            || isDefaultGitMetadataInvalid(defaultArtifact.getGitArtifactMetadata())) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.INVALID_GIT_CONFIGURATION,
                                "Please reconfigure the application to connect to git repo"));
                    }
                    // Remove the git contents from file system
                    GitArtifactMetadata gitArtifactMetadata = defaultArtifact.getGitArtifactMetadata();
                    String repoName = gitArtifactMetadata.getRepoName();

                    Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(
                            defaultArtifact.getWorkspaceId(), gitArtifactMetadata.getDefaultApplicationId(), repoName);
                    String defaultApplicationBranchName = gitArtifactMetadata.getBranchName();
                    String remoteUrl = gitArtifactMetadata.getRemoteUrl();
                    String privateKey = gitArtifactMetadata.getGitAuth().getPrivateKey();
                    String publicKey = gitArtifactMetadata.getGitAuth().getPublicKey();
                    return Mono.zip(
                            gitExecutor.listBranches(repoSuffix),
                            Mono.just(defaultArtifact),
                            Mono.just(repoSuffix),
                            Mono.just(defaultApplicationBranchName));
                })
                .flatMap(tuple -> {
                    Artifact defaultArtifact = tuple.getT2();
                    Path repoSuffix = tuple.getT3();
                    List<String> localBranches = tuple.getT1().stream()
                            .map(GitBranchDTO::getBranchName)
                            .filter(branchName -> !branchName.startsWith("origin"))
                            .collect(Collectors.toList());

                    // Remove the parent application branch name from the list
                    localBranches.remove(tuple.getT4());
                    defaultArtifact.setGitArtifactMetadata(null);
                    gitArtifactHelper.resetAttributeInDefaultArtifact(defaultArtifact);

                    Mono<Boolean> removeRepoMono = commonGitFileUtils.deleteLocalRepo(repoSuffix);

                    Mono<? extends Artifact> updatedArtifactMono = gitArtifactHelper.saveArtifact(defaultArtifact);

                    Flux<? extends Artifact> deleteAllBranchesFlux =
                            gitArtifactHelper.deleteAllBranches(defaultArtifactId, localBranches);

                    return Mono.zip(updatedArtifactMono, removeRepoMono, deleteAllBranchesFlux.collectList())
                            .map(Tuple3::getT1);
                })
                .flatMap(updatedDefaultArtifact -> {
                    return gitArtifactHelper
                            .disconnectEntitiesOfDefaultArtifact(updatedDefaultArtifact)
                            .then(addAnalyticsForGitOperation(
                                    AnalyticsEvents.GIT_DISCONNECT, updatedDefaultArtifact, false))
                            .map(gitArtifactHelper::updateArtifactWithDefaultReponseUtils);
                });

        return Mono.create(sink -> disconnectMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    @Override
    public Mono<Map<String, GitProfile>> updateOrCreateGitProfileForCurrentUser(
            GitProfile gitProfile, String defaultArtifactId) {

        // Throw error in following situations:
        // 1. Updating or creating global git profile (defaultApplicationId = "default") and update is made with empty
        //    authorName or authorEmail
        // 2. Updating or creating repo specific profile and user want to use repo specific profile but provided empty
        //    values for authorName and email

        if ((DEFAULT.equals(defaultArtifactId) || Boolean.FALSE.equals(gitProfile.getUseGlobalProfile()))
                && StringUtils.isEmptyOrNull(gitProfile.getAuthorName())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Author Name"));
        } else if ((DEFAULT.equals(defaultArtifactId) || Boolean.FALSE.equals(gitProfile.getUseGlobalProfile()))
                && StringUtils.isEmptyOrNull(gitProfile.getAuthorEmail())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Author Email"));
        } else if (StringUtils.isEmptyOrNull(defaultArtifactId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ARTIFACT_ID));
        }

        if (DEFAULT.equals(defaultArtifactId)) {
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
                            GitProfile savedProfile = userData.getGitProfileByKey(defaultArtifactId);
                            GitProfile defaultGitProfile = userData.getGitProfileByKey(DEFAULT);

                            if (savedProfile == null || !savedProfile.equals(gitProfile) || defaultGitProfile == null) {
                                userData.setGitProfiles(userData.setGitProfileByKey(defaultArtifactId, gitProfile));

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
            analyticsProps.put(FieldName.APPLICATION_ID, gitData.getDefaultApplicationId());
            analyticsProps.put("appId", gitData.getDefaultApplicationId());
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

    private boolean isDefaultGitMetadataInvalid(GitArtifactMetadata gitArtifactMetadata) {
        return Optional.ofNullable(gitArtifactMetadata).isEmpty()
                || Optional.ofNullable(gitArtifactMetadata.getGitAuth()).isEmpty()
                || StringUtils.isEmptyOrNull(gitArtifactMetadata.getGitAuth().getPrivateKey())
                || StringUtils.isEmptyOrNull(gitArtifactMetadata.getGitAuth().getPublicKey());
    }
}
