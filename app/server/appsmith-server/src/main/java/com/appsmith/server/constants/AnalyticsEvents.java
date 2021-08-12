package com.appsmith.server.constants;

import java.util.Locale;

public enum AnalyticsEvents {
    CREATE,
    UPDATE,
    DELETE,
    FIRST_LOGIN,
    EXECUTE_ACTION("execute_ACTION_TRIGGERED"),
    UPDATE_LAYOUT,
    PUBLISH_APPLICATION("publish_APPLICATION"),
    FORK,
    GENERATE_CRUD_PAGE("generate_CRUD_PAGE")
    ;

    private final String eventName;

    AnalyticsEvents() {
        this.eventName = name().toLowerCase(Locale.ROOT);
    }

    AnalyticsEvents(String eventName) {
        this.eventName = eventName;
    }

    public String getEventName() {
        return eventName;
    }

}
