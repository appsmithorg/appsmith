package com.appsmith.server.dtos;

import lombok.Data;

@Data
public class LicenseValidationRequestDTO {
    private String licenseKey;
    private String instanceId;
    private String tenantId;
    private String appsmithVersion;
}

