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
    String rowLimit;
    String sheetName;
    Object body;
    Pattern sheetRangePattern = Pattern.compile("https://docs.google.com/spreadsheets/d/([^/]+)/?.*");

    public MethodConfig(List<Property> propertyList) {
        propertyList.stream().parallel().forEach(property -> {
            switch (property.getKey()) {
                case "sheetUrl":
                    this.spreadsheetUrl = property.getValue();
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
                    this.spreadsheetRange = property.getValue();
                    break;
                case "spreadsheetName":
                    this.spreadsheetName = property.getValue();
                    break;
                case "tableHeaderIndex":
                    this.tableHeaderIndex = property.getValue();
                    break;
                case "queryFormat":
                    this.queryFormat = property.getValue();
                    break;
                case "rowLimit":
                    this.rowLimit = property.getValue();
                    break;
                case "rowOffset":
                    this.rowOffset = property.getValue();
                    break;
                case "sheetName":
                    this.sheetName = property.getValue();
                    break;
            }
        });
    }
}