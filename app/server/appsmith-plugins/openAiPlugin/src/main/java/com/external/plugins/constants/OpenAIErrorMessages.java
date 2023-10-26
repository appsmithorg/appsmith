package com.external.plugins.constants;

public class OpenAIErrorMessages {

    public static final String STRING_APPENDER = "%s %s";
    public static final String EXECUTION_FAILURE = "Query failed to execute because";
    public static final String MODEL_NOT_SELECTED = "model hasn't been selected, Please select model";
    public static final String INPUT_NOT_CONFIGURED = "embeddings input has not been configured properly";
    public static final String ENCODING_CONVERSION_ERROR = "embeddinngs's encoding format is not configured properly";
    public static final String QUERY_NOT_CONFIGURED = "query is not configured.";
    public static final String BAD_TEMPERATURE_CONFIGURATION =
            "temperature value doesn't conform to contract, please enter a real number between 0 and 2";
    public static final String INCORRECT_ROLE_VALUE =
            "role value is incorrect, Choose a role value which conforms to open ai contract";
    public static final String INCORRECT_MESSAGE_FORMAT =
            "messages object is not correctly configured, please provide a list of messages";
}
