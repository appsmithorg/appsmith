package com.appsmith.server.migrations.db;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QActionCollection;
import com.appsmith.server.domains.QPermissionGroup;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.List;

import static com.appsmith.server.acl.AclPermission.DELETE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.notDeleted;

@Slf4j
@ChangeUnit(
        order = "021-ee-03",
        id = "update-action-collection-policies-where-default-developer-application-roles-exist",
        author = "")
public class Migration021EE03UpdateActionCollectionPoliciesWhereDefaultDeveloperApplicationRolesExist {
    private final MongoTemplate mongoTemplate;

    public Migration021EE03UpdateActionCollectionPoliciesWhereDefaultDeveloperApplicationRolesExist(
            MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void executionRollback() {}

    @Execution
    public void updatePoliciesForActionCollectionsWhereDefaultDeveloperApplicationRolesExist() {
        Query queryDefaultDeveloperApplicationRoles = queryAllDefaultDeveloperRoles();
        List<PermissionGroup> defaultDeveloperApplicationRoles =
                mongoTemplate.find(queryDefaultDeveloperApplicationRoles, PermissionGroup.class);

        defaultDeveloperApplicationRoles.forEach(defaultDeveloperApplicationRole -> {
            String roleId = defaultDeveloperApplicationRole.getId();
            String applicationId = defaultDeveloperApplicationRole.getDefaultDomainId();
            List<Criteria> criteriaListActionCollectionByApplicationId =
                    criteriaListAllActionCollectionsByApplicationId(applicationId);

            Update updateAddDefaultDeveloperRoleIdToAllActionCollectionPolicies = new Update();
            updateAddDefaultDeveloperRoleIdToAllActionCollectionPolicies.addToSet(
                    "policies.$[element].permissionGroups", roleId);
            updateAddDefaultDeveloperRoleIdToAllActionCollectionPolicies.filterArray(
                    Criteria.where("element.permission")
                            .in(READ_ACTIONS.getValue(), DELETE_ACTIONS.getValue(), MANAGE_ACTIONS.getValue()));

            Query queryAllActionCollectionsByApplicationId =
                    new Query(new Criteria().andOperator(criteriaListActionCollectionByApplicationId));
            mongoTemplate.updateMulti(
                    queryAllActionCollectionsByApplicationId,
                    updateAddDefaultDeveloperRoleIdToAllActionCollectionPolicies,
                    ActionCollection.class);
        });
    }

    private static List<Criteria> criteriaListAllActionCollectionsByApplicationId(String applicationId) {
        Criteria criteriaApplicationId = Criteria.where(fieldName(QActionCollection.actionCollection.applicationId))
                .is(applicationId);
        Criteria criteriaNotDeleted = notDeleted();
        return List.of(criteriaApplicationId, criteriaNotDeleted);
    }

    @NotNull private static Query queryAllDefaultDeveloperRoles() {
        Criteria criteriaDefaultDomainTypeApplication = Criteria.where(
                        fieldName(QPermissionGroup.permissionGroup.defaultDomainType))
                .is(Application.class.getSimpleName());
        Criteria criteriaNotDeleted = notDeleted();
        Criteria criteriaStartsWithDeveloper = Criteria.where(fieldName(QPermissionGroup.permissionGroup.name))
                .regex(FieldName.APPLICATION_DEVELOPER + "(.+)");
        Criteria allCriteria = new Criteria()
                .andOperator(criteriaNotDeleted, criteriaDefaultDomainTypeApplication, criteriaStartsWithDeveloper);
        return new Query(allCriteria);
    }
}
