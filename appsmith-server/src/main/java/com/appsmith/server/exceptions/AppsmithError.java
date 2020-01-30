package com.appsmith.server.exceptions;

import lombok.Getter;

import java.text.MessageFormat;

@Getter
public enum AppsmithError {

    INVALID_PARAMETER(400, 4000, "Invalid parameter {0} provided in the input"),
    PLUGIN_NOT_INSTALLED(400, 4001, "Plugin {0} not installed"),
    PLUGIN_ID_NOT_GIVEN(400, 4002, "Missing plugin id. Please input correct plugin id"),
    DATASOURCE_NOT_GIVEN(400, 4003, "Missing datasource. Valid action can't be created without one."),
    PAGE_ID_NOT_GIVEN(400, 4004, "Missing page id. Pleaes input correct page id"),
    PAGE_DOESNT_BELONG_TO_USER_ORGANIZATION(400, 4006, "Page {0} does not belong to the current user {1} organization"),
    UNSUPPORTED_OPERATION(400, 4007, "Unsupported operation"),
    USER_DOESNT_BELONG_ANY_ORGANIZATION(400, 4009, "User {0} does not belong to any organization"),
    USER_DOESNT_BELONG_TO_ORGANIZATION(400, 4010, "User {0} does not belong to an organization with id {1}"),
    NO_CONFIGURATION_FOUND_IN_DATASOURCE(400, 4011, "Datasource without any configuration is invalid. Please try again with datasourceConfiguration"),
    INVALID_ACTION(400, 4012, "Action is invalid. Please edit to make it valid"),
    INVALID_DATASOURCE(400, 4013, "Datasource is invalid. Please edit to make it valid"),
    INVALID_ACTION_NAME(400, 4014, "Action name is invalid. Please input syntactically correct name"),
    INVALID_DATASOURCE_CONFIGURATION(400, 4015, "Datasource configuration is invalid"),
    NO_CONFIGURATION_FOUND_IN_ACTION(400, 4016, "Action without any configuration is invalid. Please try again with actionConfiguration"),
    NAME_CLASH_NOT_ALLOWED_IN_REFACTOR(400, 4017, "Unable to change the name {0} to {1} because {1} already exists in the current page"),
    PAGE_DOESNT_BELONG_TO_APPLICATION(400, 4018, "Page {0} does not belong to the application {1}"),
    UNAUTHORIZED_DOMAIN(401, 4019, "Invalid email domain provided. Please sign in with a valid work email ID"),
    INVALID_PASSWORD_RESET(400, 4020, "Unable to reset the password. Please initiate a request via 'forgot password' link to reset your password"),
    LOGIN_INTERNAL_ERROR(401, 4021, "Internal error while trying to login"),
    JSON_PROCESSING_ERROR(400, 4022, "Json processing error with error {0}"),
    INVALID_CREDENTIALS(200, 4023, "Invalid credentials provided. Did you input the credentials correctly?"),
    DUPLICATE_KEY(409, 4024, "Duplicate key error"),
    UNAUTHORIZED_ACCESS(401, 4025, "Unauthorized access"),
    INVALID_DATASOURCE_NAME(400, 4026, "Datasource name is invalid"),
    NO_RESOURCE_FOUND(404, 4027, "Unable to find {0} with id {1}"),
    GENERIC_BAD_REQUEST(400, 4028, "Bad Request: {0}"),
    INTERNAL_SERVER_ERROR(500, 5000, "Internal server error while processing request"),
    REPOSITORY_SAVE_FAILED(500, 5001, "Repository save failed"),
    PLUGIN_INSTALLATION_FAILED_DOWNLOAD_ERROR(500, 5002, "Due to error in downloading the plugin from remote repository, plugin installation has failed. Check the jar location and try again"),
    PLUGIN_RUN_FAILED(500, 5003, "Plugin execution failed with error {0}"),
    PLUGIN_EXECUTION_TIMEOUT(504, 5040, "Plugin Execution exceeded the maximum allowed time. Please increase the timeout in your action settings or check your backend action endpoint");


    private Integer httpErrorCode;
    private Integer appErrorCode;
    private String message;

    AppsmithError(Integer httpErrorCode, Integer appErrorCode, String message, Object... args) {
        this.httpErrorCode = httpErrorCode;
        this.appErrorCode = appErrorCode;
        MessageFormat fmt = new MessageFormat(message);
        this.message = fmt.format(args);
    }

    public String getMessage(Object... args) {
        return new MessageFormat(this.message).format(args);
    }

}
