package com.appsmith.external.exceptions.pluginExceptions;

import lombok.Getter;

@Getter
public enum AppsmithPluginErrorCode {
    //All Appsmith error codes for generic plugin errors
    JSON_PROCESSING_ERROR("PE-JSN-4000", "JSON processing error either at serializing or deserializing"),
    SMART_SUBSTITUTION_VALUE_MISSING("PE-SST-5000", "Missing required binding parameter's value"),
    GENERIC_PLUGIN_ERROR("PE-PLG-5000", "A generic plugin error"),
    PLUGIN_GET_STRUCTURE_ERROR("PE-PLG-5001", "Failure in getting datasource structure"),
    PLUGIN_QUERY_TIMEOUT_ERROR("PE-PLG-5002", "Timed out on query execution"),
    PLUGIN_GET_STRUCTURE_TIMEOUT_ERROR("PE-PLG-5003", "Timed out when fetching datasource structure"),
    PLUGIN_DATASOURCE_TEST_GENERIC_ERROR("PE-PLG-5004", "Plugin failed to test with the given configuration"),
    PLUGIN_DATASOURCE_TIMEOUT_ERROR("PE-PLG-5005", "Timed out when connecting to datasource"),
    PLUGIN_AUTHENTICATION_ERROR("PE-PLG-5006", "Datasource authentication error"),
    PLUGIN_IN_MEMORY_FILTERING_ERROR("PE-PLG-5007", "Appsmith in-memory filtering failed"),
    UNSUPPORTED_PLUGIN_OPERATION("PE-PLG-5008", "Unsupported operation on Plugin"),
    INCOMPATIBLE_FILE_FORMAT("PE-PLG-5009", "Incompatible file format"),
    PLUGIN_UQI_WHERE_CONDITION_UNKNOWN("PE-UQI-5000", "Where condition could not be parsed"),
    GENERIC_STALE_CONNECTION("PE-GEN-5004", "Secondary stale connection error"),
    PLUGIN_DATASOURCE_ARGUMENT_ERROR("PE-DSA-5000", "One or more arguments in datasource configuration is invalid"),
    PLUGIN_EXECUTE_ARGUMENT_ERROR("PE-EAE-5000", "Wrong arguments provided")
    ;


    private final String code;
    private final String description;

    AppsmithPluginErrorCode(String code, String description) {
        this.code = code;
        this.description = description;
    }
}