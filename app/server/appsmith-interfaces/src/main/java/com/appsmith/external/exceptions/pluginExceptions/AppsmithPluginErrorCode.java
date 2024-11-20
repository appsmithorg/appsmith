package com.appsmith.external.exceptions.pluginExceptions;

import lombok.Getter;

@Getter
public enum AppsmithPluginErrorCode {
    // All Appsmith error codes for common plugin errors
    JSON_PROCESSING_ERROR("PE-JSN-4000", "JSON processing error either at serializing or deserializing"),
    SMART_SUBSTITUTION_VALUE_MISSING("PE-SST-5000", "Missing required binding parameter's value"),
    GENERIC_PLUGIN_ERROR("PE-PLG-5000", "A generic plugin error"),
    PLUGIN_IN_MEMORY_FILTERING_ERROR("PE-PLG-5002", "Appsmith in-memory filtering failed"),
    INCOMPATIBLE_FILE_FORMAT("PE-PLG-5003", "Incompatible file format"),
    PLUGIN_GET_STRUCTURE_ERROR("PE-DSE-5000", "Failure in getting datasource structure"),
    PLUGIN_GET_STRUCTURE_TIMEOUT_ERROR("PE-DSE-5001", "Timed out when fetching datasource structure"),
    PLUGIN_DATASOURCE_TEST_GENERIC_ERROR("PE-DSE-5002", "Plugin failed to test with the given configuration"),
    PLUGIN_DATASOURCE_ARGUMENT_ERROR("PE-DSE-5003", "One or more arguments in datasource configuration is invalid"),
    PLUGIN_DATASOURCE_TIMEOUT_ERROR("PE-DSE-5004", "Timed out when connecting to datasource"),
    PLUGIN_QUERY_TIMEOUT_ERROR("PE-QRY-5000", "Timed out on query execution"),
    PLUGIN_AUTHENTICATION_ERROR("PE-ATH-5000", "Datasource authentication error"),
    PLUGIN_DATASOURCE_AUTHENTICATION_ERROR("PE-ATH-4000", "Datasource authentication error"),
    PLUGIN_DATASOURCE_ERROR("PE-DSE-4000", "Datasource error"),
    PLUGIN_UQI_WHERE_CONDITION_UNKNOWN("PE-UQI-5000", "Where condition could not be parsed"),
    GENERIC_STALE_CONNECTION("PE-STC-5000", "Secondary stale connection error"),
    PLUGIN_EXECUTE_ARGUMENT_ERROR("PE-ARG-5000", "Wrong arguments provided"),
    PLUGIN_VALIDATE_DATASOURCE_ERROR("PE-DSE-5005", "Failed to validate datasource"),
    PLUGIN_GET_PREVIEW_DATA_ERROR("PE-DSE-5006", "Failed to get preview data"),
    PLUGIN_UNSUPPORTED_OPERATION("PE-DSE-5007", "Unsupported Operation"),
    PLUGIN_RATE_LIMIT_ERROR("PE-DRL-4000", "Rate limit error"),
    PLUGIN_TIMEOUT_OUT_OF_RANGE("PE-QRY-5001", "Timeout value is out of the specified valid range");

    private final String code;
    private final String description;

    AppsmithPluginErrorCode(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
