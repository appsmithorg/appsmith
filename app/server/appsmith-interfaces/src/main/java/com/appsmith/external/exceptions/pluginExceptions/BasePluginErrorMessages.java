package com.appsmith.external.exceptions.pluginExceptions;

public abstract class BasePluginErrorMessages {
    public static final String CONNECTION_INVALID_ERROR_MSG = "Connection object is invalid.";
    public static final String CONNECTION_NULL_ERROR_MSG = "Connection object is null.";
    public static final String CONNECTION_CLOSED_ERROR_MSG = "Connection object is closed.";
    public static final String CONNECTION_POOL_NULL_ERROR_MSG = "Connection pool is null.";
    public static final String CONNECTION_POOL_CLOSED_ERROR_MSG = "Connection pool is closed.";
    public static final String CONNECTION_POOL_NOT_RUNNING_ERROR_MSG = "Connection pool is not running.";
    public static final String UNKNOWN_CONNECTION_ERROR_MSG =
            "Unknown connection error. Please reach out to Appsmith " + "customer support to resolve this.";
    public static final String JDBC_DRIVER_LOADING_ERROR_MSG = "Error loading JDBC Driver class.";
}
