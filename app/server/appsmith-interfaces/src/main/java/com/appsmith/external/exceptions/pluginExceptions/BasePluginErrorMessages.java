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
    public static final String DS_MISSING_PORT_ERROR_MSG = "Missing database port number for authentication.";
    public static final String SSH_CONNECTION_FAILED_ERROR_MSG =
            "Failed to create SSH connection. Please check your datasource" + " configuration.";
    public static final String DS_MISSING_SSH_USERNAME_ERROR_MSG = "Missing SSH username for authentication.";
    public static final String DS_MISSING_SSH_KEY_ERROR_MSG = "Missing SSH key for authentication.";
    public static final String DS_MISSING_SSH_HOSTNAME_ERROR_MSG = "SSH host value cannot be empty";
    public static final String DS_INVALID_SSH_HOSTNAME_ERROR_MSG =
            "SSH host value cannot contain `/` or `:` " + "characters.";
}
