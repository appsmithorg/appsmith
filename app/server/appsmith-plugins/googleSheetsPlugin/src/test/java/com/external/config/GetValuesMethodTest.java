package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Assert;
import org.junit.Test;

public class GetValuesMethodTest {

    @Test(expected = AppsmithPluginException.class)
    public void testTransformResponse_missingJSON_throwsException() {
        ObjectMapper objectMapper = new ObjectMapper();

        GetValuesMethod getValuesMethod = new GetValuesMethod();
        getValuesMethod.transformResponse(null, objectMapper);
    }

    @Test(expected = AppsmithPluginException.class)
    public void testTransformResponse_missingValues_throwsException() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"range\":\"Sheet1!A1:D5\",\"majorDimension\":\"ROWS\"}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        GetValuesMethod getValuesMethod = new GetValuesMethod();
        getValuesMethod.transformResponse(jsonNode, objectMapper);
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
    public void testTransformResponse_validJSON_toListOfObjects() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"range\":\"Sheet1!A1:D5\",\"majorDimension\":\"ROWS\",\"values\":[[\"Some\",\"123\",\"values\",\"to\"],[\"work\",\"with\",\"and\",\"manipulate\"],[\"q\",\"w\",\"e\",\"r\"],[\"a\",\"s\",\"d\",\"f\"],[\"z\",\"x\",\"c\",\"v\"]]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);
        Assert.assertTrue("Some".equalsIgnoreCase(jsonNode.get("values").get(0).get(0).asText()));

        GetValuesMethod getValuesMethod = new GetValuesMethod();
        JsonNode result = getValuesMethod.transformResponse(jsonNode, objectMapper);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertTrue("work".equalsIgnoreCase(result.get(0).get("Some").asText()));
    }

}
