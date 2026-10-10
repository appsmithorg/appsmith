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

import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.external.plugins.constants.FieldName.BODY;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;

/**
 * Unit tests for the smart-substitution sanitizers in the Mongo plugin. These tests do not need a database.
 */
public class MongoPluginSmartSubstitutionTest {

    private final MongoPlugin.MongoPluginExecutor pluginExecutor =
            new MongoPlugin.MongoPluginExecutor(ObservationRegistry.NOOP);

    private String sanitize(String value) {
        return pluginExecutor.sanitizeReplacement(value, DataType.BSON_SPECIAL_DATA_TYPES);
    }

    @Test
    public void testObjectIdInsideQuotesIsUnwrapped() {
        assertEquals("ObjectId(\"507f1f77bcf86cd799439011\")", sanitize("\"ObjectId('507f1f77bcf86cd799439011')\""));
        assertEquals(
                "ObjectId(\"507f1f77bcf86cd799439011\")", sanitize("\"ObjectId(\\\"507f1f77bcf86cd799439011\\\")\""));
        // Shape produced when an array element that contains escaped quotes is re-serialized as BSON.
        assertEquals(
                "ObjectId(\"507f1f77bcf86cd799439011\")",
                sanitize("\"ObjectId(\\\\\"507f1f77bcf86cd799439011\\\\\")\""));
    }

    @Test
    public void testEverySpecialTypeOccurrenceInAnArrayIsUnwrapped() {
        assertEquals(
                "[ObjectId(\"507f1f77bcf86cd799439011\"), ObjectId(\"507f1f77bcf86cd799439012\")]",
                sanitize("[\"ObjectId('507f1f77bcf86cd799439011')\", \"ObjectId('507f1f77bcf86cd799439012')\"]"));
    }

    @Test
    public void testOtherSpecialTypesInsideQuotesAreUnwrapped() {
        assertEquals("ISODate(\"1970-01-01T00:00:00.000Z\")", sanitize("\"ISODate('1970-01-01T00:00:00.000Z')\""));
        assertEquals("NumberLong(\"9000000000000000000\")", sanitize("\"NumberLong(9000000000000000000)\""));
        assertEquals("NumberDecimal(\"123456.789012\")", sanitize("\"NumberDecimal(\\\"123456.789012\\\")\""));
        // Timestamp arguments are not quoted.
        assertEquals("Timestamp(1421006159, 4)", sanitize("\"Timestamp(1421006159, 4)\""));
    }

    @Test
    public void testValuesWithoutSpecialTypesAreUnchanged() {
        assertEquals("\"plain string\"", sanitize("\"plain string\""));
        assertEquals("\"ObjectId\"", sanitize("\"ObjectId\""));
        assertEquals("ObjectId('abc')", sanitize("ObjectId('abc')"));
    }

    @Test
    public void testSpecialTypeWithoutArgumentIsUnchanged() {
        assertEquals("\"ObjectId()\"", sanitize("\"ObjectId()\""));
        assertEquals("\"ObjectId('')\"", sanitize("\"ObjectId('')\""));
    }

    @Test
    public void testUnterminatedSpecialTypeIsSanitizedInLinearTime() {
        final String unterminated = "\"ObjectId(" + "a".repeat(4000);
        final String result = assertTimeoutPreemptively(Duration.ofSeconds(5), () -> sanitize(unterminated));
        assertEquals(unterminated, result);
    }

    @Test
    public void testLargeRawBodyIsSubstitutedInLinearTime() {
        final StringBuilder documents = new StringBuilder("[");
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

        final Param documentsParam = new Param("Input1.text", documents.toString());
        documentsParam.setClientDataType(ClientDataType.ARRAY);

        final ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setParams(List.of(documentsParam));

        final Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(configMap, BODY, "{ \"insert\": \"users\", \"documents\": {{Input1.text}} }");
        final ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(configMap);

        // No Mongo client is needed: smart substitution runs before the client is used, and the null client then
        // fails with StaleConnectionException. That exception proves substitution completed; the timeout bounds it.
        assertTimeoutPreemptively(
                Duration.ofSeconds(20),
                () -> assertThrows(
                        StaleConnectionException.class, () -> Mono.defer(() -> pluginExecutor.executeParameterized(
                                        null, executeActionDTO, new DatasourceConfiguration(), actionConfiguration))
                                .block()));
    }
}
