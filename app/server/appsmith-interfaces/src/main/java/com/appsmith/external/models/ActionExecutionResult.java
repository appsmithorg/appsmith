package com.appsmith.external.models;

import com.appsmith.external.exceptions.BaseException;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.helpers.ExceptionHelper;
import com.appsmith.external.plugins.AppsmithPluginErrorUtils;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.util.StringUtils;

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

    @JsonView(Views.Internal.class)
    String pluginName;

    /*
     * - To return useful hints to the user.
     * - E.g. if sql query result has identical columns
     */
    Set<String> messages;

    ActionExecutionRequest request;

    List<ParsedDataType> dataTypes;

    List<WidgetSuggestionDTO> suggestedWidgets;

    PluginErrorDetails pluginErrorDetails;

    public void setErrorInfo(Throwable error, AppsmithPluginErrorUtils pluginErrorUtils) {
        this.body = error.getMessage();

        if (error instanceof AppsmithPluginException) {
            AppsmithPluginException pluginException = (AppsmithPluginException) error;
            pluginErrorDetails = new PluginErrorDetails(pluginException);
            this.statusCode = pluginException.getAppErrorCode();
            this.title = pluginException.getTitle();
            this.errorType = pluginException.getErrorType();

            if (((AppsmithPluginException) error).getExternalError() != null && pluginErrorUtils != null) {
                this.readableError = pluginErrorUtils.getReadableError(error);
                pluginErrorDetails.setDownstreamErrorMessage(this.readableError);
            }
            if (StringUtils.hasLength(pluginErrorDetails.getDownstreamErrorMessage())) {
                this.body = pluginErrorDetails.getDownstreamErrorMessage();
            }

            if (StringUtils.hasLength(pluginErrorDetails.getDownstreamErrorCode())) {
                this.statusCode = pluginErrorDetails.getDownstreamErrorCode();
            }
        } else if (error instanceof BaseException) {
            this.statusCode = ((BaseException) error).getAppErrorCode();
            this.title = ((BaseException) error).getTitle();
            this.errorType = ((BaseException) error).getErrorType();
        }
    }

    public void setErrorInfo(Throwable error) {
        this.setErrorInfo(ExceptionHelper.getRootCause(error), null);
    }

    @ToString
    @Getter
    @Setter
    public class PluginErrorDetails {
        String title;
        String errorType;
        String appsmithErrorCode;
        String appsmithErrorMessage;
        String downstreamErrorCode;
        String downstreamErrorMessage;

        public PluginErrorDetails(AppsmithPluginException appsmithPluginException) {
            this.title = appsmithPluginException.getTitle();
            this.errorType = appsmithPluginException.getErrorType();
            this.appsmithErrorCode = appsmithPluginException.getAppErrorCode();
            this.appsmithErrorMessage = appsmithPluginException.getMessage();
            this.downstreamErrorMessage = appsmithPluginException.getDownstreamErrorMessage();
            this.downstreamErrorCode = appsmithPluginException.getDownstreamErrorCode();
        }
    }
}
