package com.external.plugins.exceptions;

public class RedshiftErrorMessages {
    private RedshiftErrorMessages() {
        //Prevents instantiation
    }

    public static final String QUERY_PARAMETER_MISSING_ERROR_MSG = "Missing required parameter: Query.";

    public static final String NULL_RESULTSET_ERROR_MSG = "Redshift driver failed to fetch result: resultSet is null.";

    public static final String NULL_METADATA_ERROR_MSG = "metaData is null. Ideally this is never supposed to happen as the Redshift JDBC driver " +
            "does a null check before passing this object. This means that something has gone wrong " +
            "while processing the query result";

    public static final String QUERY_EXECUTION_FAILED_ERROR_MSG = "Error occurred while executing Redshift query. To know more please check the error details.";

    public static final String GET_STRUCTURE_ERROR_MSG = "Appsmith server has failed to fetch the structure of the database. "
            + "Please check if the database credentials are valid and/or you have the required permissions.";

    public static final String JDBC_DRIVER_LOADING_ERROR_MSG = "Error loading Redshift JDBC Driver class.";

    public static final String CONNECTION_POOL_CREATION_FAILED_ERROR_MSG = "Exception occurred while creating connection pool. One or more arguments in the datasource configuration may be invalid. Please check your datasource configuration.";
}
