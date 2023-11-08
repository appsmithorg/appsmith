package com.appsmith.server.domains;

import com.appsmith.server.constants.LicenseOrigin;
import com.appsmith.server.constants.LicensePlan;
import com.appsmith.server.constants.LicenseStatus;
import com.appsmith.server.constants.LicenseType;
import com.appsmith.server.dtos.ProductEdition;
import lombok.Data;

import java.time.Instant;

@Data
public class AuditLogLicenseMetadata {
    String licenseId;
    LicensePlan licensePlan;
    LicenseType type;
    Instant expiry;
    LicenseStatus status;
    LicenseOrigin origin;
    ProductEdition productEdition;
    String id;
}
