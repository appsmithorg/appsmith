package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.services.FilterDataService;
import com.external.domains.RowObject;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
public class GetStructureMethod implements ExecutionMethod, TriggerMethod {

    ObjectMapper objectMapper;
    FilterDataService filterDataService;

    public GetStructureMethod(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.filterDataService = FilterDataService.getInstance();
    }

    // Used to capture the range of columns in this request. The handling for this regex makes sure that
    // all possible combinations of A1 notation for a range map to a common format
    Pattern findAllRowsPattern = Pattern.compile("([a-zA-Z]*)\\d*:([a-zA-Z]*)\\d*");

    // The starting row for a range is captured using this pattern to find its relative index from table heading
    Pattern findOffsetRowPattern = Pattern.compile("(\\d+):");

    @Override
    public boolean validateExecutionMethodRequest(MethodConfig methodConfig) {
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
        } else {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                    "Unexpected format for table header index. Please use a number starting from 1");
        }
        return true;
    }

    @Override
    public WebClient.RequestHeadersSpec<?> getExecutionClient(WebClient webClient, MethodConfig methodConfig) {

        final List<String> ranges = validateInputs(methodConfig);

        UriComponentsBuilder uriBuilder = getBaseUriBuilder(this.BASE_SHEETS_API_URL,
                methodConfig.getSpreadsheetId() /* spreadsheet Id */
                        + "/values:batchGet"
        );
        uriBuilder.queryParam("majorDimension", "ROWS");
        uriBuilder.queryParam("ranges", ranges);

        return webClient.method(HttpMethod.GET)
                .uri(uriBuilder.build(false).toUri())
                .body(BodyInserters.empty());
    }

    private List<String> validateInputs(MethodConfig methodConfig) {
        // Setting default values
        int rowOffset = 0;
        int rowLimit = 1; //Get header and next row for types
        int tableHeaderIndex = 1;

        if (methodConfig.getTableHeaderIndex() != null && !methodConfig.getTableHeaderIndex().isBlank()) {
            try {
                tableHeaderIndex = Integer.parseInt(methodConfig.getTableHeaderIndex());
                if (tableHeaderIndex <= 0) {
                    tableHeaderIndex = 1;
                }
            } catch (NumberFormatException e) {
                // Should have already been caught
            }
        }

        return List.of(
                "'" + methodConfig.getSheetName() + "'!" + tableHeaderIndex + ":" + tableHeaderIndex,
                "'" + methodConfig.getSheetName() + "'!" + (tableHeaderIndex + rowOffset + 1) + ":" + (tableHeaderIndex + rowOffset + rowLimit));
    }

    @Override
    public JsonNode transformExecutionResponse(JsonNode response, MethodConfig methodConfig) {
        if (response == null) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Missing a valid response object.");
        }

        ArrayNode valueRanges = (ArrayNode) response.get("valueRanges");
        ArrayNode headers = (ArrayNode) valueRanges.get(0).get("values");
        ArrayNode values = valueRanges.get(1) != null ? (ArrayNode) valueRanges.get(1).get("values") : null;
        int valueSize = 0;

        if (headers == null || headers.isEmpty()) {
            return this.objectMapper.createArrayNode();
        }
        if (values != null) {
            for (int i = 0; i < values.size(); i++) {
                valueSize = Math.max(valueSize, values.get(i).size());
            }
        }

        headers = (ArrayNode) headers.get(0);
        Set<String> columnsSet = sanitizeHeaders(headers, valueSize);
        ArrayNode preFilteringResponse = null;
        final List<Map<String, String>> collectedCells = new LinkedList<>();
        final String[] headerArray = columnsSet.toArray(new String[0]);

        if (values != null && values.size() > 0) {
            final String valueRange = valueRanges.get(1).get("range").asText();
            final Matcher matcher = findOffsetRowPattern.matcher(valueRange);
            matcher.find();
            final int rowOffset = Integer.parseInt(matcher.group(1));
            final int tableHeaderIndex = Integer.parseInt(methodConfig.getTableHeaderIndex());

            for (int i = 0; i < values.size(); i++) {
                ArrayNode row = (ArrayNode) values.get(i);
                RowObject rowObject = new RowObject( headerArray,
                        objectMapper.convertValue(row, String[].class),
                        rowOffset - tableHeaderIndex + i - 1);
                collectedCells.add(rowObject.getValueMap());
            }
        } else {
            RowObject rowObject = new RowObject(headerArray, new String[0], 0);
            collectedCells.add(rowObject.getValueMap());

        }

        preFilteringResponse = this.objectMapper.valueToTree(collectedCells);

        return preFilteringResponse;
    }

    private Set<String> sanitizeHeaders(ArrayNode headers, int valueSize) {
        final Set<String> headerSet = new LinkedHashSet<>();
        int headerSize = headers.size();
        final int size = Math.max(headerSize, valueSize);

        // Manipulation to find valid headers for all columns
        for (int j = 0; j < size; j++) {
            String headerValue = "";

            if (j < headerSize) {
                headerValue = headers.get(j).asText();
            }
            if (headerValue.isBlank()) {
                headerValue = "Column-" + (j + 1);
            }

            int count = 1;
            String tempHeaderValue = headerValue;
            while (headerSet.contains(tempHeaderValue)) {
                tempHeaderValue += "_" + count++;
            }
            headerValue = tempHeaderValue;

            headerSet.add(headerValue);
        }

        return headerSet;
    }

    @Override
    public boolean validateTriggerMethodRequest(MethodConfig methodConfig) {
        return this.validateExecutionMethodRequest(methodConfig);
    }

    @Override
    public WebClient.RequestHeadersSpec<?> getTriggerClient(WebClient webClient, MethodConfig methodConfig) {
        return this.getExecutionClient(webClient, methodConfig);
    }

    @Override
    public JsonNode transformTriggerResponse(JsonNode response, MethodConfig methodConfig) {
        if (response == null) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Missing a valid response object.");
        }

        ArrayNode valueRanges = (ArrayNode) response.get("valueRanges");
        ArrayNode headers = (ArrayNode) valueRanges.get(0).get("values");
        ArrayNode values = valueRanges.get(1) != null ? (ArrayNode) valueRanges.get(1).get("values") : null;
        int valueSize = 0;

        if (headers == null || headers.isEmpty()) {
            return this.objectMapper.createArrayNode();
        }
        if (values != null) {
            for (int i = 0; i < values.size(); i++) {
                valueSize = Math.max(valueSize, values.get(i).size());
            }
        }

        headers = (ArrayNode) headers.get(0);
        Set<String> columnsSet = sanitizeHeaders(headers, valueSize);

        List<Map<String, String>> columnsList = new ArrayList<>();
        columnsSet
                .stream()
                .forEach(columnName -> {
                    columnsList.add(Map.of(
                            "label", columnName,
                            "value", columnName
                    ));
                });


        return this.objectMapper.valueToTree(columnsList);
    }
}
