package com.appsmith.external.models;

import lombok.Getter;

@Getter
public enum WidgetType {
    TEXT_WIDGET("data"),
    SELECT_WIDGET("data.map( (obj) =>{ return  {'label': obj.%s, 'value': obj.%s } })"),
    CHART_WIDGET("data.map( (obj) =>{ return  {'x': obj.%s, 'y': obj.%s } })"),
    TABLE_WIDGET_V2("data"),
    INPUT_WIDGET("data");

    public final String query;

    WidgetType(String query) {
        this.query = query;
    }

    public String getMessage() {
        return this.query;
    }
}