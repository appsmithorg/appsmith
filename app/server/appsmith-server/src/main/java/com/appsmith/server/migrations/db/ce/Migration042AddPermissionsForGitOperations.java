package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Workspace;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.BulkOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.ce.FieldNameCE.ADMINISTRATOR;
import static com.appsmith.server.constants.ce.FieldNameCE.DEVELOPER;
import static com.appsmith.server.migrations.db.ce.Migration041TagWorkspacesForGitOperationsPermissionMigration.MIGRATION_FLAG_TAG_WITHOUT_GIT_PERMISSIONS;

@Slf4j
@ChangeUnit(order = "042", id = "add-permissions-for-git-operations", author = " ")
public class Migration042AddPermissionsForGitOperations {

    private final MongoTemplate mongoTemplate;
    private static final String policiesFieldPath = BaseDomain.Fields.policies;
    private static final String idFieldPath = BaseDomain.Fields.id;
    private static final String workspaceIdFieldPath = Application.Fields.workspaceId;
    private static final String defaultPermissionGroupsFieldPath = Workspace.Fields.defaultPermissionGroups;

    public Migration042AddPermissionsForGitOperations(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * mandatory to declare, but we don't have a use-case for this yet.
     */
    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void addPermissionForGitOperationsToExistingApplications() {
        /*
        This will set the new policies to the application which is not already migrated.
         1. Get all workspaces in batches that has migration flag set
         2. For each application under that workspace
         3. Generate a new policy for the permission groups and permissions
         4. Add the new policy for git permissions to the application.policies
         5. Unset the flag for the workspace and save when all the applications are migrated
        */
        int batchSize = 5000;
        List<Workspace> workspaceList;

        do {
            // get workspaces which are tagged for migration and has defaultPermissionGroups fields
            Criteria criteria = Criteria.where(MIGRATION_FLAG_TAG_WITHOUT_GIT_PERMISSIONS)
                    .exists(true)
                    .and(defaultPermissionGroupsFieldPath)
                    .exists(true);
            Query selectWorkspacesQuery = new Query(criteria);
            selectWorkspacesQuery.limit(batchSize);

            // project the defaultPermissionGroups field only
            selectWorkspacesQuery.fields().include(defaultPermissionGroupsFieldPath);

            // fetch the workspaes with the above criteria
            workspaceList = mongoTemplate.find(selectWorkspacesQuery, Workspace.class);
            final List<String> workspaceIdList = new ArrayList<>();

            if (workspaceList.size() > 0) {
                BulkOperations bulkApplicationMigrations =
                        mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, Application.class);
                BulkOperations bulkWorkspaceMigrations =
                        mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, Workspace.class);

                workspaceList.parallelStream().forEach(workspace -> {
                    addNewPoliciesToWorkspaceApplications(workspace, bulkApplicationMigrations);
                    synchronized (workspaceIdList) {
                        workspaceIdList.add(workspace.getId());
                    }
                });

                // add update multi operation to unset flag from the workspaces
                unsetMigrationFlagFromWorkspace(workspaceIdList, bulkWorkspaceMigrations);

                // execute the bulk operations if we've at least one workspace
                bulkApplicationMigrations.execute();
                bulkWorkspaceMigrations.execute();
            }
        } while (!CollectionUtils.isEmpty(workspaceList));
    }

    private void unsetMigrationFlagFromWorkspace(List<String> workspaceIds, BulkOperations bulkWorkspaceOperations) {
        // all the applications of this workspace have been migrated, unset the flag for this workspace
        Update update = new Update();
        update.unset(MIGRATION_FLAG_TAG_WITHOUT_GIT_PERMISSIONS);

        Query updateWorkspaceQuery = Query.query(Criteria.where(idFieldPath).in(workspaceIds));
        bulkWorkspaceOperations.updateMulti(updateWorkspaceQuery, update);
    }

    private Set<String> getPermissionGroupsForNewPermissions(Workspace workspace) {
        Set<String> defaultPermissionGroups = workspace.getDefaultPermissionGroups();
        Query permissionGroupsQuery = new Query(Criteria.where(idFieldPath).in(defaultPermissionGroups));
        permissionGroupsQuery.fields().include(PermissionGroup.Fields.name);

        List<PermissionGroup> permissionGroups = mongoTemplate.find(permissionGroupsQuery, PermissionGroup.class);

        return permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR)
                        || permissionGroup.getName().startsWith(DEVELOPER))
                .map(BaseDomain::getId)
                .collect(Collectors.toSet());
    }

    private void addNewPoliciesToWorkspaceApplications(Workspace workspace, BulkOperations bulkOperations) {
        Set<String> groupsForNewPermissions = getPermissionGroupsForNewPermissions(workspace);

        Policy connectGitPolicy = Policy.builder()
                .permission(AclPermission.CONNECT_TO_GIT.getValue())
                .permissionGroups(groupsForNewPermissions)
                .build();

        Policy manageDefaultBranchPolicy = Policy.builder()
                .permission(AclPermission.MANAGE_DEFAULT_BRANCHES.getValue())
                .permissionGroups(groupsForNewPermissions)
                .build();

        Policy manageProtectedBranchPolicy = Policy.builder()
                .permission(AclPermission.MANAGE_PROTECTED_BRANCHES.getValue())
                .permissionGroups(groupsForNewPermissions)
                .build();

        Policy mangeAutoCommitPolicy = Policy.builder()
                .permission(AclPermission.MANAGE_AUTO_COMMIT.getValue())
                .permissionGroups(groupsForNewPermissions)
                .build();

        // applications that are in this workspace and not migrated yet
        Criteria criteria = Criteria.where(workspaceIdFieldPath)
                .is(workspace.getId())
                .and(MIGRATION_FLAG_TAG_WITHOUT_GIT_PERMISSIONS)
                .exists(true);

        Query updateApplicationsQuery = new Query(criteria);
        Update update = new Update();
        // unset the flag so that new policies are not added again
        update.unset(MIGRATION_FLAG_TAG_WITHOUT_GIT_PERMISSIONS);
        // push these new 4 policies to end of the policies
        update.push(policiesFieldPath)
                .each(connectGitPolicy, manageDefaultBranchPolicy, manageProtectedBranchPolicy, mangeAutoCommitPolicy);

        addUpdateApplicationsQueryToBulkOperations(updateApplicationsQuery, update, bulkOperations);
    }

    private synchronized void addUpdateApplicationsQueryToBulkOperations(
            Query query, Update update, BulkOperations bulkOperations) {
        bulkOperations.updateMulti(query, update);
    }
}
