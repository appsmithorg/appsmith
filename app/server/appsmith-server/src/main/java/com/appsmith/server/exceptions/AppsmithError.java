package com.appsmith.server.exceptions;

import com.appsmith.external.exceptions.AppsmithErrorAction;
import com.appsmith.external.models.ErrorType;
import lombok.Getter;

import java.text.MessageFormat;

@Getter
public enum AppsmithError {
    INVALID_PARAMETER(400, 4000, "Please enter a valid parameter {0}.", AppsmithErrorAction.DEFAULT, null, ErrorType.ARGUMENT_ERROR),
    PLUGIN_NOT_INSTALLED(400, 4001, "Plugin {0} not installed", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR),
    PLUGIN_ID_NOT_GIVEN(400, 4002, "Missing plugin id. Please enter one.", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR),
    DATASOURCE_NOT_GIVEN(400, 4003, "Missing datasource. Add/enter/connect a datasource to create a valid action.",
            AppsmithErrorAction.DEFAULT, null, ErrorType.ARGUMENT_ERROR),
    PAGE_ID_NOT_GIVEN(400, 4004, "Missing page id. Please enter one.", AppsmithErrorAction.DEFAULT, null, ErrorType.ARGUMENT_ERROR),
    DUPLICATE_KEY_USER_ERROR(400, 4005, "{0} already exists. Please use a different {1}", AppsmithErrorAction.DEFAULT, null, ErrorType.BAD_REQUEST),
    PAGE_DOESNT_BELONG_TO_USER_ORGANIZATION(400, 4006, "Page {0} does not belong to the current user {1} " +
            "organization", AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.BAD_REQUEST),
    UNSUPPORTED_OPERATION(400, 4007, "Unsupported operation", AppsmithErrorAction.DEFAULT, null, ErrorType.BAD_REQUEST),
    USER_DOESNT_BELONG_ANY_ORGANIZATION(400, 4009, "User {0} does not belong to any organization",
            AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.INTERNAL_ERROR),
    USER_DOESNT_BELONG_TO_ORGANIZATION(400, 4010, "User {0} does not belong to an organization with id {1}",
            AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.INTERNAL_ERROR),
    NO_CONFIGURATION_FOUND_IN_DATASOURCE(400, 4011, "No datasource configuration found. Please configure it and try again.", 
            AppsmithErrorAction.DEFAULT, "Datasource configuration is invalid",  ErrorType.DATASOURCE_CONFIGURATION_ERROR),
    INVALID_ACTION_COLLECTION(400, 4038, "{0} is not correctly configured. Please fix the following and then re-run: \n{1}",
            AppsmithErrorAction.DEFAULT, "Collection configuration is invalid",  ErrorType.CONFIGURATION_ERROR),
    INVALID_ACTION(400, 4012, "{0} is not correctly configured. Please fix the following and then re-run: \n{1}",
            AppsmithErrorAction.DEFAULT, "Action configuration is invalid", ErrorType.CONFIGURATION_ERROR),
    INVALID_DATASOURCE(400, 4013, "{0} is not correctly configured. Please fix the following and then re-run: \n{1}",
            AppsmithErrorAction.DEFAULT, "Datasource configuration is invalid", ErrorType.DATASOURCE_CONFIGURATION_ERROR),
    INVALID_DATASOURCE_CONFIGURATION(400, 4015, "Datasource configuration is invalid",
            AppsmithErrorAction.DEFAULT, "Datasource configuration is invalid", ErrorType.DATASOURCE_CONFIGURATION_ERROR),
    INVALID_ACTION_NAME(400, 4014, "Appsmith expects all entities to follow Javascript variable naming conventions. "
            + "It must be a single word containing alphabets, numbers, or \"_\". Any other special characters like hyphens (\"-\"), comma (\",\"), hash (\"#\") etc. "
            + "are not allowed. "
            + "Please change the name.", AppsmithErrorAction.DEFAULT, null, ErrorType.CONFIGURATION_ERROR),
    NO_CONFIGURATION_FOUND_IN_ACTION(400, 4016, "No configurations found in this action", AppsmithErrorAction.DEFAULT, null, ErrorType.CONFIGURATION_ERROR),
    NAME_CLASH_NOT_ALLOWED_IN_REFACTOR(400, 4017, "The new name {1} already exists in the current page. Choose another name.", AppsmithErrorAction.DEFAULT, null,
            ErrorType.BAD_REQUEST),
    PAGE_DOESNT_BELONG_TO_APPLICATION(400, 4018, "Unexpected state. Page {0} does not seem belong to the application {1}. Please reach out to Appsmith customer support to resolve this.",
            AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.BAD_REQUEST),
    INVALID_DYNAMIC_BINDING_REFERENCE(400, 4022,
            "  \"widgetType\" : \"{0}\"," +
                    "  \"bindingPath\" : \"{3}\"," +
                    "  \"message\" : \"Binding path in the widget not found. Please reach out to Appsmith customer support to resolve this.\"," +
                    "  \"widgetName\" : \"{1}\"," +
                    "  \"widgetId\" : \"{2}\"," +
                    "  \"pageId\" : \"{4}\"," +
                    "  \"layoutId\" : \"{5}\"," +
                    "  \"dynamicBinding\" : {6}",
            AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.BAD_REQUEST),
    USER_ALREADY_EXISTS_IN_ORGANIZATION(400, 4021, "The user {0} has already been added to the organization with role {1}. To change the role, please navigate to `Manage Users` page.",
            AppsmithErrorAction.DEFAULT, null, ErrorType.BAD_REQUEST),
    UNAUTHORIZED_DOMAIN(401, 4019, "Invalid email domain {0} used for sign in/sign up. Please contact the administrator to configure this domain if this is unexpected.",
            AppsmithErrorAction.DEFAULT, null, ErrorType.AUTHENTICATION_ERROR),
    USER_NOT_SIGNED_IN(401, 4020, "You are not logged in. Please sign in with the registered email ID or sign up",
            AppsmithErrorAction.DEFAULT, null, ErrorType.AUTHENTICATION_ERROR),
    INVALID_PASSWORD_RESET(400, 4020, "Cannot find an outstanding reset password request for this email. Please initiate a request via 'forgot password' " +
            "button to reset your password", AppsmithErrorAction.DEFAULT, null, null),
    INVALID_PASSWORD_LENGTH(400, 4037, "Password length should be between {0} and {1}" , AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR),
    JSON_PROCESSING_ERROR(400, 4022, "Json processing error with error {0}", AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.INTERNAL_ERROR),
    INVALID_CREDENTIALS(200, 4023, "Invalid credentials provided. Did you input the credentials correctly?", AppsmithErrorAction.DEFAULT, null, ErrorType.AUTHENTICATION_ERROR),
    UNAUTHORIZED_ACCESS(403, 4025, "Unauthorized access", AppsmithErrorAction.DEFAULT, null, ErrorType.AUTHENTICATION_ERROR),
    DUPLICATE_KEY(409, 4024, "Unexpected state : Duplicate key error. Message : {0}. Please reach out to Appsmith customer support to report this",
            AppsmithErrorAction.DEFAULT, null, ErrorType.BAD_REQUEST),
    USER_ALREADY_EXISTS_SIGNUP(409, 4025, "There is already an account registered with this email {0}. Please sign in instead.",
            AppsmithErrorAction.DEFAULT, null, ErrorType.BAD_REQUEST),
    ACTION_IS_NOT_AUTHORIZED(403, 4026, "Uh oh! You do not have permissions to do : {0}", AppsmithErrorAction.DEFAULT, null, ErrorType.AUTHENTICATION_ERROR),
    NO_RESOURCE_FOUND(404, 4027, "Unable to find {0} {1}", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR),
    USER_NOT_FOUND(404, 4027, "Unable to find user with email {0}", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR),
    ACL_NO_RESOURCE_FOUND(404, 4028, "Unable to find {0} {1}. Either the asset doesn't exist or you don't have required permissions",
            AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR),
    GENERIC_BAD_REQUEST(400, 4028, "Bad Request: {0}", AppsmithErrorAction.DEFAULT, null, ErrorType.BAD_REQUEST),
    VALIDATION_FAILURE(400, 4028, "Validation Failure(s): {0}", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR),
    INVALID_CURL_COMMAND(400, 4029, "Invalid cURL command, couldn't import.", AppsmithErrorAction.DEFAULT, null, ErrorType.ARGUMENT_ERROR),
    INVALID_LOGIN_METHOD(401, 4030, "Please use {0} authentication to login to Appsmith", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR),

    REMOVE_LAST_ORG_ADMIN_ERROR(400, 4037, "The last admin can not be removed from an organization", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR),
    INVALID_CRUD_PAGE_REQUEST(400, 4038, "Unable to process page generation request, {0}", AppsmithErrorAction.DEFAULT, null, ErrorType.BAD_REQUEST),
    INTERNAL_SERVER_ERROR(500, 5000, "Internal server error while processing request", AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.INTERNAL_ERROR),
    REPOSITORY_SAVE_FAILED(500, 5001, "Failed to save the repository. Try again.", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR),
    PLUGIN_INSTALLATION_FAILED_DOWNLOAD_ERROR(500, 5002, "Plugin installation failed due to an error while " +
            "downloading it. Check the jar location & try again.", AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.INTERNAL_ERROR),
    PLUGIN_RUN_FAILED(500, 5003, "Plugin execution failed with error {0}", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR),
    PLUGIN_EXECUTION_TIMEOUT(504, 5040, "Plugin Execution exceeded the maximum allowed time. Please increase the timeout in your action settings or check your backend action endpoint",
            AppsmithErrorAction.DEFAULT, null, ErrorType.CONNECTIVITY_ERROR),
    PLUGIN_LOAD_FORM_JSON_FAIL(500, 5004, "[{0}] Unable to load datasource form configuration. Details: {1}.",
            AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.INTERNAL_ERROR),
    PLUGIN_LOAD_TEMPLATES_FAIL(500, 5005, "Unable to load datasource templates. Details: {0}.",
            AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.INTERNAL_ERROR),
    MARKETPLACE_TIMEOUT(504, 5041, "Marketplace is responding too slowly. Please try again later",
            AppsmithErrorAction.DEFAULT, null, ErrorType.CONNECTIVITY_ERROR),
    DATASOURCE_HAS_ACTIONS(409, 4030, "Cannot delete datasource since it has {0} action(s) using it.",
            AppsmithErrorAction.DEFAULT, null, ErrorType.BAD_REQUEST),
    ORGANIZATION_ID_NOT_GIVEN(400, 4031, "Missing organization id. Please enter one.", AppsmithErrorAction.DEFAULT, null, ErrorType.ARGUMENT_ERROR),
    INVALID_CURL_METHOD(400, 4032, "Invalid method in cURL command: {0}.", AppsmithErrorAction.DEFAULT, null, ErrorType.ARGUMENT_ERROR),
    OAUTH_NOT_AVAILABLE(500, 5006, "Login with {0} is not supported.", AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.BAD_REQUEST),
    MARKETPLACE_NOT_CONFIGURED(500, 5007, "Marketplace is not configured.", AppsmithErrorAction.DEFAULT, null, ErrorType.CONFIGURATION_ERROR),
    PAYLOAD_TOO_LARGE(413, 4028, "The request payload is too large. Max allowed size for request payload is {0} KB",
            AppsmithErrorAction.DEFAULT, null, ErrorType.CONNECTIVITY_ERROR),
    SIGNUP_DISABLED(403, 4033, "Signup is restricted on this instance of Appsmith. Please contact the administrator to get an invite.",
            AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR),
    FAIL_UPDATE_USER_IN_SESSION(500, 5008, "Unable to update user in session.", AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.INTERNAL_ERROR),
    APPLICATION_FORKING_NOT_ALLOWED(403, 4034, "Forking this application is not permitted at this time.", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR),
    GOOGLE_RECAPTCHA_TIMEOUT(504, 5042, "Google recaptcha verification timeout. Please try again.", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR),
    GOOGLE_RECAPTCHA_FAILED(401, 4035, "Google recaptcha verification failed. Please try again.", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR),
    UNKNOWN_ACTION_RESULT_DATA_TYPE(500, 5009, "Appsmith has encountered an unknown action result data type: {0}. " +
            "Please contact Appsmith customer support to resolve this.", AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.BAD_REQUEST),
    INVALID_CURL_HEADER(400, 4036, "Invalid header in cURL command: {0}.", AppsmithErrorAction.DEFAULT, null, ErrorType.ARGUMENT_ERROR),
    AUTHENTICATION_FAILURE(500, 5010, "Authentication failed with error: {0}", AppsmithErrorAction.DEFAULT, null, ErrorType.AUTHENTICATION_ERROR),
    INSTANCE_REGISTRATION_FAILURE(500, 5011, "Registration for instance failed with error: {0}", AppsmithErrorAction.LOG_EXTERNALLY, null, ErrorType.INTERNAL_ERROR),
    TOO_MANY_REQUESTS(429, 4039, "Too many requests received. Please try later.", AppsmithErrorAction.DEFAULT, "Too many requests", ErrorType.INTERNAL_ERROR),
    INVALID_JS_ACTION(400, 4040, "Something went wrong while trying to parse this action. Please check the JS object for errors.", AppsmithErrorAction.DEFAULT, null, ErrorType.BAD_REQUEST),
    CLOUD_SERVICES_ERROR(500, 5012, "Received error from cloud services {0}", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR),
    ;

    private final Integer httpErrorCode;
    private final Integer appErrorCode;
    private final String message;
    private final String title;
    private final AppsmithErrorAction errorAction;
    private final ErrorType errorType;

    AppsmithError(Integer httpErrorCode, Integer appErrorCode, String message, AppsmithErrorAction errorAction,
                  String title, ErrorType errorType, Object... args) {
        this.httpErrorCode = httpErrorCode;
        this.appErrorCode = appErrorCode;
        this.errorType = errorType;
        MessageFormat fmt = new MessageFormat(message);
        this.message = fmt.format(args);
        this.errorAction = errorAction;
        this.title = title;
    }

    public String getMessage(Object... args) {
        return new MessageFormat(this.message).format(args);
    }

    public AppsmithErrorAction getErrorAction() {
        return this.errorAction;
    }

    public String getErrorType() { return  this.errorType.toString(); }
}
