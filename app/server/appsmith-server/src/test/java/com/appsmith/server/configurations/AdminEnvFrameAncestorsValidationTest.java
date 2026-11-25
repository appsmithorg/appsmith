package com.appsmith.server.configurations;

import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.web.reactive.context.ReactiveWebApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.csrf;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

/**
 * PUT /api/v1/admin/env saves APPSMITH_ALLOWED_FRAME_ANCESTORS only when the value is a list of CSP
 * frame-ancestors source expressions, and stores it in normalized form.
 */
@SpringBootTest
class AdminEnvFrameAncestorsValidationTest {

    private static final String ORIGIN = "http://localhost:8080";
    private static final String INITIAL_ENV_CONTENT =
            "APPSMITH_INSTANCE_NAME=frame-ancestors-test-instance\nAPPSMITH_ALLOWED_FRAME_ANCESTORS=example.com\n";

    private WebTestClient webTestClient;

    @Autowired
    private CommonConfig commonConfig;

    @Autowired
    private UserUtils userUtils;

    @Autowired
    private UserRepository userRepository;

    @TempDir
    Path tempDir;

    private Path envFile;
    private String previousEnvFilePath;

    @BeforeEach
    void setUp(ReactiveWebApplicationContext context) throws IOException {
        webTestClient = WebTestClient.bindToApplicationContext(context)
                .apply(springSecurity())
                .build()
                .mutateWith(csrf());

        envFile = tempDir.resolve("docker.env");
        Files.writeString(envFile, INITIAL_ENV_CONTENT);
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

    static Stream<Arguments> valuesThatAreNotSourceLists() {
        return Stream.of(
                Arguments.of("a brace", "example.com a{b}"),
                Arguments.of("a double quote", "example.com\" a"),
                Arguments.of("a backslash", "example.com\\a"),
                Arguments.of("a dollar sign", "example.com/$a"),
                Arguments.of("a comma", "example.com,another.com"),
                Arguments.of("a semicolon", "example.com; another.com"),
                Arguments.of("a tab", "example.com\tanother.com"),
                Arguments.of("a line break at the end", "example.com\n"),
                Arguments.of("a line break at the start", "\nexample.com"),
                Arguments.of("a non-ASCII letter in a host", "ex\u00E4mple.com"),
                Arguments.of("a keyword with a non-ASCII letter", "'\u017Felf'"),
                Arguments.of("a query string", "https://example.com/?a=b"),
                Arguments.of("a wildcard inside a host", "https://a.*.example.com"),
                Arguments.of("none combined with another source", "'none' example.com"),
                Arguments.of("an unknown keyword", "'unsafe-inline'"));
    }

    static Stream<Arguments> sourceLists() {
        return Stream.of(
                Arguments.of("'self'", "\"'\"'self'\"'\""),
                Arguments.of("'NONE'", "\"'\"'none'\"'\""),
                Arguments.of("*", "'*'"),
                Arguments.of("example.com", "example.com"),
                Arguments.of("https://*.example.com:8443/apps/", "'https://*.example.com:8443/apps/'"),
                Arguments.of(
                        "https://example.com/apps/team+tools@v1:2/a=b&c",
                        "'https://example.com/apps/team+tools@v1:2/a=b&c'"),
                Arguments.of("https:", "https:"),
                Arguments.of("  example.com   https://another.com  ", "'example.com https://another.com'"),
                Arguments.of("   ", ""));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("valuesThatAreNotSourceLists")
    @DisplayName("GHSA-cjj3-xcpr-v6hj")
    @WithUserDetails(value = "api_user")
    void should_returnBadRequest_when_frameAncestorsIsNotSourceList(String description, String value)
            throws IOException {
        // Given
        Map<String, String> changes = Map.of("APPSMITH_ALLOWED_FRAME_ANCESTORS", value);

        // When
        WebTestClient.ResponseSpec response = webTestClient
                .put()
                .uri("/api/v1/admin/env")
                .header("Origin", ORIGIN)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(changes)
                .exchange();

        // Then
        response.expectStatus()
                .isBadRequest()
                .expectBody()
                .jsonPath("$.responseMeta.error.message")
                .value(message -> assertThat((String) message).contains("Allowed frame ancestors"));
        assertThat(Files.readString(envFile)).isEqualTo(INITIAL_ENV_CONTENT);
    }

    @Test
    @DisplayName("GHSA-cjj3-xcpr-v6hj")
    @WithUserDetails(value = "api_user")
    void should_returnBadRequest_when_frameAncestorsIsNull() throws IOException {
        // Given
        String changes = "{\"APPSMITH_ALLOWED_FRAME_ANCESTORS\": null}";

        // When
        WebTestClient.ResponseSpec response = webTestClient
                .put()
                .uri("/api/v1/admin/env")
                .header("Origin", ORIGIN)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(changes)
                .exchange();

        // Then
        response.expectStatus()
                .isBadRequest()
                .expectBody()
                .jsonPath("$.responseMeta.error.message")
                .value(message -> assertThat((String) message).contains("Allowed frame ancestors"));
        assertThat(Files.readString(envFile)).isEqualTo(INITIAL_ENV_CONTENT);
    }

    @ParameterizedTest(name = "[{index}] \"{0}\"")
    @MethodSource("sourceLists")
    @DisplayName("GHSA-cjj3-xcpr-v6hj")
    @WithUserDetails(value = "api_user")
    void should_saveNormalizedValue_when_frameAncestorsIsSourceList(String value, String storedValue)
            throws IOException {
        // Given
        Map<String, String> changes = Map.of("APPSMITH_ALLOWED_FRAME_ANCESTORS", value);

        // When
        WebTestClient.ResponseSpec response = webTestClient
                .put()
                .uri("/api/v1/admin/env")
                .header("Origin", ORIGIN)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(changes)
                .exchange();

        // Then
        response.expectStatus().isOk();
        assertThat(Files.readAllLines(envFile)).contains("APPSMITH_ALLOWED_FRAME_ANCESTORS=" + storedValue);
    }
}
