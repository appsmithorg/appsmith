package com.appsmith.server.configurations;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class MarketplaceConfig {
    @Value("${marketplace.base-url}")
    String baseUrl;

    @Value("${marketplace.username}")
    private String username;

    @Value("${marketplace.password}")
    private String password;
}
