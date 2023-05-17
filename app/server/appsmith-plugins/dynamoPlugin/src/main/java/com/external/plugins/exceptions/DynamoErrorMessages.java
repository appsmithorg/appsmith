package com.external.plugins.exceptions;

public class DynamoErrorMessages {
    private DynamoErrorMessages() {
        //Prevents instantiation
    }

    public static final String MISSING_ACTION_NAME_ERROR_MSG = "Missing action name (like `ListTables`, `GetItem` etc.).";

    public static final String UNKNOWN_ACTION_NAME_ERROR_MSG = "Unknown action: `%s`. Note that action names are case-sensitive.";

    public static final String QUERY_EXECUTION_FAILED_ERROR_MSG = "Error occurred while executing DynamoDB query.";

    public static final String MISSING_REGION_ERROR_MSG = "Missing region in datasource.";

    public static final String INVALID_ATTRIBUTE_ERROR_MSG = "Invalid attribute/value by name %s";

    public static final String UNKNOWN_TYPE_DURING_DESERIALIZATION_ERROR_MSG = "Unknown value type while deserializing: %s";

    public static final String UNKNOWN_TYPE_FOUND_TO_CONVERT_TO_SDK_STYLE_ERROR_MSG = "Unknown type to convert to SDK style %s";
}
