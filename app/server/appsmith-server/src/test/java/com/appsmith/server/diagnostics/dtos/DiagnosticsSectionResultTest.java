package com.appsmith.server.diagnostics.dtos;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class DiagnosticsSectionResultTest {

    @Test
    void should_roundTripThroughJson_when_resultIsOk() throws Exception {
        // Given
        ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();
        DiagnosticsSectionResult result = DiagnosticsSectionResult.ok(
                DiagnosticsSectionId.INSTANCE, Map.of("edition", "EE"), Instant.parse("2026-11-17T14:05:00Z"));

        // When
        DiagnosticsSectionResult read =
                mapper.readValue(mapper.writeValueAsString(result), DiagnosticsSectionResult.class);

        // Then
        assertThat(read).isEqualTo(result);
        assertThat(read.errorCode()).isNull();
    }

    @Test
    void should_carryNoData_when_resultIsUnavailable() {
        // When
        DiagnosticsSectionResult result =
                DiagnosticsSectionResult.unavailable(DiagnosticsSectionId.DEPLOYMENT, "timeout");

        // Then
        assertThat(result.status()).isEqualTo(DiagnosticsStatus.UNAVAILABLE);
        assertThat(result.data()).isNull();
        assertThat(result.collectedAt()).isNull();
        assertThat(result.errorCode()).isEqualTo("timeout");
    }
}
