package com.appsmith.server.services.ee;

import com.appsmith.external.models.Policy;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PermissionGroupCompactDTO;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.UpdateRoleAssociationDTO;
import com.appsmith.server.dtos.UserCompactDTO;
import com.appsmith.server.dtos.UserForManagementDTO;
import com.appsmith.server.dtos.UserGroupCompactDTO;
import com.appsmith.server.dtos.UserGroupDTO;
import com.appsmith.server.dtos.UsersForGroupDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.repositories.UserRepository;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.util.LinkedMultiValueMap;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.READ_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.UNASSIGN_PERMISSION_GROUPS;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
public class UserAndAccessManagementServiceTest {

    @Autowired
    UserRepository userRepository;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    UserGroupRepository userGroupRepository;

    @Autowired
    UserUtils userUtils;

    @Autowired
    UserAndAccessManagementService userAndAccessManagementService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    UserGroupService userGroupService;

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    UserService userService;

    @Autowired
    UserDataService userDataService;

    User apiUser, testUser;

    @BeforeEach
    public void setup() {
        apiUser = userRepository.findByEmail("api_user").block();
        testUser = userRepository.findByEmail("usertest@usertest.com").block();
        userUtils.makeSuperUser(List.of(apiUser)).block();
    }

    @Test
    @WithUserDetails("api_user")
    public void test_changeRoleAssociation_validUseCase() {
        Workspace workspace = new Workspace();
        workspace.setName("UserAndAccessManagementServiceTest - test_changeRoleAssociation_validUseCase");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        List<PermissionGroup> autoCreatedPermissionGroups = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(createdWorkspace.getId(), Workspace.class.getSimpleName())
                .collectList()
                .block();

        PermissionGroup administratorPermissionGroup = autoCreatedPermissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(FieldName.ADMINISTRATOR))
                .findFirst()
                .get();
        PermissionGroup developerPermissionGroup = autoCreatedPermissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(FieldName.DEVELOPER))
                .findFirst()
                .get();

        UserGroup userGroup = new UserGroup();
        userGroup.setName("UserAndAccessManagementServiceTest - test_changeRoleAssociation_validUseCase - 1");
        UserGroup createdUserGroup = userGroupService
                .createGroup(userGroup)
                .flatMap(userGroupDTO -> userGroupRepository.findById(userGroupDTO.getId()))
                .block();

        UserCompactDTO userCompactDTO = new UserCompactDTO();
        userCompactDTO.setId(testUser.getId());
        userCompactDTO.setUsername(testUser.getUsername());
        userCompactDTO.setName(testUser.getName());
        UserGroupCompactDTO userGroupCompactDTO = new UserGroupCompactDTO();
        userGroupCompactDTO.setId(createdUserGroup.getId());
        userGroupCompactDTO.setName(createdUserGroup.getName());
        PermissionGroupCompactDTO permissionGroupCompactDTO1 = new PermissionGroupCompactDTO();
        permissionGroupCompactDTO1.setId(administratorPermissionGroup.getId());
        permissionGroupCompactDTO1.setName(administratorPermissionGroup.getName());
        UpdateRoleAssociationDTO updateRoleAssociationDTO = new UpdateRoleAssociationDTO();
        updateRoleAssociationDTO.setUsers(Set.of(userCompactDTO));
        updateRoleAssociationDTO.setGroups(Set.of(userGroupCompactDTO));
        updateRoleAssociationDTO.setRolesAdded(Set.of(permissionGroupCompactDTO1));

        Boolean created = userAndAccessManagementService
                .changeRoleAssociations(updateRoleAssociationDTO, "originHeader")
                .block();
        assertThat(created).isTrue();
        PermissionGroup updatedAdminPermissionGroup = permissionGroupRepository
                .findById(administratorPermissionGroup.getId())
                .block();
        assertThat(updatedAdminPermissionGroup.getAssignedToGroupIds()).hasSize(1);
        assertThat(updatedAdminPermissionGroup.getAssignedToGroupIds().contains(createdUserGroup.getId()))
                .isTrue();
        assertThat(updatedAdminPermissionGroup.getAssignedToUserIds()).hasSize(2);
        assertThat(updatedAdminPermissionGroup.getAssignedToUserIds().contains(apiUser.getId()))
                .isTrue();
        assertThat(updatedAdminPermissionGroup.getAssignedToUserIds().contains(testUser.getId()))
                .isTrue();
    }

    @Test
    @WithUserDetails("api_user")
    public void test_changeRoleAssociation_inValidUseCase_usingSameUser() {
        Workspace workspace = new Workspace();
        workspace.setName(
                "UserAndAccessManagementServiceTest - test_changeRoleAssociation_inValidUseCase_usingSameUser");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        List<PermissionGroup> autoCreatedPermissionGroups = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(createdWorkspace.getId(), Workspace.class.getSimpleName())
                .collectList()
                .block();

        PermissionGroup administratorPermissionGroup = autoCreatedPermissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(FieldName.ADMINISTRATOR))
                .findFirst()
                .get();
        PermissionGroup developerPermissionGroup = autoCreatedPermissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(FieldName.DEVELOPER))
                .findFirst()
                .get();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(
                "UserAndAccessManagementServiceTest - test_changeRoleAssociation_inValidUseCase_usingSameUser");
        UserGroup createdUserGroup = userGroupService
                .createGroup(userGroup)
                .flatMap(userGroupDTO -> userGroupRepository.findById(userGroupDTO.getId()))
                .block();

        UserCompactDTO userCompactDTO = new UserCompactDTO();
        userCompactDTO.setId(apiUser.getId());
        userCompactDTO.setUsername(apiUser.getUsername());
        userCompactDTO.setName(apiUser.getName());
        UserGroupCompactDTO userGroupCompactDTO = new UserGroupCompactDTO();
        userGroupCompactDTO.setId(createdUserGroup.getId());
        userGroupCompactDTO.setName(createdUserGroup.getName());
        PermissionGroupCompactDTO permissionGroupCompactDTO1 = new PermissionGroupCompactDTO();
        permissionGroupCompactDTO1.setId(administratorPermissionGroup.getId());
        permissionGroupCompactDTO1.setName(administratorPermissionGroup.getName());
        UpdateRoleAssociationDTO updateRoleAssociationDTO = new UpdateRoleAssociationDTO();
        updateRoleAssociationDTO.setUsers(Set.of(userCompactDTO));
        updateRoleAssociationDTO.setGroups(Set.of(userGroupCompactDTO));
        updateRoleAssociationDTO.setRolesAdded(Set.of(permissionGroupCompactDTO1));

        StepVerifier.create(
                        userAndAccessManagementService.changeRoleAssociations(updateRoleAssociationDTO, "originHeader"))
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.ROLES_FROM_SAME_WORKSPACE.getMessage()))
                .verify();
        PermissionGroup updatedAdminPermissionGroup = permissionGroupRepository
                .findById(administratorPermissionGroup.getId())
                .block();
        assertThat(updatedAdminPermissionGroup.getAssignedToGroupIds()).hasSize(0);
        assertThat(updatedAdminPermissionGroup.getAssignedToUserIds()).hasSize(1);
        assertThat(updatedAdminPermissionGroup.getAssignedToUserIds().contains(apiUser.getId()))
                .isTrue();
    }

    @Test
    @WithUserDetails("api_user")
    public void test_changeRoleAssociation_inValidUseCase_usingSameUserDifferentPg() {
        Workspace workspace = new Workspace();
        workspace.setName(
                "UserAndAccessManagementServiceTest - test_changeRoleAssociation_inValidUseCase_usingSameUserDifferentPg");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        List<PermissionGroup> autoCreatedPermissionGroups = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(createdWorkspace.getId(), Workspace.class.getSimpleName())
                .collectList()
                .block();

        PermissionGroup administratorPermissionGroup = autoCreatedPermissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(FieldName.ADMINISTRATOR))
                .findFirst()
                .get();
        PermissionGroup developerPermissionGroup = autoCreatedPermissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(FieldName.DEVELOPER))
                .findFirst()
                .get();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(
                "UserAndAccessManagementServiceTest - test_changeRoleAssociation_inValidUseCase_usingSameUserDifferentPg");
        UserGroup createdUserGroup = userGroupService
                .createGroup(userGroup)
                .flatMap(userGroupDTO -> userGroupRepository.findById(userGroupDTO.getId()))
                .block();

        UserCompactDTO userCompactDTO = new UserCompactDTO();
        userCompactDTO.setId(apiUser.getId());
        userCompactDTO.setUsername(apiUser.getUsername());
        userCompactDTO.setName(apiUser.getName());
        UserGroupCompactDTO userGroupCompactDTO = new UserGroupCompactDTO();
        userGroupCompactDTO.setId(createdUserGroup.getId());
        userGroupCompactDTO.setName(createdUserGroup.getName());
        PermissionGroupCompactDTO permissionGroupCompactDTO1 = new PermissionGroupCompactDTO();
        permissionGroupCompactDTO1.setId(developerPermissionGroup.getId());
        permissionGroupCompactDTO1.setName(developerPermissionGroup.getName());
        UpdateRoleAssociationDTO updateRoleAssociationDTO = new UpdateRoleAssociationDTO();
        updateRoleAssociationDTO.setUsers(Set.of(userCompactDTO));
        updateRoleAssociationDTO.setGroups(Set.of(userGroupCompactDTO));
        updateRoleAssociationDTO.setRolesAdded(Set.of(permissionGroupCompactDTO1));

        StepVerifier.create(
                        userAndAccessManagementService.changeRoleAssociations(updateRoleAssociationDTO, "originHeader"))
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.ROLES_FROM_SAME_WORKSPACE.getMessage()))
                .verify();
        PermissionGroup updatedAdminPermissionGroup = permissionGroupRepository
                .findById(administratorPermissionGroup.getId())
                .block();
        assertThat(updatedAdminPermissionGroup.getAssignedToGroupIds()).hasSize(0);
        assertThat(updatedAdminPermissionGroup.getAssignedToUserIds()).hasSize(1);
        assertThat(updatedAdminPermissionGroup.getAssignedToUserIds().contains(apiUser.getId()))
                .isTrue();
    }

    @Test
    @WithUserDetails("api_user")
    public void test_changeRoleAssociation_inValidUseCase_usingSameUserGroup() {
        Workspace workspace = new Workspace();
        workspace.setName(
                "UserAndAccessManagementServiceTest - test_changeRoleAssociation_inValidUseCase_usingSameUserGroup");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        List<PermissionGroup> autoCreatedPermissionGroups = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(createdWorkspace.getId(), Workspace.class.getSimpleName())
                .collectList()
                .block();

        PermissionGroup administratorPermissionGroup = autoCreatedPermissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(FieldName.ADMINISTRATOR))
                .findFirst()
                .get();
        PermissionGroup developerPermissionGroup = autoCreatedPermissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(FieldName.DEVELOPER))
                .findFirst()
                .get();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(
                "UserAndAccessManagementServiceTest - test_changeRoleAssociation_inValidUseCase_usingSameUserGroup");
        UserGroup createdUserGroup = userGroupService
                .createGroup(userGroup)
                .flatMap(userGroupDTO -> userGroupRepository.findById(userGroupDTO.getId()))
                .block();
        // Assign permissions to a UserGroup created above
        PermissionGroup permissionGroupWithUserGroupAssigned = permissionGroupService
                .assignToUserGroup(administratorPermissionGroup, createdUserGroup)
                .block();

        UserCompactDTO userCompactDTO = new UserCompactDTO();
        userCompactDTO.setId(testUser.getId());
        userCompactDTO.setUsername(testUser.getUsername());
        userCompactDTO.setName(testUser.getName());
        UserGroupCompactDTO userGroupCompactDTO = new UserGroupCompactDTO();
        userGroupCompactDTO.setId(createdUserGroup.getId());
        userGroupCompactDTO.setName(createdUserGroup.getName());
        PermissionGroupCompactDTO permissionGroupCompactDTO1 = new PermissionGroupCompactDTO();
        permissionGroupCompactDTO1.setId(administratorPermissionGroup.getId());
        permissionGroupCompactDTO1.setName(administratorPermissionGroup.getName());
        UpdateRoleAssociationDTO updateRoleAssociationDTO = new UpdateRoleAssociationDTO();
        updateRoleAssociationDTO.setUsers(Set.of(userCompactDTO));
        updateRoleAssociationDTO.setGroups(Set.of(userGroupCompactDTO));
        updateRoleAssociationDTO.setRolesAdded(Set.of(permissionGroupCompactDTO1));

        StepVerifier.create(
                        userAndAccessManagementService.changeRoleAssociations(updateRoleAssociationDTO, "originHeader"))
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.ROLES_FROM_SAME_WORKSPACE.getMessage()))
                .verify();
        PermissionGroup updatedAdminPermissionGroup = permissionGroupRepository
                .findById(administratorPermissionGroup.getId())
                .block();
        assertThat(updatedAdminPermissionGroup.getAssignedToGroupIds()).hasSize(1);
        assertThat(updatedAdminPermissionGroup.getAssignedToGroupIds().contains(createdUserGroup.getId()))
                .isTrue();
        assertThat(updatedAdminPermissionGroup.getAssignedToUserIds()).hasSize(1);
        assertThat(updatedAdminPermissionGroup.getAssignedToUserIds().contains(apiUser.getId()))
                .isTrue();
    }

    @Test
    @WithUserDetails("api_user")
    public void test_changeRoleAssociation_inValidUseCase_usingSameUserGroupDifferentPg() {
        Workspace workspace = new Workspace();
        workspace.setName(
                "UserAndAccessManagementServiceTest - test_changeRoleAssociation_inValidUseCase_usingSameUserGroupDifferentPg");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        List<PermissionGroup> autoCreatedPermissionGroups = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(createdWorkspace.getId(), Workspace.class.getSimpleName())
                .collectList()
                .block();

        PermissionGroup administratorPermissionGroup = autoCreatedPermissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(FieldName.ADMINISTRATOR))
                .findFirst()
                .get();
        PermissionGroup developerPermissionGroup = autoCreatedPermissionGroups.stream()
                .filter(pg -> pg.getName().startsWith(FieldName.DEVELOPER))
                .findFirst()
                .get();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(
                "UserAndAccessManagementServiceTest - test_changeRoleAssociation_inValidUseCase_usingSameUserGroup");
        UserGroup createdUserGroup = userGroupService
                .createGroup(userGroup)
                .flatMap(userGroupDTO -> userGroupRepository.findById(userGroupDTO.getId()))
                .block();
        // Assign permissions to a UserGroup created above
        PermissionGroup permissionGroupWithUserGroupAssigned = permissionGroupService
                .assignToUserGroup(administratorPermissionGroup, createdUserGroup)
                .block();

        UserCompactDTO userCompactDTO = new UserCompactDTO();
        userCompactDTO.setId(testUser.getId());
        userCompactDTO.setUsername(testUser.getUsername());
        userCompactDTO.setName(testUser.getName());
        UserGroupCompactDTO userGroupCompactDTO = new UserGroupCompactDTO();
        userGroupCompactDTO.setId(createdUserGroup.getId());
        userGroupCompactDTO.setName(createdUserGroup.getName());
        PermissionGroupCompactDTO permissionGroupCompactDTO1 = new PermissionGroupCompactDTO();
        permissionGroupCompactDTO1.setId(developerPermissionGroup.getId());
        permissionGroupCompactDTO1.setName(developerPermissionGroup.getName());
        UpdateRoleAssociationDTO updateRoleAssociationDTO = new UpdateRoleAssociationDTO();
        updateRoleAssociationDTO.setUsers(Set.of(userCompactDTO));
        updateRoleAssociationDTO.setGroups(Set.of(userGroupCompactDTO));
        updateRoleAssociationDTO.setRolesAdded(Set.of(permissionGroupCompactDTO1));

        StepVerifier.create(
                        userAndAccessManagementService.changeRoleAssociations(updateRoleAssociationDTO, "originHeader"))
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.ROLES_FROM_SAME_WORKSPACE.getMessage()))
                .verify();
        PermissionGroup updatedAdminPermissionGroup = permissionGroupRepository
                .findById(administratorPermissionGroup.getId())
                .block();
        PermissionGroup updatedDeveloperPermissionGroup = permissionGroupRepository
                .findById(developerPermissionGroup.getId())
                .block();
        assertThat(updatedAdminPermissionGroup.getAssignedToGroupIds()).hasSize(1);
        assertThat(updatedAdminPermissionGroup.getAssignedToGroupIds().contains(createdUserGroup.getId()))
                .isTrue();
        assertThat(updatedDeveloperPermissionGroup.getAssignedToGroupIds()).hasSize(0);
        assertThat(updatedAdminPermissionGroup.getAssignedToUserIds()).hasSize(1);
        assertThat(updatedAdminPermissionGroup.getAssignedToUserIds().contains(apiUser.getId()))
                .isTrue();
    }

    @Test
    @WithUserDetails("api_user")
    public void test_changeRoleAssociation_assignPermissionsDontExist() {
        Workspace workspace = new Workspace();
        workspace.setName("UserAndAccessManagementServiceTest - test_changeRoleAssociation_assignPermissionsDontExist");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("test_changeRoleAssociation_assignPermissionsDontExist");
        PermissionGroup createdPermissionGroup =
                permissionGroupService.create(permissionGroup).block();
        Set<Policy> existingPolicies = createdPermissionGroup.getPolicies();
        /*
         * We take away all Manage Page permissions for existing page.
         * Now since, no one has the permissions to existing page, the application forking will fail.
         */
        Set<Policy> newPoliciesWithoutEdit = existingPolicies.stream()
                .filter(policy -> !policy.getPermission().equals(ASSIGN_PERMISSION_GROUPS.getValue()))
                .collect(Collectors.toSet());
        createdPermissionGroup.setPolicies(newPoliciesWithoutEdit);
        PermissionGroup updatedPermissionGroup =
                permissionGroupRepository.save(createdPermissionGroup).block();
        UserGroup userGroup = new UserGroup();
        userGroup.setName("UserAndAccessManagementServiceTest - test_changeRoleAssociation_assignPermissionsDontExist");
        UserGroup createdUserGroup = userGroupService
                .createGroup(userGroup)
                .flatMap(userGroupDTO -> userGroupRepository.findById(userGroupDTO.getId()))
                .block();
        UserGroupCompactDTO userGroupCompactDTO = new UserGroupCompactDTO();
        userGroupCompactDTO.setId(createdUserGroup.getId());
        userGroupCompactDTO.setName(createdUserGroup.getName());
        PermissionGroupCompactDTO permissionGroupCompactDTO = new PermissionGroupCompactDTO();
        permissionGroupCompactDTO.setId(updatedPermissionGroup.getId());
        permissionGroupCompactDTO.setName(updatedPermissionGroup.getName());
        UpdateRoleAssociationDTO updateRoleAssociationDTO = new UpdateRoleAssociationDTO();
        updateRoleAssociationDTO.setGroups(Set.of(userGroupCompactDTO));
        updateRoleAssociationDTO.setRolesAdded(Set.of(permissionGroupCompactDTO));
        StepVerifier.create(
                        userAndAccessManagementService.changeRoleAssociations(updateRoleAssociationDTO, "originHeader"))
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .contains(AppsmithError.ASSIGN_UNASSIGN_MISSING_PERMISSION.getMessage(
                                        "role", updatedPermissionGroup.getId())))
                .verify();
        PermissionGroup setPoliciesBack =
                permissionGroupRepository.save(updatedPermissionGroup).block();
    }

    @Test
    @WithUserDetails("api_user")
    public void test_changeRoleAssociation_unassignPermissionsDontExist() {
        Workspace workspace = new Workspace();
        workspace.setName(
                "UserAndAccessManagementServiceTest - test_changeRoleAssociation_unassignPermissionsDontExist");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("test_changeRoleAssociation_assignPermissionsDontExist");
        PermissionGroup createdPermissionGroup =
                permissionGroupService.create(permissionGroup).block();
        Set<Policy> existingPolicies = createdPermissionGroup.getPolicies();
        /*
         * We take away all Manage Page permissions for existing page.
         * Now since, no one has the permissions to existing page, the application forking will fail.
         */
        Set<Policy> newPoliciesWithoutEdit = existingPolicies.stream()
                .filter(policy -> !policy.getPermission().equals(UNASSIGN_PERMISSION_GROUPS.getValue()))
                .collect(Collectors.toSet());
        createdPermissionGroup.setPolicies(newPoliciesWithoutEdit);
        PermissionGroup updatedPermissionGroup =
                permissionGroupRepository.save(createdPermissionGroup).block();
        UserGroup userGroup = new UserGroup();
        userGroup.setName(
                "UserAndAccessManagementServiceTest - test_changeRoleAssociation_unassignPermissionsDontExist");
        UserGroup createdUserGroup = userGroupService
                .createGroup(userGroup)
                .flatMap(userGroupDTO -> userGroupRepository.findById(userGroupDTO.getId()))
                .block();
        UserGroupCompactDTO userGroupCompactDTO = new UserGroupCompactDTO();
        userGroupCompactDTO.setId(createdUserGroup.getId());
        userGroupCompactDTO.setName(createdUserGroup.getName());
        PermissionGroupCompactDTO permissionGroupCompactDTO = new PermissionGroupCompactDTO();
        permissionGroupCompactDTO.setId(updatedPermissionGroup.getId());
        permissionGroupCompactDTO.setName(updatedPermissionGroup.getName());
        UpdateRoleAssociationDTO updateRoleAssociationDTO = new UpdateRoleAssociationDTO();
        updateRoleAssociationDTO.setGroups(Set.of(userGroupCompactDTO));
        updateRoleAssociationDTO.setRolesRemoved(Set.of(permissionGroupCompactDTO));
        StepVerifier.create(
                        userAndAccessManagementService.changeRoleAssociations(updateRoleAssociationDTO, "originHeader"))
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .contains(AppsmithError.ASSIGN_UNASSIGN_MISSING_PERMISSION.getMessage(
                                        "role", updatedPermissionGroup.getId())))
                .verify();
        PermissionGroup setPoliciesBack =
                permissionGroupRepository.save(updatedPermissionGroup).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGetAllUsers_assertPhotoId() {
        String testName = "testGetAllUsers_assertPhotoId";
        User user1 = new User();
        user1.setEmail(testName + 1);
        user1.setPassword(testName);
        User createdUser1 = userService.userCreate(user1, false).block();
        UserData userData1 = userDataService.getForUser(createdUser1).block();
        userData1.setProfilePhotoAssetId(testName + 1);
        UserData userData1PostUpdate =
                userDataService.updateForUser(createdUser1, userData1).block();

        User user2 = new User();
        user2.setEmail(testName);
        user2.setPassword(testName + 2);
        User createdUser2 = userService.userCreate(user2, false).block();
        UserData userData2 = userDataService.getForUser(createdUser2).block();
        userData2.setProfilePhotoAssetId(testName + 2);
        UserData userData2PostUpdate =
                userDataService.updateForUser(createdUser2, userData2).block();

        List<UserForManagementDTO> usersList = userAndAccessManagementService
                .getAllUsers(new LinkedMultiValueMap<>())
                .block();
        Optional<UserForManagementDTO> userForManagementDTO1 = usersList.stream()
                .filter(_user -> createdUser1.getId().equals(_user.getId()))
                .findFirst();
        assertThat(userForManagementDTO1.isPresent()).isTrue();
        assertThat(userForManagementDTO1.get().getPhotoId()).isEqualTo(testName + 1);

        Optional<UserForManagementDTO> userForManagementDTO2 = usersList.stream()
                .filter(_user -> createdUser2.getId().equals(_user.getId()))
                .findFirst();
        assertThat(userForManagementDTO2.isPresent()).isTrue();
        assertThat(userForManagementDTO2.get().getPhotoId()).isEqualTo(testName + 2);

        userAndAccessManagementService.deleteUser(createdUser1.getId()).block();
        userAndAccessManagementService.deleteUser(createdUser2.getId()).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGetUserById_assertPhotoId() {
        String testName = "testGetAllUsers_assertPhotoId";
        User user1 = new User();
        user1.setEmail(testName);
        user1.setPassword(testName);
        User createdUser1 = userService.userCreate(user1, false).block();
        UserData userData1 = userDataService.getForUser(createdUser1).block();
        userData1.setProfilePhotoAssetId(testName);
        UserData userData1PostUpdate =
                userDataService.updateForUser(createdUser1, userData1).block();

        UserForManagementDTO user =
                userAndAccessManagementService.getUserById(createdUser1.getId()).block();
        assertThat(user.getPhotoId()).isEqualTo(testName);

        userAndAccessManagementService.deleteUser(createdUser1.getId()).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGetUserById_assertUserPermissionsInGroupsAndRoles() {
        String testName = "testGetAllUsers_UserPermissionsInGroupsAndRoles";

        // user creation
        User user1 = new User();
        user1.setEmail(testName);
        user1.setPassword(testName);
        User createdUser1 = userService.userCreate(user1, false).block();

        // user groups creation
        UserGroup userGroup = new UserGroup();
        String name = "Test Group : addUsersToGroupValid";
        String description = "Test Group Description : addUsersToGroupValid";
        userGroup.setName(name);
        userGroup.setDescription(description);
        UserGroupDTO group1 = userGroupService.createGroup(userGroup).block();

        UserGroup userGroupProvisionedTrue = new UserGroup();
        userGroupProvisionedTrue.setName(testName + "_provisionedTrue");
        userGroupProvisionedTrue.setIsProvisioned(Boolean.TRUE);
        UserGroupDTO group2 =
                userGroupService.createGroup(userGroupProvisionedTrue).block();

        // invite users to groups
        UsersForGroupDTO inviteUsersToGroupDTO = new UsersForGroupDTO();
        inviteUsersToGroupDTO.setGroupIds(Set.of(group1.getId(), group2.getId()));
        inviteUsersToGroupDTO.setUsernames(Set.of(user1.getUsername()));
        userGroupService.inviteUsers(inviteUsersToGroupDTO, "origin").block();

        // create permission group
        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName(testName);
        PermissionGroup createdPermissionGroup = permissionGroupService
                .create(permissionGroup)
                .flatMap(pg -> permissionGroupService.findById(pg.getId(), READ_PERMISSION_GROUPS))
                .block();
        String userName = user1.getUsername();

        // update role associations
        UpdateRoleAssociationDTO updateRoleAssociationDTO = new UpdateRoleAssociationDTO();
        updateRoleAssociationDTO.setUsers(Set.of(new UserCompactDTO(null, user1.getUsername(), user1.getName())));
        updateRoleAssociationDTO.setRolesAdded(Set.of(
                new PermissionGroupCompactDTO(createdPermissionGroup.getId(), createdPermissionGroup.getName())));
        userAndAccessManagementService
                .changeRoleAssociations(updateRoleAssociationDTO, "originHeader")
                .block();

        // assertions
        StepVerifier.create(userAndAccessManagementService.getUserById(createdUser1.getId()))
                .assertNext(user -> {
                    assertThat(user.getGroups()).isNotNull();
                    assertThat(user.getGroups().size()).isEqualTo(2);
                    assertThat(user.getGroups().get(0).getUserPermissions().size() > 0)
                            .isTrue();
                    assertThat(user.getRoles().size()).isEqualTo(2);
                    // check if the user has the permission group
                    UserGroupCompactDTO userGroupCompactDTOGroupOne = user.getGroups().stream()
                            .filter(pg -> pg.getId().equals(group1.getId()))
                            .findFirst()
                            .get();
                    UserGroupCompactDTO userGroupCompactDTOGroupTwo = user.getGroups().stream()
                            .filter(pg -> pg.getId().equals(group2.getId()))
                            .findFirst()
                            .get();
                    assertThat(userGroupCompactDTOGroupOne.isProvisioned()).isFalse();
                    assertThat(userGroupCompactDTOGroupTwo.isProvisioned()).isTrue();

                    PermissionGroupInfoDTO permissionGroupInfoDTO = user.getRoles().stream()
                            .filter(pg -> pg.getId().equals(createdPermissionGroup.getId()))
                            .findFirst()
                            .get();
                    assertThat(permissionGroupInfoDTO.getUserPermissions().size() > 0)
                            .isTrue();
                })
                .verifyComplete();
    }
}
