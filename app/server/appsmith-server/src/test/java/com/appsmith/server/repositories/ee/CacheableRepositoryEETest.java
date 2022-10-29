package com.appsmith.server.repositories.ee;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PermissionGroupCompactDTO;
import com.appsmith.server.dtos.UpdateRoleAssociationDTO;
import com.appsmith.server.dtos.UserGroupCompactDTO;
import com.appsmith.server.dtos.UserGroupDTO;
import com.appsmith.server.dtos.UsersForGroupDTO;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.UserGroupService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.UserAndAccessManagementService;
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

import static com.appsmith.server.constants.FieldName.ADMINISTRATOR;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
public class CacheableRepositoryEETest {

    @Autowired
    CacheableRepositoryHelper cacheableRepositoryHelper;

    @Autowired
    UserRepository userRepository;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    UserGroupService userGroupService;

    @Autowired
    UserUtils userUtils;

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    UserAndAccessManagementService userAndAccessManagementService;


    @Test
    @WithUserDetails(value = "api_user")
    public void getUserPermissionsTest_withUserGroup_onPermissionGroupDelete_valid() {

        User api_user = userRepository.findByEmail("api_user").block();

        // Make api_user instance administrator before starting the tests
        userUtils.makeSuperUser(List.of(api_user)).block();


        // Create a user group and add the user to it
        UserGroup userGroup = new UserGroup();
        String name = "Test Group : getUserPermissionsTest_withUserGroup_onPermissionGroupDelete_valid";
        String description = "Test Group Description : getUserPermissionsTest_withUserGroup_onPermissionGroupDelete_valid";
        userGroup.setName(name);
        userGroup.setDescription(description);

        UserGroupDTO createdGroup = userGroupService.createGroup(userGroup).block();

        UsersForGroupDTO inviteUsersToGroupDTO = new UsersForGroupDTO();
        inviteUsersToGroupDTO.setGroupIds(Set.of(createdGroup.getId()));
        inviteUsersToGroupDTO.setUsernames(Set.of("api_user"));

        userGroupService.inviteUsers(inviteUsersToGroupDTO, "origin").block();

        // Associate a custom permission group with the user group
        PermissionGroup permissionGroup = new PermissionGroup();
        name = "Test Role";
        description = "Test Role Description";
        permissionGroup.setName(name);
        permissionGroup.setDescription(description);
        // create the role
        PermissionGroup createdRole = permissionGroupService.create(permissionGroup).block();

        UpdateRoleAssociationDTO updateRoleAssociationDTO = new UpdateRoleAssociationDTO();

        updateRoleAssociationDTO.setGroups(
                Set.of(new UserGroupCompactDTO(createdGroup.getId(), createdGroup.getName()))
        );

        updateRoleAssociationDTO.setRolesAdded(
                Set.of(new PermissionGroupCompactDTO(createdRole.getId(), createdRole.getName()))
        );

        // Now assign the created group to the created custom role
        userAndAccessManagementService.changeRoleAssociations(updateRoleAssociationDTO).block();

        // Create a new workspace so that the user gets auto assigned the workspace administrator directly
        Workspace workspace = new Workspace();
        workspace.setName("getUserPermissionsTest_onPermissionGroupDelete_valid Workspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        List<PermissionGroup> defaultPermissionGroups = permissionGroupRepository.findAllById(createdWorkspace.getDefaultPermissionGroups()).collectList().block();
        PermissionGroup adminPg = defaultPermissionGroups.stream().filter(pg -> pg.getName().startsWith(ADMINISTRATOR)).findFirst().get();

        Mono<Set<String>> permissionGroupsOfUserMono = cacheableRepositoryHelper.getPermissionGroupsOfUser(api_user);

        // Assert that the user has the ADMINISTRATOR permission group of the workspace and the custom permission group via the user group
        StepVerifier.create(permissionGroupsOfUserMono)
                .assertNext(permissionGroupsOfUser -> {
                    assertThat(permissionGroupsOfUser).contains(adminPg.getId());
                    assertThat(permissionGroupsOfUser).contains(createdRole.getId());
                })
                .verifyComplete();

        // Now delete the workspace and assert that user permission groups does not contain the admin pg
        workspaceService.archiveById(createdWorkspace.getId()).block();

        Set<String> userPermissionGroupsPostWorkspaceDelete = cacheableRepositoryHelper.getPermissionGroupsOfUser(api_user).block();
        assertThat(userPermissionGroupsPostWorkspaceDelete).doesNotContain(adminPg.getId());

        // Now delete the custom permission group and assert that user permission groups does not contain the custom pg
        permissionGroupService.archiveById(createdRole.getId()).block();
        userPermissionGroupsPostWorkspaceDelete = cacheableRepositoryHelper.getPermissionGroupsOfUser(api_user).block();
        assertThat(userPermissionGroupsPostWorkspaceDelete).doesNotContain(createdRole.getId());

    }
}
