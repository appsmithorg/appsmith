package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.OAuth2;
import com.appsmith.util.WebClientUtils;
import com.external.constants.ErrorMessages;
import com.external.plugins.exceptions.GSheetsPluginError;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * API reference: https://developers.google.com/sheets/api/guides/migration#delete_a_sheet
 */
public class SheetDeleteMethod implements ExecutionMethod {

    ObjectMapper objectMapper;

    public SheetDeleteMethod(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean validateExecutionMethodRequest(MethodConfig methodConfig) {
        if (methodConfig.getSpreadsheetId() == null || methodConfig.getSpreadsheetId().isBlank()) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, ErrorMessages.MISSING_SPREADSHEET_URL_ERROR_MSG);
        }
        if (methodConfig.getSheetName() == null || methodConfig.getSheetName().isBlank()) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, ErrorMessages.MISSING_SPREADSHEET_NAME_ERROR_MSG);
        }

        return true;
    }

    @Override
    public Mono<Object> executePrerequisites(MethodConfig methodConfig, OAuth2 oauth2) {
        WebClient client = WebClientUtils.builder()
                .exchangeStrategies(EXCHANGE_STRATEGIES)
                .build();
        UriComponentsBuilder uriBuilder = getBaseUriBuilder(this.BASE_SHEETS_API_URL,
                methodConfig.getSpreadsheetId())
                .queryParam("includeGridData", false);

        return client.method(HttpMethod.GET)
                .uri(uriBuilder.build(false).toUri())
                .body(BodyInserters.empty())
                .headers(headers -> headers.set(
                        "Authorization",
                        "Bearer " + oauth2.getAuthenticationResponse().getToken()))
                .exchange()
                .flatMap(clientResponse -> clientResponse.toEntity(byte[].class))
                .map(response -> {// Choose body depending on response status
                    byte[] responseBody = response.getBody();

                    if (responseBody == null || !response.getStatusCode().is2xxSuccessful()) {
                        throw Exceptions.propagate(new AppsmithPluginException(
                                GSheetsPluginError.QUERY_EXECUTION_FAILED,
                                ErrorMessages.RESPONSE_DATA_MAPPING_FAILED_ERROR_MSG));
                    }
                    String jsonBody = new String(responseBody);
                    JsonNode jsonNodeBody;
                    try {
                        jsonNodeBody = objectMapper.readTree(jsonBody);
                    } catch (IOException e) {
                        throw Exceptions.propagate(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR,
                                new String(responseBody),
                                e.getMessage()
                        ));
                    }

                    final ArrayNode sheets = (ArrayNode) jsonNodeBody.get("sheets");

                    String sheetId = null;
                    for (JsonNode sheet : sheets) {
                        final JsonNode properties = sheet.get("properties");
                        if (methodConfig.getSheetName().equalsIgnoreCase(properties.get("title").asText())) {
                            sheetId = properties.get("sheetId").asText();
                        }
                    }

                    if (sheetId == null) {
                        throw Exceptions.propagate(new AppsmithPluginException(GSheetsPluginError.QUERY_EXECUTION_FAILED, ErrorMessages.UNKNOWN_SHEET_NAME_ERROR_MSG));
                    } else {
                        methodConfig.setSheetId(sheetId);
                    }

                    return methodConfig;
                });
    }

    @Override
    public WebClient.RequestHeadersSpec<?> getExecutionClient(WebClient webClient, MethodConfig methodConfig) {

        UriComponentsBuilder uriBuilder = getBaseUriBuilder(this.BASE_SHEETS_API_URL,
                methodConfig.getSpreadsheetId() /* spreadsheet Id */
                        + ":batchUpdate", true);

        return webClient.method(HttpMethod.POST)
                .uri(uriBuilder.build(true).toUri())
                .body(BodyInserters.fromValue(
                        Map.of(
                                "requests", List.of(
                                        Map.of(
                                                "deleteSheet", Map.of(
                                                        "sheetId", methodConfig.getSheetId()))),
                                "includeSpreadsheetInResponse", false)));

    }

    @Override
    public JsonNode transformExecutionResponse(JsonNode response, MethodConfig methodConfig) {
        if (response == null) {
            throw new AppsmithPluginException(
                    GSheetsPluginError.QUERY_EXECUTION_FAILED,
                    ErrorMessages.MISSING_VALID_RESPONSE_ERROR_MSG);
        }

        String errorMessage = "Deleted sheet " + methodConfig.getSheetName() + " successfully!";

        return this.objectMapper.valueToTree(Map.of("message", errorMessage));
    }

}
