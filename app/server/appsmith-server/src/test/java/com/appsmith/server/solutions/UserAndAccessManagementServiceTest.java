package com.appsmith.server.solutions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.UserForManagementDTO;
import com.appsmith.server.dtos.UserGroupDTO;
import com.appsmith.server.dtos.UsersForGroupDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.UserGroupService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.server.constants.FieldName.ANONYMOUS_USER;
import static com.appsmith.server.constants.FieldName.DEFAULT_USER_PERMISSION_GROUP;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@ExtendWith(SpringExtension.class)
public class UserAndAccessManagementServiceTest {

    @Autowired
    UserAndAccessManagementService userAndAccessManagementService;

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserUtils userUtils;

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    UserGroupService userGroupService;

    @Autowired
    UserService userService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    UserDataRepository userDataRepository;


    User api_user = null;

    String superAdminPermissionGroupId = null;

    @BeforeEach
    public void setup() {
        if (api_user == null) {
            api_user = userRepository.findByEmail("api_user").block();
        }

        // Make api_user instance administrator before starting the test
        userUtils.makeSuperUser(List.of(api_user)).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getAllUsersForManagementTest_valid() {

        Mono<List<UserForManagementDTO>> allUsersMono = userAndAccessManagementService.getAllUsers();

        StepVerifier.create(allUsersMono)
                .assertNext(users -> {
                    assertThat(users).isNotNull();
                    assertThat(users.size()).isGreaterThan(0);

                    UserForManagementDTO apiUserDto = users.stream().filter(user -> user.getUsername().equals("api_user")).findFirst().get();
                    assertThat(apiUserDto.getId()).isEqualTo(api_user.getId());
                    assertThat(apiUserDto.getGroups().size()).isEqualTo(0);
                    assertThat(apiUserDto.getRoles().size()).isEqualTo(2);

                    boolean adminRole = apiUserDto.getRoles().stream()
                            .anyMatch(role -> "Instance Administrator Role".equals(role.getName()));
                    assertThat(adminRole).isTrue();

                    boolean defaultUserRole = apiUserDto.getRoles().stream()
                            .anyMatch(role -> DEFAULT_USER_PERMISSION_GROUP.equals(role.getName()));
                    assertThat(defaultUserRole).isTrue();

                    // Also assert that anonymous user is not returned inside the list of users
                    Optional<UserForManagementDTO> anonymousUserOptional = users.stream().filter(user -> user.getUsername().equals(ANONYMOUS_USER)).findFirst();
                    assertThat(anonymousUserOptional.isPresent()).isFalse();

                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void getAllUsersForManagementTest_invalid() {
        Mono<List<UserForManagementDTO>> allUsersMono = userAndAccessManagementService.getAllUsers();

        StepVerifier.create(allUsersMono)
                .expectErrorMatches(throwable ->
                        throwable instanceof AppsmithException &&
                                throwable.getMessage()
                                        .equals(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS).getMessage())
                )
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getSingleUserForManagementTest_valid() {

        Mono<UserForManagementDTO> userByIdMono = userAndAccessManagementService.getUserById(api_user.getId());

        StepVerifier.create(userByIdMono)
                .assertNext(user -> {
                    assertThat(user).isNotNull();

                    assertThat(user.getId()).isEqualTo(api_user.getId());
                    assertThat(user.getGroups().size()).isEqualTo(0);
                    assertThat(user.getRoles().size()).isEqualTo(2);

                    Optional<PermissionGroupInfoDTO> adminRole = user.getRoles().stream()
                            .filter(role -> "Instance Administrator Role".equals(role.getName())).findFirst();
                    assertThat(adminRole.isPresent()).isTrue();
                    assertThat(adminRole.get().isAutoCreated()).isTrue();

                    boolean defaultUserRole = user.getRoles().stream()
                            .anyMatch(role -> DEFAULT_USER_PERMISSION_GROUP.equals(role.getName()));
                    assertThat(defaultUserRole).isTrue();

                    // Assert that name is also returned.
                    assertThat(user.getName()).isEqualTo("api_user");

                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void getSingleUserForManagementTest_invalid() {
        Mono<UserForManagementDTO> userByIdMono = userAndAccessManagementService.getUserById(api_user.getId());

        StepVerifier.create(userByIdMono)
                .expectErrorMatches(throwable ->
                        throwable instanceof AppsmithException &&
                                throwable.getMessage()
                                        .equals(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS).getMessage())
                )
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteUserTest_valid() {
        User newUser = new User();
        String email = "deleteUserTest_valid@email.com";
        newUser.setEmail(email);
        newUser.setPassword("deleteUserTest_valid password");

        User createdUser = userService.create(newUser).block();

        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("deleteUserTest_valid permission group");
        permissionGroup.setAssignedToUserIds(Set.of(createdUser.getId()));
        PermissionGroup existingPermissionGroup = permissionGroupService.create(permissionGroup).block();

        UserGroup ug = new UserGroup();
        ug.setName("deleteUserTest_valid User Group");
        UserGroupDTO createdUserGroup = userGroupService.createGroup(ug).block();

        // Delete the user
        userAndAccessManagementService.deleteUser(createdUser.getId()).block();

        Mono<PermissionGroup> existingPermissionGroupPostDeleteMono = permissionGroupService.findById(existingPermissionGroup.getId());
        Mono<UserGroup> existingGroupAfterDeleteMono = userGroupService.findById(createdUserGroup.getId(), AclPermission.READ_USER_GROUPS);

        StepVerifier.create(Mono.zip(existingPermissionGroupPostDeleteMono, existingGroupAfterDeleteMono))
                .assertNext(tuple -> {
                    PermissionGroup pgPostDelete = tuple.getT1();
                    UserGroup userGroup = tuple.getT2();

                    assertThat(pgPostDelete.getAssignedToUserIds()).doesNotContain(createdUser.getId());
                    assertThat(userGroup.getUsers()).doesNotContain(createdUserGroup.getId());
                })
                .verifyComplete();

        User userFetchedAfterDelete = userService.findByEmail(email).block();
        assertThat(userFetchedAfterDelete).isNull();
        UserData userDataAfterDelete = userDataRepository.findByUserId(createdUser.getId()).block();
        assertThat(userDataAfterDelete).isNull();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteUser_ReAdded_Test_valid() {
        User newUser = new User();
        String email = "deleteuser_readded_test_valid@email.com";
        newUser.setEmail(email);
        newUser.setPassword("deleteUser_ReAdded_Test_valid password");

        User createdUser = userService.create(newUser).block();

        // Delete the user
        userAndAccessManagementService.deleteUser(createdUser.getId()).block();

        User userFetchedAfterDelete = userService.findByEmail(email).block();
        assertThat(userFetchedAfterDelete).isNull();
        UserData userDataAfterDelete = userDataRepository.findByUserId(createdUser.getId()).block();
        assertThat(userDataAfterDelete).isNull();

        // Now invite the user. The invite should happen without any issues.

        UserGroup userGroup = new UserGroup();
        String name = "Test Group : deleteUser_ReAdded_Test_valid";
        String description = "Test Group Description : deleteUser_ReAdded_Test_valid";
        userGroup.setName(name);
        userGroup.setDescription(description);

        UserGroupDTO createdGroup = userGroupService.createGroup(userGroup).block();

        UsersForGroupDTO inviteUsersToGroupDTO = new UsersForGroupDTO();
        inviteUsersToGroupDTO.setUsernames(Set.of(email));
        inviteUsersToGroupDTO.setGroupIds(Set.of(createdGroup.getId()));

        StepVerifier.create(userGroupService.inviteUsers(inviteUsersToGroupDTO, "origin"))
                .assertNext(groups -> {
                    // assert that the user got added to the user group.
                    assertThat(groups).hasSize(1);
                    UserGroupDTO group = groups.get(0);
                    // assert that updated group did not edit the existing settings
                    assertEquals(createdGroup.getId(), group.getId());
                    assertEquals(createdGroup.getTenantId(), group.getTenantId());
                    assertEquals(createdGroup.getName(), group.getName());
                    assertEquals(createdGroup.getDescription(), group.getDescription());

                    // assert that the user was added to the group
                    assertEquals(1, group.getUsers().size());
                    assertEquals(email, group.getUsers().get(0).getUsername());

                    // assert that this is a different user
                    assertThat(createdUser.getId()).isNotEqualTo(group.getUsers().get(0).getId());
                })
                .verifyComplete();


    }

    @Test
    @WithUserDetails(value = "api_user")
    public void inviteGroupTest_valid() {
        UserGroup ug = new UserGroup();
        ug.setName("inviteGroupTest_valid User Group");
        UserGroupDTO createdUserGroup = userGroupService.createGroup(ug).block();

        Workspace workspace = new Workspace();
        workspace.setName("inviteUserAndGroupTest_valid Workspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();
        String permissionGroupId = createdWorkspace.getDefaultPermissionGroups().stream().findFirst().get();

        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        inviteUsersDTO.setPermissionGroupId(permissionGroupId);
        inviteUsersDTO.setGroups(Set.of(createdUserGroup.getId()));

        // Now invite the user group to the permission group
        userAndAccessManagementService.inviteUsers(inviteUsersDTO, "origin").block();

        // fetch the permission group after inviting and assert
        StepVerifier.create(permissionGroupService.findById(permissionGroupId))
                .assertNext(permissionGroup -> {
                    assertThat(permissionGroup.getAssignedToGroupIds()).contains(createdUserGroup.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void inviteUserAndGroupTest_valid() {
        UserGroup ug = new UserGroup();
        ug.setName("inviteUserAndGroupTest_valid User Group");
        UserGroupDTO createdUserGroup = userGroupService.createGroup(ug).block();

        Workspace workspace = new Workspace();
        workspace.setName("inviteUserAndGroupTest_valid Workspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();
        String permissionGroupId = createdWorkspace.getDefaultPermissionGroups().stream().findFirst().get();


        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        inviteUsersDTO.setPermissionGroupId(permissionGroupId);
        inviteUsersDTO.setGroups(Set.of(createdUserGroup.getId()));
        inviteUsersDTO.setUsernames(List.of(UUID.randomUUID().toString()));

        // Now invite the user group to the permission group
        List<User> invitedUsers = userAndAccessManagementService.inviteUsers(inviteUsersDTO, "origin").block();

        assertThat(invitedUsers).isNotNull();
        assertThat(invitedUsers.size()).isEqualTo(1);
        assertThat(invitedUsers.get(0).getEmail()).isEqualTo(inviteUsersDTO.getUsernames().get(0));

        // fetch the permission group after inviting and assert
        StepVerifier.create(permissionGroupService.findById(permissionGroupId))
                .assertNext(permissionGroup -> {
                    assertThat(permissionGroup.getAssignedToGroupIds()).contains(createdUserGroup.getId());
                })
                .verifyComplete();
    }
}
