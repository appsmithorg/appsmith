package com.appsmith.server.migrations.solutions;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import com.appsmith.server.migrations.solutions.ce.UpdateSuperUserMigrationHelperCE;
import com.appsmith.server.solutions.PolicySolution;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@NoArgsConstructor
public class UpdateSuperUserMigrationHelper extends UpdateSuperUserMigrationHelperCE {
    @Override
    protected Set<Policy> generateUserPolicy(
            User user,
            PermissionGroup userManagementRole,
            PermissionGroup instanceAdminRole,
            Tenant tenant,
            PolicySolution policySolution,
            PolicyGenerator policyGenerator) {
        Set<Policy> userPoliciesWithUserManagementRole = super.generateUserPolicy(
                user, userManagementRole, instanceAdminRole, tenant, policySolution, policyGenerator);
        user.setPolicies(userPoliciesWithUserManagementRole);
        Map<String, Policy> userPoliciesMapWithNewPermissions =
                policyGenerator.getAllChildPolicies(tenant.getPolicies(), Tenant.class, User.class).stream()
                        .collect(Collectors.toMap(Policy::getPermission, Function.identity()));
        policySolution.addPoliciesToExistingObject(userPoliciesMapWithNewPermissions, user);
        return user.getPolicies();
    }
}
