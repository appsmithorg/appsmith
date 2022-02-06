package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.OAuth2;
import com.external.domains.RowObject;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.TypeFactory;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * API reference: https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/update
 */
public class UpdateMethod implements Method {

    ObjectMapper objectMapper;

    public UpdateMethod(ObjectMapper objectMapper) {
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
        final String body = methodConfig.getRowObject();
        try {
            this.getRowObjectFromBody(this.objectMapper.readTree(body));
        } catch (JsonProcessingException e) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR, methodConfig.getRowObject(),
                    "Unable to parse request body. Expected a row object.");
        }
        return true;
    }

    @Override
    public Mono<Object> executePrerequisites(MethodConfig methodConfig, OAuth2 oauth2) {
        WebClient client = WebClient.builder()
                .exchangeStrategies(EXCHANGE_STRATEGIES)
                .build();
        final GetValuesMethod getValuesMethod = new GetValuesMethod(this.objectMapper);

        final String body = methodConfig.getRowObject();
        RowObject rowObjectFromBody = null;
        try {
            rowObjectFromBody = this.getRowObjectFromBody(this.objectMapper.readTree(body));
        } catch (JsonProcessingException e) {
            // Should never enter here
        }

        assert rowObjectFromBody != null;
        final String row = String.valueOf(rowObjectFromBody.getCurrentRowIndex());
        final MethodConfig newMethodConfig = methodConfig
                .toBuilder()
                .queryFormat("ROWS")
                .rowOffset(row)
                .rowLimit("1")
                .build();

        getValuesMethod.validateMethodRequest(newMethodConfig);

        final RowObject finalRowObjectFromBody = rowObjectFromBody;

        return getValuesMethod
                .getClient(client, newMethodConfig)
                .headers(headers -> headers.set(
                        "Authorization",
                        "Bearer " + oauth2.getAuthenticationResponse().getToken()))
                .exchange()
                .flatMap(clientResponse -> clientResponse.toEntity(byte[].class))
                .map(response -> {// Choose body depending on response status
                    byte[] responseBody = response.getBody();

                    if (responseBody == null) {
                        throw Exceptions.propagate(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_ERROR,
                                "Expected to receive a response body."));
                    }
                    String jsonBody = new String(responseBody);
                    JsonNode jsonNodeBody = null;
                    try {
                        jsonNodeBody = objectMapper.readTree(jsonBody);
                    } catch (IOException e) {
                        throw Exceptions.propagate(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR,
                                new String(responseBody),
                                e.getMessage()
                        ));
                    }
                    if (response.getStatusCode() != null && !response.getStatusCode().is2xxSuccessful()) {
                        if (jsonNodeBody.get("error") != null && jsonNodeBody.get("error").get("message") != null) {
                            throw Exceptions.propagate(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_ERROR,   jsonNodeBody.get("error").get("message").toString()));
                        }

                        throw Exceptions.propagate(new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_ERROR,
                            "Could not map request back to existing data"));
                    }

                    // This is the object with the original values in the referred row
                    final JsonNode jsonNode = getValuesMethod
                            .transformResponse(jsonNodeBody, methodConfig)
                            .get(0);

                    if (jsonNode == null) {
                        throw Exceptions.propagate(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_ERROR,
                                "No data found at this row index. Do you want to try inserting something first?"
                        ));
                    }

                    // This is the rowObject for original values
                    final RowObject returnedRowObject = this.getRowObjectFromBody(jsonNode);
                    final Map<String, String> valueMap = finalRowObjectFromBody.getValueMap();
                    // We replace these original values with new ones
                    final Map<String, String> returnedRowObjectValueMap = returnedRowObject.getValueMap();
                    boolean updatable = false;

                    for (Map.Entry<String, String> entry : returnedRowObjectValueMap.entrySet()) {
                        String k = entry.getKey();
                        if (valueMap.containsKey(k)) {
                            returnedRowObjectValueMap.put(k, valueMap.get(k));
                            updatable = true;
                        }
                    }

                    if (Boolean.FALSE.equals(updatable)) {
                        throw Exceptions.propagate(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_ERROR,
                                "Could not map to existing data. Nothing to update."
                        ));
                    }

                    methodConfig.setBody(returnedRowObject);
                    assert jsonNodeBody != null;
                    methodConfig.setSpreadsheetRange(jsonNodeBody.get("valueRanges").get(1).get("range").asText());
                    return methodConfig;
                });
    }

    @Override
    public WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, MethodConfig methodConfig) {

        RowObject rowObject = (RowObject) methodConfig.getBody();

        UriComponentsBuilder uriBuilder = getBaseUriBuilder(this.BASE_SHEETS_API_URL,
                methodConfig.getSpreadsheetId() /* spreadsheet Id */
                        + "/values/"
                        + URLEncoder.encode(methodConfig.getSpreadsheetRange(), StandardCharsets.UTF_8),  /* spreadsheet Range */
                true
        );

        uriBuilder.queryParam("valueInputOption", "USER_ENTERED");
        uriBuilder.queryParam("includeValuesInResponse", Boolean.TRUE);

        final List<String> objects = new ArrayList<>(rowObject.getValueMap().values());

        return webClient.method(HttpMethod.PUT)
                .uri(uriBuilder.build(true).toUri())
                .body(BodyInserters.fromValue(Map.of(
                        "range", methodConfig.getSpreadsheetRange(),
                        "majorDimension", "ROWS",
                        "values", List.of(objects)
                )));
    }

    @Override
    public JsonNode transformResponse(JsonNode response, MethodConfig methodConfig) {
        if (response == null) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Missing a valid response object.");
        }

        return this.objectMapper.valueToTree(Map.of("message", "Updated sheet successfully!"));
    }

    private RowObject getRowObjectFromBody(JsonNode body) {
        return new RowObject(
                this.objectMapper.convertValue(body, TypeFactory
                        .defaultInstance()
                        .constructMapType(LinkedHashMap.class, String.class, String.class)))
                .initialize();
    }

}
