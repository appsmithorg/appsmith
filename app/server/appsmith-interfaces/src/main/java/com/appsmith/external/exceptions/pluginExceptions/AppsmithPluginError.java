package com.appsmith.external.exceptions.pluginExceptions;

import com.appsmith.external.exceptions.AppsmithErrorAction;
import lombok.Getter;

import java.text.MessageFormat;

@Getter
public enum AppsmithPluginError {

    PLUGIN_ERROR(500, 5000, "{0}", AppsmithErrorAction.LOG_EXTERNALLY),
    PLUGIN_GET_STRUCTURE_ERROR(500, 5001, "Failed to get database structure with error: {0}",
            AppsmithErrorAction.LOG_EXTERNALLY),
    PLUGIN_QUERY_TIMEOUT_ERROR(504, 5002, "{0} timed out in {1} milliseconds. " +
            "Please increase timeout. This can be found in Settings tab of {0}.", AppsmithErrorAction.DEFAULT),
    PLUGIN_GET_STRUCTURE_TIMEOUT_ERROR(504, 5003, "Plugin timed out when fetching structure.",
            AppsmithErrorAction.DEFAULT),
    PLUGIN_DATASOURCE_ARGUMENT_ERROR(500, 5004, "{0}", AppsmithErrorAction.DEFAULT),
    PLUGIN_EXECUTE_ARGUMENT_ERROR(500, 5005, "{0}", AppsmithErrorAction.DEFAULT),
    PLUGIN_JSON_PARSE_ERROR(500, 5006, "Plugin failed to parse JSON \"{0}\" with error: {1}",
            AppsmithErrorAction.DEFAULT),
    PLUGIN_DATASOURCE_TEST_GENERIC_ERROR(500, 5007, "Plugin failed to test with the given configuration. Please reach out to Appsmith customer support to report this",
            AppsmithErrorAction.LOG_EXTERNALLY),
    PLUGIN_DATASOURCE_TIMEOUT_ERROR(504, 5008, "{0}", AppsmithErrorAction.DEFAULT),
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
