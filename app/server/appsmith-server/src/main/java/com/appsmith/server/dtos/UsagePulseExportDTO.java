package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class UsagePulseExportDTO {
    String user;
    String tenantId;
    Boolean viewMode;
    Boolean isAnonymousUser;
    Instant createdAt;
}