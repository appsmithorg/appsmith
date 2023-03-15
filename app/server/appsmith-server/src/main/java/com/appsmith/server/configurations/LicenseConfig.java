package com.appsmith.server.configurations;

import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
public class LicenseConfig {
    @Value("${appsmith.license.key}")
    private String licenseKey;

    // Ed25519 128-bit Verify Key from License service provider
    @Value("${keygen.license.verify.key:}")
    private String publicVerificationKey;

    @Value("${is.air.gap.instance:false}")
    private boolean isAirGapInstance;
}
