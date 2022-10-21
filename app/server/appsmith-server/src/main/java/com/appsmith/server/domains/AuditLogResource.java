package com.appsmith.server.domains;

import lombok.Data;

@Data
public class AuditLogResource {
    String id;

    String type;

    String name;

    // For queryExecutionResult for query.executed events
    String executionStatus;
    Long responseTime;
    String responseCode;

    // Type for datasource events
    String datasourceType;

    // Visibility(public or private) for application resources
    String visibility;
}
