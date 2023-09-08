package com.appsmith.server.services.ee;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.configurations.WithMockAppsmithUser;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.ProvisionResourceDto;
import com.appsmith.server.dtos.UserForManagementDTO;
import com.appsmith.server.dtos.UserUpdateDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserGroupService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.util.LinkedMultiValueMap;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.DELETE_USERS;
import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;
import static com.appsmith.server.acl.AclPermission.MANAGE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.READ_USERS;
import static com.appsmith.server.acl.AclPermission.READ_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.RESET_PASSWORD_USERS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@Slf4j
@ExtendWith(SpringExtension.class)
@SpringBootTest
public class UserServiceTest {

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserService userService;

    @Autowired
    UserUtils userUtils;

    @Autowired
    UserGroupService userGroupService;

    @Autowired
    UserGroupRepository userGroupRepository;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    PolicyGenerator policyGenerator;

    @Autowired
    UserAndAccessManagementService userAndAccessManagementService;

    @Autowired
    CacheableRepositoryHelper cacheableRepositoryHelper;

    @Autowired
    TenantService tenantService;

    @MockBean
    FeatureFlagService featureFlagService;

    User api_user = null;
    User admin_user = null;

    Set<String> superAdminIds;

    String superAdminPermissionGroupId = null;

    @BeforeEach
    public void setup() {
        mockFeatureFlag(FeatureFlagEnum.license_audit_logs_enabled, false);

        api_user = userRepository.findByEmail("api_user").block();

        // Create a new user
        User newUser = new User();
        newUser.setEmail(UUID.randomUUID() + "@email.com");
        newUser.setPassword("password");
        admin_user = userService.create(newUser).block();

        superAdminIds = Set.of(api_user.getId(), admin_user.getId());

        // Make api_user instance administrator before starting the tests
        userUtils.makeSuperUser(List.of(api_user, admin_user)).block();

        if (superAdminPermissionGroupId == null) {
            superAdminPermissionGroupId =
                    userUtils.getSuperAdminPermissionGroup().block().getId();
        }
    }

    private void mockFeatureFlag(FeatureFlagEnum featureFlagEnum, boolean value) {
        Mockito.when(featureFlagService.check(Mockito.eq(featureFlagEnum))).thenReturn(Mono.just(value));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testNonAdminReturnNonAdminInProfile() {

        // First assert that api_user is a super admin
        StepVerifier.create(userService.buildUserProfileDTO(api_user))
                .assertNext(userProfileDTO -> {
                    assertThat(userProfileDTO.getUsername()).isEqualTo("api_user");
                    assertThat(userProfileDTO.isSuperUser()).isTrue();
                    assertThat(userProfileDTO.isAdminSettingsVisible()).isTrue();
                })
                .verifyComplete();

        // First make the api_user a non-admin
        userUtils.removeSuperUser(List.of(api_user)).block();

        StepVerifier.create(userService.buildUserProfileDTO(api_user))
                .assertNext(userProfileDTO -> {
                    assertThat(userProfileDTO.getUsername()).isEqualTo("api_user");
                    assertThat(userProfileDTO.isSuperUser()).isFalse();
                    assertThat(userProfileDTO.isAdminSettingsVisible()).isFalse();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testNonAdminReturnAdminInProfile_givenReadGroup() {

        UserGroup userGroup = new UserGroup();
        String name = "Test Group testNonAdminReturnAdminInProfile_givenReadGroup";
        String description = "Test Group Description testNonAdminReturnAdminInProfile_givenReadGroup";
        userGroup.setName(name);
        userGroup.setDescription(description);

        UserGroup createdGroup = userGroupService
                .createGroup(userGroup)
                // Assert that the created role is also editable by the user who created it
                .flatMap(userGroup1 -> userGroupService.findById(userGroup1.getId(), MANAGE_USER_GROUPS))
                .block();

        PermissionGroup permissionGroup = new PermissionGroup();
        name = "Test Role testNonAdminReturnAdminInProfile_givenReadGroup";
        description = "Test Role Description testNonAdminReturnAdminInProfile_givenReadGroup";
        permissionGroup.setName(name);
        permissionGroup.setDescription(description);

        PermissionGroup createdPermissionGroup =
                permissionGroupService.create(permissionGroup).block();

        // Give read permission to the group for this permission group
        Policy readPolicy = createdGroup.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(READ_USER_GROUPS.getValue()))
                .findFirst()
                .get();
        readPolicy.getPermissionGroups().add(createdPermissionGroup.getId());
        userGroupRepository.save(createdGroup).block();
        // Assign the permission group to api_user
        createdPermissionGroup.getAssignedToUserIds().add(api_user.getId());
        permissionGroupRepository.save(createdPermissionGroup).block();

        // Now make the api_user a non-admin
        userUtils.removeSuperUser(List.of(api_user)).block();

        // Since the user now has access to read the created group, the user should be marked as super admin
        StepVerifier.create(userService.buildUserProfileDTO(api_user))
                .assertNext(userProfileDTO -> {
                    assertThat(userProfileDTO.getUsername()).isEqualTo("api_user");
                    assertThat(userProfileDTO.isSuperUser()).isFalse();
                    assertThat(userProfileDTO.isAdminSettingsVisible()).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "anonymousUser")
    public void validUserCreate_defaultRoleAssigned_cancelledMidway() {
        User user = new User();
        String email = UUID.randomUUID() + "@email.com";
        user.setEmail(email);
        user.setPassword("TestPassword");

        userService.userCreate(user, false).timeout(Duration.ofMillis(5)).subscribe();

        // Sleep for user creation to finish before proceeding ahead.
        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }

        User createdUser = userRepository.findByEmail(email).block();

        Mono<PermissionGroup> defaultUserPermissionGroupMono = userUtils.getDefaultUserPermissionGroup();

        StepVerifier.create(defaultUserPermissionGroupMono)
                .assertNext(defaultUserPermissionGroup -> {
                    assertThat(defaultUserPermissionGroup.getAssignedToUserIds())
                            .contains(createdUser.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testCreateUserInstanceAdminRoleHasDeleteUserPermission() {
        String testName = "testCreateUserInstanceAdminRoleHasDeleteUserPermission";
        User user = new User();
        user.setEmail(testName + "@test.com");
        user.setPassword(testName);
        User createdUser = userService.userCreate(user, false).block();
        String instanceAdminRoleId = userUtils
                .getSuperAdminPermissionGroup()
                .map(PermissionGroup::getId)
                .block();
        Optional<Policy> deleteUserPolicy = createdUser.getPolicies().stream()
                .filter(policy -> DELETE_USERS.getValue().equals(policy.getPermission()))
                .findFirst();
        Optional<Policy> readUserPolicy = createdUser.getPolicies().stream()
                .filter(policy -> READ_USERS.getValue().equals(policy.getPermission()))
                .findFirst();
        Optional<Policy> manageUserPolicy = createdUser.getPolicies().stream()
                .filter(policy -> MANAGE_USERS.getValue().equals(policy.getPermission()))
                .findFirst();
        Optional<Policy> resetPasswordUserPolicy = createdUser.getPolicies().stream()
                .filter(policy -> RESET_PASSWORD_USERS.getValue().equals(policy.getPermission()))
                .findFirst();
        assertThat(deleteUserPolicy.isPresent()).isTrue();
        assertThat(deleteUserPolicy.get().getPermissionGroups()).contains(instanceAdminRoleId);
        assertThat(readUserPolicy.isPresent()).isTrue();
        assertThat(readUserPolicy.get().getPermissionGroups()).contains(instanceAdminRoleId);
        assertThat(manageUserPolicy.isPresent()).isTrue();
        assertThat(manageUserPolicy.get().getPermissionGroups()).doesNotContain(instanceAdminRoleId);
        assertThat(resetPasswordUserPolicy.isPresent()).isTrue();
        assertThat(resetPasswordUserPolicy.get().getPermissionGroups()).doesNotContain(instanceAdminRoleId);
    }

    @Test
    @WithMockAppsmithUser
    public void createNewUserValid() {
        User newUser = new User();
        newUser.setEmail("createnewuservalid-new-user-email@email.com");
        newUser.setPassword("new-user-test-password");

        Mono<User> userCreateMono = userService.create(newUser).cache();

        Mono<PermissionGroup> permissionGroupMono = userCreateMono.flatMap(user -> {
            Set<Policy> userPolicies = user.getPolicies();
            assertThat(userPolicies.size()).isNotZero();
            Policy policy = userPolicies.stream()
                    .filter(policy1 -> policy1.getPermission().equals(RESET_PASSWORD_USERS.getValue()))
                    .findFirst()
                    .get();
            String permissionGroupId =
                    policy.getPermissionGroups().stream().findFirst().get();

            return permissionGroupRepository.findById(permissionGroupId);
        });
        Mono<PermissionGroup> instanceAdminRoleMono = userUtils.getSuperAdminPermissionGroup();
        Mono<PermissionGroup> provisionRoleMono = userUtils.getProvisioningRole();

        StepVerifier.create(Mono.zip(userCreateMono, permissionGroupMono, instanceAdminRoleMono, provisionRoleMono))
                .assertNext(tuple -> {
                    User user = tuple.getT1();
                    PermissionGroup permissionGroup = tuple.getT2();
                    PermissionGroup instanceAdminRole = tuple.getT3();
                    PermissionGroup provisionRole = tuple.getT4();

                    assertThat(user).isNotNull();
                    assertThat(user.getId()).isNotNull();
                    assertThat(user.getEmail()).isEqualTo("createnewuservalid-new-user-email@email.com");
                    assertThat(user.getName()).isNullOrEmpty();
                    assertThat(user.getTenantId()).isNotNull();

                    Set<Policy> userPolicies = user.getPolicies();
                    assertThat(userPolicies).isNotEmpty();
                    Policy manageUserPolicy = Policy.builder()
                            .permission(MANAGE_USERS.getValue())
                            .permissionGroups(Set.of(permissionGroup.getId()))
                            .build();

                    Policy readUserPolicy = Policy.builder()
                            .permission(READ_USERS.getValue())
                            .permissionGroups(
                                    Set.of(permissionGroup.getId(), instanceAdminRole.getId(), provisionRole.getId()))
                            .build();

                    Policy resetPasswordPolicy = Policy.builder()
                            .permission(RESET_PASSWORD_USERS.getValue())
                            .permissionGroups(Set.of(permissionGroup.getId()))
                            .build();

                    Policy deleteUserPolicy = Policy.builder()
                            .permission(DELETE_USERS.getValue())
                            .permissionGroups(Set.of(instanceAdminRole.getId()))
                            .build();

                    assertThat(userPolicies)
                            .containsAll(
                                    Set.of(manageUserPolicy, readUserPolicy, resetPasswordPolicy, deleteUserPolicy));
                    assertThat(permissionGroup.getAssignedToUserIds()).containsAll(Set.of(user.getId()));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "provisioningUser")
    public void createProvisionedUser_checkUserPermissions() {
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.TRUE);
        String testName = "createProvisionedUser_checkUserPermissions";
        String instanceAdminRoleId = userUtils
                .getSuperAdminPermissionGroup()
                .map(PermissionGroup::getId)
                .block();

        String provisioningRoleId =
                userUtils.getProvisioningRole().map(PermissionGroup::getId).block();

        User user = new User();
        user.setEmail(testName + "@appsmith.com");
        ProvisionResourceDto provisionedUser =
                userService.createProvisionUser(user).block();

        User createdProvisionedUser = (User) provisionedUser.getResource();
        Set<Policy> userPolicies = createdProvisionedUser.getPolicies();
        Optional<Policy> readUserPolicy = userPolicies.stream()
                .filter(policy -> policy.getPermission().equals(READ_USERS.getValue()))
                .findAny();
        Optional<Policy> manageUserPolicy = userPolicies.stream()
                .filter(policy -> policy.getPermission().equals(MANAGE_USERS.getValue()))
                .findAny();
        Optional<Policy> deleteUserPolicy = userPolicies.stream()
                .filter(policy -> policy.getPermission().equals(DELETE_USERS.getValue()))
                .findAny();
        Optional<Policy> resetPasswordUserPolicy = userPolicies.stream()
                .filter(policy -> policy.getPermission().equals(RESET_PASSWORD_USERS.getValue()))
                .findAny();

        assertThat(resetPasswordUserPolicy.isPresent()).isTrue();

        String userManagementRoleId = resetPasswordUserPolicy.get().getPermissionGroups().stream()
                .findAny()
                .get();

        assertThat(readUserPolicy.isPresent()).isTrue();
        assertThat(readUserPolicy.get().getPermissionGroups())
                .contains(instanceAdminRoleId, provisioningRoleId, userManagementRoleId);

        assertThat(manageUserPolicy.isPresent()).isTrue();
        assertThat(manageUserPolicy.get().getPermissionGroups()).contains(provisioningRoleId);
        assertThat(manageUserPolicy.get().getPermissionGroups())
                .doesNotContain(instanceAdminRoleId, userManagementRoleId);

        assertThat(deleteUserPolicy.isPresent()).isTrue();
        assertThat(deleteUserPolicy.get().getPermissionGroups()).contains(provisioningRoleId);
        assertThat(deleteUserPolicy.get().getPermissionGroups())
                .doesNotContain(instanceAdminRoleId, userManagementRoleId);

        userRepository.deleteById(createdProvisionedUser.getId()).block();
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.FALSE);
    }

    @Test
    @WithUserDetails("api_user")
    public void deleteRegularUserAsInstanceAdmin_userShouldGetDeleted() {
        String testName = "deleteRegularUserAsInstanceAdmin_userShouldGetDeleted";

        User user = new User();
        user.setEmail(testName + "@appsmith.com");
        User createdUser = userService.userCreate(user, false).block();
        Boolean block =
                userAndAccessManagementService.deleteUser(createdUser.getId()).block();

        User deletedUser = userRepository.findById(createdUser.getId()).block();
        assertThat(deletedUser).isNull();
    }

    @Test
    @WithUserDetails("api_user")
    public void deleteProvisionedUserAsInstanceAdmin_throwUnauthorisedError() {
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.TRUE);
        String testName = "deleteProvisionedUserAsInstanceAdmin_throwUnauthorisedError";

        User user = new User();
        user.setEmail(testName + "@appsmith.com");
        ProvisionResourceDto createdUser = userService.createProvisionUser(user).block();

        AppsmithException unauthorisedException = assertThrows(AppsmithException.class, () -> {
            userAndAccessManagementService
                    .deleteProvisionUser(createdUser.getResource().getId())
                    .block();
        });
        assertThat(unauthorisedException.getMessage()).isEqualTo(AppsmithError.UNAUTHORIZED_ACCESS.getMessage());

        userRepository.deleteById(createdUser.getResource().getId()).block();
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.FALSE);
    }

    @Test
    @WithUserDetails("api_user")
    public void createRegularUser_convertToProvisionUser_deleteUser_throwUnauthorisedError() {
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.TRUE);
        String testName = "createRegularUser_convertToProvisionUser_deleteUser_throwUnauthorisedError";
        PermissionGroup instanceAdminRole =
                userUtils.getSuperAdminPermissionGroup().block();
        PermissionGroup provisioningRole = userUtils.getProvisioningRole().block();
        String tenantId = tenantService.getDefaultTenantId().block();
        // Associate api_user with Provisioning Role. (api_user becomes Provisioning User & Instance Admin)
        provisioningRole.getAssignedToUserIds().add(api_user.getId());
        permissionGroupRepository.save(provisioningRole).block();
        cacheableRepositoryHelper
                .evictPermissionGroupsUser("api_user", tenantId)
                .block();
        // Associate api_user with Provisioning Role.(api_user becomes Provisioning User & Instance Admin)

        User user = new User();
        user.setEmail(testName + "@appsmith.com");
        User createdUser = userService.userCreate(user, false).block();

        UserUpdateDTO userUpdateDto = new UserUpdateDTO();
        userUpdateDto.setName("test name");
        ProvisionResourceDto updatedProvisionedUser = userService
                .updateProvisionUser(createdUser.getId(), userUpdateDto)
                .block();
        User updatedUser = (User) updatedProvisionedUser.getResource();
        assertThat(updatedUser.getIsProvisioned()).isTrue();

        Set<Policy> userPolicies = updatedProvisionedUser.getResource().getPolicies();
        Optional<Policy> readUserPolicy = userPolicies.stream()
                .filter(policy -> policy.getPermission().equals(READ_USERS.getValue()))
                .findAny();

        Optional<Policy> manageUserPolicy = userPolicies.stream()
                .filter(policy -> policy.getPermission().equals(MANAGE_USERS.getValue()))
                .findAny();

        Optional<Policy> deleteUserPolicy = userPolicies.stream()
                .filter(policy -> policy.getPermission().equals(DELETE_USERS.getValue()))
                .findAny();

        Optional<Policy> resetPasswordUserPolicy = userPolicies.stream()
                .filter(policy -> policy.getPermission().equals(RESET_PASSWORD_USERS.getValue()))
                .findAny();

        assertThat(resetPasswordUserPolicy.isPresent()).isTrue();

        String userManagementRoleId = resetPasswordUserPolicy.get().getPermissionGroups().stream()
                .findAny()
                .get();

        assertThat(readUserPolicy.isPresent()).isTrue();
        assertThat(readUserPolicy.get().getPermissionGroups())
                .contains(instanceAdminRole.getId(), provisioningRole.getId(), userManagementRoleId);

        assertThat(manageUserPolicy.isPresent()).isTrue();
        assertThat(manageUserPolicy.get().getPermissionGroups()).contains(provisioningRole.getId());
        assertThat(manageUserPolicy.get().getPermissionGroups())
                .doesNotContain(instanceAdminRole.getId(), userManagementRoleId);

        assertThat(deleteUserPolicy.isPresent()).isTrue();
        assertThat(deleteUserPolicy.get().getPermissionGroups()).contains(provisioningRole.getId());
        assertThat(deleteUserPolicy.get().getPermissionGroups())
                .doesNotContain(instanceAdminRole.getId(), userManagementRoleId);

        // Disassociate api_user with Provisioning Role. (api_user becomes Instance Admin only)
        provisioningRole.getAssignedToUserIds().remove(api_user.getId());
        permissionGroupRepository.save(provisioningRole).block();
        cacheableRepositoryHelper
                .evictPermissionGroupsUser("api_user", tenantId)
                .block();
        // Disassociate api_user with Provisioning Role. (api_user becomes Instance Admin only)

        AppsmithException unauthorisedException = assertThrows(AppsmithException.class, () -> {
            userAndAccessManagementService
                    .deleteProvisionUser(updatedProvisionedUser.getResource().getId())
                    .block();
        });
        assertThat(unauthorisedException.getMessage()).isEqualTo(AppsmithError.UNAUTHORIZED_ACCESS.getMessage());

        userRepository.deleteById(updatedProvisionedUser.getResource().getId()).block();
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.FALSE);
    }

    @Test
    @WithUserDetails("provisioningUser")
    public void createRegularUser_convertToProvisionUser_deleteUserWithProvisioningRole_deleteUserSuccessfully() {
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.TRUE);
        String testName =
                "createRegularUser_convertToProvisionUser_deleteUserWithProvisioningRole_deleteUserSuccessfully";
        PermissionGroup instanceAdminRole =
                userUtils.getSuperAdminPermissionGroup().block();
        PermissionGroup provisioningRole = userUtils.getProvisioningRole().block();

        User user = new User();
        user.setEmail(testName + "@appsmith.com");
        User createdUser = userService.userCreate(user, false).block();

        UserUpdateDTO userUpdateDto = new UserUpdateDTO();
        userUpdateDto.setName("test name");
        ProvisionResourceDto updatedProvisionedUser = userService
                .updateProvisionUser(createdUser.getId(), userUpdateDto)
                .block();
        User updatedUser = (User) updatedProvisionedUser.getResource();
        assertThat(updatedUser.getIsProvisioned()).isTrue();

        Set<Policy> userPolicies = updatedProvisionedUser.getResource().getPolicies();
        Optional<Policy> readUserPolicy = userPolicies.stream()
                .filter(policy -> policy.getPermission().equals(READ_USERS.getValue()))
                .findAny();

        Optional<Policy> manageUserPolicy = userPolicies.stream()
                .filter(policy -> policy.getPermission().equals(MANAGE_USERS.getValue()))
                .findAny();

        Optional<Policy> deleteUserPolicy = userPolicies.stream()
                .filter(policy -> policy.getPermission().equals(DELETE_USERS.getValue()))
                .findAny();

        Optional<Policy> resetPasswordUserPolicy = userPolicies.stream()
                .filter(policy -> policy.getPermission().equals(RESET_PASSWORD_USERS.getValue()))
                .findAny();

        assertThat(resetPasswordUserPolicy.isPresent()).isTrue();

        String userManagementRoleId = resetPasswordUserPolicy.get().getPermissionGroups().stream()
                .findAny()
                .get();

        assertThat(readUserPolicy.isPresent()).isTrue();
        assertThat(readUserPolicy.get().getPermissionGroups())
                .contains(instanceAdminRole.getId(), provisioningRole.getId(), userManagementRoleId);

        assertThat(manageUserPolicy.isPresent()).isTrue();
        assertThat(manageUserPolicy.get().getPermissionGroups()).contains(provisioningRole.getId());
        assertThat(manageUserPolicy.get().getPermissionGroups())
                .doesNotContain(instanceAdminRole.getId(), userManagementRoleId);

        assertThat(deleteUserPolicy.isPresent()).isTrue();
        assertThat(deleteUserPolicy.get().getPermissionGroups()).contains(provisioningRole.getId());
        assertThat(deleteUserPolicy.get().getPermissionGroups())
                .doesNotContain(instanceAdminRole.getId(), userManagementRoleId);

        userAndAccessManagementService
                .deleteProvisionUser(updatedProvisionedUser.getResource().getId())
                .block();
        User deletedUser = userRepository.findById(createdUser.getId()).block();
        assertThat(deletedUser).isNull();
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.FALSE);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createProvisionedUser_RegularUser_getAllUsersShouldReturnBoth_toApiUser() {
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.TRUE);
        String testName = "createProvisionedUser_RegularUser_getAllUsersShouldReturnBoth_toApiUser";
        User user1 = new User();
        user1.setEmail(testName + "_Regular@appsmith.com");
        User regularUser = userService.userCreate(user1, false).block();

        User user2 = new User();
        user2.setEmail(testName + "_Provisioned@appsmith.com");
        ProvisionResourceDto provisionUser =
                userService.createProvisionUser(user2).block();

        List<UserForManagementDTO> allUsers = userAndAccessManagementService
                .getAllUsers(new LinkedMultiValueMap<>())
                .block();
        Optional<UserForManagementDTO> regularUserFetched = allUsers.stream()
                .filter(user -> user.getUsername().equalsIgnoreCase(testName + "_Regular@appsmith.com"))
                .findAny();
        assertThat(regularUserFetched.isPresent()).isTrue();
        Optional<UserForManagementDTO> provisionUserFetched = allUsers.stream()
                .filter(user -> user.getUsername().equalsIgnoreCase(testName + "_Provisioned@appsmith.com"))
                .findAny();
        assertThat(provisionUserFetched.isPresent()).isTrue();
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.FALSE);
    }

    @Test
    @WithUserDetails(value = "provisioningUser")
    public void createProvisionedUser_RegularUser_getAllUsersShouldReturnBoth_toProvisioningUser() {
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.TRUE);
        String testName = "createProvisionedUser_RegularUser_getAllUsersShouldReturnBoth_toProvisioningUser";
        User user1 = new User();
        user1.setEmail(testName + "_Regular@appsmith.com");
        User regularUser = userService.userCreate(user1, false).block();

        User user2 = new User();
        user2.setEmail(testName + "_Provisioned@appsmith.com");
        ProvisionResourceDto provisionUser =
                userService.createProvisionUser(user2).block();

        List<UserForManagementDTO> allUsers = userAndAccessManagementService
                .getAllUsers(new LinkedMultiValueMap<>())
                .block();
        Optional<UserForManagementDTO> regularUserFetched = allUsers.stream()
                .filter(user -> user.getUsername().equalsIgnoreCase(testName + "_Regular@appsmith.com"))
                .findAny();
        assertThat(regularUserFetched.isPresent()).isTrue();
        Optional<UserForManagementDTO> provisionUserFetched = allUsers.stream()
                .filter(user -> user.getUsername().equalsIgnoreCase(testName + "_Provisioned@appsmith.com"))
                .findAny();
        assertThat(provisionUserFetched.isPresent()).isTrue();
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.FALSE);
    }

    @Test
    @WithUserDetails(value = "provisioningUser")
    public void createProvisionedUser_updateEmail_shouldHaveSameUserId_nameShouldNotGetUpdated() {
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.TRUE);
        String testName = "createProvisionedUser_updateEmail_shouldHaveSameUserId";
        User user = new User();
        user.setEmail(testName + "_Provisioned@appsmith.com");
        user.setName(testName);
        ProvisionResourceDto provisionUser =
                userService.createProvisionUser(user).block();

        UserUpdateDTO userUpdateDTO = new UserUpdateDTO();
        userUpdateDTO.setEmail(testName + "_UpdatedProvisioned@appsmith.com");
        userUpdateDTO.setName("");
        ProvisionResourceDto updatedProvisionUser = userService
                .updateProvisionUser(provisionUser.getResource().getId(), userUpdateDTO)
                .block();

        User userWithUpdatedEmail = userRepository
                .findByCaseInsensitiveEmail(testName + "_UpdatedProvisioned@appsmith.com")
                .block();

        assertThat(userWithUpdatedEmail.getId())
                .isEqualTo(provisionUser.getResource().getId());
        assertThat(userWithUpdatedEmail.getName()).isEqualTo(testName);
        assertThat(((User) updatedProvisionUser.getResource()).getEmail())
                .isEqualToIgnoringCase(testName + "_UpdatedProvisioned@appsmith.com");
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.FALSE);
    }

    @Test
    @WithUserDetails(value = "provisioningUser")
    public void createProvisionedUser_updateName_shouldHaveSameUserId_nameShouldGetUpdated() {
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.TRUE);
        String testName = "createProvisionedUser_updateName_shouldHaveSameUserId_nameShouldGetUpdated";
        User user = new User();
        user.setEmail(testName + "_Provisioned@appsmith.com");
        user.setName(testName);
        ProvisionResourceDto provisionUser =
                userService.createProvisionUser(user).block();

        UserUpdateDTO userUpdateDTO = new UserUpdateDTO();
        userUpdateDTO.setEmail("");
        userUpdateDTO.setName(testName + "_updated");
        ProvisionResourceDto updatedProvisionUser = userService
                .updateProvisionUser(provisionUser.getResource().getId(), userUpdateDTO)
                .block();

        User userWithEmail = userRepository
                .findByCaseInsensitiveEmail(testName + "_Provisioned@appsmith.com")
                .block();

        assertThat(userWithEmail.getId()).isEqualTo(provisionUser.getResource().getId());
        assertThat(userWithEmail.getName()).isEqualTo(testName + "_updated");
        assertThat(((User) updatedProvisionUser.getResource()).getEmail())
                .isEqualToIgnoringCase(testName + "_Provisioned@appsmith.com");
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.FALSE);
    }
}
