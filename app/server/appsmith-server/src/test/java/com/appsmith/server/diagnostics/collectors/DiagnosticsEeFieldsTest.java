package com.appsmith.server.diagnostics.collectors;

import com.appsmith.server.diagnostics.DiagnosticsValues;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class DiagnosticsEeFieldsTest {

    private static final List<String> EE_KEYS = List.of("eeOne", "eeTwo");

    private static Map<String, Object> unknownEeValues() {
        return DiagnosticsValues.allWith(EE_KEYS, DiagnosticsValues.UNKNOWN);
    }

    private static Mono<Map<String, Object>> ceData() {
        Map<String, Object> ce = new LinkedHashMap<>();
        ce.put("ceOne", 1L);
        ce.put("ceTwo", 2L);
        return Mono.just(ce);
    }

    @Test
    void should_putCeKeysFirst_when_eeFieldsSucceed() {
        // Given
        Map<String, Object> ee = new LinkedHashMap<>();
        ee.put("eeOne", 10L);
        ee.put("eeTwo", 20L);

        // When
        Mono<Map<String, Object>> result = DiagnosticsEeFields.merge(ceData(), () -> Mono.just(ee), EE_KEYS, "test");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(data.keySet()).containsExactly("ceOne", "ceTwo", "eeOne", "eeTwo");
                    assertThat(data).containsEntry("ceOne", 1L).containsEntry("eeTwo", 20L);
                })
                .verifyComplete();
    }

    @Test
    void should_reportUnknownForEveryEeKey_when_eeFieldsFails() {
        // Given
        Mono<Map<String, Object>> failing = Mono.error(new IllegalStateException("boom"));

        // When
        Mono<Map<String, Object>> result = DiagnosticsEeFields.merge(ceData(), () -> failing, EE_KEYS, "test");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(data.keySet()).containsExactly("ceOne", "ceTwo", "eeOne", "eeTwo");
                    assertThat(data).containsEntry("eeOne", DiagnosticsValues.UNKNOWN);
                    assertThat(data).containsEntry("eeTwo", DiagnosticsValues.UNKNOWN);
                })
                .verifyComplete();
    }

    @Test
    void should_reportUnknownForEveryEeKey_when_eeFieldsIsEmpty() {
        // When
        Mono<Map<String, Object>> result = DiagnosticsEeFields.merge(ceData(), Mono::empty, EE_KEYS, "test");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(data.keySet()).containsExactly("ceOne", "ceTwo", "eeOne", "eeTwo");
                    assertThat(data).containsEntry("eeOne", DiagnosticsValues.UNKNOWN);
                    assertThat(data).containsEntry("eeTwo", DiagnosticsValues.UNKNOWN);
                })
                .verifyComplete();
    }

    @Test
    void should_reportUnknownForEveryEeKey_when_eeFieldsNeverCompletes() {
        // Given
        Map<String, Object> expectedEe = unknownEeValues();

        // When / Then
        StepVerifier.withVirtualTime(() -> DiagnosticsEeFields.merge(ceData(), Mono::never, EE_KEYS, "test"))
                .thenAwait(Duration.ofSeconds(8))
                .assertNext(data -> {
                    assertThat(data.keySet()).containsExactly("ceOne", "ceTwo", "eeOne", "eeTwo");
                    assertThat(data).containsAllEntriesOf(expectedEe);
                })
                .expectComplete()
                .verify(Duration.ofSeconds(5));
    }

    @Test
    void should_propagateError_when_ceDataFails() {
        // Given
        Mono<Map<String, Object>> failingCe = Mono.error(new IllegalStateException("ce failed"));

        // When
        Mono<Map<String, Object>> result =
                DiagnosticsEeFields.merge(failingCe, () -> Mono.just(Map.of("eeOne", 1L)), EE_KEYS, "test");

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> assertThat(error)
                        .isInstanceOf(IllegalStateException.class)
                        .hasMessage("ce failed"))
                .verify(Duration.ofSeconds(5));
    }

    @Test
    void should_completeEmpty_when_ceDataIsEmpty() {
        // When
        Mono<Map<String, Object>> result =
                DiagnosticsEeFields.merge(Mono.empty(), () -> Mono.just(unknownEeValues()), EE_KEYS, "test");

        // Then
        StepVerifier.create(result).verifyComplete();
    }

    @Test
    void should_notThrow_when_ceMapIsImmutable() {
        // Given
        Mono<Map<String, Object>> immutableCe = Mono.just(Map.of("ceOne", 1L));

        // When
        Mono<Map<String, Object>> result = DiagnosticsEeFields.merge(
                immutableCe, () -> Mono.just(Map.of("eeOne", 10L, "eeTwo", 20L)), EE_KEYS, "test");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> assertThat(data)
                        .containsEntry("ceOne", 1L)
                        .containsEntry("eeOne", 10L)
                        .containsEntry("eeTwo", 20L))
                .verifyComplete();
    }
}
