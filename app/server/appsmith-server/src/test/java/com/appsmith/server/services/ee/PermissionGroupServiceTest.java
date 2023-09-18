package com.appsmith.server.services.ee;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.PermissionGroupCompactDTO;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.UpdateRoleAssociationDTO;
import com.appsmith.server.dtos.UserCompactDTO;
import com.appsmith.server.dtos.UserGroupCompactDTO;
import com.appsmith.server.dtos.UserGroupDTO;
import com.appsmith.server.dtos.UsersForGroupDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.UserGroupService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.UserWorkspaceService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import com.appsmith.server.solutions.roles.dtos.RoleViewDTO;
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
import reactor.util.function.Tuple2;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.DELETE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.MANAGE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.READ_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
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
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
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

    @Autowired
    UserGroupService userGroupService;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    UserAndAccessManagementService userAndAccessManagementService;

    @Autowired
    UserWorkspaceService userWorkspaceService;

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
            superAdminPermissionGroupId =
                    userUtils.getSuperAdminPermissionGroup().block().getId();
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

        Mono<PermissionGroup> createPermissionGroupMono = permissionGroupService
                .create(permissionGroup)
                // Assert that the created role is also editable by the user who created it
                .flatMap(permissionGroup1 ->
                        permissionGroupService.findById(permissionGroup1.getId(), MANAGE_PERMISSION_GROUPS));

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
                    Policy unassignPgPolicy = Policy.builder()
                            .permission(UNASSIGN_PERMISSION_GROUPS.getValue())
                            .permissionGroups(Set.of(superAdminPermissionGroupId))
                            .build();

                    assertThat(permissionGroup1.getPolicies())
                            .containsAll(Set.of(
                                    managePgPolicy, readPgPolicy, deletePgPolicy, assignPgPolicy, unassignPgPolicy));

                    assertThat(permissionGroup1.getUserPermissions())
                            .contains(
                                    MANAGE_PERMISSION_GROUPS.getValue(),
                                    READ_PERMISSION_GROUPS.getValue(),
                                    DELETE_PERMISSION_GROUPS.getValue(),
                                    ASSIGN_PERMISSION_GROUPS.getValue(),
                                    UNASSIGN_PERMISSION_GROUPS.getValue());
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
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .contains(AppsmithError.ACTION_IS_NOT_AUTHORIZED.getMessage("Create Role")))
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
                    // 3 default roles per user (user@test, api_user created in setup) + 1 super admin role
                    assertThat(list.size()).isEqualTo(8);

                    // Assert that instance admin roles are returned
                    Optional<PermissionGroupInfoDTO> pgiDTO = list.stream()
                            .filter(permissionGroupInfoDTO ->
                                    permissionGroupInfoDTO.getName().equals(INSTANCE_ADMIN_ROLE))
                            .findFirst();
                    assertThat(pgiDTO.isPresent()).isTrue();
                    assertThat(pgiDTO.get().isAutoCreated()).isTrue();

                    // Assert that workspace roles are returned
                    Set<PermissionGroupInfoDTO> administratorPgiDTOs = list.stream()
                            .filter(permissionGroupInfoDTO ->
                                    permissionGroupInfoDTO.getName().startsWith(ADMINISTRATOR))
                            .collect(Collectors.toSet());
                    assertThat(administratorPgiDTOs).hasSize(2);
                    administratorPgiDTOs.forEach(
                            pgiDTO1 -> assertThat(pgiDTO1.isAutoCreated()).isTrue());

                    Set<PermissionGroupInfoDTO> developerPgiDTOs = list.stream()
                            .filter(permissionGroupInfoDTO ->
                                    permissionGroupInfoDTO.getName().startsWith(DEVELOPER))
                            .collect(Collectors.toSet());
                    assertThat(developerPgiDTOs).hasSize(2);
                    developerPgiDTOs.forEach(
                            pgiDTO1 -> assertThat(pgiDTO1.isAutoCreated()).isTrue());

                    Set<PermissionGroupInfoDTO> viewersPgiDTOs = list.stream()
                            .filter(permissionGroupInfoDTO ->
                                    permissionGroupInfoDTO.getName().startsWith(VIEWER))
                            .collect(Collectors.toSet());
                    assertThat(viewersPgiDTOs).hasSize(2);
                    viewersPgiDTOs.forEach(
                            pgiDTO1 -> assertThat(pgiDTO1.isAutoCreated()).isTrue());

                    // Assert that user permissions is returned for all the permission groups
                    list.stream().forEach(permissionGroupInfoDTO -> {
                        assertThat(permissionGroupInfoDTO.getUserPermissions()).isNotEmpty();
                        assertThat(permissionGroupInfoDTO.getUserPermissions())
                                .contains(READ_PERMISSION_GROUPS.getValue());
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void testGetAllPermissionGroups() {
        PermissionGroup adminPermissionGroup =
                userUtils.getSuperAdminPermissionGroup().block();
        Optional<PermissionGroupInfoDTO> permissionGroupInfoDTO = permissionGroupService.getAll().block().stream()
                .filter(permissionGroup -> permissionGroup.getId().equals(adminPermissionGroup.getId()))
                .findFirst();
        assertThat(permissionGroupInfoDTO.isPresent()).isTrue();
        assertThat(permissionGroupInfoDTO.get().isAutoCreated()).isTrue();
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
                    // No roles should be read by the user since they haven't been given read permissions for any role.
                    assertThat(list.size()).isEqualTo(0);
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

        PermissionGroup createdRole =
                permissionGroupService.create(permissionGroup).block();

        Mono<PermissionGroup> deletePermissionGroupMono = permissionGroupService
                .archiveById(createdRole.getId())
                .then(permissionGroupService.findById(createdRole.getId(), READ_PERMISSION_GROUPS));

        StepVerifier.create(deletePermissionGroupMono).expectNextCount(0).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteDefaultWorkspaceRole_notAllowedTest() {

        Workspace toCreate = new Workspace();
        toCreate.setName("deleteDefaultWorkspaceRole_notAllowedTest Workspace");
        Workspace createdWorkspace = workspaceService.create(toCreate).block();
        String defaultPermissionGroupId = createdWorkspace.getDefaultPermissionGroups().stream()
                .findFirst()
                .get();

        Mono<PermissionGroup> deletePermissionGroupMono = permissionGroupService.archiveById(defaultPermissionGroupId);

        StepVerifier.create(deletePermissionGroupMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.UNAUTHORIZED_ACCESS.getMessage()))
                .verify();

        // Assert that the role is not deleted
        Mono<PermissionGroup> defaultPermissionGroupMono =
                permissionGroupService.findById(defaultPermissionGroupId, READ_PERMISSION_GROUPS);
        StepVerifier.create(defaultPermissionGroupMono)
                .assertNext(permissionGroup -> {
                    assertThat(permissionGroup.getId()).isEqualTo(defaultPermissionGroupId);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testFindConfigurableRoleById() {
        String mockName = "mock-name";
        String mockDescription = "mock description";
        PermissionGroup mockPermissionGroup = new PermissionGroup();
        mockPermissionGroup.setName(mockName);
        mockPermissionGroup.setDescription(mockDescription);

        PermissionGroup createdPermissionGroup = permissionGroupService
                .create(mockPermissionGroup)
                .flatMap(permissionGroup ->
                        permissionGroupService.findById(permissionGroup.getId(), READ_PERMISSION_GROUPS))
                .block();

        Mono<RoleViewDTO> roleViewDTOMono =
                permissionGroupService.findConfigurableRoleById(createdPermissionGroup.getId());

        StepVerifier.create(roleViewDTOMono)
                .assertNext(roleViewDTO -> {
                    assertThat(roleViewDTO).isNotNull();
                    assertThat(roleViewDTO.getId()).isEqualTo(createdPermissionGroup.getId());
                    assertThat(roleViewDTO.getName()).isEqualTo(createdPermissionGroup.getName());
                    assertThat(roleViewDTO.getDescription()).isEqualTo(createdPermissionGroup.getDescription());
                    assertThat(roleViewDTO.getUserPermissions()).isEqualTo(createdPermissionGroup.getUserPermissions());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    @DirtiesContext
    public void testAssignNonExistentUsers() {
        String name = "testBulkAssignMultipleUsersToMultipleRoles Test Role 1";
        PermissionGroup mockPermissionGroup = new PermissionGroup();
        mockPermissionGroup.setName(name);
        PermissionGroup createdPermissionGroup = permissionGroupService
                .create(mockPermissionGroup)
                .flatMap(permissionGroup ->
                        permissionGroupService.findById(permissionGroup.getId(), READ_PERMISSION_GROUPS))
                .block();
        String usernameNonExistentUser = "username-non-existent-user@test.com";
        String idNonExistentUser = null;
        UpdateRoleAssociationDTO updateRoleAssociationDTO = new UpdateRoleAssociationDTO();
        updateRoleAssociationDTO.setUsers(
                Set.of(new UserCompactDTO(null, usernameNonExistentUser, usernameNonExistentUser)));
        updateRoleAssociationDTO.setRolesAdded(Set.of(
                new PermissionGroupCompactDTO(createdPermissionGroup.getId(), createdPermissionGroup.getName())));
        userAndAccessManagementService
                .changeRoleAssociations(updateRoleAssociationDTO)
                .block();

        PermissionGroup updatedPermissionGroup = permissionGroupService
                .findById(createdPermissionGroup.getId(), ASSIGN_PERMISSION_GROUPS)
                .block();
        assertThat(updatedPermissionGroup).isNotNull();
        assertThat(updatedPermissionGroup.getAssignedToUserIds().size()).isEqualTo(1);
        idNonExistentUser =
                (String) updatedPermissionGroup.getAssignedToUserIds().toArray()[0];
        Mono<User> nonExistentUserMono = userRepository.findById(idNonExistentUser);
        StepVerifier.create(nonExistentUserMono)
                .assertNext(user -> {
                    assertThat(user).isNotNull();
                    assertThat(user.getEmail()).isEqualTo(usernameNonExistentUser);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    @DirtiesContext
    public void testBulkAssignMultipleUsersToMultipleRoles() {
        String name = "testBulkAssignMultipleUsersToMultipleRoles Test Role 1";
        PermissionGroup mockPermissionGroup = new PermissionGroup();
        mockPermissionGroup.setName(name);
        PermissionGroup createdPermissionGroup1 = permissionGroupService
                .create(mockPermissionGroup)
                .flatMap(permissionGroup ->
                        permissionGroupService.findById(permissionGroup.getId(), READ_PERMISSION_GROUPS))
                .block();

        name = "testBulkAssignMultipleUsersToMultipleRoles Test Role 1";
        mockPermissionGroup = new PermissionGroup();
        mockPermissionGroup.setName(name);
        PermissionGroup createdPermissionGroup2 = permissionGroupService
                .create(mockPermissionGroup)
                .flatMap(permissionGroup ->
                        permissionGroupService.findById(permissionGroup.getId(), READ_PERMISSION_GROUPS))
                .block();

        User usertest = userService.findByEmail("usertest@usertest.com").block();
        User api_user = userService.findByEmail("api_user").block();

        UpdateRoleAssociationDTO updateRoleAssociationDTO = new UpdateRoleAssociationDTO();
        updateRoleAssociationDTO.setUsers(Set.of(
                new UserCompactDTO(usertest.getId(), usertest.getEmail(), usertest.getName()),
                new UserCompactDTO(api_user.getId(), api_user.getEmail(), usertest.getName())));
        updateRoleAssociationDTO.setRolesAdded(Set.of(
                new PermissionGroupCompactDTO(createdPermissionGroup1.getId(), createdPermissionGroup1.getName()),
                new PermissionGroupCompactDTO(createdPermissionGroup2.getId(), createdPermissionGroup2.getName())));

        // Now assign the users to the roles
        userAndAccessManagementService
                .changeRoleAssociations(updateRoleAssociationDTO)
                .block();

        Mono<Tuple2<PermissionGroup, PermissionGroup>> permissionGroupsPostUpdateMono = Mono.zip(
                permissionGroupService.findById(createdPermissionGroup1.getId(), ASSIGN_PERMISSION_GROUPS),
                permissionGroupService.findById(createdPermissionGroup2.getId(), ASSIGN_PERMISSION_GROUPS));

        StepVerifier.create(permissionGroupsPostUpdateMono)
                .assertNext(tuple -> {
                    PermissionGroup permissionGroup1 = tuple.getT1();
                    PermissionGroup permissionGroup2 = tuple.getT2();

                    assertThat(permissionGroup1).isNotNull();
                    assertThat(permissionGroup1.getId()).isEqualTo(createdPermissionGroup1.getId());
                    assertThat(permissionGroup1.getName()).isEqualTo(createdPermissionGroup1.getName());
                    assertThat(permissionGroup1.getUserPermissions())
                            .isEqualTo(createdPermissionGroup1.getUserPermissions());
                    assertThat(permissionGroup1.getAssignedToUserIds()).hasSize(2);
                    assertThat(permissionGroup1.getAssignedToUserIds()).contains(usertest.getId());
                    assertThat(permissionGroup1.getAssignedToUserIds()).contains(api_user.getId());

                    assertThat(permissionGroup2).isNotNull();
                    assertThat(permissionGroup2.getId()).isEqualTo(createdPermissionGroup2.getId());
                    assertThat(permissionGroup2.getName()).isEqualTo(createdPermissionGroup2.getName());
                    assertThat(permissionGroup2.getUserPermissions())
                            .isEqualTo(createdPermissionGroup2.getUserPermissions());
                    assertThat(permissionGroup1.getAssignedToUserIds()).hasSize(2);
                    assertThat(permissionGroup1.getAssignedToUserIds()).contains(usertest.getId());
                    assertThat(permissionGroup1.getAssignedToUserIds()).contains(api_user.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    @DirtiesContext
    public void testBulkAssignMultipleGroupsToMultipleRoles() {
        String name = "testBulkAssignMultipleGroupsToMultipleRoles Test Role 1";
        PermissionGroup mockPermissionGroup = new PermissionGroup();
        mockPermissionGroup.setName(name);
        PermissionGroup createdPermissionGroup1 = permissionGroupService
                .create(mockPermissionGroup)
                .flatMap(permissionGroup ->
                        permissionGroupService.findById(permissionGroup.getId(), READ_PERMISSION_GROUPS))
                .block();

        name = "testBulkAssignMultipleGroupsToMultipleRoles Test Role 1";
        mockPermissionGroup = new PermissionGroup();
        mockPermissionGroup.setName(name);
        PermissionGroup createdPermissionGroup2 = permissionGroupService
                .create(mockPermissionGroup)
                .flatMap(permissionGroup ->
                        permissionGroupService.findById(permissionGroup.getId(), READ_PERMISSION_GROUPS))
                .block();

        UserGroup userGroup = new UserGroup();
        name = "Test Group 1 : testBulkAssignMultipleGroupsToMultipleRoles";
        String description = "testBulkAssignMultipleGroupsToMultipleRoles Test Group 1";
        userGroup.setName(name);
        userGroup.setDescription(description);

        UserGroup createdGroup1 = userGroupService.create(userGroup).block();

        userGroup = new UserGroup();
        name = "Test Group 2 : testBulkAssignMultipleGroupsToMultipleRoles";
        description = "testBulkAssignMultipleGroupsToMultipleRoles Test Group 2";
        userGroup.setName(name);
        userGroup.setDescription(description);

        UserGroup createdGroup2 = userGroupService.create(userGroup).block();

        UpdateRoleAssociationDTO updateRoleAssociationDTO = new UpdateRoleAssociationDTO();

        updateRoleAssociationDTO.setGroups(Set.of(
                new UserGroupCompactDTO(createdGroup1.getId(), createdGroup1.getName()),
                new UserGroupCompactDTO(createdGroup2.getId(), createdGroup2.getName())));

        updateRoleAssociationDTO.setRolesAdded(Set.of(
                new PermissionGroupCompactDTO(createdPermissionGroup1.getId(), createdPermissionGroup1.getName()),
                new PermissionGroupCompactDTO(createdPermissionGroup2.getId(), createdPermissionGroup2.getName())));

        // Now assign the users to the roles
        userAndAccessManagementService
                .changeRoleAssociations(updateRoleAssociationDTO)
                .block();

        Mono<Tuple2<PermissionGroup, PermissionGroup>> permissionGroupsPostUpdateMono = Mono.zip(
                permissionGroupService.findById(createdPermissionGroup1.getId(), ASSIGN_PERMISSION_GROUPS),
                permissionGroupService.findById(createdPermissionGroup2.getId(), ASSIGN_PERMISSION_GROUPS));

        StepVerifier.create(permissionGroupsPostUpdateMono)
                .assertNext(tuple -> {
                    PermissionGroup permissionGroup1 = tuple.getT1();
                    PermissionGroup permissionGroup2 = tuple.getT2();

                    assertThat(permissionGroup1).isNotNull();
                    assertThat(permissionGroup1.getId()).isEqualTo(createdPermissionGroup1.getId());
                    assertThat(permissionGroup1.getName()).isEqualTo(createdPermissionGroup1.getName());
                    assertThat(permissionGroup1.getUserPermissions())
                            .isEqualTo(createdPermissionGroup1.getUserPermissions());
                    assertThat(permissionGroup1.getAssignedToGroupIds()).hasSize(2);
                    assertThat(permissionGroup1.getAssignedToGroupIds()).contains(createdGroup1.getId());
                    assertThat(permissionGroup1.getAssignedToGroupIds()).contains(createdGroup2.getId());

                    assertThat(permissionGroup2).isNotNull();
                    assertThat(permissionGroup2.getId()).isEqualTo(createdPermissionGroup2.getId());
                    assertThat(permissionGroup2.getName()).isEqualTo(createdPermissionGroup2.getName());
                    assertThat(permissionGroup2.getUserPermissions())
                            .isEqualTo(createdPermissionGroup2.getUserPermissions());
                    assertThat(permissionGroup1.getAssignedToGroupIds()).hasSize(2);
                    assertThat(permissionGroup1.getAssignedToGroupIds()).contains(createdGroup1.getId());
                    assertThat(permissionGroup1.getAssignedToGroupIds()).contains(createdGroup2.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    @DirtiesContext
    public void testBulkAssignUnAssignMultipleGroupsToMultipleRoles() {

        // Create a workspace and then leave the workspace. We shall later associate the default created roles and check
        // access to this workspace.
        Workspace workspace = new Workspace();
        workspace.setName("testBulkAssignUnAssignMultipleGroupsToMultipleRoles workspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();
        List<PermissionGroup> defaultRoles = permissionGroupService
                .findAllByIds(createdWorkspace.getDefaultPermissionGroups())
                .collectList()
                .block();
        PermissionGroup adminRole = defaultRoles.stream()
                .filter(role -> role.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();

        User usertest = userService.findByEmail("usertest@usertest.com").block();
        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        inviteUsersDTO.setUsernames(List.of("usertest@usertest.com"));
        inviteUsersDTO.setPermissionGroupId(adminRole.getId());
        userAndAccessManagementService.inviteUsers(inviteUsersDTO, "origin").block();
        userWorkspaceService.leaveWorkspace(createdWorkspace.getId()).block();

        // After leaving the workspace, user should not be able to access this.
        Workspace shouldBeNullWorkspace = workspaceService
                .findById(createdWorkspace.getId(), READ_WORKSPACES)
                .block();
        assertThat(shouldBeNullWorkspace).isNull();

        String name = "testBulkAssignUnAssignMultipleGroupsToMultipleRoles Test Role 1";
        PermissionGroup mockPermissionGroup = new PermissionGroup();
        mockPermissionGroup.setName(name);
        PermissionGroup createdPermissionGroup1 = permissionGroupService
                .create(mockPermissionGroup)
                .flatMap(permissionGroup ->
                        permissionGroupService.findById(permissionGroup.getId(), READ_PERMISSION_GROUPS))
                .block();

        name = "testBulkAssignUnAssignMultipleGroupsToMultipleRoles Test Role 1";
        mockPermissionGroup = new PermissionGroup();
        mockPermissionGroup.setName(name);
        PermissionGroup createdPermissionGroup2 = permissionGroupService
                .create(mockPermissionGroup)
                .flatMap(permissionGroup ->
                        permissionGroupService.findById(permissionGroup.getId(), READ_PERMISSION_GROUPS))
                .block();

        name = "testBulkAssignUnAssignMultipleGroupsToMultipleRoles Test Role 3";
        mockPermissionGroup = new PermissionGroup();
        mockPermissionGroup.setName(name);
        PermissionGroup createdPermissionGroup3 = permissionGroupService
                .create(mockPermissionGroup)
                .flatMap(permissionGroup ->
                        permissionGroupService.findById(permissionGroup.getId(), READ_PERMISSION_GROUPS))
                .block();

        UserGroup userGroup = new UserGroup();
        name = "Test Group 1 : testBulkAssignMultipleGroupsToMultipleRoles";
        String description = "testBulkAssignMultipleGroupsToMultipleRoles Test Group 1";
        userGroup.setName(name);
        userGroup.setDescription(description);

        UserGroupDTO createdGroup1 = userGroupService.createGroup(userGroup).block();

        userGroup = new UserGroup();
        name = "Test Group 2 : testBulkAssignMultipleGroupsToMultipleRoles";
        description = "testBulkAssignMultipleGroupsToMultipleRoles Test Group 2";
        userGroup.setName(name);
        userGroup.setDescription(description);

        UserGroupDTO createdGroup2 = userGroupService.createGroup(userGroup).block();

        // Add user api_user to group2
        userGroupService
                .inviteUsers(new UsersForGroupDTO(Set.of("api_user"), Set.of(createdGroup2.getId())), "origin")
                .block();

        UpdateRoleAssociationDTO updateRoleAssociationDTO = new UpdateRoleAssociationDTO();

        // First associate the createdPermissionGroup3 with the groups and users
        updateRoleAssociationDTO.setUsers(
                Set.of(new UserCompactDTO(usertest.getId(), usertest.getEmail(), usertest.getName())));

        updateRoleAssociationDTO.setGroups(Set.of(
                new UserGroupCompactDTO(createdGroup1.getId(), createdGroup1.getName()),
                new UserGroupCompactDTO(createdGroup2.getId(), createdGroup2.getName())));

        updateRoleAssociationDTO.setRolesAdded(Set.of(
                new PermissionGroupCompactDTO(createdPermissionGroup3.getId(), createdPermissionGroup3.getName())));

        userAndAccessManagementService
                .changeRoleAssociations(updateRoleAssociationDTO)
                .block();

        /**
         * Updating the test case below and separating the User and UserGroup role association update,
         * because of the latest changes which throw error if the Already Existing permissions are added again
         * or permissions from the same workspace are added.
         */

        // Now associate the created workspcae default role, createdPermissionGroup1 and createdPermissionGroup2 with
        // the groups and users and remove
        // createdPermissionGroup3 from the groups and users
        updateRoleAssociationDTO.setUsers(Set.of());

        updateRoleAssociationDTO.setRolesAdded(Set.of(
                new PermissionGroupCompactDTO(
                        createdWorkspace.getDefaultPermissionGroups().stream()
                                .findFirst()
                                .get(),
                        ""),
                new PermissionGroupCompactDTO(createdPermissionGroup1.getId(), createdPermissionGroup1.getName()),
                new PermissionGroupCompactDTO(createdPermissionGroup2.getId(), createdPermissionGroup2.getName())));

        updateRoleAssociationDTO.setRolesRemoved(Set.of(
                new PermissionGroupCompactDTO(createdPermissionGroup3.getId(), createdPermissionGroup3.getName())));

        userAndAccessManagementService
                .changeRoleAssociations(updateRoleAssociationDTO)
                .block();

        updateRoleAssociationDTO.setGroups(Set.of());
        updateRoleAssociationDTO.setUsers(
                Set.of(new UserCompactDTO(usertest.getId(), usertest.getEmail(), usertest.getName())));
        updateRoleAssociationDTO.setRolesAdded(Set.of(
                new PermissionGroupCompactDTO(createdPermissionGroup1.getId(), createdPermissionGroup1.getName()),
                new PermissionGroupCompactDTO(createdPermissionGroup2.getId(), createdPermissionGroup2.getName())));

        userAndAccessManagementService
                .changeRoleAssociations(updateRoleAssociationDTO)
                .block();

        Mono<Workspace> workspaceMonoWithPermission = workspaceService
                .findById(createdWorkspace.getId(), READ_WORKSPACES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND)));

        StepVerifier.create(workspaceMonoWithPermission)
                .assertNext(workspace1 -> {
                    assertThat(workspace1).isNotNull();
                    assertThat(workspace1.getName()).isEqualTo(createdWorkspace.getName());
                })
                .verifyComplete();

        Mono<Tuple2<PermissionGroup, PermissionGroup>> permissionGroupsPostUpdateMono = Mono.zip(
                permissionGroupService.findById(createdPermissionGroup1.getId(), READ_PERMISSION_GROUPS),
                permissionGroupService.findById(createdPermissionGroup2.getId(), READ_PERMISSION_GROUPS));

        StepVerifier.create(permissionGroupsPostUpdateMono)
                .assertNext(tuple -> {
                    PermissionGroup permissionGroup1 = tuple.getT1();
                    PermissionGroup permissionGroup2 = tuple.getT2();

                    assertThat(permissionGroup1).isNotNull();
                    assertThat(permissionGroup1.getId()).isEqualTo(createdPermissionGroup1.getId());
                    assertThat(permissionGroup1.getName()).isEqualTo(createdPermissionGroup1.getName());
                    assertThat(permissionGroup1.getUserPermissions())
                            .isEqualTo(createdPermissionGroup1.getUserPermissions());
                    assertThat(permissionGroup1.getAssignedToGroupIds()).hasSize(2);
                    assertThat(permissionGroup1.getAssignedToGroupIds()).contains(createdGroup1.getId());
                    assertThat(permissionGroup1.getAssignedToGroupIds()).contains(createdGroup2.getId());

                    assertThat(permissionGroup2).isNotNull();
                    assertThat(permissionGroup2.getId()).isEqualTo(createdPermissionGroup2.getId());
                    assertThat(permissionGroup2.getName()).isEqualTo(createdPermissionGroup2.getName());
                    assertThat(permissionGroup2.getUserPermissions())
                            .isEqualTo(createdPermissionGroup2.getUserPermissions());
                    assertThat(permissionGroup1.getAssignedToGroupIds()).hasSize(2);
                    assertThat(permissionGroup1.getAssignedToGroupIds()).contains(createdGroup1.getId());
                    assertThat(permissionGroup1.getAssignedToGroupIds()).contains(createdGroup2.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void updatePermissionGroupAsSuperAdmin() {
        String mockName = "mock-permission-group-name-1";
        String mockDescription = "mock-permission-group-description-1";
        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName(mockName);
        permissionGroup.setDescription(mockDescription);

        PermissionGroup createdPermissionGroup = permissionGroupService
                .create(permissionGroup)
                .flatMap(createdGroup ->
                        permissionGroupRepository.findById(createdGroup.getId(), MANAGE_PERMISSION_GROUPS))
                .block();

        String updatedName = "mock-permission-group-name-2";
        String updatedDescription = "mock-permission-group-description-2";
        PermissionGroup permissionGroupUpdate = new PermissionGroup();
        permissionGroupUpdate.setName(updatedName);
        permissionGroupUpdate.setDescription(updatedDescription);

        Mono<PermissionGroupInfoDTO> permissionGroupInfoDTOMono =
                permissionGroupService.updatePermissionGroup(createdPermissionGroup.getId(), permissionGroupUpdate);

        StepVerifier.create(permissionGroupInfoDTOMono)
                .assertNext(updatedPermissionGroupInfoDTO -> {
                    assertThat(updatedPermissionGroupInfoDTO.getId()).isEqualTo(createdPermissionGroup.getId());
                    assertThat(updatedPermissionGroupInfoDTO.getName()).isEqualTo(permissionGroupUpdate.getName());
                    assertThat(updatedPermissionGroupInfoDTO.getDescription())
                            .isEqualTo(permissionGroupUpdate.getDescription());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("usertest@usertest.com")
    public void updatePermissionGroupAsNonAdminUser() {
        String mockName = "mock-permission-group-name-1";
        String mockDescription = "mock-permission-group-description-1";
        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName(mockName);
        permissionGroup.setDescription(mockDescription);

        PermissionGroup createdPermissionGroup =
                permissionGroupRepository.save(permissionGroup).block();

        String updatedName = "mock-permission-group-name-2";
        String updatedDescription = "mock-permission-group-description-2";
        PermissionGroup permissionGroupUpdate = new PermissionGroup();
        permissionGroupUpdate.setName(updatedName);
        permissionGroupUpdate.setDescription(updatedDescription);

        Mono<PermissionGroupInfoDTO> updatedPermissionGroupInfoDTOMono =
                permissionGroupService.updatePermissionGroup(createdPermissionGroup.getId(), permissionGroupUpdate);

        StepVerifier.create(updatedPermissionGroupInfoDTOMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .contains(AppsmithError.ACTION_IS_NOT_AUTHORIZED.getMessage("update role")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testFindAllByAssignedToUsers_noUserManagementPermission() {
        User user = new User();
        user.setEmail("testFindAllByAssignedToUsers_noUserManagementPermission@appsmith.com");
        user.setPassword("password");
        User createdUser = userService.create(user).block();

        List<PermissionGroup> permissionGroupList = permissionGroupService
                .findAllByAssignedToUsersIn(Set.of(createdUser.getId()))
                .collectList()
                .block();

        List<PermissionGroup> allPermissionGroupList = permissionGroupRepository
                .findAllByAssignedToUserIdsIn(Set.of(createdUser.getId()))
                .collectList()
                .block();

        boolean userMgmtRoleNotPresent = permissionGroupList.stream()
                .anyMatch(permissionGroup -> permissionGroup.getName().startsWith(createdUser.getEmail()));

        boolean userMgmtRolePresent = allPermissionGroupList.stream()
                .anyMatch(permissionGroup -> permissionGroup.getName().startsWith(createdUser.getEmail()));

        assertThat(userMgmtRoleNotPresent).isFalse();
        assertThat(userMgmtRolePresent).isTrue();
    }

    @Test
    @WithUserDetails("api_user")
    public void updateDefaultUserPermissionGroupAsSuperAdmin_shouldFail() {

        PermissionGroup defaultUserRoleMono =
                userUtils.getDefaultUserPermissionGroup().block();

        String updatedName = "mock-permission-group-name-2";
        String updatedDescription = "mock-permission-group-description-2";
        PermissionGroup permissionGroupUpdate = new PermissionGroup();
        permissionGroupUpdate.setName(updatedName);
        permissionGroupUpdate.setDescription(updatedDescription);

        Mono<PermissionGroupInfoDTO> permissionGroupInfoDTOMono =
                permissionGroupService.updatePermissionGroup(defaultUserRoleMono.getId(), permissionGroupUpdate);

        StepVerifier.create(permissionGroupInfoDTOMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .contains(AppsmithError.ACTION_IS_NOT_AUTHORIZED.getMessage("update role")))
                .verify();
    }
}
