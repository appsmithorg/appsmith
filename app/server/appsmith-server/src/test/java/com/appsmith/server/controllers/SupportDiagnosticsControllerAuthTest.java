package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.web.reactive.context.ReactiveWebApplicationContext;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.csrf;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockAuthentication;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

/**
 * Only super users can reach the support diagnostics endpoints. The test profile seeds two real users: {@code
 * api_user}, who the test makes an instance administrator (a super user with MANAGE_ORGANIZATION) when it is not one
 * yet and demotes afterwards only in that case, and {@code usertest@usertest.com}, who is not one.
 */
@SpringBootTest
class SupportDiagnosticsControllerAuthTest {

    private static final String SUPER_USER_EMAIL = "api_user";
    private static final String NON_SUPER_USER_EMAIL = "usertest@usertest.com";
    private static final String DOWNLOAD_BODY = "{\"sectionIds\":[\"INSTANCE\"],\"encrypted\":false}";

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserUtils userUtils;

    private WebTestClient webTestClient;
    private User superUser;
    private User nonSuperUser;
    private boolean promotedSuperUser;

    @BeforeEach
    void setUp(ReactiveWebApplicationContext context) {
        webTestClient = WebTestClient.bindToApplicationContext(context)
                .apply(springSecurity())
                .build();
        superUser = userRepository.findByEmail(SUPER_USER_EMAIL).block();
        nonSuperUser = userRepository.findByEmail(NON_SUPER_USER_EMAIL).block();
        assertThat(superUser).isNotNull();
        assertThat(nonSuperUser).isNotNull();
        promotedSuperUser =
                !Boolean.TRUE.equals(userUtils.isSuperUser(superUser).block());
        if (promotedSuperUser) {
            userUtils.makeInstanceAdministrator(List.of(superUser)).block();
        }
    }

    @AfterEach
    void tearDown() {
        if (promotedSuperUser && superUser != null) {
            userUtils.removeInstanceAdmin(List.of(superUser)).block();
        }
        promotedSuperUser = false;
    }

    @ParameterizedTest
    @MethodSource("endpoints")
    void should_return401_when_unauthenticated(HttpMethod method, String path) {
        // Given
        WebTestClient client = webTestClient.mutateWith(csrf());

        // When
        WebTestClient.ResponseSpec response = request(client, method, path);

        // Then
        response.expectStatus().isUnauthorized();
    }

    @ParameterizedTest
    @MethodSource("endpoints")
    void should_return403_when_userIsNotSuperUser(HttpMethod method, String path) {
        // Given
        WebTestClient client = authenticatedClient(nonSuperUser);

        // When
        WebTestClient.ResponseSpec response = request(client, method, path);

        // Then
        response.expectStatus().isForbidden();
    }

    @Test
    void should_returnAllNineSections_when_superUserListsSections() {
        // Given
        WebTestClient client = authenticatedClient(superUser);

        // When
        WebTestClient.ResponseSpec response =
                client.get().uri(Url.SUPPORT_DIAGNOSTICS_URL + "/sections").exchange();

        // Then
        response.expectStatus()
                .isOk()
                .expectBody()
                .jsonPath("$.data.collectorVersion")
                .isEqualTo("1")
                .jsonPath("$.data.sections.length()")
                .isEqualTo(9);
    }

    @Test
    void should_collectInstanceSection_when_superUserRequestsIt() {
        // Given
        WebTestClient client = authenticatedClient(superUser);

        // When
        WebTestClient.ResponseSpec response = client.post()
                .uri(Url.SUPPORT_DIAGNOSTICS_URL + "/sections/INSTANCE/collect")
                .exchange();

        // Then
        response.expectStatus()
                .isOk()
                .expectBody()
                .jsonPath("$.data.status")
                .isEqualTo("OK")
                .jsonPath("$.data.data.edition")
                .exists()
                .jsonPath("$.data.data.hostname")
                .doesNotExist();
    }

    @Test
    void should_acceptDownloadRecord_when_superUserPostsDownload() {
        // Given
        WebTestClient client = authenticatedClient(superUser);

        // When
        WebTestClient.ResponseSpec response = client.post()
                .uri(Url.SUPPORT_DIAGNOSTICS_URL + "/downloads")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(DOWNLOAD_BODY)
                .exchange();

        // Then
        response.expectStatus().isOk();
    }

    @ParameterizedTest
    @ValueSource(strings = {"{}", "{\"sectionIds\":[]}"})
    void should_return400_when_downloadHasNoSectionIds(String body) {
        // Given
        WebTestClient client = authenticatedClient(superUser);

        // When
        WebTestClient.ResponseSpec response = client.post()
                .uri(Url.SUPPORT_DIAGNOSTICS_URL + "/downloads")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchange();

        // Then
        response.expectStatus().isBadRequest();
    }

    @Test
    void should_return400_when_sectionIdIsUnknown() {
        // Given
        WebTestClient client = authenticatedClient(superUser);

        // When
        WebTestClient.ResponseSpec response = client.post()
                .uri(Url.SUPPORT_DIAGNOSTICS_URL + "/sections/NOPE/collect")
                .exchange();

        // Then
        response.expectStatus().isBadRequest();
    }

    static Stream<Arguments> endpoints() {
        return Stream.of(
                Arguments.of(HttpMethod.GET, Url.SUPPORT_DIAGNOSTICS_URL + "/sections"),
                Arguments.of(HttpMethod.POST, Url.SUPPORT_DIAGNOSTICS_URL + "/sections/INSTANCE/collect"),
                Arguments.of(HttpMethod.POST, Url.SUPPORT_DIAGNOSTICS_URL + "/downloads"));
    }

    private WebTestClient authenticatedClient(User user) {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(user, "password", user.getAuthorities());
        return webTestClient.mutateWith(mockAuthentication(authentication)).mutateWith(csrf());
    }

    /** Sends a valid request, so a rejection comes from authorization and not from request validation. */
    private static WebTestClient.ResponseSpec request(WebTestClient client, HttpMethod method, String path) {
        WebTestClient.RequestBodySpec spec = client.method(method).uri(path).contentType(MediaType.APPLICATION_JSON);
        if (path.endsWith("/downloads")) {
            return spec.bodyValue(DOWNLOAD_BODY).exchange();
        }
        return spec.exchange();
    }
}
