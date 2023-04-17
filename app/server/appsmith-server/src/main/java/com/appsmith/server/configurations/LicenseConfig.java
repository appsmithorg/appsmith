package com.appsmith.server.configurations;

import com.appsmith.server.services.ConfigService;
import com.appsmith.server.solutions.LicenseValidator;
import com.appsmith.server.solutions.OfflineLicenseValidatorImpl;
import com.appsmith.server.solutions.OnlineLicenseValidatorImpl;
import com.appsmith.server.solutions.ReleaseNotesService;
import com.google.gson.Gson;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
public class LicenseConfig {

    @Autowired
    Gson gson;

    @Autowired
    CloudServicesConfig cloudServicesConfig;

    @Autowired
    ReleaseNotesService releaseNotesService;

    @Autowired
    ConfigService configService;
    @Autowired
    AirgapInstanceConfig airgapInstanceConfig;

    @Value("${appsmith.license.key}")
    private String licenseKey;

    // Ed25519 128-bit Verify Key from License service provider
    @Value("${keygen.license.verify.key:}")
    private String publicVerificationKey;

    @Bean
    public LicenseValidator licenseValidatorInstance() {
        return airgapInstanceConfig.isAirgapEnabled()
            ? new OfflineLicenseValidatorImpl(this, gson)
            : new OnlineLicenseValidatorImpl(cloudServicesConfig, configService, releaseNotesService);
    }
}
