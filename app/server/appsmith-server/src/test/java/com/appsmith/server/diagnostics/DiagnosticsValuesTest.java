package com.appsmith.server.diagnostics;

import com.appsmith.external.enums.FeatureFlagEnum;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

import static org.assertj.core.api.Assertions.assertThat;

class DiagnosticsValuesTest {

    private static final FeatureFlagEnum FLAG = FeatureFlagEnum.TEST_FEATURE_1;
    private static final Supplier<Object> LICENSED_VALUE = () -> "licensed-value";

    @Test
    void should_returnWhenLicensedValue_when_flagIsTrue() {
        // Given
        Map<String, Boolean> flags = Map.of(FLAG.name(), true);

        // When
        Object result = DiagnosticsValues.fromFlag(flags, FLAG, LICENSED_VALUE);

        // Then
        assertThat(result).isEqualTo("licensed-value");
    }

    @Test
    void should_returnNotLicensed_when_flagIsFalse() {
        // Given
        Map<String, Boolean> flags = Map.of(FLAG.name(), false);

        // When
        Object result = DiagnosticsValues.fromFlag(flags, FLAG, LICENSED_VALUE);

        // Then
        assertThat(result).isEqualTo(DiagnosticsValues.NOT_LICENSED);
    }

    @Test
    void should_returnUnknown_when_flagIsMissing() {
        // Given
        Map<String, Boolean> flags = Map.of("some_other_flag", true);

        // When
        Object result = DiagnosticsValues.fromFlag(flags, FLAG, LICENSED_VALUE);

        // Then
        assertThat(result).isEqualTo(DiagnosticsValues.UNKNOWN);
    }

    @Test
    void should_returnUnknown_when_flagValueIsNull() {
        // Given
        Map<String, Boolean> flags = new HashMap<>();
        flags.put(FLAG.name(), null);

        // When
        Object result = DiagnosticsValues.fromFlag(flags, FLAG, LICENSED_VALUE);

        // Then
        assertThat(result).isEqualTo(DiagnosticsValues.UNKNOWN);
    }

    @Test
    void should_returnUnknown_when_flagMapIsNull() {
        // When
        Object result = DiagnosticsValues.fromFlag(null, FLAG, LICENSED_VALUE);

        // Then
        assertThat(result).isEqualTo(DiagnosticsValues.UNKNOWN);
    }

    @Test
    void should_notCallWhenLicensed_when_flagIsFalse() {
        // Given
        Map<String, Boolean> flags = Map.of(FLAG.name(), false);
        Supplier<Object> failing = () -> {
            throw new AssertionError("whenLicensed must not run");
        };

        // When
        Object result = DiagnosticsValues.fromFlag(flags, FLAG, failing);

        // Then
        assertThat(result).isEqualTo(DiagnosticsValues.NOT_LICENSED);
    }

    @Test
    void should_keepKeyOrder_when_allWithGetsKeys() {
        // Given
        List<String> keys = List.of("zeta", "alpha", "mid");

        // When
        Map<String, Object> result = DiagnosticsValues.allWith(keys, DiagnosticsValues.UNKNOWN);

        // Then
        assertThat(result.keySet()).containsExactly("zeta", "alpha", "mid");
        assertThat(result.values()).containsOnly(DiagnosticsValues.UNKNOWN);
    }

    @Test
    void should_returnEmptyMap_when_allWithGetsNoKeys() {
        // When
        Map<String, Object> result = DiagnosticsValues.allWith(List.of(), DiagnosticsValues.UNKNOWN);

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void should_reportNotSupportedInKeyOrder_when_allNotSupportedGetsKeys() {
        // Given
        List<String> keys = List.of("zeta", "alpha", "mid");

        // When
        Map<String, Object> result = DiagnosticsValues.allNotSupported(keys);

        // Then
        assertThat(result.keySet()).containsExactly("zeta", "alpha", "mid");
        assertThat(result.values()).containsOnly(DiagnosticsValues.NOT_SUPPORTED);
    }

    @Test
    void should_returnEmptyMap_when_allNotSupportedGetsNoKeys() {
        // When
        Map<String, Object> result = DiagnosticsValues.allNotSupported(List.of());

        // Then
        assertThat(result).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"1", "1.9", "1.9.30", "1.9.30-SNAPSHOT", "1.2.3+build.5", "1.2.3.4"})
    void should_returnVersion_when_versionMatchesPattern(String version) {
        // When
        String result = DiagnosticsValues.versionOrUnknown(version);

        // Then
        assertThat(result).isEqualTo(version);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "   ", "v1.2.3", "latest", "1.2.", "1.2.3.4.5", "1.2.3 beta"})
    void should_returnUnknown_when_versionDoesNotMatchPattern(String version) {
        // When
        String result = DiagnosticsValues.versionOrUnknown(version);

        // Then
        assertThat(result).isEqualTo(DiagnosticsValues.UNKNOWN);
    }

    @ParameterizedTest
    @ValueSource(strings = {"abcdef1", "0123456789abcdef0123456789abcdef01234567"})
    void should_returnCommitSha_when_shaIsLowercaseHexOfValidLength(String sha) {
        // When
        String result = DiagnosticsValues.commitShaOrUnknown(sha);

        // Then
        assertThat(result).isEqualTo(sha);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"ABCDEF1", "abcdef", "0123456789abcdef0123456789abcdef012345678", "abcdefg", "release-1.0"})
    void should_returnUnknown_when_shaIsUppercaseTooShortTooLongOrNotHex(String sha) {
        // When
        String result = DiagnosticsValues.commitShaOrUnknown(sha);

        // Then
        assertThat(result).isEqualTo(DiagnosticsValues.UNKNOWN);
    }
}
