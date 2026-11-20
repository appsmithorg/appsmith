package com.appsmith.server.diagnostics;

import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionId;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionResult;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.UUID;

/**
 * Redis store for collected support diagnostics sections, plus a short per-section lock that keeps two requests from
 * collecting the same section at once. Redis outages never fail a request: reads come back empty, writes are skipped,
 * and the lock is reported as {@link DiagnosticsLockOutcome#UNCONFIRMED}. A Redis call that takes longer than {@link #REDIS_TIMEOUT} counts as an
 * outage.
 */
@Slf4j
@Component
public class DiagnosticsResultStore {

    static final String RESULT_KEY_PREFIX = "support_diagnostics:";
    static final String LOCK_KEY_PREFIX = "support_diagnostics_lock:";
    static final Duration RESULT_TTL = Duration.ofHours(1);
    static final Duration LOCK_TTL = Duration.ofSeconds(30);
    static final Duration REDIS_TIMEOUT = Duration.ofSeconds(2);

    private final ReactiveRedisOperations<String, String> redisOperations;
    private final ObjectMapper objectMapper;

    public DiagnosticsResultStore(ReactiveRedisOperations<String, String> redisOperations, ObjectMapper objectMapper) {
        this.redisOperations = redisOperations;
        // Section results carry Instant values, so the copy needs the java.time module regardless of how the
        // shared mapper is configured.
        this.objectMapper = objectMapper.copy().findAndRegisterModules();
    }

    public Mono<DiagnosticsSectionResult> get(String organizationId, DiagnosticsSectionId sectionId) {
        return Mono.defer(() -> redisOperations.opsForValue().get(resultKey(organizationId, sectionId)))
                .timeout(REDIS_TIMEOUT)
                .flatMap(payload -> readResult(sectionId, payload))
                .onErrorResume(error -> {
                    logFailure("get", sectionId, error);
                    return Mono.empty();
                });
    }

    public Mono<Void> put(String organizationId, DiagnosticsSectionResult result) {
        String payload;
        try {
            payload = objectMapper.writeValueAsString(result);
        } catch (JsonProcessingException exception) {
            logFailure("serialize", result.sectionId(), exception);
            return Mono.empty();
        }

        return Mono.defer(() -> redisOperations
                        .opsForValue()
                        .set(resultKey(organizationId, result.sectionId()), payload, RESULT_TTL))
                .timeout(REDIS_TIMEOUT)
                .then()
                .onErrorResume(error -> {
                    logFailure("put", result.sectionId(), error);
                    return Mono.empty();
                });
    }

    public Mono<DiagnosticsLockOutcome> tryLock(String organizationId, DiagnosticsSectionId sectionId) {
        return Mono.defer(() -> redisOperations
                        .opsForValue()
                        .setIfAbsent(
                                lockKey(organizationId, sectionId),
                                UUID.randomUUID().toString(),
                                LOCK_TTL))
                .timeout(REDIS_TIMEOUT)
                .map(set -> Boolean.TRUE.equals(set) ? DiagnosticsLockOutcome.ACQUIRED : DiagnosticsLockOutcome.HELD)
                .onErrorResume(error -> {
                    logFailure("lock", sectionId, error);
                    return Mono.just(DiagnosticsLockOutcome.UNCONFIRMED);
                })
                .defaultIfEmpty(DiagnosticsLockOutcome.UNCONFIRMED);
    }

    public Mono<Void> unlock(String organizationId, DiagnosticsSectionId sectionId) {
        return Mono.defer(() -> redisOperations.opsForValue().delete(lockKey(organizationId, sectionId)))
                .timeout(REDIS_TIMEOUT)
                .then()
                .onErrorResume(error -> {
                    logFailure("unlock", sectionId, error);
                    return Mono.empty();
                });
    }

    private Mono<DiagnosticsSectionResult> readResult(DiagnosticsSectionId sectionId, String payload) {
        try {
            return Mono.just(objectMapper.readValue(payload, DiagnosticsSectionResult.class));
        } catch (JsonProcessingException exception) {
            logFailure("parse", sectionId, exception);
            return Mono.empty();
        }
    }

    /**
     * Logs the operation, section, and exception class only. Redis exception messages can carry the Redis URL, so
     * neither the message nor the stack trace is logged.
     */
    private static void logFailure(String operation, DiagnosticsSectionId sectionId, Throwable error) {
        log.warn(
                "Support diagnostics {} failed for section {} with {}",
                operation,
                sectionId,
                error.getClass().getName());
    }

    static String resultKey(String organizationId, DiagnosticsSectionId sectionId) {
        return RESULT_KEY_PREFIX + organizationId + ":" + sectionId.name();
    }

    static String lockKey(String organizationId, DiagnosticsSectionId sectionId) {
        return LOCK_KEY_PREFIX + organizationId + ":" + sectionId.name();
    }
}
