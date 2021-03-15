package com.external.config;

import com.appsmith.external.models.Property;
import lombok.Getter;

import java.util.List;

@Getter
public class MethodConfig {
    String spreadsheetId;
    String spreadsheetRange;
    String sheetId;

    public MethodConfig(List<Property> propertyList) {
        this.spreadsheetId = propertyList.get(1).getValue();
        this.spreadsheetRange = propertyList.get(2).getValue();
        this.sheetId = propertyList.get(3).getValue();
    }
}