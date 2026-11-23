package com.appsmith.server.diagnostics.collectors;

import com.appsmith.server.diagnostics.collectors.DiagnosticsSchema.ValueKind;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DiagnosticsSchemaTest {

    @ParameterizedTest
    @EnumSource(
            value = ValueKind.class,
            names = {"CATEGORY", "FIELD", "MAP"})
    void should_throwIllegalArgument_when_keyDeclaresKindThatNeedsValueList(ValueKind kind) {
        // Given
        DiagnosticsSchema.Builder builder = DiagnosticsSchema.builder();

        // When / Then
        assertThatThrownBy(() -> builder.key("k", kind))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Declare a " + kind + " key with category(), field() or map(), not key()");
    }

    @ParameterizedTest
    @EnumSource(
            value = ValueKind.class,
            names = {"CATEGORY", "FIELD", "MAP"},
            mode = EnumSource.Mode.EXCLUDE)
    void should_declareKey_when_kindNeedsNoValueList(ValueKind kind) {
        // When
        DiagnosticsSchema schema = DiagnosticsSchema.builder().key("k", kind).build();

        // Then
        assertThat(schema.keys()).containsEntry("k", kind);
    }
}
