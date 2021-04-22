package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.external.domains.RowObject;
import com.external.utils.SheetsUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.LinkedHashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * API reference: https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get
 */
@Slf4j
public class GetValuesMethod implements Method {

    ObjectMapper objectMapper;

    public GetValuesMethod(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    Pattern findAllRowsPattern = Pattern.compile("([a-zA-Z]*)\\d*:([a-zA-Z]*)\\d*");
    Pattern findOffsetRowPattern = Pattern.compile("(\\d+):");
    Pattern sheetRangePattern = Pattern.compile(".*!([a-zA-Z]*)\\d*:([a-zA-Z]*)\\d*");

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
                if (Integer.parseInt(methodConfig.getTableHeaderIndex()) <= 0) {
                    throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR,
                            "Unexpected value for table header index. Please use a number starting from 1");
                }
            } catch (NumberFormatException e) {
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR,
                        "Unexpected format for table header index. Please use a number starting from 1");
            }
        }
        if ("ROWS".equalsIgnoreCase(methodConfig.getQueryFormat())) {
            if (methodConfig.getRowOffset() == null || methodConfig.getRowOffset().isBlank()) {
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Missing required field Row offset");
            }
            int rowOffset = 0;
            try {
                rowOffset = Integer.parseInt(methodConfig.getRowOffset());
                if (rowOffset < 0) {
                    throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR,
                            "Unexpected value for row offset. Please use a number starting from 0");
                }

            } catch (NumberFormatException e) {
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR,
                        "Unexpected format for row offset. Please use a number starting from 0");
            }
            if (methodConfig.getRowLimit() == null || methodConfig.getRowLimit().isBlank()) {
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Missing required field Row limit");
            }
            int rowLimit = 1;
            try {
                rowLimit = Integer.parseInt(methodConfig.getRowLimit());
                if (rowLimit <= 0) {
                    throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR,
                            "Unexpected value for row limit. Please use a number starting from 1");
                }
            } catch (NumberFormatException e) {
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR,
                        "Unexpected format for row limit. Please use a number starting from 1");
            }
        } else if ("RANGE".equalsIgnoreCase(methodConfig.getQueryFormat())) {
            if (methodConfig.getSpreadsheetRange() == null || methodConfig.getSpreadsheetRange().isBlank()) {
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Missing required field Data Range");
            }
        } else {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Invalid query format");
        }

        return true;
    }

    @Override
    public WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, MethodConfig methodConfig) {

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
        if ("ROWS".equalsIgnoreCase(methodConfig.getQueryFormat())) {
            int rowOffset = 0;
            try {
                rowOffset = Integer.parseInt(methodConfig.getRowOffset());
            } catch (NumberFormatException e) {
                // Should have already been caught
            }
            int rowLimit = 1;
            try {
                rowLimit = Integer.parseInt(methodConfig.getRowLimit());
                return List.of(
                        "'" + methodConfig.getSheetName() + "'!" + tableHeaderIndex + ":" + tableHeaderIndex,
                        "'" + methodConfig.getSheetName() + "'!" + (tableHeaderIndex + rowOffset + 1) + ":" + (tableHeaderIndex + rowOffset + rowLimit));

            } catch (NumberFormatException e) {
                // Should have already been caught
            }
        } else if ("RANGE".equalsIgnoreCase(methodConfig.getQueryFormat())) {
            Matcher matcher = findAllRowsPattern.matcher(methodConfig.getSpreadsheetRange());
            matcher.find();
            return List.of(
                    "'" + methodConfig.getSheetName() + "'!" + matcher.group(1) + tableHeaderIndex + ":" + matcher.group(2) + tableHeaderIndex,
                    "'" + methodConfig.getSheetName() + "'!" + methodConfig.getSpreadsheetRange());
        }
        return List.of();
    }

    @Override
    public JsonNode transformResponse(JsonNode response, MethodConfig methodConfig) {
        if (response == null) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Missing a valid response object.");
        }

        ArrayNode valueRanges = (ArrayNode) response.get("valueRanges");
        ArrayNode headers = (ArrayNode) valueRanges.get(0).get("values");
        ArrayNode values = (ArrayNode) valueRanges.get(1).get("values");

        if (headers == null || values == null || headers.isEmpty()) {
            return this.objectMapper.createArrayNode();
        }

        final String headerRange = valueRanges.get(0).get("range").asText();
        final String valueRange = valueRanges.get(1).get("range").asText();
        headers = (ArrayNode) headers.get(0);

        Set<String> columnsSet = sanitizeHeaders(headers, headerRange, valueRange);

        final List<Map<String, String>> collectedCells = new LinkedList<>();
        final String[] headerArray = columnsSet.toArray(new String[columnsSet.size()]);
        final String range = valueRanges.get(1).get("range").asText();

        final Matcher matcher = findOffsetRowPattern.matcher(range);
        matcher.find();
        final int rowOffset = Integer.parseInt(matcher.group(1));
        final int tableHeaderIndex = Integer.parseInt(methodConfig.getTableHeaderIndex());
        for (int i = 0; i < values.size(); i++) {
            ArrayNode row = (ArrayNode) values.get(i);
            RowObject rowObject = new RowObject(
                    headerArray,
                    objectMapper.convertValue(row, String[].class),
                    rowOffset - tableHeaderIndex + i - 1);
            collectedCells.add(rowObject.getValueMap());
        }

        return this.objectMapper.valueToTree(collectedCells);
    }

    private Set<String> sanitizeHeaders(ArrayNode headers, String headerRange, String valueRange) {
        final Set<String> headerSet = new LinkedHashSet<>();
        int headerSize = headers.size();

        final Matcher matcher1 = sheetRangePattern.matcher(headerRange);
        matcher1.find();
        final int headerStart = SheetsUtil.getColumnNumber(matcher1.group(1));
        final int headerEnd = SheetsUtil.getColumnNumber(matcher1.group(2));

        final Matcher matcher2 = sheetRangePattern.matcher(valueRange);
        matcher2.find();
        final int valuesStart = SheetsUtil.getColumnNumber(matcher2.group(1));
        final int valuesEnd = SheetsUtil.getColumnNumber(matcher2.group(2));

        final int valueSize = (valuesEnd - valuesStart + 1);
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
}
