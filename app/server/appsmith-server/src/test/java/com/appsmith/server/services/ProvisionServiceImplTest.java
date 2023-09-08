package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.LicenseOrigin;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.License;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserApiKey;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.DisconnectProvisioningDto;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.ProvisionResourceDto;
import com.appsmith.server.dtos.ProvisionStatusDTO;
import com.appsmith.server.enums.ProvisionStatus;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.ApiKeyRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.IntStream;

import static com.appsmith.server.acl.AclPermission.DELETE_USERS;
import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;
import static com.appsmith.server.acl.AclPermission.READ_USERS;
import static com.appsmith.server.acl.AclPermission.RESET_PASSWORD_USERS;
import static com.appsmith.server.constants.ce.FieldNameCE.VIEWER;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@Slf4j
@ExtendWith(SpringExtension.class)
@SpringBootTest
@AutoConfigureWebTestClient
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class ProvisionServiceImplTest {

    @Autowired
    UserService userService;

    @Autowired
    UserGroupService userGroupService;

    @Autowired
    UserAndAccessManagementService userAndAccessManagementService;

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    ProvisionService provisionService;

    @Autowired
    TenantService tenantService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    PolicyGenerator policyGenerator;

    @Autowired
    ApiKeyRepository apiKeyRepository;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserGroupRepository userGroupRepository;

    @Autowired
    UserUtils userUtils;

    @Autowired
    WebTestClient webTestClient;

    @Autowired
    EncryptionService encryptionService;

    @MockBean
    FeatureFlagService featureFlagService;

    private License defaultLicense;

    @BeforeEach
    public void beforeSetup() {
        User apiUser = userRepository.findByEmail("api_user").block();
        userUtils.makeSuperUser(List.of(apiUser)).block();
        Tenant tenant = tenantService.getDefaultTenant().block();
        defaultLicense = tenant.getTenantConfiguration().getLicense();
        Mockito.when(featureFlagService.check(Mockito.eq(FeatureFlagEnum.license_scim_enabled)))
                .thenReturn(Mono.just(Boolean.TRUE));
        Mockito.when(featureFlagService.check(Mockito.eq(FeatureFlagEnum.release_datasource_environments_enabled)))
                .thenReturn(Mono.just(Boolean.FALSE));
        Mockito.when(featureFlagService.check(Mockito.eq(FeatureFlagEnum.license_audit_logs_enabled)))
                .thenReturn(Mono.just(Boolean.FALSE));
    }

    @AfterEach
    void afterSetup() {
        Tenant tenant = tenantService.getDefaultTenant().block();
        tenant.getTenantConfiguration().setLicense(defaultLicense);
        tenantService.save(tenant).block();
        Mockito.when(featureFlagService.check(Mockito.any())).thenReturn(Mono.just(Boolean.FALSE));
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

    private void mockFeatureFlag(FeatureFlagEnum featureFlagEnum, boolean value) {
        Mockito.when(featureFlagService.check(Mockito.eq(featureFlagEnum))).thenReturn(Mono.just(value));
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testDisconnectProvisioning_keepProvisionedUsersAndGroups_checkProvisioningStatusAtEveryStep() {
        String testName = "testDisconnectProvisioning_keepProvisionedUsersAndGroups_checkProvisioningStatusAtEveryStep";
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

        ProvisionStatusDTO provisionStatusAfterGeneratingProvisionToken =
                provisionService.getProvisionStatus().block();

        assertThat(provisionStatusAfterGeneratingProvisionToken).isNotNull();
        assertThat(provisionStatusAfterGeneratingProvisionToken.getProvisionStatus())
                .isEqualTo(ProvisionStatus.INACTIVE.getValue());
        assertThat(provisionStatusAfterGeneratingProvisionToken.getConfiguredStatus())
                .isTrue();
        assertThat(provisionStatusAfterGeneratingProvisionToken.getLastUpdatedAt())
                .isNull();
        assertThat(provisionStatusAfterGeneratingProvisionToken.getProvisionedUsers())
                .isZero();
        assertThat(provisionStatusAfterGeneratingProvisionToken.getProvisionedGroups())
                .isZero();

        Instant timeBeforeProvisioningUser1 = Instant.now();
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

        ProvisionStatusDTO provisionStatusAfterProvisioningUser1 =
                provisionService.getProvisionStatus().block();

        assertThat(provisionStatusAfterProvisioningUser1).isNotNull();
        assertThat(provisionStatusAfterProvisioningUser1.getProvisionStatus())
                .isEqualTo(ProvisionStatus.ACTIVE.getValue());
        assertThat(provisionStatusAfterProvisioningUser1.getLastUpdatedAt()).isNotNull();
        assertThat(Instant.parse(provisionStatusAfterProvisioningUser1.getLastUpdatedAt()))
                .isAfter(timeBeforeProvisioningUser1);
        assertThat(Instant.parse(provisionStatusAfterProvisioningUser1.getLastUpdatedAt()))
                .isBefore(Instant.now());
        assertThat(provisionStatusAfterProvisioningUser1.getProvisionedUsers()).isEqualTo(1);
        assertThat(provisionStatusAfterProvisioningUser1.getProvisionedGroups()).isZero();

        Instant timeBeforeProvisioningUser2 = Instant.now();
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

        ProvisionStatusDTO provisionStatusAfterProvisioningUser2 =
                provisionService.getProvisionStatus().block();

        assertThat(provisionStatusAfterProvisioningUser2).isNotNull();
        assertThat(provisionStatusAfterProvisioningUser2.getProvisionStatus())
                .isEqualTo(ProvisionStatus.ACTIVE.getValue());
        assertThat(provisionStatusAfterProvisioningUser2.getLastUpdatedAt()).isNotNull();
        assertThat(Instant.parse(provisionStatusAfterProvisioningUser2.getLastUpdatedAt()))
                .isAfter(timeBeforeProvisioningUser2);
        assertThat(Instant.parse(provisionStatusAfterProvisioningUser2.getLastUpdatedAt()))
                .isBefore(Instant.now());
        assertThat(provisionStatusAfterProvisioningUser2.getProvisionedUsers()).isEqualTo(2);
        assertThat(provisionStatusAfterProvisioningUser2.getProvisionedGroups()).isZero();

        Instant timeBeforeProvisioningGroup1 = Instant.now();
        UserGroup userGroup1 = new UserGroup();
        userGroup1.setName(testName + "_provisionedGroup1");
        ProvisionResourceDto provisionedGroup1 =
                userGroupService.createProvisionGroup(userGroup1).block();

        ProvisionStatusDTO provisionStatusAfterProvisioningGroup1 =
                provisionService.getProvisionStatus().block();

        assertThat(provisionStatusAfterProvisioningGroup1).isNotNull();
        assertThat(provisionStatusAfterProvisioningGroup1.getProvisionStatus())
                .isEqualTo(ProvisionStatus.ACTIVE.getValue());
        assertThat(provisionStatusAfterProvisioningGroup1.getLastUpdatedAt()).isNotNull();
        assertThat(Instant.parse(provisionStatusAfterProvisioningGroup1.getLastUpdatedAt()))
                .isAfter(timeBeforeProvisioningGroup1);
        assertThat(Instant.parse(provisionStatusAfterProvisioningGroup1.getLastUpdatedAt()))
                .isBefore(Instant.now());
        assertThat(provisionStatusAfterProvisioningGroup1.getProvisionedUsers()).isEqualTo(2);
        assertThat(provisionStatusAfterProvisioningGroup1.getProvisionedGroups())
                .isEqualTo(1);

        Instant timeBeforeProvisioningGroup2 = Instant.now();
        UserGroup userGroup2 = new UserGroup();
        userGroup2.setName(testName + "_provisionedGroup2");
        ProvisionResourceDto provisionedGroup2 =
                userGroupService.createProvisionGroup(userGroup2).block();

        ProvisionStatusDTO provisionStatusAfterProvisioningGroup2 =
                provisionService.getProvisionStatus().block();

        assertThat(provisionStatusAfterProvisioningGroup2).isNotNull();
        assertThat(provisionStatusAfterProvisioningGroup2.getProvisionStatus())
                .isEqualTo(ProvisionStatus.ACTIVE.getValue());
        assertThat(provisionStatusAfterProvisioningGroup2.getLastUpdatedAt()).isNotNull();
        assertThat(Instant.parse(provisionStatusAfterProvisioningGroup2.getLastUpdatedAt()))
                .isAfter(timeBeforeProvisioningGroup2);
        assertThat(Instant.parse(provisionStatusAfterProvisioningGroup2.getLastUpdatedAt()))
                .isBefore(Instant.now());
        assertThat(provisionStatusAfterProvisioningGroup2.getProvisionedUsers()).isEqualTo(2);
        assertThat(provisionStatusAfterProvisioningGroup2.getProvisionedGroups())
                .isEqualTo(2);

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

        ProvisionStatusDTO provisionStatusAfterDisconnectingProvisioning =
                provisionService.getProvisionStatus().block();

        assertThat(provisionStatusAfterDisconnectingProvisioning).isNotNull();
        assertThat(provisionStatusAfterDisconnectingProvisioning.getProvisionStatus())
                .isEqualTo(ProvisionStatus.INACTIVE.getValue());
        assertThat(provisionStatusAfterDisconnectingProvisioning.getConfiguredStatus())
                .isFalse();
        assertThat(provisionStatusAfterDisconnectingProvisioning.getLastUpdatedAt())
                .isNull();
        assertThat(provisionStatusAfterDisconnectingProvisioning.getProvisionedUsers())
                .isZero();
        assertThat(provisionStatusAfterDisconnectingProvisioning.getProvisionedGroups())
                .isZero();

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
    void testDisconnectProvisioning_checkProvisioningStatusAtEveryStep_AfterReprovisionKey() {
        String testName = "testDisconnectProvisioning_checkProvisioningStatusAtEveryStep_AfterReprovisionKey";
        setTenantLicenseAsEnterprise();
        provisionService.generateProvisionToken().block();

        ProvisionStatusDTO provisionStatusAfterGeneratingProvisionToken =
                provisionService.getProvisionStatus().block();

        assertThat(provisionStatusAfterGeneratingProvisionToken).isNotNull();
        assertThat(provisionStatusAfterGeneratingProvisionToken.getProvisionStatus())
                .isEqualTo(ProvisionStatus.INACTIVE.getValue());
        assertThat(provisionStatusAfterGeneratingProvisionToken.getConfiguredStatus())
                .isTrue();
        assertThat(provisionStatusAfterGeneratingProvisionToken.getLastUpdatedAt())
                .isNull();
        assertThat(provisionStatusAfterGeneratingProvisionToken.getProvisionedUsers())
                .isZero();
        assertThat(provisionStatusAfterGeneratingProvisionToken.getProvisionedGroups())
                .isZero();

        Instant timeBeforeProvisioningUser1 = Instant.now();
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

        ProvisionStatusDTO provisionStatusAfterProvisioningUser1 =
                provisionService.getProvisionStatus().block();

        assertThat(provisionStatusAfterProvisioningUser1).isNotNull();
        assertThat(provisionStatusAfterProvisioningUser1.getProvisionStatus())
                .isEqualTo(ProvisionStatus.ACTIVE.getValue());
        assertThat(provisionStatusAfterProvisioningUser1.getLastUpdatedAt()).isNotNull();
        assertThat(Instant.parse(provisionStatusAfterProvisioningUser1.getLastUpdatedAt()))
                .isAfter(timeBeforeProvisioningUser1);
        assertThat(Instant.parse(provisionStatusAfterProvisioningUser1.getLastUpdatedAt()))
                .isBefore(Instant.now());
        assertThat(provisionStatusAfterProvisioningUser1.getProvisionedUsers()).isEqualTo(1);
        assertThat(provisionStatusAfterProvisioningUser1.getProvisionedGroups()).isZero();

        provisionService.generateProvisionToken().block();

        ProvisionStatusDTO provisionStatusAfterReGeneratingProvisionToken =
                provisionService.getProvisionStatus().block();

        assertThat(provisionStatusAfterReGeneratingProvisionToken).isNotNull();
        assertThat(provisionStatusAfterReGeneratingProvisionToken.getProvisionStatus())
                .isEqualTo(ProvisionStatus.INACTIVE.getValue());
        assertThat(provisionStatusAfterReGeneratingProvisionToken.getConfiguredStatus())
                .isTrue();
        assertThat(provisionStatusAfterReGeneratingProvisionToken.getLastUpdatedAt())
                .isNotNull();
        assertThat(provisionStatusAfterReGeneratingProvisionToken.getProvisionedUsers())
                .isEqualTo(1);
        assertThat(provisionStatusAfterReGeneratingProvisionToken.getProvisionedGroups())
                .isZero();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testDisconnectProvisioning_deleteProvisionedUsersAndGroups_checkProvisioningStatusAtEveryStep() {
        String testName = "testDisconnectProvisioning_keepProvisionedUsersAndGroups_checkProvisioningStatusAtEveryStep";
        setTenantLicenseAsEnterprise();
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

        ProvisionStatusDTO provisionStatusAfterGeneratingProvisionToken =
                provisionService.getProvisionStatus().block();

        assertThat(provisionStatusAfterGeneratingProvisionToken).isNotNull();
        assertThat(provisionStatusAfterGeneratingProvisionToken.getProvisionStatus())
                .isEqualTo(ProvisionStatus.INACTIVE.getValue());
        assertThat(provisionStatusAfterGeneratingProvisionToken.getConfiguredStatus())
                .isTrue();
        assertThat(provisionStatusAfterGeneratingProvisionToken.getLastUpdatedAt())
                .isNull();
        assertThat(provisionStatusAfterGeneratingProvisionToken.getProvisionedUsers())
                .isZero();
        assertThat(provisionStatusAfterGeneratingProvisionToken.getProvisionedGroups())
                .isZero();

        Instant timeBeforeProvisioningUser1 = Instant.now();
        User user1 = new User();
        user1.setEmail(testName + "_provisionedUser1");
        ProvisionResourceDto provisionedUser1 =
                userService.createProvisionUser(user1).block();

        ProvisionStatusDTO provisionStatusAfterProvisioningUser1 =
                provisionService.getProvisionStatus().block();

        assertThat(provisionStatusAfterProvisioningUser1).isNotNull();
        assertThat(provisionStatusAfterProvisioningUser1.getProvisionStatus())
                .isEqualTo(ProvisionStatus.ACTIVE.getValue());
        assertThat(provisionStatusAfterProvisioningUser1.getLastUpdatedAt()).isNotNull();
        assertThat(Instant.parse(provisionStatusAfterProvisioningUser1.getLastUpdatedAt()))
                .isAfter(timeBeforeProvisioningUser1);
        assertThat(Instant.parse(provisionStatusAfterProvisioningUser1.getLastUpdatedAt()))
                .isBefore(Instant.now());
        assertThat(provisionStatusAfterProvisioningUser1.getProvisionedUsers()).isEqualTo(1);
        assertThat(provisionStatusAfterProvisioningUser1.getProvisionedGroups()).isZero();

        Instant timeBeforeProvisioningUser2 = Instant.now();
        User user2 = new User();
        user2.setEmail(testName + "_provisionedUser2");
        ProvisionResourceDto provisionedUser2 =
                userService.createProvisionUser(user2).block();

        ProvisionStatusDTO provisionStatusAfterProvisioningUser2 =
                provisionService.getProvisionStatus().block();

        assertThat(provisionStatusAfterProvisioningUser2).isNotNull();
        assertThat(provisionStatusAfterProvisioningUser2.getProvisionStatus())
                .isEqualTo(ProvisionStatus.ACTIVE.getValue());
        assertThat(provisionStatusAfterProvisioningUser2.getLastUpdatedAt()).isNotNull();
        assertThat(Instant.parse(provisionStatusAfterProvisioningUser2.getLastUpdatedAt()))
                .isAfter(timeBeforeProvisioningUser2);
        assertThat(Instant.parse(provisionStatusAfterProvisioningUser2.getLastUpdatedAt()))
                .isBefore(Instant.now());
        assertThat(provisionStatusAfterProvisioningUser2.getProvisionedUsers()).isEqualTo(2);
        assertThat(provisionStatusAfterProvisioningUser2.getProvisionedGroups()).isZero();

        Instant timeBeforeProvisioningGroup1 = Instant.now();
        UserGroup userGroup1 = new UserGroup();
        userGroup1.setName(testName + "_provisionedGroup1");
        ProvisionResourceDto provisionedGroup1 =
                userGroupService.createProvisionGroup(userGroup1).block();
        ProvisionStatusDTO provisionStatusAfterProvisioningGroup1 =
                provisionService.getProvisionStatus().block();

        assertThat(provisionStatusAfterProvisioningGroup1).isNotNull();
        assertThat(provisionStatusAfterProvisioningGroup1.getProvisionStatus())
                .isEqualTo(ProvisionStatus.ACTIVE.getValue());
        assertThat(provisionStatusAfterProvisioningGroup1.getLastUpdatedAt()).isNotNull();
        assertThat(Instant.parse(provisionStatusAfterProvisioningGroup1.getLastUpdatedAt()))
                .isAfter(timeBeforeProvisioningGroup1);
        assertThat(Instant.parse(provisionStatusAfterProvisioningGroup1.getLastUpdatedAt()))
                .isBefore(Instant.now());
        assertThat(provisionStatusAfterProvisioningGroup1.getProvisionedUsers()).isEqualTo(2);
        assertThat(provisionStatusAfterProvisioningGroup1.getProvisionedGroups())
                .isEqualTo(1);

        Instant timeBeforeProvisioningGroup2 = Instant.now();
        UserGroup userGroup2 = new UserGroup();
        userGroup2.setName(testName + "_provisionedGroup2");
        ProvisionResourceDto provisionedGroup2 =
                userGroupService.createProvisionGroup(userGroup2).block();
        ProvisionStatusDTO provisionStatusAfterProvisioningGroup2 =
                provisionService.getProvisionStatus().block();

        assertThat(provisionStatusAfterProvisioningGroup2).isNotNull();
        assertThat(provisionStatusAfterProvisioningGroup2.getProvisionStatus())
                .isEqualTo(ProvisionStatus.ACTIVE.getValue());
        assertThat(provisionStatusAfterProvisioningGroup2.getLastUpdatedAt()).isNotNull();
        assertThat(Instant.parse(provisionStatusAfterProvisioningGroup2.getLastUpdatedAt()))
                .isAfter(timeBeforeProvisioningGroup2);
        assertThat(Instant.parse(provisionStatusAfterProvisioningGroup2.getLastUpdatedAt()))
                .isBefore(Instant.now());
        assertThat(provisionStatusAfterProvisioningGroup2.getProvisionedUsers()).isEqualTo(2);
        assertThat(provisionStatusAfterProvisioningGroup2.getProvisionedGroups())
                .isEqualTo(2);

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

        ProvisionStatusDTO provisionStatusAfterDisconnectingProvisioning =
                provisionService.getProvisionStatus().block();

        assertThat(provisionStatusAfterDisconnectingProvisioning).isNotNull();
        assertThat(provisionStatusAfterDisconnectingProvisioning.getProvisionStatus())
                .isEqualTo(ProvisionStatus.INACTIVE.getValue());
        assertThat(provisionStatusAfterDisconnectingProvisioning.getConfiguredStatus())
                .isFalse();
        assertThat(provisionStatusAfterDisconnectingProvisioning.getLastUpdatedAt())
                .isNull();
        assertThat(provisionStatusAfterDisconnectingProvisioning.getProvisionedUsers())
                .isZero();
        assertThat(provisionStatusAfterDisconnectingProvisioning.getProvisionedGroups())
                .isZero();

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
    public void getProvisionStatus_withoutProvisioning_inactiveStatus() {
        ProvisionStatusDTO provisionStatusDTO =
                provisionService.getProvisionStatus().block();

        assertThat(provisionStatusDTO).isNotNull();
        assertThat(provisionStatusDTO.getProvisionStatus()).isEqualTo(ProvisionStatus.INACTIVE.getValue());
        assertThat(provisionStatusDTO.getConfiguredStatus()).isFalse();
        assertThat(provisionStatusDTO.getLastUpdatedAt()).isNull();
        assertThat(provisionStatusDTO.getProvisionedUsers()).isZero();
        assertThat(provisionStatusDTO.getProvisionedGroups()).isZero();
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
    public void getProvisionStatus_provisionTokenGenerated_inactiveStatus() {
        setTenantLicenseAsEnterprise();
        String provisionToken = provisionService.generateProvisionToken().block();
        assertThat(provisionToken).isNotNull();

        ProvisionStatusDTO provisionStatusDTO =
                provisionService.getProvisionStatus().block();

        assertThat(provisionStatusDTO).isNotNull();
        assertThat(provisionStatusDTO.getProvisionStatus()).isEqualTo(ProvisionStatus.INACTIVE.getValue());
        assertThat(provisionStatusDTO.getLastUpdatedAt()).isNull();
        assertThat(provisionStatusDTO.getProvisionedUsers()).isZero();
        assertThat(provisionStatusDTO.getProvisionedGroups()).isZero();
    }

    /**
     * Note: Making rest calls using Provision Token to emulate the Provision User.
     * This will allow the test case to use 2 different users for different purposes.
     * provisionUser to make the provisioning api calls.
     * api_user to get the provisioning status
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void getProvisionStatus_makeGetProvisionedUsersCall_activeStatus() {
        setTenantLicenseAsEnterprise();
        String provisionToken = provisionService.generateProvisionToken().block();
        assertThat(provisionToken).isNotNull();

        Instant timeBeforeProvisionCall = Instant.now();

        // Rest call using provision token
        webTestClient
                .get()
                .uri(Url.PROVISION_USER_URL)
                .header("x-appsmith-key", provisionToken)
                .exchange()
                .expectStatus()
                .isEqualTo(200);

        Instant timeAfterProvisionCall = Instant.now();

        ProvisionStatusDTO provisionStatusDTO =
                provisionService.getProvisionStatus().block();

        assertThat(provisionStatusDTO).isNotNull();
        assertThat(provisionStatusDTO.getProvisionStatus()).isEqualTo(ProvisionStatus.ACTIVE.getValue());
        assertThat(provisionStatusDTO.getLastUpdatedAt()).isNotNull();
        assertThat(Instant.parse(provisionStatusDTO.getLastUpdatedAt())).isAfter(timeBeforeProvisionCall);
        assertThat(Instant.parse(provisionStatusDTO.getLastUpdatedAt())).isBefore(timeAfterProvisionCall);
        assertThat(provisionStatusDTO.getProvisionedUsers()).isZero();
        assertThat(provisionStatusDTO.getProvisionedGroups()).isZero();
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
    public void getProvisionStatus_makeCreateProvisionedUserCall_activeStatus_countUsers1() {
        String testName = "getProvisionStatus_makeCreateProvisionedUserCall_activeStatus_countUsers1";
        setTenantLicenseAsEnterprise();
        String provisionToken = provisionService.generateProvisionToken().block();
        assertThat(provisionToken).isNotNull();

        Instant timeBeforeProvisionCall = Instant.now();

        String createUserBody = "{\"email\": \"" + testName + "@_provisionedUser@appsmith.com" + "\"}";

        // Rest call using provision token
        webTestClient
                .post()
                .uri(Url.PROVISION_USER_URL)
                .header("x-appsmith-key", provisionToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(createUserBody))
                .exchange()
                .expectStatus()
                .isEqualTo(200);

        Instant timeAfterProvisionCall = Instant.now();

        ProvisionStatusDTO provisionStatusDTO =
                provisionService.getProvisionStatus().block();

        assertThat(provisionStatusDTO).isNotNull();
        assertThat(provisionStatusDTO.getProvisionStatus()).isEqualTo(ProvisionStatus.ACTIVE.getValue());
        assertThat(provisionStatusDTO.getLastUpdatedAt()).isNotNull();
        assertThat(Instant.parse(provisionStatusDTO.getLastUpdatedAt())).isAfter(timeBeforeProvisionCall);
        assertThat(Instant.parse(provisionStatusDTO.getLastUpdatedAt())).isBefore(timeAfterProvisionCall);
        assertThat(provisionStatusDTO.getProvisionedUsers()).isEqualTo(1);
        assertThat(provisionStatusDTO.getProvisionedGroups()).isZero();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getProvisionStatus_makeCreateProvisionedGroupCall_activeStatus_countGroup1() {
        String testName = "getProvisionStatus_makeCreateProvisionedGroupCall_activeStatus_countGroup1";
        setTenantLicenseAsEnterprise();
        String provisionToken = provisionService.generateProvisionToken().block();
        assertThat(provisionToken).isNotNull();

        Instant timeBeforeProvisionCall = Instant.now();

        String createGroupBody = "{\"name\": \"" + testName + "\"}";

        // Rest call using provision token
        webTestClient
                .post()
                .uri(Url.PROVISION_GROUP_URL)
                .header("x-appsmith-key", provisionToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(createGroupBody))
                .exchange()
                .expectStatus()
                .isEqualTo(200);

        Instant timeAfterProvisionCall = Instant.now();

        ProvisionStatusDTO provisionStatusDTO =
                provisionService.getProvisionStatus().block();

        assertThat(provisionStatusDTO).isNotNull();
        assertThat(provisionStatusDTO.getProvisionStatus()).isEqualTo(ProvisionStatus.ACTIVE.getValue());
        assertThat(provisionStatusDTO.getLastUpdatedAt()).isNotNull();
        assertThat(Instant.parse(provisionStatusDTO.getLastUpdatedAt())).isAfter(timeBeforeProvisionCall);
        assertThat(Instant.parse(provisionStatusDTO.getLastUpdatedAt())).isBefore(timeAfterProvisionCall);
        assertThat(provisionStatusDTO.getProvisionedUsers()).isZero();
        assertThat(provisionStatusDTO.getProvisionedGroups()).isEqualTo(1);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testProvisioningStatus_disconnectProvisioning_statusShouldBecomeInactive() {
        setTenantLicenseAsEnterprise();
        String provisionToken = provisionService.generateProvisionToken().block();
        assertThat(provisionToken).isNotNull();

        Instant timeBeforeProvisionCall = Instant.now();

        // Rest call using provision token
        webTestClient
                .get()
                .uri(Url.PROVISION_USER_URL)
                .header("x-appsmith-key", provisionToken)
                .exchange()
                .expectStatus()
                .isEqualTo(200);

        Instant timeAfterProvisionCall = Instant.now();

        ProvisionStatusDTO provisionStatusDTO =
                provisionService.getProvisionStatus().block();

        assertThat(provisionStatusDTO).isNotNull();
        assertThat(provisionStatusDTO.getProvisionStatus()).isEqualTo(ProvisionStatus.ACTIVE.getValue());
        assertThat(provisionStatusDTO.getLastUpdatedAt()).isNotNull();
        assertThat(Instant.parse(provisionStatusDTO.getLastUpdatedAt())).isAfter(timeBeforeProvisionCall);
        assertThat(Instant.parse(provisionStatusDTO.getLastUpdatedAt())).isBefore(timeAfterProvisionCall);
        assertThat(provisionStatusDTO.getProvisionedUsers()).isZero();
        assertThat(provisionStatusDTO.getProvisionedGroups()).isZero();

        Boolean disconnectProvisioningStatus = provisionService
                .disconnectProvisioning(DisconnectProvisioningDto.builder()
                        .keepAllProvisionedResources(false)
                        .build())
                .block();

        assertThat(disconnectProvisioningStatus).isTrue();

        Long countProvisionedUsers = userRepository
                .countAllUsersByIsProvisioned(true, Optional.empty())
                .block();
        assertThat(countProvisionedUsers).isZero();

        ProvisionStatusDTO provisionStatusDTOPostDisconnecting =
                provisionService.getProvisionStatus().block();

        assertThat(provisionStatusDTOPostDisconnecting).isNotNull();
        assertThat(provisionStatusDTOPostDisconnecting.getProvisionStatus())
                .isEqualTo(ProvisionStatus.INACTIVE.getValue());
        assertThat(provisionStatusDTOPostDisconnecting.getLastUpdatedAt()).isNull();
        assertThat(provisionStatusDTOPostDisconnecting.getProvisionedUsers()).isZero();
        assertThat(provisionStatusDTOPostDisconnecting.getProvisionedGroups()).isZero();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGenerateToken_shouldCreateTokenAirGapInstance() {
        setTenantLicenseAsAirGapped();
        String provisionToken = provisionService.generateProvisionToken().block();
        assertThat(provisionToken).isNotBlank();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void
            createProvisionUser_assignWorkspaceRoles_deleteProvisioningUser_workspaceRolesShouldNotContainProvisionedUser() {
        String testName =
                "createProvisionUser_assignWorkspaceRoles_deleteProvisioningUser_workspaceRolesShouldNotContainProvisionedUser";
        setTenantLicenseAsEnterprise();
        String provisionToken = provisionService.generateProvisionToken().block();
        assertThat(provisionToken).isNotNull();

        Workspace workspace = new Workspace();
        workspace.setName(testName + "_workspace");

        Workspace createdWorkspace = workspaceService.create(workspace).block();

        String createUserBody = "{\"email\": \"" + testName + "@_provisionedUser@appsmith.com" + "\"}";

        // Rest call using provision token to create provision user
        webTestClient
                .post()
                .uri(Url.PROVISION_USER_URL)
                .header("x-appsmith-key", provisionToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(createUserBody))
                .exchange()
                .expectStatus()
                .isEqualTo(200);

        User provisionedUser = userRepository
                .findByCaseInsensitiveEmail(testName + "@_provisionedUser@appsmith.com")
                .block();

        List<PermissionGroup> defaultRoles = permissionGroupService
                .findAllByIds(createdWorkspace.getDefaultPermissionGroups())
                .collectList()
                .block();

        PermissionGroup appViewerRole = defaultRoles.stream()
                .filter(role -> role.getName().startsWith(VIEWER))
                .findAny()
                .get();

        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        inviteUsersDTO.setUsernames(List.of(testName + "@_provisionedUser@appsmith.com"));
        inviteUsersDTO.setPermissionGroupId(appViewerRole.getId());
        userAndAccessManagementService.inviteUsers(inviteUsersDTO, "test").block();

        PermissionGroup appViewerRolePostInvite =
                permissionGroupRepository.findById(appViewerRole.getId()).block();
        assertThat(appViewerRolePostInvite.getAssignedToUserIds()).contains(provisionedUser.getId());

        // Rest call using provision token to delete provision user
        webTestClient
                .delete()
                .uri(Url.PROVISION_USER_URL + "/" + provisionedUser.getId())
                .header("x-appsmith-key", provisionToken)
                .header("X-Requested-By", "Appsmith")
                .exchange()
                .expectStatus()
                .isEqualTo(200);

        PermissionGroup appViewerRolePostInviteAndDeleteUser =
                permissionGroupRepository.findById(appViewerRole.getId()).block();
        assertThat(appViewerRolePostInviteAndDeleteUser.getAssignedToUserIds()).doesNotContain(provisionedUser.getId());
    }

    @Test
    public void testGeneratedTokenForSpecialCharacters() {
        String mockMongoId = "64c8c209337f08023f96159c";
        IntStream.range(0, 1000000).forEach(i -> {
            String generatedToken = ApiKeyServiceImpl.generateToken(mockMongoId);
            assertThat(generatedToken).doesNotContain(FieldName.APIKEY_USERID_DELIMITER);
        });
    }
}
