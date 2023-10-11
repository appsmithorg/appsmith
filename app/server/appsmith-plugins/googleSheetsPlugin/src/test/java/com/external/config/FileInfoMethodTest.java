package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class FileInfoMethodTest {

    ObjectMapper objectMapper;

    @BeforeEach
    public void setUp() {
        this.objectMapper = new ObjectMapper();
    }

    @Test
    public void testTransformExecutionResponse_missingJSON_throwsException() {

        FileInfoMethod fileInfoMethod = new FileInfoMethod(objectMapper);
        assertThrows(AppsmithPluginException.class, () -> {
            fileInfoMethod.transformExecutionResponse(null, null, null);
        });
    }

    @Test
    public void testTransformExecutionResponse_missingSheets_returnsEmpty() throws JsonProcessingException {

        final String jsonString = "{\"key1\":\"value1\",\"key2\":\"value2\"}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);
        assertNotNull(jsonNode);

        MethodConfig methodConfig = new MethodConfig(new HashMap<>());
        JsonNode sheetNode = objectMapper.readTree("");
        methodConfig.setBody(sheetNode);

        FileInfoMethod fileInfoMethod = new FileInfoMethod(objectMapper);
        JsonNode result = fileInfoMethod.transformExecutionResponse(jsonNode, methodConfig, null);

        assertNotNull(result);
        assertTrue(result.isObject());
        assertEquals(null, result.get("sheets"));
    }

    @Test
    public void testTransformExecutionResponse_emptySheets_returnsEmpty() throws JsonProcessingException {

        final String jsonString = "{\"key1\":\"value1\",\"key2\":\"value2\"}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);
        assertNotNull(jsonNode);

        MethodConfig methodConfig = new MethodConfig(new HashMap<>());
        methodConfig.setBody(new ArrayList<>());

        FileInfoMethod fileInfoMethod = new FileInfoMethod(objectMapper);
        JsonNode result = fileInfoMethod.transformExecutionResponse(jsonNode, methodConfig, null);

        assertNotNull(result);
        assertTrue(result.isObject());
        assertEquals(0, result.get("sheets").size());
    }

    @Test
    public void testTransformExecutionResponse_validSheets_toListOfSheets() throws JsonProcessingException {

        final String jsonString = "{\"key1\":\"value1\",\"key2\":\"value2\"}";
        final String sheetMetadataString =
                "{\"sheetId\":\"1\", \"title\":\"test\", \"sheetType\":\"GRID\", \"index\":0}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);
        assertNotNull(jsonNode);

        MethodConfig methodConfig = new MethodConfig(new HashMap<>());
        JsonNode sheetNode = objectMapper.readTree(sheetMetadataString);
        methodConfig.setBody(List.of(sheetNode));

        FileInfoMethod fileInfoMethod = new FileInfoMethod(objectMapper);
        JsonNode result = fileInfoMethod.transformExecutionResponse(jsonNode, methodConfig, null);

        assertNotNull(result);
        assertTrue(result.isObject());
        assertEquals(1, result.get("sheets").size());
        assertTrue(
                "test".equalsIgnoreCase(result.get("sheets").get(0).get("title").asText()));
    }

    @Test
    public void testTransformTriggerResponse_withoutSheets_returnsEmpty() throws JsonProcessingException {

        final String jsonString = "{\"sheets\":[]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);
        assertNotNull(jsonNode);

        MethodConfig methodConfig = new MethodConfig(new HashMap<>());

        TriggerMethod fileInfoMethod = new FileInfoMethod(objectMapper);
        JsonNode result = fileInfoMethod.transformTriggerResponse(jsonNode, methodConfig, null);

        assertNotNull(result);
        assertTrue(result.isArray());
        assertTrue(result.isEmpty());
    }

    @Test
    public void testTransformTriggerResponse_withSheets_returnsDropdownOptions() throws JsonProcessingException {

        final String jsonString = "{\"sheets\":[{\"properties\": {\"title\": \"testSheetName\"}}]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);
        assertNotNull(jsonNode);

        MethodConfig methodConfig = new MethodConfig(new HashMap<>());

        TriggerMethod fileInfoMethod = new FileInfoMethod(objectMapper);
        JsonNode result = fileInfoMethod.transformTriggerResponse(jsonNode, methodConfig, null);

        assertNotNull(result);
        assertTrue(result.isArray());
        final ObjectNode expectedObjectNode = objectMapper.createObjectNode();
        expectedObjectNode.put("label", "testSheetName");
        expectedObjectNode.put("value", "testSheetName");
        assertEquals(expectedObjectNode, result.get(0));
    }
}
