package com.appsmith.server.git.central.helpers;

import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.User;
import com.appsmith.server.events.GitDiscardChangesEvent;
import com.appsmith.server.git.central.CentralGitService;
import com.appsmith.server.git.central.GitType;
import com.appsmith.server.git.resolver.GitArtifactHelperResolver;
import com.appsmith.server.services.GitArtifactHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import reactor.core.publisher.Mono;

import java.lang.reflect.Proxy;
import java.time.Instant;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static java.lang.Boolean.FALSE;
import static org.assertj.core.api.Assertions.assertThat;

class GitDiscardChangesAsyncEventManagerImplTest {

    private ApplicationEventPublisher applicationEventPublisher;
    private ObjectProvider<CentralGitService> centralGitServiceProvider;
    private ObjectProvider<GitDiscardChangesAsyncEventManager> gitDiscardChangesAsyncEventManagerProvider;

    private GitDiscardChangesAsyncEventManagerImpl manager;
    private final AtomicReference<Object> publishedEvent = new AtomicReference<>();

    @BeforeEach
    void setUp() {
        applicationEventPublisher = publishedEvent::set;
        manager = new GitDiscardChangesAsyncEventManagerImpl(
                applicationEventPublisher, centralGitServiceProvider, gitDiscardChangesAsyncEventManagerProvider, null);
    }

    private static <T> ObjectProvider<T> providerFor(T object) {
        return new ObjectProvider<>() {
            @Override
            public T getObject() {
                return object;
            }

            @Override
            public T getObject(Object... args) {
                return object;
            }

            @Override
            public T getIfAvailable() {
                return object;
            }

            @Override
            public T getIfUnique() {
                return object;
            }
        };
    }

    private static User user() {
        User user = new User();
        user.setEmail("author@example.com");
        user.setName("author");
        return user;
    }

    @SuppressWarnings("unchecked")
    private static GitArtifactHelperResolver resolverFor(Application application) {
        GitArtifactHelper<Application> gitArtifactHelper = (GitArtifactHelper<Application>) Proxy.newProxyInstance(
                GitArtifactHelper.class.getClassLoader(),
                new Class<?>[] {GitArtifactHelper.class},
                (proxy, method, args) -> {
                    if ("getArtifactById".equals(method.getName())) {
                        return Mono.just(application);
                    }
                    if ("getArtifactEditPermission".equals(method.getName())) {
                        return null;
                    }
                    if ("toString".equals(method.getName())) {
                        return "gitArtifactHelper";
                    }
                    throw new UnsupportedOperationException(method.toString());
                });

        return new GitArtifactHelperResolver(null, gitArtifactHelper);
    }

    @Test
    void publishAsyncEvent_publishesGitDiscardChangesEvent() {
        Instant expectedUpdatedAt = Instant.now();
        GitDiscardChangesEvent event = new GitDiscardChangesEvent(
                "artifact-id",
                ArtifactType.APPLICATION,
                GitType.FILE_SYSTEM,
                FALSE,
                "author",
                "author@example.com",
                user(),
                expectedUpdatedAt);

        manager.publishAsyncEvent(event);

        assertThat(publishedEvent.get()).isSameAs(event);
    }

    @Test
    void discardChangesEventListener_discardsChangesThroughAnnotatedProxyWithEventParameters() throws Exception {
        User user = user();
        Instant expectedUpdatedAt = Instant.now();
        GitDiscardChangesEvent event = new GitDiscardChangesEvent(
                "artifact-id",
                ArtifactType.APPLICATION,
                GitType.FILE_SYSTEM,
                FALSE,
                "author",
                "author@example.com",
                user,
                expectedUpdatedAt);
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<Object[]> capturedArgs = new AtomicReference<>();
        AtomicReference<Object> capturedPrincipal = new AtomicReference<>();
        GitDiscardChangesAsyncEventManager gitDiscardChangesAsyncEventManager =
                new GitDiscardChangesAsyncEventManager() {

                    @Override
                    public void publishAsyncEvent(GitDiscardChangesEvent event) {}

                    @Override
                    public void discardChangesEventListener(GitDiscardChangesEvent event) {}

                    @Override
                    public Mono<Application> discardChanges(
                            String branchedArtifactId,
                            String authorName,
                            String authorEmail,
                            ArtifactType artifactType,
                            GitType gitType,
                            Boolean isValidateAndPublish,
                            Instant eventExpectedUpdatedAt) {
                        capturedArgs.set(new Object[] {
                            branchedArtifactId,
                            authorName,
                            authorEmail,
                            artifactType,
                            gitType,
                            isValidateAndPublish,
                            eventExpectedUpdatedAt
                        });
                        return ReactiveSecurityContextHolder.getContext()
                                .doOnNext(context -> capturedPrincipal.set(
                                        context.getAuthentication().getPrincipal()))
                                .thenReturn(new Application())
                                .doOnSuccess(ignored -> latch.countDown());
                    }
                };
        gitDiscardChangesAsyncEventManagerProvider = providerFor(gitDiscardChangesAsyncEventManager);
        manager = new GitDiscardChangesAsyncEventManagerImpl(
                applicationEventPublisher, centralGitServiceProvider, gitDiscardChangesAsyncEventManagerProvider, null);

        manager.discardChangesEventListener(event);

        assertThat(latch.await(1, TimeUnit.SECONDS)).isTrue();
        assertThat(capturedArgs.get())
                .containsExactly(
                        "artifact-id",
                        "author",
                        "author@example.com",
                        ArtifactType.APPLICATION,
                        GitType.FILE_SYSTEM,
                        FALSE,
                        expectedUpdatedAt);
        assertThat(capturedPrincipal.get()).isSameAs(user);
    }

    @Test
    void discardChanges_delegatesToCentralGitService() {
        Instant expectedUpdatedAt = Instant.now();
        Application application = new Application();
        application.setUpdatedAt(expectedUpdatedAt);
        AtomicReference<Object[]> capturedArgs = new AtomicReference<>();
        CentralGitService centralGitService = (CentralGitService) Proxy.newProxyInstance(
                CentralGitService.class.getClassLoader(),
                new Class<?>[] {CentralGitService.class},
                (proxy, method, args) -> {
                    if ("discardChanges".equals(method.getName()) && args.length == 4) {
                        capturedArgs.set(args);
                        return Mono.just(new Application());
                    }
                    if ("toString".equals(method.getName())) {
                        return "centralGitService";
                    }
                    throw new UnsupportedOperationException(method.toString());
                });
        centralGitServiceProvider = providerFor(centralGitService);
        manager = new GitDiscardChangesAsyncEventManagerImpl(
                applicationEventPublisher,
                centralGitServiceProvider,
                gitDiscardChangesAsyncEventManagerProvider,
                resolverFor(application));

        manager.discardChanges(
                        "artifact-id",
                        "author",
                        "author@example.com",
                        ArtifactType.APPLICATION,
                        GitType.FILE_SYSTEM,
                        FALSE,
                        expectedUpdatedAt)
                .block();

        assertThat(capturedArgs.get())
                .containsExactly("artifact-id", ArtifactType.APPLICATION, GitType.FILE_SYSTEM, FALSE);
    }

    @Test
    void discardChanges_skipsCentralDiscardWhenArtifactChangedAfterEventPublication() {
        Instant expectedUpdatedAt = Instant.now();
        Application application = new Application();
        application.setUpdatedAt(expectedUpdatedAt.plusSeconds(1));
        AtomicReference<Object[]> capturedArgs = new AtomicReference<>();
        CentralGitService centralGitService = (CentralGitService) Proxy.newProxyInstance(
                CentralGitService.class.getClassLoader(),
                new Class<?>[] {CentralGitService.class},
                (proxy, method, args) -> {
                    if ("discardChanges".equals(method.getName()) && args.length == 4) {
                        capturedArgs.set(args);
                        return Mono.just(new Application());
                    }
                    if ("toString".equals(method.getName())) {
                        return "centralGitService";
                    }
                    throw new UnsupportedOperationException(method.toString());
                });
        centralGitServiceProvider = providerFor(centralGitService);
        manager = new GitDiscardChangesAsyncEventManagerImpl(
                applicationEventPublisher,
                centralGitServiceProvider,
                gitDiscardChangesAsyncEventManagerProvider,
                resolverFor(application));

        manager.discardChanges(
                        "artifact-id",
                        "author",
                        "author@example.com",
                        ArtifactType.APPLICATION,
                        GitType.FILE_SYSTEM,
                        FALSE,
                        expectedUpdatedAt)
                .block();

        assertThat(capturedArgs.get()).isNull();
    }
}
