package com.external.plugins.exceptions;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE) // To prevent instantiation
public class DatabricksErrorMessages {

    public static final String INVALID_JDBC_URL_ERROR_MSG = "The JDBC URL must use the jdbc:databricks:// protocol.";
    public static final String QUERY_EXECUTION_FAILED_ERROR_MSG = "Your query failed to execute. ";
}
