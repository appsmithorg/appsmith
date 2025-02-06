package com.appsmith.server.migrations.solutions.ce;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.solutions.PolicySolution;
import org.jetbrains.annotations.NotNull;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;
import static com.appsmith.server.acl.AclPermission.READ_USERS;
import static com.appsmith.server.acl.AclPermission.RESET_PASSWORD_USERS;

public class UpdateSuperUserMigrationHelperCE {
    protected Set<Policy> generateUserPolicy(
            User user,
            PermissionGroup userManagementRole,
            PermissionGroup instanceAdminRole,
            Organization organization,
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
            Organization organization,
            PermissionGroup instanceAdminRole,
            MongoTemplate mongoTemplate,
            PolicySolution policySolution,
            PolicyGenerator policyGenerator) {
        User user = new User();
        user.setEmail(email);
        user.setIsEnabled(false);
        user.setOrganizationId(organization.getId());
        user.setCreatedAt(Instant.now());
        user = mongoTemplate.save(user);

        PermissionGroup userManagementPermissionGroup = createUserManagementPermissionGroup(mongoTemplate, user);

        Set<Policy> userPolicies = this.generateUserPolicy(
                user, userManagementPermissionGroup, instanceAdminRole, organization, policySolution, policyGenerator);

        user.setPolicies(userPolicies);

        return mongoTemplate.save(user);
    }

    @NotNull public static PermissionGroup createUserManagementPermissionGroup(MongoTemplate mongoTemplate, User user) {
        PermissionGroup userManagementPermissionGroup = new PermissionGroup();
        userManagementPermissionGroup.setName(user.getUsername() + FieldName.SUFFIX_USER_MANAGEMENT_ROLE);
        // Add CRUD permissions for user to the group
        userManagementPermissionGroup.setPermissions(Set.of(new Permission(user.getId(), MANAGE_USERS)));

        // Assign the permission group to the user
        userManagementPermissionGroup.setAssignedToUserIds(Set.of(user.getId()));

        PermissionGroup savedPermissionGroup = mongoTemplate.save(userManagementPermissionGroup);
        return savedPermissionGroup;
    }
}
