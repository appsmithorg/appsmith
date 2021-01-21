package com.appsmith.server.configurations;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class CloudServicesConfig {
    @Value("${appsmith.cloud_services.base_url}")
    String baseUrl;

    @Value("${appsmith.cloud_services.username}")
    private String username;

    @Value("${appsmith.cloud_services.password}")
    private String password;
}
