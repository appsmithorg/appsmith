package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.OAuth2;
import com.external.domains.RowObject;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.TypeFactory;
import com.google.api.services.sheets.v4.model.ValueRange;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * API reference: https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/append
 */
public class AppendMethod implements Method {

    ObjectMapper objectMapper;

    public AppendMethod(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean validateMethodRequest(MethodConfig methodConfig) {
        if (methodConfig.getSpreadsheetId() == null || methodConfig.getSpreadsheetId().isBlank()) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Missing required field Spreadsheet Id");
        }
        if (methodConfig.getSheetName() == null || methodConfig.getSheetName().isBlank()) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Missing required field Sheet name");
        }
        if (methodConfig.getTableHeaderIndex() != null && !methodConfig.getTableHeaderIndex().isBlank()) {
            try {
                Integer.parseInt(methodConfig.getTableHeaderIndex());
            } catch (NumberFormatException e) {
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR,
                        "Unexpected format for table header index. Please use a number starting from 1");
            }
        }
        JsonNode bodyNode;
        try {
            bodyNode = this.objectMapper.readTree(methodConfig.getRowObject());
        } catch (JsonProcessingException e) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Unable to parse request body. Expected a row object.");
        }

        if (bodyNode.isArray()) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR, "Request body was an array. Expected a row object.");
        }
        return true;
    }

    @Override
    public Mono<Object> executePrerequisites(MethodConfig methodConfig, OAuth2 oauth2) {
        WebClient client = WebClient.builder()
                .exchangeStrategies(EXCHANGE_STRATEGIES)
                .build();
        final GetValuesMethod getValuesMethod = new GetValuesMethod(this.objectMapper);

        RowObject rowObjectFromBody = null;
        try {
            rowObjectFromBody = this.getRowObjectFromBody(this.objectMapper.readTree(methodConfig.getRowObject()));
        } catch (JsonProcessingException e) {
            // Should never enter here
        }
        assert rowObjectFromBody != null;
//        final String row = String.valueOf(rowObjectFromBody.getCurrentRowIndex());
        final MethodConfig newMethodConfig = methodConfig
                .toBuilder()
                .queryFormat("ROWS")
                .rowOffset(String.valueOf(Integer.parseInt(methodConfig.getTableHeaderIndex()) - 1))
                .rowLimit("1")
                .build();

        getValuesMethod.validateMethodRequest(newMethodConfig);

        RowObject finalRowObjectFromBody = rowObjectFromBody;
        return getValuesMethod
                .getClient(client, newMethodConfig)
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
                    // This is the object with the original values in the referred row
                    final JsonNode jsonNode = getValuesMethod
                            .transformResponse(jsonNodeBody, methodConfig);

                    // This is the rowObject for original values
                    final RowObject returnedRowObject = this.getRowObjectFromBody(jsonNode.get(0));

                    // We replace these original values with new ones
                    final Map<String, String> valueMap = new LinkedHashMap<>(returnedRowObject.getValueMap());
                    valueMap.replaceAll((k, v) -> finalRowObjectFromBody.getValueMap().getOrDefault(k, null));
                    finalRowObjectFromBody.setValueMap(valueMap);


                    methodConfig.setBody(finalRowObjectFromBody);
                    assert jsonNodeBody != null;
                    methodConfig.setSpreadsheetRange(
                            jsonNodeBody
                                    .get("valueRanges")
                                    .get(1)
                                    .get("range")
                                    .asText()
                    );
                    return methodConfig;
                });
    }

    @Override
    public WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, MethodConfig methodConfig) {

        UriComponentsBuilder uriBuilder = getBaseUriBuilder(this.BASE_SHEETS_API_URL,
                methodConfig.getSpreadsheetId() /* spreadsheet Id */
                        + "/values/"
                        + methodConfig.getSheetName() /* spreadsheet Name */
                        + ":append");

        uriBuilder.queryParam("valueInputOption", "USER_ENTERED");
        uriBuilder.queryParam("includeValuesInResponse", Boolean.FALSE);

        final RowObject body1 = (RowObject) methodConfig.getBody();
        List<Object> collect = body1.getAsSheetValues(body1.getValueMap().keySet().toArray(new String[0]));

        final ValueRange valueRange = new ValueRange();
        valueRange.setMajorDimension("ROWS");
        valueRange.setRange(methodConfig.getSheetName());
        valueRange.setValues(List.of(collect));
        return webClient.method(HttpMethod.POST)
                .uri(uriBuilder.build(true).toUri())
                .body(BodyInserters.fromValue(valueRange));
    }

    @Override
    public JsonNode transformResponse(JsonNode response, MethodConfig methodConfig) {
        if (response == null) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Missing a valid response object.");
        }

        return this.objectMapper.valueToTree(Map.of("message", "Inserted row successfully!"));
    }

    private RowObject getRowObjectFromBody(JsonNode body) {

        if (body.isArray() || body.isEmpty()) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR,
                    "Expected a row object.");
        }
        return new RowObject(this.objectMapper.convertValue(body, TypeFactory
                .defaultInstance()
                .constructMapType(LinkedHashMap.class, String.class, String.class)))
                .initialize();
    }
}
