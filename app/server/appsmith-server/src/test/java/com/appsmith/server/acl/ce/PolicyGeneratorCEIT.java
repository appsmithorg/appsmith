package com.appsmith.server.acl.ce;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.Permission;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MANAGE_PROTECTED_BRANCHES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_CREATE_APPLICATION;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
public class PolicyGeneratorCEIT {

    @Autowired
    private PolicyGeneratorCE policyGenerator;

    @Test
    @WithUserDetails(value = "api_user")
    public void whenCreateApplicationPermissionGranted_ThenManageProtectedBranchesPermissionAlsoGranted() {
        // Create a test workspace
        Workspace workspace = new Workspace();
        workspace.setId("test-workspace");
        workspace.setName("Test Workspace");

        // Create a test application
        Application application = new Application();
        application.setId("test-application");
        application.setName("Test Application");
        application.setWorkspaceId(workspace.getId());

        // Generate policies for the application
        Set<Permission> permissions =
                policyGenerator.getAllChildPermissions(Set.of(WORKSPACE_CREATE_APPLICATION), workspace);

        // Verify that MANAGE_PROTECTED_BRANCHES permission is included when CREATE_APPLICATION is granted
        boolean hasManageProtectedBranches = permissions.stream()
                .anyMatch(permission -> MANAGE_PROTECTED_BRANCHES.equals(permission.getAclPermission()));

        assertThat(hasManageProtectedBranches)
                .as("MANAGE_PROTECTED_BRANCHES permission should be granted when CREATE_APPLICATION is granted")
                .isTrue();
    }
}
