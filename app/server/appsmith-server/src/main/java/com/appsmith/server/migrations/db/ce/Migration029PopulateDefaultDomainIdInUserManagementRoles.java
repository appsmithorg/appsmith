package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com.appsmith.server.acl.AclPermission.RESET_PASSWORD_USERS;
import static com.appsmith.server.migrations.constants.DeprecatedFieldName.POLICIES;
import static com.appsmith.server.migrations.constants.FieldName.POLICY_MAP;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.notDeleted;

@Slf4j
@RequiredArgsConstructor
@ChangeUnit(order = "029", id = "populate-default-domain-id-in-user-management-roles")
public class Migration029PopulateDefaultDomainIdInUserManagementRoles {

    private final MongoTemplate mongoTemplate;

    private static final int migrationRetries = 5;
    private static final String migrationId = "populate-default-domain-id-in-user-management-roles";
    private static final String migrationNote = "This will not have any adverse effects on the Data. Restarting the "
            + "server will begin the migration from where it left.";

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void populateDefaultDomainIdInUserManagementRoles() {
        Criteria resetPasswordPolicyExistsAndNotDeleted = Criteria.where("policies.permission")
                .is(RESET_PASSWORD_USERS.getValue())
                .andOperator(notDeleted());
        Query queryExistingUsersWithResetPasswordPolicy = new Query(resetPasswordPolicyExistsAndNotDeleted);
        queryExistingUsersWithResetPasswordPolicy.fields().include(POLICIES, POLICY_MAP);
        Map<String, String> userManagementRoleIdToUserIdMap = new HashMap<>();
        mongoTemplate.stream(queryExistingUsersWithResetPasswordPolicy, User.class)
                .forEach(existingUser -> {
                    Optional<Policy> resetPasswordPolicyOptional = existingUser.getPolicies().stream()
                            .filter(policy1 -> RESET_PASSWORD_USERS.getValue().equals(policy1.getPermission()))
                            .findFirst();
                    resetPasswordPolicyOptional.ifPresent(resetPasswordPolicy -> {
                        List<String> roleIdList = resetPasswordPolicy.getPermissionGroups().stream()
                                .toList();
                        roleIdList.forEach(roleId -> userManagementRoleIdToUserIdMap.put(roleId, existingUser.getId()));
                    });
                });

        Criteria criteriaUserManagementRolesWithMigrationFlag028Set = Criteria.where(
                        Migration028TagUserManagementRolesWithoutDefaultDomainTypeAndId
                                .MIGRATION_FLAG_028_TAG_USER_MANAGEMENT_ROLE_WITHOUT_DEFAULT_DOMAIN_TYPE_AND_ID)
                .exists(Boolean.TRUE);
        Query queryUserManagementRolesWithWithMigrationFlag028Set =
                new Query(criteriaUserManagementRolesWithMigrationFlag028Set);

        queryUserManagementRolesWithWithMigrationFlag028Set.fields().include(PermissionGroup.Fields.id);
        long countOfUserManagementRolesWithMigrationFlag028Set =
                mongoTemplate.count(queryUserManagementRolesWithWithMigrationFlag028Set, PermissionGroup.class);
        int attempt = 0;

        while (countOfUserManagementRolesWithMigrationFlag028Set > 0 && attempt < migrationRetries) {
            List<PermissionGroup> userManagementRolesWithMigrationFlag028Set =
                    mongoTemplate.find(queryUserManagementRolesWithWithMigrationFlag028Set, PermissionGroup.class);
            userManagementRolesWithMigrationFlag028Set.parallelStream().forEach(userManagementRole -> {
                if (userManagementRoleIdToUserIdMap.containsKey(userManagementRole.getId())
                        && StringUtils.isNotEmpty(userManagementRoleIdToUserIdMap.get(userManagementRole.getId()))) {
                    Criteria criteriaUserManagementRoleById =
                            Criteria.where(PermissionGroup.Fields.id).is(userManagementRole.getId());
                    Query queryUserManagementRoleById = new Query(criteriaUserManagementRoleById);
                    Update updateDefaultDomainIdOfUserManagementRole = new Update();

                    updateDefaultDomainIdOfUserManagementRole.set(
                            PermissionGroup.Fields.defaultDomainId,
                            userManagementRoleIdToUserIdMap.get(userManagementRole.getId()));

                    updateDefaultDomainIdOfUserManagementRole.set(
                            PermissionGroup.Fields.defaultDomainType, User.class.getSimpleName());

                    updateDefaultDomainIdOfUserManagementRole.unset(
                            Migration028TagUserManagementRolesWithoutDefaultDomainTypeAndId
                                    .MIGRATION_FLAG_028_TAG_USER_MANAGEMENT_ROLE_WITHOUT_DEFAULT_DOMAIN_TYPE_AND_ID);
                    mongoTemplate.updateFirst(
                            queryUserManagementRoleById,
                            updateDefaultDomainIdOfUserManagementRole,
                            PermissionGroup.class);
                }
            });
            countOfUserManagementRolesWithMigrationFlag028Set =
                    mongoTemplate.count(queryUserManagementRolesWithWithMigrationFlag028Set, PermissionGroup.class);
            attempt += 1;
        }

        if (countOfUserManagementRolesWithMigrationFlag028Set != 0) {
            String reasonForFailure = "All user management roles were not tagged.";
            throw new AppsmithException(AppsmithError.MIGRATION_FAILED, migrationId, reasonForFailure, migrationNote);
        }
    }
}
