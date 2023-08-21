package com.appsmith.server.dtos;

import com.appsmith.server.constants.LicenseType;
import lombok.Data;

import java.time.Instant;
import java.util.Map;

/**
 * DTO to store the fields which will be used while creating offline license on Keygen
 * Ref: https://keygen.sh/docs/choosing-a-licensing-model/offline-licenses/
 */
@Data
public class OfflineLicenseDataset {

    LicenseType type;
    // Expiry of the license
    Instant expiry;
    String email;
    // For v1 we are expecting this to be FIXED_EXPIRY but depending upon usage we may want to offer USAGE_BASED
    // plans as well in future
    String contractType;
    Instant createdAt;
    Map<String, Boolean> tenantFeatures;
}
