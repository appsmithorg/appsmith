package com.appsmith.server.constants;

public enum GitDefaultCommitMessage {
    CONFLICT_STATE("for conflicted state"),
    CONNECT_FLOW("initial commit"),
    BRANCH_CREATED("after creating a new branch: "),
    SYNC_WITH_REMOTE_AFTER_PULL("for syncing changes with remote after git pull"),
    SYNC_REMOTE_AFTER_MERGE("for syncing changes with local branch after git merge, branch: ");

    private final String reason;

    GitDefaultCommitMessage(String reason) {
        this.reason = reason;
    }

    public String getReason() {
        return this.reason;
    }
}
