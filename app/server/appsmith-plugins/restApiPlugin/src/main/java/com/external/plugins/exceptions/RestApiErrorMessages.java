package com.external.plugins.exceptions;

public class RestApiErrorMessages {
    private RestApiErrorMessages() {
        //Prevents instantiation
    }
    public static final String URI_SYNTAX_WRONG_ERROR_MSG = "URI is invalid. Please rectify the URI and try again.";
    public static final String INVALID_CONTENT_TYPE_ERROR_MSG = "Invalid value for Content-Type.";
    public static final String NO_HTTP_METHOD_ERROR_MSG = "HTTPMethod must be set.";
    public static final String API_EXECUTION_FAILED_ERROR_MSG = "An error occurred during the execution of your API. Please check the error logs for more details.";
}
