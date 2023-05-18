package com.external.plugins.exceptions;

public class SaaSErrorMessages {
    private SaaSErrorMessages() {
        //Prevents instantiation
    }

    public static final String MISSING_DATASOURCE_TEMPLATE_NAME_ERROR_MSG = "Missing template name for datasource";

    public static final String MISSING_ACTION_TEMPLATE_NAME_ERROR_MSG = "Missing template name for action";

    public static final String API_EXECUTION_FAILED_ERROR_MSG = "Error occurred while invoking API. To know more please check the error details.";

    public static final String MAX_REDIRECT_LIMIT_REACHED_ERROR_MSG = "Exceeded the HTTP redirect limits of %s";

    public static final String URI_SYNTAX_WRONG_ERROR_MSG = "URI is invalid. Please rectify the URI and try again.";
}
