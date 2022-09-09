package com.appsmith.external.constants;

import java.util.Locale;

public enum AnalyticsEvents {
    CREATE,
    UPDATE,
    DELETE,
    ARCHIVE,
    VIEW,
    APPLY,
    IMPORT,
    EXPORT,
    CLONE,
    LOGIN,
    LOGOUT,
    FIRST_LOGIN,
    EXECUTE_ACTION("execute_ACTION_TRIGGERED"),
    EXECUTE_INVITE_USERS("execute_INVITE_USERS"),
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
    GIT_TEST_CONNECTION,
    GIT_DELETE_BRANCH,
    GIT_DISCARD_CHANGES,
    GIT_RESET_HARD,
    GIT_LIST_BRANCH,
    GIT_RESET,
    GIT_STATUS,
    GIT_COMMIT_HISTORY,
    GIT_CLONE,
    GIT_CHECKOUT,
    GIT_SYNC_BRANCH,
    GIT_LIST_LOCAL_BRANCH,
    GIT_MERGE_CHECK,
    GIT_FETCH,
    AUTHENTICATION_METHOD_CONFIGURATION("Authentication Method Configured"),
    GENERATE_SSH_KEY("generate_SSH_KEY"),
    UNIT_EXECUTION_TIME,

    // Events to log execution time
    GIT_SERIALIZE_APP_RESOURCES_TO_LOCAL_FILE,
    GIT_DESERIALIZE_APP_RESOURCES_FROM_FILE,
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
