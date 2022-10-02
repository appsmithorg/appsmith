package com.appsmith.server.services.ee;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.PermissionGroupService;
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
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.DELETE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.MANAGE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.READ_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.UNASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.constants.FieldName.ADMINISTRATOR;
import static com.appsmith.server.constants.FieldName.DEVELOPER;
import static com.appsmith.server.constants.FieldName.INSTANCE_ADMIN_ROLE;
import static com.appsmith.server.constants.FieldName.VIEWER;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class PermissionGroupServiceTest {
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

    @BeforeEach
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

        // Make api_user instance administrator before starting the test
        userUtils.makeSuperUser(List.of(api_user)).block();

        if (superAdminPermissionGroupId == null) {
            superAdminPermissionGroupId = userUtils.getSuperAdminPermissionGroup().block().getId();
        }
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createNewRoleAsSuperAdminTest() {

        PermissionGroup permissionGroup = new PermissionGroup();
        String name = "Test Role";
        String description = "Test Role Description";
        permissionGroup.setName(name);
        permissionGroup.setDescription(description);

        Mono<PermissionGroup> createPermissionGroupMono = permissionGroupService.create(permissionGroup)
                // Assert that the created role is also editable by the user who created it
                .flatMap(permissionGroup1 -> permissionGroupService.findById(permissionGroup1.getId(), MANAGE_PERMISSION_GROUPS));

        StepVerifier.create(createPermissionGroupMono)
                .assertNext(permissionGroup1 -> {
                    assertEquals(name, permissionGroup1.getName());
                    assertEquals(description, permissionGroup1.getDescription());
                    assertThat(permissionGroup1.getTenantId()).isNotNull();

                    String id = permissionGroup1.getId();

                    Policy managePgPolicy = Policy.builder()
                            .permission(MANAGE_PERMISSION_GROUPS.getValue())
                            .permissionGroups(Set.of(superAdminPermissionGroupId))
                            .build();
                    Policy readPgPolicy = Policy.builder()
                            .permission(READ_PERMISSION_GROUPS.getValue())
                            .permissionGroups(Set.of(superAdminPermissionGroupId))
                            .build();
                    Policy deletePgPolicy = Policy.builder()
                            .permission(DELETE_PERMISSION_GROUPS.getValue())
                            .permissionGroups(Set.of(superAdminPermissionGroupId))
                            .build();
                    Policy assignPgPolicy = Policy.builder()
                            .permission(ASSIGN_PERMISSION_GROUPS.getValue())
                            .permissionGroups(Set.of(superAdminPermissionGroupId))
                            .build();
                    // The user who created the role should be always have unassign permission on the role they created.
                    Policy unassignPgPolicy = Policy.builder()
                            .permission(UNASSIGN_PERMISSION_GROUPS.getValue())
                            .permissionGroups(Set.of(superAdminPermissionGroupId, id))
                            .build();


                    assertThat(permissionGroup1.getPolicies()).containsAll(
                            Set.of(managePgPolicy, readPgPolicy, deletePgPolicy, assignPgPolicy, unassignPgPolicy)
                    );
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void createNewRoleAsNonSuperAdminTest() {

        PermissionGroup permissionGroup = new PermissionGroup();
        String name = "Test Role";
        String description = "Test Role Description";
        permissionGroup.setName(name);
        permissionGroup.setDescription(description);

        Mono<PermissionGroup> createPermissionGroupMono = permissionGroupService.create(permissionGroup);

        StepVerifier.create(createPermissionGroupMono)
                .expectErrorMatches(throwable ->
                        throwable instanceof AppsmithException &&
                                throwable.getMessage().contains(AppsmithError.ACTION_IS_NOT_AUTHORIZED.getMessage("Create Role")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void listRolesTestAsSuperAdminTest() {

        // Create default workspaces for api_user
        workspaceService.createDefault(new Workspace(), api_user).block();

        Mono<List<PermissionGroupInfoDTO>> listMono = permissionGroupService.getAll();

        StepVerifier.create(listMono)
                .assertNext(list -> {
                    // 3 default roles per user (user@test, api_user, and new user created in setup) + 1 super admin role
                    assertThat(list.size()).isEqualTo(10);

                    // Assert that instance admin roles are returned
                    assertThat(list.stream()
                            .filter(permissionGroupInfoDTO -> permissionGroupInfoDTO.getName().equals(INSTANCE_ADMIN_ROLE))
                            .findFirst()
                            .isPresent()
                    ).isTrue();

                    // Assert that workspace roles are returned
                    assertThat(list.stream()
                            .filter(permissionGroupInfoDTO -> permissionGroupInfoDTO.getName().startsWith(ADMINISTRATOR))
                            .collect(Collectors.toSet()))
                            .hasSize(3);
                    assertThat(list.stream()
                            .filter(permissionGroupInfoDTO -> permissionGroupInfoDTO.getName().startsWith(DEVELOPER))
                            .collect(Collectors.toSet()))
                            .hasSize(3);
                    assertThat(list.stream()
                            .filter(permissionGroupInfoDTO -> permissionGroupInfoDTO.getName().startsWith(VIEWER))
                            .collect(Collectors.toSet()))
                            .hasSize(3);
                })
                .verifyComplete();

    }


    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void listRolesTestAsNonSuperAdminTest() {

        // Create default workspaces for usertest@usertest.com
        User usertest = userRepository.findByEmail("usertest@usertest.com").block();
        workspaceService.createDefault(new Workspace(), usertest).block();

        Mono<List<PermissionGroupInfoDTO>> listMono = permissionGroupService.getAll();

        StepVerifier.create(listMono)
                .assertNext(list -> {
                    assertThat(list.size()).isEqualTo(3);

                    // Assert that instance admin role is not returned
                    assertThat(list.stream()
                            .filter(permissionGroupInfoDTO -> permissionGroupInfoDTO.getName().equals(INSTANCE_ADMIN_ROLE))
                            .findFirst()
                            .isPresent()
                    ).isFalse();

                    // Assert that workspace roles are returned
                    assertThat(list.stream()
                            .filter(permissionGroupInfoDTO -> permissionGroupInfoDTO.getName().startsWith(ADMINISTRATOR))
                            .findFirst()
                            .get())
                            .isNotNull();
                    assertThat(list.stream()
                            .filter(permissionGroupInfoDTO -> permissionGroupInfoDTO.getName().startsWith(DEVELOPER))
                            .findFirst()
                            .get())
                            .isNotNull();
                    assertThat(list.stream()
                            .filter(permissionGroupInfoDTO -> permissionGroupInfoDTO.getName().startsWith(VIEWER))
                            .findFirst()
                            .get())
                            .isNotNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteCustomCreatedRoleTest() {

        PermissionGroup permissionGroup = new PermissionGroup();
        String name = "deleteCustomCreatedRoleTest Test Role";
        String description = "deleteCustomCreatedRoleTest Test Role Description";
        permissionGroup.setName(name);
        permissionGroup.setDescription(description);

        PermissionGroup createdRole = permissionGroupService.create(permissionGroup).block();

        Mono<PermissionGroup> deletePermissionGroupMono = permissionGroupService.archiveById(createdRole.getId())
                .then(permissionGroupService.findById(createdRole.getId(), READ_PERMISSION_GROUPS));

        StepVerifier.create(deletePermissionGroupMono)
                .expectNextCount(0)
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteDefaultWorkspaceRole_notAllowedTest() {

        Workspace toCreate = new Workspace();
        toCreate.setName("deleteDefaultWorkspaceRole_notAllowedTest Workspace");
        Workspace createdWorkspace = workspaceService.create(toCreate).block();
        String defaultPermissionGroupId = createdWorkspace.getDefaultPermissionGroups().stream().findFirst().get();

        Mono<PermissionGroup> deletePermissionGroupMono = permissionGroupService.archiveById(defaultPermissionGroupId);

        StepVerifier.create(deletePermissionGroupMono)
                .expectErrorMatches(throwable ->
                        throwable instanceof AppsmithException &&
                                throwable.getMessage().contains(AppsmithError.UNAUTHORIZED_ACCESS.getMessage())
                )
                .verify();

        // Assert that the role is not deleted
        Mono<PermissionGroup> defaultPermissionGroupMono = permissionGroupService.findById(defaultPermissionGroupId, READ_PERMISSION_GROUPS);
        StepVerifier.create(defaultPermissionGroupMono)
                .assertNext(permissionGroup -> {
                    assertThat(permissionGroup.getId()).isEqualTo(defaultPermissionGroupId);
                })
                .verifyComplete();


    }

}
