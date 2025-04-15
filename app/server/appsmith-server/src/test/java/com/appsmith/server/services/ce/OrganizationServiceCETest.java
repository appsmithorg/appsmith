package com.appsmith.server.services.ce;

import com.appsmith.caching.components.CacheManager;
import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.constants.FeatureMigrationType;
import com.appsmith.server.constants.LicensePlan;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationConfiguration;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.FeatureFlagMigrationHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.solutions.EnvManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static com.appsmith.external.enums.FeatureFlagEnum.ORGANIZATION_TEST_FEATURE;
import static com.appsmith.external.enums.FeatureFlagEnum.TEST_FEATURE_2;
import static com.appsmith.server.constants.MigrationStatus.COMPLETED;
import static com.appsmith.server.constants.MigrationStatus.IN_PROGRESS;
import static com.appsmith.server.exceptions.AppsmithErrorCode.FEATURE_FLAG_MIGRATION_FAILURE;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doReturn;

@SpringBootTest
class OrganizationServiceCETest {

    @Autowired
    OrganizationService organizationService;

    @MockBean
    EnvManager envManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    OrganizationRepository organizationRepository;

    @Autowired
    UserUtils userUtils;

    @SpyBean
    FeatureFlagService featureFlagService;

    @Autowired
    ReactiveRedisTemplate<String, Object> reactiveRedisTemplate;

    @SpyBean
    CacheManager cacheManager;

    @SpyBean
    CacheableRepositoryHelper cacheableRepositoryHelper;

    @MockBean
    FeatureFlagMigrationHelper featureFlagMigrationHelper;

    @Autowired
    ConfigService configService;

    OrganizationConfiguration originalOrganizationConfiguration;

    @BeforeEach
    public void setup() throws IOException {
        final Organization organization =
                organizationService.getCurrentUserOrganization().block();
        assert organization != null;
        originalOrganizationConfiguration = organization.getOrganizationConfiguration();

        organizationRepository
                .updateAndReturn(
                        organization.getId(),
                        Bridge.update().set(Organization.Fields.organizationConfiguration, null),
                        null)
                .block();

        configService.updateInstanceVariables(new HashMap<>()).block();
        // Make api_user super-user to test organization admin functionality
        // Todo change this to organization admin once we introduce multitenancy
        userRepository
                .findByEmail("api_user")
                .flatMap(user -> userUtils.makeInstanceAdministrator(List.of(user)))
                .block();
        doReturn(Mono.empty()).when(cacheManager).get(anyString(), anyString());
    }

    @AfterEach
    public void cleanup() {
        Organization updatedOrganization = new Organization();
        updatedOrganization.setOrganizationConfiguration(originalOrganizationConfiguration);
        organizationService
                .getCurrentUserOrganizationId()
                .flatMap(organizationId -> organizationService.update(organizationId, updatedOrganization))
                .doOnError(error -> {
                    System.err.println("Error during cleanup: " + error.getMessage());
                })
                .block();
    }

    @Test
    @WithUserDetails("api_user")
    void setMapsKeyAndGetItBack() {
        final OrganizationConfiguration changes = new OrganizationConfiguration();
        changes.setGoogleMapsKey("test-key");

        final Mono<OrganizationConfiguration> resultMono = organizationService
                .updateOrganizationConfiguration(changes)
                .map(Organization::getOrganizationConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(organizationConfiguration -> {
                    assertThat(organizationConfiguration.getGoogleMapsKey()).isEqualTo("test-key");
                })
                .verifyComplete();
    }

    @Test
    void setMapsKeyWithoutAuthentication() {
        final OrganizationConfiguration changes = new OrganizationConfiguration();
        changes.setGoogleMapsKey("test-key");

        final Mono<?> resultMono = organizationService.updateOrganizationConfiguration(changes);

        StepVerifier.create(resultMono)
                .expectErrorMatches(error -> {
                    assertThat(error.getMessage()).startsWith("Unable to find organization ");
                    return true;
                })
                .verify();
    }

    @Test
    @WithUserDetails("usertest@usertest.com")
    void setMapsKeyWithoutAuthorization() {
        final OrganizationConfiguration changes = new OrganizationConfiguration();
        changes.setGoogleMapsKey("test-key");

        final Mono<?> resultMono = organizationService.updateOrganizationConfiguration(changes);

        StepVerifier.create(resultMono)
                .expectErrorMatches(error -> {
                    assertThat(error.getMessage()).startsWith("Unable to find organization ");
                    return true;
                })
                .verify();
    }

    @Test
    @WithUserDetails("api_user")
    void updateOrganizationConfiguration_updateFormLoginEnabled_success() {

        // Ensure that default value for form login is enabled
        Mono<Organization> organizationMono = organizationService.getOrganizationConfiguration();
        StepVerifier.create(organizationMono)
                .assertNext(organization -> {
                    assertThat(organization.getOrganizationConfiguration().getIsFormLoginEnabled())
                            .isTrue();
                })
                .verifyComplete();

        // Ensure that the form login is disabled after the update
        final OrganizationConfiguration changes = new OrganizationConfiguration();
        changes.setIsFormLoginEnabled(FALSE);
        Mono<OrganizationConfiguration> resultMono = organizationService
                .updateOrganizationConfiguration(changes)
                .then(organizationService.getOrganizationConfiguration())
                .map(Organization::getOrganizationConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(organizationConfiguration -> {
                    assertThat(organizationConfiguration.getIsFormLoginEnabled())
                            .isFalse();
                })
                .verifyComplete();

        // Ensure that the form login is enabled after the update
        changes.setIsFormLoginEnabled(TRUE);
        resultMono = organizationService
                .updateOrganizationConfiguration(changes)
                .then(organizationService.getOrganizationConfiguration())
                .map(Organization::getOrganizationConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(organizationConfiguration -> {
                    assertThat(organizationConfiguration.getIsFormLoginEnabled())
                            .isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("anonymousUser")
    void getOrganizationConfig_Valid_AnonymousUser() {
        StepVerifier.create(organizationService.getOrganizationConfiguration())
                .assertNext(organization -> {
                    assertThat(organization.getOrganizationConfiguration()).isNotNull();
                    assertThat(organization.getOrganizationConfiguration().getLicense())
                            .isNotNull();
                    assertThat(organization
                                    .getOrganizationConfiguration()
                                    .getLicense()
                                    .getPlan())
                            .isEqualTo(LicensePlan.FREE);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    void setEmailVerificationEnabled_WithInvalidSMTPHost_ReturnsError() {
        final OrganizationConfiguration changes = new OrganizationConfiguration();
        changes.setEmailVerificationEnabled(TRUE);

        Map<String, String> envVars = new HashMap<>();
        // adding invalid mail host
        envVars.put("APPSMITH_MAIL_HOST", "");

        // mocking env vars file
        Mockito.when(envManager.getAllNonEmpty()).thenReturn(Mono.just(envVars));

        final Mono<OrganizationConfiguration> resultMono = organizationService
                .updateOrganizationConfiguration(changes)
                .then(organizationService.getOrganizationConfiguration())
                .map(Organization::getOrganizationConfiguration);

        StepVerifier.create(resultMono)
                .expectErrorMatches(error -> {
                    assertThat(error.getMessage()).startsWith("Your SMTP configuration is invalid");
                    return true;
                })
                .verify();
    }

    @Test
    @WithUserDetails("api_user")
    void setEmailVerificationEnabled_WithValidSMTPHost_Success() {
        final OrganizationConfiguration changes = new OrganizationConfiguration();
        changes.setEmailVerificationEnabled(TRUE);

        Map<String, String> envVars = new HashMap<>();
        // adding valid mail host
        envVars.put("APPSMITH_MAIL_HOST", "smtp.sendgrid.net");

        // mocking env vars file
        Mockito.when(envManager.getAllNonEmpty()).thenReturn(Mono.just(envVars));

        final Mono<OrganizationConfiguration> resultMono = organizationService
                .updateOrganizationConfiguration(changes)
                .then(organizationService.getOrganizationConfiguration())
                .map(Organization::getOrganizationConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(organizationConfiguration -> {
                    assertThat(organizationConfiguration.getEmailVerificationEnabled())
                            .isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    void setEmailVerificationEnabledFalseAndGetItBack() {
        final OrganizationConfiguration changes = new OrganizationConfiguration();
        changes.setEmailVerificationEnabled(Boolean.FALSE);

        final Mono<OrganizationConfiguration> resultMono = organizationService
                .updateOrganizationConfiguration(changes)
                .then(organizationService.getOrganizationConfiguration())
                .map(Organization::getOrganizationConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(organizationConfiguration -> {
                    assertThat(organizationConfiguration.getEmailVerificationEnabled())
                            .isFalse();
                })
                .verifyComplete();
    }

    @Test
    void checkAndExecuteMigrationsForOrganizationFeatureFlags_emptyMigrationMap_revertSameOrganization() {
        Mockito.when(featureFlagMigrationHelper.checkAndExecuteMigrationsForFeatureFlag(any(), any()))
                .thenReturn(Mono.just(TRUE));

        Organization organization = new Organization();
        organization.setId(UUID.randomUUID().toString());
        organization.setSlug(UUID.randomUUID().toString());
        OrganizationConfiguration config = new OrganizationConfiguration();
        config.setFeaturesWithPendingMigration(new HashMap<>());
        organization.setOrganizationConfiguration(config);
        final Mono<Organization> resultMono =
                organizationService.checkAndExecuteMigrationsForOrganizationFeatureFlags(organization);
        StepVerifier.create(resultMono)
                .assertNext(organization1 -> {
                    assertThat(organization1).isEqualTo(organization);
                    assertThat(organization1.getOrganizationConfiguration().getFeaturesWithPendingMigration())
                            .isEmpty();
                    assertThat(organization1.getOrganizationConfiguration().getMigrationStatus())
                            .isEqualTo(COMPLETED);
                })
                .verifyComplete();
    }

    @Test
    void checkAndExecuteMigrationsForOrganizationFeatureFlags_withPendingMigration_getUpdatedOrganization() {
        Mockito.when(featureFlagMigrationHelper.checkAndExecuteMigrationsForFeatureFlag(any(), any()))
                .thenReturn(Mono.just(TRUE));

        Organization organization = new Organization();
        organization.setId(UUID.randomUUID().toString());
        organization.setSlug(UUID.randomUUID().toString());
        OrganizationConfiguration config = new OrganizationConfiguration();
        Map<FeatureFlagEnum, FeatureMigrationType> featureMigrationTypeMap = new HashMap<>();
        config.setFeaturesWithPendingMigration(featureMigrationTypeMap);
        featureMigrationTypeMap.put(ORGANIZATION_TEST_FEATURE, FeatureMigrationType.ENABLE);
        featureMigrationTypeMap.put(TEST_FEATURE_2, FeatureMigrationType.DISABLE);
        organization.setOrganizationConfiguration(config);
        final Mono<Organization> resultMono =
                organizationService.checkAndExecuteMigrationsForOrganizationFeatureFlags(organization);
        StepVerifier.create(resultMono)
                .assertNext(organization1 -> {
                    assertThat(organization1.getOrganizationConfiguration().getFeaturesWithPendingMigration())
                            .isEmpty();
                    assertThat(organization1.getOrganizationConfiguration().getMigrationStatus())
                            .isEqualTo(COMPLETED);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    void
            checkAndExecuteMigrationsForOrganizationFeatureFlags_withPendingMigration_exceptionWhileRunningMigration_getUpdatedOrganization() {
        Mockito.when(featureFlagMigrationHelper.checkAndExecuteMigrationsForFeatureFlag(any(), any()))
                .thenReturn(Mono.just(TRUE))
                .thenReturn(Mono.just(FALSE));

        Organization organization = new Organization();
        organization.setId(UUID.randomUUID().toString());
        organization.setSlug(UUID.randomUUID().toString());
        OrganizationConfiguration config = new OrganizationConfiguration();
        Map<FeatureFlagEnum, FeatureMigrationType> featureMigrationTypeMap = new HashMap<>();
        config.setFeaturesWithPendingMigration(featureMigrationTypeMap);
        featureMigrationTypeMap.put(ORGANIZATION_TEST_FEATURE, FeatureMigrationType.DISABLE);
        featureMigrationTypeMap.put(TEST_FEATURE_2, FeatureMigrationType.ENABLE);
        organization.setOrganizationConfiguration(config);
        final Mono<Organization> resultMono =
                organizationService.checkAndExecuteMigrationsForOrganizationFeatureFlags(organization);

        // Verify that the feature flag migration failure is thrown
        StepVerifier.create(resultMono)
                .expectErrorSatisfies(throwable -> {
                    assertThat(throwable instanceof AppsmithException).isTrue();
                    assertThat(((AppsmithException) throwable).getAppErrorCode())
                            .isEqualTo(FEATURE_FLAG_MIGRATION_FAILURE.getCode());
                })
                .verify();

        // Verify that the organization is updated for the feature flag migration failure
        StepVerifier.create(organizationService.getByIdWithoutPermissionCheck(organization.getId()))
                .assertNext(organization1 -> {
                    assertThat(organization1.getOrganizationConfiguration().getFeaturesWithPendingMigration())
                            .hasSize(1);
                    assertThat(organization1.getOrganizationConfiguration().getMigrationStatus())
                            .isEqualTo(IN_PROGRESS);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    void updateOrganizationConfiguration_updateStrongPasswordPolicy_success() {

        // Ensure that the default organization does not have strong password policy setup
        Mono<Organization> organizationMono = organizationService.getCurrentUserOrganization();
        StepVerifier.create(organizationMono)
                .assertNext(organization -> {
                    assertThat(organization.getOrganizationConfiguration().getIsStrongPasswordPolicyEnabled())
                            .isNull();
                })
                .verifyComplete();

        // Ensure that the strong password policy is enabled after the update
        final OrganizationConfiguration changes = new OrganizationConfiguration();
        changes.setIsStrongPasswordPolicyEnabled(TRUE);
        Mono<OrganizationConfiguration> resultMono = organizationService
                .updateOrganizationConfiguration(changes)
                .then(organizationService.getOrganizationConfiguration())
                .map(Organization::getOrganizationConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(organizationConfiguration -> {
                    assertThat(organizationConfiguration.getIsStrongPasswordPolicyEnabled())
                            .isTrue();
                })
                .verifyComplete();

        // Ensure that the strong password policy is disabled after the update
        changes.setIsStrongPasswordPolicyEnabled(FALSE);
        resultMono = organizationService
                .updateOrganizationConfiguration(changes)
                .then(organizationService.getOrganizationConfiguration())
                .map(Organization::getOrganizationConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(organizationConfiguration -> {
                    assertThat(organizationConfiguration.getIsStrongPasswordPolicyEnabled())
                            .isFalse();
                })
                .verifyComplete();
    }

    /**
     * This test checks that the organization cache is created and data is fetched without any deserialization errors
     * This will ensure if any new nested user-defined classes are created in the organization object in the future, and
     * implements serializable is missed for that class, the deserialization will fail leads this test to fail.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void testDeserializationErrors() {
        String organizationId =
                organizationService.getCurrentUserOrganizationId().block();
        Mono<Void> evictCachedOrganization = cacheableRepositoryHelper.evictCachedOrganization(organizationId);
        Mono<Boolean> hasKeyMono = reactiveRedisTemplate.hasKey("organization:" + organizationId);
        Mono<Organization> organizationMono = organizationService.getCurrentUserOrganization();
        StepVerifier.create(evictCachedOrganization.then(organizationMono).then(hasKeyMono))
                .assertNext(Assertions::assertTrue)
                .verifyComplete();
    }
}
