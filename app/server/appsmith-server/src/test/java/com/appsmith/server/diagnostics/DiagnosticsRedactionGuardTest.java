package com.appsmith.server.diagnostics;

import com.appsmith.server.diagnostics.collectors.DiagnosticsSchema;
import com.appsmith.server.diagnostics.collectors.DiagnosticsSchema.ValueKind;
import com.appsmith.server.diagnostics.dtos.DiagnosticsField;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

class DiagnosticsRedactionGuardTest {

    private final DiagnosticsRedactionGuard guard = new DiagnosticsRedactionGuard(new ObjectMapper());

    /** Builds the record directly, so a test can declare any kind, including those the builder's key() rejects. */
    private static DiagnosticsSchema schemaOf(String key, ValueKind kind) {
        return new DiagnosticsSchema(Map.of(key, kind), Map.of(), Map.of());
    }

    @Test
    void should_reportKeyNotAllowed_when_dataHasUndeclaredKey() {
        // Given
        DiagnosticsSchema schema =
                DiagnosticsSchema.builder().category("edition", "CE", "EE").build();
        Map<String, Object> data = Map.of("edition", "CE", "datasourceUrl", "postgres://admin:hunter2@db.internal/app");

        // When
        Optional<String> violation = guard.violation(schema, data);

        // Then
        assertThat(violation).contains("key_not_allowed");
    }

    @Test
    void should_reportValueNotAllowed_when_dataIsNull() {
        // When
        Optional<String> violation = guard.violation(schemaOf("edition", ValueKind.COUNT), null);

        // Then
        assertThat(violation).contains("value_not_allowed");
    }

    @Test
    void should_reportValueNotAllowed_when_stringExceeds256Characters() {
        // Given
        Map<String, Object> data = Map.of("note", "x".repeat(257));

        // When
        Optional<String> violation = guard.violation(schemaOf("note", ValueKind.FREE_TEXT), data);

        // Then
        assertThat(violation).contains("value_not_allowed");
    }

    @Test
    void should_allowLongString_when_freeTextKey() {
        // Given
        Map<String, Object> data = Map.of("note", "https://acme.test/" + "x".repeat(200));

        // When
        Optional<String> violation = guard.violation(schemaOf("note", ValueKind.FREE_TEXT), data);

        // Then
        assertThat(violation).isEmpty();
    }

    @Test
    void should_reportValueNotAllowed_when_leafIsListOrObject() {
        // Given
        Map<String, Object> data = Map.of("edition", List.of("CE"));

        // When
        Optional<String> violation = guard.violation(
                DiagnosticsSchema.builder().category("edition", "CE").build(), data);

        // Then
        assertThat(violation).contains("value_not_allowed");
    }

    @Test
    void should_reportValueNotAllowed_when_diagnosticsFieldValueIsNotALeaf() {
        // Given
        DiagnosticsSchema schema =
                DiagnosticsSchema.builder().field("tool", "kubernetes").build();
        Map<String, Object> data = Map.of(
                "tool", new DiagnosticsField(Map.of("url", "postgres://db"), "runtime", "detected", "available"));

        // When
        Optional<String> violation = guard.violation(schema, data);

        // Then
        assertThat(violation).contains("value_not_allowed");
    }

    @Test
    void should_reportValueNotAllowed_when_diagnosticsFieldValueIsNotInFixedList() {
        // Given
        DiagnosticsSchema schema =
                DiagnosticsSchema.builder().field("tool", "kubernetes").build();
        Map<String, Object> data = Map.of("tool", new DiagnosticsField("nomad", "runtime", "detected", "available"));

        // When
        Optional<String> violation = guard.violation(schema, data);

        // Then
        assertThat(violation).contains("value_not_allowed");
    }

    static Stream<Arguments> invalidFieldMetadata() {
        String bad = "db.internal";
        return Stream.of(
                Arguments.of("source", bad),
                Arguments.of("confidence", bad),
                Arguments.of("availability", bad),
                Arguments.of("source", null),
                Arguments.of("confidence", null),
                Arguments.of("availability", null));
    }

    @ParameterizedTest
    @MethodSource("invalidFieldMetadata")
    void should_reportValueNotAllowed_when_diagnosticsFieldMetadataIsNotAConstant(String part, String bad) {
        // Given
        DiagnosticsSchema schema =
                DiagnosticsSchema.builder().field("tool", "kubernetes").build();
        DiagnosticsField field = new DiagnosticsField(
                "kubernetes",
                part.equals("source") ? bad : "runtime",
                part.equals("confidence") ? bad : "detected",
                part.equals("availability") ? bad : "available");

        // When
        Optional<String> violation = guard.violation(schema, Map.of("tool", field));

        // Then
        assertThat(violation).contains("value_not_allowed");
    }

    @Test
    void should_allowDiagnosticsField_when_valueIsNumberOrSentinel() {
        // Given
        DiagnosticsSchema schema =
                DiagnosticsSchema.builder().field("cpuCount").field("replicas").build();
        Map<String, Object> data = Map.of(
                "cpuCount",
                new DiagnosticsField(4, "runtime", "detected", "available"),
                "replicas",
                DiagnosticsField.unknown("orchestrator"));

        // When
        Optional<String> violation = guard.violation(schema, data);

        // Then
        assertThat(violation).isEmpty();
    }

    @Test
    void should_reportValueNotAllowed_when_nestedMapHoldsUnlistedStrings() {
        // Given
        DiagnosticsSchema schema = DiagnosticsSchema.builder()
                .map("widgetsByType", Set.of("TABLE_WIDGET"))
                .build();
        Map<String, Object> data = Map.of("widgetsByType", Map.of("TABLE_WIDGET", "Orders table"));

        // When
        Optional<String> violation = guard.violation(schema, data);

        // Then
        assertThat(violation).contains("value_not_allowed");
    }

    @Test
    void should_reportValueNotAllowed_when_nestedMapIsTwoLevelsDeep() {
        // Given
        DiagnosticsSchema schema = DiagnosticsSchema.builder()
                .map("widgetsByType", Set.of("TABLE_WIDGET"))
                .build();
        Map<String, Object> data = Map.of("widgetsByType", Map.of("TABLE_WIDGET", Map.of("count", 4)));

        // When
        Optional<String> violation = guard.violation(schema, data);

        // Then
        assertThat(violation).contains("value_not_allowed");
    }

    @Test
    void should_rejectNestedKey_when_notInSchema() {
        // Given
        DiagnosticsSchema schema =
                DiagnosticsSchema.builder().map("m", Set.of("a")).build();
        Map<String, Object> data = Map.of("m", Map.of("b", 1));

        // When
        Optional<String> violation = guard.violation(schema, data);

        // Then
        assertThat(violation).contains("key_not_allowed");
    }

    @Test
    void should_rejectNestedMap_when_keyHasNoNestedSchema() {
        // Given
        DiagnosticsSchema noNestedKeys = schemaOf("m", ValueKind.MAP);
        DiagnosticsSchema notAMap = schemaOf("m", ValueKind.COUNT);
        Map<String, Object> data = Map.of("m", Map.of("a", 1));

        // When
        Optional<String> withoutNestedKeys = guard.violation(noNestedKeys, data);
        Optional<String> withNonMapKind = guard.violation(notAMap, data);

        // Then
        assertThat(withoutNestedKeys).contains("key_not_allowed");
        assertThat(withNonMapKind).contains("value_not_allowed");
    }

    @Test
    void should_allowEmptyMap_when_nestedKeySetIsEmpty() {
        // Given
        DiagnosticsSchema schema =
                DiagnosticsSchema.builder().map("m", Set.of()).build();

        // When
        Optional<String> empty = guard.violation(schema, Map.of("m", Map.of()));
        Optional<String> nonEmpty = guard.violation(schema, Map.of("m", Map.of("a", 1)));

        // Then
        assertThat(empty).isEmpty();
        assertThat(nonEmpty).contains("key_not_allowed");
    }

    @Test
    void should_allowNestedBooleanAndCategoryString_when_inSchema() {
        // Given
        DiagnosticsSchema schema = DiagnosticsSchema.builder()
                .map("m", Set.of("a", "b", "c", "d"), "UP", "DOWN")
                .build();
        Map<String, Object> data = Map.of("m", Map.of("a", true, "b", "UP", "c", 3, "d", "NOT_LICENSED"));

        // When
        Optional<String> violation = guard.violation(schema, data);

        // Then
        assertThat(violation).isEmpty();
    }

    @Test
    void should_reportValueNotAllowed_when_nestedStringIsNotACategory() {
        // Given
        DiagnosticsSchema schema =
                DiagnosticsSchema.builder().map("m", Set.of("a"), "UP", "DOWN").build();

        // When
        Optional<String> violation = guard.violation(schema, Map.of("m", Map.of("a", "db.internal")));

        // Then
        assertThat(violation).contains("value_not_allowed");
    }

    @Test
    void should_reportValueNotAllowed_when_leafIsAnUnlistedNumberType() {
        // Given
        Map<String, Object> data = Map.of("uptimeSeconds", new AtomicLong(5));

        // When
        Optional<String> violation = guard.violation(schemaOf("uptimeSeconds", ValueKind.COUNT), data);

        // Then
        assertThat(violation).contains("value_not_allowed");
    }

    @Test
    void should_reportSectionTooLarge_when_serializedDataExceedsLimit() {
        // Given: 6,000 nested keys with numeric counts, about 120 KB of JSON
        Map<String, Object> counts = new HashMap<>();
        Set<String> nestedKeys = new java.util.HashSet<>();
        for (int i = 0; i < 6000; i++) {
            counts.put("category_" + i, i);
            nestedKeys.add("category_" + i);
        }
        DiagnosticsSchema schema =
                DiagnosticsSchema.builder().map("widgetsByType", nestedKeys).build();

        // When
        Optional<String> violation = guard.violation(schema, Map.of("widgetsByType", counts));

        // Then
        assertThat(violation).contains("section_too_large");
    }

    static Stream<Arguments> identifiers() {
        return Stream.of(
                Arguments.of("https://acme.test"),
                Arguments.of("a@b.test"),
                Arguments.of("has space"),
                Arguments.of("mongo.acme.internal"),
                Arguments.of("10.0.0.5:27017"),
                Arguments.of("5f8d0d55b54764421b7156c3"));
    }

    @ParameterizedTest
    @MethodSource("identifiers")
    void should_rejectIdentifier_when_keyIsCategoryOrVersion(String identifier) {
        // Given
        DiagnosticsSchema category =
                DiagnosticsSchema.builder().category("c", "linux", "other").build();
        DiagnosticsSchema version = schemaOf("v", ValueKind.VERSION);

        // When
        Optional<String> asCategory = guard.violation(category, Map.of("c", identifier));
        Optional<String> asVersion = guard.violation(version, Map.of("v", identifier));

        // Then
        assertThat(asCategory).contains("value_not_allowed");
        assertThat(asVersion).contains("value_not_allowed");
    }

    static Stream<Arguments> valuesThatFitTheirKind() {
        return Stream.of(
                Arguments.of(ValueKind.VERSION, "1.9.30"),
                Arguments.of(ValueKind.VERSION, "1.9.30-SNAPSHOT"),
                Arguments.of(ValueKind.VERSION, "21.0.5+11"),
                Arguments.of(ValueKind.DATE, "2026-12-31"),
                Arguments.of(ValueKind.COMMIT_SHA, "9e1d4bda82"),
                Arguments.of(ValueKind.COMMIT_SHA, "9e1d4bda829dff89745c3a1b2c3d4e5f60718293"),
                Arguments.of(ValueKind.INSTANCE_ID, UUID.randomUUID().toString()),
                Arguments.of(ValueKind.INSTANCE_ID, "5f8d0d55b54764421b7156c3"),
                Arguments.of(ValueKind.CATEGORY, "linux"),
                Arguments.of(ValueKind.COUNT, 12L),
                Arguments.of(ValueKind.BOOLEAN, true),
                Arguments.of(ValueKind.VERSION, "UNKNOWN"),
                Arguments.of(ValueKind.DATE, "NOT_SUPPORTED"),
                Arguments.of(ValueKind.INSTANCE_ID, "UNAVAILABLE"),
                Arguments.of(ValueKind.CATEGORY, "NOT_LICENSED"),
                Arguments.of(ValueKind.COUNT, "NOT_APPLICABLE"),
                Arguments.of(ValueKind.BOOLEAN, "UNKNOWN"),
                Arguments.of(ValueKind.MAP, "NOT_LICENSED"),
                Arguments.of(ValueKind.FIELD, "UNKNOWN"),
                Arguments.of(ValueKind.FREE_TEXT, "UNKNOWN"));
    }

    @ParameterizedTest
    @MethodSource("valuesThatFitTheirKind")
    void should_allowValue_when_itFitsItsKind(ValueKind kind, Object value) {
        // Given
        DiagnosticsSchema schema = new DiagnosticsSchema(
                Map.of("k", kind, "c", ValueKind.CATEGORY), Map.of(), Map.of("c", Set.of("linux")));
        Map<String, Object> data = Map.of(kind == ValueKind.CATEGORY ? "c" : "k", value);

        // When
        Optional<String> violation = guard.violation(schema, data);

        // Then
        assertThat(violation).isEmpty();
    }

    @Test
    void should_rejectCategory_when_valueNotInItsSet() {
        // Given
        DiagnosticsSchema schema =
                DiagnosticsSchema.builder().category("osName", "linux", "macos").build();

        // When
        Optional<String> violation = guard.violation(schema, Map.of("osName", "windows"));

        // Then
        assertThat(violation).contains("value_not_allowed");
    }

    @ParameterizedTest
    @ValueSource(strings = {"2026-13-01", "2026-1-1", "31/12/2026", "2026-02-30"})
    void should_rejectDate_when_notIsoCalendarDate(String date) {
        // When
        Optional<String> violation = guard.violation(schemaOf("d", ValueKind.DATE), Map.of("d", date));

        // Then
        assertThat(violation).contains("value_not_allowed");
    }

    @ParameterizedTest
    @ValueSource(strings = {"instance-1", "123e4567-e89b-12d3-a456-42661417400", "5f8d0d55b54764421b7156c"})
    void should_rejectUuid_when_notCanonical(String value) {
        // When
        Optional<String> violation = guard.violation(schemaOf("id", ValueKind.INSTANCE_ID), Map.of("id", value));

        // Then
        assertThat(violation).contains("value_not_allowed");
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                "mongo.acme.internal",
                "123e4567-e89b-12d3-a456-426614174000",
                "has space",
                "ABCDEF1",
                "abc12",
                "g1234567"
            })
    void should_rejectCommitSha_when_valueIsNotLowercaseHex(String value) {
        // When
        Optional<String> violation = guard.violation(schemaOf("sha", ValueKind.COMMIT_SHA), Map.of("sha", value));

        // Then
        assertThat(violation).contains("value_not_allowed");
    }

    @Test
    void should_reportValueNotAllowed_when_valueIsNullForAnyKind() {
        // Given
        Map<String, Object> data = new HashMap<>();
        data.put("k", null);

        // When / Then
        for (ValueKind kind : ValueKind.values()) {
            assertThat(guard.violation(schemaOf("k", kind), data))
                    .as(kind.name())
                    .contains("value_not_allowed");
        }
    }

    static Stream<Arguments> nonFiniteNumbers() {
        return Stream.of(
                Arguments.of(Double.NaN),
                Arguments.of(Double.POSITIVE_INFINITY),
                Arguments.of(Double.NEGATIVE_INFINITY),
                Arguments.of(Float.NaN));
    }

    @ParameterizedTest
    @MethodSource("nonFiniteNumbers")
    void should_rejectNonFiniteNumber_when_present(Number value) {
        // Given
        DiagnosticsSchema schema = DiagnosticsSchema.builder()
                .key("count", ValueKind.COUNT)
                .map("m", Set.of("a"))
                .field("f")
                .build();

        // When
        Optional<String> topLevel = guard.violation(schema, Map.of("count", value));
        Optional<String> nested = guard.violation(schema, Map.of("m", Map.of("a", value)));
        Optional<String> inField =
                guard.violation(schema, Map.of("f", new DiagnosticsField(value, "runtime", "detected", "available")));

        // Then
        assertThat(topLevel).contains("value_not_allowed");
        assertThat(nested).contains("value_not_allowed");
        assertThat(inField).contains("value_not_allowed");
    }

    @Test
    void should_returnEmpty_when_dataMeetsEveryRule() {
        // Given
        DiagnosticsSchema schema = DiagnosticsSchema.builder()
                .category("edition", "EE")
                .key("uptimeSeconds", ValueKind.COUNT)
                .field("tool", "kubernetes")
                .map("widgetsByType", Set.of("TABLE_WIDGET"))
                .build();
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
        Optional<String> violation = guard.violation(schema, data);

        // Then
        assertThat(violation).isEmpty();
    }
}
