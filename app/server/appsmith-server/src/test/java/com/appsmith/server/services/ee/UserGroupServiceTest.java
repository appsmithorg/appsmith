package com.appsmith.server.services.ee;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.UserGroupService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import lombok.extern.slf4j.Slf4j;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.util.LinkedMultiValueMap;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.ADD_USERS_TO_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.DELETE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.MANAGE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.READ_USER_GROUPS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
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

    User api_user = null;

    Set<String> superAdminIds;

    String superAdminPermissionGroupId = null;

    @Before
    public void setup() {
        if (api_user == null) {
            api_user = userRepository.findByEmail("api_user").block();
        }
        // Create a new user
        User newUser = new User();
        newUser.setEmail(UUID.randomUUID().toString() + "@email.com");
        newUser.setPassword("password");
        User anotherAdminUser = userService.create(newUser).block();

        superAdminIds = Set.of(api_user.getId(), anotherAdminUser.getId());

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

        Mono<UserGroup> createUserGroupMono = userGroupService.create(userGroup)
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

        Mono<UserGroup> createUserGroupMono = userGroupService.create(userGroup);

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
        userGroupService.create(userGroup).block();

        Mono<List<UserGroup>> listMono = userGroupService.get(new LinkedMultiValueMap<>()).collectList();

        StepVerifier.create(listMono)
                .assertNext(list -> {
                    assertThat(list.size()).isGreaterThan(0);

                    // Assert that the created group is returned in the listing.
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
        UserGroup createdUserGroup = userGroupService.create(userGroup).block();

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
        UserGroup createdGroup = userGroupService.create(userGroup).block();

        UserGroup update = new UserGroup();
        name = "Updated Name";
        description = "Updated Description";
        update.setName(name);
        update.setDescription(description);

        Mono<UserGroup> deleteGroupMono = userGroupService.update(createdGroup.getId(), update)
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
        UserGroup createdGroup = userGroupService.create(userGroup).block();

        UserGroup update = new UserGroup();
        update.setUsers(Set.of("invalid-user-id"));

        Mono<UserGroup> deleteGroupMono = userGroupService.update(createdGroup.getId(), update)
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
}
