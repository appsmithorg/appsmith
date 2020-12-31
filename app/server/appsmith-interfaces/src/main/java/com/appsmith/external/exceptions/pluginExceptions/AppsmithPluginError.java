package com.appsmith.external.exceptions.pluginExceptions;

import com.appsmith.external.exceptions.AppsmithErrorAction;
import lombok.Getter;

import java.text.MessageFormat;

@Getter
public enum AppsmithPluginError {

    PLUGIN_ERROR(500, 5000, "PluginExecution failed with error: {0}", AppsmithErrorAction.LOG_EXTERNALLY),
    PLUGIN_STRUCTURE_ERROR(500, 5001, "Plugin failed to get structure with error: {0}",
            AppsmithErrorAction.LOG_EXTERNALLY),
    PLUGIN_QUERY_TIMEOUT_ERROR(504, 5002, "Plugin execution for query \"{0}\" timed out in {1}ms. Please increase " +
            "timeout duration in your action settings or check your backend action endpoint.", AppsmithErrorAction.DEFAULT),
    PLUGIN_GET_STRUCTURE_TIMEOUT_ERROR(504, 5003, "Plugin timed when fetching structure.", AppsmithErrorAction.DEFAULT),
    PLUGIN_BAD_ARGUMENT_ERROR(500, 5004, "Plugin failed to connect to host with error: {0}",
            AppsmithErrorAction.DEFAULT),
    ;

    private final Integer httpErrorCode;
    private final Integer appErrorCode;
    private final String message;
    private final AppsmithErrorAction errorAction;

    AppsmithPluginError(Integer httpErrorCode, Integer appErrorCode, String message, AppsmithErrorAction errorAction,
                        Object... args) {
        this.httpErrorCode = httpErrorCode;
        this.appErrorCode = appErrorCode;
        MessageFormat fmt = new MessageFormat(message);
        this.message = fmt.format(args);
        this.errorAction = errorAction;
    }

    public String getMessage(Object... args) {
        return new MessageFormat(this.message).format(args);
    }

}
