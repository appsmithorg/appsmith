package com.appsmith.server.services.ee;

import com.appsmith.external.models.Policy;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.ProvisionResourceDto;
import com.appsmith.server.dtos.UpdateGroupMembershipDTO;
import com.appsmith.server.dtos.UserCompactDTO;
import com.appsmith.server.dtos.UserGroupCompactDTO;
import com.appsmith.server.dtos.UserGroupDTO;
import com.appsmith.server.dtos.UserGroupUpdateDTO;
import com.appsmith.server.dtos.UsersForGroupDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserGroupService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
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
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.util.LinkedMultiValueMap;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.ADD_USERS_TO_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.DELETE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.MANAGE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.READ_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.REMOVE_USERS_FROM_USER_GROUPS;
import static com.appsmith.server.constants.QueryParams.PROVISIONED_FILTER;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.AssertionsForClassTypes.fail;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class UserGroupServiceTest {

    @Autowired
    UserGroupService userGroupService;

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserService userService;

    @Autowired
    UserUtils userUtils;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    UserGroupRepository userGroupRepository;

    @Autowired
    UserDataService userDataService;

    @Autowired
    UserAndAccessManagementService userAndAccessManagementService;

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
        userUtils.makeSuperUser(List.of(api_user)).block();

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
    public void createNewGroupAsSuperAdminTest() {

        UserGroup userGroup = new UserGroup();
        String name = "Test Group";
        String description = "Test Group Description";
        userGroup.setName(name);
        userGroup.setDescription(description);

        Mono<UserGroup> createUserGroupMono = userGroupService
                .createGroup(userGroup)
                // Assert that the created role is also editable by the user who created it
                .flatMap(userGroup1 -> userGroupService.findById(userGroup1.getId(), MANAGE_USER_GROUPS));

        StepVerifier.create(createUserGroupMono)
                .assertNext(createdUserGroup -> {
                    assertEquals(name, createdUserGroup.getName());
                    assertEquals(description, createdUserGroup.getDescription());
                    assertThat(createdUserGroup.getTenantId()).isNotNull();

                    String id = createdUserGroup.getId();

                    Policy manageGroupPolicy = Policy.builder()
                            .permission(MANAGE_USER_GROUPS.getValue())
                            .permissionGroups(Set.of(superAdminPermissionGroupId))
                            .build();
                    Policy readGroupPolicy = Policy.builder()
                            .permission(READ_USER_GROUPS.getValue())
                            .permissionGroups(Set.of(superAdminPermissionGroupId))
                            .build();
                    Policy deleteGroupPolicy = Policy.builder()
                            .permission(DELETE_USER_GROUPS.getValue())
                            .permissionGroups(Set.of(superAdminPermissionGroupId))
                            .build();
                    Policy inviteGroupPolicy = Policy.builder()
                            .permission(ADD_USERS_TO_USER_GROUPS.getValue())
                            .permissionGroups(Set.of(superAdminPermissionGroupId))
                            .build();

                    assertThat(createdUserGroup.getPolicies())
                            .containsAll(
                                    Set.of(manageGroupPolicy, readGroupPolicy, deleteGroupPolicy, inviteGroupPolicy));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void createNewGroupAsNonSuperAdminTest() {

        UserGroup userGroup = new UserGroup();
        String name = "Test Group";
        String description = "Test Group Description";
        userGroup.setName(name);
        userGroup.setDescription(description);

        Mono<UserGroupDTO> createUserGroupMono = userGroupService.createGroup(userGroup);

        StepVerifier.create(createUserGroupMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .contains(AppsmithError.ACTION_IS_NOT_AUTHORIZED.getMessage("create user groups")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void listGroupsAsSuperAdminTest() {

        UserGroup userGroup = new UserGroup();
        String name = "Test Group listGroupsAsSuperAdminTest";
        String description = "Test Group Description listGroupsAsSuperAdminTest";
        userGroup.setName(name);
        userGroup.setDescription(description);

        // Create a new group
        userGroupService.createGroup(userGroup).block();

        Mono<List<UserGroup>> listMono =
                userGroupService.get(new LinkedMultiValueMap<>()).collectList();

        StepVerifier.create(listMono)
                .assertNext(list -> {
                    assertThat(list.size()).isGreaterThan(0);

                    // Assert that the created group is returned inside the listing.
                    assertThat(list.stream()
                                    .filter(userGroup1 -> userGroup1.getName().equals(name))
                                    .findFirst()
                                    .isPresent())
                            .isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void listGroupsAsNonSuperAdminTest() {

        Mono<List<UserGroup>> listMono =
                userGroupService.get(new LinkedMultiValueMap<>()).collectList();

        StepVerifier.create(listMono)
                .assertNext(list -> {
                    assertThat(list).hasSize(0);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteCustomCreatedGroupTest() {

        UserGroup userGroup = new UserGroup();
        String name = "Test Group deleteCustomCreatedGroupTest";
        String description = "Test Group Description deleteCustomCreatedGroupTest";
        userGroup.setName(name);
        userGroup.setDescription(description);

        // Create a new group
        UserGroupDTO createdUserGroup = userGroupService.createGroup(userGroup).block();

        Mono<UserGroup> deleteGroupMono = userGroupService
                .archiveById(createdUserGroup.getId())
                .then(userGroupService.findById(createdUserGroup.getId(), READ_USER_GROUPS));

        StepVerifier.create(deleteGroupMono).expectNextCount(0).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validUpdateGroup() {

        UserGroup userGroup = new UserGroup();
        String name = "Test Group validUpdateGroup";
        String description = "Test Group Description validUpdateGroup";
        userGroup.setName(name);
        userGroup.setDescription(description);

        // Create a new group
        UserGroupDTO createdGroup = userGroupService.createGroup(userGroup).block();

        UserGroup update = new UserGroup();
        name = "Updated Name";
        description = "Updated Description";
        update.setName(name);
        update.setDescription(description);

        Mono<UserGroup> deleteGroupMono = userGroupService
                .updateGroup(createdGroup.getId(), update)
                .then(userGroupService.findById(createdGroup.getId(), READ_USER_GROUPS));

        String finalName = name;
        String finalDescription = description;
        StepVerifier.create(deleteGroupMono)
                .assertNext(group -> {
                    assertEquals(finalName, group.getName());
                    assertEquals(finalDescription, group.getDescription());

                    // assert that tenant and policies remain unchanged
                    assertThat(group.getTenantId()).isNotNull();

                    Policy manageGroupPolicy = Policy.builder()
                            .permission(MANAGE_USER_GROUPS.getValue())
                            .permissionGroups(Set.of(superAdminPermissionGroupId))
                            .build();
                    Policy readGroupPolicy = Policy.builder()
                            .permission(READ_USER_GROUPS.getValue())
                            .permissionGroups(Set.of(superAdminPermissionGroupId))
                            .build();
                    Policy deleteGroupPolicy = Policy.builder()
                            .permission(DELETE_USER_GROUPS.getValue())
                            .permissionGroups(Set.of(superAdminPermissionGroupId))
                            .build();
                    Policy inviteGroupPolicy = Policy.builder()
                            .permission(ADD_USERS_TO_USER_GROUPS.getValue())
                            .permissionGroups(Set.of(superAdminPermissionGroupId))
                            .build();

                    assertThat(group.getPolicies())
                            .containsAll(
                                    Set.of(manageGroupPolicy, readGroupPolicy, deleteGroupPolicy, inviteGroupPolicy));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void invalidUpdateGroup_userIds() {

        UserGroup userGroup = new UserGroup();
        String name = "Test Group invalidUpdateGroup_userIds";
        String description = "Test Group Description invalidUpdateGroup_userIds";
        userGroup.setName(name);
        userGroup.setDescription(description);

        // Create a new group
        UserGroupDTO createdGroup = userGroupService.createGroup(userGroup).block();

        UserGroup update = new UserGroup();
        update.setUsers(Set.of("invalid-user-id"));

        Mono<UserGroup> deleteGroupMono = userGroupService
                .updateGroup(createdGroup.getId(), update)
                .then(userGroupService.findById(createdGroup.getId(), READ_USER_GROUPS));

        String finalName = name;
        String finalDescription = description;
        StepVerifier.create(deleteGroupMono)
                .assertNext(group -> {

                    // assert that the user ids are not updated
                    assertThat(group.getUsers()).isEmpty();

                    assertEquals(finalName, group.getName());
                    assertEquals(finalDescription, group.getDescription());

                    // assert that tenant and policies remain unchanged
                    assertThat(group.getTenantId()).isNotNull();

                    Policy manageGroupPolicy = Policy.builder()
                            .permission(MANAGE_USER_GROUPS.getValue())
                            .permissionGroups(Set.of(superAdminPermissionGroupId))
                            .build();
                    Policy readGroupPolicy = Policy.builder()
                            .permission(READ_USER_GROUPS.getValue())
                            .permissionGroups(Set.of(superAdminPermissionGroupId))
                            .build();
                    Policy deleteGroupPolicy = Policy.builder()
                            .permission(DELETE_USER_GROUPS.getValue())
                            .permissionGroups(Set.of(superAdminPermissionGroupId))
                            .build();
                    Policy inviteGroupPolicy = Policy.builder()
                            .permission(ADD_USERS_TO_USER_GROUPS.getValue())
                            .permissionGroups(Set.of(superAdminPermissionGroupId))
                            .build();

                    assertThat(group.getPolicies())
                            .containsAll(
                                    Set.of(manageGroupPolicy, readGroupPolicy, deleteGroupPolicy, inviteGroupPolicy));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getByIdValid() {

        PermissionGroup permissionGroup = new PermissionGroup();
        String name = "Test Role";
        String description = "Test Role Description";
        permissionGroup.setName(name);
        permissionGroup.setDescription(description);
        // create the role
        PermissionGroup createdRole =
                permissionGroupService.create(permissionGroup).block();

        // create the group
        UserGroup userGroup = new UserGroup();
        name = "Test Group invalidUpdateGroup_userIds";
        description = "Test Group Description invalidUpdateGroup_userIds";
        userGroup.setName(name);
        userGroup.setDescription(description);
        // Let the users be the same as that of super admins in the group
        userGroup.setUsers(superAdminIds);
        UserGroup createdGroup = userGroupService
                .createGroup(userGroup)
                .flatMap(userGroup1 -> userGroupService.findById(userGroup1.getId(), READ_USER_GROUPS))
                .block();

        // Manually set the roles of the group
        createdRole.setAssignedToGroupIds(Set.of(createdGroup.getId()));
        permissionGroupService.save(createdRole).block();

        // Get the group
        Mono<UserGroupDTO> userGroupMono = userGroupService.getGroupById(createdGroup.getId());

        StepVerifier.create(userGroupMono)
                .assertNext(group -> {
                    assertEquals(createdGroup.getId(), group.getId());
                    assertEquals(createdGroup.getTenantId(), group.getTenantId());
                    assertEquals(createdGroup.getName(), group.getName());
                    assertEquals(createdGroup.getDescription(), group.getDescription());
                    assertEquals(createdGroup.getUserPermissions(), group.getUserPermissions());

                    // Assert that the api_user is returned properly.
                    group.getUsers().stream()
                            .filter(user -> user.getUsername().equals(api_user.getUsername()))
                            .findFirst()
                            .ifPresentOrElse(
                                    user -> {
                                        assertEquals(api_user.getName(), user.getName());
                                        assertEquals(api_user.getId(), user.getId());
                                    },
                                    () -> fail("api_user not found"));
                    // Assert that the non api super admin user is returned properly.
                    group.getUsers().stream()
                            .filter(user -> user.getUsername().equals(admin_user.getUsername()))
                            .findFirst()
                            .ifPresentOrElse(
                                    user -> {
                                        assertEquals(admin_user.getName(), user.getName());
                                        assertEquals(admin_user.getId(), user.getId());
                                    },
                                    () -> fail("admin user not found"));

                    // Assert that the role is returned properly.
                    assertThat(group.getRoles())
                            .containsExactlyInAnyOrder(List.of(createdRole).stream()
                                    .map(role -> {
                                        PermissionGroupInfoDTO permissionGroupInfoDTO = new PermissionGroupInfoDTO();
                                        permissionGroupInfoDTO.setId(role.getId());
                                        permissionGroupInfoDTO.setName(role.getName());
                                        permissionGroupInfoDTO.setDescription(role.getDescription());
                                        permissionGroupInfoDTO.setUserPermissions(role.getUserPermissions());
                                        return permissionGroupInfoDTO;
                                    })
                                    .collect(Collectors.toList())
                                    .get(0));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void invalidAddUserToGroup_emptyId() {
        UsersForGroupDTO inviteUsersToGroupDTO = new UsersForGroupDTO();
        inviteUsersToGroupDTO.setUsernames(Set.of("username-1", "username-2"));

        StepVerifier.create(userGroupService.inviteUsers(inviteUsersToGroupDTO, "origin"))
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.GROUP_ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void addUserToGroup_1valid_1invalidGroupId() {
        UserGroup userGroup = new UserGroup();
        String name = "Test Group : addUsersToGroupValid";
        String description = "Test Group Description : addUsersToGroupValid";
        userGroup.setName(name);
        userGroup.setDescription(description);

        UserGroupDTO createdGroup = userGroupService.createGroup(userGroup).block();

        UsersForGroupDTO inviteUsersToGroupDTO = new UsersForGroupDTO();
        inviteUsersToGroupDTO.setUsernames(Set.of("api_user"));
        inviteUsersToGroupDTO.setGroupIds(Set.of(createdGroup.getId(), "invalid-group-id"));

        StepVerifier.create(userGroupService.inviteUsers(inviteUsersToGroupDTO, "origin"))
                .assertNext(groups -> {
                    // assert that the user got added to only the allowed user group.
                    assertThat(groups).hasSize(1);
                    UserGroupDTO group = groups.get(0);
                    // assert that updated group did not edit the existing settings
                    assertEquals(createdGroup.getId(), group.getId());
                    assertEquals(createdGroup.getTenantId(), group.getTenantId());
                    assertEquals(createdGroup.getName(), group.getName());
                    assertEquals(createdGroup.getDescription(), group.getDescription());

                    // assert that the user was added to the group
                    assertEquals(1, group.getUsers().size());
                    assertEquals(api_user.getId(), group.getUsers().get(0).getId());
                    assertEquals(api_user.getUsername(), group.getUsers().get(0).getUsername());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void invalidAddUserToGroup_emptyUsernames() {
        UsersForGroupDTO inviteUsersToGroupDTO = new UsersForGroupDTO();
        inviteUsersToGroupDTO.setGroupIds(Set.of("groupId"));

        StepVerifier.create(userGroupService.inviteUsers(inviteUsersToGroupDTO, "origin"))
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.USERNAMES)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void addUsersToGroupValid_WithoutRoles() {
        UserGroup userGroup = new UserGroup();
        String name = "Test Group : addUsersToGroupValid";
        String description = "Test Group Description : addUsersToGroupValid";
        userGroup.setName(name);
        userGroup.setDescription(description);

        UserGroupDTO createdGroup = userGroupService.createGroup(userGroup).block();

        UsersForGroupDTO inviteUsersToGroupDTO = new UsersForGroupDTO();
        inviteUsersToGroupDTO.setGroupIds(Set.of(createdGroup.getId()));
        inviteUsersToGroupDTO.setUsernames(Set.of("api_user"));

        StepVerifier.create(userGroupService.inviteUsers(inviteUsersToGroupDTO, "origin"))
                .assertNext(groups -> {
                    assertThat(groups).hasSize(1);
                    UserGroupDTO group = groups.get(0);
                    // assert that updated group did not edit the existing settings
                    assertEquals(createdGroup.getId(), group.getId());
                    assertEquals(createdGroup.getTenantId(), group.getTenantId());
                    assertEquals(createdGroup.getName(), group.getName());
                    assertEquals(createdGroup.getDescription(), group.getDescription());

                    // assert that the user was added to the group
                    assertEquals(1, group.getUsers().size());
                    assertEquals(api_user.getId(), group.getUsers().get(0).getId());
                    assertEquals(api_user.getUsername(), group.getUsers().get(0).getUsername());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void addUsersToGroupsValid_WithoutRoles() {
        UserGroup userGroup = new UserGroup();
        String name = "Test Group : addUsersToGroupValid";
        String description = "Test Group Description : addUsersToGroupValid";
        userGroup.setName(name);
        userGroup.setDescription(description);

        UserGroupDTO createdGroup = userGroupService.createGroup(userGroup).block();

        UserGroup userGroup2 = new UserGroup();
        String name2 = "Test Group 2 : addUsersToGroupValid";
        String description2 = "Test Group Description 2 : addUsersToGroupValid";
        userGroup2.setName(name2);
        userGroup2.setDescription(description2);

        UserGroupDTO createdGroup2 = userGroupService.createGroup(userGroup2).block();

        UsersForGroupDTO inviteUsersToGroupDTO = new UsersForGroupDTO();
        inviteUsersToGroupDTO.setGroupIds(Set.of(createdGroup.getId(), createdGroup2.getId()));
        inviteUsersToGroupDTO.setUsernames(Set.of("api_user"));

        StepVerifier.create(userGroupService.inviteUsers(inviteUsersToGroupDTO, "origin"))
                .assertNext(groups -> {
                    assertThat(groups).hasSize(2);
                    UserGroupDTO group1 = groups.get(0);
                    // assert that updated group did not edit the existing settings
                    assertEquals(createdGroup.getId(), group1.getId());
                    assertEquals(createdGroup.getTenantId(), group1.getTenantId());
                    assertEquals(createdGroup.getName(), group1.getName());
                    assertEquals(createdGroup.getDescription(), group1.getDescription());

                    // assert that the user was added to the group
                    assertEquals(1, group1.getUsers().size());
                    assertEquals(api_user.getId(), group1.getUsers().get(0).getId());
                    assertEquals(
                            api_user.getUsername(), group1.getUsers().get(0).getUsername());

                    UserGroupDTO group2 = groups.get(1);
                    // assert that updated group did not edit the existing settings
                    assertEquals(createdGroup2.getId(), group2.getId());
                    assertEquals(createdGroup2.getTenantId(), group2.getTenantId());
                    assertEquals(createdGroup2.getName(), group2.getName());
                    assertEquals(createdGroup2.getDescription(), group2.getDescription());

                    // assert that the user was added to the group
                    assertEquals(1, group2.getUsers().size());
                    assertEquals(api_user.getId(), group2.getUsers().get(0).getId());
                    assertEquals(
                            api_user.getUsername(), group2.getUsers().get(0).getUsername());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    @DirtiesContext
    public void testAddUsersToUserGroup_nonExistentUser() {
        String usernameNonExistentUser = "username-non-existent-user@test.com";
        String idNonExistentUser = null;
        UserGroup userGroup = new UserGroup();
        String name = "Test Group : testAddUsersToUserGroup_nonExistentUser";
        String description = "Test Group Description : testAddUsersToUserGroup_nonExistentUser";
        userGroup.setName(name);
        userGroup.setDescription(description);

        UserGroupDTO createdGroup = userGroupService.createGroup(userGroup).block();

        UsersForGroupDTO inviteUsersToGroupDTO = new UsersForGroupDTO();
        inviteUsersToGroupDTO.setGroupIds(Set.of(createdGroup.getId()));
        inviteUsersToGroupDTO.setUsernames(Set.of(usernameNonExistentUser));

        UserGroupDTO userGroupDTO = userGroupService
                .inviteUsers(inviteUsersToGroupDTO, "origin")
                .block()
                .get(0);
        assertThat(userGroupDTO.getUsers().size()).isEqualTo(1);
        UserCompactDTO userCompactDTO = userGroupDTO.getUsers().get(0);
        assertThat(userCompactDTO.getUsername()).isEqualTo(usernameNonExistentUser);
        idNonExistentUser = userCompactDTO.getId();

        Mono<User> nonExistentUserMono = userRepository.findById(idNonExistentUser);
        StepVerifier.create(nonExistentUserMono)
                .assertNext(user -> {
                    assertThat(user).isNotNull();
                    assertThat(user.getEmail()).isEqualTo(usernameNonExistentUser);
                })
                .verifyComplete();
    }

    // TODO: Add tests for groups with roles and then adding users to the group.

    @Test
    @WithUserDetails(value = "api_user")
    public void invalidRemoveUserToGroup_emptyId() {
        UsersForGroupDTO removeUsersFromGroupDTO = new UsersForGroupDTO();
        removeUsersFromGroupDTO.setUsernames(Set.of("username-1", "username-2"));

        StepVerifier.create(userGroupService.removeUsers(removeUsersFromGroupDTO))
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.GROUP_ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void invalidRemoveUserToGroup_emptyUsernames() {
        UsersForGroupDTO removeUsersFromGroupDTO = new UsersForGroupDTO();
        removeUsersFromGroupDTO.setGroupIds(Set.of("groupId"));

        StepVerifier.create(userGroupService.removeUsers(removeUsersFromGroupDTO))
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.USERNAMES)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void removeUsersToGroupValid_WithoutRoles() {
        UserGroup userGroup = new UserGroup();
        String name = "Test Group : removeUsersToGroupValid_WithoutRoles";
        String description = "Test Group Description : removeUsersToGroupValid_WithoutRoles";
        userGroup.setName(name);
        userGroup.setDescription(description);

        UserGroupDTO createdGroup = userGroupService.createGroup(userGroup).block();

        UsersForGroupDTO usersForGroupDTO = new UsersForGroupDTO();
        usersForGroupDTO.setGroupIds(Set.of(createdGroup.getId()));
        usersForGroupDTO.setUsernames(Set.of("api_user"));

        // Add API User
        userGroupService.inviteUsers(usersForGroupDTO, "origin").block();

        StepVerifier.create(userGroupService.removeUsers(usersForGroupDTO))
                .assertNext(groups -> {
                    assertThat(groups).hasSize(1);

                    UserGroupDTO group = groups.get(0);

                    // assert that updated group did not edit the existing settings
                    assertEquals(createdGroup.getId(), group.getId());
                    assertEquals(createdGroup.getTenantId(), group.getTenantId());
                    assertEquals(createdGroup.getName(), group.getName());
                    assertEquals(createdGroup.getDescription(), group.getDescription());

                    // assert that the user was removed from the group
                    assertEquals(0, group.getUsers().size());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void changeGroupMembershipValid_WithoutRoles() {
        UserGroup userGroup = new UserGroup();
        String name = "Test Group : changeGroupMembershipValid_WithoutRoles";
        String description = "Test Group Description : changeGroupMembershipValid_WithoutRoles";
        userGroup.setName(name);
        userGroup.setDescription(description);

        UserGroupDTO createdGroup = userGroupService.createGroup(userGroup).block();

        UserGroup userGroup2 = new UserGroup();
        String name2 = "Test Group 2 : changeGroupMembershipValid_WithoutRoles";
        String description2 = "Test Group Description 2 : changeGroupMembershipValid_WithoutRoles";
        userGroup2.setName(name2);
        userGroup2.setDescription(description2);

        UserGroupDTO createdGroup2 = userGroupService.createGroup(userGroup2).block();

        UserGroup toRemove = new UserGroup();
        String name3 = "Test Group toRemove : changeGroupMembershipValid_WithoutRoles";
        String description3 = "Test Group Description toRemove : changeGroupMembershipValid_WithoutRoles";
        toRemove.setName(name3);
        toRemove.setDescription(description3);

        UserGroupDTO toRemoveCreated = userGroupService.createGroup(toRemove).block();

        // First add the user to toRemove user group
        UsersForGroupDTO inviteUsersToGroupDTO = new UsersForGroupDTO();
        inviteUsersToGroupDTO.setGroupIds(Set.of(toRemoveCreated.getId()));
        inviteUsersToGroupDTO.setUsernames(Set.of("api_user"));

        userGroupService.inviteUsers(inviteUsersToGroupDTO, "origin").block();

        // Now change membership of the user
        UpdateGroupMembershipDTO updateGroupMembershipDTO = new UpdateGroupMembershipDTO();
        updateGroupMembershipDTO.setGroupsAdded(Set.of(createdGroup.getId(), createdGroup2.getId()));
        updateGroupMembershipDTO.setGroupsRemoved(Set.of(toRemoveCreated.getId()));
        updateGroupMembershipDTO.setUsernames(Set.of("api_user"));

        StepVerifier.create(userGroupService.changeGroupsForUser(updateGroupMembershipDTO, "origin"))
                .assertNext(groups -> {
                    assertThat(groups).hasSize(3);
                    UserGroupDTO group1 = groups.stream()
                            .filter(group -> group.getName().equals(createdGroup.getName()))
                            .findFirst()
                            .get();
                    // assert that updated group did not edit the existing settings
                    assertEquals(createdGroup.getId(), group1.getId());
                    assertEquals(createdGroup.getTenantId(), group1.getTenantId());
                    assertEquals(createdGroup.getDescription(), group1.getDescription());

                    // assert that the user was added to the group
                    assertEquals(1, group1.getUsers().size());
                    assertEquals(api_user.getId(), group1.getUsers().get(0).getId());
                    assertEquals(
                            api_user.getUsername(), group1.getUsers().get(0).getUsername());

                    UserGroupDTO group2 = groups.stream()
                            .filter(group -> group.getName().equals(createdGroup2.getName()))
                            .findFirst()
                            .get();
                    // assert that updated group did not edit the existing settings
                    assertEquals(createdGroup2.getId(), group2.getId());
                    assertEquals(createdGroup2.getTenantId(), group2.getTenantId());
                    assertEquals(createdGroup2.getDescription(), group2.getDescription());

                    // assert that the user was added to the group
                    assertEquals(1, group2.getUsers().size());
                    assertEquals(api_user.getId(), group2.getUsers().get(0).getId());
                    assertEquals(
                            api_user.getUsername(), group2.getUsers().get(0).getUsername());

                    UserGroupDTO removedGroup = groups.stream()
                            .filter(group -> group.getName().equals(toRemoveCreated.getName()))
                            .findFirst()
                            .get();
                    // assert that updated group did not edit the existing settings
                    assertEquals(toRemoveCreated.getId(), removedGroup.getId());
                    assertEquals(toRemoveCreated.getTenantId(), removedGroup.getTenantId());
                    assertEquals(toRemoveCreated.getDescription(), removedGroup.getDescription());

                    // assert that the user was removed from the group
                    assertEquals(0, removedGroup.getUsers().size());
                })
                .verifyComplete();
    }

    /**
     * This test has been added, because there now exists a feature on UI
     * which disables the Roles in the Active Roles tab in User Group Description page
     * if the user doesn't have permission to un-assign a role which has been already assigned to the User Group.
     * The UI feature is dependent on the User Permission present inside Roles DTO inside Group DTO.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void testGetUserGroup_roleHaveUserPermission() {
        UserGroup userGroup = new UserGroup();
        userGroup.setName("Test Group : testGetUserGroup_roleHaveUserPermission");
        userGroup.setDescription("Test Group Description : testGetUserGroup_roleHaveUserPermission");
        UserGroup createdUserGroup = userGroupService
                .createGroup(userGroup)
                .flatMap(userGroupDTO -> userGroupRepository.findById(userGroupDTO.getId()))
                .block();
        assertThat(createdUserGroup.getId()).isNotNull();

        PermissionGroup permissionGroup = new PermissionGroup();
        userGroup.setName("Test Role : testGetUserGroup_roleHaveUserPermission");
        userGroup.setDescription("Test Role Description : testGetUserGroup_roleHaveUserPermission");
        PermissionGroup createdPermissionGroup =
                permissionGroupService.create(permissionGroup).block();
        assertThat(createdPermissionGroup.getId()).isNotNull();

        permissionGroupService
                .assignToUserGroup(createdPermissionGroup, createdUserGroup)
                .block();

        UserGroupDTO updatedUserGroup =
                userGroupService.getGroupById(createdUserGroup.getId()).block();
        assertThat(updatedUserGroup.getRoles()).hasSize(1);
        assertThat(updatedUserGroup.getRoles().get(0).getUserPermissions()).isNotEmpty();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGetUserGroup_assertPhotoIdForUser() {
        String testName = "testGetUserGroup_assertPhotoIdForUser";

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName);
        userGroup.setDescription(testName);
        UserGroup createdUserGroup = userGroupService
                .createGroup(userGroup)
                .flatMap(userGroupDTO -> userGroupRepository.findById(userGroupDTO.getId()))
                .block();
        assertThat(createdUserGroup.getId()).isNotNull();

        User user1 = new User();
        user1.setEmail(testName);
        user1.setPassword(testName);
        User createdUser1 = userService.userCreate(user1, false).block();
        UserData userData1 = userDataService.getForUser(createdUser1).block();
        userData1.setProfilePhotoAssetId(testName);
        UserData userData1PostUpdate =
                userDataService.updateForUser(createdUser1, userData1).block();

        // First add the user to toRemove user group
        UsersForGroupDTO inviteUsersToGroupDTO = new UsersForGroupDTO();
        inviteUsersToGroupDTO.setGroupIds(Set.of(createdUserGroup.getId()));
        inviteUsersToGroupDTO.setUsernames(Set.of(createdUser1.getUsername()));
        userGroupService.inviteUsers(inviteUsersToGroupDTO, "origin").block();

        UserGroupDTO userGroupDTO =
                userGroupService.getGroupById(createdUserGroup.getId()).block();
        List<UserCompactDTO> users = userGroupDTO.getUsers();
        Optional<UserCompactDTO> user = users.stream()
                .filter(_user -> createdUser1.getId().equals(_user.getId()))
                .findFirst();
        assertThat(user.isPresent()).isTrue();
        assertThat(user.get().getPhotoId()).isEqualTo(testName);
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testGetAllReadableGroups() {
        String testName = "testGetAllReadableGroups";

        PermissionGroup role = new PermissionGroup();
        role.setName(testName);
        role.setAssignedToUserIds(Set.of(api_user.getId()));
        PermissionGroup createdRole = permissionGroupService.create(role).block();

        UserGroup group1 = new UserGroup();
        group1.setName(testName + 1);
        group1.setDescription(testName);
        // Policy of this group have been updated to only be read by createdRole.
        UserGroup createdGroup1 = userGroupService
                .createGroup(group1)
                .flatMap(groupDTO -> userGroupRepository.findById(groupDTO.getId()))
                .flatMap(group -> {
                    Set<Policy> policies = group.getPolicies();
                    Optional<Policy> optionalReadGroupPolicy = policies.stream()
                            .filter(policy -> policy.getPermission().equals(READ_USER_GROUPS.getValue()))
                            .findFirst();
                    if (optionalReadGroupPolicy.isPresent()) {
                        Policy readGroupPolicy = optionalReadGroupPolicy.get();
                        readGroupPolicy.setPermissionGroups(Set.of(createdRole.getId()));
                    } else {
                        Policy readGroupPolicy = Policy.builder()
                                .permission(READ_USER_GROUPS.getValue())
                                .permissionGroups(Set.of(createdRole.getId()))
                                .build();
                        policies.add(readGroupPolicy);
                    }
                    return userGroupRepository.save(group);
                })
                .block();

        UserGroup group2 = new UserGroup();
        group2.setName(testName + 2);
        group2.setDescription(testName);
        UserGroup createdGroup2 = userGroupService
                .createGroup(group2)
                .flatMap(groupDTO -> userGroupRepository.findById(groupDTO.getId()))
                .block();

        List<UserGroupCompactDTO> readableGroups =
                userGroupService.getAllReadableGroups().block();
        assertThat(readableGroups).isNotEmpty();
        // Assert that api_user can read createdGroup1. (Read User Group ability provided only to createdRole.)
        Optional<UserGroupCompactDTO> groupCompactDTOReadable1 = readableGroups.stream()
                .filter(userGroupCompactDTO -> userGroupCompactDTO.getId().equals(group1.getId()))
                .findFirst();
        assertThat(groupCompactDTOReadable1.isPresent()).isTrue();
        assertThat(groupCompactDTOReadable1.get().getName()).isEqualTo(createdGroup1.getName());

        // Assert that api_user can read createdGroup2. (api_user is super admin.)
        Optional<UserGroupCompactDTO> groupCompactDTOReadable2 = readableGroups.stream()
                .filter(userGroupCompactDTO -> userGroupCompactDTO.getId().equals(group2.getId()))
                .findFirst();
        assertThat(groupCompactDTOReadable2.isPresent()).isTrue();
        assertThat(groupCompactDTOReadable2.get().getName()).isEqualTo(createdGroup2.getName());

        // Test cleanup
        userGroupRepository.delete(createdGroup1).block();
        userGroupRepository.delete(createdGroup2).block();
    }

    @Test
    @WithUserDetails(value = "provisioningUser")
    public void createProvisionedGroup_checkPermissions() {
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.TRUE);
        String testName = "createProvisionedGroup_checkPermissions";
        String instanceAdminRoleId = userUtils
                .getSuperAdminPermissionGroup()
                .map(PermissionGroup::getId)
                .block();

        String provisioningRoleId =
                userUtils.getProvisioningRole().map(PermissionGroup::getId).block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName);
        ProvisionResourceDto provisionedGroupDto =
                userGroupService.createProvisionGroup(userGroup).block();
        UserGroup provisionedGroup = (UserGroup) provisionedGroupDto.getResource();
        assertThat(provisionedGroup.getIsProvisioned()).isTrue();
        Set<Policy> policies = provisionedGroup.getPolicies();
        Optional<Policy> manageUserGroupPolicy = policies.stream()
                .filter(policy -> policy.getPermission().equals(MANAGE_USER_GROUPS.getValue()))
                .findAny();
        Optional<Policy> deleteUserGroupPolicy = policies.stream()
                .filter(policy -> policy.getPermission().equals(DELETE_USER_GROUPS.getValue()))
                .findAny();
        Optional<Policy> readUserGroupPolicy = policies.stream()
                .filter(policy -> policy.getPermission().equals(READ_USER_GROUPS.getValue()))
                .findAny();
        Optional<Policy> addUsersToUserGroupPolicy = policies.stream()
                .filter(policy -> policy.getPermission().equals(ADD_USERS_TO_USER_GROUPS.getValue()))
                .findAny();
        Optional<Policy> removeUsersFromUserGroupPolicy = policies.stream()
                .filter(policy -> policy.getPermission().equals(REMOVE_USERS_FROM_USER_GROUPS.getValue()))
                .findAny();

        assertThat(manageUserGroupPolicy.isPresent()).isTrue();
        assertThat(deleteUserGroupPolicy.isPresent()).isTrue();
        assertThat(readUserGroupPolicy.isPresent()).isTrue();
        assertThat(addUsersToUserGroupPolicy.isPresent()).isTrue();
        assertThat(removeUsersFromUserGroupPolicy.isPresent()).isTrue();

        // Instance Admin has the permission to read user groups.
        assertThat(readUserGroupPolicy.get().getPermissionGroups()).contains(provisioningRoleId, instanceAdminRoleId);
        // Instance Admin has no permission to manage, delete, add users to, remove users from user groups.
        assertThat(manageUserGroupPolicy.get().getPermissionGroups()).containsExactly(provisioningRoleId);
        assertThat(deleteUserGroupPolicy.get().getPermissionGroups()).containsExactly(provisioningRoleId);
        assertThat(addUsersToUserGroupPolicy.get().getPermissionGroups()).containsExactly(provisioningRoleId);
        assertThat(removeUsersFromUserGroupPolicy.get().getPermissionGroups()).containsExactly(provisioningRoleId);
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.FALSE);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteRegularGroupAsInstanceAdmin_userGroupShouldGetDeleted() {
        String testName = "deleteRegularGroupAsInstanceAdmin_userGroupShouldGetDeleted";

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName);
        UserGroupDTO userGroupDto = userGroupService.createGroup(userGroup).block();

        userGroupService.archiveById(userGroupDto.getId()).block();
        UserGroup userGroupDeleted =
                userGroupRepository.findById(userGroupDto.getId()).block();
        assertThat(userGroupDeleted).isNull();
    }

    @Test
    @WithUserDetails("api_user")
    public void deleteProvisionedUserGroupAsInstanceAdmin_throwUnauthorisedError() {
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.TRUE);
        String testName = "deleteProvisionedUserGroupAsInstanceAdmin_throwUnauthorisedError";

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName);
        ProvisionResourceDto createdUserGroup =
                userGroupService.createProvisionGroup(userGroup).block();

        AppsmithException unauthorisedException = assertThrows(AppsmithException.class, () -> {
            userGroupService
                    .archiveProvisionGroupById(createdUserGroup.getResource().getId())
                    .block();
        });
        assertThat(unauthorisedException.getMessage()).isEqualTo(AppsmithError.UNAUTHORIZED_ACCESS.getMessage());

        userRepository.deleteById(createdUserGroup.getResource().getId()).block();
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.FALSE);
    }

    @Test
    @WithUserDetails("api_user")
    public void createProvisionedUserGroup_RegularUserGroup_getAllUserGroupsShouldReturnBoth_toApiUser() {
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.TRUE);
        String testName = "createProvisionedUserGroup_RegularUserGroup_getAllUserGroupsShouldReturnBoth_toApiUser";

        UserGroup userGroup_provisioning = new UserGroup();
        userGroup_provisioning.setName(testName + "_provisionedGroup");
        ProvisionResourceDto provisionedUserGroup =
                userGroupService.createProvisionGroup(userGroup_provisioning).block();

        UserGroup userGroup_regular = new UserGroup();
        userGroup_regular.setName(testName + "_regularGroup");
        UserGroupDTO userGroupDTO =
                userGroupService.createGroup(userGroup_regular).block();

        List<UserGroupCompactDTO> userGroupCompactDTOList =
                userGroupService.getAllReadableGroups().block();
        Optional<UserGroupCompactDTO> provisionGroup = userGroupCompactDTOList.stream()
                .filter(userGroupCompactDTO -> userGroupCompactDTO.getName().equals(userGroup_provisioning.getName()))
                .findAny();
        Optional<UserGroupCompactDTO> regularGroup = userGroupCompactDTOList.stream()
                .filter(userGroupCompactDTO -> userGroupCompactDTO.getName().equals(userGroup_regular.getName()))
                .findAny();
        assertThat(regularGroup.isPresent()).isTrue();
        assertThat(provisionGroup.isPresent()).isTrue();
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.FALSE);
    }

    @Test
    @WithUserDetails("provisioningUser")
    public void createProvisionedUserGroup_RegularUserGroup_getAllUserGroupsShouldReturnBoth_toProvisioningUser() {
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.TRUE);
        String testName =
                "createProvisionedUserGroup_RegularUserGroup_getAllUserGroupsShouldReturnProvisioningUserGroup_toProvisioningUser";

        UserGroup userGroup_provisioning = new UserGroup();
        userGroup_provisioning.setName(testName + "_provisionedGroup");
        ProvisionResourceDto provisionedUserGroup =
                userGroupService.createProvisionGroup(userGroup_provisioning).block();

        UserGroup userGroup_regular = new UserGroup();
        userGroup_regular.setName(testName + "_regularGroup");
        UserGroupDTO userGroupDTO =
                userGroupService.createGroup(userGroup_regular).block();

        assertThat(userGroupDTO).isNull();

        List<UserGroupCompactDTO> userGroupCompactDTOList =
                userGroupService.getAllReadableGroups().block();
        Optional<UserGroupCompactDTO> provisionGroup = userGroupCompactDTOList.stream()
                .filter(userGroupCompactDTO -> userGroupCompactDTO.getName().equals(userGroup_provisioning.getName()))
                .findAny();
        Optional<UserGroupCompactDTO> regularGroup = userGroupCompactDTOList.stream()
                .filter(userGroupCompactDTO -> userGroupCompactDTO.getName().equals(userGroup_regular.getName()))
                .findAny();
        assertThat(regularGroup.isPresent()).isFalse();
        assertThat(provisionGroup.isPresent()).isTrue();
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.FALSE);
    }

    @Test
    @WithUserDetails("provisioningUser")
    public void removeDeletedUserFromUserGroup_shouldReturnEmptyList_shouldNotUpdateUserGroup() {
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.TRUE);
        String testName = "removeDeletedUserFromUserGroup_shouldReturnEmptyList_shouldNotUpdateUserGroup";
        User user1 = new User();
        user1.setEmail(testName + "_provisioned_user1@appsmith.com");
        ProvisionResourceDto provisionedUser1 =
                userService.createProvisionUser(user1).block();

        User user2 = new User();
        user2.setEmail(testName + "_provisioned_user2@appsmith.com");
        ProvisionResourceDto provisionedUser2 =
                userService.createProvisionUser(user2).block();

        UserGroup userGroup_provisioning = new UserGroup();
        userGroup_provisioning.setName(testName + "_provisionedGroup");
        ProvisionResourceDto provisionedUserGroup =
                userGroupService.createProvisionGroup(userGroup_provisioning).block();

        UsersForGroupDTO addUsersForGroupDTO = new UsersForGroupDTO();
        addUsersForGroupDTO.setGroupIds(
                Set.of(provisionedUserGroup.getResource().getId()));
        addUsersForGroupDTO.setUserIds(List.of(
                provisionedUser1.getResource().getId(),
                provisionedUser2.getResource().getId()));

        userGroupService.addUsersToProvisionGroup(addUsersForGroupDTO).block();

        ProvisionResourceDto provisionedUserGroupPostInviting = userGroupService
                .getProvisionGroup(provisionedUserGroup.getResource().getId())
                .block();
        UserGroup provisionedUserGroupResourcePostInviting = (UserGroup) provisionedUserGroupPostInviting.getResource();
        assertThat(provisionedUserGroupResourcePostInviting.getUsers())
                .containsExactlyInAnyOrder(
                        provisionedUser1.getResource().getId(),
                        provisionedUser2.getResource().getId());

        userAndAccessManagementService
                .deleteUser(provisionedUser2.getResource().getId())
                .block();

        User deletedProvisionedUser2 =
                userRepository.findById(provisionedUser2.getResource().getId()).block();
        assertThat(deletedProvisionedUser2).isNull();

        UsersForGroupDTO removeDeletedUserFromGroupUsersForGroupDTO = new UsersForGroupDTO();
        removeDeletedUserFromGroupUsersForGroupDTO.setGroupIds(
                Set.of(provisionedUserGroup.getResource().getId()));
        removeDeletedUserFromGroupUsersForGroupDTO.setUserIds(
                List.of(provisionedUser2.getResource().getId()));

        List<UserGroupDTO> updatedUserGroupDTOsPostRemovingDeletedUser = userGroupService
                .removeUsersFromProvisionGroup(removeDeletedUserFromGroupUsersForGroupDTO)
                .block();

        // We return an empty list, when we are not able to find any users with the userIds supplied.
        assertThat(updatedUserGroupDTOsPostRemovingDeletedUser).hasSize(0);

        ProvisionResourceDto provisionedUserGroupPostRemovingDeletedUser = userGroupService
                .getProvisionGroup(provisionedUserGroup.getResource().getId())
                .block();
        UserGroup provisionedUserGroupResourcePostRemovingDeletedUser =
                (UserGroup) provisionedUserGroupPostRemovingDeletedUser.getResource();
        assertThat(provisionedUserGroupResourcePostRemovingDeletedUser.getUsers())
                .containsExactlyInAnyOrder(provisionedUser1.getResource().getId());

        UsersForGroupDTO removeExistingUserFromGroupUsersForGroupDTO = new UsersForGroupDTO();
        removeExistingUserFromGroupUsersForGroupDTO.setGroupIds(
                Set.of(provisionedUserGroup.getResource().getId()));
        removeExistingUserFromGroupUsersForGroupDTO.setUserIds(
                List.of(provisionedUser1.getResource().getId()));

        List<UserGroupDTO> updatedUserGroupDTOsPostRemovingExistingUser = userGroupService
                .removeUsersFromProvisionGroup(removeExistingUserFromGroupUsersForGroupDTO)
                .block();

        assertThat(updatedUserGroupDTOsPostRemovingExistingUser).hasSize(1);

        ProvisionResourceDto provisionedUserGroupPostRemovingExistingUser = userGroupService
                .getProvisionGroup(provisionedUserGroup.getResource().getId())
                .block();
        UserGroup provisionedUserGroupResourcePostRemovingExistingUser =
                (UserGroup) provisionedUserGroupPostRemovingExistingUser.getResource();
        assertThat(provisionedUserGroupResourcePostRemovingExistingUser.getUsers())
                .isEmpty();
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.FALSE);
    }

    @Test
    @WithUserDetails("provisioningUser")
    public void inviteInvalidUserIdToUserGroup_shouldReturnEmptyList_shouldNotUpdateUserGroup() {
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.TRUE);
        String testName = "inviteInvalidUserIdToUserGroup_shouldReturnEmptyList_shouldNotUpdateUserGroup";
        User user1 = new User();
        user1.setEmail(testName + "_provisioned_user1@appsmith.com");
        ProvisionResourceDto provisionedUser1 =
                userService.createProvisionUser(user1).block();

        UserGroup userGroup_provisioning = new UserGroup();
        userGroup_provisioning.setName(testName + "_provisionedGroup");
        ProvisionResourceDto provisionedUserGroup =
                userGroupService.createProvisionGroup(userGroup_provisioning).block();

        UsersForGroupDTO addUsersForGroupDTO = new UsersForGroupDTO();
        addUsersForGroupDTO.setGroupIds(
                Set.of(provisionedUserGroup.getResource().getId()));
        addUsersForGroupDTO.setUserIds(List.of(provisionedUser1.getResource().getId()));

        userGroupService.addUsersToProvisionGroup(addUsersForGroupDTO).block();

        ProvisionResourceDto provisionedUserGroupPostInviting = userGroupService
                .getProvisionGroup(provisionedUserGroup.getResource().getId())
                .block();
        UserGroup provisionedUserGroupResourcePostInviting = (UserGroup) provisionedUserGroupPostInviting.getResource();
        assertThat(provisionedUserGroupResourcePostInviting.getUsers())
                .containsExactlyInAnyOrder(provisionedUser1.getResource().getId());

        UsersForGroupDTO inviteInvalidUserIdToGroupUsersForGroupDTO = new UsersForGroupDTO();
        inviteInvalidUserIdToGroupUsersForGroupDTO.setGroupIds(
                Set.of(provisionedUserGroup.getResource().getId()));
        inviteInvalidUserIdToGroupUsersForGroupDTO.setUserIds(List.of("invalidUserId"));

        List<UserGroupDTO> updatedUserGroupDTOsPostInvitingInvalidUserId = userGroupService
                .removeUsersFromProvisionGroup(inviteInvalidUserIdToGroupUsersForGroupDTO)
                .block();

        // We return an empty list, when we are not able to find any users with the userIds supplied.
        assertThat(updatedUserGroupDTOsPostInvitingInvalidUserId).hasSize(0);

        ProvisionResourceDto provisionedUserGroupPostRemovingDeletedUser = userGroupService
                .getProvisionGroup(provisionedUserGroup.getResource().getId())
                .block();
        UserGroup provisionedUserGroupResourcePostRemovingDeletedUser =
                (UserGroup) provisionedUserGroupPostRemovingDeletedUser.getResource();
        assertThat(provisionedUserGroupResourcePostRemovingDeletedUser.getUsers())
                .containsExactlyInAnyOrder(provisionedUser1.getResource().getId());
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.FALSE);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testIsProvisionedOnUsersIsSetTrueWhenReturningGroups() {
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.TRUE);
        String testName = "testIsProvisionedOnUsersIsSetTrueWhenReturningGroups";
        User user1 = new User();
        user1.setEmail(testName + "user1@appsmith.com");
        ProvisionResourceDto provisionedUser1 =
                userService.createProvisionUser(user1).block();

        User newUser = new User();
        newUser.setEmail(testName + "user2@appsmith.com");
        newUser.setPassword("password");
        User user2 = userService.create(newUser).block();

        UserGroup userGroup_provisioningFalse = new UserGroup();
        userGroup_provisioningFalse.setName(testName + "_provisionedFalseGroup");
        UserGroupDTO userGroupDTOProvisionedFalse =
                userGroupService.createGroup(userGroup_provisioningFalse).block();

        UsersForGroupDTO addUsersForGroupDTO = new UsersForGroupDTO();
        addUsersForGroupDTO.setGroupIds(Set.of(userGroupDTOProvisionedFalse.getId()));
        addUsersForGroupDTO.setUserIds(List.of(provisionedUser1.getResource().getId(), user2.getId()));

        UsersForGroupDTO inviteUsersToGroupDTO = new UsersForGroupDTO();
        inviteUsersToGroupDTO.setUsernames(Set.of(user1.getUsername(), user2.getUsername()));
        inviteUsersToGroupDTO.setGroupIds(Set.of(userGroupDTOProvisionedFalse.getId()));
        userGroupService.inviteUsers(inviteUsersToGroupDTO, null).block();
        UserGroupDTO userGroup = userGroupService
                .getGroupById(userGroup_provisioningFalse.getId())
                .block();

        assertThat(userGroup.getUsers()).hasSize(2);
        UserCompactDTO uc1 = userGroup.getUsers().stream()
                .filter(ug -> ug.getId().equals(provisionedUser1.getResource().getId()))
                .findFirst()
                .get();
        UserCompactDTO uc2 = userGroup.getUsers().stream()
                .filter(ug -> ug.getId().equals(user2.getId()))
                .findFirst()
                .get();
        assertThat(uc1.isProvisioned()).isTrue();
        assertThat(uc2.isProvisioned()).isFalse();
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.FALSE);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGetAllUserGroupsWithParams_shouldReturnCorrectResults() {
        String testName = "testGetAllUserGroupsWithParams_shouldReturnCorrectResults";

        UserGroup userGroupProvisionedFalse = new UserGroup();
        userGroupProvisionedFalse.setName(testName + "_provisionedFalse");
        UserGroupDTO userGroupDTOProvisionedFalse =
                userGroupService.createGroup(userGroupProvisionedFalse).block();

        UserGroup userGroupProvisionedTrue = new UserGroup();
        userGroupProvisionedTrue.setName(testName + "_provisionedTrue");
        userGroupProvisionedTrue.setIsProvisioned(Boolean.TRUE);
        UserGroupDTO userGroupDTOProvisionedTrue =
                userGroupService.createGroup(userGroupProvisionedTrue).block();

        LinkedMultiValueMap<String, String> queryParamProvisionedFalse = new LinkedMultiValueMap<>();
        queryParamProvisionedFalse.add(PROVISIONED_FILTER, "false");

        LinkedMultiValueMap<String, String> queryParamProvisionedTrue = new LinkedMultiValueMap<>();
        queryParamProvisionedTrue.add(PROVISIONED_FILTER, "true");

        LinkedMultiValueMap<String, String> queryParamProvisionedNotBoolean = new LinkedMultiValueMap<>();
        queryParamProvisionedNotBoolean.add(PROVISIONED_FILTER, "1");

        List<UserGroup> userGroupListProvisionedFalse =
                userGroupService.get(queryParamProvisionedFalse).collectList().block();
        List<UserGroup> provisionedFalseUserGroupInProvisionedFalseCallList = userGroupListProvisionedFalse.stream()
                .filter(group -> group.getId().equals(userGroupDTOProvisionedFalse.getId()))
                .toList();
        assertThat(provisionedFalseUserGroupInProvisionedFalseCallList).hasSize(1);
        List<UserGroup> provisionedTrueUserGroupInProvisionedFalseCallList = userGroupListProvisionedFalse.stream()
                .filter(group -> group.getId().equals(userGroupDTOProvisionedTrue.getId()))
                .toList();
        assertThat(provisionedTrueUserGroupInProvisionedFalseCallList).hasSize(0);

        List<UserGroup> userGroupListProvisionedTrue =
                userGroupService.get(queryParamProvisionedTrue).collectList().block();
        List<UserGroup> provisionedFalseUserGroupInProvisionedTrueCallList = userGroupListProvisionedTrue.stream()
                .filter(group -> group.getId().equals(userGroupDTOProvisionedFalse.getId()))
                .toList();
        assertThat(provisionedFalseUserGroupInProvisionedTrueCallList).hasSize(0);
        List<UserGroup> provisionedTrueUserGroupInProvisionedTrueCallList = userGroupListProvisionedTrue.stream()
                .filter(group -> group.getId().equals(userGroupDTOProvisionedTrue.getId()))
                .toList();
        assertThat(provisionedTrueUserGroupInProvisionedTrueCallList).hasSize(1);

        List<UserGroup> userGroupListProvisionedNotBoolean = userGroupService
                .get(queryParamProvisionedNotBoolean)
                .collectList()
                .block();
        List<UserGroup> provisionedFalseUserGroupInProvisionedNotBooleanCallList =
                userGroupListProvisionedNotBoolean.stream()
                        .filter(group -> group.getId().equals(userGroupDTOProvisionedFalse.getId()))
                        .toList();
        assertThat(provisionedFalseUserGroupInProvisionedNotBooleanCallList).hasSize(1);
        List<UserGroup> provisionedTrueUserGroupInProvisionedNotBooleanCallList =
                userGroupListProvisionedNotBoolean.stream()
                        .filter(group -> group.getId().equals(userGroupDTOProvisionedTrue.getId()))
                        .toList();
        assertThat(provisionedTrueUserGroupInProvisionedNotBooleanCallList).hasSize(1);
    }

    @Test
    @WithUserDetails(value = "provisioningUser")
    public void testUpdateGroups_sendNullUserInUpdate() {
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.TRUE);
        String testName = "testUpdateGroups_sendNullUserInUpdate";
        User user1 = new User();
        user1.setEmail(testName + "_provisioned_user1@appsmith.com");
        ProvisionResourceDto provisionedUser1 =
                userService.createProvisionUser(user1).block();

        UserGroup userGroup_provisioning = new UserGroup();
        userGroup_provisioning.setName(testName + "_provisionedGroup");
        ProvisionResourceDto provisionedUserGroup =
                userGroupService.createProvisionGroup(userGroup_provisioning).block();

        UsersForGroupDTO addUsersForGroupDTO = new UsersForGroupDTO();
        addUsersForGroupDTO.setGroupIds(
                Set.of(provisionedUserGroup.getResource().getId()));
        addUsersForGroupDTO.setUserIds(List.of(provisionedUser1.getResource().getId()));

        userGroupService.addUsersToProvisionGroup(addUsersForGroupDTO).block();

        ProvisionResourceDto provisionedUserGroupPostInviting = userGroupService
                .getProvisionGroup(provisionedUserGroup.getResource().getId())
                .block();
        UserGroup provisionedUserGroupResourcePostInviting = (UserGroup) provisionedUserGroupPostInviting.getResource();
        assertThat(provisionedUserGroupResourcePostInviting.getUsers())
                .containsExactlyInAnyOrder(provisionedUser1.getResource().getId());

        UserGroupUpdateDTO userGroupUpdateDTO1 = new UserGroupUpdateDTO();
        userGroupUpdateDTO1.setName(testName + "_provisionedGroup" + "_updated1");
        ProvisionResourceDto provisionedUserGroupPostUpdate1 = userGroupService
                .updateProvisionGroup(provisionedUserGroupResourcePostInviting.getId(), userGroupUpdateDTO1)
                .block();
        UserGroup provisionedUserGroupResourcePostUpdate1 = (UserGroup) provisionedUserGroupPostUpdate1.getResource();
        assertThat(provisionedUserGroupResourcePostUpdate1.getName())
                .isEqualTo(testName + "_provisionedGroup" + "_updated1");
        assertThat(provisionedUserGroupResourcePostUpdate1.getUsers())
                .containsExactlyInAnyOrder(provisionedUser1.getResource().getId());

        UserGroupUpdateDTO userGroupUpdateDTO2 = new UserGroupUpdateDTO();
        userGroupUpdateDTO2.setName(testName + "_provisionedGroup" + "_updated2");
        userGroupUpdateDTO2.setUsers(null);
        ProvisionResourceDto provisionedUserGroupPostUpdate2 = userGroupService
                .updateProvisionGroup(provisionedUserGroupResourcePostInviting.getId(), userGroupUpdateDTO2)
                .block();
        UserGroup provisionedUserGroupResourcePostUpdate2 = (UserGroup) provisionedUserGroupPostUpdate2.getResource();
        assertThat(provisionedUserGroupResourcePostUpdate2.getName())
                .isEqualTo(testName + "_provisionedGroup" + "_updated2");
        assertThat(provisionedUserGroupResourcePostUpdate2.getUsers())
                .containsExactlyInAnyOrder(provisionedUser1.getResource().getId());

        UserGroupUpdateDTO userGroupUpdateDTO3 = new UserGroupUpdateDTO();
        userGroupUpdateDTO2.setName(testName + "_provisionedGroup" + "_updated3");
        userGroupUpdateDTO3.setUsers(new HashSet<>());
        ProvisionResourceDto provisionedUserGroupPostUpdate3 = userGroupService
                .updateProvisionGroup(provisionedUserGroupResourcePostInviting.getId(), userGroupUpdateDTO3)
                .block();
        UserGroup provisionedUserGroupResourcePostUpdate3 = (UserGroup) provisionedUserGroupPostUpdate3.getResource();
        assertThat(provisionedUserGroupResourcePostUpdate3.getName())
                .isEqualTo(testName + "_provisionedGroup" + "_updated2");
        assertThat(provisionedUserGroupResourcePostUpdate3.getUsers()).isEmpty();
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.FALSE);
    }

    @Test
    @WithUserDetails(value = "provisioningUser")
    public void testUpdateProvisionGroup_updateName() {
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.TRUE);
        String testName = "testUpdateProvisionGroup_updateName";

        User user1 = new User();
        user1.setEmail(testName + "_provisioned_user1@appsmith.com");
        ProvisionResourceDto provisionedUser1 =
                userService.createProvisionUser(user1).block();

        User user2 = new User();
        user2.setEmail(testName + "_provisioned_user2@appsmith.com");
        ProvisionResourceDto provisionedUser2 =
                userService.createProvisionUser(user2).block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName + "_provisionedGroup");
        ProvisionResourceDto provisionedUserGroup =
                userGroupService.createProvisionGroup(userGroup).block();

        UsersForGroupDTO addUsersForGroupDTO = new UsersForGroupDTO();
        addUsersForGroupDTO.setGroupIds(
                Set.of(provisionedUserGroup.getResource().getId()));
        addUsersForGroupDTO.setUserIds(List.of(
                provisionedUser1.getResource().getId(),
                provisionedUser2.getResource().getId()));

        userGroupService.addUsersToProvisionGroup(addUsersForGroupDTO).block();

        UserGroupUpdateDTO userGroupUpdateDTO = new UserGroupUpdateDTO();
        userGroupUpdateDTO.setName(testName + "_provisionedGroup" + "_updated");

        ProvisionResourceDto updatedProvisionedUserGroup = userGroupService
                .updateProvisionGroup(provisionedUserGroup.getResource().getId(), userGroupUpdateDTO)
                .block();
        UserGroup updatedUserGroup = (UserGroup) updatedProvisionedUserGroup.getResource();

        assertThat(updatedUserGroup.getName()).isEqualTo(testName + "_provisionedGroup" + "_updated");
        assertThat(updatedUserGroup.getUsers())
                .containsExactlyInAnyOrder(
                        provisionedUser1.getResource().getId(),
                        provisionedUser2.getResource().getId());
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.FALSE);
    }

    @Test
    @WithUserDetails(value = "provisioningUser")
    public void testUpdateProvisionGroup_updateUserListWithOneMoreUser() {
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.TRUE);
        String testName = "testUpdateProvisionGroup_updateUserListWithOneMoreUser";

        User user1 = new User();
        user1.setEmail(testName + "_provisioned_user1@appsmith.com");
        ProvisionResourceDto provisionedUser1 =
                userService.createProvisionUser(user1).block();

        User user2 = new User();
        user2.setEmail(testName + "_provisioned_user2@appsmith.com");
        ProvisionResourceDto provisionedUser2 =
                userService.createProvisionUser(user2).block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName + "_provisionedGroup");
        ProvisionResourceDto provisionedUserGroup =
                userGroupService.createProvisionGroup(userGroup).block();

        UsersForGroupDTO addUsersForGroupDTO = new UsersForGroupDTO();
        addUsersForGroupDTO.setGroupIds(
                Set.of(provisionedUserGroup.getResource().getId()));
        addUsersForGroupDTO.setUserIds(List.of(provisionedUser1.getResource().getId()));

        userGroupService.addUsersToProvisionGroup(addUsersForGroupDTO).block();

        UserGroupUpdateDTO userGroupUpdateDTO = new UserGroupUpdateDTO();
        userGroupUpdateDTO.setUsers(Set.of(
                provisionedUser1.getResource().getId(),
                provisionedUser2.getResource().getId()));

        ProvisionResourceDto updatedProvisionedUserGroup = userGroupService
                .updateProvisionGroup(provisionedUserGroup.getResource().getId(), userGroupUpdateDTO)
                .block();
        UserGroup updatedUserGroup = (UserGroup) updatedProvisionedUserGroup.getResource();

        assertThat(updatedUserGroup.getName()).isEqualTo(testName + "_provisionedGroup");
        assertThat(updatedUserGroup.getUsers())
                .containsExactlyInAnyOrder(
                        provisionedUser1.getResource().getId(),
                        provisionedUser2.getResource().getId());
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.FALSE);
    }

    @Test
    @WithUserDetails(value = "provisioningUser")
    public void testUpdateProvisionGroup_updateUserListWithOneLessUser() {
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.TRUE);
        String testName = "testUpdateProvisionGroup_updateUserListWithOneLessUser";

        User user1 = new User();
        user1.setEmail(testName + "_provisioned_user1@appsmith.com");
        ProvisionResourceDto provisionedUser1 =
                userService.createProvisionUser(user1).block();

        User user2 = new User();
        user2.setEmail(testName + "_provisioned_user2@appsmith.com");
        ProvisionResourceDto provisionedUser2 =
                userService.createProvisionUser(user2).block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName + "_provisionedGroup");
        ProvisionResourceDto provisionedUserGroup =
                userGroupService.createProvisionGroup(userGroup).block();

        UsersForGroupDTO addUsersForGroupDTO = new UsersForGroupDTO();
        addUsersForGroupDTO.setGroupIds(
                Set.of(provisionedUserGroup.getResource().getId()));
        addUsersForGroupDTO.setUserIds(List.of(
                provisionedUser1.getResource().getId(),
                provisionedUser2.getResource().getId()));

        userGroupService.addUsersToProvisionGroup(addUsersForGroupDTO).block();

        UserGroupUpdateDTO userGroupUpdateDTO = new UserGroupUpdateDTO();
        userGroupUpdateDTO.setUsers(Set.of(provisionedUser1.getResource().getId()));

        ProvisionResourceDto updatedProvisionedUserGroup = userGroupService
                .updateProvisionGroup(provisionedUserGroup.getResource().getId(), userGroupUpdateDTO)
                .block();
        UserGroup updatedUserGroup = (UserGroup) updatedProvisionedUserGroup.getResource();

        assertThat(updatedUserGroup.getName()).isEqualTo(testName + "_provisionedGroup");
        assertThat(updatedUserGroup.getUsers())
                .containsExactlyInAnyOrder(provisionedUser1.getResource().getId());
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.FALSE);
    }

    @Test
    @WithUserDetails(value = "provisioningUser")
    public void testUpdateProvisionGroup_updateUserListWithCompletelyDifferentList() {
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.TRUE);
        String testName = "testUpdateProvisionGroup_updateUserListWithCompletelyDifferentList";

        User user1 = new User();
        user1.setEmail(testName + "_provisioned_user1@appsmith.com");
        ProvisionResourceDto provisionedUser1 =
                userService.createProvisionUser(user1).block();

        User user2 = new User();
        user2.setEmail(testName + "_provisioned_user2@appsmith.com");
        ProvisionResourceDto provisionedUser2 =
                userService.createProvisionUser(user2).block();

        User user3 = new User();
        user3.setEmail(testName + "_provisioned_user3@appsmith.com");
        ProvisionResourceDto provisionedUser3 =
                userService.createProvisionUser(user3).block();

        User user4 = new User();
        user4.setEmail(testName + "_provisioned_user4@appsmith.com");
        ProvisionResourceDto provisionedUser4 =
                userService.createProvisionUser(user4).block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName + "_provisionedGroup");
        ProvisionResourceDto provisionedUserGroup =
                userGroupService.createProvisionGroup(userGroup).block();

        UsersForGroupDTO addUsersForGroupDTO = new UsersForGroupDTO();
        addUsersForGroupDTO.setGroupIds(
                Set.of(provisionedUserGroup.getResource().getId()));
        addUsersForGroupDTO.setUserIds(List.of(
                provisionedUser1.getResource().getId(),
                provisionedUser2.getResource().getId()));

        userGroupService.addUsersToProvisionGroup(addUsersForGroupDTO).block();

        UserGroupUpdateDTO userGroupUpdateDTO = new UserGroupUpdateDTO();
        userGroupUpdateDTO.setUsers(Set.of(
                provisionedUser3.getResource().getId(),
                provisionedUser4.getResource().getId()));

        ProvisionResourceDto updatedProvisionedUserGroup = userGroupService
                .updateProvisionGroup(provisionedUserGroup.getResource().getId(), userGroupUpdateDTO)
                .block();
        UserGroup updatedUserGroup = (UserGroup) updatedProvisionedUserGroup.getResource();

        assertThat(updatedUserGroup.getName()).isEqualTo(testName + "_provisionedGroup");
        assertThat(updatedUserGroup.getUsers())
                .containsExactlyInAnyOrder(
                        provisionedUser3.getResource().getId(),
                        provisionedUser4.getResource().getId());
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.FALSE);
    }

    @Test
    @WithUserDetails(value = "provisioningUser")
    public void testUpdateProvisionGroup_updateUserListWithOneDifferentUser() {
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.TRUE);
        String testName = "testUpdateProvisionGroup_updateUserListWithOneDifferentUser";

        User user1 = new User();
        user1.setEmail(testName + "_provisioned_user1@appsmith.com");
        ProvisionResourceDto provisionedUser1 =
                userService.createProvisionUser(user1).block();

        User user2 = new User();
        user2.setEmail(testName + "_provisioned_user2@appsmith.com");
        ProvisionResourceDto provisionedUser2 =
                userService.createProvisionUser(user2).block();

        User user3 = new User();
        user3.setEmail(testName + "_provisioned_user3@appsmith.com");
        ProvisionResourceDto provisionedUser3 =
                userService.createProvisionUser(user3).block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName + "_provisionedGroup");
        ProvisionResourceDto provisionedUserGroup =
                userGroupService.createProvisionGroup(userGroup).block();

        UsersForGroupDTO addUsersForGroupDTO = new UsersForGroupDTO();
        addUsersForGroupDTO.setGroupIds(
                Set.of(provisionedUserGroup.getResource().getId()));
        addUsersForGroupDTO.setUserIds(List.of(
                provisionedUser1.getResource().getId(),
                provisionedUser2.getResource().getId()));

        userGroupService.addUsersToProvisionGroup(addUsersForGroupDTO).block();

        UserGroupUpdateDTO userGroupUpdateDTO = new UserGroupUpdateDTO();
        userGroupUpdateDTO.setUsers(Set.of(
                provisionedUser3.getResource().getId(),
                provisionedUser1.getResource().getId()));

        ProvisionResourceDto updatedProvisionedUserGroup = userGroupService
                .updateProvisionGroup(provisionedUserGroup.getResource().getId(), userGroupUpdateDTO)
                .block();
        UserGroup updatedUserGroup = (UserGroup) updatedProvisionedUserGroup.getResource();

        assertThat(updatedUserGroup.getName()).isEqualTo(testName + "_provisionedGroup");
        assertThat(updatedUserGroup.getUsers())
                .containsExactlyInAnyOrder(
                        provisionedUser3.getResource().getId(),
                        provisionedUser1.getResource().getId());
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.FALSE);
    }

    @Test
    @WithUserDetails(value = "provisioningUser")
    public void testUpdateProvisionGroup_updateNameDescriptionAndUsersList_testRaceCondition() {
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.TRUE);
        String testName = "testUpdateProvisionGroup_updateNameDescriptionAndUsersList_testRaceCondition";

        User user1 = new User();
        user1.setEmail(testName + "_provisioned_user1@appsmith.com");
        ProvisionResourceDto provisionedUser1 =
                userService.createProvisionUser(user1).block();

        User user2 = new User();
        user2.setEmail(testName + "_provisioned_user2@appsmith.com");
        ProvisionResourceDto provisionedUser2 =
                userService.createProvisionUser(user2).block();

        User user3 = new User();
        user3.setEmail(testName + "_provisioned_user3@appsmith.com");
        ProvisionResourceDto provisionedUser3 =
                userService.createProvisionUser(user3).block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName + "_provisionedGroup");
        ProvisionResourceDto provisionedUserGroup =
                userGroupService.createProvisionGroup(userGroup).block();

        UsersForGroupDTO addUsersForGroupDTO = new UsersForGroupDTO();
        addUsersForGroupDTO.setGroupIds(
                Set.of(provisionedUserGroup.getResource().getId()));
        addUsersForGroupDTO.setUserIds(List.of(
                provisionedUser1.getResource().getId(),
                provisionedUser2.getResource().getId()));

        userGroupService.addUsersToProvisionGroup(addUsersForGroupDTO).block();

        UserGroupUpdateDTO userGroupUpdateDTO = new UserGroupUpdateDTO();
        userGroupUpdateDTO.setName(testName + "_provisionedGroup_updated");
        userGroupUpdateDTO.setUsers(Set.of(
                provisionedUser3.getResource().getId(),
                provisionedUser1.getResource().getId()));

        ProvisionResourceDto updatedProvisionedUserGroup = userGroupService
                .updateProvisionGroup(provisionedUserGroup.getResource().getId(), userGroupUpdateDTO)
                .block();
        UserGroup updatedUserGroup = (UserGroup) updatedProvisionedUserGroup.getResource();

        assertThat(updatedUserGroup.getName()).isEqualTo(testName + "_provisionedGroup_updated");
        assertThat(updatedUserGroup.getUsers())
                .containsExactlyInAnyOrder(
                        provisionedUser3.getResource().getId(),
                        provisionedUser1.getResource().getId());
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, Boolean.FALSE);
    }
}
