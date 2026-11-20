package com.appsmith.server.diagnostics;

import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionId;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import org.springframework.data.redis.core.ReactiveValueOperations;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DiagnosticsResultStoreTest {

    @Mock
    private ReactiveRedisOperations<String, String> redisOperations;

    @Mock
    private ReactiveValueOperations<String, String> valueOperations;

    private DiagnosticsResultStore store;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        store = new DiagnosticsResultStore(redisOperations, objectMapper);
    }

    @Test
    void should_storeWithOneHourExpiry_when_putIsCalled() {
        // Given
        when(redisOperations.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.set(anyString(), anyString(), any(Duration.class))).thenReturn(Mono.just(true));
        DiagnosticsSectionResult result =
                DiagnosticsSectionResult.ok(DiagnosticsSectionId.INSTANCE, Map.of("edition", "EE"), Instant.now());

        // When
        StepVerifier.create(store.put("org1", result)).verifyComplete();

        // Then
        verify(valueOperations).set(eq("support_diagnostics:org1:INSTANCE"), anyString(), eq(Duration.ofHours(1)));
    }

    @Test
    void should_returnEqualResult_when_putPayloadIsReadBack() {
        // Given
        when(redisOperations.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.set(anyString(), anyString(), any(Duration.class))).thenReturn(Mono.just(true));
        DiagnosticsSectionResult result = DiagnosticsSectionResult.ok(
                DiagnosticsSectionId.DEPLOYMENT, Map.of("edition", "EE"), Instant.parse("2026-01-02T03:04:05Z"));
        StepVerifier.create(store.put("org1", result)).verifyComplete();
        ArgumentCaptor<String> payload = ArgumentCaptor.forClass(String.class);
        verify(valueOperations).set(anyString(), payload.capture(), any(Duration.class));
        when(valueOperations.get("support_diagnostics:org1:DEPLOYMENT")).thenReturn(Mono.just(payload.getValue()));

        // When
        Mono<DiagnosticsSectionResult> readBack = store.get("org1", DiagnosticsSectionId.DEPLOYMENT);

        // Then
        StepVerifier.create(readBack)
                .assertNext(actual -> assertThat(actual).isEqualTo(result))
                .verifyComplete();
    }

    @Test
    void should_returnEmpty_when_entryIsAbsent() {
        // Given
        when(redisOperations.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("support_diagnostics:org1:INSTANCE")).thenReturn(Mono.empty());

        // When / Then
        StepVerifier.create(store.get("org1", DiagnosticsSectionId.INSTANCE)).verifyComplete();
    }

    @Test
    void should_returnEmpty_when_storedEntryCannotBeParsed() {
        // Given
        when(redisOperations.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("support_diagnostics:org1:INSTANCE")).thenReturn(Mono.just("{not json"));

        // When / Then
        StepVerifier.create(store.get("org1", DiagnosticsSectionId.INSTANCE)).verifyComplete();
    }

    @Test
    void should_returnEmpty_when_redisFailsOnGet() {
        // Given
        when(redisOperations.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn(Mono.error(new RedisConnectionFailureException("down")));

        // When / Then
        StepVerifier.create(store.get("org1", DiagnosticsSectionId.INSTANCE)).verifyComplete();
    }

    @Test
    void should_completeWithoutError_when_redisFailsOnPut() {
        // Given
        when(redisOperations.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.set(anyString(), anyString(), any(Duration.class)))
                .thenReturn(Mono.error(new RedisConnectionFailureException("down")));

        // When / Then
        StepVerifier.create(store.put("org1", DiagnosticsSectionResult.notSupported(DiagnosticsSectionId.WORKFLOWS)))
                .verifyComplete();
    }

    @Test
    void should_returnAcquired_when_lockIsSet() {
        // Given
        when(redisOperations.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(
                        eq("support_diagnostics_lock:org1:INSTANCE"), anyString(), eq(Duration.ofSeconds(30))))
                .thenReturn(Mono.just(true));

        // When / Then
        StepVerifier.create(store.tryLock("org1", DiagnosticsSectionId.INSTANCE))
                .expectNext(DiagnosticsLockOutcome.ACQUIRED)
                .verifyComplete();
    }

    @Test
    void should_returnHeld_when_lockIsAlreadyHeld() {
        // Given
        when(redisOperations.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(
                        eq("support_diagnostics_lock:org1:INSTANCE"), anyString(), eq(Duration.ofSeconds(30))))
                .thenReturn(Mono.just(false));

        // When / Then
        StepVerifier.create(store.tryLock("org1", DiagnosticsSectionId.INSTANCE))
                .expectNext(DiagnosticsLockOutcome.HELD)
                .verifyComplete();
    }

    @Test
    void should_returnUnconfirmed_when_redisFailsOnTryLock() {
        // Given
        when(redisOperations.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(anyString(), anyString(), any(Duration.class)))
                .thenReturn(Mono.error(new RedisConnectionFailureException("down")));

        // When / Then
        StepVerifier.create(store.tryLock("org1", DiagnosticsSectionId.INSTANCE))
                .expectNext(DiagnosticsLockOutcome.UNCONFIRMED)
                .verifyComplete();
    }

    @Test
    void should_returnUnconfirmed_when_redisTryLockCompletesEmpty() {
        // Given
        when(redisOperations.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(anyString(), anyString(), any(Duration.class)))
                .thenReturn(Mono.empty());

        // When / Then
        StepVerifier.create(store.tryLock("org1", DiagnosticsSectionId.INSTANCE))
                .expectNext(DiagnosticsLockOutcome.UNCONFIRMED)
                .verifyComplete();
    }

    @Test
    void should_deleteLockKey_when_unlockIsCalled() {
        // Given
        when(redisOperations.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.delete("support_diagnostics_lock:org1:INSTANCE")).thenReturn(Mono.just(true));

        // When / Then
        StepVerifier.create(store.unlock("org1", DiagnosticsSectionId.INSTANCE)).verifyComplete();
        verify(valueOperations).delete("support_diagnostics_lock:org1:INSTANCE");
    }

    @Test
    void should_completeEmptyAfterTwoSeconds_when_redisGetNeverAnswers() {
        // Given
        when(redisOperations.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn(Mono.never());

        // When / Then
        StepVerifier.withVirtualTime(() -> store.get("org1", DiagnosticsSectionId.INSTANCE))
                .expectSubscription()
                .expectNoEvent(Duration.ofMillis(1999))
                .thenAwait(Duration.ofMillis(1))
                .verifyComplete();
    }

    @Test
    void should_returnUnconfirmedAfterTwoSeconds_when_redisTryLockNeverAnswers() {
        // Given
        when(redisOperations.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(anyString(), anyString(), any(Duration.class)))
                .thenReturn(Mono.never());

        // When / Then
        StepVerifier.withVirtualTime(() -> store.tryLock("org1", DiagnosticsSectionId.INSTANCE))
                .expectSubscription()
                .expectNoEvent(Duration.ofMillis(1999))
                .thenAwait(Duration.ofMillis(1))
                .expectNext(DiagnosticsLockOutcome.UNCONFIRMED)
                .verifyComplete();
    }

    @Test
    void should_completeWithoutError_when_redisFailsOnUnlock() {
        // Given
        when(redisOperations.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.delete(anyString())).thenReturn(Mono.error(new RedisConnectionFailureException("down")));

        // When / Then
        StepVerifier.create(store.unlock("org1", DiagnosticsSectionId.INSTANCE)).verifyComplete();
    }
}
