package com.appsmith.server.domains;

import lombok.Data;

@Data
public class AuditLogWorkpsaceMetadata {

    String id;

    String name;

    // For storing destination workspace details for application.forked events
    AuditLogDestinationWorkspaceMetadata destination;
}
