package com.appsmith.server.exceptions;

import lombok.Getter;

import java.text.MessageFormat;

enum AppsmithErrorAction {
    DEFAULT,
    LOG_EXTERNALLY
}
@Getter
public enum AppsmithError {
    INVALID_PARAMETER(400, 4000, "Please enter a valid parameter {0}.", AppsmithErrorAction.DEFAULT),
    PLUGIN_NOT_INSTALLED(400, 4001, "Plugin {0} not installed", AppsmithErrorAction.DEFAULT),
    PLUGIN_ID_NOT_GIVEN(400, 4002, "Missing plugin id. Please enter one.", AppsmithErrorAction.DEFAULT),
    DATASOURCE_NOT_GIVEN(400, 4003, "Missing datasource. Add/enter/connect a datasource to create a valid action.", AppsmithErrorAction.DEFAULT),
    PAGE_ID_NOT_GIVEN(400, 4004, "Missing page id. Please enter one.", AppsmithErrorAction.DEFAULT),
    PAGE_DOESNT_BELONG_TO_USER_ORGANIZATION(400, 4006, "Page {0} does not belong to the current user {1} " +
            "organization", AppsmithErrorAction.LOG_EXTERNALLY),
    UNSUPPORTED_OPERATION(400, 4007, "Unsupported operation", AppsmithErrorAction.DEFAULT),
    USER_DOESNT_BELONG_ANY_ORGANIZATION(400, 4009, "User {0} does not belong to any organization",
            AppsmithErrorAction.LOG_EXTERNALLY),
    USER_DOESNT_BELONG_TO_ORGANIZATION(400, 4010, "User {0} does not belong to an organization with id {1}",
            AppsmithErrorAction.LOG_EXTERNALLY),
    NO_CONFIGURATION_FOUND_IN_DATASOURCE(400, 4011, "No datasource configuration found. Please configure it and try again.", AppsmithErrorAction.DEFAULT),
    INVALID_ACTION(400, 4012, "Action {0} with id {1} is invalid: {2}", AppsmithErrorAction.DEFAULT),
    INVALID_DATASOURCE(400, 4013, "Datasource is invalid. Please edit to make it valid. Details: {0}", AppsmithErrorAction.DEFAULT),
    INVALID_ACTION_NAME(400, 4014, "Action name is invalid. Please input syntactically correct name", AppsmithErrorAction.DEFAULT),
    INVALID_DATASOURCE_CONFIGURATION(400, 4015, "Datasource configuration is invalid", AppsmithErrorAction.DEFAULT),
    NO_CONFIGURATION_FOUND_IN_ACTION(400, 4016, "No action configuration found. Please configure it and try again.", AppsmithErrorAction.DEFAULT),
    NAME_CLASH_NOT_ALLOWED_IN_REFACTOR(400, 4017, "The new name {1} already exists in the current page. Choose another name.", AppsmithErrorAction.DEFAULT),
    PAGE_DOESNT_BELONG_TO_APPLICATION(400, 4018, "Page {0} does not belong to the application {1}",
            AppsmithErrorAction.LOG_EXTERNALLY),
    NO_DSL_FOUND_IN_PAGE(400, 4020, "The page {0} doesn't have a DSL. This is an unexpected state", AppsmithErrorAction.DEFAULT),
    INVALID_DYNAMIC_BINDING_REFERENCE(400, 4022, "The dynamically bounded key {0} you are referring to was not found.", AppsmithErrorAction.LOG_EXTERNALLY),
    USER_ALREADY_EXISTS_IN_ORGANIZATION(400, 4021, "The user {0} has already been added to the organization with role {1}", AppsmithErrorAction.DEFAULT),
    UNAUTHORIZED_DOMAIN(401, 4019, "Invalid email domain provided. Please sign in with a valid work email ID", AppsmithErrorAction.DEFAULT),
    USER_NOT_SIGNED_IN(401, 4020, "User is not logged in. Please sign in with the registered email ID or sign up",
            AppsmithErrorAction.DEFAULT),
    INVALID_PASSWORD_RESET(400, 4020, "Unable to reset the password. Please initiate a request via 'forgot password' " +
            "button to reset your password", AppsmithErrorAction.DEFAULT),
    LOGIN_INTERNAL_ERROR(401, 4021, "Internal error while trying to login", AppsmithErrorAction.LOG_EXTERNALLY),
    JSON_PROCESSING_ERROR(400, 4022, "Json processing error with error {0}", AppsmithErrorAction.LOG_EXTERNALLY),
    INVALID_CREDENTIALS(200, 4023, "Invalid credentials provided. Did you input the credentials correctly?", AppsmithErrorAction.DEFAULT),
    DUPLICATE_KEY(409, 4024, "Duplicate key error", AppsmithErrorAction.DEFAULT),
    USER_ALREADY_EXISTS_SIGNUP(409, 4025, "There is already an account registered with this email {0}. Please sign in.", AppsmithErrorAction.DEFAULT),
    UNAUTHORIZED_ACCESS(403, 4025, "Unauthorized access", AppsmithErrorAction.DEFAULT),
    ACTION_IS_NOT_AUTHORIZED(403, 4026, "Sorry. You do not have permissions to perform this action", AppsmithErrorAction.DEFAULT),
    INVALID_DATASOURCE_NAME(400, 4026, "Invalid datasource name. Check again.", AppsmithErrorAction.DEFAULT),
    NO_RESOURCE_FOUND(404, 4027, "Unable to find {0} with id {1}", AppsmithErrorAction.DEFAULT),
    USER_NOT_FOUND(404, 4027, "Unable to find user with email {0}", AppsmithErrorAction.DEFAULT),
    ACL_NO_RESOURCE_FOUND(404, 4028, "Unable to find {0} with id {1}. Either the asset doesn't exist or you don't have required permissions", AppsmithErrorAction.DEFAULT),
    GENERIC_BAD_REQUEST(400, 4028, "Bad Request: {0}", AppsmithErrorAction.DEFAULT),
    VALIDATION_FAILURE(400, 4028, "Validation Failure(s): {0}", AppsmithErrorAction.DEFAULT),
    INVALID_CURL_COMMAND(400, 4029, "Invalid cURL command, couldn't import.", AppsmithErrorAction.DEFAULT),
    INTERNAL_SERVER_ERROR(500, 5000, "Internal server error while processing request", AppsmithErrorAction.LOG_EXTERNALLY),
    REPOSITORY_SAVE_FAILED(500, 5001, "Failed to save the repository. Try again.", AppsmithErrorAction.DEFAULT),
    PLUGIN_INSTALLATION_FAILED_DOWNLOAD_ERROR(500, 5002, "Plugin installation failed due to an error while " +
            "downloading it. Check the jar location & try again.", AppsmithErrorAction.LOG_EXTERNALLY),
    PLUGIN_RUN_FAILED(500, 5003, "Plugin execution failed with error {0}", AppsmithErrorAction.DEFAULT),
    PLUGIN_EXECUTION_TIMEOUT(504, 5040, "Plugin Execution exceeded the maximum allowed time. Please increase the timeout in your action settings or check your backend action endpoint", AppsmithErrorAction.DEFAULT),
    PLUGIN_LOAD_FORM_JSON_FAIL(500, 5004, "Unable to load datasource form configuration. Details: {0}.",
            AppsmithErrorAction.LOG_EXTERNALLY),
    PLUGIN_LOAD_TEMPLATES_FAIL(500, 5005, "Unable to load datasource templates. Details: {0}.",
            AppsmithErrorAction.LOG_EXTERNALLY),
    MARKETPLACE_TIMEOUT(504, 5041, "Marketplace is responding too slowly. Please try again later", AppsmithErrorAction.DEFAULT),
    DATASOURCE_HAS_ACTIONS(409, 4030, "Cannot delete datasource since it has {0} action(s) using it.", AppsmithErrorAction.DEFAULT),
    ORGANIZATION_ID_NOT_GIVEN(400, 4031, "Missing organization id. Please enter one.", AppsmithErrorAction.DEFAULT),
    INVALID_CURL_METHOD(400, 4032, "Invalid method in cURL command: {0}.", AppsmithErrorAction.DEFAULT),
    OAUTH_NOT_AVAILABLE(500, 5006, "Login with {0} is not supported.", AppsmithErrorAction.LOG_EXTERNALLY),
    MARKETPLACE_NOT_CONFIGURED(500, 5007, "Marketplace is not configured.", AppsmithErrorAction.DEFAULT),
    PAYLOAD_TOO_LARGE(413, 4028, "The request payload is too large. Max allowed size for request payload is {0} KB", AppsmithErrorAction.DEFAULT)
    ;


    private final Integer httpErrorCode;
    private final Integer appErrorCode;
    private final String message;
    private final AppsmithErrorAction errorAction;

    AppsmithError(Integer httpErrorCode, Integer appErrorCode, String message, AppsmithErrorAction errorAction, Object... args) {
        this.httpErrorCode = httpErrorCode;
        this.appErrorCode = appErrorCode;
        MessageFormat fmt = new MessageFormat(message);
        this.message = fmt.format(args);
        this.errorAction = errorAction;
    }

    public String getMessage(Object... args) {
        return new MessageFormat(this.message).format(args);
    }

    public AppsmithErrorAction getErrorAction() {
        return this.errorAction;
    }

}
