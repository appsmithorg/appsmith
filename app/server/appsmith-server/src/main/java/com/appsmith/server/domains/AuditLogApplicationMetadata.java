package com.appsmith.server.domains;

import lombok.Data;

@Data
public class AuditLogApplicationMetadata {
    String id;

    String name;

    String visibility;

    AuditLogGitMetadata git;

    String mode;
}
