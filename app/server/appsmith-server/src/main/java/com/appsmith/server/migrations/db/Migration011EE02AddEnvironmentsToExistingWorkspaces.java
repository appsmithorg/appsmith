package com.appsmith.server.migrations.db;

import com.appsmith.external.constants.CommonFieldName;
import com.appsmith.external.models.Environment;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.migrations.CompatibilityUtils;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@Slf4j
@ChangeUnit(order = "011-ee-02", id = "adding-default-environments-to-existing-workspaces", author = " ")
public class Migration011EE02AddEnvironmentsToExistingWorkspaces {
    private final MongoTemplate mongoTemplate;
    private static final String migrationFlag = "hasEnvironments";

    public Migration011EE02AddEnvironmentsToExistingWorkspaces(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void executionRollback() {}

    @Execution
    public void executeMigration() {
        Query query = new Query()
                .cursorBatchSize(1024)
                .addCriteria(where(migrationFlag).is(false));

        final Query performanceOptimizedQuery =
                CompatibilityUtils.optimizeQueryForNoCursorTimeout(mongoTemplate, query, Workspace.class);

        mongoTemplate.stream(performanceOptimizedQuery, Workspace.class).forEach(workspace -> {
            // what if we don't have default permission group for some workspace,
            // it will not be an addressable workspace
            if (CollectionUtils.isNullOrEmpty(workspace.getDefaultPermissionGroups())) {
                return;
            }
            log.debug("creating environments for the workspace with workspace id: {}", workspace.getId());
            List<String> defaultPermissionGroupIds =
                    workspace.getDefaultPermissionGroups().stream().toList();
            List<PermissionGroup> permissionGroups = mongoTemplate.find(
                    query(where(PermissionGroup.Fields.id).in(defaultPermissionGroupIds)), PermissionGroup.class);

            if (CollectionUtils.isNullOrEmpty(permissionGroups)) {
                log.debug(
                        "workspace with workspaceId: {} has no default permissionGroup associated with it, "
                                + "skipping environment addition",
                        workspace.getId());
                return;
            }

            Set<String> permissionGroupIds = permissionGroups.parallelStream()
                    .map(permissionGroup -> permissionGroup.getId())
                    .collect(Collectors.toSet());

            Set<String> permissionGroupIdsWithoutAppViewer = permissionGroups.parallelStream()
                    .filter(permissionGroup -> !permissionGroup.getName().startsWith("App Viewer"))
                    .map(permissionGroup -> permissionGroup.getId())
                    .collect(Collectors.toSet());

            Policy policies = Policy.builder()
                    .permission(AclPermission.EXECUTE_ENVIRONMENTS.getValue())
                    .permissionGroups(permissionGroupIds)
                    .build();

            Policy policiesWithoutAppViewer = Policy.builder()
                    .permission(AclPermission.EXECUTE_ENVIRONMENTS.getValue())
                    .permissionGroups(permissionGroupIdsWithoutAppViewer)
                    .build();

            Environment productionEnvironment =
                    new Environment(workspace.getId(), CommonFieldName.PRODUCTION_ENVIRONMENT);
            productionEnvironment.setPolicies(Set.of(policies));

            Environment stagingEnvironment = new Environment(workspace.getId(), CommonFieldName.STAGING_ENVIRONMENT);
            stagingEnvironment.setPolicies(Set.of(policiesWithoutAppViewer));

            List.of(productionEnvironment, stagingEnvironment).parallelStream().forEach(environment -> {
                try {
                    log.debug(
                            "saving the environment: {} on thread: {}",
                            environment.getName(),
                            Thread.currentThread().getName());
                    mongoTemplate.save(environment);
                } catch (DuplicateKeyException e) {
                    log.debug(
                            "{} environment already present in workspace: {}",
                            environment.getName(),
                            workspace.getName());
                }
            });

            mongoTemplate.updateFirst(
                    new Query().addCriteria(where(Workspace.Fields.id).is(workspace.getId())),
                    new Update().set(migrationFlag, true),
                    Workspace.class);
        });
    }
}
