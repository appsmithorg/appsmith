package com.appsmith.external.git.models;

import java.util.Locale;

public enum GitResourceType {
    ROOT_CONFIG,
    DATASOURCE_CONFIG,
    JSLIB_CONFIG,
    CONTEXT_CONFIG,
    JSOBJECT_CONFIG,
    JSOBJECT_DATA,
    QUERY_CONFIG,
    QUERY_DATA,
    WIDGET_CONFIG,
    ;

    @Override
    public String toString() {
        return this.name().toLowerCase(Locale.ROOT);
    }
}
