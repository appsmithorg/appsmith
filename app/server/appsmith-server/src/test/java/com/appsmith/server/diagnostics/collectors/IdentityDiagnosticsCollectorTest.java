package com.appsmith.server.diagnostics.collectors;

import com.appsmith.server.diagnostics.DiagnosticsRedactionGuard;
import com.appsmith.server.diagnostics.DiagnosticsValues;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationConfiguration;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.OrganizationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IdentityDiagnosticsCollectorTest {

    private static final String GOOGLE_CLIENT_ID = "APPSMITH_OAUTH2_GOOGLE_CLIENT_ID";
    private static final String GITHUB_CLIENT_ID = "APPSMITH_OAUTH2_GITHUB_CLIENT_ID";

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrganizationService organizationService;

    private final Map<String, String> environment = new HashMap<>();

    private final DiagnosticsRedactionGuard guard = new DiagnosticsRedactionGuard(new ObjectMapper());

    private IdentityDiagnosticsCollectorCE collector() {
        return new IdentityDiagnosticsCollectorCE(userRepository, organizationService, environment::get);
    }

    private void givenOrganization(OrganizationConfiguration configuration) {
        Organization organization = new Organization();
        organization.setId("org-1");
        organization.setOrganizationConfiguration(configuration);
        when(organizationService.retrieveById("org-1")).thenReturn(Mono.just(organization));
        when(userRepository.countForDiagnostics()).thenReturn(Mono.just(3L));
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> loginMethods(Map<String, Object> data) {
        return (Map<String, Object>) data.get("loginMethods");
    }

    @Test
    void should_treatNullFormLoginAsEnabled_when_unset() {
        // Given
        givenOrganization(new OrganizationConfiguration());

        // When
        Mono<Map<String, Object>> result = collector().collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(loginMethods(data)).containsEntry("form", true);
                    assertThat(data).containsEntry("signupDisabled", false);
                })
                .verifyComplete();
    }

    @Test
    void should_reportGoogleTrue_when_clientIdPresent() {
        // Given
        givenOrganization(new OrganizationConfiguration());
        environment.put(GOOGLE_CLIENT_ID, "zzseed-client-id");

        // When
        Mono<Map<String, Object>> result = collector().collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(loginMethods(data)).containsEntry("google", true).containsEntry("github", false);
                    assertThat(data.toString()).doesNotContainIgnoringCase("zzseed");
                })
                .verifyComplete();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    void should_reportGoogleFalse_when_clientIdBlank(String clientId) {
        // Given
        givenOrganization(new OrganizationConfiguration());
        environment.put(GOOGLE_CLIENT_ID, clientId);
        environment.put(GITHUB_CLIENT_ID, "github-client-id");

        // When
        Mono<Map<String, Object>> result = collector().collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> assertThat(loginMethods(data))
                        .containsEntry("google", false)
                        .containsEntry("github", true))
                .verifyComplete();
    }

    @Test
    void should_reportUserCount_when_usersExist() {
        // Given
        givenOrganization(new OrganizationConfiguration());
        when(userRepository.countForDiagnostics()).thenReturn(Mono.just(42L));

        // When
        Mono<Map<String, Object>> result = collector().collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> assertThat(data).containsEntry("users", 42L))
                .verifyComplete();
    }

    @Test
    void should_reportNotSupportedForEveryEeKey_when_ce() {
        // Given
        givenOrganization(new OrganizationConfiguration());

        // When
        Mono<Map<String, Object>> result = collector().collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(data.keySet()).endsWith(IdentityDiagnosticsCollectorCE.EE_KEYS.toArray(String[]::new));
                    for (String key : IdentityDiagnosticsCollectorCE.EE_KEYS) {
                        assertThat(data).containsEntry(key, DiagnosticsValues.NOT_SUPPORTED);
                    }
                })
                .verifyComplete();
    }

    @Test
    void should_reportUnknown_when_organizationConfigurationNull() {
        // Given
        givenOrganization(null);

        // When
        Mono<Map<String, Object>> result = collector().collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(loginMethods(data)).containsEntry("form", DiagnosticsValues.UNKNOWN);
                    assertThat(data).containsEntry("signupDisabled", DiagnosticsValues.UNKNOWN);
                    assertThat(guard.violation(collector().schema(), data)).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    void should_reportUsersUnknown_when_userCountHangs() {
        // Given
        Organization organization = new Organization();
        organization.setId("org-1");
        OrganizationConfiguration configuration = new OrganizationConfiguration();
        configuration.setIsSignupDisabled(true);
        organization.setOrganizationConfiguration(configuration);
        when(organizationService.retrieveById("org-1")).thenReturn(Mono.just(organization));
        when(userRepository.countForDiagnostics()).thenReturn(Mono.never());
        environment.put(GOOGLE_CLIENT_ID, "google-client-id");

        // When
        StepVerifier.FirstStep<Map<String, Object>> result =
                StepVerifier.withVirtualTime(() -> collector().collect("org-1"));

        // Then
        result.expectSubscription()
                .thenAwait(DiagnosticsValues.EE_READ_TIMEOUT)
                .assertNext(data -> {
                    assertThat(data).containsEntry("users", DiagnosticsValues.UNKNOWN);
                    assertThat(data).containsEntry("signupDisabled", true);
                    assertThat(loginMethods(data))
                            .containsEntry("form", true)
                            .containsEntry("google", true)
                            .containsEntry("github", false);
                })
                .expectComplete()
                .verify(Duration.ofSeconds(5));
    }

    @Test
    void should_reportOrganizationKeysUnknown_when_organizationReadHangs() {
        // Given
        when(organizationService.retrieveById("org-1")).thenReturn(Mono.never());
        when(userRepository.countForDiagnostics()).thenReturn(Mono.just(3L));
        environment.put(GITHUB_CLIENT_ID, "github-client-id");

        // When
        StepVerifier.FirstStep<Map<String, Object>> result =
                StepVerifier.withVirtualTime(() -> collector().collect("org-1"));

        // Then
        result.expectSubscription()
                .thenAwait(DiagnosticsValues.EE_READ_TIMEOUT)
                .assertNext(data -> {
                    assertThat(data)
                            .containsEntry("signupDisabled", DiagnosticsValues.UNKNOWN)
                            .containsEntry("users", 3L);
                    assertThat(loginMethods(data))
                            .containsEntry("form", DiagnosticsValues.UNKNOWN)
                            .containsEntry("google", false)
                            .containsEntry("github", true);
                })
                .expectComplete()
                .verify(Duration.ofSeconds(5));
    }

    @Test
    void should_reportOrganizationKeysUnknown_when_organizationReadFails() {
        // Given
        when(organizationService.retrieveById("org-1"))
                .thenReturn(Mono.error(new IllegalStateException("zzseed-decode-error")));
        when(userRepository.countForDiagnostics()).thenReturn(Mono.just(3L));
        environment.put(GOOGLE_CLIENT_ID, "google-client-id");

        // When
        Mono<Map<String, Object>> result = collector().collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(data)
                            .containsEntry("signupDisabled", DiagnosticsValues.UNKNOWN)
                            .containsEntry("users", 3L);
                    assertThat(loginMethods(data))
                            .containsEntry("form", DiagnosticsValues.UNKNOWN)
                            .containsEntry("google", true)
                            .containsEntry("github", false);
                    assertThat(data.toString()).doesNotContainIgnoringCase("zzseed");
                })
                .verifyComplete();
    }

    @Test
    void should_reportUsersUnknown_when_userCountEmpty() {
        // Given
        OrganizationConfiguration configuration = new OrganizationConfiguration();
        configuration.setIsSignupDisabled(true);
        Organization organization = new Organization();
        organization.setId("org-1");
        organization.setOrganizationConfiguration(configuration);
        when(organizationService.retrieveById("org-1")).thenReturn(Mono.just(organization));
        when(userRepository.countForDiagnostics()).thenReturn(Mono.empty());

        // When
        Mono<Map<String, Object>> result = collector().collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(data)
                            .containsEntry("users", DiagnosticsValues.UNKNOWN)
                            .containsEntry("signupDisabled", true);
                    assertThat(loginMethods(data)).containsEntry("form", true);
                })
                .verifyComplete();
    }

    @Test
    void should_declareOnlyStrictKinds_when_schemaBuilt() {
        // Given
        IdentityDiagnosticsCollectorCE collector = collector();

        // When
        DiagnosticsSchema schema = collector.schema();

        // Then
        assertThat(schema.keys().values())
                .doesNotContain(
                        DiagnosticsSchema.ValueKind.FREE_TEXT,
                        DiagnosticsSchema.ValueKind.INSTANCE_ID,
                        DiagnosticsSchema.ValueKind.VERSION,
                        DiagnosticsSchema.ValueKind.DATE);
        assertThat(schema.keys()).containsKeys(IdentityDiagnosticsCollectorCE.EE_KEYS.toArray(String[]::new));
    }

    @Test
    void should_passTheRedactionGuard_when_collected() {
        // Given
        OrganizationConfiguration configuration = new OrganizationConfiguration();
        configuration.setIsFormLoginEnabled(false);
        configuration.setIsSignupDisabled(true);
        givenOrganization(configuration);
        environment.put(GOOGLE_CLIENT_ID, "google-client-id");
        IdentityDiagnosticsCollectorCE collector = collector();

        // When
        Mono<Map<String, Object>> result = collector.collect("org-1");

        // Then
        StepVerifier.create(result)
                .assertNext(data -> {
                    assertThat(loginMethods(data)).containsEntry("form", false);
                    assertThat(data).containsEntry("signupDisabled", true);
                    assertThat(guard.violation(collector.schema(), data)).isEmpty();
                })
                .verifyComplete();
    }
}
