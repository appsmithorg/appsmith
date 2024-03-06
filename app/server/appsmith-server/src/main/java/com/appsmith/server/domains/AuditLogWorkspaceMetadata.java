package com.appsmith.server.domains;

import lombok.Data;

@Data
public class AuditLogWorkspaceMetadata {

    String id;

    String name;

    // For storing destination workspace details for application.forked events
    AuditLogDestinationWorkspaceMetadata destination;
}
