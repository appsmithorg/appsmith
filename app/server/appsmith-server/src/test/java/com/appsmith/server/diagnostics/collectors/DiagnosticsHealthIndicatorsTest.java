package com.appsmith.server.diagnostics.collectors;

import com.appsmith.server.diagnostics.DiagnosticsValues;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.ReactiveHealthIndicator;
import org.springframework.boot.actuate.health.Status;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.stream.Stream;

class DiagnosticsHealthIndicatorsTest {

    private static final ReactiveHealthIndicator UP_INDICATOR =
            () -> Mono.just(Health.up().build());

    @Test
    void should_mapOutOfServiceToDown_when_indicatorReports() {
        // Given
        ReactiveHealthIndicator outOfService = () -> Mono.just(
                Health.outOfService().withDetail("version", "zzseed-detail").build());
        DiagnosticsHealthIndicators indicators = new DiagnosticsHealthIndicators(outOfService, UP_INDICATOR);

        // When
        Mono<String> result = indicators.mongo();

        // Then
        StepVerifier.create(result).expectNext(DiagnosticsValues.DOWN).verifyComplete();
    }

    static Stream<Arguments> statuses() {
        return Stream.of(
                Arguments.of(Status.UP, DiagnosticsValues.UP),
                Arguments.of(Status.DOWN, DiagnosticsValues.DOWN),
                Arguments.of(Status.UNKNOWN, DiagnosticsValues.UNKNOWN),
                Arguments.of(new Status("zzseed-custom"), DiagnosticsValues.UNKNOWN));
    }

    @ParameterizedTest
    @MethodSource("statuses")
    void should_mapStatusCode_when_redisIndicatorReports(Status status, String expected) {
        // Given
        ReactiveHealthIndicator redis = () -> Mono.just(Health.status(status).build());
        DiagnosticsHealthIndicators indicators = new DiagnosticsHealthIndicators(UP_INDICATOR, redis);

        // When
        Mono<String> result = indicators.redis();

        // Then
        StepVerifier.create(result).expectNext(expected).verifyComplete();
    }

    @Test
    void should_returnDown_when_indicatorErrors() {
        // Given
        ReactiveHealthIndicator failing =
                () -> Mono.error(new IllegalStateException("redis://admin:hunter2@cache.internal"));
        DiagnosticsHealthIndicators indicators = new DiagnosticsHealthIndicators(UP_INDICATOR, failing);

        // When
        Mono<String> result = indicators.redis();

        // Then
        StepVerifier.create(result).expectNext(DiagnosticsValues.DOWN).verifyComplete();
    }

    @Test
    void should_returnUnknown_when_mongoHealthHangs() {
        // Given
        ReactiveHealthIndicator hanging = Mono::never;
        DiagnosticsHealthIndicators indicators = new DiagnosticsHealthIndicators(hanging, UP_INDICATOR);

        // When
        StepVerifier.withVirtualTime(indicators::mongo)

                // Then
                .expectSubscription()
                .expectNoEvent(Duration.ofMillis(2999))
                .thenAwait(Duration.ofMillis(1))
                .expectNext(DiagnosticsValues.UNKNOWN)
                .verifyComplete();
    }
}
