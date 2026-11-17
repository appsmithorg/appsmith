package com.appsmith.server.configurations;

import com.appsmith.server.constants.Url;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.web.reactive.context.ReactiveWebApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

/**
 * APP-16030: generate the OpenAPI document for the server's HTTP API as part of the default test run and
 * pin its basic shape.
 *
 * Runtime defaults keep springdoc disabled ({@code springdoc.api-docs.enabled=false}, see
 * GHSA-v6jh-fx3m-7xhw, {@link OpenApiDocsAuthTest} and {@link OpenApiDocsDisabledByDefaultTest}). This test
 * enables the document endpoint for the test context only, fetches it as an authenticated user and writes
 * it to {@code target/openapi/} so CI can publish it as a build artifact without changing what a running
 * instance exposes. It is also the compatibility check for the springdoc dependency: a springdoc release
 * that does not match the Spring Boot line compiles fine but fails here at generation time.
 *
 * The property set matches {@link OpenApiDocsAuthTest} exactly so both classes share one cached Spring
 * test context.
 */
@SpringBootTest
@TestPropertySource(properties = {"springdoc.api-docs.enabled=true", "springdoc.swagger-ui.enabled=true"})
class OpenApiDocumentGenerationTest {

    /** Relative to the surefire working directory, which is the module directory ({@code appsmith-server}). */
    private static final Path OUTPUT_DIR = Path.of("target", "openapi");

    private static final String OUTPUT_FILE_NAME = "appsmith-server-openapi.json";

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private WebTestClient webTestClient;

    @BeforeEach
    void setup(ReactiveWebApplicationContext context) {
        webTestClient = WebTestClient.bindToApplicationContext(context)
                .apply(springSecurity())
                .configureClient()
                // springdoc scans every controller on the first request; the default 5 s is too tight on CI.
                .responseTimeout(Duration.ofMinutes(2))
                .build();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void should_generateOpenApiDocumentAndWriteItToBuildOutput_when_authenticatedAndSpringdocEnabled()
            throws IOException {
        // Given: springdoc enabled for this context and an authenticated caller (class annotations)

        // When
        byte[] body = webTestClient
                .get()
                .uri("/v3/docs")
                .accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody()
                .returnResult()
                .getResponseBody();

        // Then
        assertThat(body).isNotNull().isNotEmpty();

        JsonNode document = OBJECT_MAPPER.readTree(body);
        assertThat(document.path("openapi").asText()).startsWith("3.");

        JsonNode paths = document.path("paths");
        assertThat(paths.isObject()).as("document has a paths object").isTrue();
        assertThat(paths.size()).as("document describes at least one route").isPositive();
        assertThat(paths.has(Url.APPLICATION_URL))
                .as("document describes the application route %s", Url.APPLICATION_URL)
                .isTrue();

        JsonNode schemas = document.path("components").path("schemas");
        assertThat(schemas.isObject() && schemas.size() > 0)
                .as("document carries component schemas")
                .isTrue();

        Files.createDirectories(OUTPUT_DIR);
        Path outputFile = OUTPUT_DIR.resolve(OUTPUT_FILE_NAME);
        Files.writeString(
                outputFile,
                OBJECT_MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(document),
                StandardCharsets.UTF_8);

        assertThat(outputFile).exists();
    }

    /**
     * Companion to {@link OpenApiDocsAuthTest#swaggerUiEndpoint_unauthenticated_returns401()}: the configured
     * Swagger UI path really is a springdoc route (it redirects to the UI index), not just a URL the catch-all
     * authentication rule rejects.
     */
    @Test
    @WithUserDetails(value = "api_user")
    void should_redirectToSwaggerUi_when_authenticatedAndSwaggerUiEnabled() {
        // Given: swagger-ui enabled for this context and an authenticated caller (class annotations)

        // When / Then
        webTestClient.get().uri("/v3/swagger").exchange().expectStatus().is3xxRedirection();
    }
}
