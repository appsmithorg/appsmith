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
import java.util.TreeMap;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

/**
 * API reference: https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/update
 */
public class BulkUpdateMethod implements Method {

    ObjectMapper objectMapper;

    public BulkUpdateMethod(ObjectMapper objectMapper) {
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
            bodyNode = this.objectMapper.readTree(methodConfig.getRowObjects());
        } catch (JsonProcessingException e) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR, methodConfig.getRowObjects(),
                    "Unable to parse request body. Expected a list of row objects.");
        }

        if (!bodyNode.isArray()) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR, "Request body was not an array.");
        }
        return true;
    }

    @Override
    public Mono<Object> executePrerequisites(MethodConfig methodConfig, OAuth2 oauth2) {
        WebClient client = WebClient.builder()
                .exchangeStrategies(EXCHANGE_STRATEGIES)
                .build();
        final GetValuesMethod getValuesMethod = new GetValuesMethod(this.objectMapper);

        Map<Integer, RowObject> rowObjectMapFromBody = null;
        try {
            rowObjectMapFromBody = this.getRowObjectMapFromBody(this.objectMapper.readTree(methodConfig.getRowObjects()));
        } catch (JsonProcessingException e) {
            // Should never enter here
        }

        assert rowObjectMapFromBody != null;
        final Integer rowStart = ((TreeMap<Integer, RowObject>) rowObjectMapFromBody).firstKey();
        final Integer rowEnd = ((TreeMap<Integer, RowObject>) rowObjectMapFromBody).lastKey();
        final MethodConfig newMethodConfig = methodConfig
                .toBuilder()
                .queryFormat("ROWS")
                .rowOffset(String.valueOf(rowStart))
                .rowLimit(String.valueOf(rowEnd - rowStart + 1))
                .build();

        getValuesMethod.validateMethodRequest(newMethodConfig);

        Map<Integer, RowObject> finalRowObjectMapFromBody = rowObjectMapFromBody;
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


                    if (response.getStatusCode() != null && !response.getStatusCode().is2xxSuccessful()) {
                        if (jsonNodeBody.get("error") != null && jsonNodeBody.get("error").get("message") !=null) {
                            throw Exceptions.propagate(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_ERROR,   jsonNodeBody.get("error").get("message").toString()));
                        }

                        throw Exceptions.propagate(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_ERROR,
                                "Could not map request back to existing data"));
                    }

                    // This is the object with the original values in the referred row
                    final JsonNode jsonNode = getValuesMethod
                            .transformResponse(jsonNodeBody, methodConfig);

                    if (jsonNode == null || jsonNode.isEmpty()) {
                        throw Exceptions.propagate(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_ERROR,
                                "No data found at these row indices. Do you want to try inserting something first?"
                        ));
                    }

                    // This is the rowObject for original values
                    final List<RowObject> returnedRowObjects =
                            new ArrayList<>(this.getRowObjectMapFromBody(jsonNode).values());

                    boolean updatable = false;

                    // We replace these original values with new ones
                    for (RowObject rowObject : returnedRowObjects) {
                        if (finalRowObjectMapFromBody.containsKey(rowObject.getCurrentRowIndex())) {
                            final Map<String, String> valueMap =
                                    finalRowObjectMapFromBody
                                            .get(rowObject.getCurrentRowIndex())
                                            .getValueMap();
                            // We replace these original values with new ones
                            final Map<String, String> returnedRowObjectValueMap = rowObject.getValueMap();
                            for (Map.Entry<String, String> entry : returnedRowObjectValueMap.entrySet()) {
                                String k = entry.getKey();
                                if (valueMap.containsKey(k)) {
                                    updatable = true;
                                    returnedRowObjectValueMap.put(k, valueMap.get(k));
                                }
                            }
                        }
                    }

                    if (Boolean.FALSE.equals(updatable)) {
                        throw Exceptions.propagate(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_ERROR,
                                "Could not map to existing data. Nothing to update."
                        ));
                    }

                    methodConfig.setBody(returnedRowObjects);
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
                        + URLEncoder.encode(methodConfig.getSpreadsheetRange(), StandardCharsets.UTF_8),
                true
        );

        uriBuilder.queryParam("valueInputOption", "USER_ENTERED");
        uriBuilder.queryParam("includeValuesInResponse", Boolean.TRUE);

        final List<RowObject> body1 = (List<RowObject>) methodConfig.getBody();
        List<List<Object>> collect = body1.stream()
                .map(row -> row.getAsSheetValues(body1.get(0).getValueMap().keySet().toArray(new String[0])))
                .collect(Collectors.toList());

        return webClient.method(HttpMethod.PUT)
                .uri(uriBuilder.build(true).toUri())
                .body(BodyInserters.fromValue(Map.of(
                        "range", methodConfig.getSpreadsheetRange(),
                        "majorDimension", "ROWS",
                        "values", collect
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

    private Map<Integer, RowObject> getRowObjectMapFromBody(JsonNode body) {

        if (!body.isArray() || body.isEmpty()) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR,
                    "Expected an array of row objects");
        }
        return StreamSupport
                .stream(body.spliterator(), false)
                .map(rowJson -> new RowObject(
                        this.objectMapper.convertValue(rowJson, TypeFactory
                                .defaultInstance()
                                .constructMapType(LinkedHashMap.class, String.class, String.class)))
                        .initialize())
                .collect(Collectors.toMap(
                        RowObject::getCurrentRowIndex,
                        rowObject -> rowObject,
                        (r1, r2) -> r2,
                        TreeMap::new
                ));

    }

}
