package com.appsmith.server.domains;

import lombok.Data;

import java.util.List;

@Data
public class AuditLogGacMetadata {
    String tabUpdated;
    List<AuditLogGacEntityMetadata> entityMetadata;
}
