package com.appsmith.server.domains;

import com.appsmith.server.constants.LicenseOrigin;
import com.appsmith.server.constants.LicenseStatus;
import com.appsmith.server.constants.LicenseType;
import com.appsmith.server.domains.ce.LicenseCE;
import lombok.Data;

import java.time.Instant;

@Data
public class License extends LicenseCE {
    Boolean active;
    String id;
    String key;
    LicenseType type;
    Instant expiry;
    LicenseStatus status;
    LicenseOrigin origin;
}
