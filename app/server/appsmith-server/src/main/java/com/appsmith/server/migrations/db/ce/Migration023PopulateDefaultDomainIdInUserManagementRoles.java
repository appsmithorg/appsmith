package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QPermissionGroup;
import com.appsmith.server.domains.QUser;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.migrations.utils.CompatibilityUtils;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import static com.appsmith.server.acl.AclPermission.RESET_PASSWORD_USERS;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@Slf4j
@RequiredArgsConstructor
@ChangeUnit(order = "023", id = "populate-default-domain-id-in-user-management-roles")
public class Migration023PopulateDefaultDomainIdInUserManagementRoles {

    private final MongoTemplate mongoTemplate;

    private static final int migrationRetries = 5;
    private static final String migrationId = "populate-default-domain-id-in-user-management-roles";
    private static final String migrationNote = "This will not have any adverse effects on the Data. Restarting the "
            + "server will begin the migration from where it left.";

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void populateDefaultDomainIdInUserManagementRoles() {
        Criteria criteriaUserManagementRolesWithMigrationFlag022Set = Criteria.where(
                        Migration022TagUserManagementRolesWithoutDefaultDomainTypeAndId
                                .MIGRATION_FLAG_022_TAG_USER_MANAGEMENT_ROLE_WITHOUT_DEFAULT_DOMAIN_TYPE_AND_ID)
                .exists(true);
        Query queryUserManagementRolesWithWithMigrationFlag022Set =
                new Query(criteriaUserManagementRolesWithMigrationFlag022Set);
        queryUserManagementRolesWithWithMigrationFlag022Set
                .fields()
                .include(fieldName(QPermissionGroup.permissionGroup.id));
        long countOfUserManagementRolesWithMigrationFlag022Set =
                mongoTemplate.count(queryUserManagementRolesWithWithMigrationFlag022Set, PermissionGroup.class);
        int attempt = 0;

        while (countOfUserManagementRolesWithMigrationFlag022Set > 0 && attempt < migrationRetries) {
            Query queryOptimisedUserManagementRolesWithDefaultDomainIdDoesNotExist =
                    CompatibilityUtils.optimizeQueryForNoCursorTimeout(
                            mongoTemplate, queryUserManagementRolesWithWithMigrationFlag022Set, PermissionGroup.class);

            mongoTemplate.stream(
                            queryOptimisedUserManagementRolesWithDefaultDomainIdDoesNotExist, PermissionGroup.class)
                    .forEach(userManagementRole -> {
                        Criteria criteriaResetPasswordPermission = Criteria.where(fieldName(QUser.user.policies))
                                .elemMatch(Criteria.where("permissionGroups")
                                        .in(userManagementRole.getId())
                                        .and("permission")
                                        .is(RESET_PASSWORD_USERS.getValue()));
                        Query queryUserWithResetPasswordPermission = new Query(criteriaResetPasswordPermission);
                        queryUserWithResetPasswordPermission.fields().include(fieldName(QUser.user.id));
                        User user = mongoTemplate.findOne(queryUserWithResetPasswordPermission, User.class);
                        Update updateDefaultDomainIdOfUserManagementRole = new Update();
                        updateDefaultDomainIdOfUserManagementRole.set(
                                fieldName(QPermissionGroup.permissionGroup.defaultDomainId), user.getId());
                        updateDefaultDomainIdOfUserManagementRole.set(
                                fieldName(QPermissionGroup.permissionGroup.defaultDomainType),
                                User.class.getSimpleName());
                        updateDefaultDomainIdOfUserManagementRole.unset(
                                Migration022TagUserManagementRolesWithoutDefaultDomainTypeAndId
                                        .MIGRATION_FLAG_022_TAG_USER_MANAGEMENT_ROLE_WITHOUT_DEFAULT_DOMAIN_TYPE_AND_ID);

                        Criteria criteriaUserManagementRoleById = Criteria.where(
                                        fieldName(QPermissionGroup.permissionGroup.id))
                                .is(userManagementRole.getId());
                        Query queryUserManagementRoleById = new Query(criteriaUserManagementRoleById);
                        mongoTemplate.updateFirst(
                                queryUserManagementRoleById,
                                updateDefaultDomainIdOfUserManagementRole,
                                PermissionGroup.class);
                    });
            countOfUserManagementRolesWithMigrationFlag022Set =
                    mongoTemplate.count(queryUserManagementRolesWithWithMigrationFlag022Set, PermissionGroup.class);
            attempt += 1;
        }

        if (countOfUserManagementRolesWithMigrationFlag022Set != 0) {
            String reasonForFailure = "All user management roles were not tagged.";
            throw new AppsmithException(AppsmithError.MIGRATION_FAILED, migrationId, reasonForFailure, migrationNote);
        }
    }
}
