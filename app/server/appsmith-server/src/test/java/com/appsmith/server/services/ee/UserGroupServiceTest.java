package com.appsmith.server.services.ee;

import com.appsmith.external.models.Policy;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.UpdateGroupMembershipDTO;
import com.appsmith.server.dtos.UserGroupDTO;
import com.appsmith.server.dtos.UserCompactDTO;
import com.appsmith.server.dtos.UsersForGroupDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.UserGroupService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.util.LinkedMultiValueMap;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.ADD_USERS_TO_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.DELETE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.MANAGE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.READ_USER_GROUPS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.AssertionsForClassTypes.fail;
import static org.junit.jupiter.api.Assertions.assertEquals;

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

    User api_user = null;
    User admin_user = null;

    Set<String> superAdminIds;

    String superAdminPermissionGroupId = null;

    @BeforeEach
    public void setup() {

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
            superAdminPermissionGroupId = userUtils.getSuperAdminPermissionGroup().block().getId();
        }
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createNewGroupAsSuperAdminTest() {

        UserGroup userGroup = new UserGroup();
        String name = "Test Group";
        String description = "Test Group Description";
        userGroup.setName(name);
        userGroup.setDescription(description);

        Mono<UserGroup> createUserGroupMono = userGroupService.createGroup(userGroup)
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

                    assertThat(createdUserGroup.getPolicies()).containsAll(
                            Set.of(manageGroupPolicy, readGroupPolicy, deleteGroupPolicy, inviteGroupPolicy)
                    );
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
                .expectErrorMatches(throwable ->
                        throwable instanceof AppsmithException &&
                                throwable.getMessage().contains(AppsmithError.ACTION_IS_NOT_AUTHORIZED.getMessage("create user groups")))
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

        Mono<List<UserGroup>> listMono = userGroupService.get(new LinkedMultiValueMap<>()).collectList();

        StepVerifier.create(listMono)
                .assertNext(list -> {
                    assertThat(list.size()).isGreaterThan(0);

                    // Assert that the created group is returned inside the listing.
                    assertThat(list.stream()
                            .filter(userGroup1 -> userGroup1.getName().equals(name))
                            .findFirst()
                            .isPresent()
                    ).isTrue();
                })
                .verifyComplete();

    }


    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void listGroupsAsNonSuperAdminTest() {

        Mono<List<UserGroup>> listMono = userGroupService.get(new LinkedMultiValueMap<>()).collectList();

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

        Mono<UserGroup> deleteGroupMono = userGroupService.archiveById(createdUserGroup.getId())
                .then(userGroupService.findById(createdUserGroup.getId(), READ_USER_GROUPS));

        StepVerifier.create(deleteGroupMono)
                .expectNextCount(0)
                .verifyComplete();
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

        Mono<UserGroup> deleteGroupMono = userGroupService.updateGroup(createdGroup.getId(), update)
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

                    assertThat(group.getPolicies()).containsAll(
                            Set.of(manageGroupPolicy, readGroupPolicy, deleteGroupPolicy, inviteGroupPolicy)
                    );
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

        Mono<UserGroup> deleteGroupMono = userGroupService.updateGroup(createdGroup.getId(), update)
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

                    assertThat(group.getPolicies()).containsAll(
                            Set.of(manageGroupPolicy, readGroupPolicy, deleteGroupPolicy, inviteGroupPolicy)
                    );
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
        PermissionGroup createdRole = permissionGroupService.create(permissionGroup).block();

        // create the group
        UserGroup userGroup = new UserGroup();
        name = "Test Group invalidUpdateGroup_userIds";
        description = "Test Group Description invalidUpdateGroup_userIds";
        userGroup.setName(name);
        userGroup.setDescription(description);
        // Let the users be the same as that of super admins in the group
        userGroup.setUsers(superAdminIds);
        UserGroup createdGroup = userGroupService.createGroup(userGroup)
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
                    group.getUsers().stream().
                            filter(user -> user.getUsername().equals(api_user.getUsername()))
                            .findFirst()
                            .ifPresentOrElse(user -> {
                                        assertEquals(api_user.getName(), user.getName());
                                        assertEquals(api_user.getId(), user.getId());
                                    },
                                    () -> fail("api_user not found")
                            );
                    // Assert that the non api super admin user is returned properly.
                    group.getUsers().stream().
                            filter(user -> user.getUsername().equals(admin_user.getUsername()))
                            .findFirst()
                            .ifPresentOrElse(user -> {
                                        assertEquals(admin_user.getName(), user.getName());
                                        assertEquals(admin_user.getId(), user.getId());
                                    },
                                    () -> fail("admin user not found")

                            );

                    // Assert that the role is returned properly.
                    assertThat(group.getRoles()).containsExactlyInAnyOrder(
                            List.of(createdRole).stream()
                                    .map(role -> {
                                        PermissionGroupInfoDTO permissionGroupInfoDTO = new PermissionGroupInfoDTO();
                                        permissionGroupInfoDTO.setId(role.getId());
                                        permissionGroupInfoDTO.setName(role.getName());
                                        permissionGroupInfoDTO.setDescription(role.getDescription());
                                        permissionGroupInfoDTO.setUserPermissions(role.getUserPermissions());
                                        return permissionGroupInfoDTO;
                                    })
                                    .collect(Collectors.toList())
                                    .get(0)
                    );

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
                        && throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.GROUP_ID))
                )
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
                        && throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.USERNAMES))
                )
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
                    assertEquals(api_user.getUsername(), group1.getUsers().get(0).getUsername());

                    UserGroupDTO group2 = groups.get(1);
                    // assert that updated group did not edit the existing settings
                    assertEquals(createdGroup2.getId(), group2.getId());
                    assertEquals(createdGroup2.getTenantId(), group2.getTenantId());
                    assertEquals(createdGroup2.getName(), group2.getName());
                    assertEquals(createdGroup2.getDescription(), group2.getDescription());

                    // assert that the user was added to the group
                    assertEquals(1, group2.getUsers().size());
                    assertEquals(api_user.getId(), group2.getUsers().get(0).getId());
                    assertEquals(api_user.getUsername(), group2.getUsers().get(0).getUsername());
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

        UserGroupDTO userGroupDTO = userGroupService.inviteUsers(inviteUsersToGroupDTO, "origin").block().get(0);
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
                        && throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.GROUP_ID))
                )
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void invalidRemoveUserToGroup_emptyUsernames() {
        UsersForGroupDTO removeUsersFromGroupDTO = new UsersForGroupDTO();
        removeUsersFromGroupDTO.setGroupIds(Set.of("groupId"));

        StepVerifier.create(userGroupService.removeUsers(removeUsersFromGroupDTO))
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.USERNAMES))
                )
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
                            .findFirst().get();
                    // assert that updated group did not edit the existing settings
                    assertEquals(createdGroup.getId(), group1.getId());
                    assertEquals(createdGroup.getTenantId(), group1.getTenantId());
                    assertEquals(createdGroup.getDescription(), group1.getDescription());

                    // assert that the user was added to the group
                    assertEquals(1, group1.getUsers().size());
                    assertEquals(api_user.getId(), group1.getUsers().get(0).getId());
                    assertEquals(api_user.getUsername(), group1.getUsers().get(0).getUsername());

                    UserGroupDTO group2 = groups.stream()
                            .filter(group -> group.getName().equals(createdGroup2.getName()))
                            .findFirst().get();
                    // assert that updated group did not edit the existing settings
                    assertEquals(createdGroup2.getId(), group2.getId());
                    assertEquals(createdGroup2.getTenantId(), group2.getTenantId());
                    assertEquals(createdGroup2.getDescription(), group2.getDescription());

                    // assert that the user was added to the group
                    assertEquals(1, group2.getUsers().size());
                    assertEquals(api_user.getId(), group2.getUsers().get(0).getId());
                    assertEquals(api_user.getUsername(), group2.getUsers().get(0).getUsername());

                    UserGroupDTO removedGroup = groups.stream()
                            .filter(group -> group.getName().equals(toRemoveCreated.getName()))
                            .findFirst().get();
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
        UserGroup createdUserGroup = userGroupService.createGroup(userGroup)
                .flatMap(userGroupDTO -> userGroupRepository.findById(userGroupDTO.getId()))
                .block();
        assertThat(createdUserGroup.getId()).isNotNull();

        PermissionGroup permissionGroup = new PermissionGroup();
        userGroup.setName("Test Role : testGetUserGroup_roleHaveUserPermission");
        userGroup.setDescription("Test Role Description : testGetUserGroup_roleHaveUserPermission");
        PermissionGroup createdPermissionGroup = permissionGroupService.create(permissionGroup).block();
        assertThat(createdPermissionGroup.getId()).isNotNull();

        permissionGroupService.assignToUserGroup(createdPermissionGroup, createdUserGroup).block();

        UserGroupDTO updatedUserGroup = userGroupService.getGroupById(createdUserGroup.getId()).block();
        assertThat(updatedUserGroup.getRoles()).hasSize(1);
        assertThat(updatedUserGroup.getRoles().get(0).getUserPermissions()).isNotEmpty();

    }
}
