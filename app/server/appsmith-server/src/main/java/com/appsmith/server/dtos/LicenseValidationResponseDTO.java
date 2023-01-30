package com.appsmith.server.dtos;

import com.appsmith.server.constants.LicenseStatus;
import com.appsmith.server.constants.LicenseType;
import lombok.Data;

import java.time.Instant;

@Data
public class LicenseValidationResponseDTO {

    private String instanceId;
    private LicenseType licenseType;
    private LicenseStatus licenseStatus;
    private Instant expiry;
    private boolean isValid;
}
