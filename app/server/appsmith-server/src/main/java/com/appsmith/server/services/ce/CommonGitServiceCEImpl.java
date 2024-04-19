package com.appsmith.server.services.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.constants.ErrorReferenceDocUrl;
import com.appsmith.external.dtos.GitBranchDTO;
import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.external.git.constants.GitConstants;
import com.appsmith.external.git.constants.GitSpan;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.Assets;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.GitDefaultCommitMessage;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.AutoCommitConfig;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitDeployKeys;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.AutoCommitProgressDTO;
import com.appsmith.server.dtos.GitCommitDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitDocsDTO;
import com.appsmith.server.dtos.GitMergeDTO;
import com.appsmith.server.dtos.GitPullDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.GitDeployKeyGenerator;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.helpers.GitUtils;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.helpers.ce.GitAutoCommitHelper;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.repositories.GitDeployKeysRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.GitArtifactHelper;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
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
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.Exceptions;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple3;
import reactor.util.retry.Retry;

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
import static com.appsmith.external.git.constants.ce.GitConstantsCE.CONFLICTED_SUCCESS_MESSAGE;
import static com.appsmith.external.git.constants.ce.GitConstantsCE.MERGE_CONFLICT_BRANCH_NAME;
import static com.appsmith.external.git.constants.ce.GitSpanCE.OPS_COMMIT;
import static com.appsmith.external.git.constants.ce.GitSpanCE.OPS_STATUS;
import static com.appsmith.git.constants.AppsmithBotAsset.APPSMITH_BOT_USERNAME;
import static com.appsmith.server.constants.SerialiseArtifactObjective.VERSION_CONTROL;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT;
import static com.appsmith.server.helpers.GitUtils.MAX_RETRIES;
import static com.appsmith.server.helpers.GitUtils.RETRY_DELAY;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.apache.commons.lang.ObjectUtils.defaultIfNull;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommonGitServiceCEImpl implements CommonGitServiceCE {

    private final GitDeployKeysRepository gitDeployKeysRepository;
    private final GitPrivateRepoHelper gitPrivateRepoHelper;
    private final CommonGitFileUtils commonGitFileUtils;
    private final RedisUtils redisUtils;
    protected final SessionUserService sessionUserService;
    private final UserDataService userDataService;
    protected final UserService userService;
    private final EmailConfig emailConfig;
    private final TransactionalOperator transactionalOperator;

    protected final AnalyticsService analyticsService;
    private final ObservationRegistry observationRegistry;

    private final ExportService exportService;
    private final ImportService importService;

    private final GitExecutor gitExecutor;
    private final GitArtifactHelper<Application> gitApplicationHelper;
    private final GitAutoCommitHelper gitAutoCommitHelper;

    private static final String ORIGIN = "origin/";
    private static final String REMOTE_NAME_REPLACEMENT = "";

    private Mono<Boolean> addFileLock(String defaultArtifactId, boolean isLockRequired) {
        if (!Boolean.TRUE.equals(isLockRequired)) {
            return Mono.just(Boolean.TRUE);
        }

        return Mono.defer(() -> addFileLock(defaultArtifactId));
    }

    private Mono<Boolean> addFileLock(String defaultArtifactId) {
        return redisUtils
                .addFileLock(defaultArtifactId)
                .retryWhen(Retry.fixedDelay(MAX_RETRIES, RETRY_DELAY)
                        .onRetryExhaustedThrow((retryBackoffSpec, retrySignal) -> {
                            throw new AppsmithException(AppsmithError.GIT_FILE_IN_USE);
                        }))
                .name(GitSpan.ADD_FILE_LOCK)
                .tap(Micrometer.observation(observationRegistry));
    }

    private Mono<Boolean> releaseFileLock(String defaultArtifactId, boolean isLockRequired) {
        if (!Boolean.TRUE.equals(isLockRequired)) {
            return Mono.just(Boolean.TRUE);
        }

        return releaseFileLock(defaultArtifactId);
    }

    private Mono<Boolean> releaseFileLock(String defaultArtifactId) {
        return redisUtils
                .releaseFileLock(defaultArtifactId)
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
            String defaultArtifactId, GitArtifactMetadata gitArtifactMetadata, ArtifactType artifactType) {

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
                .getArtifactById(defaultArtifactId, artifactEditPermission)
                .flatMap(artifact -> updateArtifactWithGitMetadataGivenPermission(artifact, gitArtifactMetadata));
    }

    /**
     * Method to get commit history for application branch
     *
     * @param defaultArtifactId artifact for which the commit history is needed
     * @return list of commits
     **/
    @Override
    public Mono<List<GitLogDTO>> getCommitHistory(
            String branchName, String defaultArtifactId, ArtifactType artifactType) {
        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactReadPermission = gitArtifactHelper.getArtifactReadPermission();

        Mono<? extends Artifact> artifactMono = gitArtifactHelper.getArtifactByDefaultIdAndBranchName(
                defaultArtifactId, branchName, artifactReadPermission);

        return artifactMono.flatMap(this::getCommitHistory);
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
    public Mono<GitStatusDTO> getStatus(
            String defaultArtifactId, boolean compareRemote, String branchName, ArtifactType artifactType) {
        return getStatus(defaultArtifactId, branchName, true, compareRemote, artifactType);
    }

    private Mono<GitStatusDTO> getStatus(
            String defaultArtifactId, String branchName, boolean isFileLock, ArtifactType artifactType) {
        return getStatus(defaultArtifactId, branchName, isFileLock, true, artifactType);
    }

    protected Mono<GitStatusDTO> getStatus(
            Artifact defaultArtifact,
            Artifact branchedArtifact,
            String branchName,
            boolean isFileLock,
            boolean compareRemote) {

        if (StringUtils.isEmptyOrNull(branchName)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        }

        ArtifactType artifactType = defaultArtifact.getArtifactType();
        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);

        GitArtifactMetadata defaultGitMetadata = defaultArtifact.getGitArtifactMetadata();
        final String defaultArtifactId = defaultGitMetadata.getDefaultArtifactId();
        final String finalBranchName = branchName.replaceFirst(ORIGIN, REMOTE_NAME_REPLACEMENT);

        /*
           1. Copy resources from DB to local repo
           2. Fetch the current status from local repo
        */
        Mono<? extends ArtifactExchangeJson> exportedArtifactJsonMono = exportService
                .exportByArtifactId(branchedArtifact.getId(), VERSION_CONTROL, artifactType)
                .elapsed()
                .map(longTuple2 -> {
                    log.debug("export took: {}", longTuple2.getT1());
                    return longTuple2.getT2();
                });

        Mono<GitStatusDTO> statusMono = Mono.zip(
                        Mono.just(defaultGitMetadata), Mono.just(branchedArtifact), exportedArtifactJsonMono)
                .flatMap(artifactAndJsonTuple3 -> addFileLock(defaultArtifactId, isFileLock)
                        .elapsed()
                        .map(elapsedTuple -> {
                            log.debug("file lock took: {}", elapsedTuple.getT1());
                            return artifactAndJsonTuple3;
                        }))
                .flatMap(tuple -> {
                    GitArtifactMetadata defaultArtifactMetadata = tuple.getT1();
                    Artifact exportableArtifact = tuple.getT2();
                    ArtifactExchangeJson artifactExchangeJson = tuple.getT3();

                    GitArtifactMetadata gitData = exportableArtifact.getGitArtifactMetadata();
                    gitData.setGitAuth(defaultArtifactMetadata.getGitAuth());

                    Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(
                            exportableArtifact.getWorkspaceId(), gitData.getDefaultArtifactId(), gitData.getRepoName());

                    try {
                        // Create a Mono to fetch the status from remote
                        Path repoSuffixForFetchRemote = gitArtifactHelper.getRepoSuffixPath(
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
                    return releaseFileLock(defaultArtifactId, isFileLock).thenReturn(result);
                    // release the lock if there's a successful response
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

        return Mono.zip(statusMono, sessionUserService.getCurrentUser())
                .elapsed()
                .flatMap(objects -> {
                    Long elapsedTime = objects.getT1();
                    log.debug("Multi mono took: {}", elapsedTime);
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
     * Get the status of the mentioned branch
     *
     * @param defaultArtifactId root/default application
     * @param branchName        for which the status is required
     * @param isFileLock        if the locking is required, since the status API is used in the other flows of git
     *                          Only for the direct hits from the client the locking will be added
     * @param artifactType
     * @return Map of json file names which are added, modified, conflicting, removed and the working tree if this is clean
     */
    private Mono<GitStatusDTO> getStatus(
            String defaultArtifactId,
            String branchName,
            boolean isFileLock,
            boolean compareRemote,
            ArtifactType artifactType) {

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
                })
                .name(OPS_STATUS)
                .tap(Micrometer.observation(observationRegistry));
    }

    @Override
    public Mono<BranchTrackingStatus> fetchRemoteChanges(
            Artifact defaultArtifact, Artifact branchedArtifact, String branchName, boolean isFileLock) {

        if (StringUtils.isEmptyOrNull(branchName)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        }

        if (branchedArtifact == null || defaultArtifact == null || defaultArtifact.getGitArtifactMetadata() == null) {
            return Mono.error(new AppsmithException(AppsmithError.GIT_GENERIC_ERROR));
        }

        final String finalBranchName = branchName.replaceFirst(ORIGIN, REMOTE_NAME_REPLACEMENT);
        GitArtifactMetadata defaultGitData = defaultArtifact.getGitArtifactMetadata();
        String defaultArtifactId = defaultGitData.getDefaultArtifactId();

        GitArtifactHelper<?> artifactGitHelper = getArtifactGitService(defaultArtifact.getArtifactType());

        Mono<User> currUserMono = sessionUserService.getCurrentUser().cache(); // will be used to send analytics event

        Mono<Boolean> addFileLockMono = Mono.just(Boolean.TRUE);
        if (Boolean.TRUE.equals(isFileLock)) {
            addFileLockMono = addFileLock(defaultArtifactId);
        }
        /*
           1. Copy resources from DB to local repo
           2. Fetch the current status from local repo
        */

        // current user mono has been zipped just to run in parallel.
        Mono<BranchTrackingStatus> fetchRemoteStatusMono = addFileLockMono
                .flatMap(isFileLocked -> {
                    GitArtifactMetadata gitData = branchedArtifact.getGitArtifactMetadata();
                    gitData.setGitAuth(defaultGitData.getGitAuth());

                    Path repoSuffix = artifactGitHelper.getRepoSuffixPath(
                            branchedArtifact.getWorkspaceId(), gitData.getDefaultArtifactId(), gitData.getRepoName());

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
                            .then(Mono.defer(() -> fetchRemoteMono))
                            .then(Mono.defer(() -> branchedStatusMono))
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
                            artifact.getWorkspaceId(), gitData.getDefaultArtifactId(), gitData.getRepoName());

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
                })
                .name(GitSpan.OPS_FETCH_REMOTE)
                .tap(Micrometer.observation(observationRegistry));

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

    @Override
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
    @Override
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
    @Override
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
                    } else if (StringUtils.isEmptyOrNull(gitArtifactMetadata.getDefaultArtifactId())) {
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
                            exportService.exportByArtifactId(branchedArtifact.getId(), VERSION_CONTROL, artifactType),
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
                            updateArtifactWithGitMetadataGivenPermission(branchedArtifact, gitData);
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
    public Mono<String> pushArtifact(String defaultArtifactId, String branchName, ArtifactType artifactType) {

        if (StringUtils.isEmptyOrNull(branchName)) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME);
        }

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        return gitArtifactHelper
                .getArtifactByDefaultIdAndBranchName(defaultArtifactId, branchName, artifactEditPermission)
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

    @Override
    public Mono<? extends Artifact> checkoutBranch(
            String defaultArtifactId, String branchName, boolean addFileLock, ArtifactType artifactType) {

        if (StringUtils.isEmptyOrNull(branchName)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        }

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<? extends Artifact> sourceArtifactMono = gitArtifactHelper.getArtifactByDefaultIdAndBranchName(
                defaultArtifactId, branchName, artifactEditPermission);
        return sourceArtifactMono.flatMap(sourceArtifact -> checkoutBranch(sourceArtifact, branchName, addFileLock));
    }

    protected Mono<? extends Artifact> checkoutBranch(Artifact sourceArtifact, String branchName, boolean addFileLock) {

        if (StringUtils.isEmptyOrNull(branchName)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        }

        GitArtifactMetadata gitArtifactMetadata = sourceArtifact.getGitArtifactMetadata();
        String defaultArtifactId = gitArtifactMetadata.getDefaultArtifactId();
        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(sourceArtifact.getArtifactType());

        Mono<? extends Artifact> sourceAritfactMono = Mono.just(sourceArtifact);

        // If the user is trying to check out remote branch, create a new branch if the branch does not exist already
        if (branchName.startsWith(ORIGIN)) {
            String finalBranchName = branchName.replaceFirst(ORIGIN, REMOTE_NAME_REPLACEMENT);
            Path repoPath = gitArtifactHelper.getRepoSuffixPath(
                    sourceArtifact.getWorkspaceId(),
                    gitArtifactMetadata.getDefaultArtifactId(),
                    gitArtifactMetadata.getRepoName());

            sourceAritfactMono = addFileLock(defaultArtifactId)
                    .then(gitExecutor.listBranches(repoPath))
                    .flatMap(branchList -> releaseFileLock(defaultArtifactId).thenReturn(branchList))
                    .flatMap(gitBranchDTOList -> {
                        long branchMatchCount = gitBranchDTOList.stream()
                                .filter(gitBranchDTO ->
                                        gitBranchDTO.getBranchName().equals(finalBranchName))
                                .count();
                        if (branchMatchCount == 0) {
                            return checkoutRemoteBranch(
                                    defaultArtifactId, finalBranchName, sourceArtifact.getArtifactType());
                        } else {
                            return Mono.error(new AppsmithException(
                                    AppsmithError.GIT_ACTION_FAILED,
                                    "checkout",
                                    branchName + " already exists in local - "
                                            + branchName.replaceFirst(ORIGIN, REMOTE_NAME_REPLACEMENT)));
                        }
                    });
        } else {

            if (isDefaultGitMetadataInvalid(gitArtifactMetadata)) {
                return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
            }

            sourceAritfactMono = gitArtifactHelper
                    .getArtifactByDefaultIdAndBranchName(
                            defaultArtifactId, branchName, gitArtifactHelper.getArtifactReadPermission())
                    .flatMap(artifact -> addAnalyticsForGitOperation(
                            AnalyticsEvents.GIT_CHECKOUT_BRANCH,
                            artifact,
                            artifact.getGitArtifactMetadata().getIsRepoPrivate()))
                    .map(gitArtifactHelper::updateArtifactWithDefaultReponseUtils);
        }

        return releaseFileLock(defaultArtifactId, addFileLock)
                .then(sourceAritfactMono)
                .tag(GitConstants.GitMetricConstants.CHECKOUT_REMOTE, FALSE.toString())
                .name(GitSpan.OPS_CHECKOUT_BRANCH)
                .tap(Micrometer.observation(observationRegistry))
                .onErrorResume(throwable -> {
                    return Mono.error(throwable);
                });
    }

    private Mono<? extends Artifact> checkoutRemoteBranch(
            String defaultArtifactId, String branchName, ArtifactType artifactType) {
        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<? extends Artifact> defaultArtifactMono =
                gitArtifactHelper.getArtifactById(defaultArtifactId, artifactEditPermission);
        Mono<? extends Artifact> checkoutRemoteBranchMono = addFileLock(defaultArtifactId)
                .zipWith(defaultArtifactMono)
                .flatMap(tuple2 -> {
                    Artifact artifact = tuple2.getT2();
                    GitArtifactMetadata gitArtifactMetadata = artifact.getGitArtifactMetadata();
                    String repoName = gitArtifactMetadata.getRepoName();

                    Path repoPath =
                            gitArtifactHelper.getRepoSuffixPath(artifact.getWorkspaceId(), defaultArtifactId, repoName);

                    return gitExecutor
                            .fetchRemote(
                                    repoPath,
                                    gitArtifactMetadata.getGitAuth().getPublicKey(),
                                    gitArtifactMetadata.getGitAuth().getPrivateKey(),
                                    false,
                                    branchName,
                                    true)
                            .flatMap(fetchStatus -> gitExecutor
                                    .checkoutRemoteBranch(repoPath, branchName)
                                    .zipWith(Mono.just(artifact))
                                    .onErrorResume(error -> Mono.error(new AppsmithException(
                                            AppsmithError.GIT_ACTION_FAILED, "checkout branch", error.getMessage()))));
                })
                .flatMap(tuple2 -> {
                    /*
                     * create a new application(each application => git branch)
                     * Populate the application from the file system
                     * Check if the existing branch track the given remote branch using the StoredConfig
                     * Use the create branch method with isRemoteFlag or use the setStartPoint ,method in createBranch method
                     * */

                    Artifact artifact = tuple2.getT2();
                    Mono<? extends Artifact> artifactMono;
                    GitArtifactMetadata srcBranchGitData = artifact.getGitArtifactMetadata();
                    if (branchName.equals(srcBranchGitData.getBranchName())) {
                        /*
                         in this case, user deleted the initial default branch and now wants to check out to that branch.
                         as we didn't delete the application object but only the branch from git repo,
                         we can just use this existing application without creating a new one.
                        */
                        artifactMono = Mono.just(artifact);
                    } else {
                        // create new Artifact
                        artifactMono = gitArtifactHelper.createNewArtifactForCheckout(artifact, branchName);
                    }

                    Mono<ArtifactExchangeJson> artifactExchangeJsonMono =
                            commonGitFileUtils.reconstructArtifactExchangeJsonFromGitRepoWithAnalytics(
                                    artifact.getWorkspaceId(),
                                    defaultArtifactId,
                                    srcBranchGitData.getRepoName(),
                                    branchName,
                                    artifactType);

                    return artifactExchangeJsonMono.zipWith(artifactMono).onErrorResume(throwable -> {
                        if (throwable instanceof DuplicateKeyException) {
                            artifactExchangeJsonMono.zipWith(Mono.just(artifact));
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
                    return importService
                            .importArtifactInWorkspaceFromGit(
                                    artifact.getWorkspaceId(), artifact.getId(), artifactExchangeJson, branchName)
                            .flatMap(artifact1 -> addAnalyticsForGitOperation(
                                    AnalyticsEvents.GIT_CHECKOUT_REMOTE_BRANCH,
                                    artifact1,
                                    Boolean.TRUE.equals(
                                            artifact1.getGitArtifactMetadata().getIsRepoPrivate())))
                            .map(gitArtifactHelper::updateArtifactWithDefaultReponseUtils)
                            .flatMap(artifact1 ->
                                    releaseFileLock(defaultArtifactId).then(Mono.just(artifact1)));
                })
                .tag(GitConstants.GitMetricConstants.CHECKOUT_REMOTE, TRUE.toString())
                .name(GitSpan.OPS_CHECKOUT_BRANCH)
                .tap(Micrometer.observation(observationRegistry));

        return Mono.create(
                sink -> checkoutRemoteBranchMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
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
                            defaultArtifact.getWorkspaceId(), gitArtifactMetadata.getDefaultArtifactId(), repoName);
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
                })
                .name(GitSpan.OPS_DETACH_REMOTE)
                .tap(Micrometer.observation(observationRegistry));

        return Mono.create(sink -> disconnectMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    @Override
    public Mono<? extends Artifact> createBranch(
            String defaultArtifactId, GitBranchDTO branchDTO, String srcBranch, ArtifactType artifactType) {

        /*
        1. Check if the src artifact is available and user have sufficient permissions
        2. Create and checkout to requested branch
        3. Rehydrate the artifact from source artifact reference
         */

        if (StringUtils.isEmptyOrNull(srcBranch)
                || srcBranch.startsWith(ORIGIN)
                || branchDTO.getBranchName().startsWith(ORIGIN)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        }

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<? extends Artifact> createBranchMono = gitArtifactHelper
                .getArtifactByDefaultIdAndBranchName(defaultArtifactId, srcBranch, artifactEditPermission)
                .zipWhen(sourceArtifact -> {
                    GitArtifactMetadata gitData = sourceArtifact.getGitArtifactMetadata();
                    if (sourceArtifact.getId().equals(gitData.getDefaultArtifactId())) {
                        return Mono.just(sourceArtifact.getGitArtifactMetadata().getGitAuth());
                    }

                    return gitArtifactHelper
                            .getSshKeys(gitData.getDefaultArtifactId())
                            .map(gitAuthDTO -> {
                                GitAuth gitAuth = new GitAuth();
                                gitAuth.setPrivateKey(gitAuthDTO.getPrivateKey());
                                gitAuth.setPublicKey(gitAuthDTO.getPublicKey());
                                gitAuth.setDocUrl(gitAuthDTO.getDocUrl());
                                return gitAuth;
                            });
                })
                .flatMap(tuple -> {
                    Artifact sourceArtifact = tuple.getT1();
                    GitAuth defaultGitAuth = tuple.getT2();
                    GitArtifactMetadata srcBranchGitData = sourceArtifact.getGitArtifactMetadata();

                    if (srcBranchGitData == null
                            || StringUtils.isEmptyOrNull(srcBranchGitData.getDefaultArtifactId())
                            || StringUtils.isEmptyOrNull(srcBranchGitData.getRepoName())) {
                        return Mono.error(
                                new AppsmithException(
                                        AppsmithError.INVALID_GIT_CONFIGURATION,
                                        "Unable to find the parent branch. Please create a branch from other available branches"));
                    }

                    Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(
                            sourceArtifact.getWorkspaceId(),
                            srcBranchGitData.getDefaultArtifactId(),
                            srcBranchGitData.getRepoName());

                    // Create a new branch from the parent checked out branch
                    return addFileLock(srcBranchGitData.getDefaultArtifactId())
                            .flatMap(status -> gitExecutor.checkoutToBranch(repoSuffix, srcBranch))
                            .onErrorResume(error -> Mono.error(new AppsmithException(
                                    AppsmithError.GIT_ACTION_FAILED, "checkout", "Unable to find " + srcBranch)))
                            .zipWhen(isCheckedOut -> gitExecutor
                                    .fetchRemote(
                                            repoSuffix,
                                            defaultGitAuth.getPublicKey(),
                                            defaultGitAuth.getPrivateKey(),
                                            false,
                                            srcBranch,
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
                                final String sourceArtifactId = sourceArtifact.getId();

                                Mono<? extends ArtifactExchangeJson> artifactExchangeJsonMono =
                                        exportService.exportByArtifactId(
                                                sourceArtifactId, VERSION_CONTROL, artifactType);
                                Mono<? extends Artifact> newArtifactFromSourceMono =
                                        gitArtifactHelper.createNewArtifactForCheckout(sourceArtifact, branchName);

                                return Mono.zip(newArtifactFromSourceMono, artifactExchangeJsonMono);
                            })
                            .onErrorResume(error -> Mono.error(new AppsmithException(
                                    AppsmithError.GIT_ACTION_FAILED, "branch", error.getMessage())));
                })
                .flatMap(tuple -> {
                    Artifact savedArtifact = tuple.getT1();
                    return importService
                            .importArtifactInWorkspaceFromGit(
                                    savedArtifact.getWorkspaceId(),
                                    savedArtifact.getId(),
                                    tuple.getT2(),
                                    branchDTO.getBranchName())
                            .flatMap(newBranchArtifact -> {
                                // Commit and push for new branch created this is to avoid issues when user tries to
                                // create a
                                // new branch from uncommitted branch
                                GitArtifactMetadata gitData = newBranchArtifact.getGitArtifactMetadata();
                                GitCommitDTO commitDTO = new GitCommitDTO();
                                commitDTO.setCommitMessage(DEFAULT_COMMIT_MESSAGE
                                        + GitDefaultCommitMessage.BRANCH_CREATED.getReason()
                                        + gitData.getBranchName());
                                commitDTO.setDoPush(true);
                                return commitArtifact(
                                                commitDTO,
                                                gitData.getDefaultArtifactId(),
                                                gitData.getBranchName(),
                                                artifactType)
                                        .thenReturn(newBranchArtifact);
                            });
                })
                .flatMap(newBranchArtifact -> releaseFileLock(
                                newBranchArtifact.getGitArtifactMetadata().getDefaultArtifactId())
                        .then(addAnalyticsForGitOperation(
                                AnalyticsEvents.GIT_CREATE_BRANCH,
                                newBranchArtifact,
                                newBranchArtifact.getGitArtifactMetadata().getIsRepoPrivate())))
                .map(gitArtifactHelper::updateArtifactWithDefaultReponseUtils)
                .name(GitSpan.OPS_CREATE_BRANCH)
                .tap(Micrometer.observation(observationRegistry));

        return Mono.create(sink -> createBranchMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    /**
     * Method to pull artifact json files from remote repo, make a commit with the changes present in local DB and
     * make a system commit to remote repo
     *
     * @param defaultArtifactId artifact for which we want to pull remote changes and merge
     * @param branchName        remoteBranch from which the changes will be pulled and merged
     * @param artifactType
     * @return return the status of pull operation
     */
    @Override
    public Mono<GitPullDTO> pullArtifact(String defaultArtifactId, String branchName, ArtifactType artifactType) {
        /*
         * 1.Dehydrate the artifact from DB so that the file system has the latest artifact data
         * 2.Do git pull after the rehydration and merge the remote changes to the current branch
         *   On Merge conflict - throw exception and ask user to resolve these conflicts on remote
         *   TODO create new branch and push the changes to remote and ask the user to resolve it on github/gitlab UI
         * 3.Then rehydrate from the file system to DB so that the latest changes from remote are rendered to the artifact
         * 4.Get the latest artifact from the DB and send it back to client
         * */

        if (!org.springframework.util.StringUtils.hasText(branchName)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, branchName));
        }

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);

        final String finalBranchName = branchName.replaceFirst(ORIGIN, REMOTE_NAME_REPLACEMENT);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<? extends Artifact> defaultArtifactMono =
                gitArtifactHelper.getArtifactById(defaultArtifactId, artifactEditPermission);

        Mono<? extends Artifact> branchedArtifactMono = gitArtifactHelper.getArtifactByDefaultIdAndBranchName(
                defaultArtifactId, finalBranchName, artifactEditPermission);

        Mono<GitPullDTO> pullDTOMono = Mono.zip(defaultArtifactMono, branchedArtifactMono)
                .flatMap(tuple2 -> {
                    Artifact defaultArtifact = tuple2.getT1();
                    Artifact branchedArtifact = tuple2.getT2();
                    GitArtifactMetadata gitMetadata = defaultArtifact.getGitArtifactMetadata();
                    Mono<GitStatusDTO> statusMono =
                            getStatus(defaultArtifact, branchedArtifact, finalBranchName, false, true);
                    return addFileLock(gitMetadata.getDefaultArtifactId())
                            .then(Mono.zip(statusMono, Mono.just(defaultArtifact), Mono.just(branchedArtifact)));
                })
                .flatMap(tuple -> {
                    GitStatusDTO status = tuple.getT1();
                    Artifact defaultArtifact = tuple.getT2();
                    Artifact branchedArtifact = tuple.getT3();

                    // Check if the repo is clean
                    if (!CollectionUtils.isNullOrEmpty(status.getModified())) {
                        return Mono.error(
                                new AppsmithException(
                                        AppsmithError.GIT_ACTION_FAILED,
                                        "pull",
                                        "There are uncommitted changes present in your local. Please commit them first and then try git pull"));
                    }
                    return pullAndRehydrateArtifact(defaultArtifact, branchedArtifact, branchName)
                            // Release file lock after the pull operation
                            .flatMap(gitPullDTO ->
                                    releaseFileLock(defaultArtifactId).then(Mono.just(gitPullDTO)));
                })
                .name(GitSpan.OPS_PULL)
                .tap(Micrometer.observation(observationRegistry));

        return Mono.create(sink -> pullDTOMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    /**
     * Method to pull the files from remote repo and rehydrate the application
     *
     * @param defaultArtifact : base artifact
     * @param branchedArtifact : a branch created from branches of base artifact
     * @param branchName       branch for which the pull is required
     * @return pull DTO with updated application
     */
    private Mono<GitPullDTO> pullAndRehydrateArtifact(
            Artifact defaultArtifact, Artifact branchedArtifact, String branchName) {
        /*
        1. Checkout to the concerned branch
        2. Do git pull after
            On Merge conflict - throw exception and ask user to resolve these conflicts on remote
            TODO create new branch and push the changes to remote and ask the user to resolve it on github/gitlab UI
        3. Rehydrate the application from filesystem so that the latest changes from remote are rendered to the application
        */

        GitArtifactMetadata gitData = defaultArtifact.getGitArtifactMetadata();
        if (isDefaultGitMetadataInvalid(gitData)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
        }

        ArtifactType artifactType = defaultArtifact.getArtifactType();
        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(
                defaultArtifact.getWorkspaceId(), gitData.getDefaultArtifactId(), gitData.getRepoName());

        return Mono.just(branchedArtifact)
                .flatMap(branchedArtifact1 -> {
                    // git checkout and pull origin branchName
                    try {
                        Mono<MergeStatusDTO> pullStatusMono = gitExecutor
                                .checkoutToBranch(repoSuffix, branchName)
                                .then(gitExecutor.pullApplication(
                                        repoSuffix,
                                        gitData.getRemoteUrl(),
                                        branchName,
                                        gitData.getGitAuth().getPrivateKey(),
                                        gitData.getGitAuth().getPublicKey()))
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
                                        branchedArtifact1.getWorkspaceId(),
                                        branchedArtifact1
                                                .getGitArtifactMetadata()
                                                .getDefaultArtifactId(),
                                        branchedArtifact1
                                                .getGitArtifactMetadata()
                                                .getRepoName(),
                                        branchName,
                                        artifactType));

                        return Mono.zip(pullStatusMono, Mono.just(branchedArtifact1), artifactExchangeJsonMono);
                    } catch (IOException e) {
                        return Mono.error(new AppsmithException(AppsmithError.GIT_FILE_SYSTEM_ERROR, e.getMessage()));
                    }
                })
                .flatMap(tuple -> {
                    MergeStatusDTO status = tuple.getT1();
                    Artifact branchedApplication = tuple.getT2();
                    ArtifactExchangeJson artifactExchangeJson = tuple.getT3();

                    // Get the latest application with all the changes
                    // Commit and push changes to sync with remote
                    return importService
                            .importArtifactInWorkspaceFromGit(
                                    branchedApplication.getWorkspaceId(),
                                    branchedApplication.getId(),
                                    artifactExchangeJson,
                                    branchName)
                            .flatMap(artifact -> addAnalyticsForGitOperation(
                                            AnalyticsEvents.GIT_PULL,
                                            artifact,
                                            artifact.getGitArtifactMetadata().getIsRepoPrivate())
                                    .thenReturn(artifact))
                            .flatMap(artifact -> {
                                GitCommitDTO commitDTO = new GitCommitDTO();
                                commitDTO.setCommitMessage(DEFAULT_COMMIT_MESSAGE
                                        + GitDefaultCommitMessage.SYNC_WITH_REMOTE_AFTER_PULL.getReason());
                                commitDTO.setDoPush(true);

                                Artifact artifactWithUpdatedResource =
                                        gitArtifactHelper.updateArtifactWithDefaultReponseUtils(artifact);
                                GitPullDTO gitPullDTO = new GitPullDTO();
                                gitPullDTO.setMergeStatus(status);
                                gitPullDTO.setArtifact(artifactWithUpdatedResource);

                                // Make commit and push after pull is successful to have a clean repo
                                return this.commitArtifact(
                                                commitDTO,
                                                artifact.getGitArtifactMetadata()
                                                        .getDefaultArtifactId(),
                                                branchName,
                                                artifactType)
                                        .thenReturn(gitPullDTO);
                            });
                });
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
    public Mono<GitProfile> getGitProfileForUser(String defaultArtifactId) {
        return userDataService.getForCurrentUser().map(userData -> {
            GitProfile gitProfile = userData.getGitProfileByKey(defaultArtifactId);
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

    private boolean isDefaultGitMetadataInvalid(GitArtifactMetadata gitArtifactMetadata) {
        return Optional.ofNullable(gitArtifactMetadata).isEmpty()
                || Optional.ofNullable(gitArtifactMetadata.getGitAuth()).isEmpty()
                || StringUtils.isEmptyOrNull(gitArtifactMetadata.getGitAuth().getPrivateKey())
                || StringUtils.isEmptyOrNull(gitArtifactMetadata.getGitAuth().getPublicKey());
    }

    @Override
    public Mono<? extends Artifact> deleteBranch(
            String defaultArtifactId, String branchName, ArtifactType artifactType) {

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<? extends Artifact> defaultArtifactMono =
                gitArtifactHelper.getArtifactById(defaultArtifactId, artifactEditPermission);

        Mono<? extends Artifact> deleteBranchMono = defaultArtifactMono
                .zipWhen(defaultArtifact ->
                        gitPrivateRepoHelper.isBranchProtected(defaultArtifact.getGitArtifactMetadata(), branchName))
                .map(objects -> {
                    if (objects.getT2()) {
                        throw new AppsmithException(
                                AppsmithError.GIT_ACTION_FAILED,
                                "delete",
                                "Cannot delete protected branch " + branchName);
                    }
                    return objects.getT1();
                })
                .flatMap(defaultArtifact -> addFileLock(defaultArtifactId).map(status -> defaultArtifact))
                .flatMap(defaultArtifact -> {
                    GitArtifactMetadata gitArtifactMetadata = defaultArtifact.getGitArtifactMetadata();
                    Path repoPath = gitArtifactHelper.getRepoSuffixPath(
                            defaultArtifact.getWorkspaceId(), defaultArtifactId, gitArtifactMetadata.getRepoName());

                    if (branchName.equals(gitArtifactMetadata.getDefaultBranchName())) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.GIT_ACTION_FAILED, "delete branch", " Cannot delete default branch"));
                    }
                    return gitExecutor
                            .deleteBranch(repoPath, branchName)
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
                                    releaseFileLock(defaultArtifactId).map(status -> isBranchDeleted))
                            .flatMap(isBranchDeleted -> {
                                if (FALSE.equals(isBranchDeleted)) {
                                    return Mono.error(new AppsmithException(
                                            AppsmithError.GIT_ACTION_FAILED,
                                            " delete branch. Branch does not exists in the repo"));
                                }

                                return gitArtifactHelper
                                        .getArtifactByDefaultIdAndBranchName(
                                                defaultArtifactId, branchName, artifactEditPermission)
                                        .flatMap(branchedArtifact -> {
                                            if (branchedArtifact
                                                    .getId()
                                                    .equals(branchedArtifact
                                                            .getGitArtifactMetadata()
                                                            .getDefaultArtifactId())) {
                                                return Mono.just(branchedArtifact);
                                            }

                                            return gitArtifactHelper.deleteArtifactByResource(branchedArtifact);
                                        })
                                        .onErrorResume(throwable -> {
                                            log.warn("Unable to find branch with name ", throwable);
                                            return addAnalyticsForGitOperation(
                                                            AnalyticsEvents.GIT_DELETE_BRANCH,
                                                            defaultArtifact,
                                                            throwable.getClass().getName(),
                                                            throwable.getMessage(),
                                                            gitArtifactMetadata.getIsRepoPrivate())
                                                    .flatMap(application1 -> Mono.just(application1));
                                        });
                            });
                })
                .flatMap(branchedArtifact -> addAnalyticsForGitOperation(
                        AnalyticsEvents.GIT_DELETE_BRANCH,
                        branchedArtifact,
                        branchedArtifact.getGitArtifactMetadata().getIsRepoPrivate()))
                .map(gitArtifactHelper::updateArtifactWithDefaultReponseUtils)
                .name(GitSpan.OPS_DELETE_BRANCH)
                .tap(Micrometer.observation(observationRegistry));

        return Mono.create(sink -> deleteBranchMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    @Override
    public Mono<? extends Artifact> discardChanges(
            String defaultArtifactId, String branchName, ArtifactType artifactType) {

        if (StringUtils.isEmptyOrNull(defaultArtifactId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID));
        }

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<? extends Artifact> branchedArtifactMonoCached = gitArtifactHelper.getArtifactByDefaultIdAndBranchName(
                defaultArtifactId, branchName, artifactEditPermission);

        Mono<? extends Artifact> discardChangeMono;

        // Rehydrate the artifact from local file system
        discardChangeMono = branchedArtifactMonoCached
                // Add file lock before proceeding with the git operation
                .flatMap(branchedArtifact -> addFileLock(defaultArtifactId).thenReturn(branchedArtifact))
                .flatMap(branchedArtifact -> {
                    GitArtifactMetadata gitData = branchedArtifact.getGitArtifactMetadata();
                    if (gitData == null || StringUtils.isEmptyOrNull(gitData.getDefaultArtifactId())) {
                        return Mono.error(
                                new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR));
                    }
                    Path repoSuffix = Paths.get(
                            branchedArtifact.getWorkspaceId(), gitData.getDefaultArtifactId(), gitData.getRepoName());
                    return gitExecutor
                            .rebaseBranch(repoSuffix, branchName)
                            .flatMap(rebaseStatus -> {
                                return commonGitFileUtils.reconstructArtifactExchangeJsonFromGitRepoWithAnalytics(
                                        branchedArtifact.getWorkspaceId(),
                                        branchedArtifact
                                                .getGitArtifactMetadata()
                                                .getDefaultArtifactId(),
                                        branchedArtifact
                                                .getGitArtifactMetadata()
                                                .getRepoName(),
                                        branchName,
                                        artifactType);
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
                .flatMap(branchedArtifact -> releaseFileLock(defaultArtifactId)
                        .then(this.addAnalyticsForGitOperation(
                                AnalyticsEvents.GIT_DISCARD_CHANGES, branchedArtifact, null)))
                .map(gitArtifactHelper::updateArtifactWithDefaultReponseUtils)
                .name(GitSpan.OPS_DISCARD_CHANGES)
                .tap(Micrometer.observation(observationRegistry));

        return Mono.create(
                sink -> discardChangeMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    @Override
    public Mono<MergeStatusDTO> mergeBranch(
            String defaultArtifactId, GitMergeDTO gitMergeDTO, ArtifactType artifactType) {
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

        Mono<? extends Artifact> defaultArtifactMono =
                gitArtifactHelper.getArtifactById(defaultArtifactId, artifactEditPermission);

        Mono<MergeStatusDTO> mergeMono = defaultArtifactMono
                .flatMap(defaultArtifact -> {
                    GitArtifactMetadata gitData = defaultArtifact.getGitArtifactMetadata();
                    return addFileLock(gitData.getDefaultArtifactId()).then(Mono.just(defaultArtifact));
                })
                .flatMap(defaultArtifact -> {
                    GitArtifactMetadata gitArtifactMetadata = defaultArtifact.getGitArtifactMetadata();
                    if (isDefaultGitMetadataInvalid(defaultArtifact.getGitArtifactMetadata())) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                    }
                    Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(
                            defaultArtifact.getWorkspaceId(),
                            gitArtifactMetadata.getDefaultArtifactId(),
                            gitArtifactMetadata.getRepoName());

                    // 1. Hydrate from db to file system for both branch Artifacts
                    Mono<Path> pathToFile = this.getStatus(defaultArtifactId, sourceBranch, false, artifactType)
                            .flatMap(status -> {
                                if (!Integer.valueOf(0).equals(status.getBehindCount())) {
                                    return Mono.error(new AppsmithException(
                                            AppsmithError.GIT_MERGE_FAILED_REMOTE_CHANGES,
                                            status.getBehindCount(),
                                            sourceBranch));
                                } else if (!status.getIsClean()) {
                                    return Mono.error(new AppsmithException(
                                            AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES, sourceBranch));
                                }
                                return this.getStatus(defaultArtifactId, destinationBranch, false, artifactType)
                                        .map(status1 -> {
                                            if (!Integer.valueOf(0).equals(status.getBehindCount())) {
                                                return Mono.error(new AppsmithException(
                                                        AppsmithError.GIT_MERGE_FAILED_REMOTE_CHANGES,
                                                        status.getBehindCount(),
                                                        destinationBranch));
                                            } else if (!status.getIsClean()) {
                                                return Mono.error(new AppsmithException(
                                                        AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES,
                                                        destinationBranch));
                                            }
                                            return status1;
                                        });
                            })
                            .thenReturn(repoSuffix);

                    return Mono.zip(Mono.just(defaultArtifact), pathToFile).onErrorResume(error -> {
                        log.error("Error in repo status check for application " + defaultArtifactId, error);
                        if (error instanceof AppsmithException) {
                            return Mono.error(error);
                        }
                        return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "status", error));
                    });
                })
                .flatMap(tuple -> {
                    Artifact defaultArtifact = tuple.getT1();
                    Path repoSuffix = tuple.getT2();

                    // 2. git checkout destinationBranch ---> git merge sourceBranch
                    return Mono.zip(
                                    gitExecutor.mergeBranch(repoSuffix, sourceBranch, destinationBranch),
                                    Mono.just(defaultArtifact))
                            .onErrorResume(error -> addAnalyticsForGitOperation(
                                            AnalyticsEvents.GIT_MERGE,
                                            defaultArtifact,
                                            error.getClass().getName(),
                                            error.getMessage(),
                                            defaultArtifact
                                                    .getGitArtifactMetadata()
                                                    .getIsRepoPrivate())
                                    .flatMap(application -> {
                                        if (error instanceof GitAPIException) {
                                            return Mono.error(new AppsmithException(
                                                    AppsmithError.GIT_MERGE_CONFLICTS, error.getMessage()));
                                        }
                                        return Mono.error(new AppsmithException(
                                                AppsmithError.GIT_ACTION_FAILED, "merge", error.getMessage()));
                                    }));
                })
                .flatMap(mergeStatusTuple -> {
                    Artifact defaultArtifact = mergeStatusTuple.getT2();
                    String mergeStatus = mergeStatusTuple.getT1();

                    // 3. rehydrate from file system to db
                    Mono<? extends ArtifactExchangeJson> artifactExchangeJsonMono =
                            commonGitFileUtils.reconstructArtifactExchangeJsonFromGitRepo(
                                    defaultArtifact.getWorkspaceId(),
                                    defaultArtifact.getGitArtifactMetadata().getDefaultArtifactId(),
                                    defaultArtifact.getGitArtifactMetadata().getRepoName(),
                                    destinationBranch,
                                    artifactType);

                    return Mono.zip(
                            Mono.just(mergeStatus),
                            gitArtifactHelper.getArtifactByDefaultIdAndBranchName(
                                    defaultArtifactId, destinationBranch, artifactEditPermission),
                            artifactExchangeJsonMono);
                })
                .flatMap(tuple -> {
                    Artifact destinationArtifact = tuple.getT2();
                    ArtifactExchangeJson artifactExchangeJson = tuple.getT3();
                    MergeStatusDTO mergeStatusDTO = new MergeStatusDTO();
                    mergeStatusDTO.setStatus(tuple.getT1());
                    mergeStatusDTO.setMergeAble(TRUE);

                    // 4. Get the latest application mono with all the changes
                    return importService
                            .importArtifactInWorkspaceFromGit(
                                    destinationArtifact.getWorkspaceId(),
                                    destinationArtifact.getId(),
                                    artifactExchangeJson,
                                    destinationBranch.replaceFirst(ORIGIN, REMOTE_NAME_REPLACEMENT))
                            .flatMap(artifact -> {
                                GitCommitDTO commitDTO = new GitCommitDTO();
                                commitDTO.setDoPush(true);
                                commitDTO.setCommitMessage(DEFAULT_COMMIT_MESSAGE
                                        + GitDefaultCommitMessage.SYNC_REMOTE_AFTER_MERGE.getReason()
                                        + sourceBranch);
                                return this.commitArtifact(
                                                commitDTO, defaultArtifactId, destinationBranch, artifactType)
                                        .map(commitStatus -> mergeStatusDTO)
                                        .zipWith(Mono.just(artifact));
                            });
                })
                .flatMap(tuple -> {
                    MergeStatusDTO mergeStatusDTO = tuple.getT1();
                    Artifact artifact = tuple.getT2();

                    // Send analytics event
                    return releaseFileLock(defaultArtifactId).flatMap(status -> addAnalyticsForGitOperation(
                                    AnalyticsEvents.GIT_MERGE,
                                    artifact,
                                    artifact.getGitArtifactMetadata().getIsRepoPrivate())
                            .thenReturn(mergeStatusDTO));
                })
                .name(GitSpan.OPS_MERGE_BRANCH)
                .tap(Micrometer.observation(observationRegistry));

        return Mono.create(sink -> mergeMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    @Override
    public Mono<MergeStatusDTO> isBranchMergeable(
            String defaultArtifactId, GitMergeDTO gitMergeDTO, ArtifactType artifactType) {

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

        Mono<? extends Artifact> defaultArtifactMono =
                gitArtifactHelper.getArtifactById(defaultArtifactId, artifactEditPermission);

        Mono<MergeStatusDTO> mergeableStatusMono = defaultArtifactMono.flatMap(artifact -> {
            GitArtifactMetadata gitArtifactMetadata = artifact.getGitArtifactMetadata();
            if (isDefaultGitMetadataInvalid(artifact.getGitArtifactMetadata())) {
                return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
            }

            Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(
                    artifact.getWorkspaceId(),
                    gitArtifactMetadata.getDefaultArtifactId(),
                    gitArtifactMetadata.getRepoName());

            // 1. Hydrate from db to file system for both branch Applications
            // Update function call
            return addFileLock(defaultArtifactId)
                    .flatMap(status -> this.getStatus(defaultArtifactId, sourceBranch, false, artifactType))
                    .flatMap(srcBranchStatus -> {
                        if (!Integer.valueOf(0).equals(srcBranchStatus.getBehindCount())) {
                            return addAnalyticsForGitOperation(
                                            AnalyticsEvents.GIT_MERGE_CHECK,
                                            artifact,
                                            AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES.name(),
                                            AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES.getMessage(
                                                    srcBranchStatus.getBehindCount(), destinationBranch),
                                            artifact.getGitArtifactMetadata().getIsRepoPrivate(),
                                            false,
                                            false)
                                    .then(Mono.error(Exceptions.propagate(new AppsmithException(
                                            AppsmithError.GIT_MERGE_FAILED_REMOTE_CHANGES,
                                            srcBranchStatus.getBehindCount(),
                                            sourceBranch))));
                        } else if (!srcBranchStatus.getIsClean()) {
                            return addAnalyticsForGitOperation(
                                            AnalyticsEvents.GIT_MERGE_CHECK,
                                            artifact,
                                            AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES.name(),
                                            AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES.getMessage(destinationBranch),
                                            artifact.getGitArtifactMetadata().getIsRepoPrivate(),
                                            false,
                                            false)
                                    .then(Mono.error(Exceptions.propagate(new AppsmithException(
                                            AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES, sourceBranch))));
                        }
                        return this.getStatus(defaultArtifactId, destinationBranch, false, artifactType)
                                .map(destBranchStatus -> {
                                    if (!Integer.valueOf(0).equals(destBranchStatus.getBehindCount())) {
                                        return addAnalyticsForGitOperation(
                                                        AnalyticsEvents.GIT_MERGE_CHECK,
                                                        artifact,
                                                        AppsmithError.GIT_MERGE_FAILED_REMOTE_CHANGES.name(),
                                                        AppsmithError.GIT_MERGE_FAILED_REMOTE_CHANGES.getMessage(
                                                                destBranchStatus.getBehindCount(), destinationBranch),
                                                        artifact.getGitArtifactMetadata()
                                                                .getIsRepoPrivate(),
                                                        false,
                                                        false)
                                                .then(Mono.error(Exceptions.propagate(new AppsmithException(
                                                        AppsmithError.GIT_MERGE_FAILED_REMOTE_CHANGES,
                                                        destBranchStatus.getBehindCount(),
                                                        destinationBranch))));
                                    } else if (!destBranchStatus.getIsClean()) {
                                        return addAnalyticsForGitOperation(
                                                        AnalyticsEvents.GIT_MERGE_CHECK,
                                                        artifact,
                                                        AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES.name(),
                                                        AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES.getMessage(
                                                                destinationBranch),
                                                        artifact.getGitArtifactMetadata()
                                                                .getIsRepoPrivate(),
                                                        false,
                                                        false)
                                                .then(Mono.error(Exceptions.propagate(new AppsmithException(
                                                        AppsmithError.GIT_MERGE_FAILED_LOCAL_CHANGES,
                                                        destinationBranch))));
                                    }
                                    return destBranchStatus;
                                });
                    })
                    .onErrorResume(error -> {
                        log.error("Error in merge status check artifact " + defaultArtifactId, error);
                        if (error instanceof AppsmithException) {
                            return Mono.error(error);
                        }
                        return Mono.error(new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "status", error));
                    })
                    .then(gitExecutor
                            .isMergeBranch(repoSuffix, sourceBranch, destinationBranch)
                            .flatMap(mergeStatusDTO -> releaseFileLock(defaultArtifactId)
                                    .flatMap(mergeStatus -> addAnalyticsForGitOperation(
                                            AnalyticsEvents.GIT_MERGE_CHECK,
                                            artifact,
                                            null,
                                            null,
                                            artifact.getGitArtifactMetadata().getIsRepoPrivate(),
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
                                                    ((CheckoutConflictException) error).getConflictingPaths());
                                        }
                                        mergeStatus.setReferenceDoc(
                                                ErrorReferenceDocUrl.GIT_MERGE_CONFLICT.getDocUrl());
                                        return mergeStatus;
                                    })
                                    .flatMap(mergeStatusDTO -> addAnalyticsForGitOperation(
                                                    AnalyticsEvents.GIT_MERGE_CHECK,
                                                    artifact,
                                                    error.getClass().getName(),
                                                    error.getMessage(),
                                                    artifact.getGitArtifactMetadata()
                                                            .getIsRepoPrivate(),
                                                    false,
                                                    false)
                                            .map(application1 -> mergeStatusDTO));
                        } catch (GitAPIException | IOException e) {
                            log.error("Error while resetting to last commit", e);
                            return Mono.error(new AppsmithException(
                                    AppsmithError.GIT_ACTION_FAILED, "reset --hard HEAD", e.getMessage()));
                        }
                    });
        });

        return Mono.create(
                sink -> mergeableStatusMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    @Override
    public Mono<String> createConflictedBranch(String defaultArtifactId, String branchName, ArtifactType artifactType) {

        if (StringUtils.isEmptyOrNull(branchName)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.BRANCH_NAME));
        }

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();
        Mono<GitArtifactMetadata> gitArtifactMetadataMono = getGitArtifactMetadata(defaultArtifactId, artifactType);

        Mono<? extends Artifact> branchedArtifactMonoCached = gitArtifactHelper
                .getArtifactByDefaultIdAndBranchName(defaultArtifactId, branchName, artifactEditPermission)
                .cache();
        Mono<? extends ArtifactExchangeJson> artifactExchangeJsonMono = branchedArtifactMonoCached.flatMap(artifact ->
                exportService.exportByArtifactId(artifact.getId(), VERSION_CONTROL, artifact.getArtifactType()));

        Mono<String> conflictedBranchMono = Mono.zip(
                        gitArtifactMetadataMono, branchedArtifactMonoCached, artifactExchangeJsonMono)
                .flatMap(tuple -> {
                    GitArtifactMetadata gitArtifactMetadata = tuple.getT1();
                    Artifact branchedArtifact = tuple.getT2();
                    ArtifactExchangeJson artifactExchangeJson = tuple.getT3();
                    GitArtifactMetadata branchedGitArtifactMetadata = branchedArtifact.getGitArtifactMetadata();
                    branchedGitArtifactMetadata.setGitAuth(gitArtifactMetadata.getGitAuth());

                    Path repoSuffix = gitArtifactHelper.getRepoSuffixPath(
                            branchedArtifact.getWorkspaceId(),
                            branchedGitArtifactMetadata.getDefaultArtifactId(),
                            branchedGitArtifactMetadata.getRepoName());

                    try {
                        return Mono.zip(
                                commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                                        repoSuffix, artifactExchangeJson, branchName),
                                Mono.just(branchedGitArtifactMetadata),
                                Mono.just(repoSuffix));
                    } catch (IOException | GitAPIException e) {
                        return Mono.error(
                                new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "checkout", e.getMessage()));
                    }
                })
                .flatMap(tuple -> {
                    GitArtifactMetadata gitData = tuple.getT2();
                    Path repoSuffix = tuple.getT3();
                    return gitExecutor
                            .createAndCheckoutToBranch(repoSuffix, branchName + MERGE_CONFLICT_BRANCH_NAME)
                            .flatMap(conflictedBranchName -> commitAndPushWithDefaultCommit(
                                            repoSuffix,
                                            gitData.getGitAuth(),
                                            gitData,
                                            GitDefaultCommitMessage.CONFLICT_STATE)
                                    .flatMap(successMessage -> gitExecutor.checkoutToBranch(repoSuffix, branchName))
                                    .flatMap(isCheckedOut -> gitExecutor.deleteBranch(repoSuffix, conflictedBranchName))
                                    .thenReturn(conflictedBranchName + CONFLICTED_SUCCESS_MESSAGE));
                });

        return Mono.create(
                sink -> conflictedBranchMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    private Mono<String> commitAndPushWithDefaultCommit(
            Path repoSuffix, GitAuth auth, GitArtifactMetadata gitArtifactMetadata, GitDefaultCommitMessage reason) {
        return gitExecutor
                .commitArtifact(
                        repoSuffix,
                        DEFAULT_COMMIT_MESSAGE + reason.getReason(),
                        APPSMITH_BOT_USERNAME,
                        emailConfig.getSupportEmailAddress(),
                        true,
                        false)
                .onErrorResume(error -> {
                    if (error instanceof EmptyCommitException) {
                        return Mono.just(EMPTY_COMMIT_ERROR_MESSAGE);
                    }
                    return Mono.error(
                            new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "commit", error.getMessage()));
                })
                .flatMap(commitMessage -> gitExecutor
                        .pushApplication(
                                repoSuffix,
                                gitArtifactMetadata.getRemoteUrl(),
                                auth.getPublicKey(),
                                auth.getPrivateKey(),
                                gitArtifactMetadata.getBranchName())
                        .map(pushResult -> {
                            if (pushResult.contains("REJECTED")) {
                                throw new AppsmithException(AppsmithError.GIT_UPSTREAM_CHANGES);
                            }
                            return pushResult;
                        }));
    }

    @Override
    public Mono<Boolean> testConnection(String defaultArtifactId, ArtifactType artifactType) {

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        return gitArtifactHelper
                .getArtifactById(defaultArtifactId, artifactEditPermission)
                .flatMap(artifact -> {
                    GitArtifactMetadata gitArtifactMetadata = artifact.getGitArtifactMetadata();
                    if (isDefaultGitMetadataInvalid(gitArtifactMetadata)) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                    }
                    return gitExecutor
                            .testConnection(
                                    gitArtifactMetadata.getGitAuth().getPublicKey(),
                                    gitArtifactMetadata.getGitAuth().getPrivateKey(),
                                    gitArtifactMetadata.getRemoteUrl())
                            .zipWith(Mono.just(artifact))
                            .onErrorResume(error -> {
                                log.error(
                                        "Error while testing the connection to th remote repo "
                                                + gitArtifactMetadata.getRemoteUrl() + " ",
                                        error);
                                return addAnalyticsForGitOperation(
                                                AnalyticsEvents.GIT_TEST_CONNECTION,
                                                artifact,
                                                error.getClass().getName(),
                                                error.getMessage(),
                                                artifact.getGitArtifactMetadata()
                                                        .getIsRepoPrivate())
                                        .flatMap(application1 -> {
                                            if (error instanceof TransportException) {
                                                return Mono.error(new AppsmithException(
                                                        AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
                                            }
                                            if (error instanceof InvalidRemoteException) {
                                                return Mono.error(new AppsmithException(
                                                        AppsmithError.INVALID_GIT_CONFIGURATION, error.getMessage()));
                                            }
                                            if (error instanceof TimeoutException) {
                                                return Mono.error(
                                                        new AppsmithException(AppsmithError.GIT_EXECUTION_TIMEOUT));
                                            }
                                            return Mono.error(new AppsmithException(
                                                    AppsmithError.GIT_GENERIC_ERROR, error.getMessage()));
                                        });
                            });
                })
                .flatMap(objects -> {
                    Artifact artifact = objects.getT2();
                    return addAnalyticsForGitOperation(
                                    AnalyticsEvents.GIT_TEST_CONNECTION,
                                    artifact,
                                    artifact.getGitArtifactMetadata().getIsRepoPrivate())
                            .thenReturn(objects.getT1());
                });
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
            String defaultArtifactId, Boolean pruneBranches, String currentBranch, ArtifactType artifactType) {
        return getBranchList(defaultArtifactId, pruneBranches, currentBranch, true, artifactType);
    }

    protected Mono<List<GitBranchDTO>> getBranchList(
            String defaultArtifactId,
            Boolean pruneBranches,
            String currentBranch,
            boolean syncDefaultBranchWithRemote,
            ArtifactType artifactType) {

        // get the root artifact
        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<? extends Artifact> defaultArtifactMono =
                gitArtifactHelper.getArtifactById(defaultArtifactId, artifactEditPermission);

        Mono<List<GitBranchDTO>> branchMono = defaultArtifactMono
                .flatMap(defaultArtifact -> {
                    GitArtifactMetadata gitArtifactMetadata = defaultArtifact.getGitArtifactMetadata();
                    if (gitArtifactMetadata == null
                            || gitArtifactMetadata.getDefaultArtifactId() == null
                            || gitArtifactMetadata.getRepoName() == null) {
                        log.error("Git config is not present for application {}", defaultArtifact.getId());
                        throw new AppsmithException(AppsmithError.INVALID_GIT_CONFIGURATION, GIT_CONFIG_ERROR);
                    }

                    Path repoPath = gitArtifactHelper.getRepoSuffixPath(
                            defaultArtifact.getWorkspaceId(),
                            gitArtifactMetadata.getDefaultArtifactId(),
                            gitArtifactMetadata.getRepoName());

                    Mono<String> defaultBranchMono;

                    if (TRUE.equals(pruneBranches) && syncDefaultBranchWithRemote) {
                        defaultBranchMono = syncDefaultBranchNameFromRemote(defaultArtifact, repoPath);
                    } else {
                        defaultBranchMono =
                                Mono.just(GitUtils.getDefaultBranchName(defaultArtifact.getGitArtifactMetadata()));
                    }
                    return Mono.zip(defaultBranchMono, Mono.just(defaultArtifact), Mono.just(repoPath));
                })
                .flatMap(objects -> {
                    String defaultBranchName = objects.getT1();
                    Artifact defaultApplication = objects.getT2();
                    Path repoPath = objects.getT3();
                    return getBranchListWithDefaultBranchName(
                            defaultApplication, repoPath, defaultBranchName, currentBranch, pruneBranches);
                })
                .onErrorResume(throwable -> {
                    if (throwable instanceof RepositoryNotFoundException) {
                        // this will clone the repo again
                        return handleRepoNotFoundException(defaultArtifactId, artifactType);
                    }
                    return Mono.error(throwable);
                });

        return Mono.create(sink -> branchMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    private Mono<String> syncDefaultBranchNameFromRemote(Artifact defaultArtifact, Path repoPath) {
        GitArtifactMetadata metadata = defaultArtifact.getGitArtifactMetadata();
        GitAuth gitAuth = metadata.getGitAuth();
        return addFileLock(metadata.getDefaultArtifactId())
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
                                    defaultArtifact.getArtifactType())
                            .then()
                            .thenReturn(defaultBranchNameInRemote);
                })
                .flatMap(branchName ->
                        releaseFileLock(metadata.getDefaultArtifactId()).thenReturn(branchName));
    }

    private Flux<? extends Artifact> updateDefaultBranchName(
            String defaultArtifactId, String defaultBranchName, Path repoPath, ArtifactType artifactType) {
        // Get the artifact from DB by new defaultBranch name
        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();
        Mono<Artifact> artifactMono = gitArtifactHelper
                .getArtifactByDefaultIdAndBranchName(defaultArtifactId, defaultBranchName, artifactEditPermission)
                .map(artifact -> (Artifact) artifact);

        Mono<? extends Artifact> fallbackArtifactMono =
                Mono.defer(() -> checkoutRemoteBranch(defaultArtifactId, defaultBranchName, artifactType));

        // Check if the branch is already present, If not follow checkout remote flow
        return artifactMono
                .onErrorResume(throwable -> fallbackArtifactMono)
                // ensure the local branch exists
                .then(gitExecutor
                        .createAndCheckoutToBranch(repoPath, defaultBranchName)
                        .onErrorComplete())
                // Update the default branch name in all the child applications
                .thenMany(gitArtifactHelper.getAllArtifactByDefaultId(defaultArtifactId, artifactEditPermission))
                .flatMap(artifact -> {
                    artifact.getGitArtifactMetadata().setDefaultBranchName(defaultBranchName);
                    // clear the branch protection rules as the default branch name has been changed
                    artifact.getGitArtifactMetadata().setBranchProtectionRules(null);
                    return gitArtifactHelper.saveArtifact(artifact);
                });
    }

    private Mono<List<GitBranchDTO>> handleRepoNotFoundException(String defaultArtifactId, ArtifactType artifactType) {

        // clone application to the local filesystem again and update the defaultBranch for the application
        // list branch and compare with branch applications and checkout if not exists

        // get the root artifact
        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();
        AclPermission artifactReadPermission = gitArtifactHelper.getArtifactReadPermission();

        Mono<? extends Artifact> defaultArtifactMono =
                gitArtifactHelper.getArtifactById(defaultArtifactId, artifactEditPermission);

        return defaultArtifactMono.flatMap(defaultArtifact -> {
            GitArtifactMetadata gitArtifactMetadata = defaultArtifact.getGitArtifactMetadata();
            Path repoPath = gitArtifactHelper.getRepoSuffixPath(
                    defaultArtifact.getWorkspaceId(), defaultArtifact.getId(), gitArtifactMetadata.getRepoName());
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
                                        .getArtifactByDefaultIdAndBranchName(
                                                defaultArtifactId, branchName, artifactReadPermission)
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
            Artifact defaultArtifact,
            Path repoPath,
            String defaultBranchName,
            String currentBranch,
            boolean pruneBranches) {
        return addFileLock(defaultArtifact.getId())
                .flatMap(objects -> {
                    GitArtifactMetadata gitArtifactMetadata = defaultArtifact.getGitArtifactMetadata();

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
                .flatMap(branchDTOList ->
                        releaseFileLock(defaultArtifact.getId()).thenReturn(branchDTOList))
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
                                        defaultArtifact,
                                        defaultArtifact.getGitArtifactMetadata().getIsRepoPrivate())
                                .thenReturn(gitBranchDTOList));
    }

    @Override
    public Mono<List<String>> getProtectedBranches(String defaultArtifactId, ArtifactType artifactType) {

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactEditPermission = gitArtifactHelper.getArtifactEditPermission();

        Mono<? extends Artifact> defaultArtifactMono =
                gitArtifactHelper.getArtifactById(defaultArtifactId, artifactEditPermission);

        return defaultArtifactMono.map(defaultArtifact -> {
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

    /**
     * This method is context aware
     * @param defaultArtifactId : id of the root application
     * @param branchName : branch name on which autocommit has to be done
     * @param artifactType : type of artifact, this is application for now.
     * @return flag whether the process has started or not.
     */
    @Override
    public Mono<Boolean> autoCommitApplication(String defaultArtifactId, String branchName, ArtifactType artifactType) {
        return gitAutoCommitHelper.autoCommitApplication(defaultArtifactId, branchName);
    }

    @Override
    public Mono<AutoCommitProgressDTO> getAutoCommitProgress(String artifactId, ArtifactType artifactType) {
        return gitAutoCommitHelper.getAutoCommitProgress(artifactId);
    }

    @Override
    public Mono<Boolean> toggleAutoCommitEnabled(String defaultArtifactId, ArtifactType artifactType) {

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactAutoCommitPermission = gitArtifactHelper.getArtifactAutoCommitPermission();

        Mono<? extends Artifact> defaultArtifactMono =
                gitArtifactHelper.getArtifactById(defaultArtifactId, artifactAutoCommitPermission);

        return defaultArtifactMono
                .map(defaultArtifact -> {
                    GitArtifactMetadata gitArtifactMetadata = defaultArtifact.getGitArtifactMetadata();
                    if (!defaultArtifact.getId().equals(gitArtifactMetadata.getDefaultArtifactId())) {
                        log.error(
                                "failed tp toggle auto commit. reason: {} is not the root defaultArtifact id",
                                defaultArtifactId);
                        throw new AppsmithException(AppsmithError.INVALID_PARAMETER, "default defaultArtifact id");
                    }

                    AutoCommitConfig autoCommitConfig = gitArtifactMetadata.getAutoCommitConfig();
                    if (autoCommitConfig.getEnabled()) {
                        autoCommitConfig.setEnabled(FALSE);
                    } else {
                        autoCommitConfig.setEnabled(TRUE);
                    }
                    // need to call the setter because getter returns a default config if attribute is null
                    defaultArtifact.getGitArtifactMetadata().setAutoCommitConfig(autoCommitConfig);
                    return defaultArtifact;
                })
                .flatMap(defaultArtifact -> gitArtifactHelper
                        .saveArtifact(defaultArtifact)
                        .thenReturn(defaultArtifact
                                .getGitArtifactMetadata()
                                .getAutoCommitConfig()
                                .getEnabled()));
    }

    @Override
    public Mono<List<String>> updateProtectedBranches(
            String defaultArtifactId, List<String> branchNames, ArtifactType artifactType) {

        GitArtifactHelper<?> gitArtifactHelper = getArtifactGitService(artifactType);
        AclPermission artifactManageProtectedBranchPermission =
                gitArtifactHelper.getArtifactManageProtectedBranchPermission();

        Mono<? extends Artifact> defaultArtifactMono =
                gitArtifactHelper.getArtifactById(defaultArtifactId, artifactManageProtectedBranchPermission);

        return defaultArtifactMono
                .flatMap(defaultArtifact -> {
                    GitArtifactMetadata metadata = defaultArtifact.getGitArtifactMetadata();
                    String defaultBranchName = metadata.getDefaultBranchName();

                    if (branchNames.isEmpty()
                            || (branchNames.size() == 1 && branchNames.get(0).equals(defaultBranchName))) {
                        // keep a copy of old protected branches as it's required to send analytics event later
                        List<String> oldProtectedBranches = metadata.getBranchProtectionRules() != null
                                ? metadata.getBranchProtectionRules()
                                : List.of();

                        // user wants to unprotect all branches or user wants to protect only default branch
                        metadata.setBranchProtectionRules(branchNames);
                        return gitArtifactHelper
                                .saveArtifact(defaultArtifact)
                                .then(gitArtifactHelper.updateArtifactWithProtectedBranches(
                                        defaultArtifactId, branchNames))
                                .then(sendBranchProtectionAnalytics(defaultArtifact, oldProtectedBranches, branchNames))
                                .thenReturn(branchNames);
                    } else {
                        // user want to protect multiple branches, not allowed
                        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
                    }
                })
                .as(transactionalOperator::transactional);
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
}
