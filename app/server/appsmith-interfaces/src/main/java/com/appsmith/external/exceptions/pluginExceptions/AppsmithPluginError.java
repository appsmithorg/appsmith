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
            AppsmithPluginErrorCode.GENERIC_PLUGIN_ERROR.getCode(),
            "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Query execution error",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    PLUGIN_GET_STRUCTURE_ERROR(
            500,
            AppsmithPluginErrorCode.PLUGIN_GET_STRUCTURE_ERROR.getCode(),
            "{0}",
            AppsmithErrorAction.DEFAULT,
            "Failed to get datasource structure",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    PLUGIN_QUERY_TIMEOUT_ERROR(
            504,
            AppsmithPluginErrorCode.PLUGIN_QUERY_TIMEOUT_ERROR.getCode(),
            "{0} timed out in {1} milliseconds. Please increase timeout. This can be found in Settings tab of {0}.",
            AppsmithErrorAction.DEFAULT,
            "Timed out on query execution",
            ErrorType.CONNECTIVITY_ERROR,
            "{2}",
            "{3}"
    ),
    PLUGIN_GET_STRUCTURE_TIMEOUT_ERROR(
            504,
            AppsmithPluginErrorCode.PLUGIN_GET_STRUCTURE_TIMEOUT_ERROR.getCode(),
            "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Timed out when fetching datasource structure",
            ErrorType.CONNECTIVITY_ERROR,
            "{1}",
            "{2}"
    ),
    PLUGIN_DATASOURCE_ARGUMENT_ERROR(
            500,
            AppsmithPluginErrorCode.PLUGIN_DATASOURCE_ARGUMENT_ERROR.getCode(),
            AppsmithPluginErrorCode.PLUGIN_DATASOURCE_ARGUMENT_ERROR.getDescription(),
            AppsmithErrorAction.DEFAULT,
            "Datasource configuration is invalid",
            ErrorType.DATASOURCE_CONFIGURATION_ERROR,
            "{0}",
            "{1}"
    ),
    PLUGIN_EXECUTE_ARGUMENT_ERROR(
            500,
            AppsmithPluginErrorCode.PLUGIN_EXECUTE_ARGUMENT_ERROR.getCode(),
            "{0}",
            AppsmithErrorAction.DEFAULT,
            "Query configuration is invalid",
            ErrorType.ACTION_CONFIGURATION_ERROR,
            "{1}",
            "{2}"
    ),
    PLUGIN_JSON_PARSE_ERROR(
            500,
            AppsmithPluginErrorCode.JSON_PROCESSING_ERROR.getCode(),
            "Plugin failed to parse JSON \"{0}\"",
            AppsmithErrorAction.DEFAULT,
            "Invalid JSON found",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    PLUGIN_DATASOURCE_TEST_GENERIC_ERROR(
            500,
            AppsmithPluginErrorCode.PLUGIN_DATASOURCE_TEST_GENERIC_ERROR.getCode(),
            "Plugin failed to test with the given configuration. Please reach out to Appsmith customer support to report this",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Datasource configuration is invalid",
            ErrorType.INTERNAL_ERROR,
            "{0}",
            "{1}"
    ),
    PLUGIN_DATASOURCE_TIMEOUT_ERROR(
            504,
            AppsmithPluginErrorCode.PLUGIN_DATASOURCE_TIMEOUT_ERROR.getCode(),
            "{0}",
            AppsmithErrorAction.DEFAULT,
            "Timed out when connecting to datasource",
            ErrorType.CONNECTIVITY_ERROR,
            "{1}",
            "{2}"
    ),
    PLUGIN_AUTHENTICATION_ERROR(
            401,
            AppsmithPluginErrorCode.PLUGIN_AUTHENTICATION_ERROR.getCode(),
            "Invalid authentication credentials. Please check datasource configuration.",
            AppsmithErrorAction.DEFAULT,
            "Datasource authentication error",
            ErrorType.AUTHENTICATION_ERROR,
            "{0}",
            "{1}"
    ),
    PLUGIN_IN_MEMORY_FILTERING_ERROR(
            500,
            AppsmithPluginErrorCode.PLUGIN_IN_MEMORY_FILTERING_ERROR.getCode(),
            "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Appsmith In Memory Filtering Failed",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    PLUGIN_UQI_WHERE_CONDITION_UNKNOWN(
            500,
            AppsmithPluginErrorCode.PLUGIN_UQI_WHERE_CONDITION_UNKNOWN.getCode(),
            "{0} is not a known conditional operator. Please reach out to Appsmith customer support to report this",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Where condition could not be parsed",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    UNSUPPORTED_PLUGIN_OPERATION(
            500,
            AppsmithPluginErrorCode.UNSUPPORTED_PLUGIN_OPERATION.getCode(),
            "Testing datasource for SaaS plugin is not supported",
            AppsmithErrorAction.DEFAULT,
            "Unsupported operation",
            ErrorType.INTERNAL_ERROR,
            "{0}",
            "{1}"
    ),
    INCOMPATIBLE_FILE_FORMAT(
            400,
            AppsmithPluginErrorCode.INCOMPATIBLE_FILE_FORMAT.getCode(),
            "Provided file format is incompatible, please upgrade your instance to resolve this conflict.",
            AppsmithErrorAction.DEFAULT,
            AppsmithPluginErrorCode.INCOMPATIBLE_FILE_FORMAT.getDescription(),
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
    SMART_SUBSTITUTION_VALUE_MISSING(
            500,
            AppsmithPluginErrorCode.SMART_SUBSTITUTION_VALUE_MISSING.getCode(),
            "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Smart substitution error",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    REST_API_INVALID_URI_SYNTAX(
            500,
            AppsmithPluginErrorCode.REST_API_INVALID_URI_SYNTAX.getCode(),
            AppsmithPluginErrorCode.REST_API_INVALID_URI_SYNTAX.getDescription(),
            AppsmithErrorAction.DEFAULT,
            "Query configuration is invalid",
            ErrorType.ACTION_CONFIGURATION_ERROR,
            "{0}",
            "{1}"
    ),
    REST_API_INVALID_CONTENT_TYPE(
            500,
            AppsmithPluginErrorCode.REST_API_INVALID_CONTENT_TYPE.getCode(),
            "{0}",
            AppsmithErrorAction.DEFAULT,
            "Query configuration is invalid",
            ErrorType.ACTION_CONFIGURATION_ERROR,
            "{1}",
            "{2}"
    ),
    REST_API_INVALID_HTTP_METHOD(
            500,
            AppsmithPluginErrorCode.REST_API_INVALID_HTTP_METHOD.getCode(),
            AppsmithPluginErrorCode.REST_API_INVALID_HTTP_METHOD.getDescription(),
            AppsmithErrorAction.DEFAULT,
            "Query configuration is invalid",
            ErrorType.ACTION_CONFIGURATION_ERROR,
            "{0}",
            "{1}"
    ),

    REST_API_EXECUTION_FAILED(
            500,
            AppsmithPluginErrorCode.REST_API_EXECUTION_FAILED.getCode(),
            AppsmithPluginErrorCode.REST_API_EXECUTION_FAILED.getDescription(),
            AppsmithErrorAction.LOG_EXTERNALLY,
            "API execution error",
            ErrorType.INTERNAL_ERROR,
            "{0}",
            "{1}"
    ),
    POSTGRES_EMPTY_QUERY(
            500,
            AppsmithPluginErrorCode.POSTGRES_EMPTY_QUERY.getCode(),
            AppsmithPluginErrorCode.POSTGRES_EMPTY_QUERY.getDescription(),
            AppsmithErrorAction.DEFAULT,
            "Query configuration is invalid",
            ErrorType.ACTION_CONFIGURATION_ERROR,
            "{0}",
            "{1}"
    ),
    POSTGRES_RESPONSE_SIZE_TOO_LARGE(
            504,
            AppsmithPluginErrorCode.POSTGRES_RESPONSE_SIZE_TOO_LARGE.getCode(),
            "Response size exceeded the maximum supported size of {0} MB. Please use LIMIT to reduce the amount of data fetched.",
            AppsmithErrorAction.DEFAULT,
            "Large Result Set Not Supported",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    POSTGRES_QUERY_EXECUTION_FAILED(
            500,
            AppsmithPluginErrorCode.POSTGRES_QUERY_EXECUTION_FAILED.getCode(),
            AppsmithPluginErrorCode.POSTGRES_QUERY_EXECUTION_FAILED.getDescription(),
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Query execution error",
            ErrorType.INTERNAL_ERROR,
            "{0}",
            "{1}"
    ),
    POSTGRES_PLUGIN_ERROR(
            500,
            AppsmithPluginErrorCode.POSTGRES_PLUGIN_ERROR.getCode(),
            AppsmithPluginErrorCode.POSTGRES_PLUGIN_ERROR.getDescription(),
            AppsmithErrorAction.LOG_EXTERNALLY,
            "PostgreSQL plugin error",
            ErrorType.INTERNAL_ERROR,
            "{0}",
            "{1}"
    ),
    POSTGRES_DATASOURCE_STRUCTURE_ERROR(
            500,
            AppsmithPluginErrorCode.POSTGRES_DATASOURCE_STRUCTURE_ERROR.getCode(),
            AppsmithPluginErrorCode.POSTGRES_DATASOURCE_STRUCTURE_ERROR.getDescription(),
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Fetching datasource structure failed",
            ErrorType.INTERNAL_ERROR,
            "{0}",
            "{1}"
    ),
    POSTGRES_SSL_CONNECTION_ERROR(
            500,
            AppsmithPluginErrorCode.POSTGRES_SSL_CONNECTION_ERROR.getCode(),
            AppsmithPluginErrorCode.POSTGRES_SSL_CONNECTION_ERROR.getDescription(),
            AppsmithErrorAction.LOG_EXTERNALLY,
            "SSL configuration error",
            ErrorType.INTERNAL_ERROR,
            "{0}",
            "{1}"
    ),
    SQLSERVER_EMPTY_QUERY(
            500,
            AppsmithPluginErrorCode.SQLSERVER_EMPTY_QUERY.getCode(),
            AppsmithPluginErrorCode.SQLSERVER_EMPTY_QUERY.getDescription(),
            AppsmithErrorAction.DEFAULT,
            "Query configuration is invalid",
            ErrorType.ACTION_CONFIGURATION_ERROR,
            "{0}",
            "{1}"
    ),
    SQLSERVER_QUERY_EXECUTION_FAILED(
            500,
            AppsmithPluginErrorCode.SQLSERVER_QUERY_EXECUTION_FAILED.getCode(),
            AppsmithPluginErrorCode.SQLSERVER_QUERY_EXECUTION_FAILED.getDescription(),
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Query execution error",
            ErrorType.INTERNAL_ERROR,
            "{0}",
            "{1}"
    ),
    GSHEET_MISSING_METHOD(
            500,
            AppsmithPluginErrorCode.GSHEET_MISSING_METHOD.getCode(),
            AppsmithPluginErrorCode.GSHEET_MISSING_METHOD.getDescription(),
            AppsmithErrorAction.DEFAULT,
            "Query configuration is invalid",
            ErrorType.ACTION_CONFIGURATION_ERROR,
            "{0}",
            "{1}"
    ),
    GSHEET_QUERY_EXECUTION_FAILED(
            500,
            AppsmithPluginErrorCode.GSHEET_QUERY_EXECUTION_FAILED.getCode(),
            AppsmithPluginErrorCode.GSHEET_QUERY_EXECUTION_FAILED.getDescription(),
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Query execution error",
            ErrorType.INTERNAL_ERROR,
            "{0}",
            "{1}"
    ),
    GSHEET_EMPTY_RESPONSE(
            500,
            AppsmithPluginErrorCode.GSHEET_EMPTY_RESPONSE.getCode(),
            AppsmithPluginErrorCode.GSHEET_EMPTY_RESPONSE.getDescription(),
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Query execution error",
            ErrorType.INTERNAL_ERROR,
            "{0}",
            "{1}"
    ),
    MONGODB_FORM_TO_NATIVE_TRANSLATION_ERROR(
            500,
            AppsmithPluginErrorCode.MONGODB_FORM_TO_NATIVE_TRANSLATION_ERROR.getCode(),
            "Plugin failed to convert formData into native query",
            AppsmithErrorAction.LOG_EXTERNALLY,
            AppsmithPluginErrorCode.MONGODB_FORM_TO_NATIVE_TRANSLATION_ERROR.getDescription(),
            ErrorType.INTERNAL_ERROR,
            "{0}",
            "{1}"
    ),
    MONGODB_QUERY_EXECUTION_FAILED(
            500,
            AppsmithPluginErrorCode.MONGODB_QUERY_EXECUTION_FAILED.getCode(),
            AppsmithPluginErrorCode.MONGODB_FORM_TO_NATIVE_TRANSLATION_ERROR.getDescription(),
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Query execution error",
            ErrorType.INTERNAL_ERROR,
            "{0}",
            "{1}"
    ),
    AMAZON_S3_QUERY_EXECUTION_FAILED(
            500,
            AppsmithPluginErrorCode.AMAZON_S3_QUERY_EXECUTION_FAILED.getCode(),
            "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Query execution error",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    ARANGODB_QUERY_EXECUTION_FAILED(
            500,
            AppsmithPluginErrorCode.ARANGODB_QUERY_EXECUTION_FAILED.getCode(),
            "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Query execution error",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    DYNAMODB_QUERY_EXECUTION_FAILED(
            500,
            AppsmithPluginErrorCode.DYNAMODB_QUERY_EXECUTION_FAILED.getCode(),
            "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Query execution error",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    ELASTICSEARCH_QUERY_EXECUTION_FAILED(
            500,
            AppsmithPluginErrorCode.ELASTICSEARCH_QUERY_EXECUTION_FAILED.getCode(),
            "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Query execution error",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    FIRESTORE_QUERY_EXECUTION_FAILED(
            500,
            AppsmithPluginErrorCode.FIRESTORE_QUERY_EXECUTION_FAILED.getCode(),
            "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Query execution error",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    REDSHIFT_QUERY_EXECUTION_FAILED(
            500,
            AppsmithPluginErrorCode.REDSHIFT_QUERY_EXECUTION_FAILED.getCode(),
            "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Query execution error",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    SMTP_QUERY_EXECUTION_FAILED(
            500,
            AppsmithPluginErrorCode.SMTP_QUERY_EXECUTION_FAILED.getCode(),
            "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Query execution error",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    GRAPHQL_QUERY_EXECUTION_FAILED(
            500,
            AppsmithPluginErrorCode.GENERIC_PLUGIN_ERROR.getCode(),
            "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Query execution error",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    SNOWFLAKE_QUERY_EXECUTION_FAILED(
            500,
            AppsmithPluginErrorCode.SNOWFLAKE_QUERY_EXECUTION_FAILED.getCode(),
            "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Query execution error",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    SAAS_API_EXECUTION_FAILED(
            500,
            AppsmithPluginErrorCode.SAAS_API_EXECUTION_FAILED.getCode(),
            "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Query execution error",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
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
        if (errorPlaceholderPattern.matcher(formattedMessage).matches()) {
            return null;
        }
        return formattedMessage;
    }

    public String getDownstreamErrorCode(Object... args) {
        if (this.downstreamErrorCode == null) {
            return null;
        }
        String formattedErrorCode = new MessageFormat(this.downstreamErrorCode).format(args);
        if (errorPlaceholderPattern.matcher(formattedErrorCode).matches()) {
            return null;
        }
        return formattedErrorCode;
    }

}
