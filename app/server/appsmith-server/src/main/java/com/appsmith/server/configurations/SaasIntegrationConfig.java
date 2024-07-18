package com.appsmith.server.configurations;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;

@Getter
public class SaasIntegrationConfig {
    @Value("${appsmith.saas.url}")
    public String appsmithSaasUrl;

    @Value("${appsmith.saas.key}")
    public String appsmithSaasKey;
}
