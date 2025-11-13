package com.appsmith.server.git.constants;

/**
 * Common Git route operations for Application and Package controllers.
 *
 * Grouping:
 * - Common operations are listed first.
 * - Controller-specific operations are separated by comment delimiters.
 */
public enum GitRouteOperation {

    // Common operations
    COMMIT(true),
    CREATE_REF(true),
    CHECKOUT_REF(true),
    DISCONNECT(true, true),
    PULL(true),
    STATUS(true),
    FETCH_REMOTE_CHANGES(true),
    MERGE(true),
    MERGE_STATUS(true),
    DELETE_REF(true),
    DISCARD_CHANGES(true),
    LIST_REFS(true),
    AUTO_COMMIT(true),
    AUTO_COMMIT_SOLUTION(true),

    // whitelisted ones

    METADATA(false),
    CONNECT(false),
    GET_PROTECTED_BRANCHES(false),
    UPDATE_PROTECTED_BRANCHES(false),
    GET_SSH_KEY(false),
    GENERATE_SSH_KEYPAIR(false),
    GET_AUTO_COMMIT_PROGRESS(false),
    TOGGLE_AUTO_COMMIT(false),

    // EE specific features

    SET_DEFAULT_BRANCH(true),
    DEPLOY(true),

    TOGGLE_AUTO_DEPLOYMENT(false),
    GENERATE_GIT_TOKEN(false),

    // Package specific
    PRE_TAG(true),
    PUBLISH(true),
    ;

    private final boolean requiresGitOperation;
    private final boolean gitCleanUp;

    GitRouteOperation() {
        this(true, false);
    }

    GitRouteOperation(boolean requiresGitOperation) {
        this.requiresGitOperation = requiresGitOperation;
        this.gitCleanUp = false;
    }

    GitRouteOperation(boolean requiresGitOperation, boolean gitCleanUp) {
        this.requiresGitOperation = requiresGitOperation;
        this.gitCleanUp = gitCleanUp;
    }

    public boolean requiresGitOperation() {
        return requiresGitOperation;
    }

    public boolean gitCleanUp() {
        return gitCleanUp;
    }
}
