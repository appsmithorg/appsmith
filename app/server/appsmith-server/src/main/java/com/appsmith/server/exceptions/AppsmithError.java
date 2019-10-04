package com.appsmith.server.exceptions;

import lombok.Getter;

import java.text.MessageFormat;

@Getter
public enum AppsmithError {

    NO_RESOURCE_FOUND(404, 1000, "Unable to find {0} with id {1}"),
    INVALID_PARAMETER(400, 4000, "Invalid parameter {0} provided in the input"),
    PLUGIN_NOT_INSTALLED(400, 4001, "Plugin {0} not installed"),
    PLUGIN_ID_NOT_GIVEN(400, 4002, "Missing plugin id. Please input correct plugin id"),
    RESOURCE_ID_NOT_GIVEN(400, 4003, "Missing resource id. Please input correct resource id"),
    PAGE_ID_NOT_GIVEN(400, 4004, "Missing page id. Pleaes input correct page id"),
    PAGE_DOESNT_BELONG_TO_USER_ORGANIZATION(400, 4006, "Page {0} does not belong to the current user {1} organization."),
    UNAUTHORIZED_DOMAIN(401, 4001, "Invalid email domain provided. Please sign in with a valid work email ID"),
    INTERNAL_SERVER_ERROR(500, 5000, "Internal server error while processing request"),
    REPOSITORY_SAVE_FAILED(500, 5001, "Repository save failed."),
    PLUGIN_INSTALLATION_FAILED_DOWNLOAD_ERROR(500, 5002, "Due to error in downloading the plugin from remote repository, plugin installation has failed. Check the jar location and try again.");

    private Integer httpErrorCode;
    private Integer appErrorCode;
    private String message;

    private AppsmithError(Integer httpErrorCode, Integer appErrorCode, String message, Object... args) {
        this.httpErrorCode = httpErrorCode;
        this.appErrorCode = appErrorCode;
        MessageFormat fmt = new MessageFormat(message);
        this.message = fmt.format(args);
    }

    public String getMessage(Object... args) {
        return new MessageFormat(this.message).format(args);
    }

}
