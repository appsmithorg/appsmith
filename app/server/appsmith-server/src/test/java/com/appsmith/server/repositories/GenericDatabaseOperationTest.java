package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.services.WorkspaceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ExtendWith(SpringExtension.class)
public class GenericDatabaseOperationTest {

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserUtils userUtils;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    GenericDatabaseOperation genericDatabaseOperation;

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
    public void testUpdateRolesAddition() {
        if (superAdminPermissionGroupId == null) {
            superAdminPermissionGroupId = userUtils.getSuperAdminPermissionGroup().block().getId();
        }

        Workspace workspace = new Workspace();
        workspace.setName("testUpdateRolesAddition workspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Long updateResult = genericDatabaseOperation.updatePolicies(createdWorkspace.getId(),
                        superAdminPermissionGroupId,
                        List.of(AclPermission.MANAGE_WORKSPACES, AclPermission.READ_WORKSPACES),
                        List.of(),
                        Workspace.class)
                .block();

        Workspace postUpdate = workspaceService.findById(createdWorkspace.getId(), AclPermission.READ_WORKSPACES).block();
        postUpdate.getPolicies().stream().filter(policy -> policy.getPermission().equals(AclPermission.READ_WORKSPACES)).findFirst().ifPresent(policy -> {
            Set<String> permissionGroups = policy.getPermissionGroups();
            assertThat(permissionGroups).contains(superAdminPermissionGroupId);
        });
        postUpdate.getPolicies().stream().filter(policy -> policy.getPermission().equals(AclPermission.MANAGE_WORKSPACES)).findFirst().ifPresent(policy -> {
            Set<String> permissionGroups = policy.getPermissionGroups();
            assertThat(permissionGroups).contains(superAdminPermissionGroupId);
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testUpdateRolesRemoval() {

        Workspace workspace = new Workspace();
        workspace.setName("testUpdateRolesRemoval workspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        String toRemove = createdWorkspace.getDefaultPermissionGroups().stream().findFirst().get();

        Long updateResult = genericDatabaseOperation.updatePolicies(createdWorkspace.getId(),
                        toRemove,
                        List.of(),
                        List.of(AclPermission.READ_WORKSPACES),
                        Workspace.class)
                .block();

        Workspace postUpdate = workspaceService.findById(createdWorkspace.getId(), AclPermission.MANAGE_WORKSPACES).block();
        postUpdate.getPolicies().stream().filter(policy -> policy.getPermission().equals(AclPermission.MANAGE_WORKSPACES)).findFirst().ifPresent(policy -> {
            Set<String> permissionGroups = policy.getPermissionGroups();
            assertThat(permissionGroups).doesNotContain(toRemove);
        });
    }
}
