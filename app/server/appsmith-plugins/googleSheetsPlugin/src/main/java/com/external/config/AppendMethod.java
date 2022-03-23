package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.OAuth2;
import com.external.domains.RowObject;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.type.TypeFactory;
import com.google.api.services.sheets.v4.model.ValueRange;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
        JsonNode bodyNode;
        try {
            bodyNode = this.objectMapper.readTree(methodConfig.getRowObject());
        } catch (JsonProcessingException e) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR, methodConfig.getRowObject(),
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
                .map(response -> {
                    // Choose body depending on response status
                    byte[] responseBody = response.getBody();

                    if (responseBody == null) {
                        throw Exceptions.propagate(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_ERROR,
                                "Expected to receive a response body."));
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
                    if (jsonNodeBody == null) {
                        throw Exceptions.propagate(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_ERROR,
                                "Expected to receive a response of existing headers."));
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

                    ArrayNode valueRanges = (ArrayNode) jsonNodeBody.get("valueRanges");
                    ArrayNode values = (ArrayNode) valueRanges.get(0).get("values");

                    // We replace these original values with new ones
                    if (values != null && !values.isEmpty()) {
                        ArrayNode headers = (ArrayNode) values.get(0);
                        if (headers != null && !headers.isEmpty()) {
                            final Map<String, String> valueMap = new LinkedHashMap<>();
                            boolean validValues = false;
                            final Map<String, String> inputValueMap = finalRowObjectFromBody.getValueMap();

                            for (JsonNode header : headers) {
                                final String value = inputValueMap.getOrDefault(header.asText(), null);
                                if (value != null) {
                                    validValues = true;
                                }
                                valueMap.put(header.asText(), value);
                            }
                            if (Boolean.TRUE.equals(validValues)) {
                                finalRowObjectFromBody.setValueMap(valueMap);
                            } else {
                                throw Exceptions.propagate(new AppsmithPluginException(
                                        AppsmithPluginError.PLUGIN_ERROR,
                                        "Could not map values to existing data."));
                            }
                            methodConfig.setBody(finalRowObjectFromBody);
                            return methodConfig;
                        }
                    }

                    final LinkedHashMap<String, String> headerMap = new LinkedHashMap<>(finalRowObjectFromBody.getValueMap());
                    headerMap.replaceAll((k, v) -> k);
                    methodConfig.setBody(List.of(new RowObject(headerMap), finalRowObjectFromBody));

                    return methodConfig;

                });
    }

    @Override
    public WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, MethodConfig methodConfig) {

        final String range = "'" + methodConfig.getSheetName() + "'!" +
                methodConfig.getTableHeaderIndex() + ":" + methodConfig.getTableHeaderIndex();

        UriComponentsBuilder uriBuilder = getBaseUriBuilder(this.BASE_SHEETS_API_URL,
                methodConfig.getSpreadsheetId() /* spreadsheet Id */
                        + "/values/"
                        + URLEncoder.encode(range, StandardCharsets.UTF_8)
                        + ":append", true);

        uriBuilder.queryParam("valueInputOption", "USER_ENTERED");
        uriBuilder.queryParam("includeValuesInResponse", Boolean.FALSE);

        List<List<Object>> collect;
        if (methodConfig.getBody() instanceof RowObject) {
            final RowObject body1 = (RowObject) methodConfig.getBody();
            collect = List.of(body1.getAsSheetValues(body1.getValueMap().keySet().toArray(new String[0])));
        } else {
            final List<RowObject> body1 = (List<RowObject>) methodConfig.getBody();
            collect = body1.stream()
                    .map(row -> row.getAsSheetValues(body1.get(0).getValueMap().keySet().toArray(new String[0])))
                    .collect(Collectors.toList());
        }
        final ValueRange valueRange = new ValueRange();
        valueRange.setMajorDimension("ROWS");
        valueRange.setRange(range);
        valueRange.setValues(collect);
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
                .constructMapType(LinkedHashMap.class, String.class, String.class)));
    }
}
