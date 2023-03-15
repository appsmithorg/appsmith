package com.appsmith.server.domains;

import com.appsmith.server.constants.LicenseType;
import lombok.Data;

import java.time.Instant;

@Data
public class OfflineLicenseDataset {
    // AIR_GAP
    String origin;
    // PAID/TRIAL
    LicenseType type;
    // As per the contract
    Instant expiry;
    String email;
    // USAGE_BASED(v1.1)/FIXED_EXPIRY
    String contractType;
    Instant createdAt;
}
