package com.appsmith.server.aspect;

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
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.git.utils.GitProfileUtils;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.experimental.Accessors;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.CodeSignature;
import org.bouncycastle.jcajce.spec.OpenSSHPrivateKeySpec;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.util.io.pem.PemReader;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.io.StringReader;
import java.nio.file.Paths;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.IntStream;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class GitRouteAspect {

    private static final Duration LOCK_TTL = Duration.ofSeconds(90);
    private static final String REDIS_REPO_KEY_FORMAT = "purpose=repo/v=1/workspace=%s/artifact=%s/repository=%s/";

    private final ReactiveRedisTemplate<String, String> redis;
    private final GitProfileUtils gitProfileUtils;
    private final GitServiceConfig gitServiceConfig;
    private final GitRouteArtifact gitRouteArtifact;
    private final BashService bashService = new BashService();

    @Value("${appsmith.redis.git.url}")
    private String redisUrl;

    @Value("${appsmith.git.root}")
    private String gitRootPath;

    /*
     * FSM: Definitions
     */

    private enum State {
        ARTIFACT,
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
        EXECUTE,
        UPLOAD,
        UNLOCK,
        RESULT,
        DONE
    }

    private enum Outcome {
        SUCCESS,
        FAIL
    }

    @Getter
    @AllArgsConstructor
    private static class StateConfig {
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
    private static class Context {
        // Inputs
        private ProceedingJoinPoint joinPoint;
        private GitRoute gitRoute;

        // Intermediate Inputs
        private String fieldValue;

        // Tasks
        private Artifact artifact;
        private Artifact parent;
        private GitArtifactMetadata gitMeta;
        private String repoKey;
        private String lockKey;
        private Boolean lock;
        private GitProfile gitProfile;
        private GitAuth gitAuth;
        private String gitKey;
        private String repoPath;
        private Object download;
        private Object execute;
        private Object upload;
        private Boolean unlock;
        private Object result;

        // Errors
        private Throwable error;
    }

    // Refer to GitRouteAspect.md#gitroute-fsm-execution-flow for the FSM diagram.
    private final Map<State, StateConfig> FSM = Map.ofEntries(
            Map.entry(State.ARTIFACT, new StateConfig(State.PARENT, State.RESULT, "artifact", this::artifact)),
            Map.entry(State.PARENT, new StateConfig(State.GIT_META, State.RESULT, "parent", this::parent)),
            Map.entry(State.GIT_META, new StateConfig(State.REPO_KEY, State.RESULT, "gitMeta", this::gitMeta)),
            Map.entry(State.REPO_KEY, new StateConfig(State.LOCK_KEY, State.RESULT, "repoKey", this::repoKey)),
            Map.entry(State.LOCK_KEY, new StateConfig(State.LOCK, State.RESULT, "lockKey", this::lockKey)),
            Map.entry(State.LOCK, new StateConfig(State.GIT_PROFILE, State.RESULT, "lock", this::lock)),
            Map.entry(State.GIT_PROFILE, new StateConfig(State.GIT_AUTH, State.UNLOCK, "gitProfile", this::gitProfile)),
            Map.entry(State.GIT_AUTH, new StateConfig(State.GIT_KEY, State.UNLOCK, "gitAuth", this::gitAuth)),
            Map.entry(State.GIT_KEY, new StateConfig(State.REPO_PATH, State.UNLOCK, "gitKey", this::gitKey)),
            Map.entry(State.REPO_PATH, new StateConfig(State.DOWNLOAD, State.UNLOCK, "repoPath", this::repoPath)),
            Map.entry(State.DOWNLOAD, new StateConfig(State.EXECUTE, State.UNLOCK, "download", this::download)),
            Map.entry(State.EXECUTE, new StateConfig(State.UPLOAD, State.UPLOAD, "execute", this::execute)),
            Map.entry(State.UPLOAD, new StateConfig(State.UNLOCK, State.UNLOCK, "upload", this::upload)),
            Map.entry(State.UNLOCK, new StateConfig(State.RESULT, State.RESULT, "unlock", this::unlock)),
            Map.entry(State.RESULT, new StateConfig(State.DONE, State.DONE, "result", this::result)));

    /*
     * FSM: Runners
     */

    // Entry point for Git operations
    @Around("@annotation(gitRoute)")
    public Object handleGitRoute(ProceedingJoinPoint joinPoint, GitRoute gitRoute) {
        Context ctx = new Context().setJoinPoint(joinPoint).setGitRoute(gitRoute);

        // If Git is not in memory, we can just execute the join point
        if (!gitServiceConfig.isGitInMemory()) {
            return execute(ctx);
        }

        String fieldValue = extractFieldValue(joinPoint, gitRoute.fieldName());

        ctx.setFieldValue(fieldValue);

        return run(ctx, State.ARTIFACT)
                .flatMap(unused -> ctx.getError() != null ? Mono.error(ctx.getError()) : Mono.just(ctx.getResult()));
    }

    // State machine executor
    private Mono<Object> run(Context ctx, State current) {
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
                    log.info("State: {}, SUCCESS: {}, Time: {}ms", current, result, duration);
                    return run(ctx, config.next(Outcome.SUCCESS));
                })
                .onErrorResume(e -> {
                    ctx.setError(e);
                    long duration = System.currentTimeMillis() - startTime;
                    log.info("State: {}, FAIL: {}, Time: {}ms", current, e.getMessage(), duration);
                    return run(ctx, config.next(Outcome.FAIL));
                });
    }

    /*
     * FSM: Tasks
     */

    // Acquires Redis lock
    private Mono<Boolean> lock(Context ctx) {
        return redis.opsForValue()
                .setIfAbsent(ctx.getLockKey(), "1", LOCK_TTL)
                .flatMap(locked -> locked
                        ? Mono.just(true)
                        : Mono.error(new AppsmithException(AppsmithError.GIT_FILE_IN_USE, ctx.getLockKey())));
    }

    // Finds artifact
    private Mono<?> artifact(Context ctx) {
        ArtifactType artifactType = ctx.getGitRoute().artifactType();
        String artifactId = ctx.getFieldValue();
        return gitRouteArtifact.getArtifact(artifactType, artifactId);
    }

    // Finds parent artifact
    private Mono<?> parent(Context ctx) {
        ArtifactType artifactType = ctx.getGitRoute().artifactType();
        String parentArtifactId = ctx.getArtifact().getGitArtifactMetadata().getDefaultArtifactId();
        return gitRouteArtifact.getArtifact(artifactType, parentArtifactId);
    }

    // Validates Git metadata
    private Mono<?> gitMeta(Context ctx) {
        return Mono.justOrEmpty(ctx.getParent().getGitArtifactMetadata())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.INVALID_GIT_CONFIGURATION, "Git metadata is not configured")));
    }

    // Generates Redis repo key
    private Mono<?> repoKey(Context ctx) {
        String key = String.format(
                REDIS_REPO_KEY_FORMAT,
                ctx.getArtifact().getWorkspaceId(),
                ctx.getGitMeta().getDefaultArtifactId(),
                ctx.getGitMeta().getRepoName());
        return Mono.just(key);
    }

    // Generates Redis lock key
    private Mono<?> lockKey(Context ctx) {
        String key = String.format("purpose=lock/%s", ctx.getRepoKey());
        return Mono.just(key);
    }

    // Gets Git user profile
    private Mono<GitProfile> gitProfile(Context ctx) {
        return gitProfileUtils
                .getGitProfileForUser(ctx.getFieldValue())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.INVALID_GIT_CONFIGURATION, "Git profile is not configured")));
    }

    // Validates Git auth
    private Mono<?> gitAuth(Context ctx) {
        return Mono.justOrEmpty(ctx.getGitMeta().getGitAuth())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.INVALID_GIT_CONFIGURATION, "Git authentication is not configured")));
    }

    // Processes Git SSH key
    private Mono<?> gitKey(Context ctx) {
        try {
            return Mono.just(processPrivateKey(
                    ctx.getGitAuth().getPrivateKey(), ctx.getGitAuth().getPublicKey()));
        } catch (Exception e) {
            return Mono.error(new AppsmithException(
                    AppsmithError.INVALID_GIT_CONFIGURATION, "Failed to process private key: " + e.getMessage()));
        }
    }

    // Gets local repo path
    private Mono<?> repoPath(Context ctx) {
        var path = Paths.get(
                gitRootPath,
                ctx.getArtifact().getWorkspaceId(),
                ctx.getGitMeta().getDefaultArtifactId(),
                ctx.getGitMeta().getRepoName());
        return Mono.just(path.toString());
    }

    // Downloads Git repo
    private Mono<?> download(Context ctx) {
        return bashService.callFunction(
                "git.sh",
                "git_download",
                ctx.getGitProfile().getAuthorEmail(),
                ctx.getGitProfile().getAuthorName(),
                ctx.getGitKey(),
                ctx.getRepoKey(),
                redisUrl,
                ctx.getGitMeta().getRemoteUrl(),
                ctx.getRepoPath());
    }

    // Executes Git operation
    private Mono<?> execute(Context ctx) {
        try {
            return (Mono<Object>) ctx.getJoinPoint().proceed();
        } catch (Throwable e) {
            return Mono.error(e);
        }
    }

    // Uploads Git changes
    private Mono<?> upload(Context ctx) {
        return bashService.callFunction("git.sh", "git_upload", ctx.getRepoKey(), redisUrl, ctx.getRepoPath());
    }

    // Releases Redis lock
    private Mono<?> unlock(Context ctx) {
        return redis.delete(ctx.getLockKey()).map(count -> count > 0);
    }

    // Returns operation result
    private Mono<?> result(Context ctx) {
        return ctx.getError() != null ? Mono.error(ctx.getError()) : Mono.just(ctx.getExecute());
    }

    /*
     * Helpers: Git Route
     */

    // Extracts field from join point
    private static String extractFieldValue(ProceedingJoinPoint jp, String target) {
        String[] names = ((CodeSignature) jp.getSignature()).getParameterNames();
        Object[] values = jp.getArgs();
        return IntStream.range(0, names.length)
                .filter(i -> names[i].equals(target))
                .mapToObj(i -> String.valueOf(values[i]))
                .findFirst()
                .orElse(null);
    }

    // Sets context field value
    private static void setContextField(Context ctx, String fieldName, Object value) {
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

    // Processes SSH private key
    private static String processPrivateKey(String privateKey, String publicKey) throws Exception {
        String[] splitKeys = privateKey.split("-----.*-----\n");
        return splitKeys.length > 1
                ? handlePemFormat(privateKey, publicKey)
                : handleBase64Format(privateKey, publicKey);
    }

    // Handles PEM format key
    private static String handlePemFormat(String privateKey, String publicKey) throws Exception {
        byte[] content =
                new PemReader(new StringReader(privateKey)).readPemObject().getContent();
        OpenSSHPrivateKeySpec privateKeySpec = new OpenSSHPrivateKeySpec(content);
        KeyFactory keyFactory = getKeyFactory(publicKey);
        PrivateKey generatedPrivateKey = keyFactory.generatePrivate(privateKeySpec);
        return Base64.getEncoder().encodeToString(generatedPrivateKey.getEncoded());
    }

    // Handles Base64 format key
    private static String handleBase64Format(String privateKey, String publicKey) throws Exception {
        PKCS8EncodedKeySpec privateKeySpec =
                new PKCS8EncodedKeySpec(Base64.getDecoder().decode(privateKey));
        PrivateKey generatedPrivateKey = getKeyFactory(publicKey).generatePrivate(privateKeySpec);
        return formatPrivateKey(Base64.getEncoder().encodeToString(generatedPrivateKey.getEncoded()));
    }

    // Gets key factory for algorithm
    private static KeyFactory getKeyFactory(String publicKey) throws Exception {
        String algo = publicKey.startsWith("ssh-rsa") ? "RSA" : "ECDSA";
        return KeyFactory.getInstance(algo, new BouncyCastleProvider());
    }

    // Formats private key string
    private static String formatPrivateKey(String privateKey) {
        return "-----BEGIN PRIVATE KEY-----\n" + privateKey + "\n-----END PRIVATE KEY-----";
    }
}
