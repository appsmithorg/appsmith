package com.appsmith.server.domains;

import com.appsmith.server.constants.LicenseOrigin;
import com.appsmith.server.constants.LicenseStatus;
import com.appsmith.server.constants.LicenseType;
import com.appsmith.server.domains.ce.LicenseCE;
import lombok.Data;
import org.springframework.data.annotation.Transient;

import java.time.Instant;
import java.util.Map;

@Data
public class License extends LicenseCE {
    Boolean active;
    String id;
    String key;
    LicenseType type;
    Instant expiry;
    LicenseStatus status;
    LicenseOrigin origin;

    @Transient
    Map<String, Boolean> tenantFeatures;
}
