package com.appsmith.server.constants;

public enum AnalyticsEvents {
    CREATE,
    UPDATE,
    DELETE,
    ;

    public String lowerName() {
        return name().toLowerCase();
    }
}
