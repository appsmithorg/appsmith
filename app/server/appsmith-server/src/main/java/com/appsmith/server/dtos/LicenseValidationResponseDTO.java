package com.appsmith.server.dtos;

import com.appsmith.server.constants.LicenseOrigin;
import com.appsmith.server.constants.LicensePlan;
import com.appsmith.server.constants.LicenseStatus;
import com.appsmith.server.constants.LicenseType;
import com.appsmith.server.domains.SubscriptionDetails;
import lombok.Data;

import java.time.Instant;

@Data
public class LicenseValidationResponseDTO {
    private String licenseId;
    private String instanceId;
    private LicenseType licenseType;
    private LicenseStatus licenseStatus;
    private LicenseOrigin licenseOrigin;
    private LicensePlan licensePlan;
    private ProductEdition productEdition;
    private Instant expiry;
    private boolean isValid;
    private SubscriptionDetails subscriptionDetails;
}
