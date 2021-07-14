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
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

/**
 * API reference: https://developers.google.com/sheets/api/guides/migration#retrieve_sheet_metadata
 */
public class SpreadsheetMetadataMethod implements Method {

    ObjectMapper objectMapper;

    public SpreadsheetMetadataMethod(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean validateMethodRequest(MethodConfig methodConfig) {
        if (methodConfig.getSpreadsheetId() == null || methodConfig.getSpreadsheetId().isBlank()) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Missing required field Spreadsheet Url");
        }
        return true;
    }

    @Override
    public WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, MethodConfig methodConfig) {

        UriComponentsBuilder uriBuilder = getBaseUriBuilder(this.BASE_SHEETS_API_URL,
            methodConfig.getSpreadsheetId() /* spreadsheet Id */
                + "?includeGridData=false");

        return webClient.method(HttpMethod.GET)
            .uri(uriBuilder.build(false).toUri())
            .body(BodyInserters.empty());
    }

    @Override
    public JsonNode transformResponse(JsonNode response, MethodConfig methodConfig) {
        if (response == null) {
            throw new AppsmithPluginException(
                AppsmithPluginError.PLUGIN_ERROR,
                "Missing a valid response object.");
        }
        if (response.get("sheets") == null) {
            return this.objectMapper.createArrayNode();
        }
        List<Map<String, String>> sheets = StreamSupport
            .stream(response.get("sheets").spliterator(), false)
            .map(sheet -> Map.of("sheetId", sheet.get("properties").get("sheetId").asText(),
                    "title", sheet.get("properties").get("title").asText()
            ))
            .collect(Collectors.toList());

        return this.objectMapper.valueToTree(sheets);
    }
}
