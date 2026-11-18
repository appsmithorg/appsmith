package com.appsmith.server.diagnostics;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.appsmith.server.diagnostics.collectors.DiagnosticsCollector;
import com.appsmith.server.diagnostics.dtos.DiagnosticsDownloadRequest;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionId;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionResult;
import com.appsmith.server.diagnostics.dtos.DiagnosticsStatus;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.services.SessionUserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.LoggerFactory;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Named.named;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SupportDiagnosticsServiceCEImplTest {

    private static final String LEAKY_MESSAGE = "mongodb://admin:hunter2@db.internal";

    @Mock
    private UserUtils userUtils;

    @Mock
    private SessionUserService sessionUserService;

    @Mock
    private DiagnosticsResultStore resultStore;

    private final DiagnosticsRedactionGuard redactionGuard = new DiagnosticsRedactionGuard(new ObjectMapper());

    private SupportDiagnosticsServiceCEImpl service;

    @BeforeEach
    void setUp() {
        service = newService(List.of());
    }

    private SupportDiagnosticsServiceCEImpl newService(List<DiagnosticsCollector> collectors) {
        return new SupportDiagnosticsServiceCEImpl(
                userUtils, sessionUserService, resultStore, redactionGuard, collectors);
    }

    private SupportDiagnosticsServiceCEImpl newMultiOrgService(
            List<DiagnosticsCollector> collectors, Mono<Boolean> multiOrgAnswer) {
        return new SupportDiagnosticsServiceCEImpl(
                userUtils, sessionUserService, resultStore, redactionGuard, collectors) {
            @Override
            protected Mono<Boolean> isMultiOrgInstance() {
                return multiOrgAnswer;
            }
        };
    }

    private void givenAccessAllowed(String organizationId) {
        when(userUtils.isCurrentUserSuperUser()).thenReturn(Mono.just(true));
        when(sessionUserService.getCurrentUser()).thenReturn(Mono.just(userInOrganization(organizationId)));
    }

    private void givenLockAcquired() {
        when(resultStore.tryLock(anyString(), any())).thenReturn(Mono.just(DiagnosticsLockOutcome.ACQUIRED));
        when(resultStore.unlock(anyString(), any())).thenReturn(Mono.empty());
    }

    private void givenPutSucceeds() {
        when(resultStore.put(anyString(), any())).thenReturn(Mono.empty());
    }

    private DiagnosticsCollector givenCollector(DiagnosticsSectionId sectionId) {
        DiagnosticsCollector collector = mock(DiagnosticsCollector.class);
        when(collector.sectionId()).thenReturn(sectionId);
        service = newService(List.of(collector));
        return collector;
    }

    private static User userInOrganization(String organizationId) {
        User user = new User();
        user.setOrganizationId(organizationId);
        return user;
    }

    private void assertEveryMethodFailsWith(AppsmithError expected) {
        StepVerifier.create(service.listSections())
                .expectErrorSatisfies(e -> assertAppsmithError(e, expected))
                .verify();
        StepVerifier.create(service.collect(DiagnosticsSectionId.INSTANCE))
                .expectErrorSatisfies(e -> assertAppsmithError(e, expected))
                .verify();
        StepVerifier.create(service.recordDownload(new DiagnosticsDownloadRequest(List.of(), false)))
                .expectErrorSatisfies(e -> assertAppsmithError(e, expected))
                .verify();
    }

    private static void assertAppsmithError(Throwable error, AppsmithError expected) {
        assertThat(error).isInstanceOf(AppsmithException.class);
        assertThat(((AppsmithException) error).getError()).isEqualTo(expected);
    }

    static Stream<Arguments> nonSuperUserChecks() {
        return Stream.of(
                Arguments.of(named("super-user check returns false", Mono.just(false))),
                Arguments.of(named("super-user check completes empty", Mono.<Boolean>empty())));
    }

    @ParameterizedTest
    @MethodSource("nonSuperUserChecks")
    void should_failWithUnauthorizedAccessAndTouchNothing_when_userIsNotConfirmedSuperUser(Mono<Boolean> superUser) {
        // Given
        when(userUtils.isCurrentUserSuperUser()).thenReturn(superUser);
        // The rest of the access path is stubbed so that a missing check would reach the store and the collector.
        // These stubs go unused when the check works, so they are lenient.
        lenient().when(sessionUserService.getCurrentUser()).thenReturn(Mono.just(userInOrganization("org1")));
        lenient().when(resultStore.tryLock(anyString(), any())).thenReturn(Mono.just(DiagnosticsLockOutcome.ACQUIRED));
        lenient().when(resultStore.unlock(anyString(), any())).thenReturn(Mono.empty());
        lenient().when(resultStore.put(anyString(), any())).thenReturn(Mono.empty());
        lenient().when(resultStore.get(anyString(), any())).thenReturn(Mono.empty());
        DiagnosticsCollector collector = givenCollector(DiagnosticsSectionId.INSTANCE);
        lenient().when(collector.allowedKeys()).thenReturn(Set.of("edition"));
        lenient().when(collector.collect()).thenReturn(Mono.just(Map.of("edition", "EE")));
        clearInvocations(collector);

        // When / Then
        assertEveryMethodFailsWith(AppsmithError.UNAUTHORIZED_ACCESS);
        verifyNoInteractions(resultStore, collector);
    }

    @Test
    void should_failWithUnauthorizedAccessAndTouchNothing_when_currentUserIsMissing() {
        // Given
        when(userUtils.isCurrentUserSuperUser()).thenReturn(Mono.just(true));
        when(sessionUserService.getCurrentUser()).thenReturn(Mono.empty());

        // When / Then
        assertEveryMethodFailsWith(AppsmithError.UNAUTHORIZED_ACCESS);
        verifyNoInteractions(resultStore);
    }

    @Test
    void should_failAtConstruction_when_twoCollectorsReportTheSameSection() {
        // Given
        List<DiagnosticsCollector> collectors = List.of(new FirstInstanceCollector(), new SecondInstanceCollector());

        // When / Then
        assertThatThrownBy(() -> newService(collectors))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("INSTANCE")
                .hasMessageContaining(FirstInstanceCollector.class.getName())
                .hasMessageContaining(SecondInstanceCollector.class.getName());
    }

    @Test
    void should_storeOkResult_when_collectorSucceeds() {
        // Given
        givenAccessAllowed("org1");
        givenLockAcquired();
        givenPutSucceeds();
        DiagnosticsCollector collector = givenCollector(DiagnosticsSectionId.INSTANCE);
        when(collector.allowedKeys()).thenReturn(Set.of("edition"));
        when(collector.collect()).thenReturn(Mono.just(Map.of("edition", "EE")));

        // When
        Mono<DiagnosticsSectionResult> result = service.collect(DiagnosticsSectionId.INSTANCE);

        // Then
        StepVerifier.create(result)
                .assertNext(r -> {
                    assertThat(r.status()).isEqualTo(DiagnosticsStatus.OK);
                    assertThat(r.data()).containsEntry("edition", "EE");
                    assertThat(r.collectedAt()).isNotNull();
                })
                .verifyComplete();
        verify(resultStore).put(eq("org1"), any(DiagnosticsSectionResult.class));
        verify(resultStore).unlock("org1", DiagnosticsSectionId.INSTANCE);
    }

    @Test
    void should_returnNotSupportedWithoutStoring_when_noCollectorIsRegistered() {
        // Given
        givenAccessAllowed("org1");

        // When
        Mono<DiagnosticsSectionResult> result = service.collect(DiagnosticsSectionId.INSTANCE);

        // Then
        StepVerifier.create(result)
                .assertNext(r -> assertThat(r.status()).isEqualTo(DiagnosticsStatus.NOT_SUPPORTED))
                .verifyComplete();
        verify(resultStore, never()).put(anyString(), any());
        verify(resultStore, never()).tryLock(anyString(), any());
        verify(resultStore, never()).unlock(anyString(), any());
    }

    @Test
    void should_returnUnavailableWithoutStoring_when_collectorThrows() {
        // Given
        givenAccessAllowed("org1");
        givenLockAcquired();
        DiagnosticsCollector collector = givenCollector(DiagnosticsSectionId.INSTANCE);
        when(collector.collect()).thenReturn(Mono.error(new IllegalStateException(LEAKY_MESSAGE)));

        // When
        Mono<DiagnosticsSectionResult> result = service.collect(DiagnosticsSectionId.INSTANCE);

        // Then
        StepVerifier.create(result)
                .assertNext(r -> {
                    assertThat(r.status()).isEqualTo(DiagnosticsStatus.UNAVAILABLE);
                    assertThat(r.errorCode()).isEqualTo("collector_failed");
                    assertThat(r.data()).isNull();
                })
                .verifyComplete();
        verify(resultStore, never()).put(anyString(), any());
        verify(resultStore).unlock("org1", DiagnosticsSectionId.INSTANCE);
    }

    @Test
    void should_logOnlyExceptionClass_when_collectorThrows() {
        // Given
        givenAccessAllowed("org1");
        givenLockAcquired();
        DiagnosticsCollector collector = givenCollector(DiagnosticsSectionId.INSTANCE);
        when(collector.collect()).thenReturn(Mono.error(new IllegalStateException(LEAKY_MESSAGE)));
        Logger logger = (Logger) LoggerFactory.getLogger(SupportDiagnosticsServiceCEImpl.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);

        // When
        try {
            StepVerifier.create(service.collect(DiagnosticsSectionId.INSTANCE))
                    .expectNextCount(1)
                    .verifyComplete();
        } finally {
            logger.detachAppender(appender);
        }

        // Then
        assertThat(appender.list).hasSize(1);
        ILoggingEvent event = appender.list.get(0);
        assertThat(event.getFormattedMessage())
                .isEqualTo("Support diagnostics collector failed for section INSTANCE with "
                        + IllegalStateException.class.getName());
        assertThat(event.getThrowableProxy()).isNull();
    }

    @Test
    void should_returnUnavailableWithoutStoring_when_collectorCompletesEmpty() {
        // Given
        givenAccessAllowed("org1");
        givenLockAcquired();
        DiagnosticsCollector collector = givenCollector(DiagnosticsSectionId.INSTANCE);
        when(collector.collect()).thenReturn(Mono.empty());

        // When
        Mono<DiagnosticsSectionResult> result = service.collect(DiagnosticsSectionId.INSTANCE);

        // Then
        StepVerifier.create(result)
                .assertNext(r -> {
                    assertThat(r.status()).isEqualTo(DiagnosticsStatus.UNAVAILABLE);
                    assertThat(r.errorCode()).isEqualTo("collector_failed");
                })
                .verifyComplete();
        verify(resultStore, never()).put(anyString(), any());
        verify(resultStore).unlock("org1", DiagnosticsSectionId.INSTANCE);
    }

    @Test
    void should_returnUnavailableTimeout_when_collectorExceedsTenSeconds() {
        // Given
        givenAccessAllowed("org1");
        givenLockAcquired();
        DiagnosticsCollector collector = givenCollector(DiagnosticsSectionId.INSTANCE);
        when(collector.collect()).thenReturn(Mono.never());

        // When / Then
        StepVerifier.withVirtualTime(() -> service.collect(DiagnosticsSectionId.INSTANCE))
                .expectSubscription()
                .expectNoEvent(Duration.ofMillis(9900))
                .thenAwait(Duration.ofMillis(100))
                .assertNext(r -> assertThat(r.errorCode()).isEqualTo("timeout"))
                .verifyComplete();
        verify(resultStore, never()).put(anyString(), any());
        verify(resultStore).unlock("org1", DiagnosticsSectionId.INSTANCE);
    }

    @Test
    void should_returnUnavailable_when_guardReportsViolation() {
        // Given
        givenAccessAllowed("org1");
        givenLockAcquired();
        DiagnosticsCollector collector = givenCollector(DiagnosticsSectionId.INSTANCE);
        when(collector.allowedKeys()).thenReturn(Set.of("edition"));
        when(collector.collect()).thenReturn(Mono.just(Map.of("hostname", "db.internal")));

        // When
        Mono<DiagnosticsSectionResult> result = service.collect(DiagnosticsSectionId.INSTANCE);

        // Then
        StepVerifier.create(result)
                .assertNext(r -> assertThat(r.errorCode()).isEqualTo("key_not_allowed"))
                .verifyComplete();
        verify(resultStore, never()).put(anyString(), any());
        verify(resultStore).unlock("org1", DiagnosticsSectionId.INSTANCE);
    }

    static Stream<Arguments> multiOrgAnswers() {
        return Stream.of(
                Arguments.of(named("multi-org check returns true", Mono.just(true))),
                Arguments.of(named("multi-org check completes empty", Mono.<Boolean>empty())));
    }

    @ParameterizedTest
    @MethodSource("multiOrgAnswers")
    void should_failWithUnsupportedOperationAndTouchNothing_when_instanceIsMultiOrgOrUnknown(
            Mono<Boolean> multiOrgAnswer) {
        // Given
        when(userUtils.isCurrentUserSuperUser()).thenReturn(Mono.just(true));
        DiagnosticsCollector collector = mock(DiagnosticsCollector.class);
        when(collector.sectionId()).thenReturn(DiagnosticsSectionId.INSTANCE);
        service = newMultiOrgService(List.of(collector), multiOrgAnswer);
        clearInvocations(collector);

        // When / Then
        assertEveryMethodFailsWith(AppsmithError.UNSUPPORTED_OPERATION);
        verifyNoInteractions(resultStore, sessionUserService, collector);
    }

    @Test
    void should_collectAndStoreWithoutUnlocking_when_lockIsUnconfirmed() {
        // Given
        givenAccessAllowed("org1");
        givenPutSucceeds();
        when(resultStore.tryLock("org1", DiagnosticsSectionId.INSTANCE))
                .thenReturn(Mono.just(DiagnosticsLockOutcome.UNCONFIRMED));
        DiagnosticsCollector collector = givenCollector(DiagnosticsSectionId.INSTANCE);
        when(collector.allowedKeys()).thenReturn(Set.of("edition"));
        when(collector.collect()).thenReturn(Mono.just(Map.of("edition", "EE")));

        // When
        Mono<DiagnosticsSectionResult> result = service.collect(DiagnosticsSectionId.INSTANCE);

        // Then
        StepVerifier.create(result)
                .assertNext(r -> assertThat(r.status()).isEqualTo(DiagnosticsStatus.OK))
                .verifyComplete();
        verify(resultStore).put(eq("org1"), any(DiagnosticsSectionResult.class));
        verify(resultStore, never()).unlock(anyString(), any());
    }

    @Test
    void should_failWithTooManyRequestsAndNotUnlock_when_sectionIsAlreadyBeingCollected() {
        // Given
        givenAccessAllowed("org1");
        DiagnosticsCollector collector = givenCollector(DiagnosticsSectionId.INSTANCE);
        when(resultStore.tryLock("org1", DiagnosticsSectionId.INSTANCE))
                .thenReturn(Mono.just(DiagnosticsLockOutcome.HELD));

        // When / Then
        StepVerifier.create(service.collect(DiagnosticsSectionId.INSTANCE))
                .expectErrorSatisfies(e -> assertAppsmithError(e, AppsmithError.TOO_MANY_REQUESTS))
                .verify();
        verify(resultStore, never()).unlock(anyString(), any());
        verify(collector, never()).collect();
    }

    @Test
    void should_listEverySectionInOrder_when_storeIsEmpty() {
        // Given
        givenAccessAllowed("org1");
        givenCollector(DiagnosticsSectionId.INSTANCE);
        when(resultStore.get(anyString(), any())).thenReturn(Mono.empty());

        // When / Then
        StepVerifier.create(service.listSections())
                .assertNext(response -> {
                    assertThat(response.collectorVersion()).isEqualTo("1");
                    assertThat(response.sections())
                            .extracting(DiagnosticsSectionResult::sectionId)
                            .containsExactly(DiagnosticsSectionId.values());
                    assertThat(response.sections().get(0).status()).isEqualTo(DiagnosticsStatus.NOT_COLLECTED);
                    assertThat(response.sections().get(1).status()).isEqualTo(DiagnosticsStatus.NOT_SUPPORTED);
                })
                .verifyComplete();
    }

    @Test
    void should_returnStoredResult_when_listingAndStoreHasSection() {
        // Given
        givenAccessAllowed("org1");
        givenCollector(DiagnosticsSectionId.INSTANCE);
        DiagnosticsSectionResult stored =
                DiagnosticsSectionResult.ok(DiagnosticsSectionId.INSTANCE, Map.of("edition", "EE"), Instant.now());
        when(resultStore.get("org1", DiagnosticsSectionId.INSTANCE)).thenReturn(Mono.just(stored));

        // When / Then
        StepVerifier.create(service.listSections())
                .assertNext(response -> assertThat(response.sections().get(0)).isSameAs(stored))
                .verifyComplete();
    }

    @Test
    void should_returnNotCollected_when_storedResultIsNotSupportedAndSectionNowHasCollector() {
        // Given
        givenAccessAllowed("org1");
        givenCollector(DiagnosticsSectionId.INSTANCE);
        when(resultStore.get("org1", DiagnosticsSectionId.INSTANCE))
                .thenReturn(Mono.just(DiagnosticsSectionResult.notSupported(DiagnosticsSectionId.INSTANCE)));

        // When / Then
        StepVerifier.create(service.listSections())
                .assertNext(response ->
                        assertThat(response.sections().get(0).status()).isEqualTo(DiagnosticsStatus.NOT_COLLECTED))
                .verifyComplete();
    }

    @Test
    void should_returnNotSupportedWithoutReadingStore_when_listingSectionWithoutCollector() {
        // Given
        givenAccessAllowed("org1");
        givenCollector(DiagnosticsSectionId.INSTANCE);
        when(resultStore.get("org1", DiagnosticsSectionId.INSTANCE)).thenReturn(Mono.empty());

        // When / Then
        StepVerifier.create(service.listSections())
                .assertNext(response ->
                        assertThat(response.sections().get(8).status()).isEqualTo(DiagnosticsStatus.NOT_SUPPORTED))
                .verifyComplete();
        verify(resultStore, never()).get("org1", DiagnosticsSectionId.HEALTH);
    }

    @Test
    void should_complete_when_recordDownloadIsCalledBySuperUser() {
        // Given
        givenAccessAllowed("org1");

        // When / Then
        StepVerifier.create(service.recordDownload(
                        new DiagnosticsDownloadRequest(List.of(DiagnosticsSectionId.INSTANCE), true)))
                .verifyComplete();
    }

    private static class FirstInstanceCollector implements DiagnosticsCollector {
        @Override
        public DiagnosticsSectionId sectionId() {
            return DiagnosticsSectionId.INSTANCE;
        }

        @Override
        public Set<String> allowedKeys() {
            return Set.of();
        }

        @Override
        public Mono<Map<String, Object>> collect() {
            return Mono.just(Map.of());
        }
    }

    private static class SecondInstanceCollector extends FirstInstanceCollector {}
}
