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
}
