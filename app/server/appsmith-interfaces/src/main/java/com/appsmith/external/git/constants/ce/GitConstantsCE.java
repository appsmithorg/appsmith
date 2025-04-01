package com.appsmith.external.git.constants.ce;

public class GitConstantsCE {
    // This will be used as a key separator for action and jsobjects name
    // pageName{{seperator}}entityName this is needed to filter the entities to save in appropriate page directory
    public static final String NAME_SEPARATOR = "##ENTITY_SEPARATOR##";
    public static final String PAGE_LIST = "pageList";
    public static final String CUSTOM_JS_LIB_LIST = "customJSLibList";
    public static final String ACTION_LIST = "actionList";
    public static final String ACTION_COLLECTION_LIST = "actionCollectionList";

    public static final String README_FILE_NAME = "README.md";
    public static final String ARTIFACT_JSON_TYPE = "artifactJsonType";

    public static final String FIRST_COMMIT = "System added readme file";
    public static final String DEFAULT_COMMIT_MESSAGE = "System generated commit, ";
    public static final String EMPTY_COMMIT_ERROR_MESSAGE = "On current branch nothing to commit, working tree clean";
    public static final String MERGE_CONFLICT_BRANCH_NAME = "_mergeConflict";
    public static final String CONFLICTED_SUCCESS_MESSAGE = "branch has been created from conflicted state. Please "
            + "resolve merge conflicts in remote and pull again";

    public static final String GIT_CONFIG_ERROR =
            "Unable to find the git configuration, please configure your application "
                    + "with git to use version control service";

    public static final String GIT_PROFILE_ERROR = "Unable to find git author configuration for logged-in user. You can"
            + " set up a git profile from the user profile section.";

    public static final String RECONSTRUCT_PAGE = "reconstruct page";

    public class GitMetricConstantsCE {
        public static final String CHECKOUT_REMOTE = "checkout-remote";
        public static final String HARD_RESET = "hard-reset";
        public static final String RTS_RESET = "rts-reset";
        public static final String RESOURCE_TYPE = "resource-type";
        public static final String METADATA = "Metadata";
        public static final String WIDGETS = "Widgets";
        public static final String ACTION_COLLECTION_BODY = "ActionCollectionBody";
        public static final String NEW_ACTION_BODY = "NewActionBody";
    }

    public class GitCommandConstantsCE {
        public static final String METADATA = "metadata";
        public static final String AUTO_COMMIT = "autoCommit";
        public static final String PULL = "pull";
        public static final String PUSH = "push";
        public static final String STATUS = "status";
        public static final String FETCH_REMOTE = "fetchRemote";
        public static final String COMMIT = "commit";
        public static final String CREATE_BRANCH = "createBranch";
        public static final String CREATE_REF = "createRef";
        public static final String CHECKOUT_BRANCH = "checkoutBranch";
        public static final String CHECKOUT_REF = "checkoutRef";
        public static final String SYNC_BRANCH = "syncBranch";
        public static final String LIST_BRANCH = "listBranch";
        public static final String MERGE_BRANCH = "mergeBranch";
        public static final String DELETE = "delete";
        public static final String DISCARD = "discard";
        public static final String PAGE_DSL_VERSION = "pageDslVersion";
        public static final String AUTO_COMMIT_ELIGIBILITY = "autoCommitEligibility";
    }
}
