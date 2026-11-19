package com.appsmith.server.diagnostics.dtos;

public record DiagnosticsField(Object value, String source, String confidence, String availability) {

    public static final String SOURCE_APPLICATION_CONFIG = "application_config";
    public static final String SOURCE_RUNTIME = "runtime";
    public static final String SOURCE_ORCHESTRATOR = "orchestrator";
    public static final String SOURCE_CUSTOMER_SUPPLIED = "customer_supplied";

    public static final String CONFIDENCE_DETECTED = "detected";
    public static final String CONFIDENCE_CONFIGURED = "configured";
    public static final String CONFIDENCE_INFERRED = "inferred";
    public static final String CONFIDENCE_UNKNOWN = "unknown";

    public static DiagnosticsField unknown(String source) {
        return new DiagnosticsField("UNKNOWN", source, "unknown", "unknown");
    }
}
