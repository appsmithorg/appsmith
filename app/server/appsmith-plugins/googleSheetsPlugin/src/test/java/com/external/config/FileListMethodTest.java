package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.Assert;
import org.junit.Test;

import java.util.HashMap;

public class FileListMethodTest {

    @Test(expected = AppsmithPluginException.class)
    public void testTransformExecutionResponse_missingJSON_throwsException() {
        ObjectMapper objectMapper = new ObjectMapper();

        FileListMethod fileListMethod = new FileListMethod(objectMapper);
        fileListMethod.transformExecutionResponse(null, null);
    }

    @Test
    public void testTransformExecutionResponse_missingFiles_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"key1\":\"value1\",\"key2\":\"value2\"}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        FileListMethod fileListMethod = new FileListMethod(objectMapper);
        JsonNode result = fileListMethod.transformExecutionResponse(jsonNode, null);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertEquals(0, result.size());
    }

    @Test
    public void testTransformExecutionResponse_emptyFiles_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"key1\":\"value1\",\"files\":[]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        FileListMethod fileListMethod = new FileListMethod(objectMapper);
        JsonNode result = fileListMethod.transformExecutionResponse(jsonNode, null);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertEquals(0, result.size());
    }

    @Test
    public void testTransformExecutionResponse_validFiles_toListOfFiles() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"key1\":\"value1\",\"files\":[{\"id\":\"1\", \"name\":\"test\"}]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        FileListMethod fileListMethod = new FileListMethod(objectMapper);
        JsonNode result = fileListMethod.transformExecutionResponse(jsonNode, null);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertTrue("Test".equalsIgnoreCase(result.get(0).get("name").asText()));
    }

    @Test
    public void testTransformTriggerResponse_withoutFiles_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"key\":\"value\"}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);
        Assert.assertNotNull(jsonNode);

        MethodConfig methodConfig = new MethodConfig(new HashMap<>());

        TriggerMethod fileListMethod = new FileListMethod(objectMapper);
        JsonNode result = fileListMethod.transformTriggerResponse(jsonNode, methodConfig);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertTrue(result.isEmpty());
    }

    @Test
    public void testTransformTriggerResponse_withSheets_returnsDropdownOptions() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"files\":[{\"id\": \"testId\", \"name\": \"testName\"}]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);
        Assert.assertNotNull(jsonNode);

        MethodConfig methodConfig = new MethodConfig(new HashMap<>());

        TriggerMethod fileListMethod = new FileListMethod(objectMapper);
        JsonNode result = fileListMethod.transformTriggerResponse(jsonNode, methodConfig);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        final ObjectNode expectedObjectNode = objectMapper.createObjectNode();
        expectedObjectNode.put("label", "testName");
        expectedObjectNode.put("value", "https://docs.google.com/spreadsheets/d/testId/edit");
        Assert.assertEquals(expectedObjectNode, result.get(0));
    }
}
