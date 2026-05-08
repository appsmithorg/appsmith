package com.appsmith.server.git.central.helpers;

import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Application;
import com.appsmith.server.events.GitDiscardChangesEvent;
import com.appsmith.server.git.central.CentralGitService;
import com.appsmith.server.git.central.GitType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.ApplicationEventPublisher;
import reactor.core.publisher.Mono;

import java.lang.reflect.Proxy;
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
                applicationEventPublisher, centralGitServiceProvider, gitDiscardChangesAsyncEventManagerProvider);
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

    @Test
    void publishAsyncEvent_publishesGitDiscardChangesEvent() {
        GitDiscardChangesEvent event = new GitDiscardChangesEvent(
                "artifact-id", ArtifactType.APPLICATION, GitType.FILE_SYSTEM, FALSE, "author", "author@example.com");

        manager.publishAsyncEvent(event);

        assertThat(publishedEvent.get()).isSameAs(event);
    }

    @Test
    void discardChangesEventListener_discardsChangesThroughAnnotatedProxyWithEventParameters() throws Exception {
        GitDiscardChangesEvent event = new GitDiscardChangesEvent(
                "artifact-id", ArtifactType.APPLICATION, GitType.FILE_SYSTEM, FALSE, "author", "author@example.com");
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<Object[]> capturedArgs = new AtomicReference<>();
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
                            Boolean isValidateAndPublish) {
                        capturedArgs.set(new Object[] {
                            branchedArtifactId, authorName, authorEmail, artifactType, gitType, isValidateAndPublish
                        });
                        latch.countDown();
                        return Mono.just(new Application());
                    }
                };
        gitDiscardChangesAsyncEventManagerProvider = providerFor(gitDiscardChangesAsyncEventManager);
        manager = new GitDiscardChangesAsyncEventManagerImpl(
                applicationEventPublisher, centralGitServiceProvider, gitDiscardChangesAsyncEventManagerProvider);

        manager.discardChangesEventListener(event);

        assertThat(latch.await(1, TimeUnit.SECONDS)).isTrue();
        assertThat(capturedArgs.get())
                .containsExactly(
                        "artifact-id",
                        "author",
                        "author@example.com",
                        ArtifactType.APPLICATION,
                        GitType.FILE_SYSTEM,
                        FALSE);
    }

    @Test
    void discardChanges_delegatesToCentralGitService() {
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
                applicationEventPublisher, centralGitServiceProvider, gitDiscardChangesAsyncEventManagerProvider);

        manager.discardChanges(
                        "artifact-id",
                        "author",
                        "author@example.com",
                        ArtifactType.APPLICATION,
                        GitType.FILE_SYSTEM,
                        FALSE)
                .block();

        assertThat(capturedArgs.get())
                .containsExactly("artifact-id", ArtifactType.APPLICATION, GitType.FILE_SYSTEM, FALSE);
    }
}
