package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.QBaseDomain;
import com.appsmith.server.domains.PermissionGroup;
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

import java.util.List;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@Slf4j
@RequiredArgsConstructor
@ChangeUnit(order = "030", id = "tag-users-with-no-user-management-roles")
public class Migration030TagUsersWithNoUserManagementRoles {

    private final MongoTemplate mongoTemplate;

    public static final String MIGRATION_FLAG_030_TAG_USER_WITHOUT_USER_MANAGEMENT_ROLE =
            "tagUserWithoutUserManagementRole";

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void tagUsersWithNoUserManagementRoles() {
        Criteria criteriaDefaultDomainTypeExists =
                Criteria.where("defaultDomainType").exists(true);
        Criteria criteriaDefaultDomainTypeIsUser =
                Criteria.where("defaultDomainType").is(User.class.getSimpleName());

        Criteria criteriaUserManagementRoles =
                new Criteria().andOperator(criteriaDefaultDomainTypeExists, criteriaDefaultDomainTypeIsUser);
        Query queryUserManagementRoles = new Query(criteriaUserManagementRoles);
        queryUserManagementRoles.fields().include("defaultDomainId");

        List<PermissionGroup> userManagementRoles = mongoTemplate.find(queryUserManagementRoles, PermissionGroup.class);

        List<String> userIdsWithUserManagementRoles = userManagementRoles.stream()
                .map(PermissionGroup::getDefaultDomainId)
                .toList();

        Criteria criteriaUsersWithNoUserManagementRoles =
                Criteria.where(fieldName(QBaseDomain.baseDomain.id)).nin(userIdsWithUserManagementRoles);
        Criteria criteriaUsersPoliciesExists =
                Criteria.where(fieldName(QBaseDomain.baseDomain.policies)).exists(true);
        Criteria criteriaUsersPoliciesNotEmpty =
                Criteria.where(fieldName(QBaseDomain.baseDomain.policies)).not().size(0);
        Criteria criteriaUsersWithNoUserManagementRolesAndUserPoliciesExists = new Criteria()
                .andOperator(
                        criteriaUsersWithNoUserManagementRoles,
                        criteriaUsersPoliciesExists,
                        criteriaUsersPoliciesNotEmpty);
        Query queryUsersWithNoUserManagementRoles =
                new Query(criteriaUsersWithNoUserManagementRolesAndUserPoliciesExists);

        Update updateSetMigrationFlag = new Update();
        updateSetMigrationFlag.set(MIGRATION_FLAG_030_TAG_USER_WITHOUT_USER_MANAGEMENT_ROLE, Boolean.TRUE);

        mongoTemplate.updateMulti(queryUsersWithNoUserManagementRoles, updateSetMigrationFlag, User.class);
    }
}
