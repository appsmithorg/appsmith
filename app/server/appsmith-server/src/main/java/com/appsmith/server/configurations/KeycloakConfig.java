package com.appsmith.server.configurations;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class KeycloakConfig {

    @Value("${appsmith.keycloak.admin.username}")
    private String username;

    @Value("${appsmith.keycloak.admin.password}")
    private String password;

    @Value("${appsmith.keycloak.admin.baseUrl}")
    private String baseUrl;

}
