package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.OAuth2;
import com.external.constants.GoogleSheets;
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
public class DeleteSheetMethod implements Method {

    ObjectMapper objectMapper;

    public DeleteSheetMethod(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean validateMethodRequest(MethodConfig methodConfig) {
        if (methodConfig.getSpreadsheetId() == null || methodConfig.getSpreadsheetId().isBlank()) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Missing required field Spreadsheet Url");
        }
        if (GoogleSheets.SHEET.equalsIgnoreCase(methodConfig.getDeleteFormat())) {
            if (methodConfig.getSheetName() == null || methodConfig.getSheetName().isBlank()) {
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Missing required field Sheet Name");
            }
        }
        return true;
    }

    @Override
    public Mono<Object> executePrerequisites(MethodConfig methodConfig, OAuth2 oauth2) {
        if (GoogleSheets.SPREADSHEET.equalsIgnoreCase(methodConfig.getDeleteFormat())) {
            return Mono.just(true);
        }

        WebClient client = WebClient.builder()
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
                                AppsmithPluginError.PLUGIN_ERROR,
                                "Could not map request back to existing data"));
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
                        throw Exceptions.propagate(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unknown Sheet Name"));
                    } else {
                        methodConfig.setSheetId(sheetId);
                    }

                    return methodConfig;
                });
    }

    @Override
    public WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, MethodConfig methodConfig) {

        if (GoogleSheets.SPREADSHEET.equalsIgnoreCase(methodConfig.getDeleteFormat())) {
            UriComponentsBuilder uriBuilder = getBaseUriBuilder(this.BASE_DRIVE_API_URL,
                    methodConfig.getSpreadsheetId(), /* spreadsheet Id */
                    true
            );

            return webClient.method(HttpMethod.DELETE)
                    .uri(uriBuilder.build(true).toUri());
        } else {
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
    }

    @Override
    public JsonNode transformResponse(JsonNode response, MethodConfig methodConfig) {
        if (response == null) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Missing a valid response object.");
        }

        String errorMessage = "Deleted spreadsheet successfully!";
        if (GoogleSheets.SHEET.equalsIgnoreCase(methodConfig.getDeleteFormat())) {
            errorMessage = "Deleted sheet " + methodConfig.getSheetName() + " successfully!";
        }

        return this.objectMapper.valueToTree(Map.of("message", errorMessage));
    }

}
