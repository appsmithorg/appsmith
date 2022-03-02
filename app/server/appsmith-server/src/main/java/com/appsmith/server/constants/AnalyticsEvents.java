package com.appsmith.server.constants;

import java.util.Locale;

public enum AnalyticsEvents {
    CREATE,
    UPDATE,
    DELETE,
    ARCHIVE,
    FIRST_LOGIN,
    EXECUTE_ACTION("execute_ACTION_TRIGGERED"),
    UPDATE_LAYOUT,
    PUBLISH_APPLICATION("publish_APPLICATION"),
    FORK,
    GENERATE_CRUD_PAGE("generate_CRUD_PAGE"),
    CREATE_SUPERUSER,
    SUBSCRIBE_MARKETING_EMAILS,
    UNSUBSCRIBE_MARKETING_EMAILS,
    INSTALLATION_SETUP_COMPLETE("Installation Setup Complete"),
    GIT_CONNECT,
    GIT_PRIVATE_REPO_LIMIT_EXCEEDED,
    GIT_CREATE_BRANCH,
    GIT_COMMIT,
    GIT_PUSH,
    GIT_MERGE,
    GIT_PULL,
    GIT_PRUNE,
    GIT_DISCONNECT,
    GIT_CHECKOUT_BRANCH,
    GIT_CHECKOUT_REMOTE_BRANCH,
    GIT_IMPORT,
    GIT_TEST_CONNECTION
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
