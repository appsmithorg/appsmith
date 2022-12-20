package com.appsmith.server.domains;

import lombok.Data;

@Data
public class AuditLogAuthenticationMetadata {
    String mode;

    String action;
}
