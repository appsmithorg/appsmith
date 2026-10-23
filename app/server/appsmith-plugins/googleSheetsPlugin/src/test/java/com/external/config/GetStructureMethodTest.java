package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.external.constants.ErrorMessages;
import com.external.constants.FieldName;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class GetStructureMethodTest {

    @Test
    public void testTransformExecutionResponse_missingJSON_throwsException() {
        ObjectMapper objectMapper = new ObjectMapper();

        GetStructureMethod getStructureMethod = new GetStructureMethod(objectMapper);
        try {
            JsonNode result = getStructureMethod.transformExecutionResponse(
                    null,
                    new MethodConfig(Map.of()).toBuilder().tableHeaderIndex("1").build(),
                    null);
            assertFalse(result == null);
        } catch (AppsmithPluginException e) {
            assertTrue(ErrorMessages.MISSING_VALID_RESPONSE_ERROR_MSG.equalsIgnoreCase(e.getMessage()));
        }
    }

    @Test
    public void testTransformExecutionResponse_missingValues_returnsEmpty() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"valueRanges\":[{}]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        assertNotNull(jsonNode);

        GetStructureMethod getStructureMethod = new GetStructureMethod(objectMapper);
        JsonNode result = getStructureMethod.transformExecutionResponse(jsonNode, null, null);

        assertNotNull(result);
        assertTrue(result.isArray());
        assertEquals(0, result.size());
    }

    @Test
    public void testTransformExecutionResponse_HeadersOnly_returnsValue() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"valueRanges\":[" + "{\"range\":\"Sheet1!A1:D1\","
                + "\"majorDimension\":\"ROWS\","
                + "\"values\":[[\"Name\",\"Actor\",\"Music\",\"Director\"]]}"
                + "]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        assertNotNull(jsonNode);

        GetStructureMethod getStructureMethod = new GetStructureMethod(objectMapper);
        JsonNode result = getStructureMethod.transformExecutionResponse(
                jsonNode,
                new MethodConfig(Map.of()).toBuilder().tableHeaderIndex("1").build(),
                null);

        assertNotNull(result);
        assertTrue(result.isArray());
        assertEquals(1, result.size());
    }

    @Test
    public void testTransformExecutionResponse_emptyStartingRows_toListOfObjects() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"valueRanges\":[" + "{\"range\":\"Sheet1!A1:D1\","
                + "\"majorDimension\":\"ROWS\","
                + "\"values\":[[\"Name\",\"Actor\",\"Music\",\"Director\"]]},"
                + "{\"range\":\"Sheet1!A2:D2\","
                + "\"majorDimension\":\"ROWS\","
                + "\"values\":[[]]}"
                + "]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        assertNotNull(jsonNode);

        GetStructureMethod getStructureMethod = new GetStructureMethod(objectMapper);
        JsonNode result = getStructureMethod.transformExecutionResponse(
                jsonNode,
                new MethodConfig(Map.of()).toBuilder().tableHeaderIndex("1").build(),
                null);

        assertNotNull(result);
        assertTrue(result.isArray() && result.size() == 1);

        assertTrue("".equalsIgnoreCase(result.get(0).get("Name").asText()));
        assertTrue("".equalsIgnoreCase(result.get(0).get("Director").asText()));
    }

    @Test
    public void testTransformExecutionResponse_emptyRows_returnsIndices() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"valueRanges\":[" + "{\"range\":\"Sheet1!A1:D1\","
                + "\"majorDimension\":\"ROWS\","
                + "\"values\":[[\"Name\",\"Actor\",\"Music\",\"Director\"]]},"
                + "{\"range\":\"Sheet1!A2:D2\","
                + "\"majorDimension\":\"ROWS\","
                + "\"values\":[[]]}"
                + "]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        assertNotNull(jsonNode);

        GetStructureMethod getStructureMethod = new GetStructureMethod(objectMapper);
        JsonNode result = getStructureMethod.transformExecutionResponse(
                jsonNode,
                new MethodConfig(Map.of()).toBuilder().tableHeaderIndex("1").build(),
                null);

        assertNotNull(result);
        assertTrue(result.isArray());
        assertEquals(1, result.size());
        assertEquals(0, result.get(0).get(FieldName.ROW_INDEX).asInt());
    }

    @Test
    public void testTransformExecutionResponse_fetchNonEmptyRows() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"valueRanges\":[" + "{\"range\":\"Sheet1!A1:D2\","
                + "\"majorDimension\":\"ROWS\","
                + "\"values\":[[\"\",\"\",\"\",\"\"],[\"Name\",\"Actor\",\"Music\",\"Director\"]]},"
                + "{\"range\":\"Sheet1!A3:D3\","
                + "\"majorDimension\":\"ROWS\","
                + "\"values\":[[\"Bean\",\"Sean\",\"Dean\",\"Mean\"]]}"
                + "]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        assertNotNull(jsonNode);

        GetStructureMethod getStructureMethod = new GetStructureMethod(objectMapper);
        JsonNode result = getStructureMethod.transformExecutionResponse(
                jsonNode,
                new MethodConfig(Map.of()).toBuilder().tableHeaderIndex("1").build(),
                null);

        assertNotNull(result);
        assertTrue(result.isArray());
        assertEquals(1, result.size());
    }

    @Test
    public void testTransformExecutionResponse_VerifyEndResult() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"valueRanges\":[" + "{\"range\":\"Sheet1!A1:D1\","
                + "\"majorDimension\":\"ROWS\","
                + "\"values\":[[\"Name\",\"Actor\",\"Music\",\"Director\"]]},"
                + "{\"range\":\"Sheet1!A2:D2\","
                + "\"majorDimension\":\"ROWS\","
                + "\"values\":[[\"Luke\",\"Make\",\"Duke\",\"Cake\"]]}"
                + "]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);

        assertNotNull(jsonNode);

        GetStructureMethod getStructureMethod = new GetStructureMethod(objectMapper);
        JsonNode result = getStructureMethod.transformExecutionResponse(
                jsonNode,
                new MethodConfig(Map.of()).toBuilder().tableHeaderIndex("1").build(),
                null);

        assertNotNull(result);
        assertEquals(
                result.toString(),
                "[{\"Name\":\"Luke\",\"Actor\":\"Make\",\"Music\":\"Duke\",\"Director\":\"Cake\",\"rowIndex\":\"0\"}]");
    }

    @Test
    public void testTransformTriggerResponse_withValidHeaders_returnsDropdownOptions() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();

        final String jsonString = "{\"valueRanges\":[" + "{\"range\":\"Sheet1!A1:D1\","
                + "\"majorDimension\":\"ROWS\","
                + "\"values\":[[\"Name\",\"Actor\",\"Music\",\"Director\"]]},"
                + "{\"range\":\"Sheet1!A2:D2\","
                + "\"majorDimension\":\"ROWS\","
                + "\"values\":[[\"Luke\",\"Make\",\"Duke\",\"Cake\"]]}"
                + "]}";

        JsonNode jsonNode = objectMapper.readTree(jsonString);
        assertNotNull(jsonNode);

        TriggerMethod getStructureMethod = new GetStructureMethod(objectMapper);
        JsonNode result = getStructureMethod.transformTriggerResponse(jsonNode, new MethodConfig(Map.of()), null);

        assertNotNull(result);
        assertTrue(result.isArray());
        final List<Map<String, String>> expectedColumnsList = List.of(
                Map.of("label", "Name", "value", "Name"),
                Map.of("label", "Actor", "value", "Actor"),
                Map.of("label", "Music", "value", "Music"),
                Map.of("label", "Director", "value", "Director"));
        assertEquals(objectMapper.valueToTree(expectedColumnsList), result);
    }

    @Test
    public void testGetExecutionClient_sheetNameWithAmpersand_properlyUrlEncoded() {
        AtomicReference<URI> capturedUri = new AtomicReference<>();
        WebClient webClient = WebClient.builder()
                .exchangeFunction(clientRequest -> {
                    capturedUri.set(clientRequest.url());
                    return Mono.just(ClientResponse.create(HttpStatus.OK).build());
                })
                .build();

        MethodConfig methodConfig = MethodConfig.builder()
                .spreadsheetId("testSpreadsheetId")
                .sheetName("Sheet&27")
                .tableHeaderIndex("1")
                .build();

        GetStructureMethod getStructureMethod = new GetStructureMethod(new ObjectMapper());
        getStructureMethod
                .getExecutionClient(webClient, methodConfig)
                .exchange()
                .block();

        assertNotNull(capturedUri.get());
        String rawQuery = capturedUri.get().getRawQuery();
        assertTrue(
                rawQuery.contains("ranges='Sheet%2627'!1:1"),
                "Expected range parameter to be URL-encoded with %26 for ampersand, but got: " + rawQuery);
        assertTrue(
                rawQuery.contains("ranges='Sheet%2627'!2:2"),
                "Expected range parameter to be URL-encoded with %26 for ampersand, but got: " + rawQuery);
    }

    @Test
    public void testGetExecutionClient_normalSheetName_properlyConstructed() {
        AtomicReference<URI> capturedUri = new AtomicReference<>();
        WebClient webClient = WebClient.builder()
                .exchangeFunction(clientRequest -> {
                    capturedUri.set(clientRequest.url());
                    return Mono.just(ClientResponse.create(HttpStatus.OK).build());
                })
                .build();

        MethodConfig methodConfig = MethodConfig.builder()
                .spreadsheetId("testSpreadsheetId")
                .sheetName("Sheet1")
                .tableHeaderIndex("1")
                .build();

        GetStructureMethod getStructureMethod = new GetStructureMethod(new ObjectMapper());
        getStructureMethod
                .getExecutionClient(webClient, methodConfig)
                .exchange()
                .block();

        assertNotNull(capturedUri.get());
        String rawQuery = capturedUri.get().getRawQuery();
        assertTrue(
                rawQuery.contains("ranges='Sheet1'!1:1"),
                "Expected range parameter to contain 'Sheet1'!1:1, but got: " + rawQuery);
        assertTrue(
                rawQuery.contains("ranges='Sheet1'!2:2"),
                "Expected range parameter to contain 'Sheet1'!2:2, but got: " + rawQuery);
    }

    @Test
    public void testGetExecutionClient_sheetNameWithSpaces_properlyUrlEncoded() {
        AtomicReference<URI> capturedUri = new AtomicReference<>();
        WebClient webClient = WebClient.builder()
                .exchangeFunction(clientRequest -> {
                    capturedUri.set(clientRequest.url());
                    return Mono.just(ClientResponse.create(HttpStatus.OK).build());
                })
                .build();

        MethodConfig methodConfig = MethodConfig.builder()
                .spreadsheetId("testSpreadsheetId")
                .sheetName("My Sheet")
                .tableHeaderIndex("1")
                .build();

        GetStructureMethod getStructureMethod = new GetStructureMethod(new ObjectMapper());
        getStructureMethod
                .getExecutionClient(webClient, methodConfig)
                .exchange()
                .block();

        assertNotNull(capturedUri.get());
        String rawQuery = capturedUri.get().getRawQuery();
        assertTrue(
                rawQuery.contains("ranges='My%20Sheet'!1:1"),
                "Expected range parameter to be URL-encoded with %20 for spaces, but got: " + rawQuery);
        assertTrue(
                rawQuery.contains("ranges='My%20Sheet'!2:2"),
                "Expected range parameter to be URL-encoded with %20 for spaces, but got: " + rawQuery);
    }
}
