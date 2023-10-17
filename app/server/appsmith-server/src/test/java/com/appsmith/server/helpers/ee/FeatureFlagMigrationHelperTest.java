package com.appsmith.server.helpers.ee;

import com.appsmith.external.models.Policy;
import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FeatureMigrationType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.LicenseOrigin;
import com.appsmith.server.domains.License;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserApiKey;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.ProvisionResourceDto;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.FeatureFlagMigrationHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.ApiKeyRepository;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.ProvisionService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserGroupService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.EnvManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.DELETE_USERS;
import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;
import static com.appsmith.server.acl.AclPermission.READ_USERS;
import static com.appsmith.server.acl.AclPermission.RESET_PASSWORD_USERS;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_FORM_LOGIN_DISABLED;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

@SpringBootTest
@ExtendWith(SpringExtension.class)
@DirtiesContext
class FeatureFlagMigrationHelperEETest {

    @Autowired
    FeatureFlagMigrationHelper featureFlagMigrationHelper;

    @Autowired
    TenantService tenantService;

    @Autowired
    UserService userService;

    @Autowired
    UserUtils userUtils;

    @Autowired
    ProvisionService provisionService;

    @Autowired
    EncryptionService encryptionService;

    @Autowired
    ApiKeyRepository apiKeyRepository;

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    UserGroupService userGroupService;

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserGroupRepository userGroupRepository;

    @Autowired
    PolicyGenerator policyGenerator;

    @SpyBean
    FeatureFlagService featureFlagService;

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
        assertTrue(tenant.getTenantConfiguration().getIsRestartRequired());

        // Assert if the user is made pristine to make sure form login is enabled for the user after the migration is
        // completed
        StepVerifier.create(userService.findByEmail(userEmail))
                .assertNext(user1 -> {
                    assertEquals(LoginSource.FORM, user1.getSource());
                    assertEquals(Boolean.FALSE, user1.getIsEnabled());
                })
                .verifyComplete();
    }

    private void setTenantLicenseAsEnterprise() {
        License mockLicense = new License();
        mockLicense.setActive(Boolean.TRUE);
        mockLicense.setOrigin(LicenseOrigin.ENTERPRISE);
        Tenant tenant = tenantService.getDefaultTenant().block();
        tenant.getTenantConfiguration().setLicense(mockLicense);
        tenantService.save(tenant).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void executeMigrationsBasedOnFeatureFlag_provisionUserUnderScim_disableScim_userObjectIsMadePristine() {
        Mockito.when(featureFlagService.check(FeatureFlagEnum.license_gac_enabled))
                .thenReturn(Mono.just(true));
        // superuser required for doing SCIM provisioning
        User apiUser = userRepository.findByEmail("api_user").block();
        userUtils.makeSuperUser(List.of(apiUser)).block();

        String testName =
                "executeMigrationsBasedOnFeatureFlag_provisionUserUnderScim_disableScim_userObjectIsMadePristine";
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_scim_enabled)))
                .thenReturn(Mono.just(true));

        Tenant tenant = tenantService.getDefaultTenant().block();
        TenantConfiguration tenantConfiguration =
                tenant != null ? tenant.getTenantConfiguration() : new TenantConfiguration();
        Map<FeatureFlagEnum, FeatureMigrationType> featuresWithPendingMigration = new HashMap<>();
        featuresWithPendingMigration.put(FeatureFlagEnum.license_scim_enabled, FeatureMigrationType.DISABLE);
        tenantConfiguration.setFeaturesWithPendingMigration(featuresWithPendingMigration);
        assert tenant != null : "Tenant should not be null";
        tenant.setTenantConfiguration(tenantConfiguration);

        tenantService.save(tenant).block();

        setTenantLicenseAsEnterprise();
        PermissionGroup instanceAdminRole =
                userUtils.getSuperAdminPermissionGroup().block();
        PermissionGroup provisioningRole = userUtils.getProvisioningRole().block();
        String generatedProvisionToken =
                provisionService.generateProvisionToken().block();
        String provisioningUserId = Arrays.stream(encryptionService
                        .decryptString(generatedProvisionToken)
                        .split(FieldName.APIKEY_USERID_DELIMITER))
                .toList()
                .get(1);
        String actualProvisioningToken = Arrays.stream(encryptionService
                        .decryptString(generatedProvisionToken)
                        .split(FieldName.APIKEY_USERID_DELIMITER))
                .toList()
                .get(0);
        String provisionTokenId = apiKeyRepository
                .getByUserIdWithoutPermission(provisioningUserId)
                .filter(fetchedUserApiKey -> fetchedUserApiKey.getApiKey().equals(actualProvisioningToken))
                .single()
                .map(UserApiKey::getId)
                .block();

        tenant = tenantService.getDefaultTenant().block();
        User user1 = new User();
        user1.setEmail(testName + "_provisionedUser1");
        ProvisionResourceDto provisionedUser1 =
                userService.createProvisionUser(user1).block();
        Optional<Policy> optionalResetPasswordPolicy1 = provisionedUser1.getResource().getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(RESET_PASSWORD_USERS.getValue()))
                .findFirst();

        String userManagementRoleId1 = optionalResetPasswordPolicy1.get().getPermissionGroups().stream()
                .findFirst()
                .get();
        PermissionGroup userManagementRole1 =
                permissionGroupService.findById(userManagementRoleId1).block();

        UserGroup userGroup1 = new UserGroup();
        userGroup1.setName(testName + "_provisionedGroup1");
        ProvisionResourceDto provisionedGroup1 =
                userGroupService.createProvisionGroup(userGroup1).block();

        PermissionGroup role1 = new PermissionGroup();
        role1.setAssignedToUserIds(Set.of(provisionedUser1.getResource().getId()));
        role1.setAssignedToGroupIds(Set.of(provisionedGroup1.getResource().getId()));
        PermissionGroup createdRole1 = permissionGroupService
                .createCustomPermissionGroup(role1)
                .flatMap(roleViewDTO -> permissionGroupService.getById(roleViewDTO.getId()))
                .block();

        // before running migration, make api_user non-admin
        userUtils.removeSuperUser(List.of(apiUser)).block();

        // run disable scim migration
        Boolean result = featureFlagMigrationHelper
                .executeMigrationsBasedOnFeatureFlag(tenant, FeatureFlagEnum.license_scim_enabled)
                .block();

        // The result should be true as the migration is successful
        assertEquals(Boolean.TRUE, result);

        User provisionedUser1AfterDisconnectingProvisioning =
                userRepository.findById(provisionedUser1.getResource().getId()).block();

        assertThat(provisionedUser1AfterDisconnectingProvisioning).isNotNull();
        assertThat(provisionedUser1AfterDisconnectingProvisioning.getIsProvisioned())
                .isFalse();

        Policy manageUserPolicy1 = Policy.builder()
                .permission(MANAGE_USERS.getValue())
                .permissionGroups(Set.of(userManagementRole1.getId()))
                .build();
        Policy readUserPolicy1 = Policy.builder()
                .permission(READ_USERS.getValue())
                .permissionGroups(
                        Set.of(userManagementRole1.getId(), instanceAdminRole.getId(), provisioningRole.getId()))
                .build();
        Policy resetPasswordPolicy1 = Policy.builder()
                .permission(RESET_PASSWORD_USERS.getValue())
                .permissionGroups(Set.of(userManagementRole1.getId()))
                .build();
        Policy deleteUserPolicy1 = Policy.builder()
                .permission(DELETE_USERS.getValue())
                .permissionGroups(Set.of(instanceAdminRole.getId()))
                .build();

        assertThat(provisionedUser1AfterDisconnectingProvisioning.getPolicies())
                .containsAll(Set.of(manageUserPolicy1, readUserPolicy1, resetPasswordPolicy1, deleteUserPolicy1));

        UserGroup provisionedGroup1AfterDisconnectingProvisioning = userGroupRepository
                .findById(provisionedGroup1.getResource().getId())
                .block();

        assertThat(provisionedGroup1AfterDisconnectingProvisioning).isNotNull();
        assertThat(provisionedGroup1AfterDisconnectingProvisioning.getIsProvisioned())
                .isFalse();

        Set<Policy> userGroupPolicies =
                policyGenerator.getAllChildPolicies(tenant.getPolicies(), Tenant.class, UserGroup.class);
        assertThat(provisionedGroup1AfterDisconnectingProvisioning.getPolicies())
                .containsAll(userGroupPolicies);

        PermissionGroup updatedRole1 =
                permissionGroupService.getById(createdRole1.getId()).block();
        assertThat(updatedRole1.getAssignedToUserIds())
                .containsExactlyInAnyOrder(provisionedUser1AfterDisconnectingProvisioning.getId());
        assertThat(updatedRole1.getAssignedToGroupIds())
                .containsExactlyInAnyOrder(provisionedGroup1AfterDisconnectingProvisioning.getId());

        UserApiKey provisionUserApiKey =
                apiKeyRepository.findById(provisionTokenId).block();
        assertThat(provisionUserApiKey).isNull();
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
        assertTrue(tenant.getTenantConfiguration().getIsRestartRequired());

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

    @Test
    void executeMigrationsBasedOnFeatureFlag_disableOidcFlag_restartRequiredFieldIsRetained() {
        Tenant tenant = tenantService.getDefaultTenant().block();
        TenantConfiguration tenantConfiguration =
                tenant != null ? tenant.getTenantConfiguration() : new TenantConfiguration();
        Map<FeatureFlagEnum, FeatureMigrationType> featuresWithPendingMigration = new HashMap<>();
        featuresWithPendingMigration.put(FeatureFlagEnum.license_sso_oidc_enabled, FeatureMigrationType.DISABLE);
        tenantConfiguration.setFeaturesWithPendingMigration(featuresWithPendingMigration);
        assert tenant != null : "Tenant should not be null";
        tenant.setTenantConfiguration(tenantConfiguration);
        tenant.getTenantConfiguration().setIsRestartRequired(true);

        tenant = tenantService.save(tenant).block();
        Boolean result = featureFlagMigrationHelper
                .executeMigrationsBasedOnFeatureFlag(tenant, FeatureFlagEnum.license_sso_oidc_enabled)
                .block();
        // The result should be true as the migration is successful
        assertEquals(Boolean.TRUE, result);
        assertTrue(tenant.getTenantConfiguration().getIsRestartRequired());

        tenant.getTenantConfiguration().setIsRestartRequired(false);
        tenantService.save(tenant).block();

        Mockito.when(envManager.getAllWithoutAclCheck()).thenReturn(Mono.just(Map.of()));
        result = featureFlagMigrationHelper
                .executeMigrationsBasedOnFeatureFlag(tenant, FeatureFlagEnum.license_sso_oidc_enabled)
                .block();
        // The result should be true as the migration is successful
        assertEquals(Boolean.TRUE, result);
        assertFalse(tenant.getTenantConfiguration().getIsRestartRequired());

        tenant.getTenantConfiguration().setIsRestartRequired(null);
        tenantService.save(tenant).block();
    }

    @Test
    void executeMigrationsBasedOnFeatureFlag_disableSAMLFlag_restartRequiredFieldIsRetained() {
        Tenant tenant = tenantService.getDefaultTenant().block();
        TenantConfiguration tenantConfiguration =
                tenant != null ? tenant.getTenantConfiguration() : new TenantConfiguration();
        Map<FeatureFlagEnum, FeatureMigrationType> featuresWithPendingMigration = new HashMap<>();
        featuresWithPendingMigration.put(FeatureFlagEnum.license_sso_saml_enabled, FeatureMigrationType.DISABLE);
        tenantConfiguration.setFeaturesWithPendingMigration(featuresWithPendingMigration);
        assert tenant != null : "Tenant should not be null";
        tenant.setTenantConfiguration(tenantConfiguration);

        tenant = tenantService.save(tenant).block();
        Boolean result = featureFlagMigrationHelper
                .executeMigrationsBasedOnFeatureFlag(tenant, FeatureFlagEnum.license_sso_saml_enabled)
                .block();
        // The result should be true as the migration is successful
        assertEquals(Boolean.TRUE, result);
        assertTrue(tenant.getTenantConfiguration().getIsRestartRequired());

        tenant.getTenantConfiguration().setIsRestartRequired(false);
        tenantService.save(tenant).block();

        Mockito.when(envManager.getAllWithoutAclCheck()).thenReturn(Mono.just(Map.of()));

        result = featureFlagMigrationHelper
                .executeMigrationsBasedOnFeatureFlag(tenant, FeatureFlagEnum.license_sso_saml_enabled)
                .block();
        // The result should be true as the migration is successful
        assertEquals(Boolean.TRUE, result);
        assertFalse(tenant.getTenantConfiguration().getIsRestartRequired());

        tenant.getTenantConfiguration().setIsRestartRequired(null);
        tenantService.save(tenant).block();
    }

    @Test
    void executeMigrationsBasedOnFeatureFlag_runSSOMigration_formLoginEnabled_restartIsNotRequired() {

        // Mock the envManager to return true for form login disabled
        Mockito.when(envManager.getAllWithoutAclCheck())
                .thenReturn(Mono.just(Map.of(APPSMITH_FORM_LOGIN_DISABLED.toString(), "false")));
        Tenant tenant = tenantService.getDefaultTenant().block();
        TenantConfiguration tenantConfiguration =
                tenant != null ? tenant.getTenantConfiguration() : new TenantConfiguration();
        Map<FeatureFlagEnum, FeatureMigrationType> featuresWithPendingMigration = new HashMap<>();
        featuresWithPendingMigration.put(FeatureFlagEnum.license_sso_oidc_enabled, FeatureMigrationType.DISABLE);
        tenantConfiguration.setFeaturesWithPendingMigration(featuresWithPendingMigration);
        assert tenant != null : "Tenant should not be null";
        tenant.setTenantConfiguration(tenantConfiguration);

        tenant = tenantService.save(tenant).block();
        Boolean result = featureFlagMigrationHelper
                .executeMigrationsBasedOnFeatureFlag(tenant, FeatureFlagEnum.license_sso_oidc_enabled)
                .block();
        // The result should be true as the migration is successful
        assertEquals(Boolean.TRUE, result);
        assertNull(tenant.getTenantConfiguration().getIsRestartRequired());
    }
}
