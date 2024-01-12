package com.appsmith.server.migrations.db;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QPermissionGroup;
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
import org.springframework.data.mongodb.core.query.Criteria;
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

import static com.appsmith.server.acl.AclPermission.WORKSPACE_CREATE_PACKAGE;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_DELETE_PACKAGES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_EXPORT_PACKAGES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_MANAGE_PACKAGES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_PUBLISH_PACKAGES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_READ_PACKAGES;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.notDeleted;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@ChangeUnit(order = "043-ee-01", id = "add-default-permission-for-packages", author = "")
public class Migration043EE01AddPermissionsForPackages {

    private final MongoTemplate mongoTemplate;
    private static final String POLICIES = fieldName(QWorkspace.workspace.policies);
    private static final String ID = fieldName(QWorkspace.workspace.id);
    private static final String DEFAULT_PERMISSION_GROUPS = fieldName(QWorkspace.workspace.defaultPermissionGroups);

    public Migration043EE01AddPermissionsForPackages(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackMethod() {}

    @Execution
    public void addPermissionToWorkspaces() {

        updateWorkspacePolicies();
    }

    private void updateWorkspacePolicies() {

        Map<Boolean, Set<PermissionGroup>> pgMaps = populateMapsOfWorkspaceToPermissionGroupIds();

        Set<String> globalAdminIds =
                pgMaps.get(true).stream().map(PermissionGroup::getId).collect(Collectors.toSet());
        Set<String> globalDevIds =
                pgMaps.get(false).stream().map(PermissionGroup::getId).collect(Collectors.toSet());

        BulkOperations ops = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, Workspace.class);

        FindIterable<Document> documents = mongoTemplate
                .getCollection("workspace")
                .find(new Document(Map.of("deleted", false, "deletedAt", Map.of("$exists", false))))
                .projection(new Document(Map.of(ID, 1, POLICIES, 1, DEFAULT_PERMISSION_GROUPS, 1)))
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

                Set<String> defaultPermissionGroupsSet = dbWorkspace.getDefaultPermissionGroups();

                if (CollectionUtils.isNullOrEmpty(defaultPermissionGroupsSet)) {
                    log.debug(
                            "workspace with workspaceId: {} has no default permissionGroup associated with it, "
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

                Set<String> devAndAdminIds = new HashSet<>();
                Set<String> adminIds = new HashSet<>();

                Optional<String> devIdOptional = defaultPermissionGroupsSet.stream()
                        .filter(globalDevIds::contains)
                        .findFirst();
                Optional<String> adminIdOptional = defaultPermissionGroupsSet.stream()
                        .filter(globalAdminIds::contains)
                        .findFirst();

                devIdOptional.ifPresent(devAndAdminIds::add);
                adminIdOptional.ifPresent(devAndAdminIds::add);
                adminIdOptional.ifPresent(adminIds::add);

                Set<Policy> workspacePolicies = createWorkspacePolicies(devAndAdminIds, adminIds);

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

    private boolean checkWorkspaceHasPackagePolicies(Workspace workspace) {
        // This flag is to check that if workspace already has policies with below-mentioned permissions.
        // We can be sure that existence or these permissions are atomic.
        Set<String> policies =
                workspace.getPolicies().stream().map(Policy::getPermission).collect(Collectors.toSet());

        Set<String> permissions = Set.of(
                WORKSPACE_READ_PACKAGES.getValue(),
                WORKSPACE_EXPORT_PACKAGES.getValue(),
                WORKSPACE_DELETE_PACKAGES.getValue(),
                WORKSPACE_MANAGE_PACKAGES.getValue(),
                WORKSPACE_CREATE_PACKAGE.getValue(),
                WORKSPACE_PUBLISH_PACKAGES.getValue());

        return policies.containsAll(permissions);
    }

    private Set<Policy> createWorkspacePolicies(Set<String> devAndAdminIds, Set<String> adminIds) {
        Set<Policy> policies = new HashSet<>();
        if (!devAndAdminIds.isEmpty()) {
            policies = Set.of(
                            WORKSPACE_READ_PACKAGES,
                            WORKSPACE_DELETE_PACKAGES,
                            WORKSPACE_MANAGE_PACKAGES,
                            WORKSPACE_CREATE_PACKAGE,
                            WORKSPACE_PUBLISH_PACKAGES)
                    .stream()
                    .map(aclPermission -> Policy.builder()
                            .permission(aclPermission.getValue())
                            .permissionGroups(devAndAdminIds)
                            .build())
                    .collect(Collectors.toCollection(HashSet::new));
        }

        if (!adminIds.isEmpty()) {
            Policy exportPackagesPolicy = Policy.builder()
                    .permission(WORKSPACE_EXPORT_PACKAGES.getValue())
                    .permissionGroups(adminIds)
                    .build();

            policies.add(exportPackagesPolicy);
        }

        return policies;
    }

    /**
     * This method populates both maps of workspaceIds to all permission groups which have been introduced
     * as app-level sharing. These permissions are app's app-viewer & app's developer
     *
     * @return
     */
    private Map<Boolean, Set<PermissionGroup>> populateMapsOfWorkspaceToPermissionGroupIds() {
        // Fetch all workspace permissions across the board
        Criteria workspacePermissionGroupsCriteria = new Criteria()
                .andOperator(
                        notDeleted(),
                        Criteria.where(fieldName(QPermissionGroup.permissionGroup.defaultDomainType))
                                .is("Workspace"));

        Query workspacePermissionGroupsQuery = new Query().addCriteria(workspacePermissionGroupsCriteria);
        workspacePermissionGroupsQuery
                .fields()
                .include(
                        ID,
                        fieldName(QPermissionGroup.permissionGroup.name),
                        fieldName(QPermissionGroup.permissionGroup.defaultDomainId));

        List<PermissionGroup> workspacePermissionGroups =
                mongoTemplate.find(workspacePermissionGroupsQuery, PermissionGroup.class);

        Set<PermissionGroup> permissionGroups = workspacePermissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith("Administrator")
                        || permissionGroup.getName().startsWith("Developer"))
                .collect(Collectors.toSet());

        return permissionGroups.stream()
                .collect(Collectors.partitioningBy(
                        permissionGroup -> permissionGroup.getName().startsWith("Administrator"), Collectors.toSet()));
    }
}
