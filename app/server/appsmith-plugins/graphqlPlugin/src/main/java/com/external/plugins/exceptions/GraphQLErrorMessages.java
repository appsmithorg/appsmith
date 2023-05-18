package com.external.plugins.exceptions;

public class GraphQLErrorMessages {
    private GraphQLErrorMessages() {
        //Prevents instantiation
    }
    public static final String URI_SYNTAX_WRONG_ERROR_MSG = "URI is invalid. Please rectify the URI and try again.";
    public static final String INVALID_CONTENT_TYPE_ERROR_MSG = "Invalid value for Content-Type.";
    public static final String NO_HTTP_METHOD_ERROR_MSG = "HTTPMethod must be set.";
    public static final String QUERY_EXECUTION_FAILED_ERROR_MSG = "An error occurred during the execution of your GraphQL query. Please check the error logs for more details.";
    public static final String UNEXPECTED_HTTP_METHOD_ERROR_MSG = "Appsmith server has found an unexpected HTTP method configured with the GraphQL " +
            "plugin query: %s";
}
