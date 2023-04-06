package com.appsmith.server.services.ee;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.MemberInfoDTO;
import com.appsmith.server.dtos.UpdatePermissionGroupDTO;
import com.appsmith.server.dtos.UserGroupDTO;
import com.appsmith.server.dtos.UsersForGroupDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.UserGroupService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.UserWorkspaceService;
import com.appsmith.server.services.WorkspaceService;
import lombok.extern.slf4j.Slf4j;
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
import java.util.Set;

import static com.appsmith.server.constants.ce.FieldNameCE.ADMINISTRATOR;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
public class UserWorkspaceServiceTest {

    @Autowired UserWorkspaceService userWorkspaceService;
    @Autowired WorkspaceService workspaceService;
    @Autowired UserGroupService userGroupService;
    @Autowired PermissionGroupService permissionGroupService;
    @Autowired UserRepository userRepository;
    @Autowired PermissionGroupRepository permissionGroupRepository;
    @Autowired UserGroupRepository userGroupRepository;
    @Autowired WorkspaceRepository workspaceRepository;
    @Autowired UserUtils userUtils;
    @Autowired UserService userService;

    private User apiUser;
    private User testUser;

    @BeforeEach
    public void setup() {
        apiUser = userRepository.findByEmail("api_user").block();
        testUser = userRepository.findByEmail("usertest@usertest.com").block();

        userUtils.makeSuperUser(List.of(apiUser)).block();
    }

    @Test
    @WithUserDetails("api_user")
    public void test_getWorkspaceMembers() {
        Workspace workspace = new Workspace();
        workspace.setName("UserWorkspaceServiceTest - test_getWorkspaceMembers");
        Workspace createdWorkspace = workspaceService
                .create(workspace)
                .block();

        List<PermissionGroup> autoCreatedPermissionGroups = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(createdWorkspace.getId(), Workspace.class.getSimpleName())
                .collectList()
                .block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName("UserWorkspaceServiceTest - test_getWorkspaceMembers");
        UserGroup createdUserGroup = userGroupService.createGroup(userGroup)
                .flatMap(userGroupDTO -> userGroupRepository.findById(userGroupDTO.getId()))
                .block();

        List<MemberInfoDTO> memberInfoDTOList = userWorkspaceService
                .getWorkspaceMembers(createdWorkspace.getId())
                .block();

        // For a newly created workspace, only 1 member exists, the one who created the workspace.
        assertThat(memberInfoDTOList).hasSize(1);
        assertThat(memberInfoDTOList.get(0).getUserId()).isEqualTo(apiUser.getId());

        PermissionGroup administratorPermissionGroup = autoCreatedPermissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(ADMINISTRATOR))
                .findFirst().get();

        PermissionGroup developerPermissionGroup = autoCreatedPermissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(FieldName.DEVELOPER))
                .findFirst().get();

        // Assign permissions to a UserGroup created above
        PermissionGroup permissionGroupWithUserGroupAssigned = permissionGroupService
                .assignToUserGroup(developerPermissionGroup, createdUserGroup)
                .block();

        memberInfoDTOList = userWorkspaceService
                .getWorkspaceMembers(createdWorkspace.getId())
                .block();

        // Now the workspace will contain 2 members, 1 UserGroup and 1 User
        assertThat(memberInfoDTOList).hasSize(2);
        MemberInfoDTO memberInfoDTO1 = memberInfoDTOList.get(0);
        assertThat(memberInfoDTO1.getUserId()).isEqualTo(apiUser.getId());
        assertThat(memberInfoDTO1.getRoles()).hasSize(1);
        assertThat(memberInfoDTO1.getRoles().get(0).getId()).isEqualTo(administratorPermissionGroup.getId());
        MemberInfoDTO memberInfoDTO2 = memberInfoDTOList.get(1);
        assertThat(memberInfoDTO2.getUserGroupId()).isEqualTo(createdUserGroup.getId());
        assertThat(memberInfoDTO2.getRoles()).hasSize(1);
        assertThat(memberInfoDTO2.getRoles().get(0).getId()).isEqualTo(developerPermissionGroup.getId());
    }

    @Test
    @WithUserDetails("api_user")
    public void test_updatePermissionGroupForMember_userGroupDoesntExist() {
        Workspace workspace = new Workspace();
        workspace.setName("UserWorkspaceServiceTest - test_updatePermissionGroupForMember_userGroupDoesntExist");
        Workspace createdWorkspace = workspaceService
                .create(workspace)
                .block();

        List<PermissionGroup> autoCreatedPermissionGroups = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(createdWorkspace.getId(), Workspace.class.getSimpleName())
                .collectList()
                .block();
        UpdatePermissionGroupDTO updatePermissionGroupDTO = new UpdatePermissionGroupDTO();
        updatePermissionGroupDTO.setUserGroupId("Random User Group Id");
        updatePermissionGroupDTO.setNewPermissionGroupId("Random Permission Group Id");

        Mono<MemberInfoDTO> mono = userWorkspaceService.updatePermissionGroupForMember(createdWorkspace.getId(), updatePermissionGroupDTO, "");

        StepVerifier.create(mono)
                .expectErrorMatches(throwable ->
                        throwable instanceof AppsmithException &&
                                throwable.getMessage().contains(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.USER_GROUP, updatePermissionGroupDTO.getUserGroupId())))
                .verify();
    }

    @Test
    @WithUserDetails("api_user")
    public void test_updatePermissionGroupForMember() {
        Workspace workspace = new Workspace();
        workspace.setName("UserWorkspaceServiceTest - test_updatePermissionGroupForMember");
        Workspace createdWorkspace = workspaceService
                .create(workspace)
                .block();

        List<PermissionGroup> autoCreatedPermissionGroups = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(createdWorkspace.getId(), Workspace.class.getSimpleName())
                .collectList()
                .block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName("UserWorkspaceServiceTest - test_updatePermissionGroupForMember");
        UserGroup createdUserGroup = userGroupService.createGroup(userGroup)
                .flatMap(userGroupDTO -> userGroupRepository.findById(userGroupDTO.getId()))
                .block();

        PermissionGroup administratorPermissionGroup = autoCreatedPermissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(FieldName.ADMINISTRATOR))
                .findFirst().get();
        PermissionGroup developerPermissionGroup = autoCreatedPermissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(FieldName.DEVELOPER))
                .findFirst().get();

        // Assign permissions to a UserGroup created above
        PermissionGroup permissionGroupWithUserGroupAssigned = permissionGroupService
                .assignToUserGroup(administratorPermissionGroup, createdUserGroup)
                .block();

        List<MemberInfoDTO> memberInfoDTOList = userWorkspaceService
                .getWorkspaceMembers(createdWorkspace.getId())
                .block();
        // Now the workspace will contain 2 members, 1 UserGroup and 1 User
        // When comparing between user and user group, we compare with the name, given that both of them have the
        // admin role assigned. Hence, user group will come after user according to lexicographical order.
        assertThat(memberInfoDTOList).hasSize(2);
        assertThat(memberInfoDTOList.get(1).getUserGroupId()).isEqualTo(createdUserGroup.getId());
        assertThat(memberInfoDTOList.get(1).getRoles()).hasSize(1);
        assertThat(memberInfoDTOList.get(1).getRoles().get(0).getId()).isEqualTo(administratorPermissionGroup.getId());

        UpdatePermissionGroupDTO updatePermissionGroupDTO = new UpdatePermissionGroupDTO();
        updatePermissionGroupDTO.setUserGroupId(createdUserGroup.getId());
        updatePermissionGroupDTO.setNewPermissionGroupId(developerPermissionGroup.getId());

        MemberInfoDTO memberInfoDTO = userWorkspaceService
                .updatePermissionGroupForMember(createdWorkspace.getId(), updatePermissionGroupDTO, "")
                .block();

        assertThat(memberInfoDTO).isNotNull();
        assertThat(memberInfoDTO.getUserGroupId()).isEqualTo(createdUserGroup.getId());
        assertThat(memberInfoDTO.getRoles()).hasSize(1);
        assertThat(memberInfoDTO.getRoles().get(0).getId()).isEqualTo(developerPermissionGroup.getId());

        PermissionGroup administratorPermissionGroupUpdated = permissionGroupRepository
                .findById(administratorPermissionGroup.getId())
                .block();
        PermissionGroup developerPermissionGroupUpdated = permissionGroupRepository
                .findById(developerPermissionGroup.getId())
                .block();

        assertThat(administratorPermissionGroupUpdated.getAssignedToGroupIds()).isEmpty();
        assertThat(developerPermissionGroupUpdated.getAssignedToGroupIds()).hasSize(1);
        assertThat(developerPermissionGroupUpdated.getAssignedToGroupIds().contains(createdUserGroup.getId())).isTrue();

        memberInfoDTOList = userWorkspaceService
                .getWorkspaceMembers(createdWorkspace.getId())
                .block();
        // Now the workspace will contain 2 members, 1 UserGroup and 1 User
        // Also tested that the UserGroup members will come before User members.
        assertThat(memberInfoDTOList).hasSize(2);
        assertThat(memberInfoDTOList.get(0).getUserId()).isEqualTo(apiUser.getId());
        assertThat(memberInfoDTOList.get(1).getUserGroupId()).isEqualTo(createdUserGroup.getId());
        assertThat(memberInfoDTOList.get(1).getRoles()).hasSize(1);
        assertThat(memberInfoDTOList.get(1).getRoles().get(0).getId()).isEqualTo(developerPermissionGroup.getId());
    }

    @Test
    @WithUserDetails("api_user")
    public void test_updatePermissionGroupForMember_singleUserRemoveAdminPermission() {
        Workspace workspace = new Workspace();
        workspace.setName("UserWorkspaceServiceTest - test_updatePermissionGroupForMember_singleUserRemoveAdminPermission");
        Workspace createdWorkspace = workspaceService
                .create(workspace)
                .block();

        List<PermissionGroup> autoCreatedPermissionGroups = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(createdWorkspace.getId(), Workspace.class.getSimpleName())
                .collectList()
                .block();

        PermissionGroup developerPermissionGroup = autoCreatedPermissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(FieldName.DEVELOPER))
                .findFirst().get();

        UpdatePermissionGroupDTO updatePermissionGroupDTO = new UpdatePermissionGroupDTO();
        updatePermissionGroupDTO.setUsername(apiUser.getUsername());
        updatePermissionGroupDTO.setNewPermissionGroupId(developerPermissionGroup.getId());

        Mono<MemberInfoDTO> memberInfoDTOMono = userWorkspaceService
                .updatePermissionGroupForMember(createdWorkspace.getId(), updatePermissionGroupDTO, "");

        StepVerifier.create(memberInfoDTOMono)
                .expectErrorMatches(throwable ->
                        throwable instanceof AppsmithException &&
                                throwable.getMessage().contains(AppsmithError.REMOVE_LAST_WORKSPACE_ADMIN_ERROR.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails("api_user")
    public void test_updatePermissionGroupForMember_singleUserGroupRemoveAdminPermission() {
        Workspace workspace = new Workspace();
        workspace.setName("UserWorkspaceServiceTest - test_updatePermissionGroupForMember_singleUserGroupRemoveAdminPermission");
        Workspace createdWorkspace = workspaceService
                .create(workspace)
                .block();

        List<PermissionGroup> autoCreatedPermissionGroups = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(createdWorkspace.getId(), Workspace.class.getSimpleName())
                .collectList()
                .block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName("UserWorkspaceServiceTest - test_updatePermissionGroupForMember_singleUserGroupRemoveAdminPermission");
        userGroup.setUsers(Set.of(apiUser.getId()));
        UserGroup createdUserGroup = userGroupService.createGroup(userGroup)
                .flatMap(userGroupDTO -> userGroupRepository.findById(userGroupDTO.getId()))
                .block();

        PermissionGroup administratorPermissionGroup = autoCreatedPermissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(FieldName.ADMINISTRATOR))
                .findFirst().get();

        PermissionGroup developerPermissionGroup = autoCreatedPermissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(FieldName.DEVELOPER))
                .findFirst().get();

        PermissionGroup updatedAdministratorPermissionGroup = permissionGroupService
                .unassignFromUser(administratorPermissionGroup, apiUser)
                .block();

        updatedAdministratorPermissionGroup = permissionGroupService
                .assignToUserGroup(administratorPermissionGroup, createdUserGroup)
                .block();

        UpdatePermissionGroupDTO updatePermissionGroupDTO = new UpdatePermissionGroupDTO();
        updatePermissionGroupDTO.setUserGroupId(createdUserGroup.getId());
        updatePermissionGroupDTO.setNewPermissionGroupId(developerPermissionGroup.getId());

        Mono<MemberInfoDTO> memberInfoDTOMono = userWorkspaceService
                .updatePermissionGroupForMember(createdWorkspace.getId(), updatePermissionGroupDTO, "");

        StepVerifier.create(memberInfoDTOMono)
                .expectErrorMatches(throwable ->
                        throwable instanceof AppsmithException &&
                                throwable.getMessage().contains(AppsmithError.REMOVE_LAST_WORKSPACE_ADMIN_ERROR.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails("api_user")
    public void test_updatePermissionGroupForMember_twoEntitiesUserAndUserGroupRemoveAdminPermissionFromUser() {
        Workspace workspace = new Workspace();
        workspace.setName("UserWorkspaceServiceTest - test_updatePermissionGroupForMember_twoEntitiesUserAndUserGroupRemoveAdminPermissionFromUser");
        Workspace createdWorkspace = workspaceService
                .create(workspace)
                .block();

        List<PermissionGroup> autoCreatedPermissionGroups = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(createdWorkspace.getId(), Workspace.class.getSimpleName())
                .collectList()
                .block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName("UserWorkspaceServiceTest - test_updatePermissionGroupForMember_twoEntitiesUserAndUserGroupRemoveAdminPermissionFromUser");
        userGroup.setUsers(Set.of(apiUser.getId()));
        UserGroup createdUserGroup = userGroupService.createGroup(userGroup)
                .flatMap(userGroupDTO -> userGroupRepository.findById(userGroupDTO.getId()))
                .block();

        PermissionGroup administratorPermissionGroup = autoCreatedPermissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(FieldName.ADMINISTRATOR))
                .findFirst().get();

        PermissionGroup developerPermissionGroup = autoCreatedPermissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(FieldName.DEVELOPER))
                .findFirst().get();

        PermissionGroup updatedAdministratorPermissionGroup = permissionGroupService
                .assignToUserGroup(administratorPermissionGroup, createdUserGroup)
                .block();

        UpdatePermissionGroupDTO updatePermissionGroupDTO = new UpdatePermissionGroupDTO();
        updatePermissionGroupDTO.setUserGroupId(createdUserGroup.getId());
        updatePermissionGroupDTO.setNewPermissionGroupId(developerPermissionGroup.getId());

        MemberInfoDTO memberInfoDTO = userWorkspaceService
                .updatePermissionGroupForMember(createdWorkspace.getId(), updatePermissionGroupDTO, "")
                .block();

        assertThat(memberInfoDTO.getUserGroupId()).isEqualTo(createdUserGroup.getId());
        assertThat(memberInfoDTO.getRoles()).hasSize(1);
        assertThat(memberInfoDTO.getRoles().get(0).getId()).isEqualTo(developerPermissionGroup.getId());
    }

    @Test
    @WithUserDetails("api_user")
    public void test_updatePermissionGroupForMember_twoEntitiesUserAndUserGroupRemoveAdminPermissionFromUserGroup() {
        Workspace workspace = new Workspace();
        workspace.setName("UserWorkspaceServiceTest - test_updatePermissionGroupForMember_twoEntitiesUserAndUserGroupRemoveAdminPermissionFromUserGroup");
        Workspace createdWorkspace = workspaceService
                .create(workspace)
                .block();

        List<PermissionGroup> autoCreatedPermissionGroups = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(createdWorkspace.getId(), Workspace.class.getSimpleName())
                .collectList()
                .block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName("UserWorkspaceServiceTest - test_updatePermissionGroupForMember_twoEntitiesUserAndUserGroupRemoveAdminPermissionFromUserGroup");
        userGroup.setUsers(Set.of(apiUser.getId()));
        UserGroup createdUserGroup = userGroupService.createGroup(userGroup)
                .flatMap(userGroupDTO -> userGroupRepository.findById(userGroupDTO.getId()))
                .block();

        PermissionGroup administratorPermissionGroup = autoCreatedPermissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(FieldName.ADMINISTRATOR))
                .findFirst().get();

        PermissionGroup developerPermissionGroup = autoCreatedPermissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(FieldName.DEVELOPER))
                .findFirst().get();

        PermissionGroup updatedAdministratorPermissionGroup = permissionGroupService
                .assignToUserGroup(administratorPermissionGroup, createdUserGroup)
                .block();

        UpdatePermissionGroupDTO updatePermissionGroupDTO = new UpdatePermissionGroupDTO();
        updatePermissionGroupDTO.setUsername(apiUser.getUsername());
        updatePermissionGroupDTO.setNewPermissionGroupId(developerPermissionGroup.getId());

        MemberInfoDTO memberInfoDTO = userWorkspaceService
                .updatePermissionGroupForMember(createdWorkspace.getId(), updatePermissionGroupDTO, "")
                .block();

        assertThat(memberInfoDTO.getUsername()).isEqualTo(apiUser.getUsername());
        assertThat(memberInfoDTO.getRoles()).hasSize(1);
        assertThat(memberInfoDTO.getRoles().get(0).getId()).isEqualTo(developerPermissionGroup.getId());
    }

    @Test
    @WithUserDetails("api_user")
    public void test_updatePermissionGroupForMember_twoEntitiesUserGroupsRemoveAdminPermissionFromUserGroup() {
        Workspace workspace = new Workspace();
        workspace.setName("UserWorkspaceServiceTest - test_updatePermissionGroupForMember_twoEntitiesUserGroupsRemoveAdminPermissionFromUserGroup");
        Workspace createdWorkspace = workspaceService
                .create(workspace)
                .block();

        List<PermissionGroup> autoCreatedPermissionGroups = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(createdWorkspace.getId(), Workspace.class.getSimpleName())
                .collectList()
                .block();

        UserGroup userGroup1 = new UserGroup();
        userGroup1.setName("UserWorkspaceServiceTest - test_updatePermissionGroupForMember_twoEntitiesUserGroupsRemoveAdminPermissionFromUserGroup - 1");
        userGroup1.setUsers(Set.of(apiUser.getId()));
        UserGroup createdUserGroup1 = userGroupService.createGroup(userGroup1)
                .flatMap(userGroupDTO -> userGroupRepository.findById(userGroupDTO.getId()))
                .block();

        UserGroup userGroup2 = new UserGroup();
        userGroup2.setName("UserWorkspaceServiceTest - test_updatePermissionGroupForMember_twoEntitiesUserGroupsRemoveAdminPermissionFromUserGroup - 2");
        userGroup2.setUsers(Set.of(testUser.getId()));
        UserGroup createdUserGroup2 = userGroupService.createGroup(userGroup2)
                .flatMap(userGroupDTO -> userGroupRepository.findById(userGroupDTO.getId()))
                .block();

        PermissionGroup administratorPermissionGroup = autoCreatedPermissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(FieldName.ADMINISTRATOR))
                .findFirst().get();

        PermissionGroup developerPermissionGroup = autoCreatedPermissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(FieldName.DEVELOPER))
                .findFirst().get();

        PermissionGroup updatedAdministratorPermissionGroup = permissionGroupService
                .bulkAssignToUserGroups(administratorPermissionGroup, Set.of(createdUserGroup1, createdUserGroup2))
                .block();
        updatedAdministratorPermissionGroup = permissionGroupService
                .unassignFromUser(administratorPermissionGroup, apiUser)
                .block();

        UpdatePermissionGroupDTO updatePermissionGroupDTO = new UpdatePermissionGroupDTO();
        updatePermissionGroupDTO.setUserGroupId(createdUserGroup1.getId());
        updatePermissionGroupDTO.setNewPermissionGroupId(developerPermissionGroup.getId());

        MemberInfoDTO memberInfoDTO = userWorkspaceService
                .updatePermissionGroupForMember(createdWorkspace.getId(), updatePermissionGroupDTO, "")
                .block();

        assertThat(memberInfoDTO.getUserGroupId()).isEqualTo(createdUserGroup1.getId());
        assertThat(memberInfoDTO.getRoles()).hasSize(1);
        assertThat(memberInfoDTO.getRoles().get(0).getId()).isEqualTo(developerPermissionGroup.getId());
    }

    @Test
    @WithUserDetails("api_user")
    public void test_updatePermissionGroupForMember_twoEntitiesUsersRemoveAdminPermissionFromUser() {
        Workspace workspace = new Workspace();
        workspace.setName("UserWorkspaceServiceTest - test_updatePermissionGroupForMember_twoEntitiesUsersRemoveAdminPermissionFromUser");
        Workspace createdWorkspace = workspaceService
                .create(workspace)
                .block();

        List<PermissionGroup> autoCreatedPermissionGroups = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(createdWorkspace.getId(), Workspace.class.getSimpleName())
                .collectList()
                .block();

        PermissionGroup administratorPermissionGroup = autoCreatedPermissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(FieldName.ADMINISTRATOR))
                .findFirst().get();

        PermissionGroup developerPermissionGroup = autoCreatedPermissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(FieldName.DEVELOPER))
                .findFirst().get();

        PermissionGroup updatedAdministratorPermissionGroup = permissionGroupService
                .assignToUser(administratorPermissionGroup, testUser)
                .block();

        UpdatePermissionGroupDTO updatePermissionGroupDTO = new UpdatePermissionGroupDTO();
        updatePermissionGroupDTO.setUsername(apiUser.getUsername());
        updatePermissionGroupDTO.setNewPermissionGroupId(developerPermissionGroup.getId());

        MemberInfoDTO memberInfoDTO = userWorkspaceService
                .updatePermissionGroupForMember(createdWorkspace.getId(), updatePermissionGroupDTO, "")
                .block();

        assertThat(memberInfoDTO.getUsername()).isEqualTo(apiUser.getUsername());
        assertThat(memberInfoDTO.getRoles()).hasSize(1);
        assertThat(memberInfoDTO.getRoles().get(0).getId()).isEqualTo(developerPermissionGroup.getId());
    }

    @Test
    @WithUserDetails("api_user")
    public void leaveWorkspace_WhenUserExistsInUserGroup() {
        // Make api_user SUPER ADMIN
        User api_user = userRepository.findByEmail("api_user").block();
        userUtils.makeSuperUser(List.of(api_user)).block();
        PermissionGroup adminPermissionGroup = userUtils.getSuperAdminPermissionGroup().block();
        System.out.println("Admin Permission Group");
        System.out.println(adminPermissionGroup.getId());

        // Create a new User Group
        UserGroup userGroup = new UserGroup();
        userGroup.setName("UserGroup - leaveWorkspace_WhenUserExistsInUserGroup");
        UserGroup createdUserGroup = userGroupService.createGroup(userGroup)
                .flatMap(userGroupDTO -> userGroupRepository.findById(userGroupDTO.getId()))
                .block();

        UsersForGroupDTO usersForGroupDTO = new UsersForGroupDTO();
        usersForGroupDTO.setUsernames(Set.of("api_user"));
        usersForGroupDTO.setGroupIds(Set.of(createdUserGroup.getId()));
        List<UserGroupDTO> userGroupDTOList = userGroupService.inviteUsers(usersForGroupDTO, "").block();
        assertThat(userGroupDTOList).hasSize(1);

        // Create Workspace
        Workspace workspace1 = new Workspace();
        workspace1.setName("Workspace - leaveWorkspace_WhenUserExistsInUserGroup");
        Workspace createdWorkspace = workspaceService.create(workspace1).block();
        String workspaceId = createdWorkspace.getId();

        PermissionGroup workspaceAdminPermissionGroup = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(workspaceId, Workspace.class.getSimpleName())
                .filter(pg -> pg.getName().startsWith(ADMINISTRATOR))
                .blockFirst();

        // Create another user which can be made Workspace Admin
        User user1 = new User();
        user1.setEmail("leaveWorkspace_WhenUserExistsInUserGroup@test.com");
        user1.setPassword("leaveWorkspace_WhenUserExistsInUserGroup");
        User anotherWorkspaceAdmin = userService.create(user1).block();

        // Assign Admin Workspace PG to User and UserGroup
        workspaceAdminPermissionGroup = permissionGroupService.assignToUser(workspaceAdminPermissionGroup, anotherWorkspaceAdmin).block();
        workspaceAdminPermissionGroup = permissionGroupService.assignToUserGroup(workspaceAdminPermissionGroup, createdUserGroup).block();

        Mono<User> leaveWorkspaceTwiceMono = userWorkspaceService.leaveWorkspace(workspaceId).then(userWorkspaceService.leaveWorkspace(workspaceId));
        StepVerifier.create(leaveWorkspaceTwiceMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.ACTION_IS_NOT_AUTHORIZED.getMessage("Workspace is not assigned to the user.")))
                .verify();
    }
}
