package com.external.plugins.exceptions;

import com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE) // To prevent instantiation
public class MssqlErrorMessages extends BasePluginErrorMessages {
    public static final String MISSING_QUERY_ERROR_MSG = "Missing required parameter: Query.";

    public static final String QUERY_EXECUTION_FAILED_ERROR_MSG =
            "Your query failed to execute. Please check more information in the error details.";

    public static final String QUERY_PREPARATION_FAILED_ERROR_MSG = "Query preparation failed while inserting value: %s"
            + " for binding: {{%s}}. Please check the query again.";

    public static final String CONNECTION_POOL_CREATION_FAILED_ERROR_MSG =
            "Exception occurred while creating connection pool. One or more arguments in the datasource configuration may be invalid. Please check your datasource configuration.";

    public static final String GET_STRUCTURE_ERROR_MSG =
            "The Appsmith server has failed to fetch the structure of your schema.";

    /*
    ************************************************************************************************************************************************
                                       Error messages related to validation of datasource.
    ************************************************************************************************************************************************
    */
    public static final String DS_MISSING_ENDPOINT_ERROR_MSG = "Missing endpoint.";
    public static final String DS_MISSING_HOSTNAME_ERROR_MSG = "Host value cannot be empty.";
    public static final String DS_MISSING_DATABASE_NAME_ERROR_MSG = "Missing database name.";
    public static final String DS_MISSING_CONNECTION_MODE_ERROR_MSG = "Missing connection mode.";
    public static final String DS_MISSING_AUTHENTICATION_DETAILS_ERROR_MSG = "Missing authentication details.";

    public static final String DS_MISSING_USERNAME_ERROR_MSG = "Missing username for authentication.";

    public static final String DS_MISSING_PASSWORD_ERROR_MSG = "Missing password for authentication.";
}
