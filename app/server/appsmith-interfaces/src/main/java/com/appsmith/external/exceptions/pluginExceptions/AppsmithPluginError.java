package com.appsmith.external.exceptions.pluginExceptions;

import com.appsmith.external.exceptions.AppsmithErrorAction;
import com.appsmith.external.models.ErrorType;
import lombok.Getter;

import java.text.MessageFormat;

@Getter
public enum AppsmithPluginError {

    PLUGIN_ERROR(500, 5000, "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY, "Query execution error", ErrorType.INTERNAL_ERROR),
    PLUGIN_GET_STRUCTURE_ERROR(500, 5001, "{0}", AppsmithErrorAction.DEFAULT, "Failed to get datasource " +
            "structure", ErrorType.INTERNAL_ERROR),
    PLUGIN_QUERY_TIMEOUT_ERROR(504, 5002, "{0} timed out in {1} milliseconds. " +
            "Please increase timeout. This can be found in Settings tab of {0}.", AppsmithErrorAction.DEFAULT, "Timed" +
            " out on query execution", ErrorType.CONNECTIVITY_ERROR),
    PLUGIN_MAX_RESULT_SIZE_EXCEEDED(504, 5009, "Response size exceeded the maximum supported"
            + " size of {0} MB. Please use LIMIT to reduce the amount of data fetched.",
            AppsmithErrorAction.DEFAULT, "Large Result Set Not Supported", ErrorType.INTERNAL_ERROR),
    PLUGIN_GET_STRUCTURE_TIMEOUT_ERROR(504, 5003, "{0}", AppsmithErrorAction.LOG_EXTERNALLY, "Timed out when fetching" +
            " datasource structure", ErrorType.CONNECTIVITY_ERROR),
    PLUGIN_DATASOURCE_ARGUMENT_ERROR(500, 5004, "{0}", AppsmithErrorAction.DEFAULT, "Datasource configuration is " +
            "invalid", ErrorType.DATASOURCE_CONFIGURATION_ERROR),
    PLUGIN_EXECUTE_ARGUMENT_ERROR(500, 5005, "{0}", AppsmithErrorAction.DEFAULT,
            "Query configuration is invalid", ErrorType.ACTION_CONFIGURATION_ERROR),
    PLUGIN_JSON_PARSE_ERROR(500, 5006, "Plugin failed to parse JSON \"{0}\" with error: {1}",
            AppsmithErrorAction.DEFAULT, "Invalid JSON found", ErrorType.INTERNAL_ERROR),
    PLUGIN_DATASOURCE_TEST_GENERIC_ERROR(500, 5007, "Plugin failed to test with the given configuration. Please reach out to Appsmith customer support to report this",
            AppsmithErrorAction.LOG_EXTERNALLY, "Datasource configuration is invalid", ErrorType.INTERNAL_ERROR),
    PLUGIN_DATASOURCE_TIMEOUT_ERROR(504, 5008, "{0}", AppsmithErrorAction.DEFAULT, "Timed out when connecting to " +
            "datasource", ErrorType.CONNECTIVITY_ERROR),
    PLUGIN_AUTHENTICATION_ERROR(401, 4000, "Invalid authentication credentials. Please check datasource configuration.",
            AppsmithErrorAction.DEFAULT, "Datasource authentication error", ErrorType.AUTHENTICATION_ERROR),
    PLUGIN_IN_MEMORY_FILTERING_ERROR(500, 5010, "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY, "Appsmith In Memory Filtering Failed", ErrorType.INTERNAL_ERROR),
    PLUGIN_UQI_WHERE_CONDITION_UNKNOWN(500, 5011, "{0} is not a known conditional operator. Please reach out to Appsmith customer support to report this",
            AppsmithErrorAction.LOG_EXTERNALLY, "Where condition could not be parsed", ErrorType.INTERNAL_ERROR),
    UNSUPPORTED_PLUGIN_OPERATION(500, 5012, "Unsupported operation", AppsmithErrorAction.DEFAULT, null, ErrorType.INTERNAL_ERROR),
    ;

    private final Integer httpErrorCode;
    private final Integer appErrorCode;
    private final String message;
    private final String title;
    private final AppsmithErrorAction errorAction;
    private final ErrorType errorType;

    AppsmithPluginError(Integer httpErrorCode, Integer appErrorCode, String message, AppsmithErrorAction errorAction,
                        String title, ErrorType errorType, Object... args) {
        this.httpErrorCode = httpErrorCode;
        this.appErrorCode = appErrorCode;
        this.errorType = errorType;
        MessageFormat fmt = new MessageFormat(message);
        this.errorAction = errorAction;
        this.message = fmt.format(args);
        this.title = title;
    }

    public String getMessage(Object... args) {
        return new MessageFormat(this.message).format(args);
    }

    public String getErrorType() { return this.errorType.toString(); }

}
