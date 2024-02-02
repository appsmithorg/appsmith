package com.external.plugins.exceptions;

import com.appsmith.external.exceptions.AppsmithErrorAction;
import com.appsmith.external.exceptions.pluginExceptions.BasePluginError;
import com.appsmith.external.models.ErrorType;
import lombok.Getter;

import java.text.MessageFormat;

@Getter
public enum WorkflowPluginError implements BasePluginError {
    QUERY_EXECUTION_FAILED(
            500,
            "PE-WF-5000",
            "{0}",
            "Query execution error",
            AppsmithErrorAction.DEFAULT,
            ErrorType.WORKFLOW_ERROR,
            "{1}",
            "{2}"),
    WORKFLOW_UNDEFINED(
            400,
            "PE-WF-4000",
            "Workflow not defined in Action",
            "Workflow not defined",
            AppsmithErrorAction.DEFAULT,
            ErrorType.WORKFLOW_ERROR,
            "",
            ""),
    TRIGGER_DATA_INVALID_JSON(
            400,
            "PE-WF-4002",
            "Trigger data json invalid",
            "Trigger data json invalid",
            AppsmithErrorAction.DEFAULT,
            ErrorType.WORKFLOW_ERROR,
            "",
            ""),
    REQUEST_ID_MISSING(
            400,
            "PE-WF-4003",
            "Request id missing",
            "Request id missing",
            AppsmithErrorAction.DEFAULT,
            ErrorType.WORKFLOW_ERROR,
            "",
            ""),
    REQUEST_RESOLUTION_MISSING(
            400,
            "PE-WF-4004",
            "Request resolution missing",
            "Resolution missing",
            AppsmithErrorAction.DEFAULT,
            ErrorType.WORKFLOW_ERROR,
            "",
            ""),
    WORKSPACE_UNDEFINED(
            400,
            "PE-WF-4005",
            "Workspace ID not defined in Action",
            "Workspace ID not defined",
            AppsmithErrorAction.DEFAULT,
            ErrorType.WORKFLOW_ERROR,
            "",
            ""),
    ILLEGAL_WORKFLOW_TRIGGER_REQUEST(
            400,
            "PE-WF-4006",
            "Illegal workflow trigger request type: {0}",
            "Illegal workflow trigger request",
            AppsmithErrorAction.DEFAULT,
            ErrorType.WORKFLOW_ERROR,
            "",
            ""),
    ILLEGAL_WORKFLOW_COMMAND_REQUEST(
            400,
            "PE-WF-4007",
            "Illegal Workflow query request type: {0}",
            "Illegal workflow query request",
            AppsmithErrorAction.DEFAULT,
            ErrorType.WORKFLOW_ERROR,
            "",
            ""),
    RESOLUTION_METADATA_INVALID_JSON(
            400,
            "PE-WF-4008",
            "Resolution metadata json invalid",
            "Resolution metadata json invalid",
            AppsmithErrorAction.DEFAULT,
            ErrorType.WORKFLOW_ERROR,
            "",
            ""),
    ;
    private final Integer httpErrorCode;
    private final String appErrorCode;
    private final String message;
    private final String title;
    private final AppsmithErrorAction errorAction;
    private final ErrorType errorType;

    private final String downstreamErrorMessage;

    private final String downstreamErrorCode;

    WorkflowPluginError(
            Integer httpErrorCode,
            String appErrorCode,
            String message,
            String title,
            AppsmithErrorAction errorAction,
            ErrorType errorType,
            String downstreamErrorMessage,
            String downstreamErrorCode) {
        this.httpErrorCode = httpErrorCode;
        this.appErrorCode = appErrorCode;
        this.message = message;
        this.title = title;
        this.errorAction = errorAction;
        this.errorType = errorType;
        this.downstreamErrorMessage = downstreamErrorMessage;
        this.downstreamErrorCode = downstreamErrorCode;
    }

    public String getMessage(Object... args) {
        return new MessageFormat(this.message).format(args);
    }

    public String getErrorType() {
        return this.errorType.toString();
    }

    public String getDownstreamErrorMessage(Object... args) {
        return replacePlaceholderWithValue(this.downstreamErrorMessage, args);
    }

    public String getDownstreamErrorCode(Object... args) {
        return replacePlaceholderWithValue(this.downstreamErrorCode, args);
    }
}
