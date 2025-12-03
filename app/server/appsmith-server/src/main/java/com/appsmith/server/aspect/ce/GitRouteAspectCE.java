package com.appsmith.server.aspect.ce;

import com.appsmith.external.git.constants.GitSpan;
import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.git.service.BashService;
import com.appsmith.server.annotations.GitRoute;
import com.appsmith.server.artifacts.gitRoute.GitRouteArtifact;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithErrorCode;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.git.utils.GitProfileUtils;
import com.appsmith.server.services.GitArtifactHelper;
import io.micrometer.observation.ObservationRegistry;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.experimental.Accessors;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.reflect.CodeSignature;
import org.bouncycastle.jcajce.spec.OpenSSHPrivateKeySpec;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.util.io.pem.PemReader;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.util.StringUtils;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.io.StringReader;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.IntStream;

import static com.appsmith.server.helpers.GitUtils.MAX_RETRIES;
import static com.appsmith.server.helpers.GitUtils.RETRY_DELAY;
import static org.springframework.util.StringUtils.hasText;

@RequiredArgsConstructor
@Slf4j
public class GitRouteAspectCE {

    protected static final Duration LOCK_TTL = Duration.ofSeconds(90);
    protected static final String REDIS_FILE_LOCK_VALUE = "inUse";

    protected static final String RUN_ERROR_MESSAGE_FORMAT = "An error occurred during state: %s of git. Error: %s";
    protected static final String REDIS_REPO_KEY_FORMAT = "purpose=repo/v=1/workspace=%s/artifact=%s/repository=%s/";
    protected static final String REDIS_LOCK_KEY_FORMAT = "purpose=lock/%s";
    protected static final String REDIS_BRANCH_STORE_FORMAT = "branchStore=%s";
    protected static final String BASH_COMMAND_FILE = "git.sh";
    protected static final String GIT_UPLOAD = "git_upload";
    protected static final String GIT_DOWNLOAD = "git_download";
    protected static final String GIT_CLONE = "git_clone_and_checkout";
    protected static final String GIT_CLEAN_UP = "git_clean_up";

    protected final ReactiveRedisTemplate<String, String> redis;
    protected final GitProfileUtils gitProfileUtils;
    protected final GitServiceConfig gitServiceConfig;
    protected final GitRouteArtifact gitRouteArtifact;
    protected final BashService bashService = new BashService();
    protected final ObservationRegistry observationRegistry;

    @Value("${appsmith.redis.git.url}")
    protected String redisUrl;

    /*
     * FSM: Definitions
     */

    protected enum State {
        ARTIFACT,
        ROUTE_FILTER,
        METADATA_FILTER,
        UNROUTED_EXECUTION,
        PARENT,
        GIT_META,
        REPO_KEY,
        LOCK_KEY,
        LOCK,
        GIT_PROFILE,
        GIT_AUTH,
        GIT_KEY,
        REPO_PATH,
        DOWNLOAD,
        FETCH_BRANCHES,
        CLONE,
        EXECUTE,
        CLEAN_UP_FILTER,
        CLEAN_UP,
        UPLOAD,
        UNLOCK,
        RESULT,
        DONE
    }

    protected enum Outcome {
        SUCCESS,
        FAIL
    }

    @Getter
    @AllArgsConstructor
    protected static class StateConfig {
        private final State onSuccess;
        private final State onFail;
        private final String contextField;
        private final Function<Context, Mono<?>> function;

        private State next(Outcome outcome) {
            return outcome == Outcome.SUCCESS ? onSuccess : onFail;
        }
    }

    @Data
    @Accessors(chain = true)
    protected static class Context {
        // Inputs
        private ProceedingJoinPoint joinPoint;
        private GitRoute gitRoute;

        // Intermediate Inputs
        private String fieldValue;
        private String authorName;
        private String authorEmail;

        // Tasks
        private Artifact artifact;
        private Boolean routeFilter;
        private Boolean metadataFilter;
        private Boolean cleanUpFilter;
        private Artifact parent;
        private GitArtifactMetadata gitMeta;
        private String repoKey;
        private String lockKey;
        private Boolean lock;
        private GitProfile gitProfile;
        private GitAuth gitAuth;
        private String gitKey;
        private String repoPath;
        private String branchStoreKey;
        private Object download;
        private Object execute;
        private Object upload;
        private Object cleanUp;
        private Boolean unlock;
        private Object result;
        private List<String> localBranches;
        private Object clone;

        // Errors
        private AppsmithException error;
    }

    // Refer to GitRouteAspect.md#gitroute-fsm-execution-flow for the FSM diagram.
    protected final Map<State, StateConfig> FSM = Map.ofEntries(
            Map.entry(
                    State.ROUTE_FILTER,
                    new StateConfig(State.ARTIFACT, State.UNROUTED_EXECUTION, "routeFilter", this::routeFilter)),
            Map.entry(State.UNROUTED_EXECUTION, new StateConfig(State.RESULT, State.RESULT, "execute", this::execute)),
            Map.entry(State.RESULT, new StateConfig(State.DONE, State.DONE, "result", this::result)),
            Map.entry(State.ARTIFACT, new StateConfig(State.METADATA_FILTER, State.RESULT, "artifact", this::artifact)),
            Map.entry(
                    State.METADATA_FILTER,
                    new StateConfig(State.PARENT, State.UNROUTED_EXECUTION, "metadataFilter", this::metadataFilter)),
            Map.entry(State.PARENT, new StateConfig(State.GIT_META, State.RESULT, "parent", this::parent)),
            Map.entry(State.GIT_META, new StateConfig(State.REPO_KEY, State.RESULT, "gitMeta", this::gitMeta)),
            Map.entry(State.REPO_KEY, new StateConfig(State.LOCK_KEY, State.RESULT, "repoKey", this::repoKey)),
            Map.entry(State.LOCK_KEY, new StateConfig(State.LOCK, State.RESULT, "lockKey", this::lockKey)),
            Map.entry(State.LOCK, new StateConfig(State.GIT_PROFILE, State.RESULT, "lock", this::lock)),
            Map.entry(State.GIT_PROFILE, new StateConfig(State.GIT_AUTH, State.UNLOCK, "gitProfile", this::gitProfile)),
            Map.entry(State.GIT_AUTH, new StateConfig(State.GIT_KEY, State.UNLOCK, "gitAuth", this::gitAuth)),
            Map.entry(State.GIT_KEY, new StateConfig(State.REPO_PATH, State.UNLOCK, "gitKey", this::gitKey)),
            Map.entry(State.REPO_PATH, new StateConfig(State.DOWNLOAD, State.UNLOCK, "repoPath", this::repoPath)),
            Map.entry(
                    State.DOWNLOAD,
                    new StateConfig(State.EXECUTE, State.FETCH_BRANCHES, "download", this::downloadFromRedis)),
            Map.entry(
                    State.EXECUTE,
                    new StateConfig(State.CLEAN_UP_FILTER, State.CLEAN_UP_FILTER, "execute", this::execute)),
            Map.entry(
                    State.CLEAN_UP_FILTER,
                    new StateConfig(State.UPLOAD, State.CLEAN_UP, "cleanUpFilter", this::cleanUpFilter)),
            Map.entry(State.UPLOAD, new StateConfig(State.UNLOCK, State.UNLOCK, "upload", this::upload)),
            Map.entry(State.CLEAN_UP, new StateConfig(State.UNLOCK, State.UNLOCK, "cleanUp", this::cleanUp)),
            Map.entry(State.UNLOCK, new StateConfig(State.RESULT, State.RESULT, "unlock", this::unlock)),
            Map.entry(
                    State.FETCH_BRANCHES,
                    new StateConfig(State.CLONE, State.UNLOCK, "localBranches", this::getLocalBranches)),
            Map.entry(State.CLONE, new StateConfig(State.EXECUTE, State.UNLOCK, "clone", this::clone)));

    /*
     * FSM: Runners
     */

    /**
     * Entry point advice for methods annotated with {@link GitRoute}. When Git is configured to operate in-memory,
     * this initializes the FSM context and executes the Git-aware flow; otherwise, proceeds directly.
     *
     * @param joinPoint the intercepted join point
     * @param gitRoute the {@link GitRoute} annotation from the intercepted method
     * @return the result of the intercepted method, possibly wrapped via FSM flow
     */
    @Around("@annotation(gitRoute)")
    public Object handleGitRoute(ProceedingJoinPoint joinPoint, GitRoute gitRoute) {
        Context ctx = new Context().setJoinPoint(joinPoint).setGitRoute(gitRoute);

        // If Git is not in memory, we can just execute the join point
        if (!gitServiceConfig.isGitInMemory()) {
            return execute(ctx);
        }

        String authorName = extractFieldValue(joinPoint, gitRoute.authorName());
        String authorEmail = extractFieldValue(joinPoint, gitRoute.authorEmail());

        if (StringUtils.hasText(authorName) && StringUtils.hasText(authorEmail)) {
            ctx.setAuthorEmail(authorEmail);
            ctx.setAuthorName(authorName);
        }

        String fieldValue = extractFieldValue(joinPoint, gitRoute.fieldName());
        ctx.setFieldValue(fieldValue);
        return run(ctx, State.ROUTE_FILTER).flatMap(unused -> {
            return this.result(ctx);
        });
    }

    /**
     * Executes the Git FSM by evaluating the function associated with the current state and transitioning based
     * on the outcome until reaching the DONE state.
     *
     * @param ctx the FSM execution context
     * @param current the current {@link State}
     * @return a Mono that completes when the FSM reaches the DONE state
     */
    protected Mono<Object> run(Context ctx, State current) {
        if (current == State.DONE) {
            return Mono.just(true);
        }

        StateConfig config = FSM.get(current);
        long startTime = System.currentTimeMillis();

        return config.getFunction()
                .apply(ctx)
                .flatMap(result -> {
                    setContextField(ctx, config.getContextField(), result);
                    long duration = System.currentTimeMillis() - startTime;

                    // selective logging of information
                    if (State.REPO_KEY.equals(current) || State.LOCK_KEY.equals(current)) {
                        log.info(
                                "Operation : {}, State {} : {}, Data :  {}, Time : {}ms",
                                ctx.getGitRoute().operation(),
                                current,
                                Outcome.SUCCESS.name(),
                                result,
                                duration);
                    } else {
                        log.info(
                                "Operation : {}, State {} : {}, Time: {}ms",
                                ctx.getGitRoute().operation(),
                                current,
                                Outcome.SUCCESS.name(),
                                duration);
                    }

                    return run(ctx, config.next(Outcome.SUCCESS));
                })
                .onErrorResume(e -> {
                    if (e instanceof AppsmithException appsmithException) {
                        ctx.setError(appsmithException);
                    } else {
                        ctx.setError(new AppsmithException(
                                AppsmithError.GIT_ACTION_FAILED,
                                ctx.getGitRoute().operation().toString().toLowerCase(),
                                String.format(RUN_ERROR_MESSAGE_FORMAT, current.name(), e.getMessage())));
                    }

                    long duration = System.currentTimeMillis() - startTime;
                    log.error(
                            "Operation : {}, State {} : {}, Error : {}, Time: {}ms",
                            ctx.getGitRoute().operation(),
                            current,
                            Outcome.FAIL.name(),
                            e.getMessage(),
                            duration);
                    return run(ctx, config.next(Outcome.FAIL));
                });
    }

    /**
     * Attempts to acquire a Redis-based lock for the given key, storing the git command as value.
     *
     * @param key the redis lock key
     * @param gitCommand the git command being executed (used for diagnostics)
     * @return Mono emitting true if lock acquired, or error if already locked
     */
    protected Mono<Boolean> setLock(String key, String gitCommand) {
        String command = hasText(gitCommand) ? gitCommand : REDIS_FILE_LOCK_VALUE;

        return redis.opsForValue().setIfAbsent(key, command, LOCK_TTL).flatMap(locked -> {
            if (Boolean.TRUE.equals(locked)) {
                return Mono.just(Boolean.TRUE);
            }

            return redis.opsForValue()
                    .get(key)
                    .flatMap(commandName ->
                            Mono.error(new AppsmithException(AppsmithError.GIT_FILE_IN_USE, command, commandName)));
        });
    }

    /**
     * Acquires a Redis lock with retry semantics for transient contention scenarios.
     *
     * @param key the redis lock key
     * @param gitCommand the git command associated with the lock
     * @return Mono emitting true on successful lock acquisition, or error after retries exhaust
     */
    protected Mono<Boolean> addLockWithRetry(String key, String gitCommand) {
        return this.setLock(key, gitCommand)
                .retryWhen(Retry.fixedDelay(MAX_RETRIES, RETRY_DELAY)
                        .onRetryExhaustedThrow((retryBackoffSpec, retrySignal) -> {
                            if (retrySignal.failure() instanceof AppsmithException) {
                                throw (AppsmithException) retrySignal.failure();
                            }

                            throw new AppsmithException(AppsmithError.GIT_FILE_IN_USE, gitCommand);
                        }))
                .name(GitSpan.ADD_FILE_LOCK)
                .tap(Micrometer.observation(observationRegistry));
    }

    /**
     * FSM state: acquire the Redis lock for the current repository operation.
     *
     * @param ctx the FSM execution context containing lock key and operation
     * @return Mono emitting true when lock is acquired
     */
    protected Mono<Boolean> lock(Context ctx) {
        String key = ctx.getLockKey();
        String command = ctx.getGitRoute().operation().name();

        return this.addLockWithRetry(key, command);
    }

    /**
     * FSM state: resolve the target {@link Artifact} for the operation based on annotation metadata.
     * This method can be overridden in EE implementations to add package-specific logic.
     *
     * @param ctx the FSM execution context
     * @return Mono emitting the resolved Artifact
     */
    protected Mono<?> artifact(Context ctx) {
        ArtifactType artifactType = ctx.getGitRoute().artifactType();
        String fieldValue = ctx.getFieldValue();

        // Standard artifact lookup by ID
        return gitRouteArtifact.getArtifact(artifactType, fieldValue);
    }

    /**
     * This method finds out if the current operation requires git operation.
     * @param ctx : context
     * @return: A mono which emits a boolean, else errors out.
     */
    protected Mono<?> routeFilter(Context ctx) {
        if (ctx.getGitRoute().operation().requiresGitOperation()) {
            return Mono.just(Boolean.TRUE);
        }

        return Mono.error(new AppsmithException(
                AppsmithError.GIT_ROUTE_FS_OPS_NOT_REQUIRED, ctx.getGitRoute().operation()));
    }

    /**
     * FSM state: validate that the artifact has sufficient Git metadata to require filesystem operations.
     *
     * @param ctx the FSM execution context
     * @return Mono emitting true if metadata is present and valid, or error otherwise
     */
    protected Mono<?> metadataFilter(Context ctx) {
        // if the metadata is null, default artifact id, remote url, or reponame is not present,
        // then that means that at this point, either this artifact is not git connected.
        Artifact artifact = ctx.getArtifact();
        GitArtifactMetadata metadata = artifact.getGitArtifactMetadata();

        if (metadata == null
                || !StringUtils.hasText(metadata.getDefaultArtifactId())
                || !StringUtils.hasText(metadata.getRemoteUrl())
                || !StringUtils.hasText(metadata.getRepoName())) {
            return Mono.error(new AppsmithException(AppsmithError.GIT_ROUTE_METADATA_NOT_FOUND));
        }

        return Mono.just(Boolean.TRUE);
    }

    /**
     * FSM state: resolve the parent artifact (by default artifact id) for repository-scoped operations.
     *
     * @param ctx the FSM execution context
     * @return Mono emitting the parent Artifact
     */
    protected Mono<?> parent(Context ctx) {
        ArtifactType artifactType = ctx.getGitRoute().artifactType();
        String parentArtifactId = ctx.getArtifact().getGitArtifactMetadata().getDefaultArtifactId();
        return gitRouteArtifact.getArtifact(artifactType, parentArtifactId);
    }

    /**
     * FSM state: validate that Git metadata exists on the parent artifact.
     *
     * @param ctx the FSM execution context
     * @return Mono emitting the {@link GitArtifactMetadata} or an error if missing
     */
    protected Mono<?> gitMeta(Context ctx) {
        return Mono.justOrEmpty(ctx.getParent().getGitArtifactMetadata())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.INVALID_GIT_CONFIGURATION, "Git metadata is not configured")));
    }

    /**
     * FSM state: generate the canonical Redis repository key for the operation.
     *
     * @param ctx the FSM execution context
     * @return Mono emitting the repository key string
     */
    protected Mono<?> repoKey(Context ctx) {
        String key = String.format(
                REDIS_REPO_KEY_FORMAT,
                ctx.getArtifact().getWorkspaceId(),
                ctx.getGitMeta().getDefaultArtifactId(),
                ctx.getGitMeta().getRepoName());
        return Mono.just(key);
    }

    /**
     * FSM state: generate the lock key from the repository key.
     *
     * @param ctx the FSM execution context
     * @return Mono emitting the lock key string
     */
    protected Mono<?> lockKey(Context ctx) {
        String key = String.format(REDIS_LOCK_KEY_FORMAT, ctx.getRepoKey());
        return Mono.just(key);
    }

    /**
     * FSM state: resolve the current user's {@link GitProfile}.
     *
     * @param ctx the FSM execution context
     * @return Mono emitting the Git profile, or error if not configured
     */
    protected Mono<GitProfile> gitProfile(Context ctx) {
        Mono<GitProfile> alternativeGitProfileMono = Mono.defer(() -> Mono.justOrEmpty(getProfileFromArgs(ctx)))
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.INVALID_GIT_CONFIGURATION, "Git profile is not configured")));

        return gitProfileUtils.getGitProfileForUser(ctx.getFieldValue()).switchIfEmpty(alternativeGitProfileMono);
    }

    protected GitProfile getProfileFromArgs(Context ctx) {
        if (!StringUtils.hasText(ctx.getAuthorEmail()) || !StringUtils.hasText(ctx.getAuthorName())) {
            return null;
        }

        GitProfile gitProfile = new GitProfile();
        gitProfile.setAuthorName(ctx.getAuthorName());
        gitProfile.setAuthorEmail(ctx.getAuthorEmail());
        gitProfile.setUseGlobalProfile(Boolean.TRUE);
        return gitProfile;
    }

    /**
     * FSM state: validate presence of {@link GitAuth} on the artifact metadata.
     *
     * @param ctx the FSM execution context
     * @return Mono emitting the GitAuth or error if missing
     */
    protected Mono<?> gitAuth(Context ctx) {
        return Mono.justOrEmpty(ctx.getGitMeta().getGitAuth())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.INVALID_GIT_CONFIGURATION, "Git authentication is not configured")));
    }

    /**
     * FSM state: process and normalize the SSH private key for Git operations.
     *
     * @param ctx the FSM execution context
     * @return Mono emitting a normalized private key string or error if processing fails
     */
    protected Mono<?> gitKey(Context ctx) {
        try {
            return Mono.just(processPrivateKey(
                    ctx.getGitAuth().getPrivateKey(), ctx.getGitAuth().getPublicKey()));
        } catch (Exception e) {
            return Mono.error(new AppsmithException(
                    AppsmithError.GIT_ROUTE_INVALID_PRIVATE_KEY, "Failed to process private key: " + e.getMessage()));
        }
    }

    /**
     * FSM state: compute the local repository path for the artifact and set the branch store key.
     *
     * @param ctx the FSM execution context
     * @return Mono emitting the absolute repository path as string
     */
    protected Mono<?> repoPath(Context ctx) {
        // this needs to be changed based on artifact as well.
        Path repositorySuffixPath = gitRouteArtifact
                .getArtifactHelper(ctx.getGitRoute().artifactType())
                .getRepoSuffixPath(
                        ctx.getArtifact().getWorkspaceId(),
                        ctx.getGitMeta().getDefaultArtifactId(),
                        ctx.getGitMeta().getRepoName());

        ctx.setBranchStoreKey(String.format(REDIS_BRANCH_STORE_FORMAT, repositorySuffixPath));
        Path repositoryPath = Path.of(gitServiceConfig.getGitRootPath()).resolve(repositorySuffixPath);
        return Mono.just(repositoryPath.toAbsolutePath().toString());
    }

    /**
     * FSM state: download repository content from Redis-backed storage into the working directory.
     *
     * @param ctx the FSM execution context
     * @return Mono signaling completion of download script execution
     */
    protected Mono<?> downloadFromRedis(Context ctx) {
        return bashService
                .callFunction(
                        BASH_COMMAND_FILE,
                        GIT_DOWNLOAD,
                        ctx.getGitProfile().getAuthorEmail(),
                        ctx.getGitProfile().getAuthorName(),
                        ctx.getGitKey(),
                        ctx.getRepoKey(),
                        redisUrl,
                        ctx.getGitMeta().getRemoteUrl(),
                        ctx.getRepoPath(),
                        ctx.getBranchStoreKey())
                .onErrorResume(error -> {
                    return Mono.error(
                            new AppsmithException(AppsmithError.GIT_ROUTE_REDIS_DOWNLOAD_FAILED, error.getMessage()));
                });
    }

    /**
     * FSM state: fetch all local branch ref names for the parent artifact base id.
     *
     * @param ctx the FSM execution context
     * @return Mono emitting a list of local branch names
     */
    protected Mono<?> getLocalBranches(Context ctx) {
        GitArtifactHelper<?> gitArtifactHelper =
                gitRouteArtifact.getArtifactHelper(ctx.getGitRoute().artifactType());
        return gitArtifactHelper
                .getAllArtifactByBaseId(ctx.getParent().getGitArtifactMetadata().getDefaultArtifactId(), null)
                .filter(artifact -> {
                    if (artifact.getGitArtifactMetadata() == null
                            || RefType.tag.equals(
                                    artifact.getGitArtifactMetadata().getRefType())) {
                        return Boolean.FALSE;
                    }
                    return Boolean.TRUE;
                })
                .map(artifact -> artifact.getGitArtifactMetadata().getRefName())
                .collectList();
    }

    /**
     * FSM state: fallback clone and checkout flow when download fails; clones remote and checks out known branches.
     *
     * @param ctx the FSM execution context
     * @return Mono signaling completion of clone script execution
     */
    protected Mono<?> clone(Context ctx) {
        List<String> metaArgs = List.of(
                ctx.getGitProfile().getAuthorEmail(),
                ctx.getGitProfile().getAuthorName(),
                ctx.getGitKey(),
                ctx.getGitMeta().getRemoteUrl(),
                gitServiceConfig.getGitRootPath(),
                ctx.getRepoPath(),
                redisUrl,
                ctx.getBranchStoreKey());

        List<String> completeArgs = new ArrayList<>(metaArgs);
        completeArgs.addAll(ctx.localBranches);

        String[] varArgs = completeArgs.toArray(new String[0]);

        return bashService.callFunction(BASH_COMMAND_FILE, GIT_CLONE, varArgs).onErrorResume(error -> {
            if (isInvalidSshKeyError(error)) {
                return Mono.error(new AppsmithException(AppsmithError.INVALID_GIT_SSH_CONFIGURATION));
            }

            return Mono.error(error);
        });
    }

    /**
     * FSM state: proceed the intercepted join point (business logic) within the Git-managed flow.
     *
     * @param ctx the FSM execution context
     * @return Mono emitting the intercepted method's result or error
     */
    protected Mono<?> execute(Context ctx) {
        try {
            return (Mono<Object>) ctx.getJoinPoint().proceed();
        } catch (Throwable e) {
            return Mono.error(e);
        }
    }

    /**
     * FSM state: This method finds out if redis and FS cleanup is required
     *
     * @param ctx the FSM execution context
     * @return Mono emitting the intercepted method's result or error
     */
    protected Mono<?> cleanUpFilter(Context ctx) {
        // if clean up is not required then proceed
        if (!ctx.getGitRoute().operation().gitCleanUp()) {
            return Mono.just(Boolean.TRUE);
        }

        return Mono.error(new AppsmithException(
                AppsmithError.GIT_ROUTE_FS_CLEAN_UP_REQUIRED, ctx.getGitRoute().operation()));
    }

    /**
     * FSM state: upload local repository changes to Redis-backed storage.
     *
     * @param ctx the FSM execution context
     * @return Mono signaling completion of upload script execution
     */
    protected Mono<?> cleanUp(Context ctx) {
        return bashService.callFunction(
                BASH_COMMAND_FILE,
                GIT_CLEAN_UP,
                ctx.getRepoKey(),
                redisUrl,
                ctx.getRepoPath(),
                ctx.getBranchStoreKey());
    }

    /**
     * FSM state: upload local repository changes to Redis-backed storage.
     *
     * @param ctx the FSM execution context
     * @return Mono signaling completion of upload script execution
     */
    protected Mono<?> upload(Context ctx) {
        return bashService.callFunction(
                BASH_COMMAND_FILE, GIT_UPLOAD, ctx.getRepoKey(), redisUrl, ctx.getRepoPath(), ctx.getBranchStoreKey());
    }

    /**
     * FSM state: release the Redis lock acquired for the repository.
     *
     * @param ctx the FSM execution context
     * @return Mono emitting true if the lock was released
     */
    protected Mono<?> unlock(Context ctx) {
        return redis.delete(ctx.getLockKey()).map(count -> count > 0);
    }

    /**
     * FSM state: finalize by returning the intercepted method execution result, or propagate an error when
     * appropriate based on the error state.
     *
     * @param ctx the FSM execution context
     * @return Mono emitting the business method result or an error
     */
    protected Mono<?> result(Context ctx) {
        Set<String> errorStates = Set.of(
                AppsmithErrorCode.GIT_ROUTE_REDIS_DOWNLOAD_FAILED.getCode(),
                AppsmithErrorCode.GIT_ROUTE_FS_CLEAN_UP_REQUIRED.getCode(),
                AppsmithErrorCode.GIT_ROUTE_FS_OPS_NOT_REQUIRED.getCode(),
                AppsmithErrorCode.GIT_ROUTE_METADATA_NOT_FOUND.getCode());
        if (ctx.getError() == null || errorStates.contains(ctx.getError().getAppErrorCode())) {
            return Mono.just(ctx.getExecute());
        }

        return Mono.error(ctx.getError());
    }

    /*
     * Helpers: Git Route
     */

    /**
     * Extracts a named parameter value from a {@link ProceedingJoinPoint}.
     * Supports nested field access using dot notation (e.g., "dto.fieldName").
     *
     * @param jp the join point
     * @param target the target parameter name to extract, or "parameterName.fieldName" for nested access
     * @return stringified value of the parameter if found, otherwise null
     */
    protected static String extractFieldValue(ProceedingJoinPoint jp, String target) {
        String[] names = ((CodeSignature) jp.getSignature()).getParameterNames();
        Object[] values = jp.getArgs();

        // Check if target contains dot notation for nested field access
        if (target.contains(".")) {
            String[] parts = target.split("\\.", 2);
            String paramName = parts[0];
            String fieldName = parts[1];

            // Find the parameter object
            Object paramValue = IntStream.range(0, names.length)
                    .filter(i -> names[i].equals(paramName))
                    .mapToObj(i -> values[i])
                    .findFirst()
                    .orElse(null);

            if (paramValue == null) {
                return null;
            }

            // Extract nested field using reflection
            try {
                var field = paramValue.getClass().getDeclaredField(fieldName);
                field.setAccessible(true);
                Object fieldValue = field.get(paramValue);
                return fieldValue != null ? String.valueOf(fieldValue) : null;
            } catch (NoSuchFieldException | IllegalAccessException e) {
                log.warn("Failed to extract nested field {} from parameter {}", fieldName, paramName, e);
                return null;
            }
        }

        // Standard parameter extraction
        return IntStream.range(0, names.length)
                .filter(i -> names[i].equals(target))
                .mapToObj(i -> String.valueOf(values[i]))
                .findFirst()
                .orElse(null);
    }

    /**
     * Uses reflection to set a field on the {@link Context} object by name.
     *
     * @param ctx the FSM context
     * @param fieldName the field name to set
     * @param value the value to assign
     */
    protected static void setContextField(Context ctx, String fieldName, Object value) {
        try {
            var field = ctx.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(ctx, value);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set field " + fieldName, e);
        }
    }

    /*
     * Helpers: Git Private Key
     * Reference: SshTransportConfigCallback.java
     */

    /**
     * Process an SSH private key that may be in PEM or Base64 PKCS8 form and return a normalized encoded key
     * string suitable for downstream usage.
     *
     * @param privateKey the private key content
     * @param publicKey the corresponding public key (used to determine algorithm)
     * @return normalized and encoded private key string
     * @throws Exception if parsing or key generation fails
     */
    protected static String processPrivateKey(String privateKey, String publicKey) throws Exception {
        String[] splitKeys = privateKey.split("-----.*-----\n");
        return splitKeys.length > 1
                ? handlePemFormat(privateKey, publicKey)
                : handleBase64Format(privateKey, publicKey);
    }

    /**
     * Best-effort detection of invalid SSH key/authentication errors from nested exceptions or script outputs.
     * Aligns error reporting with FS-based flows so callers receive INVALID_GIT_SSH_CONFIGURATION consistently.
     */
    protected static boolean isInvalidSshKeyError(Throwable throwable) {
        // Log the original error for debugging purposes
        log.debug(
                "Checking if error is due to invalid SSH key (in-memory Git). Error type: {}, Message: {}",
                throwable.getClass().getName(),
                throwable.getMessage(),
                throwable);

        Throwable t = throwable;
        while (t != null) {
            String msg = t.getMessage() == null ? "" : t.getMessage().toLowerCase();

            if (msg.contains("cannot log in")
                    || msg.contains("auth fail")
                    || msg.contains("authentication failed")
                    || msg.contains("no more keys to try")
                    || msg.contains("publickey: no more keys to try")
                    || msg.contains("load key")
                    || msg.contains("libcrypto")
                    || msg.contains("permission denied (publickey)")
                    || msg.contains("userauth")
                    || msg.contains("not a valid key")
                    || msg.contains("invalid format")) {
                return true;
            }

            t = t.getCause();
        }
        return false;
    }

    /**
     * Handle an OpenSSH PEM-formatted private key and return a Base64-encoded PKCS8 representation.
     *
     * @param privateKey the PEM-formatted private key
     * @param publicKey the public key to infer algorithm
     * @return Base64-encoded PKCS8 private key
     * @throws Exception if parsing or key generation fails
     */
    protected static String handlePemFormat(String privateKey, String publicKey) throws Exception {
        byte[] content =
                new PemReader(new StringReader(privateKey)).readPemObject().getContent();
        OpenSSHPrivateKeySpec privateKeySpec = new OpenSSHPrivateKeySpec(content);
        KeyFactory keyFactory = getKeyFactory(publicKey);
        PrivateKey generatedPrivateKey = keyFactory.generatePrivate(privateKeySpec);
        return Base64.getEncoder().encodeToString(generatedPrivateKey.getEncoded());
    }

    /**
     * Handle a Base64-encoded PKCS8 private key blob and return a normalized, formatted key string.
     *
     * @param privateKey the Base64-encoded PKCS8 private key
     * @param publicKey the public key to infer algorithm
     * @return normalized, formatted private key string
     * @throws Exception if decoding or key generation fails
     */
    protected static String handleBase64Format(String privateKey, String publicKey) throws Exception {
        PKCS8EncodedKeySpec privateKeySpec =
                new PKCS8EncodedKeySpec(Base64.getDecoder().decode(privateKey));
        PrivateKey generatedPrivateKey = getKeyFactory(publicKey).generatePrivate(privateKeySpec);
        return formatPrivateKey(Base64.getEncoder().encodeToString(generatedPrivateKey.getEncoded()));
    }

    /**
     * Get a {@link KeyFactory} instance for the algorithm implied by the provided public key.
     *
     * @param publicKey the public key whose prefix indicates algorithm
     * @return a {@link KeyFactory} for RSA or ECDSA
     * @throws Exception if the algorithm or provider is unavailable
     */
    protected static KeyFactory getKeyFactory(String publicKey) throws Exception {
        String algo = publicKey.startsWith("ssh-rsa") ? "RSA" : "ECDSA";
        return KeyFactory.getInstance(algo, new BouncyCastleProvider());
    }

    /**
     * Format a Base64-encoded PKCS8 private key into a standard PEM wrapper string.
     *
     * @param privateKey the Base64-encoded PKCS8 private key
     * @return a PEM-wrapped private key string
     */
    protected static String formatPrivateKey(String privateKey) {
        return "-----BEGIN PRIVATE KEY-----\n" + privateKey + "\n-----END PRIVATE KEY-----";
    }
}
