package com.appsmith.external.git.constants;

import java.util.Locale;

import static com.appsmith.external.constants.spans.BaseSpan.APPSMITH_SPAN_PREFIX;
import static com.appsmith.external.constants.spans.BaseSpan.GIT_SPAN_PREFIX;

public enum GitSpans {
    FILE_SYSTEM_CLONE_REPO,
    FILE_SYSTEM_STATUS,
    FILE_SYSTEM_PULL,
    FILE_SYSTEM_BRANCH_TRACK,
    ADD_FILE_LOCK,
    RELEASE_FILE_LOCK,
    FILE_SYSTEM_COMMIT,
    FILE_SYSTEM_CHECKOUT_BRANCH,
    FILE_SYSTEM_CREATE_BRANCH,
    FILE_SYSTEM_DELETE_BRANCH,
    FILE_SYSTEM_CREATE_REPO,
    FILE_SYSTEM_RESET,
    FILE_SYSTEM_MERGE,
    FILE_SYSTEM_REBASE,
    FILE_SYSTEM_PUSH,
    FILE_SYSTEM_FETCH_REMOTE,
    STATUS,
    COMMIT;
    private final String eventName;

    GitSpans() {
        this.eventName = APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + name().toLowerCase(Locale.ROOT);
    }

    public String getEventName() {
        return this.eventName;
    }
}
