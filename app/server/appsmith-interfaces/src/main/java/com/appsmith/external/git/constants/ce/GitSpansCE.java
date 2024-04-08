package com.appsmith.external.git.constants.ce;

import static com.appsmith.external.constants.spans.BaseSpan.APPSMITH_SPAN_PREFIX;
import static com.appsmith.external.constants.spans.BaseSpan.GIT_SPAN_PREFIX;

public class GitSpansCE {

    public static final String FILE_SYSTEM_CLONE_REPO =
            APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + "file_system_clone_repo";
    public static final String FILE_SYSTEM_STATUS = APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + "file_system_status";
    public static final String FILE_SYSTEM_PULL = APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + "file_system_pull";
    public static final String FILE_SYSTEM_BRANCH_TRACK =
            APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + "file_system_branch_track";
    public static final String ADD_FILE_LOCK = APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + "add_file_lock";
    public static final String RELEASE_FILE_LOCK = APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + "release_file_lock";
    public static final String FILE_SYSTEM_COMMIT = APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + "file_system_commit";
    public static final String FILE_SYSTEM_CHECKOUT_BRANCH =
            APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + "file_system_checkout_branch";
    public static final String FILE_SYSTEM_CREATE_BRANCH =
            APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + "file_system_create_branch";
    public static final String FILE_SYSTEM_DELETE_BRANCH =
            APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + "file_system_delete_branch";
    public static final String FILE_SYSTEM_CREATE_REPO =
            APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + "file_system_create_repo";
    public static final String FILE_SYSTEM_RESET = APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + "file_system_reset";
    public static final String FILE_SYSTEM_MERGE = APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + "file_system_merge";
    public static final String FILE_SYSTEM_REBASE = APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + "file_system_rebase";
    public static final String FILE_SYSTEM_PUSH = APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + "file_system_push";
    public static final String FILE_SYSTEM_FETCH_REMOTE =
            APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + "file_system_fetch_remote";
    public static final String STATUS = APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + "status";
    public static final String COMMIT = APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + "commit";
    public static final String PUSH = APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + "push";
    public static final String PULL = APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + "pull";
    public static final String CREATE_BRANCH = APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + "create_branch";
    public static final String CHECKOUT_BRANCH = APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + "checkout_branch";
    public static final String DELETE_BRANCH = APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + "delete_branch";
    public static final String FETCH_REMOTE = APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + "fetch_remote";
    public static final String DETACH_REMOTE = APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + "detach_remote";
    public static final String DISCARD_CHANGES = APPSMITH_SPAN_PREFIX + GIT_SPAN_PREFIX + "discard_changes";
}
