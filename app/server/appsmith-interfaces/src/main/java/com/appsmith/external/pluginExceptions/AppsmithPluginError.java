package com.appsmith.external.pluginExceptions;

import lombok.Getter;

import java.text.MessageFormat;

@Getter
public enum AppsmithPluginError {

    PLUGIN_ERROR(500, 5000, "PluginExecution failed with error {0}"),
    PLUGIN_STRUCTURE_ERROR(500, 5001, "Plugin failed to get structure with error {0}"),
    PLUGIN_TIMEOUT_ERROR(504, 5002, "Plugin execution for query \"{0}\" timed out in {1}ms. Please increase timeout duration in your action settings or check your backend action endpoint."),
    ;

    private final Integer httpErrorCode;
    private final Integer appErrorCode;
    private final String message;

    AppsmithPluginError(Integer httpErrorCode, Integer appErrorCode, String message, Object... args) {
        this.httpErrorCode = httpErrorCode;
        this.appErrorCode = appErrorCode;
        MessageFormat fmt = new MessageFormat(message);
        this.message = fmt.format(args);
    }

    public String getMessage(Object... args) {
        return new MessageFormat(this.message).format(args);
    }

}
