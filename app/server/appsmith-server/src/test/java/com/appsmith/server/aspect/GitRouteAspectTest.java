package com.appsmith.server.aspect;

import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.server.annotations.GitRoute;
import com.appsmith.server.artifacts.gitRoute.GitRouteArtifact;
import com.appsmith.server.aspect.ce.GitRouteAspectCE;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.git.constants.GitRouteOperation;
import com.appsmith.server.services.GitArtifactHelper;
import io.micrometer.observation.ObservationRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.stubbing.Answer;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GitRouteAspectTest {

    @Mock
    private ReactiveRedisTemplate<String, String> redis;

    @Mock
    private com.appsmith.server.git.utils.GitProfileUtils gitProfileUtils;

    @Mock
    private com.appsmith.git.configurations.GitServiceConfig gitServiceConfig;

    @Mock
    private GitRouteArtifact gitRouteArtifact;

    @Mock
    private GitArtifactHelper<?> gitArtifactHelper;

    private ObservationRegistry observationRegistry;

    private GitRouteAspect aspect;

    @BeforeEach
    void setUp() {
        observationRegistry = ObservationRegistry.create();
        aspect = new GitRouteAspect(redis, gitProfileUtils, gitServiceConfig, gitRouteArtifact, observationRegistry);
    }

    // ---------------------- Helpers ----------------------

    private static Class<?> contextClass() throws Exception {
        return Class.forName("com.appsmith.server.aspect.ce.GitRouteAspectCE$Context");
    }

    private static Object newContext() throws Exception {
        Class<?> ctxClz = contextClass();
        Constructor<?> ctor = ctxClz.getDeclaredConstructor();
        ctor.setAccessible(true);
        return ctor.newInstance();
    }

    private static void setCtx(Object ctx, String field, Object value) throws Exception {
        Field f = ctx.getClass().getDeclaredField(field);
        f.setAccessible(true);
        f.set(ctx, value);
    }

    private static Object getCtx(Object ctx, String field) throws Exception {
        Field f = ctx.getClass().getDeclaredField(field);
        f.setAccessible(true);
        return f.get(ctx);
    }

    @SuppressWarnings("unchecked")
    private <T> Mono<T> invokeMono(String methodName, Class<?>[] paramTypes, Object... args) throws Exception {
        // Methods are in GitRouteAspectCE, but accessible through GitRouteAspect
        Method m = GitRouteAspectCE.class.getDeclaredMethod(methodName, paramTypes);
        m.setAccessible(true);
        return (Mono<T>) m.invoke(aspect, args);
    }

    private Mono<Boolean> invokeSetLock(String key, String command) throws Exception {
        return invokeMono("setLock", new Class<?>[] {String.class, String.class}, key, command);
    }

    private Mono<Boolean> invokeAddLockWithRetry(String key, String command) throws Exception {
        return invokeMono("addLockWithRetry", new Class<?>[] {String.class, String.class}, key, command);
    }

    private Mono<?> invokeRouteFilter(Object ctx) throws Exception {
        return invokeMono("routeFilter", new Class<?>[] {contextClass()}, ctx);
    }

    private Mono<?> invokeCleanUpFilter(Object ctx) throws Exception {
        return invokeMono("cleanUpFilter", new Class<?>[] {contextClass()}, ctx);
    }

    private Mono<?> invokeMetadataFilter(Object ctx) throws Exception {
        return invokeMono("metadataFilter", new Class<?>[] {contextClass()}, ctx);
    }

    private Mono<?> invokeGitProfile(Object ctx) throws Exception {
        return invokeMono("gitProfile", new Class<?>[] {contextClass()}, ctx);
    }

    private Mono<?> invokeGitAuth(Object ctx) throws Exception {
        return invokeMono("gitAuth", new Class<?>[] {contextClass()}, ctx);
    }

    private Mono<?> invokeRepoKey(Object ctx) throws Exception {
        return invokeMono("repoKey", new Class<?>[] {contextClass()}, ctx);
    }

    private Mono<?> invokeLockKey(Object ctx) throws Exception {
        return invokeMono("lockKey", new Class<?>[] {contextClass()}, ctx);
    }

    private Mono<?> invokeGetLocalBranches(Object ctx) throws Exception {
        return invokeMono("getLocalBranches", new Class<?>[] {contextClass()}, ctx);
    }

    private Mono<?> invokeExecute(Object ctx) throws Exception {
        return invokeMono("execute", new Class<?>[] {contextClass()}, ctx);
    }

    private Mono<?> invokeUnlock(Object ctx) throws Exception {
        return invokeMono("unlock", new Class<?>[] {contextClass()}, ctx);
    }

    private Mono<?> invokeResult(Object ctx) throws Exception {
        return invokeMono("result", new Class<?>[] {contextClass()}, ctx);
    }

    private static GitRoute mockRoute(GitRouteOperation op, ArtifactType type) {
        GitRoute route = Mockito.mock(GitRoute.class);
        when(route.artifactType()).thenReturn(ArtifactType.APPLICATION);
        return route;
    }

    private static GitRoute mockRoute(GitRouteOperation op, ArtifactType type, String fieldName) {
        GitRoute route = Mockito.mock(GitRoute.class);
        when(route.operation()).thenReturn(op);
        return route;
    }

    private static Artifact newArtifact(String workspaceId, GitArtifactMetadata meta) {
        Application a = new Application();
        a.setWorkspaceId(workspaceId);
        a.setGitArtifactMetadata(meta);
        return a;
    }

    // ---------------------- getLocalBranches ----------------------

    @Test
    @DisplayName("getLocalBranches: returns only branch ref names, excluding tags")
    void getLocalBranches_positive_filtersTags() throws Exception {
        Object ctx = newContext();

        // route uses APPLICATION to select corresponding helper
        setCtx(ctx, "gitRoute", mockRoute(GitRouteOperation.STATUS, ArtifactType.APPLICATION));

        // parent with base id
        GitArtifactMetadata parentMeta = newMeta("base-123", "git@github.com:org/repo.git", "repo");
        Application parent = new Application();
        parent.setGitArtifactMetadata(parentMeta);
        setCtx(ctx, "parent", parent);

        // five applications: 3 branches, 2 tags
        Application a1 = new Application();
        GitArtifactMetadata m1 = new GitArtifactMetadata();
        m1.setRefType(RefType.branch);
        m1.setRefName("b1");
        a1.setGitArtifactMetadata(m1);

        Application a2 = new Application();
        GitArtifactMetadata m2 = new GitArtifactMetadata();
        m2.setRefType(RefType.tag);
        m2.setRefName("t1");
        a2.setGitArtifactMetadata(m2);

        Application a3 = new Application();
        GitArtifactMetadata m3 = new GitArtifactMetadata();
        m3.setRefType(RefType.branch);
        m3.setRefName("b2");
        a3.setGitArtifactMetadata(m3);

        Application a4 = new Application();
        GitArtifactMetadata m4 = new GitArtifactMetadata();
        m4.setRefType(RefType.tag);
        m4.setRefName("t2");
        a4.setGitArtifactMetadata(m4);

        Application a5 = new Application();
        GitArtifactMetadata m5 = new GitArtifactMetadata();
        m5.setRefType(RefType.branch);
        m5.setRefName("b3");
        a5.setGitArtifactMetadata(m5);

        // stubs
        when(gitRouteArtifact.getArtifactHelper(ArtifactType.APPLICATION))
                .thenReturn((GitArtifactHelper) gitArtifactHelper);
        when(gitArtifactHelper.getAllArtifactByBaseId("base-123", null))
                .thenAnswer(getArtifactAnswer(List.of(a1, a2, a3, a4, a5)));

        StepVerifier.create(invokeGetLocalBranches(ctx))
                .assertNext(result -> {
                    @SuppressWarnings("unchecked")
                    java.util.List<String> branches = (java.util.List<String>) result;
                    assertThat(branches).hasSize(3);
                    assertThat(branches).containsExactly("b1", "b2", "b3");
                })
                .verifyComplete();
    }

    private static <T extends Artifact> Answer<Flux<T>> getArtifactAnswer(List<T> appList) {
        return invocationOnMock -> Flux.fromIterable(appList);
    }

    private static GitArtifactMetadata newMeta(String baseId, String remoteUrl, String repoName) {
        GitArtifactMetadata m = new GitArtifactMetadata();
        m.setDefaultArtifactId(baseId);
        m.setRemoteUrl(remoteUrl);
        m.setRepoName(repoName);
        return m;
    }

    // ---------------------- routeFilter ----------------------

    @Test
    @DisplayName("routeFilter: emits TRUE when operation requires git FS ops")
    void routeFilter_positive() throws Exception {
        Object ctx = newContext();
        setCtx(ctx, "gitRoute", mockRoute(GitRouteOperation.COMMIT, ArtifactType.APPLICATION, "id"));

        StepVerifier.create(invokeRouteFilter(ctx))
                .assertNext(nodeResult -> {
                    Boolean isFsOp = (Boolean) nodeResult;
                    assertThat(isFsOp).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("routeFilter: errors when operation does not require git FS ops")
    void routeFilter_negative() throws Exception {
        Object ctx = newContext();
        setCtx(ctx, "gitRoute", mockRoute(GitRouteOperation.METADATA, ArtifactType.APPLICATION, "id"));

        StepVerifier.create(invokeRouteFilter(ctx))
                .expectErrorSatisfies(err -> {
                    assertThat(err).isInstanceOf(AppsmithException.class);
                    assertThat(((AppsmithException) err).getAppErrorCode())
                            .isEqualTo(AppsmithError.GIT_ROUTE_FS_OPS_NOT_REQUIRED.getAppErrorCode());
                })
                .verify();
    }

    // ---------------------- clean-up-filter ----------------------

    @Test
    @DisplayName("cleanUpFilter: emits TRUE when operation does not require cleanup")
    void cleanUpFilter_positive() throws Exception {
        Object ctx = newContext();
        setCtx(ctx, "gitRoute", mockRoute(GitRouteOperation.COMMIT, ArtifactType.APPLICATION, "id"));

        StepVerifier.create(invokeCleanUpFilter(ctx))
                .assertNext(nodeResult -> {
                    Boolean notRequiresFilter = (Boolean) nodeResult;
                    assertThat(notRequiresFilter).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("cleanUpFilter: errors when operation require cleanup")
    void cleanUp_negative() throws Exception {
        Object ctx = newContext();
        setCtx(ctx, "gitRoute", mockRoute(GitRouteOperation.DISCONNECT, ArtifactType.APPLICATION, "id"));

        StepVerifier.create(invokeCleanUpFilter(ctx))
                .expectErrorSatisfies(err -> {
                    assertThat(err).isInstanceOf(AppsmithException.class);
                    assertThat(((AppsmithException) err).getAppErrorCode())
                            .isEqualTo(AppsmithError.GIT_ROUTE_FS_CLEAN_UP_REQUIRED.getAppErrorCode());
                })
                .verify();
    }

    // ---------------------- metadataFilter ----------------------

    @Test
    @DisplayName("metadataFilter: emits TRUE when metadata is complete")
    void metadataFilter_positive() throws Exception {
        Object ctx = newContext();
        GitArtifactMetadata meta = newMeta("baseId", "git@github.com:repo.git", "repo");
        setCtx(ctx, "artifact", newArtifact("ws1", meta));

        StepVerifier.create(invokeMetadataFilter(ctx))
                .assertNext(result -> {
                    assertThat(result).isEqualTo(Boolean.TRUE);
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("metadataFilter: errors when metadata is missing/blank")
    void metadataFilter_negative() throws Exception {
        Object ctx = newContext();
        GitArtifactMetadata meta = newMeta(null, null, null);
        setCtx(ctx, "artifact", newArtifact("ws1", meta));

        StepVerifier.create(invokeMetadataFilter(ctx))
                .expectErrorSatisfies(err -> {
                    assertThat(err).isInstanceOf(AppsmithException.class);
                    assertThat(((AppsmithException) err).getAppErrorCode())
                            .isEqualTo(AppsmithError.GIT_ROUTE_METADATA_NOT_FOUND.getAppErrorCode());
                })
                .verify();
    }

    // ---------------------- gitProfile ----------------------

    @Test
    @DisplayName("gitProfile: emits profile when present")
    void gitProfile_positive() throws Exception {
        Object ctx = newContext();
        setCtx(ctx, "fieldValue", "user-id");
        GitProfile profile = new GitProfile();
        profile.setAuthorEmail("u@example.com");
        profile.setAuthorName("User");
        when(gitProfileUtils.getGitProfileForUser("user-id")).thenReturn(Mono.just(profile));

        StepVerifier.create(invokeGitProfile(ctx))
                .assertNext(gitProfile -> {
                    GitProfile testProfile = (GitProfile) gitProfile;
                    assertThat(testProfile).isNotNull();
                    assertThat(testProfile.getAuthorName()).isEqualTo("User");
                    assertThat(testProfile.getAuthorEmail()).isEqualTo("u@example.com");
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("gitProfile: errors when profile not configured")
    void gitProfile_negative() throws Exception {
        Object ctx = newContext();
        setCtx(ctx, "fieldValue", "user-id");
        when(gitProfileUtils.getGitProfileForUser("user-id")).thenReturn(Mono.empty());
        StepVerifier.create(invokeGitProfile(ctx))
                .expectErrorSatisfies(err -> {
                    assertThat(err).isInstanceOf(AppsmithException.class);
                    assertThat(((AppsmithException) err).getAppErrorCode())
                            .isEqualTo(AppsmithError.INVALID_GIT_CONFIGURATION.getAppErrorCode());
                })
                .verify();
    }

    // ---------------------- gitAuth ----------------------

    @Test
    @DisplayName("gitAuth: emits auth when present")
    void gitAuth_positive() throws Exception {
        Object ctx = newContext();
        GitArtifactMetadata meta = newMeta("baseId", "git@github.com:repo.git", "repo");
        GitAuth auth = new GitAuth();
        auth.setPrivateKey(
                "-----BEGIN OPENSSH PRIVATE KEY-----\nAAAAB3NzaC1yc2EAAAADAQABAAABAQ==\n-----END OPENSSH PRIVATE KEY-----\n");
        auth.setPublicKey("ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ test");
        meta.setGitAuth(auth);
        setCtx(ctx, "gitMeta", meta);

        StepVerifier.create(invokeGitAuth(ctx))
                .assertNext(gitAuth -> {
                    GitAuth gitAuth1 = (GitAuth) gitAuth;
                    assertThat(gitAuth1).isNotNull();
                    assertThat(gitAuth1.getPublicKey()).isEqualTo("ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ test");
                    assertThat(gitAuth1.getPrivateKey())
                            .isEqualTo(
                                    "-----BEGIN OPENSSH PRIVATE KEY-----\nAAAAB3NzaC1yc2EAAAADAQABAAABAQ==\n-----END OPENSSH PRIVATE KEY-----\n");
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("gitAuth: errors when missing")
    void gitAuth_negative() throws Exception {
        Object ctx = newContext();
        GitArtifactMetadata meta = newMeta("baseId", "git@github.com:repo.git", "repo");
        meta.setGitAuth(null);
        setCtx(ctx, "gitMeta", meta);

        StepVerifier.create(invokeGitAuth(ctx))
                .expectErrorSatisfies(err -> {
                    assertThat(err).isInstanceOf(AppsmithException.class);
                    assertThat(((AppsmithException) err).getAppErrorCode())
                            .isEqualTo(AppsmithError.INVALID_GIT_CONFIGURATION.getAppErrorCode());
                })
                .verify();
    }

    // ---------------------- keys (repoKey/lockKey) ----------------------

    @Test
    @DisplayName("repoKey: emits formatted repo key from context")
    void repoKey_positive() throws Exception {
        Object ctx = newContext();
        GitArtifactMetadata meta = newMeta("base-app", "git@github.com:org/repo.git", "repo");
        Artifact artifact = newArtifact("ws-123", meta);
        setCtx(ctx, "artifact", artifact);
        setCtx(ctx, "gitMeta", meta);

        StepVerifier.create(invokeRepoKey(ctx))
                .assertNext(key -> {
                    assertThat(key).isInstanceOf(String.class);
                    assertThat((String) key)
                            .isEqualTo("purpose=repo/v=1/workspace=ws-123/artifact=base-app/repository=repo/");
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("lockKey: formats lock key even when repoKey is null")
    void lockKey_nullRepoKey_yieldsString() throws Exception {
        Object ctx = newContext();
        setCtx(ctx, "repoKey", null);

        StepVerifier.create(invokeLockKey(ctx))
                .assertNext(key -> assertThat((String) key).isEqualTo("purpose=lock/null"))
                .verifyComplete();
    }

    // ---------------------- Security Tests: Command Injection Prevention ----------------------

    @Test
    @DisplayName("gitProfile: accepts profile with command injection payload in authorName")
    void gitProfile_commandInjectionInAuthorName_isAccepted() throws Exception {
        // This test verifies that the GitProfile layer accepts the payload.
        // The actual protection happens in BashService.shellEscape() when the value is used.
        Object ctx = newContext();
        setCtx(ctx, "fieldValue", "user-id");

        // Malicious payload from vulnerability report
        GitProfile profile = new GitProfile();
        profile.setAuthorEmail("test@example.com");
        profile.setAuthorName("x$(sleep 5)"); // Command injection payload

        when(gitProfileUtils.getGitProfileForUser("user-id")).thenReturn(Mono.just(profile));

        StepVerifier.create(invokeGitProfile(ctx))
                .assertNext(gitProfile -> {
                    GitProfile testProfile = (GitProfile) gitProfile;
                    assertThat(testProfile).isNotNull();
                    // The payload is stored as-is; protection is at BashService level
                    assertThat(testProfile.getAuthorName()).isEqualTo("x$(sleep 5)");
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("gitProfile: accepts profile with backtick injection payload in authorEmail")
    void gitProfile_backtickInjectionInAuthorEmail_isAccepted() throws Exception {
        Object ctx = newContext();
        setCtx(ctx, "fieldValue", "user-id");

        // Backtick command substitution payload
        GitProfile profile = new GitProfile();
        profile.setAuthorEmail("`id`@evil.com");
        profile.setAuthorName("Normal Name");

        when(gitProfileUtils.getGitProfileForUser("user-id")).thenReturn(Mono.just(profile));

        StepVerifier.create(invokeGitProfile(ctx))
                .assertNext(gitProfile -> {
                    GitProfile testProfile = (GitProfile) gitProfile;
                    assertThat(testProfile).isNotNull();
                    assertThat(testProfile.getAuthorEmail()).isEqualTo("`id`@evil.com");
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("gitProfile: accepts profile with single quotes in authorName")
    void gitProfile_singleQuotesInAuthorName_isAccepted() throws Exception {
        Object ctx = newContext();
        setCtx(ctx, "fieldValue", "user-id");

        // Name with single quotes (legitimate use case)
        GitProfile profile = new GitProfile();
        profile.setAuthorEmail("obrien@example.com");
        profile.setAuthorName("O'Brien");

        when(gitProfileUtils.getGitProfileForUser("user-id")).thenReturn(Mono.just(profile));

        StepVerifier.create(invokeGitProfile(ctx))
                .assertNext(gitProfile -> {
                    GitProfile testProfile = (GitProfile) gitProfile;
                    assertThat(testProfile).isNotNull();
                    assertThat(testProfile.getAuthorName()).isEqualTo("O'Brien");
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("getLocalBranches: branch names with injection payloads are collected")
    void getLocalBranches_branchNamesWithInjectionPayloads_areCollected() throws Exception {
        // Branch names come from the database (stored from remote), not user input.
        // This test verifies they are collected; BashService protects against injection.
        Object ctx = newContext();

        setCtx(ctx, "gitRoute", mockRoute(GitRouteOperation.STATUS, ArtifactType.APPLICATION));

        GitArtifactMetadata parentMeta = newMeta("base-123", "git@github.com:org/repo.git", "repo");
        Application parent = new Application();
        parent.setGitArtifactMetadata(parentMeta);
        setCtx(ctx, "parent", parent);

        // Branch with injection payload (would come from malicious remote)
        Application a1 = new Application();
        GitArtifactMetadata m1 = new GitArtifactMetadata();
        m1.setRefType(RefType.branch);
        m1.setRefName("main");
        a1.setGitArtifactMetadata(m1);

        Application a2 = new Application();
        GitArtifactMetadata m2 = new GitArtifactMetadata();
        m2.setRefType(RefType.branch);
        m2.setRefName("$(whoami)"); // Malicious branch name from remote
        a2.setGitArtifactMetadata(m2);

        when(gitRouteArtifact.getArtifactHelper(ArtifactType.APPLICATION))
                .thenReturn((GitArtifactHelper) gitArtifactHelper);
        when(gitArtifactHelper.getAllArtifactByBaseId("base-123", null)).thenAnswer(getArtifactAnswer(List.of(a1, a2)));

        StepVerifier.create(invokeGetLocalBranches(ctx))
                .assertNext(result -> {
                    @SuppressWarnings("unchecked")
                    java.util.List<String> branches = (java.util.List<String>) result;
                    assertThat(branches).hasSize(2);
                    // Both branch names are collected; BashService will escape them
                    assertThat(branches).containsExactly("main", "$(whoami)");
                })
                .verifyComplete();
    }
}
