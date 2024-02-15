package com.appsmith.server.migrations.db;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.migrations.utils.CompatibilityUtils;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.notDeleted;

/**
 * Summary:
 * 1. This migration removes the unused permissions `read:workspaceWorkflows` and `resolve:workspaceWorkflows` from
 *    all the workspace policies.
 * 2. These permissions were added in the past to support the old workflow permissions model. However, they are no
 *    longer used and are not required.
 * 3. This migration will remove these permissions from all the workspace policies.
 */
@Slf4j
@ChangeUnit(order = "044-ee-01", id = "remove-unused-workflow-permission", author = "")
public class Migration044EE01RemoveUnusedWorkflowPermission {
    private final MongoTemplate mongoTemplate;
    private static final String WORKSPACE_READ_WORKFLOWS = "read:workspaceWorkflows";
    private static final String WORKSPACE_RESOLVE_WORKFLOWS = "resolve:workspaceWorkflows";

    private static final String fieldPermission = "policies.permission";
    private static final String fieldId = "id";
    private static final String fieldPolicies = "policies";

    public Migration044EE01RemoveUnusedWorkflowPermission(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackMethod() {}

    @Execution
    public void addPermissionToWorkspaces() {
        updateWorkspacePolicies();
    }

    /**
     * This method removes the unused permissions `read:workspaceWorkflows` and `resolve:workspaceWorkflows` from all the
     * workspace policies.
     */
    private void updateWorkspacePolicies() {
        Criteria criteriaWorkspaceReadWorkflows =
                Criteria.where(fieldPermission).is(WORKSPACE_READ_WORKFLOWS);
        Criteria criteriaWorkspaceResolveWorkflows =
                Criteria.where(fieldPermission).is(WORKSPACE_RESOLVE_WORKFLOWS);

        Criteria criteriaUnusedPermissions =
                new Criteria().orOperator(criteriaWorkspaceReadWorkflows, criteriaWorkspaceResolveWorkflows);
        Criteria criteriaUpdateWorkspacePolicies = new Criteria().andOperator(criteriaUnusedPermissions, notDeleted());

        Query queryUpdateWorkspacePolicies = new Query().addCriteria(criteriaUpdateWorkspacePolicies);
        queryUpdateWorkspacePolicies.fields().include(fieldId, fieldPolicies);
        Query optimisedQueryUpdateWorkspacePolicies = CompatibilityUtils.optimizeQueryForNoCursorTimeout(
                mongoTemplate, queryUpdateWorkspacePolicies, Workspace.class);

        mongoTemplate.stream(optimisedQueryUpdateWorkspacePolicies, Workspace.class)
                .forEach(workspace -> {
                    Set<Policy> originalPolicies = workspace.getPolicies();
                    Set<Policy> updatedPoliciesWithoutUnusedPermissions = originalPolicies.stream()
                            .filter(policy -> !isUnusedPermissionPolicy(policy))
                            .collect(Collectors.toSet());
                    Update updateWorkspace = new Update();
                    updateWorkspace.set(fieldPolicies, updatedPoliciesWithoutUnusedPermissions);
                    Query queryUpdateWorkspace =
                            new Query().addCriteria(Criteria.where(fieldId).is(workspace.getId()));
                    mongoTemplate.updateFirst(queryUpdateWorkspace, updateWorkspace, Workspace.class);
                });
    }

    private boolean isUnusedPermissionPolicy(Policy policy) {
        return WORKSPACE_READ_WORKFLOWS.equals(policy.getPermission())
                || WORKSPACE_RESOLVE_WORKFLOWS.equals(policy.getPermission());
    }
}
