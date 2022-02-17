package com.appsmith.server.exceptions;

import com.appsmith.external.exceptions.AppsmithErrorAction;
import com.appsmith.external.models.ErrorType;
import com.appsmith.external.constants.ErrorReferenceDocUrl;
import lombok.Getter;

import java.text.MessageFormat;

@Getter
public enum AppsmithError {
    INVALID_PARAMETER(400, 4000, "Please enter a valid parameter {0}.", AppsmithErrorAction.DEFAULT, null, ErrorType.ARGUMENT_ERROR, null),
    PLUGIN_NOT_INSTALLED(400, 4001, "Plugin {0} not installed", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR, null),
    PLUGIN_ID_NOT_GIVEN(400, 4002, "Missing plugin id. Please enter one.", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR, null),
    DATASOURCE_NOT_GIVEN(400, 4003, "Missing datasource. Add/enter/connect a datasource to create a valid action.",
            AppsmithErrorAction.DEFAULT, null, ErrorType.ARGUMENT_ERROR, null),
    PAGE_ID_NOT_GIVEN(400, 4004, "Missing page id. Please enter one.", AppsmithErrorAction.DEFAULT, null, ErrorType.ARGUMENT_ERROR, null),
    DUPLICATE_KEY_USER_ERROR(400, 4005, "{0} already exists. Please use a different {1}", AppsmithErrorAction.DEFAULT, null, ErrorType.BAD_REQUEST, null),
    PAGE_DOESNT_BELONG_TO_USER_ORGANIZATION(400, 4006, "Page {0} does not belong to the current user {1} " +
            "organization", AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.BAD_REQUEST, null),
    UNSUPPORTED_OPERATION(400, 4007, "Unsupported operation", AppsmithErrorAction.DEFAULT, null, ErrorType.BAD_REQUEST, null),
    DEPRECATED_API(400, 4008, "This API has been deprecated, please contact the Appsmith support for more details.", AppsmithErrorAction.DEFAULT, null, ErrorType.BAD_REQUEST, null),
    USER_DOESNT_BELONG_ANY_ORGANIZATION(400, 4009, "User {0} does not belong to any organization",
            AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.INTERNAL_ERROR, null),
    USER_DOESNT_BELONG_TO_ORGANIZATION(400, 4010, "User {0} does not belong to an organization with id {1}",
            AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.INTERNAL_ERROR, null),
    NO_CONFIGURATION_FOUND_IN_DATASOURCE(400, 4011, "No datasource configuration found. Please configure it and try again.", 
            AppsmithErrorAction.DEFAULT, "Datasource configuration is invalid",  ErrorType.DATASOURCE_CONFIGURATION_ERROR, null),
    INVALID_ACTION_COLLECTION(400, 4038, "{0} is not correctly configured. Please fix the following and then re-run: \n{1}",
            AppsmithErrorAction.DEFAULT, "Collection configuration is invalid",  ErrorType.CONFIGURATION_ERROR, null),
    INVALID_ACTION(400, 4012, "{0} is not correctly configured. Please fix the following and then re-run: \n{1}",
            AppsmithErrorAction.DEFAULT, "Action configuration is invalid", ErrorType.CONFIGURATION_ERROR, null),
    INVALID_DATASOURCE(400, 4013, "{0} is not correctly configured. Please fix the following and then re-run: \n{1}",
            AppsmithErrorAction.DEFAULT, "Datasource configuration is invalid", ErrorType.DATASOURCE_CONFIGURATION_ERROR, null),
    INVALID_DATASOURCE_CONFIGURATION(400, 4015, "Datasource configuration is invalid",
            AppsmithErrorAction.DEFAULT, "Datasource configuration is invalid", ErrorType.DATASOURCE_CONFIGURATION_ERROR, null),
    INVALID_ACTION_NAME(400, 4014, "Appsmith expects all entities to follow Javascript variable naming conventions. "
            + "It must be a single word containing alphabets, numbers, or \"_\". Any other special characters like hyphens (\"-\"), comma (\",\"), hash (\"#\") etc. "
            + "are not allowed. "
            + "Please change the name.", AppsmithErrorAction.DEFAULT, null, ErrorType.CONFIGURATION_ERROR, null),
    NO_CONFIGURATION_FOUND_IN_ACTION(400, 4016, "No configurations found in this action", AppsmithErrorAction.DEFAULT, null, ErrorType.CONFIGURATION_ERROR, null),
    NAME_CLASH_NOT_ALLOWED_IN_REFACTOR(400, 4017, "The new name {1} already exists in the current page. Choose another name.", AppsmithErrorAction.DEFAULT, null,
            ErrorType.BAD_REQUEST, null),
    PAGE_DOESNT_BELONG_TO_APPLICATION(400, 4018, "Unexpected state. Page {0} does not seem belong to the application {1}. Please reach out to Appsmith customer support to resolve this.",
            AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.BAD_REQUEST, null),
    INVALID_DYNAMIC_BINDING_REFERENCE(400, 4022,
            "  \"widgetType\" : \"{0}\"," +
                    "  \"bindingPath\" : \"{3}\"," +
                    "  \"message\" : \"Binding path in the widget not found. Please reach out to Appsmith customer support to resolve this.\"," +
                    "  \"widgetName\" : \"{1}\"," +
                    "  \"widgetId\" : \"{2}\"," +
                    "  \"pageId\" : \"{4}\"," +
                    "  \"layoutId\" : \"{5}\"," +
                    "  \"dynamicBinding\" : {6}",
            AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.BAD_REQUEST, null),
    USER_ALREADY_EXISTS_IN_ORGANIZATION(400, 4021, "The user {0} has already been added to the organization with role {1}. To change the role, please navigate to `Manage Users` page.",
            AppsmithErrorAction.DEFAULT, null, ErrorType.BAD_REQUEST, null),
    UNAUTHORIZED_DOMAIN(401, 4019, "Invalid email domain {0} used for sign in/sign up. Please contact the administrator to configure this domain if this is unexpected.",
            AppsmithErrorAction.DEFAULT, null, ErrorType.AUTHENTICATION_ERROR, null),
    USER_NOT_SIGNED_IN(401, 4020, "You are not logged in. Please sign in with the registered email ID or sign up",
            AppsmithErrorAction.DEFAULT, null, ErrorType.AUTHENTICATION_ERROR, null),
    INVALID_PASSWORD_RESET(400, 4020, "Cannot find an outstanding reset password request for this email. Please initiate a request via 'forgot password' " +
            "button to reset your password", AppsmithErrorAction.DEFAULT, null, null, null),
    INVALID_PASSWORD_LENGTH(400, 4037, "Password length should be between {0} and {1}" , AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR, null),
    JSON_PROCESSING_ERROR(400, 4022, "Json processing error with error {0}", AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.INTERNAL_ERROR, null),
    INVALID_CREDENTIALS(200, 4023, "Invalid credentials provided. Did you input the credentials correctly?", AppsmithErrorAction.DEFAULT, null, ErrorType.AUTHENTICATION_ERROR, null),
    UNAUTHORIZED_ACCESS(403, 4025, "Unauthorized access", AppsmithErrorAction.DEFAULT, null, ErrorType.AUTHENTICATION_ERROR, null),
    DUPLICATE_KEY(409, 4024, "Unexpected state : Duplicate key error. Message : {0}. Please reach out to Appsmith customer support to report this",
            AppsmithErrorAction.DEFAULT, null, ErrorType.BAD_REQUEST, null),
    USER_ALREADY_EXISTS_SIGNUP(409, 4025, "There is already an account registered with this email {0}. Please sign in instead.",
            AppsmithErrorAction.DEFAULT, null, ErrorType.BAD_REQUEST, null),
    ACTION_IS_NOT_AUTHORIZED(403, 4026, "Uh oh! You do not have permissions to do : {0}", AppsmithErrorAction.DEFAULT, null, ErrorType.AUTHENTICATION_ERROR, null),
    NO_RESOURCE_FOUND(404, 4027, "Unable to find {0} {1}", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR, null),
    USER_NOT_FOUND(404, 4027, "Unable to find user with email {0}", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR, null),
    ACL_NO_RESOURCE_FOUND(404, 4028, "Unable to find {0} {1}. Either the asset doesn't exist or you don't have required permissions",
            AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR, null),
    GENERIC_BAD_REQUEST(400, 4028, "Bad Request: {0}", AppsmithErrorAction.DEFAULT, null, ErrorType.BAD_REQUEST, null),
    VALIDATION_FAILURE(400, 4028, "Validation Failure(s): {0}", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR, null),
    INVALID_CURL_COMMAND(400, 4029, "Invalid cURL command, couldn't import.", AppsmithErrorAction.DEFAULT, null, ErrorType.ARGUMENT_ERROR, null),
    INVALID_LOGIN_METHOD(401, 4030, "Please use {0} authentication to login to Appsmith", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR, null),
    INVALID_GIT_CONFIGURATION(400, 4031, "Git configuration is invalid. Details: {0}", AppsmithErrorAction.DEFAULT, null, ErrorType.GIT_CONFIGURATION_ERROR, null),
    INVALID_GIT_SSH_CONFIGURATION(400, 4032, "SSH Key is not configured properly. Did you forget to add SSH key to remote? Can you please try again by reconfiguring the SSH key with write access", AppsmithErrorAction.DEFAULT, null, ErrorType.GIT_CONFIGURATION_ERROR, ErrorReferenceDocUrl.GIT_DEPLOY_KEY),
    INVALID_GIT_REPO(400, 4033, "The remote repo is not empty. Please create a new empty repo and configure the SSH keys. " +
            "If you want to clone from remote repo and build application, please use import application from git option.", AppsmithErrorAction.DEFAULT, null, ErrorType.GIT_CONFIGURATION_ERROR, null),
    DEFAULT_RESOURCES_UNAVAILABLE(400, 4034, "Unexpected state. Default resources are unavailable for {0} with id {1}. Please reach out to Appsmith customer support to resolve this.",
            AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.BAD_REQUEST, null),
    GIT_MERGE_FAILED_REMOTE_CHANGES(406, 4036, "Remote is ahead of local by {0} commits on branch {1}. Please pull remote changes first and try again.", AppsmithErrorAction.DEFAULT, null, ErrorType.GIT_ACTION_EXECUTION_ERROR, ErrorReferenceDocUrl.GIT_UPSTREAM_CHANGES),
    GIT_MERGE_FAILED_LOCAL_CHANGES(406, 4037, "There are uncommitted changes present in your local branch {0}. Please commit them first and try again", AppsmithErrorAction.DEFAULT, null, ErrorType.GIT_ACTION_EXECUTION_ERROR, null),
    REMOVE_LAST_ORG_ADMIN_ERROR(400, 4038, "The last admin can not be removed from an organization", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR, null),
    INVALID_CRUD_PAGE_REQUEST(400, 4039, "Unable to process page generation request, {0}", AppsmithErrorAction.DEFAULT, null, ErrorType.BAD_REQUEST, null),
    UNSUPPORTED_OPERATION_FOR_REMOTE_BRANCH(400, 4040, "This operation is not supported for remote branch {0}. Please use local branches only to proceed", AppsmithErrorAction.DEFAULT, "Unsupported Operation!", ErrorType.BAD_REQUEST, null),
    INTERNAL_SERVER_ERROR(500, 5000, "Internal server error while processing request", AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.INTERNAL_ERROR, null),
    REPOSITORY_SAVE_FAILED(500, 5001, "Failed to save the repository. Try again.", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR, null),
    PLUGIN_INSTALLATION_FAILED_DOWNLOAD_ERROR(500, 5002, "Plugin installation failed due to an error while " +
            "downloading it. Check the jar location & try again.", AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.INTERNAL_ERROR, null),
    PLUGIN_RUN_FAILED(500, 5003, "Plugin execution failed with error {0}", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR, null),
    PLUGIN_EXECUTION_TIMEOUT(504, 5040, "Plugin Execution exceeded the maximum allowed time. Please increase the timeout in your action settings or check your backend action endpoint",
            AppsmithErrorAction.DEFAULT, null, ErrorType.CONNECTIVITY_ERROR, null),
    PLUGIN_LOAD_FORM_JSON_FAIL(500, 5004, "[{0}] Unable to load datasource form configuration. Details: {1}.",
            AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.INTERNAL_ERROR, null),
    PLUGIN_LOAD_TEMPLATES_FAIL(500, 5005, "Unable to load datasource templates. Details: {0}.",
            AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.INTERNAL_ERROR, null),
    IO_ERROR(503, 5003, "IO action failed with error {0}", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR, null),
    MARKETPLACE_TIMEOUT(504, 5041, "Marketplace is responding too slowly. Please try again later",
            AppsmithErrorAction.DEFAULT, null, ErrorType.CONNECTIVITY_ERROR, null),
    DATASOURCE_HAS_ACTIONS(409, 4030, "Cannot delete datasource since it has {0} action(s) using it.",
            AppsmithErrorAction.DEFAULT, null, ErrorType.BAD_REQUEST, null),
    ORGANIZATION_ID_NOT_GIVEN(400, 4031, "Missing organization id. Please enter one.", AppsmithErrorAction.DEFAULT, null, ErrorType.ARGUMENT_ERROR, null),
    INVALID_CURL_METHOD(400, 4032, "Invalid method in cURL command: {0}.", AppsmithErrorAction.DEFAULT, null, ErrorType.ARGUMENT_ERROR, null),
    OAUTH_NOT_AVAILABLE(500, 5006, "Login with {0} is not supported.", AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.BAD_REQUEST, null),
    MARKETPLACE_NOT_CONFIGURED(500, 5007, "Marketplace is not configured.", AppsmithErrorAction.DEFAULT, null, ErrorType.CONFIGURATION_ERROR, null),
    PAYLOAD_TOO_LARGE(413, 4028, "The request payload is too large. Max allowed size for request payload is {0} KB",
            AppsmithErrorAction.DEFAULT, null, ErrorType.CONNECTIVITY_ERROR, null),
    SIGNUP_DISABLED(403, 4033, "Signup is restricted on this instance of Appsmith. Please contact the administrator to get an invite.",
            AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR, null),
    FAIL_UPDATE_USER_IN_SESSION(500, 5008, "Unable to update user in session.", AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.INTERNAL_ERROR, null),
    APPLICATION_FORKING_NOT_ALLOWED(403, 4034, "Forking this application is not permitted at this time.", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR, null),
    GOOGLE_RECAPTCHA_TIMEOUT(504, 5042, "Google recaptcha verification timeout. Please try again.", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR, null),
    GOOGLE_RECAPTCHA_FAILED(401, 4035, "Google recaptcha verification failed. Please try again.", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR, null),
    UNKNOWN_ACTION_RESULT_DATA_TYPE(500, 5009, "Appsmith has encountered an unknown action result data type: {0}. " +
            "Please contact Appsmith customer support to resolve this.", AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.BAD_REQUEST, null),
    INVALID_CURL_HEADER(400, 4036, "Invalid header in cURL command: {0}.", AppsmithErrorAction.DEFAULT, null, ErrorType.ARGUMENT_ERROR, null),
    AUTHENTICATION_FAILURE(500, 5010, "Authentication failed with error: {0}", AppsmithErrorAction.DEFAULT, null, ErrorType.AUTHENTICATION_ERROR, null),
    INSTANCE_REGISTRATION_FAILURE(500, 5011, "Registration for instance failed with error: {0}", AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.INTERNAL_ERROR, null),
    TOO_MANY_REQUESTS(429, 4039, "Too many requests received. Please try later.", AppsmithErrorAction.DEFAULT, "Too many requests", ErrorType.INTERNAL_ERROR, null),
    INVALID_JS_ACTION(400, 4040, "Something went wrong while trying to parse this action. Please check the JS object for errors.", AppsmithErrorAction.DEFAULT, null, ErrorType.BAD_REQUEST, null),
    CYCLICAL_DEPENDENCY_ERROR(400, 4041, "Cyclical dependency error encountered while parsing relationship [{0}] where the relationship is denoted as (source : target).", AppsmithErrorAction.DEFAULT, "Cyclical Dependency in Page Load Actions", ErrorType.CONFIGURATION_ERROR, null),
    CLOUD_SERVICES_ERROR(500, 5012, "Received error from cloud services {0}", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR, null),
    GIT_APPLICATION_LIMIT_ERROR(402, 4043, "You have reached the maximum number of private git repo counts which can be  connected to the organization. Please reach out to Appsmith support to opt for commercial plan.", AppsmithErrorAction.DEFAULT, null, ErrorType.EE_FEATURE_ERROR, null),
    GIT_ACTION_FAILED(400, 4044, "git {0} failed. \nDetails: {1}", AppsmithErrorAction.DEFAULT, null, ErrorType.GIT_ACTION_EXECUTION_ERROR, null),
    GIT_FILE_SYSTEM_ERROR(503, 5013, "Error while accessing the file system. {0}", AppsmithErrorAction.DEFAULT, null, ErrorType.GIT_CONFIGURATION_ERROR, ErrorReferenceDocUrl.FILE_PATH_NOT_SET),
    GIT_EXECUTION_TIMEOUT(504, 5014, "Git command execution exceeded the maximum allowed time, please contact Appsmith support for more details", AppsmithErrorAction.DEFAULT, null, ErrorType.CONNECTIVITY_ERROR, null),
    INCOMPATIBLE_IMPORTED_JSON(400, 4045, "Provided file is incompatible, please upgrade your instance to resolve this conflict.", AppsmithErrorAction.DEFAULT, null, ErrorType.BAD_REQUEST, null),
    GIT_MERGE_CONFLICTS(400, 4046, "Merge conflicts found: {0}", AppsmithErrorAction.DEFAULT, null, ErrorType.GIT_ACTION_EXECUTION_ERROR, ErrorReferenceDocUrl.GIT_MERGE_CONFLICT),
    GIT_PULL_CONFLICTS(400, 4047, "Merge conflicts found during the pull operation: {0}", AppsmithErrorAction.DEFAULT, null, ErrorType.GIT_ACTION_EXECUTION_ERROR, ErrorReferenceDocUrl.GIT_PULL_CONFLICT),
    SSH_KEY_GENERATION_ERROR(500, 5015, "Failed to generate SSH keys, please contact Appsmith support for more details", AppsmithErrorAction.DEFAULT, null, ErrorType.GIT_CONFIGURATION_ERROR, null),
    GIT_UPSTREAM_CHANGES(400, 4048, "Looks like there are pending upstream changes. To prevent you from losing history, we will pull the changes and push them to your repo.", AppsmithErrorAction.DEFAULT, null, ErrorType.GIT_ACTION_EXECUTION_ERROR, ErrorReferenceDocUrl.GIT_UPSTREAM_CHANGES),
    GIT_GENERIC_ERROR(504, 5016, "Git command execution error: {0}", AppsmithErrorAction.DEFAULT, null, ErrorType.GIT_ACTION_EXECUTION_ERROR, null),
    GENERIC_JSON_IMPORT_ERROR(400, 4049, "Unable to import application in organization {0} with error {1}", AppsmithErrorAction.DEFAULT, null, ErrorType.BAD_REQUEST, null),
    FILE_PART_DATA_BUFFER_ERROR(500, 5017, "Failed to upload file with error: {0}", AppsmithErrorAction.DEFAULT, null, ErrorType.BAD_REQUEST, null),
    ;

    private final Integer httpErrorCode;
    private final Integer appErrorCode;
    private final String message;
    private final String title;
    private final AppsmithErrorAction errorAction;
    private final ErrorType errorType;
    private final String referenceDoc;

    AppsmithError(Integer httpErrorCode, Integer appErrorCode, String message, AppsmithErrorAction errorAction,
                  String title, ErrorType errorType, String referenceDoc, Object... args) {
        this.httpErrorCode = httpErrorCode;
        this.appErrorCode = appErrorCode;
        this.errorType = errorType;
        MessageFormat fmt = new MessageFormat(message);
        this.message = fmt.format(args);
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

    public String getErrorType() { return  this.errorType.toString(); }
}
