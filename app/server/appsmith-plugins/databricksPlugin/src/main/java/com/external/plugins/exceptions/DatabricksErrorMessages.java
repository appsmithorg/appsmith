package com.external.plugins.exceptions;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE) // To prevent instantiation
public class DatabricksErrorMessages {

    public static final String QUERY_EXECUTION_FAILED_ERROR_MSG = "Your query failed to execute. ";

    public static final String QUERY_PREPARATION_FAILED_ERROR_MSG =
            "Query preparation failed while inserting value: %s for binding: {{%s}}. Please check the query again.";

    public static final String ARRAY_PARAMETER_NOT_SUPPORTED_ERROR_MSG =
            "ARRAY parameters are not supported by prepared statements for this plugin. Binding: {{%s}}.";
}
