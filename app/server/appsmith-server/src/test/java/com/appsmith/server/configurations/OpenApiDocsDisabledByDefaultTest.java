package com.appsmith.server.configurations;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.web.reactive.context.ReactiveWebApplicationContext;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.web.reactive.server.WebTestClient;

import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

/**
 * APP-16030 / GHSA-v6jh-fx3m-7xhw: the OpenAPI document and Swagger UI stay unregistered under the default
 * configuration ({@code springdoc.api-docs.enabled=false}, {@code springdoc.swagger-ui.enabled=false} in
 * {@code application-ce.properties}), even for an authenticated user.
 *
 * {@link OpenApiDocsAuthTest} covers "enabled + unauthenticated is 401" and {@link OpenApiDocumentGenerationTest}
 * covers "enabled + authenticated is 200". This class pins the third leg so a springdoc upgrade that renamed
 * or re-defaulted the property would fail the build instead of silently exposing the routes.
 *
 * No {@code @TestPropertySource} on purpose: this shares the default cached test context.
 */
@SpringBootTest
public class OpenApiDocsDisabledByDefaultTest {

    private WebTestClient webTestClient;

    @BeforeEach
    void setup(ReactiveWebApplicationContext context) {
        webTestClient = WebTestClient.bindToApplicationContext(context)
                .apply(springSecurity())
                .build();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void openApiDocsEndpoint_disabledByDefault_returns404ForAuthenticatedUser() {
        webTestClient.get().uri("/v3/docs").exchange().expectStatus().isNotFound();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void swaggerUiEndpoint_disabledByDefault_returns404ForAuthenticatedUser() {
        webTestClient.get().uri("/v3/swagger").exchange().expectStatus().isNotFound();
    }
}
