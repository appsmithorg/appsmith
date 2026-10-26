package com.external.plugins;

import com.appsmith.external.constants.DataType;
import com.appsmith.external.datatypes.ClientDataType;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Param;
import io.micrometer.observation.ObservationRegistry;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.external.plugins.constants.FieldName.BODY;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;

/**
 * Unit tests for the smart-substitution sanitizers in the Mongo plugin. These tests do not need a database.
 */
class MongoPluginSmartSubstitutionTest {

    private final MongoPlugin.MongoPluginExecutor pluginExecutor =
            new MongoPlugin.MongoPluginExecutor(ObservationRegistry.NOOP);

    private String sanitize(String value) {
        return pluginExecutor.sanitizeReplacement(value, DataType.BSON_SPECIAL_DATA_TYPES);
    }

    @Test
    void should_unwrapObjectId_when_argumentIsQuoted() {
        // Given
        String singleQuoted = "\"ObjectId('507f1f77bcf86cd799439011')\"";
        String escapedDoubleQuoted = "\"ObjectId(\\\"507f1f77bcf86cd799439011\\\")\"";
        // Shape produced when an array element that contains escaped quotes is re-serialized as BSON.
        String reserialized = "\"ObjectId(\\\\\"507f1f77bcf86cd799439011\\\\\")\"";

        // When / Then
        assertThat(sanitize(singleQuoted)).isEqualTo("ObjectId(\"507f1f77bcf86cd799439011\")");
        assertThat(sanitize(escapedDoubleQuoted)).isEqualTo("ObjectId(\"507f1f77bcf86cd799439011\")");
        assertThat(sanitize(reserialized)).isEqualTo("ObjectId(\"507f1f77bcf86cd799439011\")");
    }

    @Test
    void should_unwrapEveryOccurrence_when_valueIsAnArray() {
        // Given
        String array = "[\"ObjectId('507f1f77bcf86cd799439011')\", \"ObjectId('507f1f77bcf86cd799439012')\"]";

        // When
        String result = sanitize(array);

        // Then
        assertThat(result)
                .isEqualTo("[ObjectId(\"507f1f77bcf86cd799439011\"), ObjectId(\"507f1f77bcf86cd799439012\")]");
    }

    @Test
    void should_unwrapOtherSpecialTypes_when_argumentIsQuoted() {
        // Given / When / Then
        assertThat(sanitize("\"ISODate('1970-01-01T00:00:00.000Z')\""))
                .isEqualTo("ISODate(\"1970-01-01T00:00:00.000Z\")");
        assertThat(sanitize("\"NumberLong(9000000000000000000)\"")).isEqualTo("NumberLong(\"9000000000000000000\")");
        assertThat(sanitize("\"NumberDecimal(\\\"123456.789012\\\")\"")).isEqualTo("NumberDecimal(\"123456.789012\")");
        // Timestamp arguments are not quoted.
        assertThat(sanitize("\"Timestamp(1421006159, 4)\"")).isEqualTo("Timestamp(1421006159, 4)");
    }

    @Test
    void should_keepCompleteArgument_when_itContainsSignsOrExponents() {
        // Given / When / Then
        assertThat(sanitize("\"NumberDecimal(\\\"4E+9\\\")\"")).isEqualTo("NumberDecimal(\"4E+9\")");
        assertThat(sanitize("\"NumberDecimal('-1.5E-3')\"")).isEqualTo("NumberDecimal(\"-1.5E-3\")");
        assertThat(sanitize("\"NumberDecimal('+4.5')\"")).isEqualTo("NumberDecimal(\"+4.5\")");
        assertThat(sanitize("\"NumberDecimal('Infinity')\"")).isEqualTo("NumberDecimal(\"Infinity\")");
        assertThat(sanitize("\"NumberDecimal('NaN')\"")).isEqualTo("NumberDecimal(\"NaN\")");
    }

    @Test
    void should_leaveValueUnchanged_when_itHasNoSpecialType() {
        // Given / When / Then
        assertThat(sanitize("\"plain string\"")).isEqualTo("\"plain string\"");
        assertThat(sanitize("\"ObjectId\"")).isEqualTo("\"ObjectId\"");
        assertThat(sanitize("ObjectId('abc')")).isEqualTo("ObjectId('abc')");
    }

    @Test
    void should_leaveValueUnchanged_when_specialTypeHasNoArgument() {
        // Given / When / Then
        assertThat(sanitize("\"ObjectId()\"")).isEqualTo("\"ObjectId()\"");
        assertThat(sanitize("\"ObjectId('')\"")).isEqualTo("\"ObjectId('')\"");
    }

    @Test
    void should_leaveUnrelatedText_when_itRepeatsAnArgument() {
        // Given
        String array = "[\"ObjectId('abc123')\", \"x'abc123'y\"]";

        // When
        String result = sanitize(array);

        // Then
        assertThat(result).isEqualTo("[ObjectId(\"abc123\"), \"x'abc123'y\"]");
    }

    @Test
    void should_finishQuickly_when_valueHasThousandsOfDistinctSpecialTypes() {
        // Given
        int count = 32000;
        String array = IntStream.range(0, count)
                .mapToObj(i -> "\"ObjectId('" + String.format("%024x", i) + "')\"")
                .collect(Collectors.joining(", ", "[", "]"));

        // When
        String result = assertTimeoutPreemptively(Duration.ofSeconds(5), () -> sanitize(array));

        // Then
        assertThat(result).doesNotContain("\"ObjectId(");
        assertThat(result.split("ObjectId\\(\"", -1)).hasSize(count + 1);
        assertThat(result)
                .startsWith("[ObjectId(\"000000000000000000000000\"), ObjectId(\"000000000000000000000001\")");
    }

    @Test
    void should_finishQuickly_when_specialTypeIsUnterminated() {
        // Given
        String unterminated = "\"ObjectId(" + "a".repeat(4000);

        // When
        String result = assertTimeoutPreemptively(Duration.ofSeconds(5), () -> sanitize(unterminated));

        // Then
        assertThat(result).isEqualTo(unterminated);
    }

    @Test
    void should_finishQuickly_when_rawBodyIsLarge() {
        // Given
        StringBuilder documents = new StringBuilder("[");
        for (int i = 0; i < 5000; i++) {
            if (i > 0) {
                documents.append(",");
            }
            documents
                    .append("{\"name\":\"user")
                    .append(i)
                    .append("\",\"email\":\"user")
                    .append(i)
                    .append("@example.com\",\"note\":\"")
                    .append("x".repeat(150))
                    .append("\"}");
        }
        documents.append("]");

        Param documentsParam = new Param("Input1.text", documents.toString());
        documentsParam.setClientDataType(ClientDataType.ARRAY);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setParams(List.of(documentsParam));

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(configMap, BODY, "{ \"insert\": \"users\", \"documents\": {{Input1.text}} }");
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(configMap);

        // When / Then
        // No Mongo client is needed: smart substitution runs before the client is used, and the null client then
        // fails with StaleConnectionException. That exception proves substitution completed; the timeout bounds it.
        assertTimeoutPreemptively(Duration.ofSeconds(20), () -> assertThatThrownBy(
                        () -> Mono.defer(() -> pluginExecutor.executeParameterized(
                                        null, executeActionDTO, new DatasourceConfiguration(), actionConfiguration))
                                .block())
                .isInstanceOf(StaleConnectionException.class));
    }
}
