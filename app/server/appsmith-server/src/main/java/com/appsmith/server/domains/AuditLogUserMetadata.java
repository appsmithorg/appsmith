package com.appsmith.server.domains;

import lombok.Data;

@Data
public class AuditLogUserMetadata {
    String id;

    String email;

    String name;

    String ipAddress;
}
