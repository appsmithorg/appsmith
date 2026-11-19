package com.appsmith.server.diagnostics;

import com.appsmith.server.diagnostics.dtos.DiagnosticsField;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;

class DiagnosticsRedactionGuardTest {

    private final DiagnosticsRedactionGuard guard = new DiagnosticsRedactionGuard(new ObjectMapper());

    @Test
    void should_reportKeyNotAllowed_when_dataHasUndeclaredKey() {
        // Given
        Map<String, Object> data = Map.of("edition", "CE", "datasourceUrl", "postgres://admin:hunter2@db.internal/app");

        // When
        Optional<String> violation = guard.violation(Set.of("edition"), data);

        // Then
        assertThat(violation).contains("key_not_allowed");
    }

    @Test
    void should_reportValueNotAllowed_when_nestedMapHoldsStrings() {
        // Given
        Map<String, Object> data = Map.of("widgetsByType", Map.of("TABLE_WIDGET", "Orders table"));

        // When
        Optional<String> violation = guard.violation(Set.of("widgetsByType"), data);

        // Then
        assertThat(violation).contains("value_not_allowed");
    }

    @Test
    void should_reportValueNotAllowed_when_stringExceeds256Characters() {
        // Given
        Map<String, Object> data = Map.of("edition", "x".repeat(257));

        // When
        Optional<String> violation = guard.violation(Set.of("edition"), data);

        // Then
        assertThat(violation).contains("value_not_allowed");
    }

    @Test
    void should_reportValueNotAllowed_when_leafIsListOrObject() {
        // Given
        Map<String, Object> data = Map.of("edition", java.util.List.of("CE"));

        // When
        Optional<String> violation = guard.violation(Set.of("edition"), data);

        // Then
        assertThat(violation).contains("value_not_allowed");
    }

    @Test
    void should_reportValueNotAllowed_when_diagnosticsFieldValueIsNotALeaf() {
        // Given
        Map<String, Object> data = Map.of(
                "tool", new DiagnosticsField(Map.of("url", "postgres://db"), "runtime", "detected", "available"));

        // When
        Optional<String> violation = guard.violation(Set.of("tool"), data);

        // Then
        assertThat(violation).contains("value_not_allowed");
    }

    @Test
    void should_reportValueNotAllowed_when_nestedMapIsTwoLevelsDeep() {
        // Given
        Map<String, Object> data = Map.of("widgetsByType", Map.of("TABLE_WIDGET", Map.of("count", 4)));

        // When
        Optional<String> violation = guard.violation(Set.of("widgetsByType"), data);

        // Then
        assertThat(violation).contains("value_not_allowed");
    }

    @Test
    void should_returnEmpty_when_leafIsNull() {
        // Given
        Map<String, Object> data = new HashMap<>();
        data.put("edition", null);

        // When
        Optional<String> violation = guard.violation(Set.of("edition"), data);

        // Then
        assertThat(violation).isEmpty();
    }

    @Test
    void should_reportSectionTooLarge_when_serializedDataExceedsLimit() {
        // Given: 6,000 categories with numeric counts, about 120 KB of JSON
        Map<String, Object> counts = new HashMap<>();
        for (int i = 0; i < 6000; i++) {
            counts.put("category_" + i, i);
        }

        // When
        Optional<String> violation = guard.violation(Set.of("widgetsByType"), Map.of("widgetsByType", counts));

        // Then
        assertThat(violation).contains("section_too_large");
    }

    @ParameterizedTest
    @ValueSource(strings = {"jane@acme.com", "Orders table", "db.internal", ""})
    void should_reportValueNotAllowed_when_nestedMapKeyIsNotACategory(String key) {
        // Given
        Map<String, Object> data = Map.of("widgetsByType", Map.of(key, 3));

        // When
        Optional<String> violation = guard.violation(Set.of("widgetsByType"), data);

        // Then
        assertThat(violation).contains("value_not_allowed");
    }

    @Test
    void should_reportValueNotAllowed_when_nestedMapKeyIsNotAString() {
        // Given
        Map<String, Object> data = Map.of("widgetsByType", Map.of(42, 3));

        // When
        Optional<String> violation = guard.violation(Set.of("widgetsByType"), data);

        // Then
        assertThat(violation).contains("value_not_allowed");
    }

    @Test
    void should_returnEmpty_when_nestedMapKeysAreCategories() {
        // Given
        Map<String, Object> data = Map.of("counts", Map.of("TABLE_WIDGET", 1, "postgres-plugin", 2));

        // When
        Optional<String> violation = guard.violation(Set.of("counts"), data);

        // Then
        assertThat(violation).isEmpty();
    }

    @Test
    void should_reportValueNotAllowed_when_diagnosticsFieldSourceExceeds256Characters() {
        // Given
        Map<String, Object> data =
                Map.of("tool", new DiagnosticsField("kubernetes", "x".repeat(257), "detected", "available"));

        // When
        Optional<String> violation = guard.violation(Set.of("tool"), data);

        // Then
        assertThat(violation).contains("value_not_allowed");
    }

    @Test
    void should_reportValueNotAllowed_when_leafIsAnUnlistedNumberType() {
        // Given
        Map<String, Object> data = Map.of("uptimeSeconds", new AtomicLong(5));

        // When
        Optional<String> violation = guard.violation(Set.of("uptimeSeconds"), data);

        // Then
        assertThat(violation).contains("value_not_allowed");
    }

    @Test
    void should_returnEmpty_when_dataMeetsEveryRule() {
        // Given
        Map<String, Object> data = Map.of(
                "edition",
                "EE",
                "uptimeSeconds",
                120L,
                "tool",
                new DiagnosticsField("kubernetes", "runtime", "detected", "available"),
                "widgetsByType",
                Map.of("TABLE_WIDGET", 4));

        // When
        Optional<String> violation = guard.violation(Set.of("edition", "uptimeSeconds", "tool", "widgetsByType"), data);

        // Then
        assertThat(violation).isEmpty();
    }
}
