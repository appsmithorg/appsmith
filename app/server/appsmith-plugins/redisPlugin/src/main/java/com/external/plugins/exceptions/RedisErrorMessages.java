package com.external.plugins.exceptions;

public class RedisErrorMessages {
    private RedisErrorMessages() {
        //Prevents instantiation
    }

    public static final String BODY_IS_NULL_OR_EMPTY_ERROR_MSG = "Body is null or empty [%s]";

    public static final String QUERY_PARSING_FAILED_ERROR_MSG = "Appsmith server has failed to parse your Redis query. Are you sure it's" +
            " been formatted correctly.";

    public static final String INVALID_REDIS_COMMAND_ERROR_MSG = "Not a valid Redis command: %s";

    public static final String NO_PONG_RESPONSE_ERROR_MSG = "Expected PONG in response of PING but got %s";

    public static final String QUERY_EXECUTION_FAILED_ERROR_MSG = "Error occurred while executing Redis query. To know more about the error please check the error details.";

    /*
     ************************************************************************************************************************************************
                                        Error messages related to validation of datasource.
     ************************************************************************************************************************************************
     */

    public static final String DS_MISSING_HOST_ADDRESS_ERROR_MSG = "Could not find host address. Please edit the 'Host Address' field to provide the desired " +
            "endpoint.";

    public static final String DS_MISSING_PASSWORD_ERROR_MSG = "Could not find password. Please edit the 'Password' field to provide the password.";
}
