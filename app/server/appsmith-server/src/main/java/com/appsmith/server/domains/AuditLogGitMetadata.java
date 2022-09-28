package com.appsmith.server.domains;

import lombok.Data;

@Data
public class AuditLogGitMetadata {
    String branch;

    String defaultBranch;
}
