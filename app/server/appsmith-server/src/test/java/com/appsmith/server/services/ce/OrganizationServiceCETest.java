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
    OrganizationService tenantService;

    @MockBean
    EnvManager envManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    OrganizationRepository tenantRepository;

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

    OrganizationConfiguration originalTenantConfiguration;

    @BeforeEach
    public void setup() throws IOException {
        final Organization organization = tenantService.getDefaultOrganization().block();
        assert organization != null;
        originalTenantConfiguration = organization.getOrganizationConfiguration();

        tenantRepository
                .updateAndReturn(
                        organization.getId(),
                        Bridge.update().set(Organization.Fields.organizationConfiguration, null),
                        null)
                .block();

        // Make api_user super-user to test organization admin functionality
        // Todo change this to organization admin once we introduce multitenancy
        userRepository
                .findByEmail("api_user")
                .flatMap(user -> userUtils.makeSuperUser(List.of(user)))
                .block();
        doReturn(Mono.empty()).when(cacheManager).get(anyString(), anyString());
    }

    @AfterEach
    public void cleanup() {
        Organization updatedOrganization = new Organization();
        updatedOrganization.setOrganizationConfiguration(originalTenantConfiguration);
        tenantService
                .getDefaultOrganizationId()
                .flatMap(tenantId -> tenantService.update(tenantId, updatedOrganization))
                .doOnError(error -> {
                    System.err.println("Error during cleanup: " + error.getMessage());
                })
                .block();
    }

    @Test
    void ensureMapsKey() {
        StepVerifier.create(tenantService.getOrganizationConfiguration())
                .assertNext(tenant -> {
                    assertThat(tenant.getOrganizationConfiguration().getGoogleMapsKey())
                            .isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    void setMapsKeyAndGetItBack() {
        final OrganizationConfiguration changes = new OrganizationConfiguration();
        changes.setGoogleMapsKey("test-key");

        final Mono<OrganizationConfiguration> resultMono = tenantService
                .updateDefaultOrganizationConfiguration(changes)
                .map(Organization::getOrganizationConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(tenantConfiguration -> {
                    assertThat(tenantConfiguration.getGoogleMapsKey()).isEqualTo("test-key");
                })
                .verifyComplete();
    }

    @Test
    void setMapsKeyWithoutAuthentication() {
        final OrganizationConfiguration changes = new OrganizationConfiguration();
        changes.setGoogleMapsKey("test-key");

        final Mono<?> resultMono = tenantService.updateDefaultOrganizationConfiguration(changes);

        StepVerifier.create(resultMono)
                .expectErrorMatches(error -> {
                    assertThat(error.getMessage()).startsWith("Unable to find tenant ");
                    return true;
                })
                .verify();
    }

    @Test
    @WithUserDetails("usertest@usertest.com")
    void setMapsKeyWithoutAuthorization() {
        final OrganizationConfiguration changes = new OrganizationConfiguration();
        changes.setGoogleMapsKey("test-key");

        final Mono<?> resultMono = tenantService.updateDefaultOrganizationConfiguration(changes);

        StepVerifier.create(resultMono)
                .expectErrorMatches(error -> {
                    assertThat(error.getMessage()).startsWith("Unable to find tenant ");
                    return true;
                })
                .verify();
    }

    @Test
    @WithUserDetails("anonymousUser")
    void getTenantConfig_Valid_AnonymousUser() {
        StepVerifier.create(tenantService.getOrganizationConfiguration())
                .assertNext(tenant -> {
                    assertThat(tenant.getOrganizationConfiguration()).isNotNull();
                    assertThat(tenant.getOrganizationConfiguration().getLicense())
                            .isNotNull();
                    assertThat(tenant.getOrganizationConfiguration()
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

        final Mono<OrganizationConfiguration> resultMono = tenantService
                .updateDefaultOrganizationConfiguration(changes)
                .then(tenantService.getOrganizationConfiguration())
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

        final Mono<OrganizationConfiguration> resultMono = tenantService
                .updateDefaultOrganizationConfiguration(changes)
                .then(tenantService.getOrganizationConfiguration())
                .map(Organization::getOrganizationConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(tenantConfiguration -> {
                    assertThat(tenantConfiguration.isEmailVerificationEnabled()).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    void setEmailVerificationEnabledFalseAndGetItBack() {
        final OrganizationConfiguration changes = new OrganizationConfiguration();
        changes.setEmailVerificationEnabled(Boolean.FALSE);

        final Mono<OrganizationConfiguration> resultMono = tenantService
                .updateDefaultOrganizationConfiguration(changes)
                .then(tenantService.getOrganizationConfiguration())
                .map(Organization::getOrganizationConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(tenantConfiguration -> {
                    assertThat(tenantConfiguration.isEmailVerificationEnabled()).isFalse();
                })
                .verifyComplete();
    }

    @Test
    void checkAndExecuteMigrationsForTenantFeatureFlags_emptyMigrationMap_revertSameOrganization() {
        Mockito.when(featureFlagMigrationHelper.checkAndExecuteMigrationsForFeatureFlag(any(), any()))
                .thenReturn(Mono.just(TRUE));

        Organization organization = new Organization();
        organization.setId(UUID.randomUUID().toString());
        OrganizationConfiguration config = new OrganizationConfiguration();
        config.setFeaturesWithPendingMigration(new HashMap<>());
        organization.setOrganizationConfiguration(config);
        final Mono<Organization> resultMono =
                tenantService.checkAndExecuteMigrationsForOrganizationFeatureFlags(organization);
        StepVerifier.create(resultMono)
                .assertNext(tenant1 -> {
                    assertThat(tenant1).isEqualTo(organization);
                    assertThat(tenant1.getOrganizationConfiguration().getFeaturesWithPendingMigration())
                            .isEmpty();
                    assertThat(tenant1.getOrganizationConfiguration().getMigrationStatus())
                            .isEqualTo(COMPLETED);
                })
                .verifyComplete();
    }

    @Test
    void checkAndExecuteMigrationsForTenantFeatureFlags_withPendingMigration_getUpdatedOrganization() {
        Mockito.when(featureFlagMigrationHelper.checkAndExecuteMigrationsForFeatureFlag(any(), any()))
                .thenReturn(Mono.just(TRUE));

        Organization organization = new Organization();
        organization.setId(UUID.randomUUID().toString());
        OrganizationConfiguration config = new OrganizationConfiguration();
        Map<FeatureFlagEnum, FeatureMigrationType> featureMigrationTypeMap = new HashMap<>();
        config.setFeaturesWithPendingMigration(featureMigrationTypeMap);
        featureMigrationTypeMap.put(ORGANIZATION_TEST_FEATURE, FeatureMigrationType.ENABLE);
        featureMigrationTypeMap.put(TEST_FEATURE_2, FeatureMigrationType.DISABLE);
        organization.setOrganizationConfiguration(config);
        final Mono<Organization> resultMono =
                tenantService.checkAndExecuteMigrationsForOrganizationFeatureFlags(organization);
        StepVerifier.create(resultMono)
                .assertNext(tenant1 -> {
                    assertThat(tenant1.getOrganizationConfiguration().getFeaturesWithPendingMigration())
                            .isEmpty();
                    assertThat(tenant1.getOrganizationConfiguration().getMigrationStatus())
                            .isEqualTo(COMPLETED);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    void
            checkAndExecuteMigrationsForTenantFeatureFlags_withPendingMigration_exceptionWhileRunningMigration_getUpdatedOrganization() {
        Mockito.when(featureFlagMigrationHelper.checkAndExecuteMigrationsForFeatureFlag(any(), any()))
                .thenReturn(Mono.just(TRUE))
                .thenReturn(Mono.just(FALSE));

        Organization organization = new Organization();
        organization.setId(UUID.randomUUID().toString());
        OrganizationConfiguration config = new OrganizationConfiguration();
        Map<FeatureFlagEnum, FeatureMigrationType> featureMigrationTypeMap = new HashMap<>();
        config.setFeaturesWithPendingMigration(featureMigrationTypeMap);
        featureMigrationTypeMap.put(ORGANIZATION_TEST_FEATURE, FeatureMigrationType.DISABLE);
        featureMigrationTypeMap.put(TEST_FEATURE_2, FeatureMigrationType.ENABLE);
        organization.setOrganizationConfiguration(config);
        final Mono<Organization> resultMono =
                tenantService.checkAndExecuteMigrationsForOrganizationFeatureFlags(organization);

        // Verify that the feature flag migration failure is thrown
        StepVerifier.create(resultMono)
                .expectErrorSatisfies(throwable -> {
                    assertThat(throwable instanceof AppsmithException).isTrue();
                    assertThat(((AppsmithException) throwable).getAppErrorCode())
                            .isEqualTo(FEATURE_FLAG_MIGRATION_FAILURE.getCode());
                })
                .verify();

        // Verify that the organization is updated for the feature flag migration failure
        StepVerifier.create(tenantService.getByIdWithoutPermissionCheck(organization.getId()))
                .assertNext(updatedTenant -> {
                    assertThat(updatedTenant.getOrganizationConfiguration().getFeaturesWithPendingMigration())
                            .hasSize(1);
                    assertThat(updatedTenant.getOrganizationConfiguration().getMigrationStatus())
                            .isEqualTo(IN_PROGRESS);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    void updateTenantConfiguration_updateStrongPasswordPolicy_success() {

        // Ensure that the default tenant does not have strong password policy setup
        Mono<Organization> tenantMono = tenantService.getDefaultOrganization();
        StepVerifier.create(tenantMono)
                .assertNext(tenant -> {
                    assertThat(tenant.getOrganizationConfiguration().getIsStrongPasswordPolicyEnabled())
                            .isNull();
                })
                .verifyComplete();

        // Ensure that the strong password policy is enabled after the update
        final OrganizationConfiguration changes = new OrganizationConfiguration();
        changes.setIsStrongPasswordPolicyEnabled(TRUE);
        Mono<OrganizationConfiguration> resultMono = tenantService
                .updateDefaultOrganizationConfiguration(changes)
                .then(tenantService.getOrganizationConfiguration())
                .map(Organization::getOrganizationConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(tenantConfiguration -> {
                    assertThat(tenantConfiguration.getIsStrongPasswordPolicyEnabled())
                            .isTrue();
                })
                .verifyComplete();

        // Ensure that the strong password policy is disabled after the update
        changes.setIsStrongPasswordPolicyEnabled(FALSE);
        resultMono = tenantService
                .updateDefaultOrganizationConfiguration(changes)
                .then(tenantService.getOrganizationConfiguration())
                .map(Organization::getOrganizationConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(tenantConfiguration -> {
                    assertThat(tenantConfiguration.getIsStrongPasswordPolicyEnabled())
                            .isFalse();
                })
                .verifyComplete();
    }

    /**
     * This test checks that the tenant cache is created and data is fetched without any deserialization errors
     * This will ensure if any new nested user-defined classes are created in the tenant object in the future, and
     * implements serializable is missed for that class, the deserialization will fail leads this test to fail.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void testDeserializationErrors() {
        String tenantId = tenantService.getDefaultOrganizationId().block();
        Mono<Void> evictTenantCache = cacheableRepositoryHelper.evictCachedOrganization(tenantId);
        Mono<Boolean> hasKeyMono = reactiveRedisTemplate.hasKey("tenant:" + tenantId);
        Mono<Organization> cachedTenant = tenantService.getDefaultOrganization();
        StepVerifier.create(evictTenantCache.then(cachedTenant).then(hasKeyMono))
                .assertNext(Assertions::assertTrue)
                .verifyComplete();
    }
}
