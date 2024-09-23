package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.CollectionUtils;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.RESET_PASSWORD_USERS;
import static com.appsmith.server.migrations.constants.DeprecatedFieldName.POLICIES;
import static com.appsmith.server.migrations.constants.FieldName.POLICY_MAP;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.notDeleted;

@Slf4j
@RequiredArgsConstructor
@ChangeUnit(order = "028", id = "tag-user-management-roles-without-default-domain-type-and-id")
public class Migration028TagUserManagementRolesWithoutDefaultDomainTypeAndId {
    private final MongoTemplate mongoTemplate;
    public static final String MIGRATION_FLAG_028_TAG_USER_MANAGEMENT_ROLE_WITHOUT_DEFAULT_DOMAIN_TYPE_AND_ID =
            "tagUserManagementRoleWithoutDefaultDomainTypeAndId";

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void tagUserManagementRolesWithoutDefaultDomainTypeAndId() {
        Criteria resetPasswordPolicyExistsAndNotDeleted = Criteria.where("policies.permission")
                .is(RESET_PASSWORD_USERS.getValue())
                .andOperator(notDeleted());
        Query queryExistingUsersWithResetPasswordPolicy = new Query(resetPasswordPolicyExistsAndNotDeleted);
        queryExistingUsersWithResetPasswordPolicy.fields().include(POLICIES, POLICY_MAP);

        List<User> existingUsers = mongoTemplate.find(queryExistingUsersWithResetPasswordPolicy, User.class);

        /*
         * At the moment, RESET_PASSWORD_USERS policy for the user resource only contains 1 permission group ID, i.e.
         * the ID of user management role for that user resource. Hence, we pick the ID present at the 0th index below.
         */
        Set<String> userManagementRoleIds = new HashSet<>();
        existingUsers.forEach(existingUser -> {
            Set<Policy> policies = existingUser.getPolicies() == null ? Set.of() : existingUser.getPolicies();
            Optional<Policy> resetPasswordPolicyOptional = policies.stream()
                    .filter(policy1 -> RESET_PASSWORD_USERS.getValue().equals(policy1.getPermission()))
                    .findFirst();
            resetPasswordPolicyOptional.ifPresent(resetPasswordPolicy -> {
                List<String> roleIdList =
                        resetPasswordPolicy.getPermissionGroups().stream().toList();
                if (!CollectionUtils.isNullOrEmpty(roleIdList)) {
                    userManagementRoleIds.add(roleIdList.get(0));
                }
            });
        });

        Criteria criteriaUserManagementRoleIds =
                Criteria.where(PermissionGroup.Fields.id).in(userManagementRoleIds);
        Criteria criteriaDefaultDomainIdDoesNotExist = new Criteria()
                .orOperator(
                        Criteria.where(PermissionGroup.Fields.defaultDomainId).isNull(),
                        Criteria.where(PermissionGroup.Fields.defaultDomainId).exists(false));
        Criteria criteriaUserManagementRolesWithDefaultDomainIdDoesNotExist =
                new Criteria().andOperator(criteriaUserManagementRoleIds, criteriaDefaultDomainIdDoesNotExist);
        Query queryUserManagementRolesWithDefaultDomainIdDoesNotExist =
                new Query(criteriaUserManagementRolesWithDefaultDomainIdDoesNotExist);

        Update updateSetMigrationFlag = new Update();
        updateSetMigrationFlag.set(
                MIGRATION_FLAG_028_TAG_USER_MANAGEMENT_ROLE_WITHOUT_DEFAULT_DOMAIN_TYPE_AND_ID, Boolean.TRUE);

        mongoTemplate.updateMulti(
                queryUserManagementRolesWithDefaultDomainIdDoesNotExist, updateSetMigrationFlag, PermissionGroup.class);
    }
}
