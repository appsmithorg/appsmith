package com.external.plugins;

import com.appsmith.external.models.ActionExecutionResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.concurrent.ConcurrentSkipListMap;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

/**
 * Golden snapshots of what the plugin returns, kept as JSON resources under {@code characterization/}. A snapshot is
 * compared to its golden, {@code <suite>-golden.json}, as JSON: object members in any order, numbers by value.
 *
 * <p>Every snapshot taken in a run is also written to {@code target/characterization-actuals/<suite>-golden.json},
 * keyed like the golden. To make the current output the golden, for a new case or an intended change:
 * <ol>
 *   <li>from {@code app/server}, run the suite's test class, for example
 *       {@code mvn -B -pl appsmith-plugins/dynamoPlugin -am -Dsurefire.failIfNoSpecifiedTests=false
 *       -Dtest=DynamoPluginWireCharacterizationTest test};
 *   <li>copy {@code appsmith-plugins/dynamoPlugin/target/characterization-actuals/<suite>-golden.json} to
 *       {@code appsmith-plugins/dynamoPlugin/src/test/resources/characterization/<suite>-golden.json};
 *   <li>run {@code mvn -pl appsmith-plugins/dynamoPlugin spotless:apply
 *       -DspotlessFiles='.*}{@code /characterization/<suite>-golden\.json'};
 *   <li>review the diff of the golden.
 * </ol>
 * The dynamodb-local suite, {@code DynamoPluginLocalCharacterizationTest}, starts DynamoDB Local in a container, so
 * Docker must be running; with Docker 29, add {@code -Dapi.version=1.44} to the test command.
 *
 * <p>The baselines in {@code <suite>-golden-2.15.3.json} are the snapshots the cases that existed on AWS SDK 2.15.3
 * produced there, and pin parity with it. A snapshot of such a case that succeeded on 2.15.3 keeps all of its baseline:
 * every member with the same value, and every list with the same elements in the same order. Objects may have no
 * members beyond the baseline's except those in {@link #MEMBERS_NOT_IN_BASELINE}. Cases that failed on 2.15.3, whose
 * error text comes from the SDK, and cases without a baseline are compared with their golden only.
 *
 * <p>A baseline is a fixed record of SDK 2.15.3 and is never regenerated. When a case that has one changes on purpose,
 * remove that case's entry from {@code <suite>-golden-2.15.3.json}; when the change is a new response-model member,
 * add the member to {@link #MEMBERS_NOT_IN_BASELINE} instead.
 */
final class CharacterizationGolden {

    static final ObjectMapper MAPPER = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);

    /** Response-model members that the baseline snapshots do not have and current snapshots may. */
    static final Set<String> MEMBERS_NOT_IN_BASELINE = Set.of(
            "ContributorInsightsMode",
            "DeletionProtectionEnabled",
            "GlobalTableSettingsReplicationMode",
            "GlobalTableWitnesses",
            "MultiRegionConsistency",
            "OnDemandThroughput",
            "OnDemandThroughputOverride",
            "RecoveryPeriodInDays",
            "ReplicaArn",
            "ReplicaTableClassSummary",
            "TableClassSummary",
            "VectorIndexes",
            "WarmThroughput");

    private static final Pattern UUID =
            Pattern.compile("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");

    /** Equal when both are numbers of the same value, whatever their JSON representation. */
    private static final Comparator<JsonNode> SAME_VALUE = (a, b) -> {
        if (a.isNumber() && b.isNumber()) {
            return a.decimalValue().compareTo(b.decimalValue());
        }
        return a.equals(b) ? 0 : 1;
    };

    private final String suite;
    private final String testClass;
    private final JsonNode golden;
    private final JsonNode baseline;
    private final Map<String, JsonNode> actuals = new ConcurrentSkipListMap<>();

    /** The goldens of {@code suite}, whose cases {@code testClass} runs. */
    CharacterizationGolden(String suite, Class<?> testClass) {
        this.suite = suite;
        this.testClass = testClass.getSimpleName();
        this.golden = readResource("characterization/" + suite + "-golden.json");
        this.baseline = readResource("characterization/" + suite + "-golden-2.15.3.json");
    }

    static JsonNode readResource(String name) {
        try (InputStream in = CharacterizationGolden.class.getClassLoader().getResourceAsStream(name)) {
            return in == null ? null : MAPPER.readTree(in);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /**
     * Records the snapshot and asserts that it matches the golden of the same name and keeps its baseline. A case run
     * more than once in a run, as on each client path, must give the same snapshot every time.
     */
    void assertMatches(String name, Object snapshot) {
        JsonNode actual = toJson(snapshot);
        JsonNode earlier = actuals.putIfAbsent(name, actual);
        if (earlier != null && !earlier.equals(actual)) {
            fail(name + " differs from its earlier snapshot in this run.%nearlier: %s%nnow:     %s", earlier, actual);
        }
        JsonNode expected = golden == null ? null : golden.get(name);
        if (expected == null) {
            fail(
                    "No golden for " + name + " in characterization/" + suite + "-golden.json. " + regenerateSteps()
                            + "%nactual: %s",
                    actual);
        }
        assertThat(expected.equals(SAME_VALUE, actual))
                .as(
                        "%s differs from its golden. If the change is intended: %s%nexpected: %s%nactual:   %s",
                        name, regenerateSteps(), expected, actual)
                .isTrue();
        assertKeepsBaseline(name, actual);
    }

    private String regenerateSteps() {
        return "from app/server, run mvn -B -pl appsmith-plugins/dynamoPlugin -am -Dsurefire.failIfNoSpecifiedTests=false"
                + " -Dtest=" + testClass + " test; copy appsmith-plugins/dynamoPlugin/target/characterization-actuals/"
                + suite + "-golden.json to appsmith-plugins/dynamoPlugin/src/test/resources/characterization/" + suite
                + "-golden.json; run mvn -pl appsmith-plugins/dynamoPlugin spotless:apply"
                + " -DspotlessFiles='.*/characterization/" + suite + "-golden\\.json'; review the diff."
                + " DynamoPluginLocalCharacterizationTest needs Docker running (with Docker 29, add"
                + " -Dapi.version=1.44).";
    }

    /** Asserts that the snapshot keeps all of the case's successful baseline, as the class describes. */
    private void assertKeepsBaseline(String name, JsonNode actual) {
        JsonNode before = baseline == null ? null : baseline.get(name);
        if (before == null || failed(before)) {
            return;
        }
        List<String> differences = new ArrayList<>();
        compareWithBaseline(name, before, actual, differences);
        assertThat(differences)
                .as(
                        "%s compared with its baseline in characterization/%s-golden-2.15.3.json. The baseline is a"
                                + " fixed record of SDK 2.15.3 and is never regenerated. If the change is intended,"
                                + " remove the %s entry from that file, or, for a new response-model member, add the"
                                + " member to CharacterizationGolden.MEMBERS_NOT_IN_BASELINE.",
                        name, suite, name)
                .isEmpty();
    }

    private static boolean failed(JsonNode snapshot) {
        JsonNode result = snapshot.has("result") ? snapshot.get("result") : snapshot;
        return !result.path("isExecutionSuccess").asBoolean(true)
                || !result.path("success").asBoolean(true);
    }

    private static void compareWithBaseline(String path, JsonNode before, JsonNode after, List<String> differences) {
        if (before.isObject() && after.isObject()) {
            before.fieldNames().forEachRemaining(key -> {
                if (after.has(key)) {
                    compareWithBaseline(path + "." + key, before.get(key), after.get(key), differences);
                } else {
                    differences.add(path + "." + key + " is missing");
                }
            });
            after.fieldNames().forEachRemaining(key -> {
                if (!before.has(key) && !MEMBERS_NOT_IN_BASELINE.contains(key)) {
                    differences.add(path + "." + key + " is new");
                }
            });
        } else if (before.isArray() && after.isArray() && before.size() == after.size()) {
            for (int i = 0; i < before.size(); i++) {
                compareWithBaseline(path + "[" + i + "]", before.get(i), after.get(i), differences);
            }
        } else if (!before.equals(SAME_VALUE, after)) {
            differences.add(path + ": " + before + " became " + after);
        }
    }

    /** Writes every snapshot taken so far to {@code target/characterization-actuals/<suite>-golden.json}. */
    void writeActuals() {
        try {
            Path directory = Path.of("target", "characterization-actuals");
            Files.createDirectories(directory);
            MAPPER.writeValue(directory.resolve(suite + "-golden.json").toFile(), actuals);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /**
     * What a user sees of an execution: success, the body, and for a failure the error details. Instants are kept when
     * {@code keepInstants}, otherwise only their type is.
     */
    static Map<String, Object> snapshot(ActionExecutionResult result, boolean keepInstants) {
        Map<String, Object> snapshot = new TreeMap<>();
        snapshot.put("isExecutionSuccess", result.getIsExecutionSuccess());
        snapshot.put("body", normalize(result.getBody(), keepInstants));
        if (!Boolean.TRUE.equals(result.getIsExecutionSuccess())) {
            snapshot.put("statusCode", result.getStatusCode());
            snapshot.put("title", result.getTitle());
            snapshot.put("errorType", result.getErrorType());
            ActionExecutionResult.PluginErrorDetails details = result.getPluginErrorDetails();
            if (details != null) {
                Map<String, Object> detailSnapshot = new TreeMap<>();
                detailSnapshot.put("title", details.getTitle());
                detailSnapshot.put("errorType", details.getErrorType());
                detailSnapshot.put("appsmithErrorCode", details.getAppsmithErrorCode());
                detailSnapshot.put("appsmithErrorMessage", normalize(details.getAppsmithErrorMessage(), keepInstants));
                detailSnapshot.put("downstreamErrorCode", details.getDownstreamErrorCode());
                detailSnapshot.put(
                        "downstreamErrorMessage", normalize(details.getDownstreamErrorMessage(), keepInstants));
                snapshot.put("pluginErrorDetails", detailSnapshot);
            }
        }
        return snapshot;
    }

    /**
     * A JSON-ready copy of a value: maps with string keys, lists, strings with UUIDs masked, numbers and booleans as
     * they are, instants tagged with their type, and any other object as its class name and string form.
     */
    static Object normalize(Object value, boolean keepInstants) {
        if (value == null || value instanceof Number || value instanceof Boolean) {
            return value;
        }
        if (value instanceof String text) {
            return UUID.matcher(text).replaceAll("<uuid>");
        }
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> copy = new TreeMap<>();
            map.forEach((key, entry) -> copy.put(String.valueOf(key), normalize(entry, keepInstants)));
            return copy;
        }
        if (value instanceof Collection<?> collection) {
            List<Object> copy = new ArrayList<>();
            collection.forEach(entry -> copy.add(normalize(entry, keepInstants)));
            return copy;
        }
        if (value instanceof JsonNode node) {
            return normalize(MAPPER.convertValue(node, Object.class), keepInstants);
        }
        if (value instanceof Instant instant) {
            return keepInstants ? "Instant:" + instant : "Instant";
        }
        return value.getClass().getName() + ":" + value;
    }

    private static JsonNode toJson(Object snapshot) {
        try {
            return MAPPER.readTree(MAPPER.writeValueAsString(snapshot));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
