package com.external.plugins.exceptions;

public class MongoPluginErrorMessages {
    private MongoPluginErrorMessages() {
        //Prevents instantiation
    }
    public static final String QUERY_EXECUTION_FAILED_ERROR_MSG = "Your Mongo query failed to execute.";

    public static final String CONNECTION_STRING_PARSING_FAILED_ERROR_MSG = "The Appsmith server has failed to parse the Mongo connection string URI.";

    public static final String NO_CONNECTION_STRING_URI_ERROR_MSG = "Could not find any Mongo connection string URI.";

    public static final String UNEXPECTED_SSL_OPTION_ERROR_MSG = "The Appsmith server has found an unexpected SSL option: %s. Please reach out to" +
            " Appsmith customer support to resolve this.";

    public static final String UNPARSABLE_FIELDNAME_ERROR_MSG =  "%s has an invalid JSON format.";

    public static final String NO_VALID_MONGO_COMMAND_FOUND_ERROR_MSG = "No valid mongo command found.";

    public static final String FIELD_WITH_NO_CONFIGURATION_ERROR_MSG = "Try again after configuring the fields : %s";

    public static final String PIPELINE_ARRAY_PARSING_FAILED_ERROR_MSG =  "Array of Pipelines could not be parsed into expected Mongo BSON Array format.";

    public static final String PIPELINE_STAGE_NOT_VALID_ERROR_MSG = "Pipeline stage is not a valid JSON object.";

    public static final String DOCUMENTS_NOT_PARSABLE_INTO_JSON_ARRAY_ERROR_MSG = "Documents could not be parsed into expected JSON Array format.";

    public static final String UNSUPPORTED_OPERATION_PARSE_COMMAND_ERROR_MSG = "Unsupported Operation : All mongo commands must implement parseCommand.";

    public static final String UNSUPPORTED_OPERATION_GENERATE_TEMPLATE_ERROR_MSG = "Unsupported Operation : All mongo commands must implement generateTemplate.";

    public static final String UNSUPPORTED_OPERATION_GET_RAW_QUERY_ERROR_MSG = "Unsupported Operation : All mongo commands must implement getRawQuery.";

    public static final String QUERY_INVALID_ERROR_MSG = "Your query is invalid";

    /*
     ************************************************************************************************************************************************
                                        Error messages related to validation of datasource.
     ************************************************************************************************************************************************
     */

    public static final String DS_CREATION_FAILED_ERROR_MSG = "One or more arguments in the datasource configuration is invalid.";

    public static final String DS_TIMEOUT_ERROR_MSG = "Connection timed out. Please check if the datasource configuration fields have " +
            "been filled correctly.";

    public static final String DS_GET_STRUCTURE_ERROR_MSG = "Appsmith has failed to get database structure. Please provide read permission on" +
            " the database to fix this.";

    public static final String DS_DEFAULT_DATABASE_NAME_INVALID_ERROR_MSG = "Default Database Name is invalid, no database found with this name.";

    public static final String DS_EMPTY_CONNECTION_URI_ERROR_MSG = "'Mongo Connection String URI' field is empty. Please edit the 'Mongo Connection " +
            "URI' field to provide a connection uri to connect with.";

    public static final String DS_INVALID_CONNECTION_STRING_URI_ERROR_MSG = "Mongo Connection String URI does not seem to be in the correct format. Please " +
            "check the URI once.";

    public static final String DS_MISSING_DEFAULT_DATABASE_NAME_ERROR_MSG = "Missing default database name.";
    public static final String DS_INVALID_AUTH_DATABASE_NAME = "Authentication Database Name is invalid, no database found with this name.";
    public static final String DS_MISSING_ENDPOINTS_ERROR_MSG = "Missing endpoint(s).";
    public static final String DS_NO_PORT_EXPECTED_IN_REPLICA_SET_CONNECTION_ERROR_MSG = "REPLICA_SET connections should not be given a port." +
            " If you are trying to specify all the shards, please add more than one.";

    public static final String DS_USING_URI_BUT_EXPECTED_FORM_FIELDS_ERROR_MSG = "It seems that you are trying to use a mongo connection string URI. Please " +
            "extract relevant fields and fill the form with extracted values. For " +
            "details, please check out the Appsmith's documentation for Mongo database. " +
            "Alternatively, you may use 'Import from Connection String URI' option from the " +
            "dropdown labelled 'Use Mongo Connection String URI' to use the URI connection string" +
            " directly.";

    public static final String DS_INVALID_AUTH_TYPE_ERROR_MSG = "Invalid authType. Must be one of %s";

    public static final String DS_SSL_CONFIGURATION_FETCHING_ERROR_MSG = "Appsmith server has failed to fetch SSL configuration from datasource configuration " +
            "form. Please reach out to Appsmith customer support to resolve this.";
}
