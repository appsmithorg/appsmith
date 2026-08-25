package com.appsmith.server.configurations;

import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.web.reactive.context.ReactiveWebApplicationContext;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

/**
 * APP-15850: GET /api/v1/admin/env must never return credential material — not even to a
 * super-admin. Secret-classified variables (DB/Redis URLs, SMTP credentials, OAuth client
 * secrets, and anything matching the SECRET/_PASSWORD/_TOKEN name pattern) come back as the
 * fixed mask "********", while non-secret variables remain readable so the Admin Settings UI
 * keeps working.
 */
@SpringBootTest
public class AdminEnvSecretMaskingTest {

    private static final String MASK = "********";

    private WebTestClient webTestClient;

    @Autowired
    private CommonConfig commonConfig;

    @Autowired
    private UserUtils userUtils;

    @Autowired
    private UserRepository userRepository;

    @TempDir
    Path tempDir;

    private String previousEnvFilePath;

    @BeforeEach
    void setup(ReactiveWebApplicationContext context) throws IOException {
        webTestClient = WebTestClient.bindToApplicationContext(context)
                .apply(springSecurity())
                .build();

        Path envFile = tempDir.resolve("docker.env");
        Files.writeString(
                envFile,
                "APPSMITH_INSTANCE_NAME=masking-test-instance\n"
                        + "APPSMITH_DB_URL='mongodb://appsmith:db-sekret@localhost:27017/appsmith'\n"
                        + "APPSMITH_REDIS_URL='redis://:redis-sekret@127.0.0.1:6379'\n"
                        + "APPSMITH_MAIL_HOST=smtp.example.com\n"
                        + "APPSMITH_MAIL_PASSWORD='smtp-sekret'\n");
        previousEnvFilePath = commonConfig.envFilePath;
        commonConfig.envFilePath = envFile.toString();

        User apiUser = userRepository.findByEmail("api_user").block();
        assertThat(apiUser).isNotNull();
        userUtils.makeInstanceAdministrator(List.of(apiUser)).block();
    }

    @AfterEach
    void tearDown() {
        commonConfig.envFilePath = previousEnvFilePath;
    }

    @Test
    void adminEnvEndpoint_unauthenticated_isRejected() {
        webTestClient.get().uri("/api/v1/admin/env").exchange().expectStatus().isUnauthorized();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void adminEnvEndpoint_superAdmin_receivesMaskedSecretsAndRawNonSecrets() {
        webTestClient
                .get()
                .uri("/api/v1/admin/env")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody()
                .jsonPath("$.data.APPSMITH_INSTANCE_NAME")
                .isEqualTo("masking-test-instance")
                .jsonPath("$.data.APPSMITH_MAIL_HOST")
                .isEqualTo("smtp.example.com")
                .jsonPath("$.data.APPSMITH_DB_URL")
                .isEqualTo(MASK)
                .jsonPath("$.data.APPSMITH_REDIS_URL")
                .isEqualTo(MASK)
                .jsonPath("$.data.APPSMITH_MAIL_PASSWORD")
                .isEqualTo(MASK)
                .consumeWith(result -> {
                    String body = new String(result.getResponseBodyContent(), StandardCharsets.UTF_8);
                    assertThat(body).doesNotContain("sekret");
                });
    }
}
