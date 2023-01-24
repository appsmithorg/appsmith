package com.external.plugins.exceptions;

public class ArangoDBErrorMessages {
    private ArangoDBErrorMessages() {
        //Prevents instantiation
    }
    public static final String MISSING_QUERY_ERROR_MSG = "Missing required parameter: Query.";

    public static final String QUERY_EXECUTION_FAILED_ERROR_MSG = "Your query failed to execute. Please check more information in the error details.";

    public static final String UNEXPECTED_SSL_OPTION_ERROR_MSG = "Appsmith server has found an unexpected SSL option: %s. Please reach " +
            "out to Appsmith customer support to resolve this.";

    public static final String SSL_CONTEXT_FETCHING_ERROR_MSG = "Appsmith server encountered an error when getting ssl context. Please contact Appsmith " +
            "customer support to resolve this.";

    public static final String UNEXPECTED_CA_CERT_OPTION_ERROR_MSG = "Appsmith server has found an unexpected CA certificate option: %s. " +
            "Please reach out to Appsmith customer support to resolve this.";

    public static final String GET_STRUCTURE_ERROR_MSG = "Appsmith server has failed to fetch list of collections from database. Please check " +
            "if the database credentials are valid and/or you have the required permissions.";


    /*
     ************************************************************************************************************************************************
                                        Error messages related to validation of datasource.
     ************************************************************************************************************************************************
     */
    public static final String DS_MISSING_AUTHENTICATION_DETAILS_ERROR_MSG = "Could not find required authentication info. At least one of 'Username', 'Password', " +
            "'Database Name' fields is missing. Please edit the 'Username', 'Password' and " +
            "'Database Name' fields to provide authentication info.";

    public static final String DS_HOSTNAME_MISSING_OR_INVALID_ERROR_MSG = "Could not find host address. Please edit the 'Host Address' field to provide the desired endpoint.";

    public static final String DS_CA_CERT_NOT_FOUND_ERROR_MSG = "Could not find CA certificate. Please provide a CA certificate.";

}
