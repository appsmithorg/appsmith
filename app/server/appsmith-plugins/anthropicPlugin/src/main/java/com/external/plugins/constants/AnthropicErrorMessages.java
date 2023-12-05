package com.external.plugins.constants;

public class AnthropicErrorMessages {
    public static final String STRING_APPENDER = "%s %s";
    public static final String EXECUTION_FAILURE = "Query failed to execute because";
    public static final String QUERY_FAILED_TO_EXECUTE = "Your query failed to execute";
    public static final String MODEL_NOT_SELECTED = "model hasn't been selected. Please select a model";
    public static final String QUERY_NOT_CONFIGURED = "query is not configured.";
    public static final String BAD_TEMPERATURE_CONFIGURATION =
            "temperature value doesn't conform to the contract. Please enter a real number between 0 and 2";
    public static final String BAD_MAX_TOKEN_CONFIGURATION = "max token value is not an integer number";
    public static final String INCORRECT_ROLE_VALUE =
            "role value is incorrect. Please choose a role value which conforms to the OpenAI contract";
    public static final String INCORRECT_MESSAGE_FORMAT =
            "messages object is not correctly configured. Please provide a list of messages";
    public static final String EMPTY_API_KEY = "API Key should not be empty, Please add an API Key";
    public static final String INVALID_API_KEY =
            "Invalid authentication credentials provided in datasource configurations";
}
