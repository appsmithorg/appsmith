package com.appsmith.external.exceptions.pluginExceptions;

import lombok.Getter;

@Getter
public enum AppsmithPluginErrorCode {
    REST_API_INVALID_URI_SYNTAX("PE-RST-4000", "URI syntax is wrong"),
    REST_API_INVALID_CONTENT_TYPE("PE-RST-4001", "Invalid value for content-type header"),
    REST_API_INVALID_HTTP_METHOD("PE-RST-4002", "HTTP method either missing or invalid"),
    REST_API_EXECUTION_FAILED("PE-RST-5000", "Any runtime error during the execution of API"),

    POSTGRES_EMPTY_QUERY("PE-PGS-4000", "Query is null or empty"),
    POSTGRES_RESPONSE_SIZE_TOO_LARGE("PE-PGS-5009", "Response size exceeds the maximum supported size"),
    POSTGRES_QUERY_EXECUTION_FAILED("PE-PGS-5000", "Query execution failed"),

    MYSQL_EMPTY_QUERY("PE-MYS-4000", "Query is null or empty"),
    MYSQL_IS_KEYWORD_NOT_ALLOWED_IN_PREPARED_STATEMENT("PE-MYS-40001", "Appsmith currently does not support the IS keyword with the prepared statement " +
            "setting turned ON. Please re-write your SQL query without the IS keyword or " +
            "turn OFF (unsafe) the 'Use prepared statement' knob from the settings tab."),
    MYSQL_INVALID_QUERY_SYNTAX("PE-MYS-4002", "Query is syntactically wrong"),
    MYSQL_MISSING_REQUIRED_PERMISSION("PE-MYS-4003", "Required permission is missing with the DB user"),
    MYSQL_QUERY_EXECUTION_FAILED("PE-MYS-5000", "Query execution failed"),

    MONGODB_QUERY_TIMEOUT("PE-MNG-5002", "Query timeout"),
    MONGODB_INVALID_COMMAND("PE-MNG-4000", "Invalid query syntax"),
    MONGODB_QUERY_EXECUTION_FAILED("PE-MNG-5000", "Query execution failed"),

    SQLSERVER_EMPTY_QUERY("PE-MSS-4000", "Query is null or empty"),
    SQLSERVER_QUERY_EXECUTION_FAILED("PE-MSS-5000", "Query execution failed"),

    GSHEET_MISSING_METHOD("PE-GSH-4000", "Missing Google Sheets method"),
    GSHEET_MISSING_REQUIRED_FIELD("PE-GSH-4001", "Missing required field"),
    GSHEET_QUERY_EXECUTION_FAILED("PE-GSH-5000", "Query execution failed"),
    GSHEET_EMPTY_RESPONSE("PE-GSH-5001", "Expected to receive a response body"),
    GSHEET_EMPTY_HEADERS_IN_RESPONSE("PE-GSH-5002", "Expected to receive existing headers in response"),


    JSON_PROCESSING_ERROR("PE-JSN-4000", "JSON processing error either at serializing or deserializing"),
    SMART_SUBSTITUTION_VALUE_MISSING("PE-SST-5000", "Missing required binding parameter's value"),
    GENERIC_PLUGIN_ERROR("PE-GEN-5000", "A generic plugin error"),
    GENERIC_STALE_CONNECTION("PE-GEN-5004", "Secondary stale connection error");


    private final String code;
    private final String description;

    AppsmithPluginErrorCode(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
