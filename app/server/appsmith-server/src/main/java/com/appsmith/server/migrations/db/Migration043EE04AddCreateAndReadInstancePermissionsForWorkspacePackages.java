package com.appsmith.server.migrations.db;

import com.appsmith.external.models.Policy;
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

import static com.appsmith.server.acl.AclPermission.WORKSPACE_CREATE_DATASOURCE;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_CREATE_PACKAGE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_DATASOURCE_CREATE_DATASOURCE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_READ_PACKAGE_INSTANCES;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@ChangeUnit(order = "043-ee-04", id = "add-create-read-instance-permission-for-ws-packages", author = "")
public class Migration043EE04AddCreateAndReadInstancePermissionsForWorkspacePackages {

    private final MongoTemplate mongoTemplate;
    private static final String POLICIES = Workspace.Fields.policies;
    private static final String ID = Workspace.Fields.id;
    private static final String DEFAULT_PERMISSION_GROUPS = Workspace.Fields.defaultPermissionGroups;

    public Migration043EE04AddCreateAndReadInstancePermissionsForWorkspacePackages(MongoTemplate mongoTemplate) {
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
                .projection(new Document(Map.of(ID, 1, DEFAULT_PERMISSION_GROUPS, 1, POLICIES, 1)))
                .batchSize(4096);

        try (MongoCursor<Document> cursor = documents.cursor()) {
            List<Pair<Query, Update>> updateList = new ArrayList<>();
            while (cursor.hasNext()) {
                Document doc = cursor.next();

                Workspace dbWorkspace = mongoTemplate.getConverter().read(Workspace.class, doc);

                if (CollectionUtils.isNullOrEmpty(dbWorkspace.getPolicies())) {
                    log.debug(
                            "workspace with workspaceId: {} has no policies attached with it, skipping modules policy addition",
                            dbWorkspace.getId());
                    continue;
                }

                Set<Policy> toBeAddedPolicies = createWorkspacePolicies(dbWorkspace);

                if (toBeAddedPolicies.isEmpty()) {
                    log.debug(
                            "workspace with workspaceId: {} could not add any policies, skipping", dbWorkspace.getId());
                    continue;
                }

                Set<String> toBeAddedPermissions =
                        toBeAddedPolicies.stream().map(Policy::getPermission).collect(Collectors.toSet());

                Set<Policy> allWorkspacePolicies = dbWorkspace.getPolicies().stream()
                        .filter(policy -> !toBeAddedPermissions.contains(policy.getPermission()))
                        .collect(Collectors.toSet());

                allWorkspacePolicies.addAll(toBeAddedPolicies);
                dbWorkspace.setPolicies(allWorkspacePolicies);

                Query workspaceUpdateQuery =
                        new Query().addCriteria(where(Workspace.Fields.id).is(dbWorkspace.getId()));
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

    private Set<Policy> createWorkspacePolicies(Workspace dbWorkspace) {
        Set<Policy> policies = new HashSet<>();

        Set<Policy> existingPolicies = dbWorkspace.getPolicies();

        Optional<Policy> createDatasourcePermissionSet = existingPolicies.stream()
                .filter(policy -> WORKSPACE_CREATE_DATASOURCE.getValue().equals(policy.getPermission()))
                .findFirst();

        Set<String> requiredPermissionGroups = new HashSet<>();
        if (dbWorkspace.getDefaultPermissionGroups() != null && createDatasourcePermissionSet.isPresent()) {
            requiredPermissionGroups.addAll(dbWorkspace.getDefaultPermissionGroups());
            requiredPermissionGroups.retainAll(
                    createDatasourcePermissionSet.get().getPermissionGroups());
        }

        if (!existingPolicies.isEmpty()) {
            Optional<Policy> policyOptional = existingPolicies.stream()
                    .filter(policy -> WORKSPACE_DATASOURCE_CREATE_DATASOURCE_ACTIONS
                            .getValue()
                            .equals(policy.getPermission()))
                    .findFirst();

            policies = Set.of(WORKSPACE_READ_PACKAGE_INSTANCES, WORKSPACE_CREATE_PACKAGE_INSTANCES).stream()
                    .map(aclPermission -> {
                        policyOptional.ifPresent(
                                policy -> requiredPermissionGroups.addAll(policy.getPermissionGroups()));
                        return Policy.builder()
                                .permission(aclPermission.getValue())
                                .permissionGroups(requiredPermissionGroups)
                                .build();
                    })
                    .collect(Collectors.toCollection(HashSet::new));
        }

        return policies;
    }
}
