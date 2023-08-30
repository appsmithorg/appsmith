package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QPermissionGroup;
import com.appsmith.server.domains.QUser;
import com.appsmith.server.domains.User;
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
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.notDeleted;

@Slf4j
@RequiredArgsConstructor
@ChangeUnit(order = "022", id = "tag-user-management-roles-without-default-domain-type-and-id")
public class Migration022TagUserManagementRolesWithoutDefaultDomainTypeAndId {
    private final MongoTemplate mongoTemplate;

    public static final String MIGRATION_FLAG_022_TAG_USER_MANAGEMENT_ROLE_WITHOUT_DEFAULT_DOMAIN_TYPE_AND_ID =
            "tagUserManagementRoleWithoutDefaultDomainTypeAndId";

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void tagUserManagementRolesWithoutDefaultDomainTypeAndId() {
        Query queryExistingUsers = new Query().addCriteria(notDeleted());
        queryExistingUsers.fields().include(fieldName(QUser.user.policies));

        List<User> existingUsers = mongoTemplate.find(queryExistingUsers, User.class);

        /*
         * At the moment, RESET_PASSWORD_USERS policy for the user resource only contains 1 permission group ID, i.e.
         * the ID of user management role for that user resource. Hence, we pick the ID present at the 0th index below.
         */
        Set<String> userManagementRoleIds = new HashSet<>();
        existingUsers.forEach(existingUser -> {
            Optional<List<String>> roleWithResetPasswordPermissionOptional = existingUser.getPolicies().stream()
                    .filter(policy1 -> RESET_PASSWORD_USERS.getValue().equals(policy1.getPermission()))
                    .map(policy2 -> policy2.getPermissionGroups().stream().toList())
                    .findFirst();
            roleWithResetPasswordPermissionOptional.ifPresent(userManagementRoleId -> {
                userManagementRoleIds.add(userManagementRoleId.get(0));
            });
        });

        Criteria criteriaUserManagementRoleIds =
                Criteria.where(fieldName(QPermissionGroup.permissionGroup.id)).in(userManagementRoleIds);
        Criteria criteriaDefaultDomainIdDoesNotExist = new Criteria()
                .orOperator(
                        Criteria.where(fieldName(QPermissionGroup.permissionGroup.defaultDomainId))
                                .isNull(),
                        Criteria.where(fieldName(QPermissionGroup.permissionGroup.defaultDomainId))
                                .exists(false));
        Criteria criteriaUserManagementRolesWithDefaultDomainIdDoesNotExist =
                new Criteria().andOperator(criteriaUserManagementRoleIds, criteriaDefaultDomainIdDoesNotExist);
        Query queryUserManagementRolesWithDefaultDomainIdDoesNotExist =
                new Query(criteriaUserManagementRolesWithDefaultDomainIdDoesNotExist);

        Update updateSetMigrationFlag = new Update();
        updateSetMigrationFlag.set(
                MIGRATION_FLAG_022_TAG_USER_MANAGEMENT_ROLE_WITHOUT_DEFAULT_DOMAIN_TYPE_AND_ID,
                User.class.getSimpleName());

        mongoTemplate.updateMulti(
                queryUserManagementRolesWithDefaultDomainIdDoesNotExist, updateSetMigrationFlag, PermissionGroup.class);
    }
}
