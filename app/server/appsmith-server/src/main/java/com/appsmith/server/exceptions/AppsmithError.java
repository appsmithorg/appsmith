package com.appsmith.server.exceptions;

import com.appsmith.external.constants.ErrorReferenceDocUrl;
import com.appsmith.external.exceptions.AppsmithErrorAction;
import com.appsmith.external.models.ErrorType;
import lombok.Getter;
import lombok.NonNull;

import java.text.MessageFormat;

@Getter
public enum AppsmithError {
    // Ref syntax for message templates: https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/text/MessageFormat.html
    INVALID_PARAMETER(400, AppsmithErrorCode.INVALID_PARAMETER.getCode(), "Please enter a valid parameter {0}.", AppsmithErrorAction.DEFAULT, "Invalid parameter", ErrorType.ARGUMENT_ERROR, null),
    PLUGIN_NOT_INSTALLED(400, AppsmithErrorCode.PLUGIN_NOT_INSTALLED.getCode(), "Plugin {0} not installed", AppsmithErrorAction.DEFAULT, "Plugin not installed", ErrorType.INTERNAL_ERROR, null),
    PLUGIN_ID_NOT_GIVEN(400, AppsmithErrorCode.PLUGIN_ID_NOT_GIVEN.getCode(), "Missing plugin id. Please enter one.", AppsmithErrorAction.DEFAULT, "Missing plugin id", ErrorType.INTERNAL_ERROR, null),
    DATASOURCE_NOT_GIVEN(400, AppsmithErrorCode.DATASOURCE_NOT_GIVEN.getCode(), "Missing datasource. Add/enter/connect a datasource to create a valid action.",
            AppsmithErrorAction.DEFAULT, "Missing datasource", ErrorType.ARGUMENT_ERROR, null),
    PAGE_ID_NOT_GIVEN(400, AppsmithErrorCode.PAGE_ID_NOT_GIVEN.getCode(), "Missing page id. Please enter one.", AppsmithErrorAction.DEFAULT, "Missing page id", ErrorType.ARGUMENT_ERROR, null),
    DUPLICATE_KEY_USER_ERROR(400, AppsmithErrorCode.DUPLICATE_KEY_USER_ERROR.getCode(), "{0} already exists. Please use a different {1}", AppsmithErrorAction.DEFAULT, "Name already used", ErrorType.BAD_REQUEST, null),
    PAGE_DOESNT_BELONG_TO_USER_WORKSPACE(400, AppsmithErrorCode.PAGE_DOESNT_BELONG_TO_USER_WORKSPACE.getCode(), "Page {0} does not belong to the current user {1} " +
            "workspace", AppsmithErrorAction.LOG_EXTERNALLY, "Page doesn''t belong to this workspace", ErrorType.BAD_REQUEST, null),
    UNSUPPORTED_OPERATION(400, AppsmithErrorCode.UNSUPPORTED_OPERATION.getCode(), "Unsupported operation", AppsmithErrorAction.DEFAULT, "Unsupported operation", ErrorType.BAD_REQUEST, null),
    DEPRECATED_API(400, AppsmithErrorCode.DEPRECATED_API.getCode(), "This API has been deprecated, please contact the Appsmith support for more details.", AppsmithErrorAction.DEFAULT, "Deprecated API", ErrorType.BAD_REQUEST, null),
    USER_DOESNT_BELONG_ANY_WORKSPACE(400, AppsmithErrorCode.USER_DOESNT_BELONG_ANY_WORKSPACE.getCode(), "User {0} does not belong to any workspace",
            AppsmithErrorAction.LOG_EXTERNALLY, "User doesn''t belong to any workspace", ErrorType.INTERNAL_ERROR, null),
    USER_DOESNT_BELONG_TO_WORKSPACE(400, AppsmithErrorCode.USER_DOESNT_BELONG_TO_WORKSPACE.getCode(), "User {0} does not belong to the workspace with id {1}",
            AppsmithErrorAction.LOG_EXTERNALLY, "User doesn''t belong to this workspace", ErrorType.INTERNAL_ERROR, null),
    NO_CONFIGURATION_FOUND_IN_DATASOURCE(400, AppsmithErrorCode.NO_CONFIGURATION_FOUND_IN_DATASOURCE.getCode(), "No datasource configuration found. Please configure it and try again.",
            AppsmithErrorAction.DEFAULT, "Datasource configuration is invalid", ErrorType.DATASOURCE_CONFIGURATION_ERROR, null),
    INVALID_ACTION_COLLECTION(400, AppsmithErrorCode.INVALID_ACTION_COLLECTION.getCode(), "{0} is not correctly configured. Please fix the following and then re-run: \n{1}",
            AppsmithErrorAction.DEFAULT, "Collection configuration is invalid", ErrorType.CONFIGURATION_ERROR, null),
    INVALID_ACTION(400, AppsmithErrorCode.INVALID_ACTION.getCode(), "{0} is not correctly configured. Please fix the following and then re-run: \n{1}",
            AppsmithErrorAction.DEFAULT, "Action configuration is invalid", ErrorType.CONFIGURATION_ERROR, null),
    INVALID_DATASOURCE(400, AppsmithErrorCode.INVALID_DATASOURCE.getCode(), "{0} is not correctly configured. Please fix the following and then re-run: \n{1}",
            AppsmithErrorAction.DEFAULT, "Datasource configuration is invalid", ErrorType.DATASOURCE_CONFIGURATION_ERROR, null),
    INVALID_DATASOURCE_CONFIGURATION(400, AppsmithErrorCode.INVALID_DATASOURCE_CONFIGURATION.getCode(), "Datasource configuration is invalid",
            AppsmithErrorAction.DEFAULT, "Datasource configuration is invalid", ErrorType.DATASOURCE_CONFIGURATION_ERROR, null),
    INVALID_ACTION_NAME(400, AppsmithErrorCode.INVALID_ACTION_NAME.getCode(), "Appsmith expects all entities to follow Javascript variable naming conventions. "
            + "It must be a single word containing alphabets, numbers, or \"_\". Any other special characters like hyphens (\"-\"), comma (\",\"), hash (\"#\") etc. "
            + "are not allowed. "
            + "Please change the name.", AppsmithErrorAction.DEFAULT, "Invalid action name", ErrorType.CONFIGURATION_ERROR, null),
    NO_CONFIGURATION_FOUND_IN_ACTION(400, AppsmithErrorCode.NO_CONFIGURATION_FOUND_IN_ACTION.getCode(), "No configurations found in this action", AppsmithErrorAction.DEFAULT, "No configurations found in this action", ErrorType.CONFIGURATION_ERROR, null),
    NAME_CLASH_NOT_ALLOWED_IN_REFACTOR(400, AppsmithErrorCode.NAME_CLASH_NOT_ALLOWED_IN_REFACTOR.getCode(), "The new name {1} already exists in the current page. Choose another name.", AppsmithErrorAction.DEFAULT, "Name already taken",
            ErrorType.BAD_REQUEST, null),
    PAGE_DOESNT_BELONG_TO_APPLICATION(400, AppsmithErrorCode.PAGE_DOESNT_BELONG_TO_APPLICATION.getCode(), "Unexpected state. Page {0} does not seem belong to the application {1}. Please reach out to Appsmith customer support to resolve this.",
            AppsmithErrorAction.LOG_EXTERNALLY, "Page doesn''t belong to this application", ErrorType.BAD_REQUEST, null),
    INVALID_DYNAMIC_BINDING_REFERENCE(400, AppsmithErrorCode.INVALID_DYNAMIC_BINDING_REFERENCE.getCode(),
            "  \"widgetType\" : \"{0}\"," +
                    "  \"bindingPath\" : \"{3}\"," +
                    "  \"currentKey\" : \"{7}\"," +
                    "  \"message\" : \"Binding path in the widget not found. Please reach out to Appsmith customer support to resolve this.\"," +
                    "  \"widgetName\" : \"{1}\"," +
                    "  \"widgetId\" : \"{2}\"," +
                    "  \"pageId\" : \"{4}\"," +
                    "  \"layoutId\" : \"{5}\"," +
                    "  \"errorDetail\" : \"{8}\"," +
                    "  \"dynamicBinding\" : {6}",
            AppsmithErrorAction.LOG_EXTERNALLY, "Invalid dynamic binding reference", ErrorType.BAD_REQUEST, null),
    USER_ALREADY_EXISTS_IN_WORKSPACE(400, AppsmithErrorCode.USER_ALREADY_EXISTS_IN_WORKSPACE.getCode(), "The user {0} has already been added to the workspace with role {1}. To change the role, please navigate to `Manage Users` page.",
            AppsmithErrorAction.DEFAULT, "User already exists in this workspace", ErrorType.BAD_REQUEST, null),
    UNAUTHORIZED_DOMAIN(401, AppsmithErrorCode.UNAUTHORIZED_DOMAIN.getCode(), "Invalid email domain {0} used for sign in/sign up. Please contact the administrator to configure this domain if this is unexpected.",
            AppsmithErrorAction.DEFAULT, "Invalid or unauthorized email domain", ErrorType.AUTHENTICATION_ERROR, null),
    USER_NOT_SIGNED_IN(401, AppsmithErrorCode.USER_NOT_SIGNED_IN.getCode(), "You are not logged in. Please sign in with the registered email ID or sign up",
            AppsmithErrorAction.DEFAULT, "User not signed in", ErrorType.AUTHENTICATION_ERROR, null),
    INVALID_PASSWORD_RESET(400, AppsmithErrorCode.INVALID_PASSWORD_RESET.getCode(), "Cannot find an outstanding reset password request for this email. Please initiate a request via \"forgot password\" " +
            "button to reset your password", AppsmithErrorAction.DEFAULT, "Invalid password reset request", ErrorType.INTERNAL_ERROR, null),
    INVALID_PASSWORD_LENGTH(400, AppsmithErrorCode.INVALID_PASSWORD_LENGTH.getCode(), "Password length should be between {0} and {1}", AppsmithErrorAction.DEFAULT, "Invalid password length", ErrorType.INTERNAL_ERROR, null),
    JSON_PROCESSING_ERROR(400, AppsmithErrorCode.JSON_PROCESSING_ERROR.getCode(), "Json processing error with error {0}", AppsmithErrorAction.LOG_EXTERNALLY, "Json processing error", ErrorType.INTERNAL_ERROR, null),
    INVALID_CREDENTIALS(200, AppsmithErrorCode.INVALID_CREDENTIALS.getCode(), "Invalid credentials provided. Did you input the credentials correctly?", AppsmithErrorAction.DEFAULT, "Invalid credentials", ErrorType.AUTHENTICATION_ERROR, null),
    UNAUTHORIZED_ACCESS(403, AppsmithErrorCode.UNAUTHORIZED_ACCESS.getCode(), "Unauthorized access", AppsmithErrorAction.DEFAULT, "Unauthorized access", ErrorType.AUTHENTICATION_ERROR, null),
    DUPLICATE_KEY(409, AppsmithErrorCode.DUPLICATE_KEY.getCode(), "Duplicate key error: An object with the name {0} already exists. Please use a different name or reach out to Appsmith customer support to resolve this.",
            AppsmithErrorAction.DEFAULT, "Duplicate key", ErrorType.BAD_REQUEST, null),
    USER_ALREADY_EXISTS_SIGNUP(409, AppsmithErrorCode.USER_ALREADY_EXISTS_SIGNUP.getCode(), "There is already an account registered with this email {0}. Please sign in instead.",
            AppsmithErrorAction.DEFAULT, "Account already exists with this email", ErrorType.BAD_REQUEST, null),
    ACTION_IS_NOT_AUTHORIZED(403, AppsmithErrorCode.ACTION_IS_NOT_AUTHORIZED.getCode(), "Uh oh! You do not have permissions to do : {0}", AppsmithErrorAction.DEFAULT, "Permission denied", ErrorType.AUTHENTICATION_ERROR, null),
    NO_RESOURCE_FOUND(404, AppsmithErrorCode.NO_RESOURCE_FOUND.getCode(), "Unable to find {0} {1}", AppsmithErrorAction.DEFAULT, "No resource found", ErrorType.INTERNAL_ERROR, null),
    USER_NOT_FOUND(404, AppsmithErrorCode.USER_NOT_FOUND.getCode(), "Unable to find user with email {0}", AppsmithErrorAction.DEFAULT, "No user found", ErrorType.INTERNAL_ERROR, null),
    ACL_NO_RESOURCE_FOUND(404, AppsmithErrorCode.ACL_NO_RESOURCE_FOUND.getCode(), "Unable to find {0} {1}. Either the asset doesn''t exist or you don''t have required permissions",
            AppsmithErrorAction.DEFAULT, "No resource found or permission denied", ErrorType.INTERNAL_ERROR, null),
    GENERIC_BAD_REQUEST(400, AppsmithErrorCode.GENERIC_BAD_REQUEST.getCode(), "Bad Request: {0}", AppsmithErrorAction.DEFAULT, "Invalid request", ErrorType.BAD_REQUEST, null),
    VALIDATION_FAILURE(400, AppsmithErrorCode.VALIDATION_FAILURE.getCode(), "Validation Failure(s): {0}", AppsmithErrorAction.DEFAULT, "Validation failed", ErrorType.INTERNAL_ERROR, null),
    INVALID_CURL_COMMAND(400, AppsmithErrorCode.INVALID_CURL_COMMAND.getCode(), "Invalid cURL command, couldn''t import.", AppsmithErrorAction.DEFAULT, "Invalid cURL command", ErrorType.ARGUMENT_ERROR, null),
    INVALID_LOGIN_METHOD(401, AppsmithErrorCode.INVALID_LOGIN_METHOD.getCode(), "Please use {0} authentication to login to Appsmith", AppsmithErrorAction.DEFAULT, "Invalid login method", ErrorType.INTERNAL_ERROR, null),
    INVALID_GIT_CONFIGURATION(400, AppsmithErrorCode.INVALID_GIT_CONFIGURATION.getCode(), "Git configuration is invalid. Details: {0}", AppsmithErrorAction.DEFAULT, "Invalid Git configuration", ErrorType.GIT_CONFIGURATION_ERROR, null),
    INVALID_GIT_SSH_CONFIGURATION(400, AppsmithErrorCode.INVALID_GIT_SSH_CONFIGURATION.getCode(), "SSH key is not configured correctly. Did you forget to add the SSH key to your remote repository? Please try again by reconfiguring the SSH key with write access.", AppsmithErrorAction.DEFAULT, "SSH key not configured", ErrorType.GIT_CONFIGURATION_ERROR, ErrorReferenceDocUrl.GIT_DEPLOY_KEY.getDocUrl()),
    INVALID_GIT_REPO(400, AppsmithErrorCode.INVALID_GIT_REPO.getCode(), "The remote repository is not empty. Please create a new empty repository and configure the SSH keys. " +
            "If you wish to clone and build an application from an existing remote repository, please use the \"Import from a Git repository\" option in the home page.", AppsmithErrorAction.DEFAULT, "Invalid Git repository", ErrorType.GIT_CONFIGURATION_ERROR, null),
    DEFAULT_RESOURCES_UNAVAILABLE(400, AppsmithErrorCode.DEFAULT_RESOURCES_UNAVAILABLE.getCode(), "Unexpected state. Default resources are unavailable for {0} with id {1}. Please reach out to Appsmith customer support to resolve this.",
            AppsmithErrorAction.LOG_EXTERNALLY, "Default resources not found", ErrorType.BAD_REQUEST, null),
    GIT_MERGE_FAILED_REMOTE_CHANGES(406, AppsmithErrorCode.GIT_MERGE_FAILED_REMOTE_CHANGES.getCode(), "Remote is ahead of local by {0} commits on branch {1}. Please pull remote changes first and try again.", AppsmithErrorAction.DEFAULT, "Git merge failed for remote changes", ErrorType.GIT_ACTION_EXECUTION_ERROR, ErrorReferenceDocUrl.GIT_UPSTREAM_CHANGES.getDocUrl()),
    GIT_MERGE_FAILED_LOCAL_CHANGES(406, AppsmithErrorCode.GIT_MERGE_FAILED_LOCAL_CHANGES.getCode(), "There are uncommitted changes present in your local branch {0}. Please commit them first and try again", AppsmithErrorAction.DEFAULT, "Git merge failed for local changes", ErrorType.GIT_ACTION_EXECUTION_ERROR, null),
    REMOVE_LAST_WORKSPACE_ADMIN_ERROR(400, AppsmithErrorCode.REMOVE_LAST_WORKSPACE_ADMIN_ERROR.getCode(), "The last admin cannot be removed from the workspace", AppsmithErrorAction.DEFAULT, "Last admin cannot be removed", ErrorType.INTERNAL_ERROR, null),
    INVALID_CRUD_PAGE_REQUEST(400, AppsmithErrorCode.INVALID_CRUD_PAGE_REQUEST.getCode(), "Unable to process page generation request, {0}", AppsmithErrorAction.DEFAULT, "Invalid page generation request", ErrorType.BAD_REQUEST, null),
    UNSUPPORTED_OPERATION_FOR_REMOTE_BRANCH(400, AppsmithErrorCode.UNSUPPORTED_OPERATION_FOR_REMOTE_BRANCH.getCode(), "This operation is not supported for remote branch {0}. Please use local branches only to proceed", AppsmithErrorAction.DEFAULT, "Unsupported Operation", ErrorType.BAD_REQUEST, null),
    ROLES_FROM_SAME_WORKSPACE(400, AppsmithErrorCode.ROLES_FROM_SAME_WORKSPACE.getCode(), "Roles for the same Workspace provided or already exists.", AppsmithErrorAction.DEFAULT, "Roles already exist", ErrorType.ARGUMENT_ERROR, null),
    INTERNAL_SERVER_ERROR(500, AppsmithErrorCode.INTERNAL_SERVER_ERROR.getCode(), "Internal server error while processing request", AppsmithErrorAction.LOG_EXTERNALLY, "Internal server error", ErrorType.INTERNAL_ERROR, null),
    REPOSITORY_SAVE_FAILED(500, AppsmithErrorCode.REPOSITORY_SAVE_FAILED.getCode(), "Failed to save the repository. Please try again later.", AppsmithErrorAction.DEFAULT, "Failed to save", ErrorType.INTERNAL_ERROR, null),
    PLUGIN_INSTALLATION_FAILED_DOWNLOAD_ERROR(500, AppsmithErrorCode.PLUGIN_INSTALLATION_FAILED_DOWNLOAD_ERROR.getCode(), "Plugin installation failed due to an error while " +
            "downloading it. Check the jar location & try again.", AppsmithErrorAction.LOG_EXTERNALLY, "Plugin installation failed", ErrorType.INTERNAL_ERROR, null),
    PLUGIN_RUN_FAILED(500, AppsmithErrorCode.PLUGIN_RUN_FAILED.getCode(), "Plugin execution failed with error {0}", AppsmithErrorAction.DEFAULT, "Plugin execution failed", ErrorType.INTERNAL_ERROR, null),
    PLUGIN_EXECUTION_TIMEOUT(504, AppsmithErrorCode.PLUGIN_EXECUTION_TIMEOUT.getCode(), "Plugin execution exceeded the maximum allowed time. Please increase the timeout in your action settings or check your backend action endpoint",
            AppsmithErrorAction.DEFAULT, "Timeout in plugin execution", ErrorType.CONNECTIVITY_ERROR, null),
    PLUGIN_LOAD_FORM_JSON_FAIL(500, AppsmithErrorCode.PLUGIN_LOAD_FORM_JSON_FAIL.getCode(), "[{0}] Unable to load datasource form configuration. Details: {1}.",
            AppsmithErrorAction.LOG_EXTERNALLY, "Unable to load datasource form configuration", ErrorType.INTERNAL_ERROR, null),
    PLUGIN_LOAD_TEMPLATES_FAIL(500, AppsmithErrorCode.PLUGIN_LOAD_TEMPLATES_FAIL.getCode(), "Unable to load datasource templates. Details: {0}.",
            AppsmithErrorAction.LOG_EXTERNALLY, "Unable to load datasource templates", ErrorType.INTERNAL_ERROR, null),
    IO_ERROR(503, AppsmithErrorCode.IO_ERROR.getCode(), "IO action failed with error {0}", AppsmithErrorAction.DEFAULT, "I/O error", ErrorType.INTERNAL_ERROR, null),
    MARKETPLACE_TIMEOUT(504, AppsmithErrorCode.MARKETPLACE_TIMEOUT.getCode(), "Marketplace is responding too slowly. Please try again later",
            AppsmithErrorAction.DEFAULT, "Timeout in marketplace", ErrorType.CONNECTIVITY_ERROR, null),
    DATASOURCE_HAS_ACTIONS(409, AppsmithErrorCode.DATASOURCE_HAS_ACTIONS.getCode(), "Cannot delete datasource since it has {0} action(s) using it.",
            AppsmithErrorAction.DEFAULT, "Datasource cannot be deleted", ErrorType.BAD_REQUEST, null),
    WORKSPACE_ID_NOT_GIVEN(400, AppsmithErrorCode.WORKSPACE_ID_NOT_GIVEN.getCode(), "Missing workspace id. Please enter one.", AppsmithErrorAction.DEFAULT, "Missing workspace id", ErrorType.ARGUMENT_ERROR, null),
    INVALID_CURL_METHOD(400, AppsmithErrorCode.INVALID_CURL_METHOD.getCode(), "Invalid method in cURL command: {0}.", AppsmithErrorAction.DEFAULT, "Invalid method in cURL command", ErrorType.ARGUMENT_ERROR, null),
    OAUTH_NOT_AVAILABLE(500, AppsmithErrorCode.OAUTH_NOT_AVAILABLE.getCode(), "Login with {0} is not supported.", AppsmithErrorAction.LOG_EXTERNALLY, "Unsupported login method", ErrorType.BAD_REQUEST, null),
    MARKETPLACE_NOT_CONFIGURED(500, AppsmithErrorCode.MARKETPLACE_NOT_CONFIGURED.getCode(), "Marketplace is not configured.", AppsmithErrorAction.DEFAULT, "Marketplace not configured", ErrorType.CONFIGURATION_ERROR, null),
    PAYLOAD_TOO_LARGE(413, AppsmithErrorCode.PAYLOAD_TOO_LARGE.getCode(), "The request payload is too large. Max allowed size for request payload is {0} KB",
            AppsmithErrorAction.DEFAULT, "Payload exceeds max allowed size", ErrorType.CONNECTIVITY_ERROR, null),
    SIGNUP_DISABLED(403, AppsmithErrorCode.SIGNUP_DISABLED.getCode(), "Signup is restricted on this instance of Appsmith. Please contact the administrator to get an invite for user {0}.",
            AppsmithErrorAction.DEFAULT, "Signup disabled", ErrorType.INTERNAL_ERROR, null),
    FAIL_UPDATE_USER_IN_SESSION(500, AppsmithErrorCode.FAIL_UPDATE_USER_IN_SESSION.getCode(), "Unable to update user in session.", AppsmithErrorAction.LOG_EXTERNALLY, "Unable to update user in session", ErrorType.INTERNAL_ERROR, null),
    APPLICATION_FORKING_NOT_ALLOWED(403, AppsmithErrorCode.APPLICATION_FORKING_NOT_ALLOWED.getCode(), "Forking this application is not permitted at this time.", AppsmithErrorAction.DEFAULT, "Forking application not permitted", ErrorType.INTERNAL_ERROR, null),
    GOOGLE_RECAPTCHA_TIMEOUT(504, AppsmithErrorCode.GOOGLE_RECAPTCHA_TIMEOUT.getCode(), "Google recaptcha verification timeout. Please try again.", AppsmithErrorAction.DEFAULT, "Timeout in Google recaptcha verification", ErrorType.INTERNAL_ERROR, null),
    GOOGLE_RECAPTCHA_FAILED(401, AppsmithErrorCode.GOOGLE_RECAPTCHA_FAILED.getCode(), "Google recaptcha verification failed. Please try again.", AppsmithErrorAction.DEFAULT, "Google recaptcha verification failed", ErrorType.INTERNAL_ERROR, null),
    UNKNOWN_ACTION_RESULT_DATA_TYPE(500, AppsmithErrorCode.UNKNOWN_ACTION_RESULT_DATA_TYPE.getCode(), "Appsmith has encountered an unknown action result data type: {0}. " +
            "Please contact Appsmith customer support to resolve this.", AppsmithErrorAction.LOG_EXTERNALLY, "Unexpected data type", ErrorType.BAD_REQUEST, null),
    INVALID_CURL_HEADER(400, AppsmithErrorCode.INVALID_CURL_HEADER.getCode(), "Invalid header in cURL command: {0}.", AppsmithErrorAction.DEFAULT, "Invalid header in cURL command", ErrorType.ARGUMENT_ERROR, null),
    AUTHENTICATION_FAILURE(500, AppsmithErrorCode.AUTHENTICATION_FAILURE.getCode(), "Authentication failed with error: {0}", AppsmithErrorAction.DEFAULT, "Authentication failed", ErrorType.AUTHENTICATION_ERROR, null),
    INSTANCE_REGISTRATION_FAILURE(500, AppsmithErrorCode.INSTANCE_REGISTRATION_FAILURE.getCode(), "Registration for instance failed with error: {0}", AppsmithErrorAction.LOG_EXTERNALLY, "Registration failed for this instance", ErrorType.INTERNAL_ERROR, null),
    TOO_MANY_REQUESTS(429, AppsmithErrorCode.TOO_MANY_REQUESTS.getCode(), "Too many requests received. Please try later.", AppsmithErrorAction.DEFAULT, "Too many requests", ErrorType.INTERNAL_ERROR, null),
    INVALID_JS_ACTION(400, AppsmithErrorCode.INVALID_JS_ACTION.getCode(), "Something went wrong while trying to parse this action. Please check the JS object for errors.", AppsmithErrorAction.DEFAULT, "Invalid action in JS object", ErrorType.BAD_REQUEST, null),
    CYCLICAL_DEPENDENCY_ERROR(400, AppsmithErrorCode.CYCLICAL_DEPENDENCY_ERROR.getCode(), "Cyclical dependency error encountered while parsing relationship [{0}] where the relationship is denoted as (source : target).", AppsmithErrorAction.DEFAULT, "Cyclical Dependency in Page Load Actions", ErrorType.CONFIGURATION_ERROR, null),
    CLOUD_SERVICES_ERROR(500, AppsmithErrorCode.CLOUD_SERVICES_ERROR.getCode(), "Received error from cloud services {0}", AppsmithErrorAction.DEFAULT, "Error in cloud services", ErrorType.INTERNAL_ERROR, null),
    GIT_APPLICATION_LIMIT_ERROR(402, AppsmithErrorCode.GIT_APPLICATION_LIMIT_ERROR.getCode(), "You have reached the maximum number of private git repo counts which can be connected to the workspace. Please reach out to Appsmith support to opt for commercial plan.", AppsmithErrorAction.DEFAULT, "Maximum number of Git repo connection limit reached", ErrorType.EE_FEATURE_ERROR, null),
    GIT_ACTION_FAILED(400, AppsmithErrorCode.GIT_ACTION_FAILED.getCode(), "git {0} failed. \nDetails: {1}", AppsmithErrorAction.DEFAULT, "Git failed", ErrorType.GIT_ACTION_EXECUTION_ERROR, null),
    GIT_FILE_SYSTEM_ERROR(503, AppsmithErrorCode.GIT_FILE_SYSTEM_ERROR.getCode(), "Error while accessing the file system. {0}", AppsmithErrorAction.DEFAULT, "Git file system error", ErrorType.GIT_CONFIGURATION_ERROR, ErrorReferenceDocUrl.FILE_PATH_NOT_SET.getDocUrl()),
    GIT_EXECUTION_TIMEOUT(504, AppsmithErrorCode.GIT_EXECUTION_TIMEOUT.getCode(), "Git command execution exceeded the maximum allowed time, please contact Appsmith support for more details", AppsmithErrorAction.DEFAULT, "Timeout in Git command execution", ErrorType.CONNECTIVITY_ERROR, null),
    INCOMPATIBLE_IMPORTED_JSON(400, AppsmithErrorCode.INCOMPATIBLE_IMPORTED_JSON.getCode(), "Provided file is incompatible, please upgrade your instance to resolve this conflict.", AppsmithErrorAction.DEFAULT, "Incompatible Json file", ErrorType.BAD_REQUEST, null),
    GIT_MERGE_CONFLICTS(400, AppsmithErrorCode.GIT_MERGE_CONFLICTS.getCode(), "Merge conflicts found: {0}", AppsmithErrorAction.DEFAULT, "Merge conflicts found", ErrorType.GIT_ACTION_EXECUTION_ERROR, ErrorReferenceDocUrl.GIT_MERGE_CONFLICT.getDocUrl()),
    GIT_PULL_CONFLICTS(400, AppsmithErrorCode.GIT_PULL_CONFLICTS.getCode(), "Merge conflicts found during the pull operation: {0}", AppsmithErrorAction.DEFAULT, "Merge conflicts found during the pull operation", ErrorType.GIT_ACTION_EXECUTION_ERROR, ErrorReferenceDocUrl.GIT_PULL_CONFLICT.getDocUrl()),
    SSH_KEY_GENERATION_ERROR(500, AppsmithErrorCode.SSH_KEY_GENERATION_ERROR.getCode(), "Failed to generate SSH keys, please contact Appsmith support for more details", AppsmithErrorAction.DEFAULT, "Failed to generate SSH keys", ErrorType.GIT_CONFIGURATION_ERROR, null),
    GIT_GENERIC_ERROR(504, AppsmithErrorCode.GIT_GENERIC_ERROR.getCode(), "Git command execution error: {0}", AppsmithErrorAction.DEFAULT, "Git command execution error", ErrorType.GIT_ACTION_EXECUTION_ERROR, null),
    GIT_UPSTREAM_CHANGES(400, AppsmithErrorCode.GIT_UPSTREAM_CHANGES.getCode(), "Looks like there are pending upstream changes. To prevent you from losing history, we will pull the changes and push them to your repo.", AppsmithErrorAction.DEFAULT, "Git push failed for pending upstream changes", ErrorType.GIT_UPSTREAM_CHANGES_PUSH_EXECUTION_ERROR, ErrorReferenceDocUrl.GIT_UPSTREAM_CHANGES.getDocUrl()),
    GENERIC_JSON_IMPORT_ERROR(400, AppsmithErrorCode.GENERIC_JSON_IMPORT_ERROR.getCode(), "Unable to import application in workspace {0}, {1}", AppsmithErrorAction.DEFAULT, "Unable to import application in workspace", ErrorType.BAD_REQUEST, null),
    FILE_PART_DATA_BUFFER_ERROR(500, AppsmithErrorCode.FILE_PART_DATA_BUFFER_ERROR.getCode(), "Failed to upload file with error: {0}", AppsmithErrorAction.DEFAULT, "Failed to upload file", ErrorType.BAD_REQUEST, null),
    MIGRATION_ERROR(500, AppsmithErrorCode.MIGRATION_ERROR.getCode(), "This action is already migrated", AppsmithErrorAction.DEFAULT, "Action already migrated", ErrorType.INTERNAL_ERROR, null),
    INVALID_GIT_SSH_URL(400, AppsmithErrorCode.INVALID_GIT_SSH_URL.getCode(), "Please enter valid SSH URL of your repository", AppsmithErrorAction.DEFAULT, "Invalid SSH URL", ErrorType.GIT_CONFIGURATION_ERROR, null),
    REPOSITORY_NOT_FOUND(404, AppsmithErrorCode.REPOSITORY_NOT_FOUND.getCode(), "Unable to find the remote repository for application {0}, please check the deploy key configuration in your remote repository.", AppsmithErrorAction.DEFAULT, "Repository not found", ErrorType.REPOSITORY_NOT_FOUND, null),
    UNKNOWN_PLUGIN_REFERENCE(400, AppsmithErrorCode.UNKNOWN_PLUGIN_REFERENCE.getCode(), "Unable to find the plugin {0} Please reach out to Appsmith customer support to resolve this.", AppsmithErrorAction.DEFAULT, "Unknown plugin", ErrorType.CONFIGURATION_ERROR, null),
    ENV_FILE_NOT_FOUND(500, AppsmithErrorCode.ENV_FILE_NOT_FOUND.getCode(), "Admin Settings is unavailable. Unable to read and write to Environment file.", AppsmithErrorAction.DEFAULT, "Environment file not found", ErrorType.CONFIGURATION_ERROR, null),
    PUBLIC_APP_NO_PERMISSION_GROUP(500, AppsmithErrorCode.PUBLIC_APP_NO_PERMISSION_GROUP.getCode(), "Invalid state. Public application does not have the required roles set for public access. Please reach out to Appsmith customer support to resolve this.", AppsmithErrorAction.LOG_EXTERNALLY, "Required permission missing for public access", ErrorType.INTERNAL_ERROR, null),
    RTS_SERVER_ERROR(500, AppsmithErrorCode.RTS_SERVER_ERROR.getCode(), "RTS server error while processing request: {0}", AppsmithErrorAction.LOG_EXTERNALLY, "RTS server error", ErrorType.INTERNAL_ERROR, null),
    SCHEMA_MISMATCH_ERROR(500, AppsmithErrorCode.SCHEMA_MISMATCH_ERROR.getCode(), "Looks like you skipped some required update(s), please go back to the mandatory upgrade path {0}, or refer to ''https://docs.appsmith.com/'' for more info", AppsmithErrorAction.LOG_EXTERNALLY, "Schema mismatch error", ErrorType.INTERNAL_ERROR, null),
    SCHEMA_VERSION_NOT_FOUND_ERROR(500, AppsmithErrorCode.SCHEMA_VERSION_NOT_FOUND_ERROR.getCode(), "Could not find mandatory instance schema version config. Please reach out to Appsmith customer support to resolve this.", AppsmithErrorAction.LOG_EXTERNALLY, "Schema version not found", ErrorType.INTERNAL_ERROR, null),
    HEALTHCHECK_TIMEOUT(408, AppsmithErrorCode.HEALTHCHECK_TIMEOUT.getCode(), "{0} connection timed out.", AppsmithErrorAction.DEFAULT, "Connection timeout during health check", ErrorType.CONNECTIVITY_ERROR, null),
    SERVER_NOT_READY(500, AppsmithErrorCode.SERVER_NOT_READY.getCode(), "Appsmith server is not ready. Please try again in some time.", AppsmithErrorAction.LOG_EXTERNALLY, "Server not ready", ErrorType.INTERNAL_ERROR, null),
    SESSION_BAD_STATE(500, AppsmithErrorCode.SESSION_BAD_STATE.getCode(), "User session is invalid. Please log out and log in again.", AppsmithErrorAction.LOG_EXTERNALLY, "Invalid user session", ErrorType.INTERNAL_ERROR, null),
    INVALID_LICENSE_KEY_ENTERED(400, AppsmithErrorCode.INVALID_LICENSE_KEY_ENTERED.getCode(), "The license key entered is invalid. Please try again.", AppsmithErrorAction.DEFAULT, "Invalid license key", ErrorType.ARGUMENT_ERROR, null),
    GIT_FILE_IN_USE(500, AppsmithErrorCode.GIT_FILE_IN_USE.getCode(), "Your Git repo is in use by another member of your team. Usually, this takes a few seconds. Please try again a little later.", AppsmithErrorAction.DEFAULT, "Git repo is locked", ErrorType.GIT_ACTION_EXECUTION_ERROR, null),
    CSRF_TOKEN_INVALID(403, AppsmithErrorCode.CSRF_TOKEN_INVALID.getCode(), "CSRF token missing/invalid. Please try again.", AppsmithErrorAction.DEFAULT, "CSRF token missing/invalid", ErrorType.BAD_REQUEST, null),
    ;

    private final Integer httpErrorCode;
    private final String appErrorCode;
    private final String message;
    private final String title;
    private final AppsmithErrorAction errorAction;
    @NonNull
    private final ErrorType errorType;
    private final String referenceDoc;

    AppsmithError(
            Integer httpErrorCode,
            String appErrorCode,
            String message,
            AppsmithErrorAction errorAction,
            String title,
            @NonNull ErrorType errorType,
            String referenceDoc
    ) {
        this.httpErrorCode = httpErrorCode;
        this.appErrorCode = appErrorCode;
        this.errorType = errorType;
        this.message = message;
        this.errorAction = errorAction;
        this.title = title;
        this.referenceDoc = referenceDoc;
    }

    public String getMessage(Object... args) {
        return new MessageFormat(this.message).format(args);
    }

    public AppsmithErrorAction getErrorAction() {
        return this.errorAction;
    }

    public String getErrorType() {
        return this.errorType.toString();
    }
}
