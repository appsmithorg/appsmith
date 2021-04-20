package com.appsmith.external.exceptions.pluginExceptions;

import com.appsmith.external.exceptions.AppsmithErrorAction;
import lombok.Getter;

import java.text.MessageFormat;

@Getter
public enum AppsmithPluginError {

    PLUGIN_ERROR(500, 5000, "{0}", AppsmithErrorAction.LOG_EXTERNALLY, "Query execution error"),
    PLUGIN_GET_STRUCTURE_ERROR(500, 5001, "{0}", AppsmithErrorAction.DEFAULT, "Failed to get datasource " +
            "structure"),
    PLUGIN_QUERY_TIMEOUT_ERROR(504, 5002, "{0} timed out in {1} milliseconds. " +
            "Please increase timeout. This can be found in Settings tab of {0}.", AppsmithErrorAction.DEFAULT, "Timed" +
            " out on query execution"),
    PLUGIN_GET_STRUCTURE_TIMEOUT_ERROR(504, 5003, "{0}", AppsmithErrorAction.LOG_EXTERNALLY, "Timed out when fetching" +
            " datasource structure"),
    PLUGIN_DATASOURCE_ARGUMENT_ERROR(500, 5004, "{0}", AppsmithErrorAction.DEFAULT, "Datasource configuration is " +
            "invalid"),
    PLUGIN_EXECUTE_ARGUMENT_ERROR(500, 5005, "{0}", AppsmithErrorAction.DEFAULT, "Query configuration is invalid"),
    PLUGIN_JSON_PARSE_ERROR(500, 5006, "Plugin failed to parse JSON \"{0}\" with error: {1}",
            AppsmithErrorAction.DEFAULT, "Invalid JSON found"),
    PLUGIN_DATASOURCE_TEST_GENERIC_ERROR(500, 5007, "Plugin failed to test with the given configuration. Please reach out to Appsmith customer support to report this",
            AppsmithErrorAction.LOG_EXTERNALLY, "Datasource configuration is invalid"),
    PLUGIN_DATASOURCE_TIMEOUT_ERROR(504, 5008, "{0}", AppsmithErrorAction.DEFAULT, "Timed out when connecting to " +
            "datasource"),
    ;

    private final Integer httpErrorCode;
    private final Integer appErrorCode;
    private final String message;
    private final String title;
    private final AppsmithErrorAction errorAction;

    AppsmithPluginError(Integer httpErrorCode, Integer appErrorCode, String message, AppsmithErrorAction errorAction,
                        String title, Object... args) {
        this.httpErrorCode = httpErrorCode;
        this.appErrorCode = appErrorCode;
        MessageFormat fmt = new MessageFormat(message);
        this.errorAction = errorAction;
        this.message = fmt.format(args);
        this.title = title;
    }

    public String getMessage(Object... args) {
        return new MessageFormat(this.message).format(args);
    }

}
