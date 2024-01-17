package com.appsmith.server.migrations.db;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.QWorkspace;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.CollectionUtils;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCursor;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.data.mongodb.core.BulkOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.util.Pair;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.WORKSPACE_CREATE_PACKAGE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_DATASOURCE_CREATE_DATASOURCE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_READ_PACKAGE_INSTANCES;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@ChangeUnit(order = "043-ee-03", id = "add-create-instance-permission-for-ws-packages", author = "")
public class Migration043EE03AddCreateInstancePermissionsForWorkspacePackages {

    private final MongoTemplate mongoTemplate;
    private static final String POLICIES = fieldName(QWorkspace.workspace.policies);
    private static final String ID = fieldName(QWorkspace.workspace.id);

    public Migration043EE03AddCreateInstancePermissionsForWorkspacePackages(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackMethod() {}

    @Execution
    public void addPermissionToWorkspaces() {

        updateWorkspacePolicies();
    }

    private void updateWorkspacePolicies() {

        BulkOperations ops = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, Workspace.class);

        FindIterable<Document> documents = mongoTemplate
                .getCollection("workspace")
                .find(new Document(Map.of("deleted", false, "deletedAt", Map.of("$exists", false))))
                .projection(new Document(Map.of(ID, 1, POLICIES, 1)))
                .batchSize(1024);

        try (MongoCursor<Document> cursor = documents.cursor()) {
            List<Pair<Query, Update>> updateList = new ArrayList<>();
            while (cursor.hasNext()) {
                Document doc = cursor.next();

                Workspace dbWorkspace = mongoTemplate.getConverter().read(Workspace.class, doc);

                if (this.checkWorkspaceHasPackagePolicies(dbWorkspace)) {
                    log.debug(
                            "workspace with workspaceId: {} already has permissions associated with it, "
                                    + "skipping modules policy addition",
                            dbWorkspace.getId());
                    continue;
                }

                if (CollectionUtils.isNullOrEmpty(dbWorkspace.getPolicies())) {
                    log.debug(
                            "workspace with workspaceId: {} has no policies attached with it, skipping modules policy addition",
                            dbWorkspace.getId());
                    continue;
                }

                Set<Policy> workspacePolicies = createWorkspacePolicies(dbWorkspace.getPolicies());

                if (workspacePolicies.isEmpty()) {
                    log.debug(
                            "workspace with workspaceId: {} could not add any policies, skipping", dbWorkspace.getId());
                    continue;
                }

                Set<String> existingPermissions = dbWorkspace.getPolicies().stream()
                        .map(Policy::getPermission)
                        .collect(Collectors.toSet());

                Set<Policy> packagePolicies = workspacePolicies.stream()
                        .filter(policy -> !existingPermissions.contains(policy.getPermission()))
                        .collect(Collectors.toSet());

                dbWorkspace.getPolicies().addAll(packagePolicies);

                Query workspaceUpdateQuery = new Query()
                        .addCriteria(where(fieldName(QWorkspace.workspace.id)).is(dbWorkspace.getId()));
                Update workspaceUpdate = new Update().set(POLICIES, dbWorkspace.getPolicies());
                Pair<Query, Update> updatePair = Pair.of(workspaceUpdateQuery, workspaceUpdate);

                updateList.add(updatePair);

                if (cursor.available() == 0) {
                    ops.updateOne(updateList);
                    ops.execute();
                    ops = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, Workspace.class);
                    updateList = new ArrayList<>();
                }
            }
            if (!updateList.isEmpty()) {
                ops.updateOne(updateList);
                ops.execute();
            }
        }
    }

    private Set<Policy> createWorkspacePolicies(Set<Policy> existingPolicies) {
        Set<Policy> policies = new HashSet<>();
        if (!existingPolicies.isEmpty()) {
            Optional<Policy> policyOptional = existingPolicies.stream()
                    .filter(policy -> WORKSPACE_DATASOURCE_CREATE_DATASOURCE_ACTIONS
                            .getValue()
                            .equals(policy.getPermission()))
                    .findFirst();

            if (policyOptional.isPresent()) {
                policies = Set.of(WORKSPACE_READ_PACKAGE_INSTANCES, WORKSPACE_CREATE_PACKAGE_INSTANCES).stream()
                        .map(aclPermission -> Policy.builder()
                                .permission(aclPermission.getValue())
                                .permissionGroups(policyOptional.get().getPermissionGroups())
                                .build())
                        .collect(Collectors.toCollection(HashSet::new));
            }
        }

        return policies;
    }

    private boolean checkWorkspaceHasPackagePolicies(Workspace workspace) {
        // This flag is to check that if workspace already has policies with below-mentioned permissions.
        // We can be sure that existence or these permissions are atomic.
        Set<String> policies =
                workspace.getPolicies().stream().map(Policy::getPermission).collect(Collectors.toSet());

        Set<String> permissions =
                Set.of(WORKSPACE_CREATE_PACKAGE_INSTANCES.getValue(), WORKSPACE_READ_PACKAGE_INSTANCES.getValue());

        return policies.containsAll(permissions);
    }
}
