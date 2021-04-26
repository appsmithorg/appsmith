package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Assert;
import org.junit.Test;

public class ListSheetsMethodTest {

    @Test(expected = AppsmithPluginException.class)
    public void testTransformResponse_missingJSON_throwsException() {
        ObjectMapper objectMapper = new ObjectMapper();

        ListSheetsMethod listSheetsMethod = new ListSheetsMethod(objectMapper);
        listSheetsMethod.transformResponse(null, null);
    }

    @Test
    public void testTransformResponse_missingFiles_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"key1\":\"value1\",\"key2\":\"value2\"}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        ListSheetsMethod listSheetsMethod = new ListSheetsMethod(objectMapper);
        JsonNode result = listSheetsMethod.transformResponse(jsonNode, null);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertEquals(0, result.size());
    }

    @Test
    public void testTransformResponse_emptyFiles_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"key1\":\"value1\",\"files\":[]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        ListSheetsMethod listSheetsMethod = new ListSheetsMethod(objectMapper);
        JsonNode result = listSheetsMethod.transformResponse(jsonNode, null);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertEquals(0, result.size());
    }

    @Test
    public void testTransformResponse_validFiles_toListOfFiles() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"key1\":\"value1\",\"files\":[{\"id\":\"1\", \"name\":\"test\"}]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        ListSheetsMethod listSheetsMethod = new ListSheetsMethod(objectMapper);
        JsonNode result = listSheetsMethod.transformResponse(jsonNode, null);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertTrue("Test".equalsIgnoreCase(result.get(0).get("name").asText()));
    }
}
