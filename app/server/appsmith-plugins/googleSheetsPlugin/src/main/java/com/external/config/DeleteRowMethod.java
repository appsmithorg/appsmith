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
    public boolean validateMethodRequest(MethodConfig methodConfig, String body) {
        if (methodConfig.getSpreadsheetId() == null || methodConfig.getSpreadsheetId().isBlank()) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Missing required field Spreadsheet Id");
        }
        if (methodConfig.getSheetId() == null || methodConfig.getSheetId().isBlank()) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Missing required field Sheet Id");
        }
        if (methodConfig.getTableHeaderIndex() != null && !methodConfig.getTableHeaderIndex().isBlank()) {
            try {
                Integer.parseInt(methodConfig.getTableHeaderIndex());
            } catch (NumberFormatException e) {
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR,
                        "Unexpected format for table header index. Please use a number starting from 1");
            }
        }
        return true;
    }

    @Override
    public Mono<Boolean> executePrerequisites(MethodConfig methodConfig, String body, OAuth2 oauth2) {
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
                        return Mono.error(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_ERROR,
                                "Could not map request back to existing data"));
                    }
                    String jsonBody = new String(responseBody);
                    JsonNode jsonNodeBody = null;
                    try {
                        jsonNodeBody = objectMapper.readTree(jsonBody).get("sheets");
                    } catch (IOException e) {
                        Mono.error(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR,
                                new String(responseBody),
                                e.getMessage()
                        ));
                    }

                    assert jsonNodeBody != null;
                    for (JsonNode node : jsonNodeBody) {
                        final JsonNode jsonNode = node.get("properties");
                        if (jsonNode.get("title").asText().equalsIgnoreCase(methodConfig.getSheetName())) {
                            methodConfig.setSheetId(jsonNode.get("sheetId").asText());
                            break;
                        }
                    }

                    return methodConfig;
                })
                .thenReturn(true);
    }

    @Override
    public WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, MethodConfig methodConfig, String body) {

        UriComponentsBuilder uriBuilder = getBaseUriBuilder(this.BASE_SHEETS_API_URL,
                methodConfig.getSpreadsheetId() /* spreadsheet Id */
                        + ":batchUpdate");

        final int rowIndex = Integer.parseInt(methodConfig.getTableHeaderIndex()) +
                Integer.parseInt(methodConfig.getSpreadsheetRange()) - 1;
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

        return this.objectMapper.valueToTree(Map.of("message", "Deleted sheet successfully!"));
    }

}
