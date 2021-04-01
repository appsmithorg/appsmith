package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.external.domains.RowObject;
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

    Pattern findAllRowsPattern = Pattern.compile("\\d+");
    Pattern findOffsetRowPattern = Pattern.compile("(\\d+):");

    @Override
    public boolean validateMethodRequest(MethodConfig methodConfig, String body) {
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
        if ("ROWS".equalsIgnoreCase(methodConfig.getQueryFormat())) {
            if (methodConfig.getSpreadsheetRange() == null || methodConfig.getSpreadsheetRange().isBlank()) {
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Missing required field Row offset");
            }
            int rowOffset = 1;
            try {
                rowOffset = Integer.parseInt(methodConfig.getSpreadsheetRange());
                if (rowOffset <= 0) {
                    throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR,
                            "Unexpected value for row offset. Please use a number starting from 1");
                }

            } catch (NumberFormatException e) {
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR,
                        "Unexpected format for row offset. Please use a number starting from 1");
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
    public WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, MethodConfig methodConfig, String body) {

        final List<String> ranges = validateInputs(methodConfig, body);

        UriComponentsBuilder uriBuilder = getBaseUriBuilder(this.BASE_SHEETS_API_URL,
                methodConfig.getSpreadsheetId() /* spreadsheet Id */
                        + "/values:batchGet"
        );
        uriBuilder.queryParam("majorDimension", "ROWS");
        uriBuilder.queryParam("ranges", ranges);

        return webClient.method(HttpMethod.GET)
                .uri(uriBuilder.build(true).toUri())
                .body(BodyInserters.empty());
    }

    private List<String> validateInputs(MethodConfig methodConfig, String body) {
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
            int rowOffset = 1;
            try {
                rowOffset = Integer.parseInt(methodConfig.getSpreadsheetRange());
            } catch (NumberFormatException e) {
                // Should have already been caught
            }
            int rowLimit = 1;
            try {
                rowLimit = Integer.parseInt(methodConfig.getRowLimit());
                return List.of(
                        tableHeaderIndex + ":" + tableHeaderIndex,
                        (tableHeaderIndex + rowOffset) + ":" + (tableHeaderIndex + rowOffset + rowLimit - 1));

            } catch (NumberFormatException e) {
                // Should have already been caught
            }
        } else if ("RANGE".equalsIgnoreCase(methodConfig.getQueryFormat())) {
            Matcher matcher = findAllRowsPattern.matcher(methodConfig.getSpreadsheetRange());
            final String tableHeaderRange = matcher.replaceAll(String.valueOf(tableHeaderIndex));
            return List.of(
                    tableHeaderRange,
                    methodConfig.getSpreadsheetRange());
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
        if (headers == null || values == null || headers.size() == 0) {
            return this.objectMapper.createArrayNode();
        }
        headers = (ArrayNode) headers.get(0);

        Set<String> columnsSet = new LinkedHashSet<>();

        // Manipulation to find valid headers for all columns
        for (int i = 0; i < headers.size(); i++) {
            String headerValue = headers.get(i).asText();
            if (headerValue.isBlank()) {
                headerValue = "Column-" + (i + 1);
            }

            int count = 1;
            String tempHeaderValue = headerValue;
            while (columnsSet.contains(tempHeaderValue)) {
                tempHeaderValue += "_" + count++;
            }
            headerValue = tempHeaderValue;

            columnsSet.add(headerValue);
        }

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
                    rowOffset - tableHeaderIndex + i);
            collectedCells.add(rowObject.getValueMap());
        }

        return this.objectMapper.valueToTree(collectedCells);
    }
}
