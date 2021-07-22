package com.appsmith.external.models;

import lombok.Getter;

import java.text.MessageFormat;

@Getter
public enum WidgetType {
    TEXT_WIDGET("data"),
    LIST_WIDGET("data"),
    DROP_DOWN_WIDGET("data.map( (obj) =>{ return  {'x': obj.%s, 'y': obj.%s } })"),
    CHART_WIDGET("data.map( (obj) =>{ return  {'label': obj.%s, 'value': obj.%s } })"),
    TABLE_WIDGET("data"),
    INPUT_WIDGET("data");

    public final String query;

    WidgetType(String query) {
        this.query = query;
    }

    public String getMessage() {
        return this.query;
    }
}