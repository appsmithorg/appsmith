package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.Condition;
import com.external.constants.GoogleSheets;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.appsmith.external.helpers.PluginUtils.parseWhereClause;

@Getter
@Setter
@Builder(toBuilder = true)
@AllArgsConstructor
@ToString
public class MethodConfig {
    String spreadsheetId;
    String spreadsheetUrl;
    String spreadsheetRange;
    String sheetId;
    String spreadsheetName;
    String tableHeaderIndex;
    String queryFormat;
    String rowOffset;
    String rowIndex;
    String rowLimit;
    String sheetName;
    String deleteFormat;
    String rowObject;
    String rowObjects;
    Object body;
    Condition whereConditions;
    Pattern sheetRangePattern = Pattern.compile("https://docs.google.com/spreadsheets/d/([^/]+)/?.*");

    public MethodConfig(Map<String, Object> properties) {

        if (properties.containsKey(GoogleSheets.SHEET_URL)) {
            this.spreadsheetUrl = getPropertyValueAsString(properties.get(GoogleSheets.SHEET_URL));
            if (this.spreadsheetUrl != null && !this.spreadsheetUrl.isBlank()) {
                final Matcher matcher = sheetRangePattern.matcher(spreadsheetUrl);
                if (matcher.find()) {
                    this.spreadsheetId = matcher.group(1);
                } else {
                    throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Cannot read spreadsheet URL.");
                }
            }
        }
        this.spreadsheetRange = getPropertyValueAsString(properties.get(GoogleSheets.RANGE));
        this.spreadsheetName = getPropertyValueAsString(properties.get(GoogleSheets.SPREADSHEET_NAME));
        this.tableHeaderIndex = getPropertyValueAsString(properties.get(GoogleSheets.TABLE_HEADER_INDEX));
        this.queryFormat = getPropertyValueAsString(properties.get(GoogleSheets.QUERY_FORMAT));
        this.rowLimit = getPropertyValueAsString(properties.get(GoogleSheets.ROW_LIMIT));
        this.rowOffset = getPropertyValueAsString(properties.get(GoogleSheets.ROW_OFFSET));
        this.rowIndex = getPropertyValueAsString(properties.get(GoogleSheets.ROW_INDEX));
        this.sheetName = getPropertyValueAsString(properties.get(GoogleSheets.SHEET_NAME));
        this.deleteFormat = getPropertyValueAsString(properties.get(GoogleSheets.DELETE_FORMAT));
        this.rowObject = getPropertyValueAsString(properties.get(GoogleSheets.ROW_OBJECT));
        this.rowObjects = getPropertyValueAsString(properties.get(GoogleSheets.ROW_OBJECTS));

        if (properties.containsKey(GoogleSheets.WHERE)) {
            Map<String, Object> whereForm = (Map<String, Object>) properties.getOrDefault(GoogleSheets.WHERE, Map.of());
            this.whereConditions = parseWhereClause(whereForm);
        }
    }

    private String getPropertyValueAsString(Object propertyValue) {
        final String stringValue = (String) propertyValue;
        if (stringValue != null) {
            return stringValue.trim();
        }
        return stringValue;
    }

}