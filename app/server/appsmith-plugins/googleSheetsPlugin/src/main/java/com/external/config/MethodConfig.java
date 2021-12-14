package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.Condition;
import com.appsmith.external.models.Property;
import com.external.constants.GoogleSheets;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.List;
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
            this.spreadsheetUrl = (String) properties.get(GoogleSheets.SHEET_URL);
            if (this.spreadsheetUrl != null && !this.spreadsheetUrl.isBlank()) {
                final Matcher matcher = sheetRangePattern.matcher(spreadsheetUrl);
                if (matcher.find()) {
                    this.spreadsheetId = matcher.group(1);
                } else {
                    throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Cannot read spreadsheet URL.");
                }
            }
        }
        this.spreadsheetRange = (String) properties.getOrDefault(GoogleSheets.RANGE, null);
        this.spreadsheetName = (String) properties.getOrDefault(GoogleSheets.SPREADSHEET_NAME, null);
        this.tableHeaderIndex = (String) properties.getOrDefault(GoogleSheets.TABLE_HEADER_INDEX, null);
        this.queryFormat = (String) properties.getOrDefault(GoogleSheets.QUERY_FORMAT, null);
        this.rowLimit = (String) properties.getOrDefault(GoogleSheets.ROW_LIMIT, null);
        this.rowOffset = (String) properties.getOrDefault(GoogleSheets.ROW_OFFSET, null);
        this.rowIndex = (String) properties.getOrDefault(GoogleSheets.ROW_INDEX, null);
        this.sheetName = (String) properties.getOrDefault(GoogleSheets.SHEET_NAME, null);
        this.deleteFormat = (String) properties.getOrDefault(GoogleSheets.DELETE_FORMAT, null);
        this.rowObject = (String) properties.getOrDefault(GoogleSheets.ROW_OBJECT, null);
        this.rowObjects = (String) properties.getOrDefault(GoogleSheets.ROW_OBJECTS, null);

        if (properties.containsKey(GoogleSheets.WHERE)) {
            Map<String, Object> whereForm = (Map<String, Object>) properties.getOrDefault(GoogleSheets.WHERE, Map.of());
            this.whereConditions = parseWhereClause(whereForm);
        }
    }

    public MethodConfig(List<Property> propertyList) {
        propertyList.stream().parallel().forEach(property -> {
            Object value = property.getValue();
            if (value != null) {

                switch (property.getKey()) {
                    case "sheetUrl":
                        this.spreadsheetUrl = String.valueOf(value).trim();
                        if (this.spreadsheetUrl != null && !this.spreadsheetUrl.isBlank()) {
                            final Matcher matcher = sheetRangePattern.matcher(spreadsheetUrl);
                            if (matcher.find()) {
                                this.spreadsheetId = matcher.group(1);
                            } else {
                                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Cannot read spreadsheet URL.");
                            }
                        }
                        break;
                    case "range":
                        this.spreadsheetRange = String.valueOf(value).trim();
                        break;
                    case "spreadsheetName":
                        this.spreadsheetName = String.valueOf(value).trim();
                        break;
                    case "tableHeaderIndex":
                        this.tableHeaderIndex = String.valueOf(value).trim();
                        break;
                    case "queryFormat":
                        this.queryFormat = String.valueOf(value).trim();
                        break;
                    case "rowLimit":
                        this.rowLimit = String.valueOf(value).trim();
                        break;
                    case "rowOffset":
                        this.rowOffset = String.valueOf(value).trim();
                        break;
                    case "rowIndex":
                        this.rowIndex = String.valueOf(value).trim();
                        break;
                    case "sheetName":
                        this.sheetName = String.valueOf(value).trim();
                        break;
                    case "deleteFormat":
                        this.deleteFormat = String.valueOf(value).trim();
                        break;
                    case "rowObject":
                        this.rowObject = String.valueOf(value).trim();
                        break;
                    case "rowObjects":
                        this.rowObjects = String.valueOf(value).trim();
                        break;
                    case "where":
                        Map<String, Object> whereForm = (Map<String, Object>) value;
                        this.whereConditions = parseWhereClause(whereForm);
                        break;
                }
            }
        });
    }
}