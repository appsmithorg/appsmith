package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.Assert;
import org.junit.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public class FileInfoMethodTest {

    @Test(expected = AppsmithPluginException.class)
    public void testTransformExecutionResponse_missingJSON_throwsException() {
        ObjectMapper objectMapper = new ObjectMapper();

        FileInfoMethod fileInfoMethod = new FileInfoMethod(objectMapper);
        fileInfoMethod.transformExecutionResponse(null, null);
    }

    @Test
    public void testTransformExecutionResponse_missingSheets_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"key1\":\"value1\",\"key2\":\"value2\"}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);
        Assert.assertNotNull(jsonNode);

        MethodConfig methodConfig = new MethodConfig(new HashMap<>());
        JsonNode sheetNode = objectMapper.readTree("");
        methodConfig.setBody(sheetNode);

        FileInfoMethod fileInfoMethod = new FileInfoMethod(objectMapper);
        JsonNode result = fileInfoMethod.transformExecutionResponse(jsonNode, methodConfig);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isObject());
        Assert.assertEquals(null, result.get("sheets"));
    }

    @Test
    public void testTransformExecutionResponse_emptySheets_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"key1\":\"value1\",\"key2\":\"value2\"}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);
        Assert.assertNotNull(jsonNode);

        MethodConfig methodConfig = new MethodConfig(new HashMap<>());
        methodConfig.setBody(new ArrayList<>());

        FileInfoMethod fileInfoMethod = new FileInfoMethod(objectMapper);
        JsonNode result = fileInfoMethod.transformExecutionResponse(jsonNode, methodConfig);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isObject());
        Assert.assertEquals(0, result.get("sheets").size());
    }

    @Test
    public void testTransformExecutionResponse_validSheets_toListOfSheets() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"key1\":\"value1\",\"key2\":\"value2\"}";
        final String sheetMetadataString = "{\"sheetId\":\"1\", \"title\":\"test\", \"sheetType\":\"GRID\", \"index\":0}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);
        Assert.assertNotNull(jsonNode);

        MethodConfig methodConfig = new MethodConfig(new HashMap<>());
        JsonNode sheetNode = objectMapper.readTree(sheetMetadataString);
        methodConfig.setBody(List.of(sheetNode));

        FileInfoMethod fileInfoMethod = new FileInfoMethod(objectMapper);
        JsonNode result = fileInfoMethod.transformExecutionResponse(jsonNode, methodConfig);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isObject());
        Assert.assertEquals(1, result.get("sheets").size());
        Assert.assertTrue("test".equalsIgnoreCase(result.get("sheets").get(0).get("title").asText()));
    }

    @Test
    public void testTransformTriggerResponse_withoutSheets_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"sheets\":[]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);
        Assert.assertNotNull(jsonNode);

        MethodConfig methodConfig = new MethodConfig(new HashMap<>());

        TriggerMethod fileInfoMethod = new FileInfoMethod(objectMapper);
        JsonNode result = fileInfoMethod.transformTriggerResponse(jsonNode, methodConfig);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertTrue(result.isEmpty());
    }

    @Test
    public void testTransformTriggerResponse_withSheets_returnsDropdownOptions() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"sheets\":[{\"properties\": {\"title\": \"testSheetName\"}}]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);
        Assert.assertNotNull(jsonNode);

        MethodConfig methodConfig = new MethodConfig(new HashMap<>());

        TriggerMethod fileInfoMethod = new FileInfoMethod(objectMapper);
        JsonNode result = fileInfoMethod.transformTriggerResponse(jsonNode, methodConfig);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        final ObjectNode expectedObjectNode = objectMapper.createObjectNode();
        expectedObjectNode.put("label", "testSheetName");
        expectedObjectNode.put("value", "testSheetName");
        Assert.assertEquals(expectedObjectNode, result.get(0));
    }
}
