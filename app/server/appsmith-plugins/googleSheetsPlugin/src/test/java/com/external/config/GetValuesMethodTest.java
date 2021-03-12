package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Assert;
import org.junit.Test;

import java.util.Set;

public class GetValuesMethodTest {

    @Test
    public void testTransformResponse_missingJSON_throwsException() {
        ObjectMapper objectMapper = new ObjectMapper();

        GetValuesMethod getValuesMethod = new GetValuesMethod();
        try {
            getValuesMethod.transformResponse(null, objectMapper);
        } catch (AppsmithPluginException e) {
            Assert.assertTrue("Missing a valid response object.".equalsIgnoreCase(e.getMessage()));
        }
    }

    @Test
    public void testTransformResponse_missingValues_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"range\":\"Sheet1!A1:D5\",\"majorDimension\":\"ROWS\"}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        GetValuesMethod getValuesMethod = new GetValuesMethod();
        JsonNode result = getValuesMethod.transformResponse(jsonNode, objectMapper);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertEquals(0, result.size());
    }

    @Test
    public void testTransformResponse_singleRowJSON_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"range\":\"Sheet1!A1:D5\",\"majorDimension\":\"ROWS\",\"values\":[[\"Some\",\"123\",\"values\",\"to\"]]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        GetValuesMethod getValuesMethod = new GetValuesMethod();
        JsonNode result = getValuesMethod.transformResponse(jsonNode, objectMapper);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertEquals(0, result.size());
    }

    @Test
    public void testTransformResponse_emptyJSON_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"range\":\"Sheet1!A1:D5\",\"majorDimension\":\"ROWS\",\"values\":[]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        GetValuesMethod getValuesMethod = new GetValuesMethod();
        JsonNode result = getValuesMethod.transformResponse(jsonNode, objectMapper);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertEquals(0, result.size());
    }

    @Test
    public void testTransformResponse_emptyStartingRows_toListOfObjects() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"range\":\"Sheet1!A1:D5\",\"majorDimension\":\"ROWS\",\"values\":[[],[],[],[\"Some\",\"123\",\"values\",\"to\"],[\"work\",\"with\",\"and\",\"manipulate\"],[\"q\",\"w\",\"e\",\"r\"],[\"a\",\"s\",\"d\",\"f\"],[\"z\",\"x\",\"c\",\"v\"]]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        GetValuesMethod getValuesMethod = new GetValuesMethod();
        JsonNode result = getValuesMethod.transformResponse(jsonNode, objectMapper);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertTrue("work".equalsIgnoreCase(result.get(0).get("Some").asText()));
    }

    @Test
    public void testTransformResponse_emptyRows_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"range\":\"Sheet1!A1:D5\",\"majorDimension\":\"ROWS\",\"values\":[[],[],[]]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        GetValuesMethod getValuesMethod = new GetValuesMethod();
        JsonNode result = getValuesMethod.transformResponse(jsonNode, objectMapper);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertEquals(0, result.size());
    }

    @Test
    public void testTransformResponse_emptyStartingRowsWithSingleRow_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"range\":\"Sheet1!A1:D5\",\"majorDimension\":\"ROWS\",\"values\":[[],[],[],[\"Some\",\"123\",\"values\",\"to\"]]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        GetValuesMethod getValuesMethod = new GetValuesMethod();
        JsonNode result = getValuesMethod.transformResponse(jsonNode, objectMapper);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertEquals(0, result.size());
    }

    @Test
    public void testTransformResponse_validJSON_toListOfObjects() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        // Contains empty column values, empty column heading, full empty column, two repetitive column names,
        final String jsonString = "{\"range\":\"Sheet1!A1:D5\",\"majorDimension\":\"ROWS\",\"values\":[" +
                "[\"Repeat\",\"Repeat\",\"values\",\"Repeat\",\"\",\"Empty\",\"\"]," +
                "[\"work\",\"with\",\"and\",\"\",\"manipulate\",\"\",\"\"]," +
                "[\"q\",\"w\",\"e\",\"2\",\"r\",\"\",\"\"]" +
                "]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);
        Assert.assertTrue("Repeat".equalsIgnoreCase(jsonNode.get("values").get(0).get(0).asText()));

        GetValuesMethod getValuesMethod = new GetValuesMethod();
        JsonNode result = getValuesMethod.transformResponse(jsonNode, objectMapper);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Set<String> columnNames = Set.of("Repeat", "Repeat_1", "Repeat_2", "values", "Column-5");
        for (JsonNode row : result) {
            System.out.println(row);
            Assert.assertTrue(columnNames.stream().parallel().allMatch(row::has));
            Assert.assertFalse(row.has(""));
        }
    }

}
