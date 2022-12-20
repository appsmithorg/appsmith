package com.appsmith.server.domains;

import lombok.Data;

import java.time.Instant;

@Data
public class AuditLogMetadata {
    String ipAddress;

    String appsmithVersion;

    Instant createdAt;
}
