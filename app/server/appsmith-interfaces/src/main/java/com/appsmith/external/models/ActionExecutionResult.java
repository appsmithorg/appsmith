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

        if (error instanceof AppsmithPluginException) {
            AppsmithPluginException pluginException = (AppsmithPluginException) error;
            pluginErrorDetails = new PluginErrorDetails(pluginException);
            // since downstreamErrorMessages getter are specific to baseException and its subclasses,
            // that is why we are setting it over here
            this.body = pluginException.getDownstreamErrorMessage();
            // post recent discussion we are changing this to downstream Error Code
            this.statusCode = pluginException.getDownstreamErrorCode();
            this.title = pluginException.getTitle();
            this.errorType = pluginException.getErrorType();

            if (((AppsmithPluginException) error).getExternalError() != null && pluginErrorUtils != null) {
                this.readableError = pluginErrorUtils.getReadableError(error);
                pluginErrorDetails.setDownstreamErrorMessage(this.readableError);
                this.body =  this.readableError;
            }

            if (!StringUtils.hasLength((String)this.body)) {
                this.body = error.getMessage();
            }

        } else if (error instanceof BaseException) {
            this.body = ((BaseException) error).getDownstreamErrorMessage();
            this.statusCode = ((BaseException) error).getDownstreamErrorCode();
            this.title = ((BaseException) error).getTitle();
            this.errorType = ((BaseException) error).getErrorType();
        } else {
            this.body = error.getMessage();
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
