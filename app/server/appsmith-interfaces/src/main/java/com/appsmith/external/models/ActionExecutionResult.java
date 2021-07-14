package com.appsmith.external.models;

import com.appsmith.external.exceptions.BaseException;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
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
    JsonNode headers;
    Object body;
    Boolean isExecutionSuccess = false;

    /*
     * - To return useful hints to the user.
     * - E.g. if sql query result has identical columns
     */
    Set<String> messages;

    ActionExecutionRequest request;

    List<ParsedDataType> dataTypes;

    List<WidgetType> suggestedWidget;

    public void setErrorInfo(Throwable error) {
        this.body = error.getMessage();

        if (error instanceof BaseException) {
            this.statusCode = ((BaseException) error).getAppErrorCode().toString();
            this.title = ((BaseException) error).getTitle();
        }
    }
}
