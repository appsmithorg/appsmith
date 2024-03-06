package com.appsmith.server.migrations.db;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Workspace;
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

import java.util.List;
import java.util.Optional;

@Slf4j
@RequiredArgsConstructor
@ChangeUnit(order = "025-ee-01", id = "remove-unassign-permission-from-application-default-roles")
public class Migration025EE01RemoveUnassignPermissionFromApplicationDefaultRoles {

    private final MongoTemplate mongoTemplate;

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void executeMigration() {

        Criteria criteriaApplicationRoles = Criteria.where("defaultDomainType").is(Application.class.getSimpleName());
        Query queryApplicationRoles = new Query(criteriaApplicationRoles);
        queryApplicationRoles.fields().include("id", "policies");

        Query optimisedQueryApplicationRoles = CompatibilityUtils.optimizeQueryForNoCursorTimeout(
                mongoTemplate, queryApplicationRoles, PermissionGroup.class);

        mongoTemplate.stream(optimisedQueryApplicationRoles, PermissionGroup.class)
                .forEach(applicationRole -> {
                    Optional<Policy> optionalUnassignPolicy = applicationRole.getPolicies().stream()
                            .filter(policy -> policy.getPermission().equals("unassign:permissionGroups"))
                            .findFirst();

                    if (optionalUnassignPolicy.isEmpty()) {
                        return;
                    }

                    Policy unAssignPolicy = optionalUnassignPolicy.get();

                    Criteria criteriaWorkspaceRoles = new Criteria()
                            .andOperator(
                                    // Check for all the Permission Group IDs
                                    Criteria.where("id").in(unAssignPolicy.getPermissionGroups()),
                                    // Filter out all Workspace & Application Roles from which to remove the unassign
                                    // permission.
                                    Criteria.where("defaultDomainType")
                                            .in(Workspace.class.getSimpleName(), Application.class.getSimpleName()),
                                    // Exclude the Administrator Workspace role.
                                    Criteria.where("name").not().regex("^Administrator - .*"));
                    Query queryWorkspaceRoles = new Query(criteriaWorkspaceRoles);
                    queryWorkspaceRoles.fields().include("id");
                    queryWorkspaceRoles.fields().include("name");

                    List<PermissionGroup> workspaceRolesWithIds =
                            mongoTemplate.find(queryWorkspaceRoles, PermissionGroup.class);
                    workspaceRolesWithIds.forEach(workspaceRoleWithId ->
                            unAssignPolicy.getPermissionGroups().remove(workspaceRoleWithId.getId()));

                    Criteria criteriaApplicationRoleId = Criteria.where("id").is(applicationRole.getId());
                    Query queryApplicationRoleId = new Query(criteriaApplicationRoleId);
                    Update updateApplicationRolePolicies = new Update().set("policies", applicationRole.getPolicies());
                    mongoTemplate.updateFirst(
                            queryApplicationRoleId, updateApplicationRolePolicies, PermissionGroup.class);
                });
    }
}
