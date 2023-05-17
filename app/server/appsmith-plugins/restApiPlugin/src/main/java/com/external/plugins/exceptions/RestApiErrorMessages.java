package com.external.plugins.exceptions;

public class RestApiErrorMessages {
    private RestApiErrorMessages() {
        //Prevents instantiation
    }
    public static final String URI_SYNTAX_WRONG_ERROR_MSG = "Invalid value of URI.";
    public static final String INVALID_CONTENT_TYPE_ERROR_MSG = "Invalid value for Content-Type.";
    public static final String NO_HTTP_METHOD_ERROR_MSG = "HTTPMethod must be set.";
    public static final String API_EXECUTION_FAILED_ERROR_MSG = "Your API failed to execute";
}
