package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;

/**
 * API reference: https://developers.google.com/sheets/api/guides/migration#delete_a_sheet
 */
public class DeleteSheetMethod implements Method {

    ObjectMapper objectMapper;

    public DeleteSheetMethod(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean validateMethodRequest(MethodConfig methodConfig, String body) {
        if (methodConfig.getSpreadsheetId() == null || methodConfig.getSpreadsheetId().isBlank()) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Missing required field Spreadsheet Id");
        }
        if (methodConfig.getSheetId() == null || methodConfig.getSheetId().isBlank()) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Missing required field Sheet Id");
        }
        return true;
    }

    @Override
    public WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, MethodConfig methodConfig, String body) {

        if ("All".equalsIgnoreCase(methodConfig.getSheetId())) {
            UriComponentsBuilder uriBuilder = getBaseUriBuilder(this.BASE_DRIVE_API_URL,
                    methodConfig.getSpreadsheetId() /* spreadsheet Id */
            );

            return webClient.method(HttpMethod.DELETE)
                    .uri(uriBuilder.build(true).toUri());
        } else {
            UriComponentsBuilder uriBuilder = getBaseUriBuilder(this.BASE_SHEETS_API_URL,
                    methodConfig.getSpreadsheetId() /* spreadsheet Id */
                            + ":batchUpdate");

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
    }

    @Override
    public JsonNode transformResponse(JsonNode response, MethodConfig methodConfig) {
        if (response == null) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Missing a valid response object.");
        }

        return this.objectMapper.valueToTree(Map.of("message", "Deleted sheet successfully!"));
    }

}
