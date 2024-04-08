package com.external.plugins.exceptions;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE) // To prevent instantiation
public class DatabricksErrorMessages {

    public static final String QUERY_EXECUTION_FAILED_ERROR_MSG = "Your query failed to execute. ";
}
