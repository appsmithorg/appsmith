package com.external.plugins.exceptions;

public class MySQLErrorMessages {
    private MySQLErrorMessages() {
        //Prevents instantiation
    }
    public static final String MISSING_PARAMETER_QUERY_ERROR_MSG = "Missing required parameter: Query.";

    public static final String IS_KEYWORD_NOT_SUPPORTED_IN_PS_ERROR_MSG = "Appsmith currently does not support the IS keyword with the prepared statement " +
            "setting turned ON. Please re-write your SQL query without the IS keyword";

    public static final String GET_STRUCTURE_ERROR_MSG = "The Appsmith server has failed to fetch the structure of your schema.";

    public static final String QUERY_EXECUTION_FAILED_ERROR_MSG = "Your MySQL query failed to execute.";

    public static final String UNEXPECTED_SSL_OPTION_ERROR_MSG = "The Appsmith server has found an unexpected SSL option: %s.";

    public static final String SSL_CONFIGURATION_FETCHING_ERROR_MSG = "The Appsmith server has failed to fetch SSL configuration from datasource configuration form.";


    /*
     ************************************************************************************************************************************************
                                        Error messages related to validation of datasource.
     ************************************************************************************************************************************************
    */
    public static final String DS_MISSING_ENDPOINT_ERROR_MSG = "Missing endpoint and url";
    public static final String DS_MISSING_HOSTNAME_ERROR_MSG = "Host value cannot be empty";
    public static final String DS_INVALID_HOSTNAME_ERROR_MSG = "Host value cannot contain `/` or `:` characters. Found `%s`.";
    public static final String DS_MISSING_AUTHENTICATION_DETAILS_ERROR_MSG = "Missing authentication details.";
    public static final String DS_MISSING_USERNAME_ERROR_MSG = "Missing username for authentication.";
    public static final String DS_MISSING_PASSWORD_ERROR_MSG = "Missing password for authentication.";
    public static final String DS_MISSING_DATABASE_NAME_ERROR_MSG = "Missing database name.";
    public static final String DS_SSL_CONFIGURATION_FETCHING_FAILED_ERROR_MSG = "Appsmith server has failed to fetch SSL configuration from datasource configuration form. " +
            "Please reach out to Appsmith customer support to resolve this.";



}
