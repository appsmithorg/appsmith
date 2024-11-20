package com.appsmith.external.exceptions.pluginExceptions;

import com.appsmith.external.exceptions.AppsmithErrorAction;
import com.appsmith.external.models.ErrorType;
import lombok.Getter;

import java.text.MessageFormat;

@Getter
public enum AppsmithPluginError implements BasePluginError {
    PLUGIN_ERROR(
            500,
            AppsmithPluginErrorCode.GENERIC_PLUGIN_ERROR.getCode(),
            "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Query execution error",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"),
    PLUGIN_GET_STRUCTURE_ERROR(
            500,
            AppsmithPluginErrorCode.PLUGIN_GET_STRUCTURE_ERROR.getCode(),
            "{0}",
            AppsmithErrorAction.DEFAULT,
            "Failed to get datasource structure",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"),
    PLUGIN_VALIDATE_DATASOURCE_ERROR(
            500,
            AppsmithPluginErrorCode.PLUGIN_VALIDATE_DATASOURCE_ERROR.getCode(),
            "{0}",
            AppsmithErrorAction.DEFAULT,
            AppsmithPluginErrorCode.PLUGIN_VALIDATE_DATASOURCE_ERROR.getDescription(),
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"),
    PLUGIN_QUERY_TIMEOUT_ERROR(
            504,
            AppsmithPluginErrorCode.PLUGIN_QUERY_TIMEOUT_ERROR.getCode(),
            "{0} timed out in {1} milliseconds. Please increase timeout. This can be found in Settings tab of {0}.",
            AppsmithErrorAction.DEFAULT,
            "Timed out on query execution",
            ErrorType.CONNECTIVITY_ERROR,
            "{2}",
            "{3}"),
    PLUGIN_GET_STRUCTURE_TIMEOUT_ERROR(
            504,
            AppsmithPluginErrorCode.PLUGIN_GET_STRUCTURE_TIMEOUT_ERROR.getCode(),
            "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Timed out when fetching datasource structure",
            ErrorType.CONNECTIVITY_ERROR,
            "{1}",
            "{2}"),
    PLUGIN_DATASOURCE_ARGUMENT_ERROR(
            500,
            AppsmithPluginErrorCode.PLUGIN_DATASOURCE_ARGUMENT_ERROR.getCode(),
            "{0}",
            AppsmithErrorAction.DEFAULT,
            "Datasource configuration is invalid",
            ErrorType.DATASOURCE_CONFIGURATION_ERROR,
            "{1}",
            "{2}"),
    PLUGIN_EXECUTE_ARGUMENT_ERROR(
            500,
            AppsmithPluginErrorCode.PLUGIN_EXECUTE_ARGUMENT_ERROR.getCode(),
            "{0}",
            AppsmithErrorAction.DEFAULT,
            "Query configuration is invalid",
            ErrorType.ACTION_CONFIGURATION_ERROR,
            "{1}",
            "{2}"),
    PLUGIN_JSON_PARSE_ERROR(
            500,
            AppsmithPluginErrorCode.JSON_PROCESSING_ERROR.getCode(),
            "Plugin failed to parse JSON \"{0}\"",
            AppsmithErrorAction.DEFAULT,
            "Invalid JSON found",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"),
    PLUGIN_DATASOURCE_TEST_GENERIC_ERROR(
            500,
            AppsmithPluginErrorCode.PLUGIN_DATASOURCE_TEST_GENERIC_ERROR.getCode(),
            "Plugin failed to test with the given configuration. Please reach out to Appsmith customer support to report this",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Datasource configuration is invalid",
            ErrorType.INTERNAL_ERROR,
            "{0}",
            "{1}"),
    PLUGIN_DATASOURCE_TIMEOUT_ERROR(
            504,
            AppsmithPluginErrorCode.PLUGIN_DATASOURCE_TIMEOUT_ERROR.getCode(),
            "{0}",
            AppsmithErrorAction.DEFAULT,
            "Timed out when connecting to datasource",
            ErrorType.CONNECTIVITY_ERROR,
            "{1}",
            "{2}"),
    PLUGIN_AUTHENTICATION_ERROR(
            401,
            AppsmithPluginErrorCode.PLUGIN_AUTHENTICATION_ERROR.getCode(),
            "Invalid authentication credentials. Please check datasource configuration.",
            AppsmithErrorAction.DEFAULT,
            "Datasource authentication error",
            ErrorType.AUTHENTICATION_ERROR,
            "{0}",
            "{1}"),
    PLUGIN_DATASOURCE_AUTHENTICATION_ERROR(
            401,
            AppsmithPluginErrorCode.PLUGIN_DATASOURCE_AUTHENTICATION_ERROR.getCode(),
            "Invalid authentication credentials. Please check datasource configuration.",
            AppsmithErrorAction.DEFAULT,
            "Datasource authentication error",
            ErrorType.DATASOURCE_CONFIGURATION_ERROR,
            "{0}",
            "{1}"),
    PLUGIN_DATASOURCE_ERROR(
            400,
            AppsmithPluginErrorCode.PLUGIN_DATASOURCE_ERROR.getCode(),
            "Error with datasource request. Please check datasource configuration.",
            AppsmithErrorAction.DEFAULT,
            "Datasource error",
            ErrorType.BAD_REQUEST,
            "{0}",
            "{1}"),
    PLUGIN_IN_MEMORY_FILTERING_ERROR(
            500,
            AppsmithPluginErrorCode.PLUGIN_IN_MEMORY_FILTERING_ERROR.getCode(),
            "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Appsmith In Memory Filtering Failed",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"),
    PLUGIN_UQI_WHERE_CONDITION_UNKNOWN(
            500,
            AppsmithPluginErrorCode.PLUGIN_UQI_WHERE_CONDITION_UNKNOWN.getCode(),
            "{0} is not a known conditional operator. Please reach out to Appsmith customer support to report this",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Where condition could not be parsed",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"),
    INCOMPATIBLE_FILE_FORMAT(
            400,
            AppsmithPluginErrorCode.INCOMPATIBLE_FILE_FORMAT.getCode(),
            "Provided file format is incompatible, please upgrade your instance to resolve this conflict.",
            AppsmithErrorAction.DEFAULT,
            AppsmithPluginErrorCode.INCOMPATIBLE_FILE_FORMAT.getDescription(),
            ErrorType.INTERNAL_ERROR,
            "{0}",
            "{1}"),

    STALE_CONNECTION_ERROR(
            500,
            AppsmithPluginErrorCode.GENERIC_STALE_CONNECTION.getCode(),
            AppsmithPluginErrorCode.GENERIC_STALE_CONNECTION.getDescription(),
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Connection is stale",
            ErrorType.CONNECTIVITY_ERROR,
            "{0}",
            "{1}"),

    SMART_SUBSTITUTION_VALUE_MISSING(
            500,
            AppsmithPluginErrorCode.SMART_SUBSTITUTION_VALUE_MISSING.getCode(),
            "Uh oh! This is unexpected. " + "Did not receive any information for the binding " + "{0}"
                    + ". Please contact customer support at Appsmith.",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Smart substitution error",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"),
    PLUGIN_GET_PREVIEW_DATA_ERROR(
            500,
            AppsmithPluginErrorCode.PLUGIN_GET_PREVIEW_DATA_ERROR.getCode(),
            AppsmithPluginErrorCode.PLUGIN_GET_PREVIEW_DATA_ERROR.getDescription(),
            AppsmithErrorAction.DEFAULT,
            "Failed to get preview data",
            ErrorType.DATASOURCE_CONFIGURATION_ERROR,
            "{0}",
            "{1}"),
    PLUGIN_UNSUPPORTED_OPERATION(
            500,
            AppsmithPluginErrorCode.PLUGIN_UNSUPPORTED_OPERATION.getCode(),
            AppsmithPluginErrorCode.PLUGIN_UNSUPPORTED_OPERATION.getDescription(),
            AppsmithErrorAction.DEFAULT,
            "Unsupported Operation",
            ErrorType.INTERNAL_ERROR,
            "{0}",
            "{1}"),
    PLUGIN_DATASOURCE_RATE_LIMIT_ERROR(
            429,
            AppsmithPluginErrorCode.PLUGIN_RATE_LIMIT_ERROR.getCode(),
            "Rate limit reached for Appsmith AI. Please contact support@appsmith.com to increase this limit.",
            AppsmithErrorAction.DEFAULT,
            "Datasource rate limit error",
            ErrorType.RATE_LIMIT_ERROR,
            "{0}",
            "{1}"),
    PLUGIN_TIMEOUT_OUT_OF_RANGE(
            504,  
            AppsmithPluginErrorCode.PLUGIN_TIMEOUT_OUT_OF_RANGE.getCode(),
            "Timeout value of {0} milliseconds is out of the valid range. Query timeout field must be an integer between 10000 and 60000",
            AppsmithErrorAction.DEFAULT,
            "Timeout out of range",
            ErrorType.VALIDATION_ERROR,
            "{2}",
            "{3}");

    private final Integer httpErrorCode;
    private final String appErrorCode;
    private final String message;
    private final String title;
    private final AppsmithErrorAction errorAction;
    private final ErrorType errorType;

    private final String downstreamErrorMessage;

    private final String downstreamErrorCode;

    AppsmithPluginError(
            Integer httpErrorCode,
            String appErrorCode,
            String message,
            AppsmithErrorAction errorAction,
            String title,
            ErrorType errorType,
            String downstreamErrorMessage,
            String downstreamErrorCode) {
        this.httpErrorCode = httpErrorCode;
        this.appErrorCode = appErrorCode;
        this.errorType = errorType;
        this.errorAction = errorAction;
        this.message = message;
        this.title = title;
        this.downstreamErrorMessage = downstreamErrorMessage;
        this.downstreamErrorCode = downstreamErrorCode;
    }

    public String getMessage(Object... args) {
        return new MessageFormat(this.message).format(args);
    }

    public String getErrorType() {
        return this.errorType.toString();
    }

    public String getDownstreamErrorMessage(Object... args) {
        return replacePlaceholderWithValue(this.downstreamErrorMessage, args);
    }

    public String getDownstreamErrorCode(Object... args) {
        return replacePlaceholderWithValue(this.downstreamErrorCode, args);
    }
}
