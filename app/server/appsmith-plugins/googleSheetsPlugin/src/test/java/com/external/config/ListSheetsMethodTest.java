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

        ListSheetsMethod listSheetsMethod = new ListSheetsMethod();
        listSheetsMethod.transformResponse(null, objectMapper);
    }

    @Test
    public void testTransformResponse_missingFiles_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"key1\":\"value1\",\"key2\":\"value2\"}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        ListSheetsMethod listSheetsMethod = new ListSheetsMethod();
        JsonNode result = listSheetsMethod.transformResponse(jsonNode, objectMapper);

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

        ListSheetsMethod listSheetsMethod = new ListSheetsMethod();
        JsonNode result = listSheetsMethod.transformResponse(jsonNode, objectMapper);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertEquals(0, result.size());
    }

    @Test
    public void testTransformResponse_validFiles_toListOfFiles() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"key1\":\"value1\",\"files\":[\"Some\",\"123\",\"values\",\"to\"]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        ListSheetsMethod listSheetsMethod = new ListSheetsMethod();
        JsonNode result = listSheetsMethod.transformResponse(jsonNode, objectMapper);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertTrue("Some".equalsIgnoreCase(result.get(0).asText()));
    }
}
