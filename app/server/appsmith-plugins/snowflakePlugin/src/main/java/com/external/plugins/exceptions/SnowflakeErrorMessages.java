package com.external.plugins.exceptions;

import com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE) // To prevent instantiation
public class SnowflakeErrorMessages extends BasePluginErrorMessages {
    public static final String MISSING_QUERY_ERROR_MSG = "Missing required parameter: Query.";

    public static final String QUERY_EXECUTION_FAILED_ERROR_MSG =
            "Your query failed to execute. Please check more information in the error details.";

    public static final String UNABLE_TO_CREATE_CONNECTION_ERROR_MSG = "Unable to create connection to Snowflake URL";

    public static final String GET_STRUCTURE_ERROR_MSG =
            "Appsmith server has failed to fetch the structure of your schema. Please check more information in the error details.";

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

    public static final String DS_MISSING_PRIVATE_KEY_ERROR_MSG = "Missing private key for authentication.";

    public static final String DS_MISSING_PASSPHRASE_FOR_ENCRYPTED_PRIVATE_KEY =
            "Passphrase is required as private key is encrypted";
    public static final String DS_INCORRECT_PASSPHRASE_OR_PRIVATE_KEY = "Passphrase or private key is incorrect";
}
