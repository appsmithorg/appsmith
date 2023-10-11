package com.appsmith.external.constants;

public class GitConstants {
    // This will be used as a key separator for action and jsobjects name
    // pageName{{seperator}}entityName this is needed to filter the entities to save in appropriate page directory
    public static final String NAME_SEPARATOR = "##ENTITY_SEPARATOR##";
    public static final String PAGE_LIST = "pageList";
    public static final String CUSTOM_JS_LIB_LIST = "customJSLibList";
    public static final String ACTION_LIST = "actionList";
    public static final String ACTION_COLLECTION_LIST = "actionCollectionList";

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
}
