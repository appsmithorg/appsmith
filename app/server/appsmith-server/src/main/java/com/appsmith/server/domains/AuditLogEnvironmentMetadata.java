package com.appsmith.server.domains;

import lombok.Data;
import lombok.NonNull;

@Data
public class AuditLogEnvironmentMetadata {
    @NonNull String id;

    @NonNull String name;
}
