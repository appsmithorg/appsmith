package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.Property;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
    Pattern sheetRangePattern = Pattern.compile("https://docs.google.com/spreadsheets/d/([^/]+)/?.*");

    public MethodConfig(List<Property> propertyList) {
        propertyList.stream().parallel().forEach(property -> {
            if (property.getValue() != null) {
                String propertyValue = String.valueOf(property.getValue());
                switch (property.getKey()) {
                    case "sheetUrl":
                        this.spreadsheetUrl = propertyValue;
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
                        this.spreadsheetRange = propertyValue;
                        break;
                    case "spreadsheetName":
                        this.spreadsheetName = propertyValue;
                        break;
                    case "tableHeaderIndex":
                        this.tableHeaderIndex = propertyValue;
                        break;
                    case "queryFormat":
                        this.queryFormat = propertyValue;
                        break;
                    case "rowLimit":
                        this.rowLimit = propertyValue;
                        break;
                    case "rowOffset":
                        this.rowOffset = propertyValue;
                        break;
                    case "rowIndex":
                        this.rowIndex = propertyValue;
                        break;
                    case "sheetName":
                        this.sheetName = propertyValue;
                        break;
                    case "deleteFormat":
                        this.deleteFormat = propertyValue;
                        break;
                    case "rowObject":
                        this.rowObject = propertyValue;
                        break;
                    case "rowObjects":
                        this.rowObjects = propertyValue;
                        break;
                }
            }
        });
    }
}