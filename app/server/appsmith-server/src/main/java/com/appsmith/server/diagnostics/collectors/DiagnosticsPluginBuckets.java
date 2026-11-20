package com.appsmith.server.diagnostics.collectors;

import com.appsmith.server.diagnostics.DiagnosticsValues;
import org.springframework.util.StringUtils;

import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;

/**
 * Maps plugin package names to a fixed list of buckets. Only names on the list reach a diagnostics result.
 * Any other package name becomes {@link DiagnosticsValues#OTHER}.
 */
public final class DiagnosticsPluginBuckets {

    /** Package names of the built-in plugins, from {@code PluginConstants.PackageName} and the seeding migrations. */
    public static final Set<String> KNOWN_PACKAGE_NAMES = Set.of(
            "amazons3-plugin",
            "anthropic-plugin",
            "appsmith-agent-plugin",
            "appsmithai-plugin",
            "arangodb-plugin",
            "aws-lambda-plugin",
            "databricks-plugin",
            "dynamo-plugin",
            "elasticsearch-plugin",
            "firestore-plugin",
            "google-sheets-plugin",
            "googleai-plugin",
            "graphql-plugin",
            "js-plugin",
            "mongo-plugin",
            "mssql-plugin",
            "mysql-plugin",
            "openai-plugin",
            "oracle-plugin",
            "postgres-plugin",
            "rapidapi-plugin",
            "redis-plugin",
            "redshift-plugin",
            "restapi-plugin",
            "saas-plugin",
            "smtp-plugin",
            "snowflake-plugin",
            "workflow-plugin");

    /** Package names of the plugins with {@code PluginType.AI}. */
    public static final Set<String> AI_PACKAGE_NAMES = Set.of(
            "openai-plugin", "anthropic-plugin", "googleai-plugin", "appsmithai-plugin", "appsmith-agent-plugin");

    private DiagnosticsPluginBuckets() {}

    /** Returns the package name when it is known. Otherwise, or when it is null or blank, returns {@code other}. */
    public static String bucket(String packageName) {
        if (!StringUtils.hasText(packageName) || !KNOWN_PACKAGE_NAMES.contains(packageName)) {
            return DiagnosticsValues.OTHER;
        }
        return packageName;
    }

    /** Every key {@link #bucket} can return. */
    public static Set<String> bucketKeys() {
        Set<String> keys = new TreeSet<>(KNOWN_PACKAGE_NAMES);
        keys.add(DiagnosticsValues.OTHER);
        return keys;
    }

    /**
     * Sums counts per bucket. A plugin ID with no known package name goes to {@code other}.
     */
    public static Map<String, Long> foldByBucket(
            Map<String, Long> countsByPluginId, Map<String, String> packageNameByPluginId) {
        Map<String, Long> result = new TreeMap<>();
        countsByPluginId.forEach((pluginId, count) -> {
            if (count == null) {
                return;
            }
            result.merge(bucket(packageNameByPluginId.get(pluginId)), count, Long::sum);
        });
        return result;
    }
}
