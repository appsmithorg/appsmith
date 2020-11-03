package com.appsmith.server.constants;

public enum AnalyticsEvents {
    CREATE,
    UPDATE,
    DELETE,
    FIRST_LOGIN,
    ;

    public String lowerName() {
        return name().toLowerCase();
    }
}
