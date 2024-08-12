package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Workspace;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.Optional;

import static com.appsmith.server.migrations.constants.DeprecatedFieldName.POLICIES;
import static com.appsmith.server.migrations.constants.FieldName.POLICY_MAP;
import static com.appsmith.server.migrations.utils.CompatibilityUtils.optimizeQueryForNoCursorTimeout;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@Slf4j
@RequiredArgsConstructor
@ChangeUnit(order = "025", id = "remove-unassign-permission-from-workspace-dev-viewer-roles")
public class Migration025RemoveUnassignPermissionFromUnnecessaryRoles {

    private final MongoTemplate mongoTemplate;

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void executeMigration() {

        // Fetch all default workspace roles except administrators
        Criteria workspaceDeveloperAndAppViewerRolesCriteria = new Criteria()
                .andOperator(
                        Criteria.where("defaultDomainType").is(Workspace.class.getSimpleName()),
                        Criteria.where("name").not().regex("^Administrator - .*"));

        Query queryInterestingPermissionGroups = new Query(workspaceDeveloperAndAppViewerRolesCriteria);
        queryInterestingPermissionGroups.fields().include("id");
        queryInterestingPermissionGroups.fields().include(POLICIES, POLICY_MAP);

        Query optimizedQueryForInterestingPermissionGroups =
                optimizeQueryForNoCursorTimeout(mongoTemplate, queryInterestingPermissionGroups, PermissionGroup.class);

        mongoTemplate.stream(optimizedQueryForInterestingPermissionGroups, PermissionGroup.class)
                .forEach(permissionGroup -> {
                    Optional<Policy> optionalUnassignPolicy = permissionGroup.getPolicies().stream()
                            .filter(policy -> policy.getPermission().equals("unassign:permissionGroups"))
                            .findFirst();

                    if (!optionalUnassignPolicy.isPresent()) {
                        return;
                    }

                    Policy unAssignPolicy = optionalUnassignPolicy.get();
                    unAssignPolicy.getPermissionGroups().remove(permissionGroup.getId());

                    mongoTemplate.updateFirst(
                            query(where(PermissionGroup.Fields.id).is(permissionGroup.getId())),
                            new Update().set(POLICIES, permissionGroup.getPolicies()),
                            PermissionGroup.class);
                });
    }
}
