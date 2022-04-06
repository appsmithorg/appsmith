package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.OAuth2;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
 * API reference: https://developers.google.com/sheets/api/samples/rowcolumn#delete_rows_or_columns
 */
public class DeleteRowMethod implements Method {

    ObjectMapper objectMapper;

    public DeleteRowMethod(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean validateMethodRequest(MethodConfig methodConfig) {
        if (methodConfig.getSpreadsheetId() == null || methodConfig.getSpreadsheetId().isBlank()) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Missing required field Spreadsheet Url");
        }
        if (methodConfig.getSheetName() == null || methodConfig.getSheetName().isBlank()) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Missing required field Sheet name");
        }
        if (methodConfig.getRowIndex() == null || methodConfig.getRowIndex().isBlank()) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Missing required field Row index");
        }
        int rowIndex = 0;
        try {
            rowIndex = Integer.parseInt(methodConfig.getRowIndex());
            if (rowIndex < 0) {
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        "Unexpected value for row index. Please use a number starting from 0");
            }
        } catch (NumberFormatException e) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    "Unexpected format for row index. Please use a number starting from 0");
        }
        if (methodConfig.getTableHeaderIndex() != null && !methodConfig.getTableHeaderIndex().isBlank()) {
            try {
                if (Integer.parseInt(methodConfig.getTableHeaderIndex()) <= 0) {
                    throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            "Unexpected value for table header index. Please use a number starting from 1");
                }
            } catch (NumberFormatException e) {
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        "Unexpected format for table header index. Please use a number starting from 1");
            }
        }
        return true;
    }

    @Override
    public Mono<Object> executePrerequisites(MethodConfig methodConfig, OAuth2 oauth2) {
        WebClient client = WebClient.builder()
                .exchangeStrategies(EXCHANGE_STRATEGIES)
                .build();
        UriComponentsBuilder uriBuilder = getBaseUriBuilder(this.BASE_SHEETS_API_URL,
                methodConfig.getSpreadsheetId());
        uriBuilder.queryParam("fields", "sheets/properties");
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
                                AppsmithPluginError.PLUGIN_ERROR,
                                "Could not map request back to existing data"));
                    }
                    String jsonBody = new String(responseBody);
                    JsonNode sheets = null;
                    try {
                        sheets = objectMapper.readTree(jsonBody).get("sheets");
                    } catch (IOException e) {
                        Mono.error(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR,
                                new String(responseBody),
                                e.getMessage()
                        ));
                    }

                    assert sheets != null;
                    String sheetId = null;
                    for (JsonNode sheet : sheets) {
                        final JsonNode properties = sheet.get("properties");
                        if (methodConfig.getSheetName().equals(properties.get("title").asText())) {
                            sheetId = properties.get("sheetId").asText();
                        }
                    }

                    if (sheetId == null) {
                        throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unknown Sheet Name"));
                    } else {
                        methodConfig.setSheetId(sheetId);
                    }

                    return methodConfig;
                });
    }

    @Override
    public WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, MethodConfig methodConfig) {

        UriComponentsBuilder uriBuilder = getBaseUriBuilder(this.BASE_SHEETS_API_URL,
                methodConfig.getSpreadsheetId() /* spreadsheet Id */
                        + ":batchUpdate",
                true);

        final int rowIndex = Integer.parseInt(methodConfig.getTableHeaderIndex()) +
                Integer.parseInt(methodConfig.getRowIndex());
        return webClient.method(HttpMethod.POST)
                .uri(uriBuilder.build(true).toUri())
                .body(BodyInserters.fromValue(
                        Map.of(
                                "requests", List.of(
                                        Map.of(
                                                "deleteDimension", Map.of(
                                                        "range", Map.of(
                                                                "sheetId", methodConfig.getSheetId(),
                                                                "dimension", "ROWS",
                                                                "startIndex", rowIndex,
                                                                "endIndex", rowIndex + 1
                                                        )
                                                ))))));
    }

    @Override
    public JsonNode transformResponse(JsonNode response, MethodConfig methodConfig) {
        if (response == null) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Missing a valid response object.");
        }

        return this.objectMapper.valueToTree(Map.of("message",
                "Deleted row successfully!"));
    }

}
