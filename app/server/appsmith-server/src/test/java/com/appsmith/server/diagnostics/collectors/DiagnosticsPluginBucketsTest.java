package com.appsmith.server.diagnostics.collectors;

import com.appsmith.external.constants.PluginConstants;
import com.appsmith.server.diagnostics.DiagnosticsValues;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import java.lang.reflect.Field;
import java.util.Map;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

class DiagnosticsPluginBucketsTest {

    private static final Pattern CATEGORY_PATTERN = Pattern.compile("^[A-Za-z0-9_-]{1,64}$");

    @Test
    void should_returnPackageName_when_known() {
        // Given
        String packageName = "postgres-plugin";

        // When
        String result = DiagnosticsPluginBuckets.bucket(packageName);

        // Then
        assertThat(result).isEqualTo("postgres-plugin");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"zzseed-plugin", "   "})
    void should_returnOther_when_unknownOrBlank(String packageName) {
        // When
        String result = DiagnosticsPluginBuckets.bucket(packageName);

        // Then
        assertThat(result).isEqualTo(DiagnosticsValues.OTHER);
    }

    @Test
    void should_sumIntoOther_when_severalUnknownPlugins() {
        // Given
        Map<String, Long> counts = Map.of("p1", 2L, "p2", 3L);
        Map<String, String> packageNames = Map.of("p1", "x-plugin");

        // When
        Map<String, Long> result = DiagnosticsPluginBuckets.foldByBucket(counts, packageNames);

        // Then
        assertThat(result).containsExactly(Map.entry("other", 5L));
    }

    @Test
    void should_sumKnownPlugins_when_samePackageNameOnSeveralIds() {
        // Given
        Map<String, Long> counts = Map.of("p1", 2L, "p2", 3L);
        Map<String, String> packageNames = Map.of("p1", "mongo-plugin", "p2", "mongo-plugin");

        // When
        Map<String, Long> result = DiagnosticsPluginBuckets.foldByBucket(counts, packageNames);

        // Then
        assertThat(result).containsExactly(Map.entry("mongo-plugin", 5L));
    }

    @Test
    void should_matchCategoryPattern_when_anyBucketKey() {
        // When
        var keys = DiagnosticsPluginBuckets.bucketKeys();

        // Then
        assertThat(keys)
                .contains(DiagnosticsValues.OTHER)
                .allMatch(k -> CATEGORY_PATTERN.matcher(k).matches());
    }

    @Test
    void should_includeEveryPackageNameConstant_when_built() throws IllegalAccessException {
        // Given
        Field[] fields = PluginConstants.PackageName.class.getFields();

        // Then
        assertThat(fields).isNotEmpty();
        for (Field field : fields) {
            assertThat(DiagnosticsPluginBuckets.KNOWN_PACKAGE_NAMES).contains((String) field.get(null));
        }
    }

    @Test
    void should_includeSeededPlugins_when_built() {
        // Then
        assertThat(DiagnosticsPluginBuckets.KNOWN_PACKAGE_NAMES)
                .contains(
                        "postgres-plugin",
                        "mysql-plugin",
                        "mssql-plugin",
                        "redis-plugin",
                        "smtp-plugin",
                        "js-plugin",
                        "oracle-plugin",
                        "snowflake-plugin",
                        "elasticsearch-plugin",
                        "arangodb-plugin",
                        "workflow-plugin",
                        "appsmith-agent-plugin");
        assertThat(DiagnosticsPluginBuckets.KNOWN_PACKAGE_NAMES).containsAll(DiagnosticsPluginBuckets.AI_PACKAGE_NAMES);
    }
}
