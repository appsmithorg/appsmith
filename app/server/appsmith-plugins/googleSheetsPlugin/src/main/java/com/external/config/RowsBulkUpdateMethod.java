package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.OAuth2;
import com.appsmith.util.WebClientUtils;
import com.external.constants.ErrorMessages;
import com.external.domains.RowObject;
import com.external.plugins.exceptions.GSheetsPluginError;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.TypeFactory;
import org.springframework.http.HttpMethod;
import org.springframework.util.StringUtils;
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
public class RowsBulkUpdateMethod implements ExecutionMethod {

    ObjectMapper objectMapper;

    public RowsBulkUpdateMethod(ObjectMapper objectMapper) {
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
        if (methodConfig.getTableHeaderIndex() != null && !methodConfig.getTableHeaderIndex().isBlank()) {
            try {
                if (Integer.parseInt(methodConfig.getTableHeaderIndex()) <= 0) {
                    throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            ErrorMessages.INVALID_TABLE_HEADER_INDEX);
                }
            } catch (NumberFormatException e) {
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        ErrorMessages.INVALID_TABLE_HEADER_INDEX,
                        e.getMessage());
            }
        } else {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    ErrorMessages.INVALID_TABLE_HEADER_INDEX);
        }
        JsonNode bodyNode;
        try {
            bodyNode = this.objectMapper.readTree(methodConfig.getRowObjects());
        } catch (IllegalArgumentException e) {
            if (!StringUtils.hasLength(methodConfig.getRowObjects())) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        ErrorMessages.EMPTY_UPDATE_ROW_OBJECTS_MESSAGE,
                        e.getMessage()
                );
            }
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,e.getMessage());
        } catch (JsonProcessingException e) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR,
                    methodConfig.getRowObjects(),
                    ErrorMessages.EXPECTED_LIST_OF_ROW_OBJECTS_ERROR_MSG  + " Error: " + e.getMessage()
            );
        }

        if (!bodyNode.isArray()) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, ErrorMessages.REQUEST_BODY_NOT_ARRAY);
        }
        return true;
    }

    @Override
    public Mono<Object> executePrerequisites(MethodConfig methodConfig, OAuth2 oauth2) {
        WebClient client = WebClientUtils.builder()
                .exchangeStrategies(EXCHANGE_STRATEGIES)
                .build();
        final RowsGetMethod rowsGetMethod = new RowsGetMethod(this.objectMapper);

        Map<Integer, RowObject> rowObjectMapFromBody = null;
        try {
            rowObjectMapFromBody = this.getRowObjectMapFromBody(this.objectMapper.readTree(methodConfig.getRowObjects()));
        } catch (JsonProcessingException e) {
            // Should never enter here
        }

        assert rowObjectMapFromBody != null;
        final Integer rowStart = Integer.parseInt(methodConfig.getTableHeaderIndex()) + ((TreeMap<Integer, RowObject>) rowObjectMapFromBody).firstKey() + 1;
        final Integer rowEnd = Integer.parseInt(methodConfig.getTableHeaderIndex()) + ((TreeMap<Integer, RowObject>) rowObjectMapFromBody).lastKey() + 1;
        final MethodConfig newMethodConfig = methodConfig
                .toBuilder()
                .queryFormat("RANGE")
                .spreadsheetRange(rowStart + ":" + rowEnd)
                .projection(new ArrayList<>())
                .build();

        rowsGetMethod.validateExecutionMethodRequest(newMethodConfig);

        Map<Integer, RowObject> finalRowObjectMapFromBody = rowObjectMapFromBody;
        return rowsGetMethod
                .getExecutionClient(client, newMethodConfig)
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
                                GSheetsPluginError.QUERY_EXECUTION_FAILED,
                                ErrorMessages.NULL_RESPONSE_BODY_ERROR_MSG));
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
                                        GSheetsPluginError.QUERY_EXECUTION_FAILED,
                                        ErrorMessages.UNSUCCESSFUL_RESPONSE_ERROR_MSG,
                                        jsonNodeBody.get("error").get("message").toString(),
                                        "HTTP " + response.getStatusCode()
                                    )
                            );
                        }

                        throw Exceptions.propagate(new AppsmithPluginException(
                                GSheetsPluginError.QUERY_EXECUTION_FAILED,
                                ErrorMessages.RESPONSE_DATA_MAPPING_FAILED_ERROR_MSG));
                    }

                    // This is the object with the original values in the referred row
                    final JsonNode jsonNode = rowsGetMethod
                            .transformExecutionResponse(jsonNodeBody, methodConfig);

                    if (jsonNode == null || jsonNode.isEmpty()) {
                        throw Exceptions.propagate(new AppsmithPluginException(
                                GSheetsPluginError.QUERY_EXECUTION_FAILED,
                                ErrorMessages.NO_DATA_FOUND_CURRENT_ROW_INDEX_ERROR_MSG
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
                                GSheetsPluginError.QUERY_EXECUTION_FAILED,
                                ErrorMessages.NOTHING_TO_UPDATE_ERROR_MSG
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
    public WebClient.RequestHeadersSpec<?> getExecutionClient(WebClient webClient, MethodConfig methodConfig) {

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
    public JsonNode transformExecutionResponse(JsonNode response, MethodConfig methodConfig) {
        if (response == null) {
            throw new AppsmithPluginException(
                    GSheetsPluginError.QUERY_EXECUTION_FAILED,
                    ErrorMessages.MISSING_VALID_RESPONSE_ERROR_MSG);
        }

        return this.objectMapper.valueToTree(Map.of("message", "Updated sheet successfully!"));
    }

    private Map<Integer, RowObject> getRowObjectMapFromBody(JsonNode body) {

        if (!body.isArray()) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    ErrorMessages.EXPECTED_ARRAY_OF_ROW_OBJECT_MESSAGE);
        }

        if (body.isEmpty()) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    ErrorMessages.EMPTY_UPDATE_ROW_OBJECTS_MESSAGE);
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
