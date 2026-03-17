package com.external.plugins.exceptions;

public class SeaTableErrorMessages {
    public static final String MISSING_SERVER_URL_ERROR_MSG = "Missing SeaTable server URL.";
    public static final String MISSING_API_TOKEN_ERROR_MSG = "Missing SeaTable API token.";
    public static final String MISSING_COMMAND_ERROR_MSG =
            "Missing command. Please select a command from the dropdown.";
    public static final String MISSING_TABLE_NAME_ERROR_MSG =
            "Missing table name. Please provide a table name.";
    public static final String MISSING_ROW_ID_ERROR_MSG =
            "Missing row ID. Please provide a row ID.";
    public static final String MISSING_SQL_ERROR_MSG =
            "Missing SQL query. Please provide a SQL query.";
    public static final String QUERY_EXECUTION_FAILED_ERROR_MSG = "Query execution failed: %s";
    public static final String ACCESS_TOKEN_FETCH_FAILED_ERROR_MSG =
            "Failed to fetch access token from SeaTable server. Please check your server URL and API token.";
    public static final String INVALID_SERVER_URL_ERROR_MSG =
            "Invalid server URL. The URL should start with http:// or https://.";
}
