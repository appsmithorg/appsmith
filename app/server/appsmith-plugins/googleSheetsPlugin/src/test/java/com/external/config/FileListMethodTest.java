package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class FileListMethodTest {

    @Test
    public void testTransformExecutionResponse_missingJSON_throwsException() {
        ObjectMapper objectMapper = new ObjectMapper();

        FileListMethod fileListMethod = new FileListMethod(objectMapper);
        assertThrows(AppsmithPluginException.class, () -> {
            fileListMethod.transformExecutionResponse(null, null, null);
        });
    }

    @Test
    public void testTransformExecutionResponse_missingFiles_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"key1\":\"value1\",\"key2\":\"value2\"}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        assertNotNull(jsonNode);

        FileListMethod fileListMethod = new FileListMethod(objectMapper);
        JsonNode result = fileListMethod.transformExecutionResponse(jsonNode, null, null);

        assertNotNull(result);
        assertTrue(result.isArray());
        assertEquals(0, result.size());
    }

    @Test
    public void testTransformExecutionResponse_emptyFiles_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"key1\":\"value1\",\"files\":[]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        assertNotNull(jsonNode);

        FileListMethod fileListMethod = new FileListMethod(objectMapper);
        JsonNode result = fileListMethod.transformExecutionResponse(jsonNode, null, null);

        assertNotNull(result);
        assertTrue(result.isArray());
        assertEquals(0, result.size());
    }

    @Test
    public void testTransformExecutionResponse_validFiles_toListOfFiles() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"key1\":\"value1\",\"files\":[{\"id\":\"1\", \"name\":\"test\"}]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        assertNotNull(jsonNode);

        FileListMethod fileListMethod = new FileListMethod(objectMapper);
        JsonNode result = fileListMethod.transformExecutionResponse(jsonNode, null, null);

        assertNotNull(result);
        assertTrue(result.isArray());
        assertTrue("Test".equalsIgnoreCase(result.get(0).get("name").asText()));
    }

    @Test
    public void testTransformTriggerResponse_withoutFiles_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"key\":\"value\"}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);
        assertNotNull(jsonNode);

        MethodConfig methodConfig = new MethodConfig(new HashMap<>());

        TriggerMethod fileListMethod = new FileListMethod(objectMapper);
        JsonNode result = fileListMethod.transformTriggerResponse(jsonNode, methodConfig, null);

        assertNotNull(result);
        assertTrue(result.isArray());
        assertTrue(result.isEmpty());
    }

    @Test
    public void testTransformTriggerResponse_withSheets_returnsDropdownOptions() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"files\":[{\"id\": \"testId\", \"name\": \"testName\"}]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);
        assertNotNull(jsonNode);

        MethodConfig methodConfig = new MethodConfig(new HashMap<>());

        TriggerMethod fileListMethod = new FileListMethod(objectMapper);
        JsonNode result = fileListMethod.transformTriggerResponse(jsonNode, methodConfig, null);

        assertNotNull(result);
        assertTrue(result.isArray());
        final ObjectNode expectedObjectNode = objectMapper.createObjectNode();
        expectedObjectNode.put("label", "testName");
        expectedObjectNode.put("value", "https://docs.google.com/spreadsheets/d/testId/edit");
        assertEquals(expectedObjectNode, result.get(0));
    }

    @Test
    public void testTransformTriggerResponse_withAllSheetsAccess_returnsAllSheets() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString =
                "{\"files\":[{\"id\":\"id1\",\"name\":\"test1\"},{\"id\":\"id2\",\"name\":\"test2\"}]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);
        assertNotNull(jsonNode);

        MethodConfig methodConfig = new MethodConfig(new HashMap<>());

        TriggerMethod fileListMethod = new FileListMethod(objectMapper);
        JsonNode result = fileListMethod.transformTriggerResponse(jsonNode, methodConfig, null);

        assertNotNull(result);
        assertTrue(result.isArray());
        assertEquals(result.size(), 2);

        final ObjectNode expectedObjectNode1 = objectMapper.createObjectNode();
        expectedObjectNode1.put("label", "test1");
        expectedObjectNode1.put("value", "https://docs.google.com/spreadsheets/d/id1/edit");

        final ObjectNode expectedObjectNode2 = objectMapper.createObjectNode();
        expectedObjectNode2.put("label", "test2");
        expectedObjectNode2.put("value", "https://docs.google.com/spreadsheets/d/id2/edit");

        assertEquals(expectedObjectNode1, result.get(0));
        assertEquals(expectedObjectNode2, result.get(1));
    }

    @Test
    public void testTransformTriggerResponse_withSpecificSheets_returnsSpecificSheets() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString =
                "{\"files\":[{\"id\":\"id1\",\"name\":\"test1\"},{\"id\":\"id2\",\"name\":\"test2\"}]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);
        Set<String> userAuthorizedSheetIds = new HashSet<String>();
        userAuthorizedSheetIds.add("id1");
        assertNotNull(jsonNode);

        MethodConfig methodConfig = new MethodConfig(new HashMap<>());

        TriggerMethod fileListMethod = new FileListMethod(objectMapper);
        JsonNode result = fileListMethod.transformTriggerResponse(jsonNode, methodConfig, userAuthorizedSheetIds);

        assertNotNull(result);
        assertTrue(result.isArray());
        assertEquals(result.size(), 1);

        final ObjectNode expectedObjectNode = objectMapper.createObjectNode();
        expectedObjectNode.put("label", "test1");
        expectedObjectNode.put("value", "https://docs.google.com/spreadsheets/d/id1/edit");
        assertEquals(expectedObjectNode, result.get(0));
    }

    @Test
    public void testTransformExecutionResponse_withAllSheetsAccess_returnsAllSheets() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString =
                "{\"files\":[{\"id\":\"id1\",\"name\":\"test1\"},{\"id\":\"id2\",\"name\":\"test2\"}]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);
        assertNotNull(jsonNode);

        MethodConfig methodConfig = new MethodConfig(new HashMap<>());

        ExecutionMethod fileListMethod = new FileListMethod(objectMapper);
        JsonNode result = fileListMethod.transformExecutionResponse(jsonNode, methodConfig, null);

        assertNotNull(result);
        assertTrue(result.isArray());
        assertEquals(result.size(), 2);

        final ObjectNode expectedObjectNode1 = objectMapper.createObjectNode();
        expectedObjectNode1.put("id", "id1");
        expectedObjectNode1.put("url", "https://docs.google.com/spreadsheets/d/id1/edit");
        expectedObjectNode1.put("name", "test1");

        final ObjectNode expectedObjectNode2 = objectMapper.createObjectNode();
        expectedObjectNode2.put("id", "id2");
        expectedObjectNode2.put("url", "https://docs.google.com/spreadsheets/d/id2/edit");
        expectedObjectNode2.put("name", "test2");

        assertEquals(expectedObjectNode1, result.get(0));
        assertEquals(expectedObjectNode2, result.get(1));
    }

    @Test
    public void testTransformExecutionResponse_withSpecificSheets_returnsSpecificSheets()
            throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString =
                "{\"files\":[{\"id\":\"id1\",\"name\":\"test1\"},{\"id\":\"id2\",\"name\":\"test2\"}]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);
        Set<String> userAuthorizedSheetIds = new HashSet<String>();
        userAuthorizedSheetIds.add("id1");
        assertNotNull(jsonNode);

        MethodConfig methodConfig = new MethodConfig(new HashMap<>());

        ExecutionMethod fileListMethod = new FileListMethod(objectMapper);
        JsonNode result = fileListMethod.transformExecutionResponse(jsonNode, methodConfig, userAuthorizedSheetIds);

        assertNotNull(result);
        assertTrue(result.isArray());
        assertEquals(result.size(), 1);

        final ObjectNode expectedObjectNode = objectMapper.createObjectNode();
        expectedObjectNode.put("id", "id1");
        expectedObjectNode.put("url", "https://docs.google.com/spreadsheets/d/id1/edit");
        expectedObjectNode.put("name", "test1");
        assertEquals(expectedObjectNode, result.get(0));
    }
}
