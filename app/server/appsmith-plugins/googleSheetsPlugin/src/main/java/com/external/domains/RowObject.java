package com.external.domains;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.external.constants.GoogleSheets;
import com.google.api.services.sheets.v4.model.CellData;
import com.google.api.services.sheets.v4.model.ExtendedValue;
import com.google.api.services.sheets.v4.model.RowData;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@ToString
public class RowObject {

    String rowIndex;

    @Getter
    @Setter
    Map<String, String> valueMap;

    @Getter
    int currentRowIndex;

    int startingColumnIndex = 0;

    public RowObject(LinkedHashMap<String, String> valueMap) {
        this.rowIndex = valueMap.remove(GoogleSheets.ROW_INDEX);
        this.valueMap = valueMap;
    }

    public RowObject(LinkedHashMap<String, String> valueMap, int currentRowIndex) {
        this(valueMap);
        this.currentRowIndex = currentRowIndex;
    }

    public RowObject(LinkedHashMap<String, String> valueMap, int currentRowIndex, int startingColumnIndex) {
        this(valueMap, currentRowIndex);
        this.startingColumnIndex = startingColumnIndex;
    }

    public RowObject(String[] headerValues, String[] rowValues, int rowIndex) {
        this.valueMap = new LinkedHashMap<>(rowValues.length + 1);
        int i = 0;
        for (; i < rowValues.length; i++) {
            valueMap.put(headerValues[i], rowValues[i]);
        }
        while (i < headerValues.length) {
            valueMap.put(headerValues[i++], "");
        }

        this.currentRowIndex = rowIndex;
        this.rowIndex = String.valueOf(rowIndex);
        valueMap.put(GoogleSheets.ROW_INDEX, this.rowIndex);
    }

    public RowObject initialize() {
        if (this.rowIndex == null) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Missing required field row index.");
        }
        try {
            this.currentRowIndex = Integer.parseInt(this.rowIndex);
        } catch (NumberFormatException e) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Unable to parse row index: " + this.rowIndex);
        }
        return this;
    }

    public RowData getAsSheetRowData(String[] referenceKeys) {
        RowData rowData = new RowData();
        if (referenceKeys == null) {
            rowData.setValues(this.valueMap.values()
                    .stream()
                    .map(value -> new CellData().setFormattedValue(value))
                    .collect(Collectors.toList()));
            return rowData;
        }

        List<CellData> cellDataList = new ArrayList<>();

        for (String referenceKey : referenceKeys) {
            cellDataList
                    .add(new CellData()
                            .setUserEnteredValue(new ExtendedValue()
                                    .setStringValue(this.valueMap.getOrDefault(referenceKey, null))));
        }

        return rowData.setValues(cellDataList);
    }

    public List<Object> getAsSheetValues(String[] referenceKeys) {
        if (referenceKeys == null) {
            return List.of();
        }

        List<Object> row = new LinkedList<>();

        for (String referenceKey : referenceKeys) {
            row.add(this.valueMap.getOrDefault(referenceKey, null));
        }

        return row;
    }
}
