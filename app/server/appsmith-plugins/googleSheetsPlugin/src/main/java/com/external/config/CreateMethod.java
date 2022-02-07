package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.external.domains.RowObject;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.TypeFactory;
import com.google.api.services.sheets.v4.model.CellData;
import com.google.api.services.sheets.v4.model.ExtendedValue;
import com.google.api.services.sheets.v4.model.GridData;
import com.google.api.services.sheets.v4.model.RowData;
import com.google.api.services.sheets.v4.model.Sheet;
import com.google.api.services.sheets.v4.model.Spreadsheet;
import com.google.api.services.sheets.v4.model.SpreadsheetProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.StreamSupport;

/**
 * API reference: https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/create
 */
@Slf4j
public class CreateMethod implements Method {

    ObjectMapper objectMapper;

    public CreateMethod(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean validateMethodRequest(MethodConfig methodConfig) {
        if (methodConfig.getSpreadsheetName() == null || methodConfig.getSpreadsheetName().isBlank()) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Missing required field Spreadsheet Name");
        }
        return true;
    }

    @Override
    public WebClient.RequestHeadersSpec<?> getClient(WebClient webClient, MethodConfig methodConfig) {

        Spreadsheet spreadsheet = new Spreadsheet();
        spreadsheet.setProperties(new SpreadsheetProperties().set("title", methodConfig.getSpreadsheetName()));
        var ref = new Object() {
            Integer startingRow = null;
            Integer endingRow = null;
            final Set<String> headers = new LinkedHashSet<>();
            final Set<String> unknownHeaders = new LinkedHashSet<>();
        };
        final String body = methodConfig.getRowObjects();
        if (body != null && !body.isBlank()) {

            try {
                JsonNode bodyNode = this.objectMapper.readTree(body);

                if (!bodyNode.isArray()) {
                    throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_ERROR, "Request body was not an array.");
                }

                Sheet sheet = new Sheet();
                spreadsheet.setSheets(List.of(sheet));
                GridData gridData = new GridData();
                sheet.setData(List.of(gridData));

                final Map<Integer, RowObject> collectedRows = StreamSupport.stream(bodyNode.spliterator(), false)
                        .map(rowJson ->
                        {
                            RowObject rowObject = new RowObject(
                                    this.objectMapper.convertValue(rowJson, TypeFactory
                                            .defaultInstance()
                                            .constructMapType(LinkedHashMap.class, String.class, String.class)))
                                    .initialize();
                            if (ref.startingRow == null || rowObject.getCurrentRowIndex() < ref.startingRow) {
                                ref.startingRow = rowObject.getCurrentRowIndex();
                            }

                            if (ref.endingRow == null || rowObject.getCurrentRowIndex() > ref.endingRow) {
                                ref.endingRow = rowObject.getCurrentRowIndex();
                            }

                            if (ref.headers.isEmpty()) {
                                ref.headers.addAll(rowObject.getValueMap().keySet());
                            } else {
                                ref.unknownHeaders.addAll(rowObject.getValueMap().keySet());
                            }

                            return rowObject;
                        })
                        .collect(Collectors.toUnmodifiableMap(
                                RowObject::getCurrentRowIndex,
                                rowObject -> rowObject,
                                (a, b) -> b));

                ref.headers.addAll(ref.unknownHeaders);

//                if (!ref.unknownHeaders.isEmpty()) {
//                    throw new AppsmithPluginException(
//                            AppsmithPluginError.PLUGIN_ERROR,
//                            "Unable to parse request body. " +
//                                    "Expected all row objects to have same headers. " +
//                                    "Found extra headers:"
//                                    + ref.unknownHeaders);
//                }

                ref.startingRow = ref.startingRow > 0 ? ref.startingRow : 0;
                gridData.setStartRow(0);
                gridData.setStartColumn(0);

                final String[] headerArray = ref.headers.toArray(new String[ref.headers.size()]);

                List<RowData> collect = IntStream.range(0, ref.endingRow + 1)
                        .mapToObj(rowIndex -> collectedRows.getOrDefault(rowIndex, new RowObject(new LinkedHashMap<>())))
                        .map(row -> row.getAsSheetRowData(headerArray))
                        .collect(Collectors.toCollection(ArrayList::new));

                collect.add(0, new RowData()
                        .setValues(Arrays.stream(headerArray)
                                .map(header -> new CellData().setUserEnteredValue(new ExtendedValue().setStringValue(header)))
                                .collect(Collectors.toList())));

                gridData.setRowData(collect);

            } catch (JsonProcessingException e) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Unable to parse request body. Expected a list of row objects.");
            }
        }

        UriComponentsBuilder uriBuilder = getBaseUriBuilder(this.BASE_SHEETS_API_URL, "", true);

        return webClient.method(HttpMethod.POST)
                .uri(uriBuilder.build(true).toUri())
                .body(BodyInserters.fromValue(spreadsheet));
    }
}
