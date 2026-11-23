package com.appsmith.server.diagnostics.collectors;

import com.appsmith.server.diagnostics.collectors.DiagnosticsSchema.ValueKind;
import org.junit.jupiter.api.Test;
import org.springframework.aop.support.AopUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Keeps {@link ValueKind#FREE_TEXT} fenced: it is the one kind the redaction guard checks by length only, so every
 * new use needs a security review.
 */
@SpringBootTest
class DiagnosticsCollectorFreeTextTest {

    @Autowired
    private List<DiagnosticsCollector> collectors;

    @Test
    void should_declareFreeTextOnlyForConfiguredPublicUrl_when_everyCollectorSchemaIsBuilt() {
        // Given
        Map<String, List<String>> freeTextKeysByCollector = new TreeMap<>();

        // When
        for (DiagnosticsCollector collector : collectors) {
            List<String> freeTextKeys = collector.schema().keys().entrySet().stream()
                    .filter(entry -> entry.getValue() == ValueKind.FREE_TEXT)
                    .map(Map.Entry::getKey)
                    .toList();
            if (!freeTextKeys.isEmpty()) {
                freeTextKeysByCollector.put(AopUtils.getTargetClass(collector).getSimpleName(), freeTextKeys);
            }
        }

        // Then
        assertThat(collectors).hasSizeGreaterThan(1);
        assertThat(freeTextKeysByCollector)
                .containsExactly(Map.entry("InstanceDiagnosticsCollector", List.of("configuredPublicUrl")));
    }
}
