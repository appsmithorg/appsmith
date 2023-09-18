package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.Policy;
import com.appsmith.external.models.QBaseDomain;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QUser;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.migrations.utils.CompatibilityUtils;
import com.appsmith.server.solutions.PolicySolution;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.Map;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static java.lang.Boolean.TRUE;

@Slf4j
@RequiredArgsConstructor
@ChangeUnit(order = "025", id = "create-user-management-roles-for-users-tagged-in-migration-024")
public class Migration025CreateUserManagementRolesForUsersTaggedIn024 {
    private final MongoTemplate mongoTemplate;
    private final PolicySolution policySolution;

    private static final int migrationRetries = 5;
    private static final String migrationNote = "This will not have any adverse effects on the Data. Restarting the "
            + "server will begin the migration from where it left.";
    private static final String migrationId = "create-user-management-roles-for-users-tagged-in-migration-024";

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void createUserManagementRolesForUsersTaggedInMigration024() {
        Criteria criteriaUsersTaggedInMigration024 = Criteria.where(
                        Migration024TagUsersWithNoUserManagementRoles
                                .MIGRATION_FLAG_024_TAG_USER_WITHOUT_USER_MANAGEMENT_ROLE)
                .is(TRUE);

        Query queryUsersTaggedInMigration024 = new Query(criteriaUsersTaggedInMigration024);
        queryUsersTaggedInMigration024.fields().include(fieldName(QUser.user.id));
        queryUsersTaggedInMigration024.fields().include(fieldName(QUser.user.policies));
        queryUsersTaggedInMigration024.fields().include(fieldName(QUser.user.email));

        Query optimisedQueryUsersTaggedInMigration024 = CompatibilityUtils.optimizeQueryForNoCursorTimeout(
                mongoTemplate, queryUsersTaggedInMigration024, User.class);

        int attempt = 0;
        long countUsersTaggedInMigration024 = mongoTemplate.count(optimisedQueryUsersTaggedInMigration024, User.class);

        while (attempt < migrationRetries && countUsersTaggedInMigration024 > 0) {
            mongoTemplate.stream(optimisedQueryUsersTaggedInMigration024, User.class)
                    .forEach(user -> {
                        User userWithUpdatedPolicies = createUserManagementRoleAndGetUserWithUpdatedPolicies(user);
                        Update updateMigrationFlagAndPoliciesForUser = new Update();
                        updateMigrationFlagAndPoliciesForUser.unset(
                                Migration024TagUsersWithNoUserManagementRoles
                                        .MIGRATION_FLAG_024_TAG_USER_WITHOUT_USER_MANAGEMENT_ROLE);
                        updateMigrationFlagAndPoliciesForUser.set(
                                fieldName(QUser.user.policies), userWithUpdatedPolicies.getPolicies());
                        Criteria criteriaUserId = Criteria.where(fieldName(QBaseDomain.baseDomain.id))
                                .is(user.getId());
                        Query queryUserId = new Query(criteriaUserId);
                        mongoTemplate.updateFirst(queryUserId, updateMigrationFlagAndPoliciesForUser, User.class);
                    });
            attempt += 1;
            countUsersTaggedInMigration024 = mongoTemplate.count(optimisedQueryUsersTaggedInMigration024, User.class);
        }

        if (countUsersTaggedInMigration024 > 0) {
            String reasonForFailure = "All user management roles were not created.";
            throw new AppsmithException(AppsmithError.MIGRATION_FAILED, migrationId, reasonForFailure, migrationNote);
        }
    }

    private User createUserManagementRoleAndGetUserWithUpdatedPolicies(User user) {
        // Create user management permission group
        PermissionGroup userManagementRole = new PermissionGroup();
        userManagementRole.setName(user.getUsername() + FieldName.SUFFIX_USER_MANAGEMENT_ROLE);
        // Add CRUD permissions for user to the group
        userManagementRole.setPermissions(Set.of(new Permission(user.getId(), MANAGE_USERS)));

        // Assign the permission group to the user
        userManagementRole.setAssignedToUserIds(Set.of(user.getId()));

        PermissionGroup savedUserManagementRole =
                mongoTemplate.save(userManagementRole, PermissionGroup.class.getSimpleName());

        Map<String, Policy> crudUserPolicies =
                policySolution.generatePolicyFromPermissionGroupForObject(savedUserManagementRole, user.getId());

        User updatedWithPolicies = policySolution.addPoliciesToExistingObject(crudUserPolicies, user);

        return updatedWithPolicies;
    }
}
