package com.appsmith.external.constants.ce;

import java.util.Locale;

public enum GitEvents {
    FILE_SYSTEM_CLONE,
    FILE_SYSTEM_STATUS,
    FILE_SYSTEM_PULL,
    FILE_SYSTEM_BRANCH_TRACK,
    FILE_LOCK,
    FILE_SYSTEM_COMMIT,
    FILE_SYSTEM_CHECKOUT_BRANCH,
    FILE_SYSTEM_CREATE_BRANCH,
    FILE_SYSTEM_DELETE,
    FILE_SYSTEM_CREATE_REPO,
    FILE_SYSTEM_RESET,
    FILE_SYSTEM_MERGE,
    FILE_SYSTEM_REBASE,
    FILE_SYSTEM_PUSH,
    FILE_SYSTEM_FETCH_REMOTE;

    private final String eventName;

    GitEvents() {
        this.eventName = name().toLowerCase(Locale.ROOT);
    }

    public String getEventName() {
        return this.eventName;
    }
}
