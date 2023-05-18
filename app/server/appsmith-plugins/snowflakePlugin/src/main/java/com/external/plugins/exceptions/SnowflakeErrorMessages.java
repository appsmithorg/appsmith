package com.external.plugins.exceptions;

public class SnowflakeErrorMessages {
    private SnowflakeErrorMessages() {
        //Prevents instantiation
    }
    public static final String MISSING_QUERY_ERROR_MSG = "Missing required parameter: Query.";

    public static final String DRIVER_NOT_FOUND_ERROR_MSG = "Snowflake driver not found. Please reach out to Appsmith support to resolve this issue.";

    public static final String QUERY_EXECUTION_FAILED_ERROR_MSG = "Your query failed to execute. Please check more information in the error details.";

    public static final String CONNECTION_CREATION_FAILED_ERROR_MSG = "Error occurred while connecting to Snowflake endpoint: %s";

    public static final String UNABLE_TO_CREATE_CONNECTION_ERROR_MSG = "Unable to create connection to Snowflake URL";

    public static final String GET_STRUCTURE_ERROR_MSG = "Appsmith server has failed to fetch the structure of your schema. Please check more information in the error details.";


    /*
     ************************************************************************************************************************************************
                                        Error messages related to validation of datasource.
     ************************************************************************************************************************************************
     */
    public static final String DS_MISSING_ENDPOINT_ERROR_MSG = "Missing Snowflake URL.";

    public static final String DS_MISSING_WAREHOUSE_NAME_ERROR_MSG = "Missing warehouse name.";

    public static final String DS_MISSING_DATABASE_NAME_ERROR_MSG = "Missing database name.";

    public static final String DS_MISSING_SCHEMA_NAME_ERROR_MSG = "Missing schema name.";

    public static final String DS_MISSING_AUTHENTICATION_DETAILS_ERROR_MSG = "Missing authentication details.";

    public static final String DS_MISSING_USERNAME_ERROR_MSG = "Missing username for authentication.";

    public static final String DS_MISSING_PASSWORD_ERROR_MSG = "Missing password for authentication.";
}
