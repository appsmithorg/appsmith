package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.LicenseOrigin;
import com.appsmith.server.domains.License;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserApiKey;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.DisconnectProvisioningDto;
import com.appsmith.server.dtos.ProvisionResourceDto;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.ApiKeyRepository;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.DELETE_USERS;
import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;
import static com.appsmith.server.acl.AclPermission.READ_USERS;
import static com.appsmith.server.acl.AclPermission.RESET_PASSWORD_USERS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@Slf4j
@ExtendWith(SpringExtension.class)
@SpringBootTest
class ProvisionServiceImplTest {

    @Autowired
    UserService userService;

    @Autowired
    UserGroupService userGroupService;

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    ProvisionService provisionService;

    @Autowired
    TenantService tenantService;

    @Autowired
    PolicyGenerator policyGenerator;

    @Autowired
    ApiKeyRepository apiKeyRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserGroupRepository userGroupRepository;

    @Autowired
    UserUtils userUtils;

    private License defaultLicense;

    @BeforeEach
    public void beforeSetup() {
        User apiUser = userRepository.findByEmail("api_user").block();
        userUtils.makeSuperUser(List.of(apiUser)).block();
        Tenant tenant = tenantService.getDefaultTenant().block();
        defaultLicense = tenant.getTenantConfiguration().getLicense();
    }

    @AfterEach
    void afterSetup() {
        Tenant tenant = tenantService.getDefaultTenant().block();
        tenant.getTenantConfiguration().setLicense(defaultLicense);
        tenantService.save(tenant).block();
    }

    private void setTenantLicenseAsSelfServe() {
        License mockLicense = new License();
        mockLicense.setActive(Boolean.TRUE);
        mockLicense.setOrigin(LicenseOrigin.SELF_SERVE);
        Tenant tenant = tenantService.getDefaultTenant().block();
        tenant.getTenantConfiguration().setLicense(mockLicense);
        tenantService.save(tenant).block();
    }

    private void setTenantLicenseAsEnterprise() {
        License mockLicense = new License();
        mockLicense.setActive(Boolean.TRUE);
        mockLicense.setOrigin(LicenseOrigin.ENTERPRISE);
        Tenant tenant = tenantService.getDefaultTenant().block();
        tenant.getTenantConfiguration().setLicense(mockLicense);
        tenantService.save(tenant).block();
    }

    private void setTenantLicenseAsAirGapped() {
        License mockLicense = new License();
        mockLicense.setActive(Boolean.TRUE);
        mockLicense.setOrigin(LicenseOrigin.AIR_GAP);
        Tenant tenant = tenantService.getDefaultTenant().block();
        tenant.getTenantConfiguration().setLicense(mockLicense);
        tenantService.save(tenant).block();
    }

    private void setTenantLicenseAsNull() {
        Tenant tenant = tenantService.getDefaultTenant().block();
        tenant.getTenantConfiguration().setLicense(null);
        tenantService.save(tenant).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testDisconnectProvisioning_keepProvisionedUsersAndGroups() {
        setTenantLicenseAsEnterprise();
        String testName = "testDisconnectProvisioning_keepProvisionedUsersAndGroups";
        PermissionGroup instanceAdminRole =
                userUtils.getSuperAdminPermissionGroup().block();
        PermissionGroup provisioningRole = userUtils.getProvisioningRole().block();
        String provisionToken = provisionService.generateProvisionToken().block();
        String provisionTokenId = apiKeyRepository
                .findByApiKey(provisionToken)
                .map(UserApiKey::getId)
                .block();
        Tenant tenant = tenantService.getDefaultTenant().block();
        User user1 = new User();
        user1.setEmail(testName + "_provisionedUser1");
        ProvisionResourceDto provisionedUser1 =
                userService.createProvisionUser(user1).block();
        Optional<Policy> optionalResetPasswordPolicy1 = provisionedUser1.getResource().getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(RESET_PASSWORD_USERS.getValue()))
                .findFirst();
        assertThat(optionalResetPasswordPolicy1.isPresent()).isTrue();
        assertThat(optionalResetPasswordPolicy1.get().getPermissionGroups()).hasSize(1);
        String userManagementRoleId1 = optionalResetPasswordPolicy1.get().getPermissionGroups().stream()
                .findFirst()
                .get();
        PermissionGroup userManagementRole1 =
                permissionGroupService.findById(userManagementRoleId1).block();
        User user2 = new User();
        user2.setEmail(testName + "_provisionedUser2");
        ProvisionResourceDto provisionedUser2 =
                userService.createProvisionUser(user2).block();
        Optional<Policy> optionalResetPasswordPolicy2 = provisionedUser2.getResource().getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(RESET_PASSWORD_USERS.getValue()))
                .findFirst();
        assertThat(optionalResetPasswordPolicy2.isPresent()).isTrue();
        assertThat(optionalResetPasswordPolicy2.get().getPermissionGroups()).hasSize(1);
        String userManagementRoleId2 = optionalResetPasswordPolicy2.get().getPermissionGroups().stream()
                .findFirst()
                .get();
        PermissionGroup userManagementRole2 =
                permissionGroupService.findById(userManagementRoleId2).block();

        UserGroup userGroup1 = new UserGroup();
        userGroup1.setName(testName + "_provisionedGroup1");
        ProvisionResourceDto provisionedGroup1 =
                userGroupService.createProvisionGroup(userGroup1).block();
        UserGroup userGroup2 = new UserGroup();
        userGroup2.setName(testName + "_provisionedGroup2");
        ProvisionResourceDto provisionedGroup2 =
                userGroupService.createProvisionGroup(userGroup2).block();

        PermissionGroup role1 = new PermissionGroup();
        role1.setAssignedToUserIds(Set.of(
                provisionedUser1.getResource().getId(),
                provisionedUser2.getResource().getId()));
        role1.setAssignedToGroupIds(Set.of(
                provisionedGroup1.getResource().getId(),
                provisionedGroup2.getResource().getId()));
        PermissionGroup createdRole1 = permissionGroupService
                .createCustomPermissionGroup(role1)
                .flatMap(roleViewDTO -> permissionGroupService.getById(roleViewDTO.getId()))
                .block();
        assertThat(createdRole1.getAssignedToUserIds())
                .containsExactlyInAnyOrder(
                        provisionedUser1.getResource().getId(),
                        provisionedUser2.getResource().getId());
        assertThat(createdRole1.getAssignedToGroupIds())
                .containsExactlyInAnyOrder(
                        provisionedGroup1.getResource().getId(),
                        provisionedGroup2.getResource().getId());

        DisconnectProvisioningDto disconnectProvisioningDto = DisconnectProvisioningDto.builder()
                .keepAllProvisionedResources(true)
                .build();
        Boolean provisioningDisconnected = provisionService
                .disconnectProvisioning(disconnectProvisioningDto)
                .block();
        assertThat(provisioningDisconnected).isTrue();

        User provisionedUser1AfterDisconnectingProvisioning =
                userRepository.findById(provisionedUser1.getResource().getId()).block();
        User provisionedUser2AfterDisconnectingProvisioning =
                userRepository.findById(provisionedUser2.getResource().getId()).block();

        assertThat(provisionedUser1AfterDisconnectingProvisioning).isNotNull();
        assertThat(provisionedUser1AfterDisconnectingProvisioning.getIsProvisioned())
                .isFalse();
        assertThat(provisionedUser2AfterDisconnectingProvisioning).isNotNull();
        assertThat(provisionedUser2AfterDisconnectingProvisioning.getIsProvisioned())
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

        Policy manageUserPolicy2 = Policy.builder()
                .permission(MANAGE_USERS.getValue())
                .permissionGroups(Set.of(userManagementRole2.getId()))
                .build();
        Policy readUserPolicy2 = Policy.builder()
                .permission(READ_USERS.getValue())
                .permissionGroups(
                        Set.of(userManagementRole2.getId(), instanceAdminRole.getId(), provisioningRole.getId()))
                .build();
        Policy resetPasswordPolicy2 = Policy.builder()
                .permission(RESET_PASSWORD_USERS.getValue())
                .permissionGroups(Set.of(userManagementRole2.getId()))
                .build();
        Policy deleteUserPolicy2 = Policy.builder()
                .permission(DELETE_USERS.getValue())
                .permissionGroups(Set.of(instanceAdminRole.getId()))
                .build();

        assertThat(provisionedUser1AfterDisconnectingProvisioning.getPolicies())
                .containsAll(Set.of(manageUserPolicy1, readUserPolicy1, resetPasswordPolicy1, deleteUserPolicy1));
        assertThat(provisionedUser2AfterDisconnectingProvisioning.getPolicies())
                .containsAll(Set.of(manageUserPolicy2, readUserPolicy2, resetPasswordPolicy2, deleteUserPolicy2));

        UserGroup provisionedGroup1AfterDisconnectingProvisioning = userGroupRepository
                .findById(provisionedGroup1.getResource().getId())
                .block();
        UserGroup provisionedGroup2AfterDisconnectingProvisioning = userGroupRepository
                .findById(provisionedGroup2.getResource().getId())
                .block();

        assertThat(provisionedGroup1AfterDisconnectingProvisioning).isNotNull();
        assertThat(provisionedGroup1AfterDisconnectingProvisioning.getIsProvisioned())
                .isFalse();
        assertThat(provisionedGroup2AfterDisconnectingProvisioning).isNotNull();
        assertThat(provisionedGroup2AfterDisconnectingProvisioning.getIsProvisioned())
                .isFalse();

        Set<Policy> userGroupPolicies =
                policyGenerator.getAllChildPolicies(tenant.getPolicies(), Tenant.class, UserGroup.class);

        assertThat(provisionedGroup1AfterDisconnectingProvisioning.getPolicies())
                .containsAll(userGroupPolicies);
        assertThat(provisionedGroup2AfterDisconnectingProvisioning.getPolicies())
                .containsAll(userGroupPolicies);

        PermissionGroup updatedRole1 =
                permissionGroupService.getById(createdRole1.getId()).block();
        assertThat(updatedRole1.getAssignedToUserIds())
                .containsExactlyInAnyOrder(
                        provisionedUser1AfterDisconnectingProvisioning.getId(),
                        provisionedUser2AfterDisconnectingProvisioning.getId());
        assertThat(updatedRole1.getAssignedToGroupIds())
                .containsExactlyInAnyOrder(
                        provisionedGroup1AfterDisconnectingProvisioning.getId(),
                        provisionedGroup2AfterDisconnectingProvisioning.getId());

        UserApiKey provisionUserApiKey =
                apiKeyRepository.findById(provisionTokenId).block();
        assertThat(provisionUserApiKey).isNull();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testDisconnectProvisioning_deleteProvisionedUsersAndGroups() {
        setTenantLicenseAsEnterprise();
        String testName = "testDisconnectProvisioning_keepProvisionedUsersAndGroups";
        String provisionToken = provisionService.generateProvisionToken().block();
        String provisionTokenId = apiKeyRepository
                .findByApiKey(provisionToken)
                .map(UserApiKey::getId)
                .block();
        User user1 = new User();
        user1.setEmail(testName + "_provisionedUser1");
        ProvisionResourceDto provisionedUser1 =
                userService.createProvisionUser(user1).block();
        User user2 = new User();
        user2.setEmail(testName + "_provisionedUser2");
        ProvisionResourceDto provisionedUser2 =
                userService.createProvisionUser(user2).block();

        UserGroup userGroup1 = new UserGroup();
        userGroup1.setName(testName + "_provisionedGroup1");
        ProvisionResourceDto provisionedGroup1 =
                userGroupService.createProvisionGroup(userGroup1).block();
        UserGroup userGroup2 = new UserGroup();
        userGroup2.setName(testName + "_provisionedGroup2");
        ProvisionResourceDto provisionedGroup2 =
                userGroupService.createProvisionGroup(userGroup2).block();

        PermissionGroup role1 = new PermissionGroup();
        role1.setAssignedToUserIds(Set.of(
                provisionedUser1.getResource().getId(),
                provisionedUser2.getResource().getId()));
        role1.setAssignedToGroupIds(Set.of(
                provisionedGroup1.getResource().getId(),
                provisionedGroup2.getResource().getId()));
        PermissionGroup createdRole1 = permissionGroupService
                .createCustomPermissionGroup(role1)
                .flatMap(roleViewDTO -> permissionGroupService.getById(roleViewDTO.getId()))
                .block();
        assertThat(createdRole1.getAssignedToUserIds())
                .containsExactlyInAnyOrder(
                        provisionedUser1.getResource().getId(),
                        provisionedUser2.getResource().getId());
        assertThat(createdRole1.getAssignedToGroupIds())
                .containsExactlyInAnyOrder(
                        provisionedGroup1.getResource().getId(),
                        provisionedGroup2.getResource().getId());

        DisconnectProvisioningDto disconnectProvisioningDto = DisconnectProvisioningDto.builder()
                .keepAllProvisionedResources(false)
                .build();
        Boolean provisioningDisconnected = provisionService
                .disconnectProvisioning(disconnectProvisioningDto)
                .block();
        assertThat(provisioningDisconnected).isTrue();

        User provisionedUser1AfterDisconnectingProvisioning =
                userRepository.findById(provisionedUser1.getResource().getId()).block();
        User provisionedUser2AfterDisconnectingProvisioning =
                userRepository.findById(provisionedUser2.getResource().getId()).block();
        assertThat(provisionedUser1AfterDisconnectingProvisioning).isNull();
        assertThat(provisionedUser2AfterDisconnectingProvisioning).isNull();

        UserGroup provisionedGroup1AfterDisconnectingProvisioning = userGroupRepository
                .findById(provisionedGroup1.getResource().getId())
                .block();
        UserGroup provisionedGroup2AfterDisconnectingProvisioning = userGroupRepository
                .findById(provisionedGroup2.getResource().getId())
                .block();
        assertThat(provisionedGroup1AfterDisconnectingProvisioning).isNull();
        assertThat(provisionedGroup2AfterDisconnectingProvisioning).isNull();

        PermissionGroup updatedRole1 =
                permissionGroupService.getById(createdRole1.getId()).block();
        assertThat(updatedRole1.getAssignedToUserIds()).isEmpty();
        assertThat(updatedRole1.getAssignedToGroupIds()).isEmpty();

        UserApiKey provisionUserApiKey =
                apiKeyRepository.findById(provisionTokenId).block();
        assertThat(provisionUserApiKey).isNull();
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testDisconnectProvisioningWithRegularUser_shouldThrowActionIsNotAuthorised() {
        setTenantLicenseAsEnterprise();
        // Add usertest as a superuser along with api_user to perform Admin Actions.
        User apiUser = userRepository.findByEmail("api_user").block();
        User userTest = userRepository.findByEmail("usertest@usertest.com").block();
        userUtils.makeSuperUser(List.of(apiUser, userTest)).block();

        // Create Provision Token
        String provisionToken = provisionService.generateProvisionToken().block();
        String provisionTokenId = apiKeyRepository
                .findByApiKey(provisionToken)
                .map(UserApiKey::getId)
                .block();
        // Remove userTest as a superuser to not allow it to perform Admin Actions.
        userUtils.removeSuperUser(List.of(userTest)).block();
        // Disconnect provision
        // Should throw an error.
        AppsmithException unauthorisedException = assertThrows(AppsmithException.class, () -> {
            provisionService
                    .disconnectProvisioning(DisconnectProvisioningDto.builder()
                            .keepAllProvisionedResources(Boolean.TRUE)
                            .build())
                    .block();
        });
        assertThat(unauthorisedException.getMessage())
                .isEqualTo(AppsmithError.ACTION_IS_NOT_AUTHORIZED.getMessage("disconnect provisioning"));

        // Cleanup post test
        apiKeyRepository.archiveById(provisionTokenId).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGenerateToken_shouldThrowErrorForNonEnterpriseInstance() {
        setTenantLicenseAsSelfServe();
        AppsmithException enterpriseFeatureException = assertThrows(
                AppsmithException.class,
                () -> provisionService.generateProvisionToken().block());
        assertThat(enterpriseFeatureException.getMessage())
                .isEqualTo(AppsmithError.LICENSE_UPGRADE_REQUIRED.getMessage(LicenseOrigin.ENTERPRISE.name()));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGenerateToken_shouldThrowErrorLicenseNull() {
        setTenantLicenseAsNull();
        AppsmithException enterpriseFeatureException = assertThrows(
                AppsmithException.class,
                () -> provisionService.generateProvisionToken().block());
        assertThat(enterpriseFeatureException.getMessage())
                .isEqualTo(AppsmithError.LICENSE_UPGRADE_REQUIRED.getMessage(LicenseOrigin.ENTERPRISE.name()));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGenerateToken_shouldCreateTokenEnterpriseInstance() {
        setTenantLicenseAsEnterprise();
        String provisionToken = provisionService.generateProvisionToken().block();
        assertThat(provisionToken).isNotBlank();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGenerateToken_shouldCreateTokenAirGapInstance() {
        setTenantLicenseAsAirGapped();
        String provisionToken = provisionService.generateProvisionToken().block();
        assertThat(provisionToken).isNotBlank();
    }
}
