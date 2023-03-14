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
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.type.TypeFactory;
import com.google.api.services.sheets.v4.model.ValueRange;
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
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

/**
 * API reference: https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/append
 */
public class RowsBulkAppendMethod implements ExecutionMethod {

    ObjectMapper objectMapper;

    public RowsBulkAppendMethod(ObjectMapper objectMapper) {
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
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        ErrorMessages.EMPTY_ROW_ARRAY_OBJECT_MESSAGE);
            }
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,e.getMessage());
        } catch (JsonProcessingException e) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_JSON_PARSE_ERROR,
                    methodConfig.getRowObjects(),
                    ErrorMessages.EXPECTED_LIST_OF_ROW_OBJECTS_ERROR_MSG + " Error: " + e.getMessage()
            );
        }

        if (!bodyNode.isArray()) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, ErrorMessages.REQUEST_BODY_NOT_ARRAY);
        }
        return true;
    }

    /**
     * We need to execute this prerequisite even for append, so that we can maintain the column ordering as
     * received from the sheet itself.
     */
    @Override
    public Mono<Object> executePrerequisites(MethodConfig methodConfig, OAuth2 oauth2) {
        WebClient client = WebClientUtils.builder()
                .exchangeStrategies(EXCHANGE_STRATEGIES)
                .build();
        final RowsGetMethod rowsGetMethod = new RowsGetMethod(this.objectMapper);

        List<RowObject> rowObjectListFromBody = null;
        try {
            JsonNode body = this.objectMapper.readTree(methodConfig.getRowObjects());

            if ( body.isEmpty()) {
                return Mono.empty();
            }

            rowObjectListFromBody = this.getRowObjectListFromBody(body);
        } catch (JsonProcessingException e) {
            // Should never enter here
        }

        assert rowObjectListFromBody != null;
        RowObject rowObjectFromBody = rowObjectListFromBody.get(0);
        assert rowObjectFromBody != null;
        final int rowStart = Integer.parseInt(methodConfig.getTableHeaderIndex());
        final int rowEnd = rowStart + 1;
        final MethodConfig newMethodConfig = methodConfig
                .toBuilder()
                .queryFormat("RANGE")
                .spreadsheetRange(rowStart + ":" + rowEnd)
                .projection(new ArrayList<>())
                .build();

        rowsGetMethod.validateExecutionMethodRequest(newMethodConfig);

        List<RowObject> finalRowObjectListFromBody = rowObjectListFromBody;
        return rowsGetMethod
                .getExecutionClient(client, newMethodConfig)
                .headers(headers -> headers.set(
                        "Authorization",
                        "Bearer " + oauth2.getAuthenticationResponse().getToken()))
                .exchange()
                .flatMap(clientResponse -> clientResponse.toEntity(byte[].class))
                .map(response -> {// Choose body depending on response status
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
                                    GSheetsPluginError.QUERY_EXECUTION_FAILED,   jsonNodeBody.get("error").get("message").toString()));
                        }

                        throw Exceptions.propagate(new AppsmithPluginException(
                                GSheetsPluginError.QUERY_EXECUTION_FAILED,
                                ErrorMessages.RESPONSE_DATA_MAPPING_FAILED_ERROR_MSG));
                    }

                    if (jsonNodeBody == null) {
                        throw Exceptions.propagate(new AppsmithPluginException(
                                GSheetsPluginError.QUERY_EXECUTION_FAILED,
                                ErrorMessages.EXPECTED_EXISTING_HEADERS_IN_RESPONSE_ERROR_MSG));
                    }

                    ArrayNode valueRanges = (ArrayNode) jsonNodeBody.get("valueRanges");
                    ArrayNode values = (ArrayNode) valueRanges.get(0).get("values");

                    // We replace these original values with new ones
                    if (values != null && !values.isEmpty()) {
                        ArrayNode headers = (ArrayNode) values.get(0);
                        if (headers != null && !headers.isEmpty()) {
                            for (RowObject rowObject : finalRowObjectListFromBody) {
                                final Map<String, String> valueMap = new LinkedHashMap<>();
                                boolean validValues = false;
                                final Map<String, String> inputValueMap = rowObject.getValueMap();
                                for (JsonNode header : headers) {
                                    final String value = inputValueMap.getOrDefault(header.asText(), null);
                                    if (value != null) {
                                        validValues = true;
                                    }
                                    valueMap.put(header.asText(), value);
                                }
                                if (Boolean.TRUE.equals(validValues)) {
                                    rowObject.setValueMap(valueMap);
                                } else {
                                    throw Exceptions.propagate(new AppsmithPluginException(
                                            GSheetsPluginError.RESPONSE_PROCESSING_ERROR,
                                            ErrorMessages.RESPONSE_DATA_MAPPING_FAILED_ERROR_MSG));
                                }
                            }

                            methodConfig.setBody(finalRowObjectListFromBody);
                            return methodConfig;
                        }
                    }

                    final LinkedHashMap<String, String> headerMap =
                            finalRowObjectListFromBody
                                    .stream()
                                    .map(RowObject::getValueMap)
                                    .flatMap(x -> x.keySet().stream())
                                    .collect(Collectors.toMap(x -> x, x -> x, (a, b) -> a, LinkedHashMap::new));
                    finalRowObjectListFromBody.add(0, new RowObject(headerMap));

                    methodConfig.setBody(finalRowObjectListFromBody);
                    return methodConfig;
                });
    }

    @Override
    public WebClient.RequestHeadersSpec<?> getExecutionClient(WebClient webClient, MethodConfig methodConfig) {

        final String range = "'" + methodConfig.getSheetName() + "'!" +
                methodConfig.getTableHeaderIndex() + ":" + methodConfig.getTableHeaderIndex();

        UriComponentsBuilder uriBuilder = getBaseUriBuilder(this.BASE_SHEETS_API_URL,
                methodConfig.getSpreadsheetId() /* spreadsheet Id */
                        + "/values/"
                        + URLEncoder.encode(range, StandardCharsets.UTF_8)
                        + ":append",
                true);

        uriBuilder.queryParam("valueInputOption", "USER_ENTERED");
        uriBuilder.queryParam("includeValuesInResponse", Boolean.FALSE);
        uriBuilder.queryParam("insertDataOption", "INSERT_ROWS");

        final List<RowObject> body1 = (List<RowObject>) methodConfig.getBody();
        List<List<Object>> collect = body1.stream()
                .map(row -> row.getAsSheetValues(body1.get(0).getValueMap().keySet().toArray(new String[0])))
                .collect(Collectors.toList());

        final ValueRange valueRange = new ValueRange();
        valueRange.setMajorDimension("ROWS");
        valueRange.setRange(range);
        valueRange.setValues(collect);
        return webClient.method(HttpMethod.POST)
                .uri(uriBuilder.build(true).toUri())
                .body(BodyInserters.fromValue(valueRange));
    }

    @Override
    public JsonNode transformExecutionResponse(JsonNode response, MethodConfig methodConfig) {
        if (response == null) {
            throw new AppsmithPluginException(
                    GSheetsPluginError.QUERY_EXECUTION_FAILED,
                    ErrorMessages.MISSING_VALID_RESPONSE_ERROR_MSG);
        }

        return this.objectMapper.valueToTree(Map.of("message", "Inserted rows successfully!"));
    }

    private List<RowObject> getRowObjectListFromBody(JsonNode body) {

        if (!body.isArray()) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    ErrorMessages.EXPECTED_ARRAY_OF_ROW_OBJECT_MESSAGE);
        }

        if (body.isEmpty()) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    ErrorMessages.EMPTY_ROW_ARRAY_OBJECT_MESSAGE);
        }

        return StreamSupport
                .stream(body.spliterator(), false)
                .map(rowJson -> new RowObject(
                        this.objectMapper.convertValue(
                                rowJson,
                                TypeFactory
                                        .defaultInstance()
                                        .constructMapType(LinkedHashMap.class, String.class, String.class))))
                .collect(Collectors.toList());

    }
}
