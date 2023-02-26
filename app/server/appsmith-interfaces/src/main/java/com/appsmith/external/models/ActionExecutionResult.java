package com.appsmith.external.models;

import com.appsmith.external.exceptions.BaseException;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.ExceptionHelper;
import com.appsmith.external.plugins.AppsmithPluginErrorUtils;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.List;
import java.util.Set;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class ActionExecutionResult {

    String statusCode;
    String title;
    String errorType;
    JsonNode headers;
    Object body;
    String readableError;
    Boolean isExecutionSuccess = false;

    /*
     * - To return useful hints to the user.
     * - E.g. if sql query result has identical columns
     */
    Set<String> messages;

    ActionExecutionRequest request;

    List<ParsedDataType> dataTypes;

    List<WidgetSuggestionDTO> suggestedWidgets;

    public void setErrorInfo(Throwable error, AppsmithPluginErrorUtils pluginErrorUtils) {
        this.body = error.getMessage();

        if (error instanceof AppsmithPluginException) {
            this.statusCode = ((AppsmithPluginException) error).getAppErrorCode().toString();
            this.title = ((AppsmithPluginException) error).getTitle();
            this.errorType = ((AppsmithPluginException) error).getErrorType();

            if (((AppsmithPluginException) error).getExternalError() != null && pluginErrorUtils != null) {
                this.readableError = pluginErrorUtils.getReadableError(error);
            }
        } else if (error instanceof BaseException) {
            this.statusCode = ((BaseException) error).getAppErrorCode().toString();
            this.title = ((BaseException) error).getTitle();
        }
    }

    public void setErrorInfo(Throwable error) {
        this.setErrorInfo(ExceptionHelper.getRootCause(error), null);
    }
}
