package com.external.plugins;

import com.appsmith.external.constants.DataType;
import com.appsmith.external.datatypes.ClientDataType;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Param;
import io.micrometer.observation.ObservationRegistry;
import org.bson.BsonTimestamp;
import org.bson.Document;
import org.bson.types.Decimal128;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.appsmith.external.helpers.PluginUtils.getDataValueSafelyFromFormData;
import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.external.plugins.constants.FieldName.BODY;
import static com.external.plugins.constants.FieldName.COLLECTION;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.FIND_QUERY;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;

/**
 * Unit tests for the smart-substitution sanitizers in the Mongo plugin. These tests do not need a database.
 */
class MongoPluginSmartSubstitutionTest {

    private final MongoPlugin.MongoPluginExecutor pluginExecutor =
            new MongoPlugin.MongoPluginExecutor(ObservationRegistry.NOOP);

    private static final String OBJECT_ID = "507f1f77bcf86cd799439011";

    /**
     * Runs smart substitution for one binding in the value position of a find filter and returns the filter that
     * the plugin would send. No Mongo client is needed: the null client fails with StaleConnectionException after
     * substitution, and the substituted query is read back from the form data.
     */
    private Document substituteIntoFilter(String value, ClientDataType clientDataType) {
        return substituteIntoFilter("{ \"name\": {{Input1.text}} }", value, clientDataType);
    }

    private Document substituteIntoFilter(String filter, String value, ClientDataType clientDataType) {
        Param param = new Param("Input1.text", value);
        param.setClientDataType(clientDataType);
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setParams(new ArrayList<>(List.of(param)));

        Map<String, Object> formData = new HashMap<>();
        setDataValueSafelyInFormData(formData, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(formData, COMMAND, "RAW");
        setDataValueSafelyInFormData(formData, BODY, "{ \"find\": \"users\", \"filter\": " + filter + " }");
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(formData);

        assertThatThrownBy(() -> Mono.defer(() -> pluginExecutor.executeParameterized(
                                null, executeActionDTO, new DatasourceConfiguration(), actionConfiguration))
                        .block())
                .isInstanceOf(StaleConnectionException.class);

        String substitutedQuery = getDataValueSafelyFromFormData(formData, BODY, STRING_TYPE);
        assertThatCode(() -> Document.parse(substitutedQuery))
                .as("substituted query parses: %s", substitutedQuery)
                .doesNotThrowAnyException();
        Document command = Document.parse(substitutedQuery);
        assertThat(command.keySet()).containsExactly("find", "filter");
        return command.get("filter", Document.class);
    }

    static Stream<String> stringsThatContainSpecialTypeText() {
        return Stream.of(
                "note \"ObjectId('" + OBJECT_ID + "')\" end",
                "\"ObjectId('" + OBJECT_ID + "')\" trailing text",
                "leading text \"ObjectId('" + OBJECT_ID + "')\"",
                "leading text \"ObjectId(" + OBJECT_ID + ")",
                "note \"ISODate('1970-01-01T00:00:00.000Z')\" end",
                "note \"NumberLong(9000000000000000000)\" end",
                "note \"NumberDecimal('123456.789012')\" end",
                "note \"Timestamp(1421006159, 4)\" end",
                "leading text \\\"Timestamp(1421006159, 4)",
                "ObjectId(" + OBJECT_ID + ") trailing text",
                "leading text ObjectId(" + OBJECT_ID + ")");
    }

    @ParameterizedTest
    @MethodSource("stringsThatContainSpecialTypeText")
    @DisplayName("GHSA-gcgj-p6xv-xpcp")
    void should_keepBoundStringAsOneStringValue_when_itContainsSpecialTypeText(String value) {
        // Given / When
        Document filter = substituteIntoFilter(value, ClientDataType.STRING);

        // Then
        assertThat(filter.keySet()).containsExactly("name");
        assertThat(filter.get("name")).isEqualTo(value);
    }

    @Test
    @DisplayName("GHSA-gcgj-p6xv-xpcp")
    void should_keepStringMemberAsString_when_memberIsNotACompleteLiteral() {
        // Given
        String endsWithLiteral = "leading text \"ObjectId('" + OBJECT_ID + "')";
        String containsLiteral = "note \"ObjectId('" + OBJECT_ID + "')\" end";
        String array = "[\"plain\", \"leading text \\\"ObjectId('" + OBJECT_ID + "')\", \"note \\\"ObjectId('"
                + OBJECT_ID + "')\\\" end\"]";
        String object = "{\"first\": \"leading text \\\"ObjectId('" + OBJECT_ID + "')\", \"second\": \"plain\"}";

        // When
        Document arrayFilter = substituteIntoFilter(array, ClientDataType.ARRAY);
        Document objectFilter = substituteIntoFilter(object, ClientDataType.OBJECT);

        // Then
        assertThat(arrayFilter.getList("name", Object.class))
                .containsExactly("plain", endsWithLiteral, containsLiteral);
        Document boundObject = objectFilter.get("name", Document.class);
        assertThat(boundObject.keySet()).containsExactlyInAnyOrder("first", "second");
        assertThat(boundObject.get("first")).isEqualTo(endsWithLiteral);
        assertThat(boundObject.get("second")).isEqualTo("plain");
    }

    @Test
    @DisplayName("GHSA-gcgj-p6xv-xpcp")
    void should_keepTimestampTextAsString_when_argumentIsNotTwoIntegers() {
        // Given
        String value = "Timestamp(first, second)";

        // When
        Document filter = substituteIntoFilter(value, ClientDataType.STRING);

        // Then
        assertThat(filter.get("name")).isEqualTo(value);
    }

    @Test
    @DisplayName("GHSA-gcgj-p6xv-xpcp")
    void should_keepBoundStringAsOneStringValue_when_itContainsRegexOperatorText() {
        // Given
        String value = "see { $regex: 5 } for details";

        // When
        Document filter = substituteIntoFilter(value, ClientDataType.STRING);

        // Then
        assertThat(filter.keySet()).containsExactly("name");
        assertThat(filter.get("name")).isEqualTo(value);
    }

    static Stream<String> stringsThatContainRegexOperatorText() {
        return Stream.of(
                "{ $regex: 5 }",
                "{ $regex: 5 } at the start",
                "at the end { $regex: 5 }",
                "after a backslash \\{ $regex: 5 }",
                "after a quote \"{ $regex: 5 }",
                "{ $regex: 5, $options: 7 }");
    }

    @ParameterizedTest
    @MethodSource("stringsThatContainRegexOperatorText")
    @DisplayName("GHSA-gcgj-p6xv-xpcp")
    void should_keepBoundStringUnchanged_when_queryAlsoHasRegexArgument(String value) {
        // Given
        String filter = "{ \"code\": { $regex: 5 }, \"name\": {{Input1.text}} }";

        // When
        Document substituted = substituteIntoFilter(filter, value, ClientDataType.STRING);

        // Then
        assertThat(substituted.keySet()).containsExactly("code", "name");
        assertThat(substituted.get("code", Document.class).get("$regex")).isEqualTo("5");
        assertThat(substituted.get("name")).isEqualTo(value);
    }

    static Stream<String> stringsThatLookLikeArraysOrObjects() {
        return Stream.of(
                "[\"first\", \"second\"]",
                "{\"first\": \"second\"}",
                "[\"ObjectId('" + OBJECT_ID + "')\"]",
                "{\"first\": \"ObjectId('" + OBJECT_ID + "')\"}");
    }

    @ParameterizedTest
    @MethodSource("stringsThatLookLikeArraysOrObjects")
    @DisplayName("GHSA-gcgj-p6xv-xpcp")
    void should_keepBoundStringAsOneStringValue_when_itLooksLikeAnArrayOrObject(String value) {
        // Given / When
        Document filter = substituteIntoFilter(value, ClientDataType.STRING);

        // Then
        assertThat(filter.keySet()).containsExactly("name");
        assertThat(filter.get("name")).isEqualTo(value);
    }

    @Test
    @DisplayName("GHSA-gcgj-p6xv-xpcp")
    void should_convertOnlyCompleteLiterals_when_objectHasNestedMembers() {
        // Given
        String incomplete = "leading text \"ObjectId('" + OBJECT_ID + "')";
        String object =
                "{\"outer\": {\"id\": \"ObjectId('" + OBJECT_ID + "')\", \"note\": \"leading text \\\"ObjectId('"
                        + OBJECT_ID + "')\", \"count\": 3, \"missing\": null}}";

        // When
        Document filter = substituteIntoFilter(object, ClientDataType.OBJECT);

        // Then
        Document outer = filter.get("name", Document.class).get("outer", Document.class);
        assertThat(outer.keySet()).containsExactlyInAnyOrder("id", "note", "count", "missing");
        assertThat(outer.get("id")).isEqualTo(new ObjectId(OBJECT_ID));
        assertThat(outer.get("note")).isEqualTo(incomplete);
        assertThat(outer.get("count")).isEqualTo(3);
        assertThat(outer.get("missing")).isNull();
    }

    @ParameterizedTest
    @ValueSource(
            strings = {"Timestamp(4294967296, 1)", "Timestamp(1, 4294967296)", "Timestamp(99999999999999999999, 1)"})
    @DisplayName("GHSA-gcgj-p6xv-xpcp")
    void should_keepTimestampTextAsString_when_argumentIsOutOfRange(String value) {
        // Given / When
        Document filter = substituteIntoFilter(value, ClientDataType.STRING);

        // Then
        assertThat(filter.get("name")).isEqualTo(value);
    }

    @Test
    void should_writeTimestamp_when_argumentIsAtTheUpperBound() {
        // Given / When
        Document filter = substituteIntoFilter("Timestamp(2147483647, 2147483647)", ClientDataType.STRING);

        // Then
        assertThat(filter.get("name")).isEqualTo(new BsonTimestamp(2147483647, 2147483647));
    }

    @Test
    @DisplayName("GHSA-gcgj-p6xv-xpcp")
    void should_keepBoundStringAsOneStringValue_when_commandIsAFormFind() {
        // Given
        String value = "note \"ObjectId('" + OBJECT_ID + "')\" end";
        Param param = new Param("Input1.text", value);
        param.setClientDataType(ClientDataType.STRING);
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setParams(new ArrayList<>(List.of(param)));

        Map<String, Object> formData = new HashMap<>();
        setDataValueSafelyInFormData(formData, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(formData, COMMAND, "FIND");
        setDataValueSafelyInFormData(formData, COLLECTION, "users");
        setDataValueSafelyInFormData(formData, FIND_QUERY, "{ \"name\": \"{{Input1.text}}\" }");
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(formData);

        // When
        assertThatThrownBy(() -> Mono.defer(() -> pluginExecutor.executeParameterized(
                                null, executeActionDTO, new DatasourceConfiguration(), actionConfiguration))
                        .block())
                .isInstanceOf(StaleConnectionException.class);

        // Then
        Document command = Document.parse(getDataValueSafelyFromFormData(formData, BODY, STRING_TYPE));
        Document filter = command.get("filter", Document.class);
        assertThat(filter.keySet()).containsExactly("name");
        assertThat(filter.get("name")).isEqualTo(value);
    }

    static Stream<Arguments> completeSpecialTypeLiterals() {
        return Stream.of(
                Arguments.of("ObjectId('" + OBJECT_ID + "')", new ObjectId(OBJECT_ID)),
                Arguments.of("ObjectId(\"" + OBJECT_ID + "\")", new ObjectId(OBJECT_ID)),
                Arguments.of("\"ObjectId('" + OBJECT_ID + "')\"", new ObjectId(OBJECT_ID)),
                Arguments.of("ISODate('1970-01-01T00:00:00.000Z')", new Date(0)),
                Arguments.of("\"NumberLong(9000000000000000000)\"", 9000000000000000000L),
                Arguments.of("NumberDecimal('123456.789012')", Decimal128.parse("123456.789012")),
                Arguments.of("\"Timestamp(1421006159, 4)\"", new BsonTimestamp(1421006159, 4)));
    }

    @ParameterizedTest
    @MethodSource("completeSpecialTypeLiterals")
    void should_writeSpecialType_when_completeBoundValueIsOneLiteral(String value, Object expected) {
        // Given / When
        Document filter = substituteIntoFilter(value, ClientDataType.STRING);

        // Then
        assertThat(filter.get("name")).isEqualTo(expected);
    }

    @Test
    void should_writeSpecialTypeMembers_when_arrayMembersAreCompleteLiterals() {
        // Given
        String array = "[\"ObjectId('" + OBJECT_ID + "')\", \"plain\", \"Timestamp(1421006159, 4)\"]";

        // When
        Document withDataType = substituteIntoFilter(array, ClientDataType.ARRAY);
        Document withoutDataType = substituteIntoFilter(array, null);

        // Then
        assertThat(withDataType.getList("name", Object.class))
                .containsExactly(new ObjectId(OBJECT_ID), "plain", new BsonTimestamp(1421006159, 4));
        assertThat(withoutDataType.getList("name", Object.class))
                .containsExactly(new ObjectId(OBJECT_ID), "plain", new BsonTimestamp(1421006159, 4));
    }

    private String sanitize(String value) {
        return pluginExecutor.sanitizeReplacement(value, DataType.BSON);
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
