package com.appsmith.server.constants;

public enum AnalyticsEvents {
    CREATE,
    UPDATE,
    DELETE,
    FIRST_LOGIN,
    EXECUTE_ACTION,
    ;

    public String lowerName() {
        return name().toLowerCase();
    }
}
