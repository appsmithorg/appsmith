package com.appsmith.server.diagnostics.collectors;

import com.appsmith.external.services.RTSCaller;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.diagnostics.DiagnosticsLockOutcome;
import com.appsmith.server.diagnostics.DiagnosticsRedactionGuard;
import com.appsmith.server.diagnostics.DiagnosticsResultStore;
import com.appsmith.server.diagnostics.DiagnosticsValues;
import com.appsmith.server.diagnostics.SupportDiagnosticsServiceCEImpl;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionId;
import com.appsmith.server.diagnostics.dtos.DiagnosticsStatus;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.services.SessionUserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HealthDiagnosticsCollectorTest {

    @Mock
    private DiagnosticsHealthIndicators healthIndicators;

    @Mock
    private DiagnosticsLoopbackProbe loopbackProbe;

    @Mock
    private CommonConfig commonConfig;

    private HealthDiagnosticsCollectorCE collector;

    private final DiagnosticsRedactionGuard guard = new DiagnosticsRedactionGuard(new ObjectMapper());

    @BeforeEach
    void setUp() {
        collector = new HealthDiagnosticsCollectorCE(healthIndicators, loopbackProbe, commonConfig);
    }

    private void givenAllUp() {
        when(healthIndicators.mongo()).thenReturn(Mono.just(DiagnosticsValues.UP));
        when(healthIndicators.redis()).thenReturn(Mono.just(DiagnosticsValues.UP));
        when(loopbackProbe.rts()).thenReturn(Mono.just(DiagnosticsValues.UP));
        when(loopbackProbe.mcp()).thenReturn(Mono.just(DiagnosticsValues.UP));
        when(commonConfig.getMongoDBVersion()).thenReturn("7.0.14");
    }

    @Test
    void should_returnWithinBudget_when_rtsProbeNeverCompletes(
            @Mock RTSCaller rtsCaller,
            @Mock UserUtils userUtils,
            @Mock SessionUserService sessionUserService,
            @Mock DiagnosticsResultStore resultStore) {
        // Given
        WebClient hangingRts =
                WebClient.builder().exchangeFunction(request -> Mono.never()).build();
        WebClient healthyMcp = WebClient.builder()
                .exchangeFunction(request ->
                        Mono.just(ClientResponse.create(HttpStatus.OK).build()))
                .build();
        when(rtsCaller.get("/rts-api/v1/health-check"))
                .thenReturn(Mono.fromSupplier(
                        () -> hangingRts.method(HttpMethod.GET).uri("/rts-api/v1/health-check")));
        DiagnosticsLoopbackProbe realProbe = new DiagnosticsLoopbackProbe(rtsCaller, healthyMcp);
        when(healthIndicators.mongo()).thenReturn(Mono.just(DiagnosticsValues.UP));
        when(healthIndicators.redis()).thenReturn(Mono.just(DiagnosticsValues.UP));
        when(commonConfig.getMongoDBVersion()).thenReturn("7.0.14");

        User user = new User();
        user.setOrganizationId("org-1");
        when(userUtils.isCurrentUserSuperUser()).thenReturn(Mono.just(true));
        when(sessionUserService.getCurrentUser()).thenReturn(Mono.just(user));
        when(resultStore.tryLock(anyString(), any())).thenReturn(Mono.just(DiagnosticsLockOutcome.UNCONFIRMED));
        when(resultStore.put(anyString(), any())).thenReturn(Mono.empty());
        SupportDiagnosticsServiceCEImpl service = new SupportDiagnosticsServiceCEImpl(
                userUtils,
                sessionUserService,
                resultStore,
                guard,
                List.of(new HealthDiagnosticsCollectorCE(healthIndicators, realProbe, commonConfig)));

        // When
        StepVerifier.withVirtualTime(() -> service.collect(DiagnosticsSectionId.HEALTH))

                // Then
                .expectSubscription()
                .thenAwait(Duration.ofSeconds(3))
                .assertNext(result -> {
                    assertThat(result.status()).isEqualTo(DiagnosticsStatus.OK);
                    assertThat(result.data())
                            .containsEntry("rts", DiagnosticsValues.UNKNOWN)
                            .containsEntry("mcp", DiagnosticsValues.UP);
                })
                .expectComplete()
                .verify(Duration.ofSeconds(5));
    }

    @Test
    void should_reportDown_when_redisDown() {
        // Given
        givenAllUp();
        when(healthIndicators.redis()).thenReturn(Mono.just(DiagnosticsValues.DOWN));

        // When
        Mono<Map<String, Object>> result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> assertThat(data)
                        .containsEntry("redis", DiagnosticsValues.DOWN)
                        .containsEntry("mongo", DiagnosticsValues.UP)
                        .containsEntry("rts", DiagnosticsValues.UP)
                        .containsEntry("mcp", DiagnosticsValues.UP))
                .verifyComplete();
    }

    @Test
    void should_reportMajorMinor_when_mongoVersionHasPatch() {
        // Given
        givenAllUp();

        // When
        Mono<Map<String, Object>> result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> assertThat(data).containsEntry("mongoVersion", "7.0"))
                .verifyComplete();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"7", "seven.zero", "db.internal:27017"})
    void should_reportUnknownVersion_when_mongoVersionMissing(String mongoVersion) {
        // Given
        givenAllUp();
        when(commonConfig.getMongoDBVersion()).thenReturn(mongoVersion);

        // When
        Mono<Map<String, Object>> result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> assertThat(data).containsEntry("mongoVersion", DiagnosticsValues.UNKNOWN))
                .verifyComplete();
    }

    @Test
    void should_reportNotSupported_when_ce() {
        // Given
        givenAllUp();

        // When
        Mono<Map<String, Object>> result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    for (String key : HealthDiagnosticsCollectorCE.EE_KEYS) {
                        assertThat(data).containsEntry(key, DiagnosticsValues.NOT_SUPPORTED);
                    }
                })
                .verifyComplete();
    }

    private HealthDiagnosticsCollectorCE withEeFields(Mono<Map<String, Object>> eeFields) {
        return new HealthDiagnosticsCollectorCE(healthIndicators, loopbackProbe, commonConfig) {
            @Override
            protected Mono<Map<String, Object>> eeFields(String organizationId) {
                return eeFields;
            }
        };
    }

    @Test
    void should_keepCeStatusesAndReportUnknownEeKeys_when_eeFieldsNeverCompletes() {
        // Given
        givenAllUp();
        HealthDiagnosticsCollectorCE neverEe = withEeFields(Mono.never());

        // When
        StepVerifier.Step<Map<String, Object>> verifier =
                StepVerifier.withVirtualTime(() -> neverEe.collect("org-1")).expectSubscription();

        // Then
        verifier.expectNoEvent(DiagnosticsValues.EE_FIELDS_TIMEOUT.minusMillis(1))
                .thenAwait(Duration.ofMillis(1))
                .assertNext(data -> {
                    assertThat(data)
                            .containsEntry("mongo", DiagnosticsValues.UP)
                            .containsEntry("mongoVersion", "7.0");
                    assertThat(data.keySet()).endsWith(HealthDiagnosticsCollectorCE.EE_KEYS.toArray(String[]::new));
                    for (String key : HealthDiagnosticsCollectorCE.EE_KEYS) {
                        assertThat(data).containsEntry(key, DiagnosticsValues.UNKNOWN);
                    }
                })
                .expectComplete()
                .verify(Duration.ofSeconds(5));
    }

    @Test
    void should_emitAtEeTimeout_when_ceIsSlowAndEeFieldsNeverCompletes() {
        // Given
        givenAllUp();
        when(healthIndicators.mongo())
                .thenAnswer(invocation -> Mono.delay(Duration.ofSeconds(5)).thenReturn(DiagnosticsValues.UP));
        HealthDiagnosticsCollectorCE neverEe = withEeFields(Mono.never());

        // When
        StepVerifier.Step<Map<String, Object>> verifier =
                StepVerifier.withVirtualTime(() -> neverEe.collect("org-1")).expectSubscription();

        // Then
        verifier.expectNoEvent(DiagnosticsValues.EE_FIELDS_TIMEOUT.minusMillis(1))
                .thenAwait(Duration.ofMillis(1))
                .assertNext(data -> {
                    assertThat(data).containsEntry("mongo", DiagnosticsValues.UP);
                    for (String key : HealthDiagnosticsCollectorCE.EE_KEYS) {
                        assertThat(data).containsEntry(key, DiagnosticsValues.UNKNOWN);
                    }
                })
                .expectComplete()
                .verify(Duration.ofSeconds(5));
    }

    @Test
    void should_reportUnknownEeKeys_when_eeFieldsIsEmpty() {
        // Given
        givenAllUp();
        HealthDiagnosticsCollectorCE emptyEe = withEeFields(Mono.empty());

        // When
        Mono<Map<String, Object>> result = emptyEe.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(data).containsEntry("mongo", DiagnosticsValues.UP);
                    for (String key : HealthDiagnosticsCollectorCE.EE_KEYS) {
                        assertThat(data).containsEntry(key, DiagnosticsValues.UNKNOWN);
                    }
                })
                .expectComplete()
                .verify(Duration.ofSeconds(5));
    }

    @Test
    void should_keepCeStatusesAndReportUnknownEeKeys_when_eeFieldsFails() {
        // Given
        givenAllUp();
        HealthDiagnosticsCollectorCE failingEe =
                new HealthDiagnosticsCollectorCE(healthIndicators, loopbackProbe, commonConfig) {
                    @Override
                    protected Mono<Map<String, Object>> eeFields(String organizationId) {
                        return Mono.error(new IllegalStateException("license lookup failed"));
                    }
                };

        // When
        Mono<Map<String, Object>> result = failingEe.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(data)
                            .containsEntry("mongo", DiagnosticsValues.UP)
                            .containsEntry("redis", DiagnosticsValues.UP)
                            .containsEntry("rts", DiagnosticsValues.UP)
                            .containsEntry("mcp", DiagnosticsValues.UP)
                            .containsEntry("mongoVersion", "7.0");
                    for (String key : HealthDiagnosticsCollectorCE.EE_KEYS) {
                        assertThat(data).containsEntry(key, DiagnosticsValues.UNKNOWN);
                    }
                    assertThat(guard.violation(failingEe.schema(), data)).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    void should_passTheRedactionGuard_when_collected() {
        // Given
        givenAllUp();
        when(loopbackProbe.rts()).thenReturn(Mono.just(DiagnosticsValues.UNKNOWN));
        when(loopbackProbe.mcp()).thenReturn(Mono.just(DiagnosticsValues.DOWN));

        // When
        Mono<Map<String, Object>> result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data ->
                        assertThat(guard.violation(collector.schema(), data)).isEmpty())
                .verifyComplete();
    }
}
