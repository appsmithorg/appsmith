package com.appsmith.server.configurations;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.web.reactive.context.ReactiveWebApplicationContext;
import org.springframework.test.web.reactive.server.WebTestClient;

import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

/**
 * APP-14994: Verify that endpoints which previously leaked sensitive instance metadata are now properly
 * guarded or sanitised for unauthenticated callers.
 */
@SpringBootTest
public class AuthGuardTest {

    private WebTestClient webTestClient;

    @BeforeEach
    void setup(ReactiveWebApplicationContext context) {
        webTestClient = WebTestClient.bindToApplicationContext(context)
                .apply(springSecurity())
                .build();
    }

    /**
     * /api/v1/users/features must now require authentication (APP-14994).
     * Before the fix, this endpoint was in the permitAll list and would return feature flags
     * to any unauthenticated caller, potentially revealing which paid/enterprise features are enabled.
     */
    @Test
    void featureFlagsEndpoint_unauthenticated_returns401() {
        webTestClient
                .get()
                .uri("/api/v1/users/features")
                .exchange()
                .expectStatus()
                .isUnauthorized();
    }

    /**
     * /api/v1/tenants/current must remain accessible without authentication (the login page uses it
     * to discover which auth providers are available), but the response must not include
     * instance-identifying metadata (APP-14994).
     */
    @Test
    void tenantCurrentEndpoint_unauthenticated_suppressesSensitiveFields() {
        webTestClient
                .get()
                .uri("/api/v1/tenants/current")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody()
                .jsonPath("$.data.instanceId")
                .doesNotExist()
                .jsonPath("$.data.adminEmailDomainHash")
                .doesNotExist();
    }
}
