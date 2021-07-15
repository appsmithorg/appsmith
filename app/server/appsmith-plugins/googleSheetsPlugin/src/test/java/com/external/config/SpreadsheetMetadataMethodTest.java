package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Assert;
import org.junit.Test;

public class SpreadsheetMetadataMethodTest {

    @Test(expected = AppsmithPluginException.class)
    public void testTransformResponse_missingJSON_throwsException() {
        ObjectMapper objectMapper = new ObjectMapper();

        SpreadsheetMetadataMethod spreadsheetMetadataMethod = new SpreadsheetMetadataMethod(objectMapper);
        spreadsheetMetadataMethod.transformResponse(null, null);
    }

    @Test
    public void testTransformResponse_missingSheets_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"key1\":\"value1\",\"key2\":\"value2\"}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        SpreadsheetMetadataMethod spreadsheetMetadataMethod = new SpreadsheetMetadataMethod(objectMapper);
        JsonNode result = spreadsheetMetadataMethod.transformResponse(jsonNode, null);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertEquals(0, result.size());
    }

    @Test
    public void testTransformResponse_emptySheets_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"key1\":\"value1\",\"sheets\":[]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        SpreadsheetMetadataMethod spreadsheetMetadataMethod = new SpreadsheetMetadataMethod(objectMapper);
        JsonNode result = spreadsheetMetadataMethod.transformResponse(jsonNode, null);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertEquals(0, result.size());
    }

    @Test
    public void testTransformResponse_validSheets_toListOfSheets() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"key1\":\"value1\",\"sheets\":[{\"properties\":{\"sheetId\":\"1\", \"title\":\"test\", \"sheetType\":\"GRID\", \"index\":\"0\"}}]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        Assert.assertNotNull(jsonNode);

        SpreadsheetMetadataMethod spreadsheetMetadataMethod = new SpreadsheetMetadataMethod(objectMapper);
        JsonNode result = spreadsheetMetadataMethod.transformResponse(jsonNode, null);

        Assert.assertNotNull(result);
        Assert.assertTrue(result.isArray());
        Assert.assertTrue("test".equalsIgnoreCase(result.get(0).get("title").asText()));
    }
}
