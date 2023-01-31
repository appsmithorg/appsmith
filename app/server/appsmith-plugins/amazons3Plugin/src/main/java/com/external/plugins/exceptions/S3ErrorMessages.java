package com.external.plugins.exceptions;

public class S3ErrorMessages {
    private S3ErrorMessages() {
        //Prevents instantiation
    }
    public static final String FILE_CONTENT_FETCHING_ERROR_MSG = "Appsmith server has encountered an unexpected error when fetching file " +
            "content from AWS S3 server. Please reach out to Appsmith customer support to resolve this.";

    public static final String CONNECTIVITY_ERROR_MSG = "Appsmith server has encountered an unexpected error when establishing " +
            "connection with AWS S3 server. Please reach out to Appsmith customer support to resolve this.";

    public static final String EMPTY_BUCKET_ERROR_MSG = "Appsmith has encountered an unexpected error when getting bucket name. Please reach out to " +
            "Appsmith customer support to resolve this.";

    public static final String EMPTY_PREFIX_ERROR_MSG = "Appsmith has encountered an unexpected error when getting path prefix. Please reach out to " +
            "Appsmith customer support to resolve this.";

    public static final String UNPARSABLE_CONTENT_ERROR_MSG = "Unable to parse content. Expected to receive an object with `data` and `type`.";

    public static final String UNEXPECTED_ENCODING_IN_FILE_CONTENT_ERROR_MSG = "File content is not base64 encoded. File content needs to be base64 encoded when the " +
            "'File Data Type: Base64/Text' field is selected 'Yes'.";

    public static final String SIGNED_URL_FETCHING_ERROR_MSG = "Appsmith has encountered an unexpected error while fetching url from AmazonS3 after file " +
            "creation. Please reach out to Appsmith customer support to resolve this.";

    public static final String FILE_UPLOAD_INTERRUPTED_ERROR_MSG = "File upload interrupted.";

    public static final String MANDATORY_FIELD_MISSING_ERROR_MSG = "At least one of the mandatory fields in S3 query creation form is empty - 'Action'/" +
            "'Bucket Name'/'File Path'/'Content'. Please fill all the mandatory fields and try " +
            "again.";

    public static final String MANDATORY_PARAMETER_COMMAND_MISSING_ERROR_MSG = "Mandatory parameter 'Command' is missing. Did you forget to select one of the commands" +
            " from the Command dropdown ?";

    public static final String MANDATORY_PARAMETER_BUCKET_MISSING_ERROR_MSG = "Mandatory parameter 'Bucket Name' is missing. Did you forget to edit the 'Bucket " +
            "Name' field in the query form ?";

    public static final String MANDATORY_PARAMETER_CONTENT_MISSING_ERROR_MSG = "Mandatory parameter 'Content' is missing. Did you forget to edit the 'Content' " +
            "field in the query form ?";

    public static final String MANDATORY_PARAMETER_FILE_PATH_MISSING_ERROR_MSG = "Required parameter 'File Path' is missing. Did you forget to edit the 'File Path' field " +
            "in the query form ? This field cannot be left empty with the chosen action.";

    public static final String EXPIRY_DURATION_NOT_A_NUMBER_ERROR_MSG = "Parameter 'Expiry Duration of Signed URL' is NOT a number. Please ensure that the " +
            "input to 'Expiry Duration of Signed URL' field is a valid number - i.e. " +
            "any non-negative integer. Please note that the maximum expiry " +
            "duration supported by Amazon S3 is 7 days i.e. 10080 minutes.";

    public static final String ACTION_LIST_OF_FILE_FETCHING_ERROR_MSG = "Appsmith server has encountered an unexpected error when getting " +
            "list of files from AWS S3 server. Please reach out to Appsmith customer " +
            "support to resolve this.";

    public static final String UNSUPPORTED_ACTION_ERROR_MSG = "It seems that the query has requested an unsupported action: %s" +
            ". Please reach out to Appsmith customer support to resolve this.";

    public static final String LIST_OF_BUCKET_FETCHING_ERROR_MSG = "Appsmith server has failed to fetch list of buckets from database. Please check if \" +\n" +
            "            \"the database credentials are valid and/or you have the required permissions.";

    public static final String S3_SERVICE_PROVIDER_IDENTIFICATION_ERROR_MSG = "Appsmith S3 plugin service has " +
            "failed to identify the S3 service provider type. Please reach out to Appsmith customer support" +
            " to resolve this.";

    public static final String AWS_CREDENTIALS_PARSING_ERROR_MSG = "Appsmith server has encountered an error when parsing AWS credentials from datasource.";

    public static final String INCORRECT_S3_ENDPOINT_URL_ERROR_MSG = "Your S3 endpoint" +
            " URL seems to be incorrect for the selected S3 service provider. Please check your endpoint URL " +
            "and the selected S3 service provider.";

    public static final String FILE_CANNOT_BE_DELETED_ERROR_MSG = "One or more files could not be deleted.";

    public static final String S3_DRIVER_LOADING_ERROR_MSG = "Appsmith server has failed to load AWS S3 driver class. Please reach out to Appsmith " +
            "customer support to resolve this.";

    public static final String LIST_OF_FILE_PARSING_ERROR_MSG = "Appsmith server failed to parse the list of files. Please provide the list of files in the " +
            "correct format e.g. [\"file1\", \"file2\"].";

    public static final String QUERY_EXECUTION_FAILED_ERROR_MSG = "Your S3 query failed to execute. To know more please check the error details.";

    /*
     ************************************************************************************************************************************************
                                    Error messages related to validation of datasource.
     ************************************************************************************************************************************************
     */
    public static final String DS_AT_LEAST_ONE_MANDATORY_PARAMETER_MISSING_ERROR_MSG = "At least one of the mandatory fields in S3 datasource creation form is empty - " +
            "'Access Key'/'Secret Key'/'Region'. Please fill all the mandatory fields and try again.";

    public static final String DS_MANDATORY_PARAMETER_ACCESS_KEY_MISSING_ERROR_MSG = "Mandatory parameter 'Access Key' is empty. Did you forget to edit the 'Access Key' " +
            "field in the datasource creation form ? You need to fill it with your AWS Access " +
            "Key.";

    public static final String DS_MANDATORY_PARAMETER_SECRET_KEY_MISSING_ERROR_MSG = "Mandatory parameter 'Secret Key' is empty. Did you forget to edit the 'Secret Key' " +
            "field in the datasource creation form ? You need to fill it with your AWS Secret " +
            "Key.";

    public static final String DS_S3_SERVICE_PROVIDER_PROPERTIES_FETCHING_ERROR_MSG = "Appsmith has failed to fetch the 'S3 Service Provider' field properties. Please " +
            "reach out to Appsmith customer support to resolve this.";

    public static final String DS_MANDATORY_PARAMETER_ENDPOINT_URL_MISSING_ERROR_MSG = "Required parameter 'Endpoint URL' is empty. Did you forget to edit the 'Endpoint" +
            " URL' field in the datasource creation form ? You need to fill it with " +
            "the endpoint URL of your S3 instance.";


}
