package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.external.constants.GoogleSheets;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Assert;
import org.junit.Test;

import java.util.List;

public class GetStructureMethodTest {

    @Test
    public void testTransformResponse_missingJSON_throwsException() {
        ObjectMapper objectMapper = new ObjectMapper();

        GetStructureMethod getStructureMethod = new GetStructureMethod(objectMapper);
        try {
            JsonNode result = getStructureMethod.transformResponse(null, new MethodConfig(List.of()).toBuilder().tableHeaderIndex("1").build());
            Assert.assertFalse(result == null);
        } catch (AppsmithPluginException e) {
            Assert.assertTrue("Missing a valid response object.".equalsIgnoreCase(e.getMessage()));
        }
    }

    @Test
    public void testTransformResponse_missingValues_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"valueRanges\":[{}]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        GetStructureMethod getStructureMethod = new GetStructureMethod(objectMapper);
        JsonNode result = getStructureMethod.transformResponse(jsonNode, null);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertEquals(0, result.size());
    }

    @Test
    public void testTransformResponse_HeadersOnly_returnsValue() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"valueRanges\":[" +
                "{\"range\":\"Sheet1!A1:D1\"," +
                "\"majorDimension\":\"ROWS\"," +
                "\"values\":[[\"Name\",\"Actor\",\"Music\",\"Director\"]]}" +
                "]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        GetStructureMethod getStructureMethod = new GetStructureMethod(objectMapper);
        JsonNode result = getStructureMethod.transformResponse(jsonNode, new MethodConfig(List.of()).toBuilder().tableHeaderIndex("1").build());

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertEquals(1, result.size());
    }

    @Test
    public void testTransformResponse_emptyStartingRows_toListOfObjects() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"valueRanges\":[" +
                "{\"range\":\"Sheet1!A1:D1\"," +
                "\"majorDimension\":\"ROWS\"," +
                "\"values\":[[\"Name\",\"Actor\",\"Music\",\"Director\"]]}," +
                "{\"range\":\"Sheet1!A2:D2\"," +
                "\"majorDimension\":\"ROWS\"," +
                "\"values\":[[]]}" +
                "]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        GetStructureMethod getStructureMethod = new GetStructureMethod(objectMapper);
        JsonNode result = getStructureMethod.transformResponse(jsonNode, new MethodConfig(List.of()).toBuilder().tableHeaderIndex("1").build());

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray() && result.size() == 1);

        Assert.assertTrue("".equalsIgnoreCase(result.get(0).get("Name").asText()));
        Assert.assertTrue("".equalsIgnoreCase(result.get(0).get("Director").asText()));
    }

    @Test
    public void testTransformResponse_emptyRows_returnsIndices() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"valueRanges\":[" +
                "{\"range\":\"Sheet1!A1:D1\"," +
                "\"majorDimension\":\"ROWS\"," +
                "\"values\":[[\"Name\",\"Actor\",\"Music\",\"Director\"]]}," +
                "{\"range\":\"Sheet1!A2:D2\"," +
                "\"majorDimension\":\"ROWS\"," +
                "\"values\":[[]]}" +
                "]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        GetStructureMethod getStructureMethod = new GetStructureMethod(objectMapper);
        JsonNode result = getStructureMethod.transformResponse(jsonNode, new MethodConfig(List.of()).toBuilder().tableHeaderIndex("1").build());

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertEquals(1, result.size());
        Assert.assertEquals(0, result.get(0).get(GoogleSheets.ROW_INDEX).asInt());
    }

    @Test
    public void testTransformResponse_fetchNonEmptyRows() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"valueRanges\":[" +
                "{\"range\":\"Sheet1!A1:D2\"," +
                "\"majorDimension\":\"ROWS\"," +
                "\"values\":[[\"\",\"\",\"\",\"\"],[\"Name\",\"Actor\",\"Music\",\"Director\"]]}," +
                "{\"range\":\"Sheet1!A3:D3\"," +
                "\"majorDimension\":\"ROWS\"," +
                "\"values\":[[\"Bean\",\"Sean\",\"Dean\",\"Mean\"]]}" +
                "]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        GetStructureMethod getStructureMethod = new GetStructureMethod(objectMapper);
        JsonNode result = getStructureMethod.transformResponse(jsonNode, new MethodConfig(List.of()).toBuilder().tableHeaderIndex("1").build());

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertEquals(1, result.size());
    }


    @Test
    public void testTransformResponse_VerifyEndResult() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"valueRanges\":[" +
                "{\"range\":\"Sheet1!A1:D1\"," +
                "\"majorDimension\":\"ROWS\"," +
                "\"values\":[[\"Name\",\"Actor\",\"Music\",\"Director\"]]}," +
                "{\"range\":\"Sheet1!A2:D2\"," +
                "\"majorDimension\":\"ROWS\"," +
                "\"values\":[[\"Luke\",\"Make\",\"Duke\",\"Cake\"]]}" +
                "]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        GetStructureMethod getStructureMethod = new GetStructureMethod(objectMapper);
        JsonNode result = getStructureMethod.transformResponse(jsonNode, new MethodConfig(List.of()).toBuilder().tableHeaderIndex("1").build());

        Assert.assertNotNull(result);
        Assert.assertEquals(result.toString(), "[{\"Name\":\"Luke\",\"Actor\":\"Make\",\"Music\":\"Duke\",\"Director\":\"Cake\",\"rowIndex\":\"0\"}]");

    }


}
