package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.QBaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QApplication;
import com.appsmith.server.domains.QWorkspace;
import com.appsmith.server.domains.Workspace;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.ce.FieldNameCE.ADMINISTRATOR;
import static com.appsmith.server.constants.ce.FieldNameCE.DEVELOPER;
import static com.appsmith.server.migrations.db.ce.Migration040TagWorkspacesForGitOperationsPermissionMigration.MIGRATION_FLAG_WORKSPACE_WITHOUT_GIT_PERMISSIONS;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@Slf4j
@ChangeUnit(order = "041", id = "add-permissions-for-git-operations", author = " ")
public class Migration041AddPermissionsForGitOperations {

    private final MongoTemplate mongoTemplate;

    public Migration041AddPermissionsForGitOperations(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * mandatory to declare, but we don't have a use-case for this yet.
     */
    @RollbackExecution
    public void rollbackExecution() {}

    // @Execution
    public void dummy() {}

    @Execution
    public void addPermissionForGitOperationsToExistingApplications() {
        /*
        This will set the new policies to the application which is not already migrated.
         1. Get all workspaces in batches that has migration flag set
         2. For each application under that workspace
         3. Generate a new policy for the permission groups and permissions
         4. Add the new policy for git permissions to set of application.policies and save application
         5. Unset the flag for the workspace and save when all the applications are migrated
        */
        String policiesFieldPath = fieldName(QBaseDomain.baseDomain.policies);
        String idFieldPath = fieldName(QBaseDomain.baseDomain.id);
        String workspaceIdFieldPath = fieldName(QApplication.application.workspaceId);
        String defaultPermissionGroupsFieldPath = fieldName(QWorkspace.workspace.defaultPermissionGroups);

        int batchSize = 10000, updatedCount = 0, updatedCountInCurrentBatch;

        do {
            // get workspaces which are not deleted and are tagged for migration
            Criteria criteria = Criteria.where(MIGRATION_FLAG_WORKSPACE_WITHOUT_GIT_PERMISSIONS)
                    .exists(true);
            Query selectWorkspacesQuery = Query.query(criteria).limit(batchSize);
            selectWorkspacesQuery.skip(updatedCount);
            selectWorkspacesQuery.fields().include(defaultPermissionGroupsFieldPath); // we only need the policies

            // fetch the workspaes with the above criteria
            List<Workspace> workspaceList = mongoTemplate.find(selectWorkspacesQuery, Workspace.class);
            updatedCountInCurrentBatch = 0;

            for (Workspace workspace : workspaceList) {
                updatedCount++;
                updatedCountInCurrentBatch++;

                // get the default permission groups for this workspace
                Set<String> defaultPermissionGroups = workspace.getDefaultPermissionGroups();
                Query permissionGroupsQuery =
                        new Query(Criteria.where(idFieldPath).in(defaultPermissionGroups));
                List<PermissionGroup> permissionGroups =
                        mongoTemplate.find(permissionGroupsQuery, PermissionGroup.class);

                Set<String> adminAndDeveloperPermissionGroupIds = permissionGroups.stream()
                        .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR)
                                || permissionGroup.getName().startsWith(DEVELOPER))
                        .map(BaseDomain::getId)
                        .collect(Collectors.toSet());

                // fetch all the applications under this workspace
                Query selectApplicationQuery = Query.query(Criteria.where(FieldName.DELETED_AT)
                        .exists(false)
                        .and(workspaceIdFieldPath)
                        .is(workspace.getId()));
                selectApplicationQuery.fields().include(policiesFieldPath); // we only need the policies

                List<Application> applicationList = mongoTemplate.find(selectApplicationQuery, Application.class);
                for (Application application : applicationList) {
                    // add a new policy for git permissions and allow adminAndDeveloperPermissionGroupIds
                    addGitPoliciesToPolicySet(application.getPolicies(), adminAndDeveloperPermissionGroupIds);

                    // update the application object
                    Update update = new Update();
                    update.set(policiesFieldPath, application.getPolicies());

                    Query updateQuery = Query.query(Criteria.where(idFieldPath).is(application.getId()));
                    mongoTemplate.updateFirst(updateQuery, update, Application.class);
                }

                // all the applications of this workspace have been migrated, unset the flag for this workspace
                Update update = new Update();
                update.unset(MIGRATION_FLAG_WORKSPACE_WITHOUT_GIT_PERMISSIONS);

                Query updateWorkspaceQuery =
                        Query.query(Criteria.where(idFieldPath).is(workspace.getId()));
                mongoTemplate.updateFirst(updateWorkspaceQuery, update, Workspace.class);
            }
        } while (updatedCountInCurrentBatch == batchSize);
    }

    private void addGitPoliciesToPolicySet(Set<Policy> policies, Set<String> permissionGroups) {
        List<String> existingPermissions =
                policies.stream().map(Policy::getPermission).collect(Collectors.toList());

        if (!existingPermissions.contains(AclPermission.CONNECT_TO_GIT.getValue())) {
            policies.add(Policy.builder()
                    .permission(AclPermission.CONNECT_TO_GIT.getValue())
                    .permissionGroups(permissionGroups)
                    .build());
        }

        if (!existingPermissions.contains(AclPermission.MANAGE_DEFAULT_BRANCHES.getValue())) {
            policies.add(Policy.builder()
                    .permission(AclPermission.MANAGE_DEFAULT_BRANCHES.getValue())
                    .permissionGroups(permissionGroups)
                    .build());
        }

        if (!existingPermissions.contains(AclPermission.MANAGE_PROTECTED_BRANCHES.getValue())) {
            policies.add(Policy.builder()
                    .permission(AclPermission.MANAGE_PROTECTED_BRANCHES.getValue())
                    .permissionGroups(permissionGroups)
                    .build());
        }

        if (!existingPermissions.contains(AclPermission.MANAGE_AUTO_COMMIT.getValue())) {
            policies.add(Policy.builder()
                    .permission(AclPermission.MANAGE_AUTO_COMMIT.getValue())
                    .permissionGroups(permissionGroups)
                    .build());
        }
    }
}
