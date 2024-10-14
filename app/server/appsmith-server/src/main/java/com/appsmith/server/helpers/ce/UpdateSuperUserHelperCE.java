package com.appsmith.server.helpers.ce;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.solutions.PolicySolution;
import org.jetbrains.annotations.NotNull;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;
import static com.appsmith.server.acl.AclPermission.READ_USERS;
import static com.appsmith.server.acl.AclPermission.RESET_PASSWORD_USERS;

public class UpdateSuperUserHelperCE {
    protected Set<Policy> generateUserPolicy(
            User user,
            PermissionGroup userManagementRole,
            PermissionGroup instanceAdminRole,
            Tenant tenant,
            PolicySolution policySolution,
            PolicyGenerator policyGenerator) {
        Policy readUserPolicy = Policy.builder()
                .permission(READ_USERS.getValue())
                .permissionGroups(Set.of(userManagementRole.getId()))
                .build();
        Policy manageUserPolicy = Policy.builder()
                .permission(MANAGE_USERS.getValue())
                .permissionGroups(Set.of(userManagementRole.getId()))
                .build();
        Policy resetPwdPolicy = Policy.builder()
                .permission(RESET_PASSWORD_USERS.getValue())
                .permissionGroups(Set.of(userManagementRole.getId()))
                .build();

        return new HashSet<>(Set.of(readUserPolicy, manageUserPolicy, resetPwdPolicy));
    }

    public User createNewUser(
            String email,
            Tenant tenant,
            PermissionGroup instanceAdminRole,
            UserRepository userRepository,
            PermissionGroupRepository permissionGroupRepository,
            PolicySolution policySolution,
            PolicyGenerator policyGenerator) {
        User user = new User();
        user.setEmail(email);
        user.setIsEnabled(false);
        user.setTenantId(tenant.getId());
        user.setCreatedAt(Instant.now());
        user = userRepository.save(user);

        PermissionGroup userManagementPermissionGroup = createUserManagementPermissionGroup(permissionGroupRepository, user);

        Set<Policy> userPolicies = this.generateUserPolicy(
                user, userManagementPermissionGroup, instanceAdminRole, tenant, policySolution, policyGenerator);

        user.setPolicies(userPolicies);

        return userRepository.save(user);
    }

    @NotNull public static PermissionGroup createUserManagementPermissionGroup(PermissionGroupRepository permissionGroupRepository, User user) {
        PermissionGroup userManagementPermissionGroup = new PermissionGroup();
        userManagementPermissionGroup.setName(user.getUsername() + FieldName.SUFFIX_USER_MANAGEMENT_ROLE);
        // Add CRUD permissions for user to the group
        userManagementPermissionGroup.setPermissions(Set.of(new Permission(user.getId(), MANAGE_USERS)));

        // Assign the permission group to the user
        userManagementPermissionGroup.setAssignedToUserIds(Set.of(user.getId()));

        PermissionGroup savedPermissionGroup = permissionGroupRepository.save(userManagementPermissionGroup);
        return savedPermissionGroup;
    }
}
