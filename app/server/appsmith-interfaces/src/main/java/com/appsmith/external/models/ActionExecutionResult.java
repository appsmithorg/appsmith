package com.appsmith.external.models;

import com.appsmith.external.exceptions.BaseException;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.ExceptionHelper;
import com.appsmith.external.plugins.AppsmithPluginErrorUtils;
import com.fasterxml.jackson.annotation.JsonView;
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

    @JsonView(Views.Api.class)
    String statusCode;

    @JsonView(Views.Api.class)
    String title;

    @JsonView(Views.Api.class)
    String errorType;

    @JsonView(Views.Api.class)
    JsonNode headers;

    @JsonView(Views.Api.class)
    Object body;

    @JsonView(Views.Api.class)
    String readableError;

    @JsonView(Views.Api.class)
    Boolean isExecutionSuccess = false;

    /*
     * - To return useful hints to the user.
     * - E.g. if sql query result has identical columns
     */
    @JsonView(Views.Api.class)
    Set<String> messages;

    @JsonView(Views.Api.class)
    ActionExecutionRequest request;

    @JsonView(Views.Api.class)
    List<ParsedDataType> dataTypes;

    @JsonView(Views.Api.class)
    List<WidgetSuggestionDTO> suggestedWidgets;

    @JsonView(Views.Api.class)
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

    @JsonView(Views.Api.class)
    public void setErrorInfo(Throwable error) {
        this.setErrorInfo(ExceptionHelper.getRootCause(error), null);
    }
}
