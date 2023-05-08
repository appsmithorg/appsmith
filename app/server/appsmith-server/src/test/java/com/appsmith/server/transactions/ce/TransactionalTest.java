package com.appsmith.server.transactions.ce;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.UpdatePermissionGroupDTO;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.UserWorkspaceService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.util.List;
import java.util.UUID;

@Slf4j
@SpringBootTest
@ExtendWith(SpringExtension.class)
public class TransactionalTest {

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    UserService userService;

    @Autowired
    UserWorkspaceService userWorkspaceService;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    UserAndAccessManagementService userAndAccessManagementService;

//    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    @RepeatedTest(value = 1000, name = "testUpdatePermissionGroupsForUsers_{currentRepetition}")
    void testUpdatePermissionGroupsForUsers() {
        User testUser = userService.findByEmail("usertest@usertest.com").block();
        String testName = "testUpdatePermissionGroupsForUsers";

        String randomUUID = UUID.randomUUID().toString();
        Workspace workspace = new Workspace();
        workspace.setName(testName + randomUUID);
        Workspace createdWorkspace = workspaceService.createDefault(workspace, testUser).block();

        List<PermissionGroup> workspaceRoles = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(createdWorkspace.getId(), Workspace.class.getSimpleName())
                .collectList()
                .block();

        List<String> workspaceRoleId = createdWorkspace.getDefaultPermissionGroups().stream().toList();



        User user = new User();
        user.setEmail(testName + randomUUID + "@test.com");
        user.setPassword(testName);
        User createdUser = userService.create(user).block();

        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        inviteUsersDTO.setPermissionGroupId(workspaceRoleId.get(0));
        inviteUsersDTO.setUsernames(List.of(createdUser.getUsername()));

        userAndAccessManagementService.inviteUsers(inviteUsersDTO, "test").block();

        log.debug("User Invited.");

        UpdatePermissionGroupDTO updatePermissionGroupDTO = new UpdatePermissionGroupDTO();
        updatePermissionGroupDTO.setUsername(createdUser.getUsername());
        updatePermissionGroupDTO.setNewPermissionGroupId(workspaceRoleId.get(1));

        userWorkspaceService.updatePermissionGroupForMember(createdWorkspace.getId(), updatePermissionGroupDTO, "test").block();
    }
}