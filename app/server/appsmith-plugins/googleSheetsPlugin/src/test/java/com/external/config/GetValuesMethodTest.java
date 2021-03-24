package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Assert;
import org.junit.Test;

import java.util.List;
import java.util.Set;

public class GetValuesMethodTest {

    @Test
    public void testTransformResponse_missingJSON_throwsException() {
        ObjectMapper objectMapper = new ObjectMapper();

        GetValuesMethod getValuesMethod = new GetValuesMethod(objectMapper);
        try {
            getValuesMethod.transformResponse(null, null);
        } catch (AppsmithPluginException e) {
            Assert.assertTrue("Missing a valid response object.".equalsIgnoreCase(e.getMessage()));
        }
    }

    @Test
    public void testTransformResponse_missingValues_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"valueRanges\":[{},{}]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        GetValuesMethod getValuesMethod = new GetValuesMethod(objectMapper);
        JsonNode result = getValuesMethod.transformResponse(jsonNode, null);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertEquals(0, result.size());
    }

    @Test
    public void testTransformResponse_singleRowJSON_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"valueRanges\":[" +
                "{\"values\":[\"abc\"]},{}" +
                "]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        GetValuesMethod getValuesMethod = new GetValuesMethod(objectMapper);
        JsonNode result = getValuesMethod.transformResponse(jsonNode, null);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertEquals(0, result.size());
    }

    @Test
    public void testTransformResponse_emptyJSON_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"valueRanges\":[" +
                "{\"values\":[]},{\"values\":[]}" +
                "]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        GetValuesMethod getValuesMethod = new GetValuesMethod(objectMapper);
        JsonNode result = getValuesMethod.transformResponse(jsonNode, null);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertEquals(0, result.size());
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

        Assert.assertNotNull(jsonNode);

        GetValuesMethod getValuesMethod = new GetValuesMethod(objectMapper);
        JsonNode result = getValuesMethod.transformResponse(jsonNode, new MethodConfig(List.of()).toBuilder().tableHeaderIndex("1").build());

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray() && result.size() == 8);
        System.out.println(result);
        Assert.assertNull(result.get(0).get("Some"));
        Assert.assertTrue("Some".equalsIgnoreCase(result.get(3).get("Some").asText()));
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

        Assert.assertNotNull(jsonNode);

        GetValuesMethod getValuesMethod = new GetValuesMethod(objectMapper);
        JsonNode result = getValuesMethod.transformResponse(jsonNode, new MethodConfig(List.of()).toBuilder().tableHeaderIndex("1").build());

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertEquals(3, result.size());
        Assert.assertEquals(1, result.get(0).get("index").asInt());
    }

}
