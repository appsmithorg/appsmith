package com.appsmith.external.exceptions.pluginExceptions;

import com.appsmith.external.exceptions.AppsmithErrorAction;
import com.appsmith.external.models.ErrorType;
import lombok.Getter;

import java.text.MessageFormat;
import java.util.regex.Pattern;

@Getter
public enum AppsmithPluginError {

    PLUGIN_ERROR(
            500,
            "5000",
            "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Query execution error",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    PLUGIN_GET_STRUCTURE_ERROR(
            500,
            "5001",
            "{0}",
            AppsmithErrorAction.DEFAULT,
            "Failed to get datasource structure",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    PLUGIN_QUERY_TIMEOUT_ERROR(
            504,
            "5002",
            "{0} timed out in {1} milliseconds. Please increase timeout. This can be found in Settings tab of {0}.",
            AppsmithErrorAction.DEFAULT, "Timed out on query execution",
            ErrorType.CONNECTIVITY_ERROR,
            "{2}",
            "{3}"
    ),
    PLUGIN_MAX_RESULT_SIZE_EXCEEDED(
            504,
            "5009",
            "Response size exceeded the maximum supported size of {0} MB. Please use LIMIT to reduce the amount of data fetched.",
            AppsmithErrorAction.DEFAULT,
            "Large Result Set Not Supported",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    PLUGIN_GET_STRUCTURE_TIMEOUT_ERROR(
            504,
            "5003",
            "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Timed out when fetching datasource structure",
            ErrorType.CONNECTIVITY_ERROR,
            "{1}",
            "{2}"
    ),
    PLUGIN_DATASOURCE_ARGUMENT_ERROR(
            500,
            "5004",
            "{0}",
            AppsmithErrorAction.DEFAULT,
            "Datasource configuration is invalid",
            ErrorType.DATASOURCE_CONFIGURATION_ERROR,
            "{1}",
            "{2}"
    ),
    PLUGIN_EXECUTE_ARGUMENT_ERROR(
            500,
            "5005",
            "{0}",
            AppsmithErrorAction.DEFAULT,
            "Query configuration is invalid",
            ErrorType.ACTION_CONFIGURATION_ERROR,
            "{1}",
            "{2}"
    ),
    PLUGIN_JSON_PARSE_ERROR(
            500,
            "5006",
            "Plugin failed to parse JSON \"{0}\" with error: {1}",
            AppsmithErrorAction.DEFAULT,
            "Invalid JSON found",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    PLUGIN_DATASOURCE_TEST_GENERIC_ERROR(
            500,
            "5007",
            "Plugin failed to test with the given configuration. Please reach out to Appsmith customer support to report this",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Datasource configuration is invalid",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    PLUGIN_DATASOURCE_TIMEOUT_ERROR(
            504,
            "5008",
            "{0}",
            AppsmithErrorAction.DEFAULT,
            "Timed out when connecting to datasource",
            ErrorType.CONNECTIVITY_ERROR,
            "{1}",
            "{2}"
    ),
    PLUGIN_AUTHENTICATION_ERROR(
            401,
            "4000",
            "Invalid authentication credentials. Please check datasource configuration.",
            AppsmithErrorAction.DEFAULT,
            "Datasource authentication error",
            ErrorType.AUTHENTICATION_ERROR,
            "{0}",
            "{1}"
    ),
    PLUGIN_IN_MEMORY_FILTERING_ERROR(
            500,
            "5010",
            "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Appsmith In Memory Filtering Failed",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    PLUGIN_UQI_WHERE_CONDITION_UNKNOWN(
            500,
            "5011",
            "{0} is not a known conditional operator. Please reach out to Appsmith customer support to report this",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Where condition could not be parsed",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    UNSUPPORTED_PLUGIN_OPERATION(
            500,
            "5012",
            "Testing datasource for SaaS plugin is not supported",
            AppsmithErrorAction.DEFAULT,
            "Unsupported operation",
            ErrorType.INTERNAL_ERROR,
            "{0}",
            "{1}"
    ),
    PLUGIN_FORM_TO_NATIVE_TRANSLATION_ERROR(
            500,
            "5013",
            "Plugin failed to convert formData into native query with error: {0}",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Failed to convert form data to native",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    INCOMPATIBLE_FILE_FORMAT(
            400,
            "4001",
            "Provided file format is incompatible, please upgrade your instance to resolve this conflict.",
            AppsmithErrorAction.DEFAULT,
            "Incompatible file format",
            ErrorType.INTERNAL_ERROR,
            "{0}",
            "{1}"
    ),

    STALE_CONNECTION_ERROR(
            500,
            AppsmithPluginErrorCode.GENERIC_STALE_CONNECTION.getCode(),
            AppsmithPluginErrorCode.GENERIC_STALE_CONNECTION.getDescription(),
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Connection is stale",
            ErrorType.INTERNAL_ERROR,
            "{0}",
            "{1}"
    ),

    MYSQL_EMPTY_QUERY(
            500,
            AppsmithPluginErrorCode.MYSQL_EMPTY_QUERY.getCode(),
            AppsmithPluginErrorCode.MYSQL_EMPTY_QUERY.getDescription(),
            AppsmithErrorAction.DEFAULT,
            "Query configuration is invalid",
            ErrorType.ACTION_CONFIGURATION_ERROR,
            "{0}",
            "{1}"
    ),
    MYSQL_IS_KEYWORD_NOT_ALLOWED_IN_PREPARED_STATEMENT(
            500,
            AppsmithPluginErrorCode.MYSQL_IS_KEYWORD_NOT_ALLOWED_IN_PREPARED_STATEMENT.getCode(),
            AppsmithPluginErrorCode.MYSQL_IS_KEYWORD_NOT_ALLOWED_IN_PREPARED_STATEMENT.getDescription(),
            AppsmithErrorAction.DEFAULT,
            "Query configuration is invalid",
            ErrorType.ACTION_CONFIGURATION_ERROR,
            "{0}",
            "{1}"
    ),
    MYSQL_INVALID_QUERY_SYNTAX(
            400,
            AppsmithPluginErrorCode.MYSQL_INVALID_QUERY_SYNTAX.getCode(),
            AppsmithPluginErrorCode.MYSQL_INVALID_QUERY_SYNTAX.getDescription(),
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Syntax error",
            ErrorType.INTERNAL_ERROR,
            "{0}",
            "{1}"
    ),
    MYSQL_MISSING_REQUIRED_PERMISSION(
            403,
            AppsmithPluginErrorCode.MYSQL_MISSING_REQUIRED_PERMISSION.getCode(),
            AppsmithPluginErrorCode.MYSQL_MISSING_REQUIRED_PERMISSION.getDescription(),
            AppsmithErrorAction.DEFAULT,
            "Required permission missing",
            ErrorType.AUTHENTICATION_ERROR,
            "{0}",
            "{1}"
    ),
    MYSQL_QUERY_EXECUTION_FAILED(
            500,
            AppsmithPluginErrorCode.MYSQL_QUERY_EXECUTION_FAILED.getCode(),
            AppsmithPluginErrorCode.MYSQL_QUERY_EXECUTION_FAILED.getDescription(),
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Query execution error",
            ErrorType.INTERNAL_ERROR,
            "{0}",
            "{1}"
    ),
    ;

    private final Integer httpErrorCode;
    private final String appErrorCode;
    private final String message;
    private final String title;
    private final AppsmithErrorAction errorAction;
    private final ErrorType errorType;

    private final String downstreamErrorMessage;

    private final String downstreamErrorCode;

    private final static Pattern errorPlaceholderPattern = Pattern.compile("\\{\\d+\\}");

    AppsmithPluginError(Integer httpErrorCode, String appErrorCode, String message, AppsmithErrorAction errorAction,
                        String title, ErrorType errorType, String downstreamErrorMessage, String downstreamErrorCode, Object... args) {
        this.httpErrorCode = httpErrorCode;
        this.appErrorCode = appErrorCode;
        this.errorType = errorType;
        MessageFormat fmt = new MessageFormat(message);
        this.errorAction = errorAction;
        this.message = fmt.format(args);
        this.title = title;
        fmt = new MessageFormat(downstreamErrorMessage);
        this.downstreamErrorMessage = fmt.format(args);

        fmt = new MessageFormat(downstreamErrorCode);
        this.downstreamErrorCode = fmt.format(args);
    }

    public String getMessage(Object... args) {
        return new MessageFormat(this.message).format(args);
    }

    public String getErrorType() { return this.errorType.toString(); }

    public String getDownstreamErrorMessage(Object... args) {
        if (this.downstreamErrorMessage == null) {
            return null;
        }
        String formattedMessage = new MessageFormat(this.downstreamErrorMessage).format(args);
        if (errorPlaceholderPattern.matcher(this.downstreamErrorMessage).matches()) {
            return null;
        }
        return formattedMessage;
    }

    public String getDownstreamErrorCode(Object... args) {
        if (this.downstreamErrorCode == null) {
            return null;
        }
        String formattedErrorCode = new MessageFormat(this.downstreamErrorCode).format(args);
        if (errorPlaceholderPattern.matcher(this.downstreamErrorCode).matches()) {
            return null;
        }
        return formattedErrorCode;
    }

}
