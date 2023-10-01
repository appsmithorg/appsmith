package com.appsmith.server.helpers.ee;

import com.appsmith.server.constants.FeatureMigrationType;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.FeatureFlagMigrationHelper;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.EnvManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static com.appsmith.server.constants.EnvVariables.APPSMITH_FORM_LOGIN_DISABLED;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;

@SpringBootTest
@ExtendWith(SpringExtension.class)
@DirtiesContext
class FeatureFlagMigrationHelperTest {

    @Autowired
    FeatureFlagMigrationHelper featureFlagMigrationHelper;

    @Autowired
    TenantService tenantService;

    @Autowired
    UserService userService;

    @MockBean
    EnvManager envManager;

    @BeforeEach
    void setUp() {
        Mockito.when(envManager.getAllWithoutAclCheck())
                .thenReturn(Mono.just(Map.of(APPSMITH_FORM_LOGIN_DISABLED.toString(), "true")));
        Mockito.when(envManager.applyChangesToEnvFileWithoutAclCheck(any()))
                .thenReturn(Mono.just(Map.of(APPSMITH_FORM_LOGIN_DISABLED.toString(), "false")));
    }

    @Test
    void executeMigrationsBasedOnFeatureFlag_disableOidcFlag_userObjectIsMadePristine() {
        Tenant tenant = tenantService.getDefaultTenant().block();
        TenantConfiguration tenantConfiguration =
                tenant != null ? tenant.getTenantConfiguration() : new TenantConfiguration();
        Map<FeatureFlagEnum, FeatureMigrationType> featuresWithPendingMigration = new HashMap<>();
        featuresWithPendingMigration.put(FeatureFlagEnum.license_sso_oidc_enabled, FeatureMigrationType.DISABLE);
        tenantConfiguration.setFeaturesWithPendingMigration(featuresWithPendingMigration);
        assert tenant != null : "Tenant should not be null";
        tenant.setTenantConfiguration(tenantConfiguration);

        tenant = tenantService.save(tenant).block();

        final String userEmail = UUID.randomUUID() + "@example.com";
        User user = new User();
        user.setSource(LoginSource.OIDC);
        user.setTenantId(tenant.getId());
        user.setEmail(userEmail);
        userService.userCreate(user, false).block();

        Boolean result = featureFlagMigrationHelper
                .executeMigrationsBasedOnFeatureFlag(tenant, FeatureFlagEnum.license_sso_oidc_enabled)
                .block();
        // The result should be true as the migration is successful
        assertEquals(Boolean.TRUE, result);

        // Assert if the user is made pristine to make sure form login is enabled for the user after the migration is
        // completed
        StepVerifier.create(userService.findByEmail(userEmail))
                .assertNext(user1 -> {
                    assertEquals(LoginSource.FORM, user1.getSource());
                    assertEquals(Boolean.FALSE, user1.getIsEnabled());
                })
                .verifyComplete();
    }

    @Test
    void executeMigrationsBasedOnFeatureFlag_disableSamlFlag_userObjectIsMadePristine() {
        Tenant tenant = tenantService.getDefaultTenant().block();
        TenantConfiguration tenantConfiguration =
                tenant != null ? tenant.getTenantConfiguration() : new TenantConfiguration();
        Map<FeatureFlagEnum, FeatureMigrationType> featuresWithPendingMigration = new HashMap<>();
        featuresWithPendingMigration.put(FeatureFlagEnum.license_sso_saml_enabled, FeatureMigrationType.DISABLE);
        tenantConfiguration.setFeaturesWithPendingMigration(featuresWithPendingMigration);
        assert tenant != null : "Tenant should not be null";
        tenant.setTenantConfiguration(tenantConfiguration);

        tenant = tenantService.save(tenant).block();

        final String userEmail = UUID.randomUUID() + "@example.com";
        User user = new User();
        user.setSource(LoginSource.KEYCLOAK);
        user.setTenantId(tenant.getId());
        user.setEmail(userEmail);
        userService.userCreate(user, false).block();

        Boolean result = featureFlagMigrationHelper
                .executeMigrationsBasedOnFeatureFlag(tenant, FeatureFlagEnum.license_sso_saml_enabled)
                .block();
        // The result should be true as the migration is successful
        assertEquals(Boolean.TRUE, result);

        // Assert if the user is made pristine to make sure form login is enabled for the user after the migration is
        // completed
        StepVerifier.create(userService.findByEmail(userEmail))
                .assertNext(user1 -> {
                    assertEquals(LoginSource.FORM, user1.getSource());
                    assertEquals(Boolean.FALSE, user1.getIsEnabled());
                })
                .verifyComplete();
    }

    // Test to verify the SAML and OIDC migrations are applied independently
    @Test
    void
            executeMigrationsBasedOnFeatureFlag_disableSamlFlag_enableOidcFlag_userWithKeycloakSourceObjectIsMadePristine() {
        Tenant tenant = tenantService.getDefaultTenant().block();
        TenantConfiguration tenantConfiguration =
                tenant != null ? tenant.getTenantConfiguration() : new TenantConfiguration();
        Map<FeatureFlagEnum, FeatureMigrationType> featuresWithPendingMigration = new HashMap<>();
        featuresWithPendingMigration.put(FeatureFlagEnum.license_sso_saml_enabled, FeatureMigrationType.DISABLE);
        featuresWithPendingMigration.put(FeatureFlagEnum.license_sso_oidc_enabled, FeatureMigrationType.ENABLE);
        tenantConfiguration.setFeaturesWithPendingMigration(featuresWithPendingMigration);
        assert tenant != null : "Tenant should not be null";
        tenant.setTenantConfiguration(tenantConfiguration);

        tenant = tenantService.save(tenant).block();

        final String keycloakUserEmail = UUID.randomUUID() + "@example.com";
        User keycloakTestUser = new User();
        keycloakTestUser.setSource(LoginSource.KEYCLOAK);
        keycloakTestUser.setTenantId(tenant.getId());
        keycloakTestUser.setEmail(keycloakUserEmail);
        userService.userCreate(keycloakTestUser, false).block();

        final String oidcUserEmail = UUID.randomUUID() + "@example.com";
        User user = new User();
        user.setSource(LoginSource.OIDC);
        user.setTenantId(tenant.getId());
        user.setEmail(oidcUserEmail);
        userService.userCreate(user, false).block();

        // Assertions related downgrade migrations for SAML
        Boolean result = featureFlagMigrationHelper
                .executeMigrationsBasedOnFeatureFlag(tenant, FeatureFlagEnum.license_sso_saml_enabled)
                .block();
        // The result should be true as the migration is successful
        assertEquals(Boolean.TRUE, result);

        // Assert if the user is made pristine to make sure form login is enabled for the user after the migration is
        // completed
        StepVerifier.create(userService.findByEmail(keycloakUserEmail))
                .assertNext(user1 -> {
                    assertEquals(LoginSource.FORM, user1.getSource());
                    assertEquals(Boolean.FALSE, user1.getIsEnabled());
                })
                .verifyComplete();

        // Assertions related upgrade migrations for OIDC
        result = featureFlagMigrationHelper
                .executeMigrationsBasedOnFeatureFlag(tenant, FeatureFlagEnum.license_sso_oidc_enabled)
                .block();
        // The result should be true as the migration is successful
        assertEquals(Boolean.TRUE, result);

        // Assert if the user is made pristine to make sure form login is enabled for the user after the migration is
        // completed
        StepVerifier.create(userService.findByEmail(oidcUserEmail))
                .assertNext(user1 -> {
                    assertEquals(LoginSource.OIDC, user1.getSource());
                    assertEquals(Boolean.TRUE, user1.getIsEnabled());
                })
                .verifyComplete();
    }
}
