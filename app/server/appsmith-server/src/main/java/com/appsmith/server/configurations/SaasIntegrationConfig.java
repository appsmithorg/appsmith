package com.appsmith.server.configurations;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class SaasIntegrationConfig {
    @Value("${appsmith.saas.url}")
    private String appsmithSaasUrl;

    @Value("${appsmith.saas.key}")
    private String appsmithSaasKey;

    public String getAppsmithSaasUrl() {
        return appsmithSaasUrl;
    }

    public String getAppsmithSaasKey() {
        return appsmithSaasKey;
    }
}
