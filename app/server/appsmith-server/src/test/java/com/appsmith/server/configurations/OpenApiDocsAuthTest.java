package com.appsmith.server.configurations;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.web.reactive.context.ReactiveWebApplicationContext;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;

import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

/**
 * GHSA-v6jh-fx3m-7xhw: Verify that OpenAPI documentation endpoints
 * are not accessible without authentication.
 *
 * Springdoc is disabled by default in production. We re-enable it here so
 * the endpoints register and we can assert the security layer rejects
 * unauthenticated requests (401) rather than simply not finding them (404).
 */
@SpringBootTest
@TestPropertySource(properties = {"springdoc.api-docs.enabled=true", "springdoc.swagger-ui.enabled=true"})
public class OpenApiDocsAuthTest {

    private WebTestClient webTestClient;

    @BeforeEach
    void setup(ReactiveWebApplicationContext context) {
        webTestClient = WebTestClient.bindToApplicationContext(context)
                .apply(springSecurity())
                .build();
    }

    @Test
    void openApiDocsEndpoint_unauthenticated_returns401() {
        webTestClient.get().uri("/v3/docs").exchange().expectStatus().isUnauthorized();
    }

    @Test
    void swaggerUiEndpoint_unauthenticated_returns401() {
        webTestClient.get().uri("/v3/swagger-ui.html").exchange().expectStatus().isUnauthorized();
    }
}
