package com.appsmith.server.services.ce;

import com.appsmith.server.constants.FeatureMigrationType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.LicensePlan;
import com.appsmith.server.domains.QTenant;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.FeatureFlagMigrationHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.solutions.EnvManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static com.appsmith.server.constants.MigrationStatus.COMPLETED;
import static com.appsmith.server.constants.MigrationStatus.IN_PROGRESS;
import static com.appsmith.server.exceptions.AppsmithErrorCode.FEATURE_FLAG_MIGRATION_FAILURE;
import static com.appsmith.server.featureflags.FeatureFlagEnum.TENANT_TEST_FEATURE;
import static com.appsmith.server.featureflags.FeatureFlagEnum.TEST_FEATURE_2;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;

@SpringBootTest
@ExtendWith(SpringExtension.class)
class TenantServiceCETest {

    @Autowired
    TenantService tenantService;

    @MockBean
    EnvManager envManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserUtils userUtils;

    @Autowired
    MongoOperations mongoOperations;

    @MockBean
    FeatureFlagMigrationHelper featureFlagMigrationHelper;

    TenantConfiguration originalTenantConfiguration;

    @BeforeEach
    public void setup() throws IOException {
        final Tenant tenant = tenantService.getDefaultTenant().block();
        assert tenant != null;
        originalTenantConfiguration = tenant.getTenantConfiguration();
        mongoOperations.updateFirst(
                Query.query(Criteria.where(FieldName.ID).is(tenant.getId())),
                Update.update(fieldName(QTenant.tenant.tenantConfiguration), null),
                Tenant.class);

        // Make api_user super-user to test tenant admin functionality
        // Todo change this to tenant admin once we introduce multitenancy
        userRepository
                .findByEmail("api_user")
                .flatMap(user -> userUtils.makeSuperUser(List.of(user)))
                .block();
    }

    @AfterEach
    public void cleanup() {
        final Tenant tenant = tenantService.getDefaultTenant().block();
        mongoOperations.updateFirst(
                Query.query(Criteria.where(FieldName.ID).is(tenant.getId())),
                Update.update(fieldName(QTenant.tenant.tenantConfiguration), originalTenantConfiguration),
                Tenant.class);
    }

    @Test
    void ensureMapsKey() {
        StepVerifier.create(tenantService.getTenantConfiguration())
                .assertNext(tenant -> {
                    assertThat(tenant.getTenantConfiguration().getGoogleMapsKey())
                            .isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    void setMapsKeyAndGetItBack() {
        final TenantConfiguration changes = new TenantConfiguration();
        changes.setGoogleMapsKey("test-key");

        final Mono<TenantConfiguration> resultMono =
                tenantService.updateDefaultTenantConfiguration(changes).map(Tenant::getTenantConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(tenantConfiguration -> {
                    assertThat(tenantConfiguration.getGoogleMapsKey()).isEqualTo("test-key");
                })
                .verifyComplete();
    }

    @Test
    void setMapsKeyWithoutAuthentication() {
        final TenantConfiguration changes = new TenantConfiguration();
        changes.setGoogleMapsKey("test-key");

        final Mono<?> resultMono = tenantService.updateDefaultTenantConfiguration(changes);

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
        final TenantConfiguration changes = new TenantConfiguration();
        changes.setGoogleMapsKey("test-key");

        final Mono<?> resultMono = tenantService.updateDefaultTenantConfiguration(changes);

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
        StepVerifier.create(tenantService.getTenantConfiguration())
                .assertNext(tenant -> {
                    assertThat(tenant.getTenantConfiguration()).isNotNull();
                    assertThat(tenant.getTenantConfiguration().getLicense()).isNotNull();
                    assertThat(tenant.getTenantConfiguration().getLicense().getPlan())
                            .isEqualTo(LicensePlan.FREE);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    void setEmailVerificationEnabled_WithInvalidSMTPHost_ReturnsError() {
        final TenantConfiguration changes = new TenantConfiguration();
        changes.setEmailVerificationEnabled(TRUE);

        Map<String, String> envVars = new HashMap<>();
        // adding invalid mail host
        envVars.put("APPSMITH_MAIL_HOST", "");

        // mocking env vars file
        Mockito.when(envManager.getAllNonEmpty()).thenReturn(Mono.just(envVars));

        final Mono<TenantConfiguration> resultMono = tenantService
                .updateDefaultTenantConfiguration(changes)
                .then(tenantService.getTenantConfiguration())
                .map(Tenant::getTenantConfiguration);

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
        final TenantConfiguration changes = new TenantConfiguration();
        changes.setEmailVerificationEnabled(TRUE);

        Map<String, String> envVars = new HashMap<>();
        // adding valid mail host
        envVars.put("APPSMITH_MAIL_HOST", "smtp.sendgrid.net");

        // mocking env vars file
        Mockito.when(envManager.getAllNonEmpty()).thenReturn(Mono.just(envVars));

        final Mono<TenantConfiguration> resultMono = tenantService
                .updateDefaultTenantConfiguration(changes)
                .then(tenantService.getTenantConfiguration())
                .map(Tenant::getTenantConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(tenantConfiguration -> {
                    assertThat(tenantConfiguration.isEmailVerificationEnabled()).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    void setEmailVerificationEnabledFalseAndGetItBack() {
        final TenantConfiguration changes = new TenantConfiguration();
        changes.setEmailVerificationEnabled(Boolean.FALSE);

        final Mono<TenantConfiguration> resultMono = tenantService
                .updateDefaultTenantConfiguration(changes)
                .then(tenantService.getTenantConfiguration())
                .map(Tenant::getTenantConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(tenantConfiguration -> {
                    assertThat(tenantConfiguration.isEmailVerificationEnabled()).isFalse();
                })
                .verifyComplete();
    }

    @Test
    void checkAndExecuteMigrationsForTenantFeatureFlags_emptyMigrationMap_revertSameTenant() {
        Mockito.when(featureFlagMigrationHelper.checkAndExecuteMigrationsForFeatureFlag(any(), any()))
                .thenReturn(Mono.just(TRUE));

        Tenant tenant = new Tenant();
        tenant.setId(UUID.randomUUID().toString());
        TenantConfiguration config = new TenantConfiguration();
        config.setFeaturesWithPendingMigration(new HashMap<>());
        tenant.setTenantConfiguration(config);
        final Mono<Tenant> resultMono = tenantService.checkAndExecuteMigrationsForTenantFeatureFlags(tenant);
        StepVerifier.create(resultMono)
                .assertNext(tenant1 -> {
                    assertThat(tenant1).isEqualTo(tenant);
                    assertThat(tenant1.getTenantConfiguration().getFeaturesWithPendingMigration())
                            .isEmpty();
                    assertThat(tenant1.getTenantConfiguration().getMigrationStatus())
                            .isEqualTo(COMPLETED);
                })
                .verifyComplete();
    }

    @Test
    void checkAndExecuteMigrationsForTenantFeatureFlags_withPendingMigration_getUpdatedTenant() {
        Mockito.when(featureFlagMigrationHelper.checkAndExecuteMigrationsForFeatureFlag(any(), any()))
                .thenReturn(Mono.just(TRUE));

        Tenant tenant = new Tenant();
        tenant.setId(UUID.randomUUID().toString());
        TenantConfiguration config = new TenantConfiguration();
        Map<FeatureFlagEnum, FeatureMigrationType> featureMigrationTypeMap = new HashMap<>();
        config.setFeaturesWithPendingMigration(featureMigrationTypeMap);
        featureMigrationTypeMap.put(TENANT_TEST_FEATURE, FeatureMigrationType.ENABLE);
        featureMigrationTypeMap.put(TEST_FEATURE_2, FeatureMigrationType.DISABLE);
        tenant.setTenantConfiguration(config);
        final Mono<Tenant> resultMono = tenantService.checkAndExecuteMigrationsForTenantFeatureFlags(tenant);
        StepVerifier.create(resultMono)
                .assertNext(tenant1 -> {
                    assertThat(tenant1.getTenantConfiguration().getFeaturesWithPendingMigration())
                            .isEmpty();
                    assertThat(tenant1.getTenantConfiguration().getMigrationStatus())
                            .isEqualTo(COMPLETED);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    void
            checkAndExecuteMigrationsForTenantFeatureFlags_withPendingMigration_exceptionWhileRunningMigration_getUpdatedTenant() {
        Mockito.when(featureFlagMigrationHelper.checkAndExecuteMigrationsForFeatureFlag(any(), any()))
                .thenReturn(Mono.just(TRUE))
                .thenReturn(Mono.just(FALSE));

        Tenant tenant = new Tenant();
        tenant.setId(UUID.randomUUID().toString());
        TenantConfiguration config = new TenantConfiguration();
        Map<FeatureFlagEnum, FeatureMigrationType> featureMigrationTypeMap = new HashMap<>();
        config.setFeaturesWithPendingMigration(featureMigrationTypeMap);
        featureMigrationTypeMap.put(TENANT_TEST_FEATURE, FeatureMigrationType.DISABLE);
        featureMigrationTypeMap.put(TEST_FEATURE_2, FeatureMigrationType.ENABLE);
        tenant.setTenantConfiguration(config);
        final Mono<Tenant> resultMono = tenantService.checkAndExecuteMigrationsForTenantFeatureFlags(tenant);

        // Verify that the feature flag migration failure is thrown
        StepVerifier.create(resultMono)
                .expectErrorSatisfies(throwable -> {
                    assertThat(throwable instanceof AppsmithException).isTrue();
                    assertThat(((AppsmithException) throwable).getAppErrorCode())
                            .isEqualTo(FEATURE_FLAG_MIGRATION_FAILURE.getCode());
                })
                .verify();

        // Verify that the tenant is updated for the feature flag migration failure
        StepVerifier.create(tenantService.getById(tenant.getId()))
                .assertNext(updatedTenant -> {
                    assertThat(updatedTenant
                                    .getTenantConfiguration()
                                    .getFeaturesWithPendingMigration()
                                    .size())
                            .isEqualTo(1);
                    assertThat(updatedTenant.getTenantConfiguration().getMigrationStatus())
                            .isEqualTo(IN_PROGRESS);
                })
                .verifyComplete();
    }
}
