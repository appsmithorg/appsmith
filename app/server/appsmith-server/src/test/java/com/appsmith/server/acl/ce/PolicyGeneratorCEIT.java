package com.appsmith.server.acl.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
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
        // We don't need to create test instances since we're just testing permission inheritance
        // between workspace-level and application-level permissions

        // Get all child permissions (both lateral and hierarchical)
        Set<AclPermission> allPermissions =
                policyGenerator.getChildPermissions(WORKSPACE_CREATE_APPLICATION, Application.class);

        // Verify that MANAGE_PROTECTED_BRANCHES permission is included when CREATE_APPLICATION is granted
        boolean hasManageProtectedBranches =
                allPermissions.stream().anyMatch(permission -> MANAGE_PROTECTED_BRANCHES.equals(permission));

        assertThat(hasManageProtectedBranches)
                .as("MANAGE_PROTECTED_BRANCHES permission should be granted when CREATE_APPLICATION is granted")
                .isTrue();
    }
}
