package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.external.constants.ErrorMessages;
import com.external.constants.FieldName;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class RowsGetMethodTest {

    @Test
    public void testTransformResponse_missingJSON_throwsException() {
        ObjectMapper objectMapper = new ObjectMapper();

        RowsGetMethod rowsGetMethod = new RowsGetMethod(objectMapper);
        try {
            rowsGetMethod.transformExecutionResponse(null, null);
        } catch (AppsmithPluginException e) {
            assertTrue(ErrorMessages.MISSING_VALID_RESPONSE_ERROR_MSG.equalsIgnoreCase(e.getMessage()));
        }
    }

    @Test
    public void testTransformResponse_missingValues_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"valueRanges\":[{},{}]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        assertNotNull(jsonNode);

        RowsGetMethod rowsGetMethod = new RowsGetMethod(objectMapper);
        JsonNode result = rowsGetMethod.transformExecutionResponse(jsonNode, null);

        assertNotNull(result);
        assertTrue(result.isArray());
        assertEquals(0, result.size());
    }

    @Test
    public void testTransformResponse_singleRowJSON_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"valueRanges\":[" +
                "{\"values\":[\"abc\"]},{}" +
                "]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        assertNotNull(jsonNode);

        RowsGetMethod rowsGetMethod = new RowsGetMethod(objectMapper);
        JsonNode result = rowsGetMethod.transformExecutionResponse(jsonNode, null);

        assertNotNull(result);
        assertTrue(result.isArray());
        assertEquals(0, result.size());
    }

    @Test
    public void testTransformResponse_emptyJSON_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"valueRanges\":[" +
                "{\"values\":[]},{\"values\":[]}" +
                "]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        assertNotNull(jsonNode);

        RowsGetMethod rowsGetMethod = new RowsGetMethod(objectMapper);
        JsonNode result = rowsGetMethod.transformExecutionResponse(jsonNode, null);

        assertNotNull(result);
        assertTrue(result.isArray());
        assertEquals(0, result.size());
    }

    @Test
    public void testTransformResponse_emptyStartingRows_toListOfObjects() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"valueRanges\":[" +
                "{\"range\":\"Sheet1!A1:D1\"," +
                "\"majorDimension\":\"ROWS\"," +
                "\"values\":[[\"Some\",\"123\",\"values\",\"to\"]]}," +
                "{\"range\":\"Sheet1!A2:D6\"," +
                "\"majorDimension\":\"ROWS\"," +
                "\"values\":[[],[],[],[\"Some\",\"123\",\"values\",\"to\"],[\"work\",\"with\",\"and\",\"manipulate\"],[\"q\",\"w\",\"e\",\"r\"],[\"a\",\"s\",\"d\",\"f\"],[\"z\",\"x\",\"c\",\"v\"]]}" +
                "]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        assertNotNull(jsonNode);

        RowsGetMethod rowsGetMethod = new RowsGetMethod(objectMapper);
        JsonNode result = rowsGetMethod.transformExecutionResponse(jsonNode, new MethodConfig(Map.of()).toBuilder().tableHeaderIndex("1").build());

        assertNotNull(result);
        assertTrue(result.isArray() && result.size() == 8);

        assertTrue("".equalsIgnoreCase(result.get(0).get("Some").asText()));
        assertTrue("Some".equalsIgnoreCase(result.get(3).get("Some").asText()));
    }

    @Test
    public void testTransformResponse_emptyRows_returnsIndices() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"valueRanges\":[" +
                "{\"range\":\"Sheet1!A1:D1\"," +
                "\"majorDimension\":\"ROWS\"," +
                "\"values\":[[\"Some\",\"123\",\"values\",\"to\"]]}," +
                "{\"range\":\"Sheet1!A2:D6\"," +
                "\"majorDimension\":\"ROWS\"," +
                "\"values\":[[],[],[]]}" +
                "]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        assertNotNull(jsonNode);

        RowsGetMethod rowsGetMethod = new RowsGetMethod(objectMapper);
        JsonNode result = rowsGetMethod.transformExecutionResponse(jsonNode, new MethodConfig(Map.of()).toBuilder().tableHeaderIndex("1").build());

        assertNotNull(result);
        assertTrue(result.isArray());
        assertEquals(3, result.size());
        assertEquals(0, result.get(0).get(FieldName.ROW_INDEX).asInt());
    }

    @Test
    public void transformResponse() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"valueRanges\":\n" +
                "[ {\n" +
                "  \"range\" : \"Sheet1!A1:Z1\",\n" +
                "  \"majorDimension\" : \"ROWS\",\n" +
                "  \"values\" : [ [ \"The timeline includes other auxillary functions each team will need to perform such as supporting the community with feature requests, fixing bugs, clearing tech debt, improving performance, re-architecting parts of the codebase, writing documentation, etc.\" ] ]\n" +
                "}, {\n" +
                "  \"range\" : \"Sheet1!A2:Z4\",\n" +
                "  \"majorDimension\" : \"ROWS\",\n" +
                "  \"values\" : [ [ \"Quarter\", \"Projects\", \"Teams\", \"Frontend\", \"Backend\", \"QA\" ], [ \"\", \"Add 15 Widgets\", \"Widget Team\", \"0\", \"0\" ], [ \"\", \"Add 20 SAAS Integrations\", \"Integrations\", \"1\", \"1\", \"\", \"1\" ] ]\n" +
                "} ]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        assertNotNull(jsonNode);

        RowsGetMethod rowsGetMethod = new RowsGetMethod(objectMapper);
        JsonNode result = rowsGetMethod.transformExecutionResponse(jsonNode, new MethodConfig(Map.of()).toBuilder().tableHeaderIndex("1").build());

        assertNotNull(result);
        assertTrue(result.isArray());
        assertEquals(3, result.size());
        assertEquals(0, result.get(0).get(FieldName.ROW_INDEX).asInt());
    }
}
