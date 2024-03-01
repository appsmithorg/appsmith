package com.appsmith.server.services.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.Assets;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ExportableArtifact;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.GitFileUtils;
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
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.lib.BranchTrackingStatus;
import org.eclipse.jgit.util.StringUtils;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.io.IOException;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

import static com.appsmith.server.constants.SerialiseArtifactObjective.VERSION_CONTROL;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT;
import static com.appsmith.server.helpers.GitUtils.MAX_RETRIES;
import static com.appsmith.server.helpers.GitUtils.RETRY_DELAY;

@Slf4j
@RequiredArgsConstructor
public class CommonGitServiceCEImpl implements CommonGitServiceCE {

    private final CommonGitFileUtils commonGitFileUtils;
    private final GitFileUtils gitFileUtils;
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

        Mono<? extends ExportableArtifact> branchedAppMono = artifactGitHelper
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
                    ExportableArtifact branchedArtifact = tuple2.getT2();
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
                    ExportableArtifact exportableArtifact = tuple.getT2();
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
                    ExportableArtifact artifact = objects.getT2().getT3();
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

        Mono<? extends ExportableArtifact> branchedArtifactMono = artifactGitHelper
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
                    ExportableArtifact artifact = tuple3.getT2();
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
                    ExportableArtifact artifact = objects.getT2().getT2();
                    return sendUnitExecutionTimeAnalyticsEvent(
                                    AnalyticsEvents.GIT_FETCH.getEventName(), elapsedTime, currentUser, artifact)
                            .thenReturn(branchTrackingStatus);
                });

        return Mono.create(sink -> {
            fetchRemoteStatusMono.subscribe(sink::success, sink::error, null, sink.currentContext());
        });
    }

    private Mono<Void> sendUnitExecutionTimeAnalyticsEvent(
            String flowName, Long elapsedTime, User currentUser, ExportableArtifact artifact) {
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
        Mono<? extends ExportableArtifact> defaultArtifactMono =
                gitArtifactHelper.getArtifactById(defaultApplicationId, artifactEditPermission);

        return Mono.zip(defaultArtifactMono, userDataService.getForCurrentUser())
                .map(tuple -> {
                    ExportableArtifact artifact = tuple.getT1();
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
}
