package com.external.plugins.exceptions;

public class ElasticSearchErrorMessages {
    private ElasticSearchErrorMessages() {
        //Prevents instantiation
    }

    public static final String ARRAY_TO_ND_JSON_ARRAY_CONVERSION_ERROR_MSG = "Error occurred while converting array to ND-JSON";

    public static final String QUERY_EXECUTION_FAILED_ERROR_MSG = "Error occurred while executing Elasticsearch query.";

    public static final String NOT_FOUND_ERROR_MSG = "Either your host URL is invalid or the page you are trying to access does not exist";

    public static final String UNAUTHORIZED_ERROR_MSG = "Your username or password is not correct";

     /*
     ************************************************************************************************************************************************
                                        Error messages related to validation of datasource.
     ************************************************************************************************************************************************
     */

    public static final String DS_INVALID_HOST_ERROR_MSG = "Invalid host provided. It should be of the form http(s)://your-es-url.com";

    public static final String DS_NO_ENDPOINT_ERROR_MSG = "No endpoint provided. Please provide a host:port where ElasticSearch is reachable.";

    public static final String DS_MISSING_HOST_ERROR_MSG = "Missing host for endpoint";
}
