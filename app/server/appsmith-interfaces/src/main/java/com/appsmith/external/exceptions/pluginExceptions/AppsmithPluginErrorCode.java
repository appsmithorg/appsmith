package com.appsmith.external.exceptions.pluginExceptions;

import lombok.Getter;

@Getter
public enum AppsmithPluginErrorCode {
    //All Appsmith error codes for REST API plugin
    REST_API_INVALID_URI_SYNTAX("PE-RST-4000", "URI syntax is wrong"),
    REST_API_INVALID_CONTENT_TYPE("PE-RST-4001", "Invalid value for Content-Type"),
    REST_API_INVALID_HTTP_METHOD("PE-RST-4002", "HTTP method either missing or invalid"),
    REST_API_EXECUTION_FAILED("PE-RST-5000", "Something went wrong at the time of executing this API"),

    //All Appsmith error codes for PostgreSQL plugin
    POSTGRES_EMPTY_QUERY("PE-PGS-4000", "Query is null or empty"),
    POSTGRES_RESPONSE_SIZE_TOO_LARGE("PE-PGS-5009", "Response size exceeds the maximum supported size"),
    POSTGRES_QUERY_EXECUTION_FAILED("PE-PGS-5000", "PostgreSQL query execution failed"),
    POSTGRES_PLUGIN_ERROR("PE-PGS-5001", "Error in PostgreSQL plugin"),
    POSTGRES_DATASOURCE_STRUCTURE_ERROR("PE-PGS-5002", "Error occurred while fetching the datasource structure"),
    POSTGRES_SSL_CONNECTION_ERROR("PE-PGS-5003", "Either SSL configuration is missing or invalid SSL option"),

    //All Appsmith error codes for MySQL plugin
    MYSQL_EMPTY_QUERY("PE-MYS-4000", "Query is null or empty"),
    MYSQL_IS_KEYWORD_NOT_ALLOWED_IN_PREPARED_STATEMENT("PE-MYS-4001", "Appsmith currently does not support the IS keyword with the prepared statement " +
            "setting turned ON. Please re-write your SQL query without the IS keyword or " +
            "turn OFF (unsafe) the Use prepared statement knob from the settings tab."),
    MYSQL_INVALID_QUERY_SYNTAX("PE-MYS-4002", "Query is syntactically wrong"),
    MYSQL_MISSING_REQUIRED_PERMISSION("PE-MYS-4003", "Required permission is missing with the DB user"),
    MYSQL_QUERY_EXECUTION_FAILED("PE-MYS-5000", "MySQL query execution failed"),

    //All Appsmith error codes for Mongo plugin
    MONGODB_QUERY_TIMEOUT("PE-MNG-5002", "Query timeout"),
    MONGODB_INVALID_COMMAND("PE-MNG-4000", "Invalid query syntax"),
    MONGODB_QUERY_EXECUTION_FAILED("PE-MNG-5000", "MongoDB query execution failed"),
    MONGODB_FORM_TO_NATIVE_TRANSLATION_ERROR("PE-MNG-5001", "Failed to convert form data to native"),

    //All Appsmith error codes for SQL-Server plugin
    SQLSERVER_EMPTY_QUERY("PE-MSS-4000", "Query is null or empty"),
    SQLSERVER_QUERY_EXECUTION_FAILED("PE-MSS-5000", "SQL Server query execution failed"),

    //All Appsmith error codes for Google Sheets plugin
    GSHEET_MISSING_METHOD("PE-GSH-4000", "Missing Google Sheets method"),
    GSHEET_MISSING_REQUIRED_FIELD("PE-GSH-4001", "Missing required field"),
    GSHEET_QUERY_EXECUTION_FAILED("PE-GSH-5000", "Google Sheets query execution failed"),
    GSHEET_EMPTY_RESPONSE("PE-GSH-5001", "Expected to receive a response body"),
    GSHEET_EMPTY_HEADERS_IN_RESPONSE("PE-GSH-5002", "Expected to receive existing headers in response"),


    //All Appsmith error codes for Amazon S3 plugin
    AMAZON_S3_QUERY_EXECUTION_FAILED("PE-AS3-5000", "S3 query execution failed"),

    //All Appsmith error codes for ArangoDB plugin
    ARANGODB_QUERY_EXECUTION_FAILED("PE-ARN-5000", "ArangoDB query execution failed"),

    //All Appsmith error codes for generic plugin errors
    JSON_PROCESSING_ERROR("PE-JSN-4000", "JSON processing error either at serializing or deserializing"),
    SMART_SUBSTITUTION_VALUE_MISSING("PE-SST-5000", "Missing required binding parameter's value"),
    GENERIC_PLUGIN_ERROR("PE-PLG-5000", "A generic plugin error"),
    PLUGIN_GET_STRUCTURE_ERROR("PE-PLG-5001", "Failure in getting datasource structure"),
    PLUGIN_QUERY_TIMEOUT_ERROR("PE-PLG-5002", "Timed out on query execution"),
    PLUGIN_GET_STRUCTURE_TIMEOUT_ERROR("PE-PLG-5003", "Timed out when fetching datasource structure"),
    PLUGIN_DATASOURCE_TEST_GENERIC_ERROR("PE-PLG-5004", "Plugin failed to test with the given configuration"),
    PLUGIN_DATASOURCE_TIMEOUT_ERROR("PE-PLG-5005", "Timed out when connecting to datasource"),
    PLUGIN_AUTHENTICATION_ERROR("PE-PLG-5006", "Datasource authentication error"),
    PLUGIN_IN_MEMORY_FILTERING_ERROR("PE-PLG-5007", "Appsmith in-memory filtering failed"),
    UNSUPPORTED_PLUGIN_OPERATION("PE-PLG-5008", "Unsupported operation on Plugin"),
    INCOMPATIBLE_FILE_FORMAT("PE-PLG-5009", "Incompatible file format"),
    PLUGIN_UQI_WHERE_CONDITION_UNKNOWN("PE-UQI-5000", "Where condition could not be parsed"),
    GENERIC_STALE_CONNECTION("PE-GEN-5004", "Secondary stale connection error"),
    PLUGIN_DATASOURCE_ARGUMENT_ERROR("PE-DSA-5000", "One or more arguments in datasource configuration is invalid"),
    PLUGIN_EXECUTE_ARGUMENT_ERROR("PE-EAE-5000", "Wrong arguments provided")
    ;


    private final String code;
    private final String description;

    AppsmithPluginErrorCode(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
