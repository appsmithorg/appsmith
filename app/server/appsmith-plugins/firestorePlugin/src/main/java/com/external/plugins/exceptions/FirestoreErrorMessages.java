package com.external.plugins.exceptions;

public class FirestoreErrorMessages {
    private FirestoreErrorMessages() {
        //Prevents instantiation
    }

    public static final String MANDATORY_PARAM_COMMAND_MISSING_ERROR_MSG = "Mandatory parameter 'Command' is missing. Did you forget to select one of the commands" +
            " from the Command dropdown ?";

    public static final String MISSING_FIRESTORE_METHOD_ERROR_MSG = "Missing Firestore method.";

    public static final String EMPTY_DOC_OR_COLLECTION_PATH_ERROR_MSG = "Document/Collection path cannot be empty";

    public static final String FIRESTORE_PATH_INVALID_STARTING_CHAR_ERROR_MSG = "Firestore paths should not begin or end with `/` character.";

    public static final String QUERY_CONVERSION_TO_HASHMAP_FAILED_ERROR_MSG = "Error occurred while preparing your query to run. Please check the error details for more information.";

    public static final String NON_EMPTY_BODY_REQUIRED_FOR_METHOD_ERROR_MSG = "The method %s needs a non-empty body to work.";

    public static final String NON_EMPTY_FIELD_REQUIRED_FOR_METHOD_ERROR_MSG = "The method %s needs at least one of the following " +
            "fields to be non-empty: 'Timestamp Value Path', 'Delete Key Value " +
            "Pair Path', 'Body'";

    public static final String QUERY_EXECUTION_FAILED_ERROR_MSG = "Firestore query has failed to execute. To know more please check the error details.";

    public static final String UNEXPECTED_PROPERTY_DELETE_KEY_PATH_ERROR_MSG = "Appsmith has found an unexpected query form property - 'Delete Key Value Pair Path'. Please " +
            "reach out to Appsmith customer support to resolve this.";

    public static final String UNEXPECTED_PROPERTY_TIMESTAMP_ERROR_MSG ="Appsmith has found an unexpected query form property - 'Timestamp Value Path'. Please reach " +
            "out to Appsmith customer support to resolve this.";

    public static final String FAILED_TO_PARSE_DELETE_KEY_PATH_ERROR_MSG = "Appsmith failed to parse the query editor form field 'Delete Key Value Pair Path'. " +
            "Please check out Appsmith's documentation to find the correct syntax.";

    public static final String FAILED_TO_PARSE_TIMESTAMP_VALUE_PATH_ERROR_MSG = "Appsmith failed to parse the query editor form field 'Timestamp Value Path'. " +
            "Please check out Appsmith's documentation to find the correct syntax.";

    public static final String INVALID_DOCUMENT_LEVEL_METHOD_ERROR_MSG = "Invalid document-level method %s";

    public static final String ACTUAL_METHOD_GETTING_ERROR_MSG = "Error getting actual method for operation %s";

    public static final String UNSUPPORTED_COLLECTION_METHOD_ERROR_MSG = "Unsupported collection-level command: %s";

    public static final String METHOD_INVOCATION_FAILED_ERROR_MSG = "Method invocation failed. Please check the error details for more information.";

    public static final String FAILURE_IN_GETTING_RESULT_FROM_FUTURE_ERROR_MSG = "Error occurred while getting the response. To know more please check the error details.";

    public static final String PAGINATION_WITHOUT_SPECIFYING_ORDERING_ERROR_MSG = "Cannot do pagination without specifying an ordering.";

    public static final String OBJECT_SERIALIZATION_FAILED_ERROR_MSG = "Unable to serialize object of type %s.";

    public static final String WHERE_CONDITIONAL_NULL_QUERY_ERROR_MSG = "Appsmith server has found null query object when applying where conditional on Firestore " +
            "query. Please contact Appsmith's customer support to resolve this.";

    public static final String WHERE_CONDITION_INVALID_OPERATOR_ERROR_MSG = "Appsmith server has encountered an invalid operator for Firestore query's where conditional." +
            " Please contact Appsmith's customer support to resolve this.";

    public static final String WHERE_CONDITION_UNPARSABLE_AS_JSON_LIST_ERROR_MSG = "Unable to parse condition value as a JSON list.";

    /*
     ************************************************************************************************************************************************
                                        Error messages related to validation of datasource.
     ************************************************************************************************************************************************
     */

    public static final String DS_VALIDATION_FAILED_FOR_SERVICE_ACC_CREDENTIALS_ERROR_MSG = "Validation failed for field 'Service Account Credentials'. Please check the " +
            "value provided in the 'Service Account Credentials' field.";

    public static final String DS_MISSING_PROJECT_ID_AND_CLIENTJSON_ERROR_MSG = "Missing ProjectID and ClientJSON in datasource.";

    public static final String DS_MISSING_PROJECT_ID_ERROR_MSG = "Missing ProjectID in datasource.";

    public static final String DS_MISSING_CLIENTJSON_ERROR_MSG = "Missing ClientJSON in datasource.";

    public static final String DS_MISSING_FIRESTORE_URL_ERROR_MSG = "Missing Firestore URL.";
}
