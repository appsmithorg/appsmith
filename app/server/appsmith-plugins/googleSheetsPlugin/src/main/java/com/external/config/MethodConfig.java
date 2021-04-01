package com.external.config;

import com.appsmith.external.models.Property;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

@Getter
@Setter
@Builder(toBuilder = true)
@AllArgsConstructor
@ToString
public class MethodConfig {
    String spreadsheetId;
    String spreadsheetRange; // doubles as rowOffset
    String sheetId;
    String spreadsheetName;
    String tableHeaderIndex;
    String queryFormat;
    String rowLimit;
    String sheetName;
    Object body;

    public MethodConfig(List<Property> propertyList) {
        propertyList.stream().parallel().forEach(property -> {
            switch (property.getKey()) {
                case "sheetId":
                    this.spreadsheetId = property.getValue();
                    break;
                case "range":
                    this.spreadsheetRange = property.getValue();
                    break;
                case "sheet":
                    this.sheetId = property.getValue();
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
                case "sheetName":
                    this.sheetName = property.getValue();
                    break;
            }
        });
    }
}