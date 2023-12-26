package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.QBaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QApplication;
import com.appsmith.server.domains.QPermissionGroup;
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
import org.springframework.util.CollectionUtils;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.ce.FieldNameCE.ADMINISTRATOR;
import static com.appsmith.server.constants.ce.FieldNameCE.DEVELOPER;
import static com.appsmith.server.migrations.db.ce.Migration041TagWorkspacesForGitOperationsPermissionMigration.MIGRATION_FLAG_WORKSPACE_WITHOUT_GIT_PERMISSIONS;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@Slf4j
@ChangeUnit(order = "042", id = "add-permissions-for-git-operations", author = " ")
public class Migration042AddPermissionsForGitOperations {

    private final MongoTemplate mongoTemplate;
    private static final String policiesFieldPath = fieldName(QBaseDomain.baseDomain.policies);
    private static final String idFieldPath = fieldName(QBaseDomain.baseDomain.id);
    private static final String workspaceIdFieldPath = fieldName(QApplication.application.workspaceId);
    private static final String defaultPermissionGroupsFieldPath =
            fieldName(QWorkspace.workspace.defaultPermissionGroups);

    public Migration042AddPermissionsForGitOperations(MongoTemplate mongoTemplate) {
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

        int batchSize = 7;
        List<Workspace> workspaceList;

        do {
            // get workspaces which are not deleted and are tagged for migration
            Criteria criteria = Criteria.where(MIGRATION_FLAG_WORKSPACE_WITHOUT_GIT_PERMISSIONS)
                    .exists(true);
            Query selectWorkspacesQuery = Query.query(criteria).limit(batchSize);
            // we only need the default permission groups
            selectWorkspacesQuery.fields().include(defaultPermissionGroupsFieldPath);

            // fetch the workspaes with the above criteria
            workspaceList = mongoTemplate.find(selectWorkspacesQuery, Workspace.class);

            workspaceList.stream().parallel().forEach(this::migrateAppliationsInWorkspace);
        } while (!CollectionUtils.isEmpty(workspaceList));
    }

    private void migrateAppliationsInWorkspace(Workspace workspace) {
        // get the default permission groups for this workspace
        Set<String> defaultPermissionGroups = workspace.getDefaultPermissionGroups();
        Query permissionGroupsQuery = new Query(Criteria.where(idFieldPath).in(defaultPermissionGroups));
        permissionGroupsQuery.fields().include(fieldName(QPermissionGroup.permissionGroup.name));

        List<PermissionGroup> permissionGroups = mongoTemplate.find(permissionGroupsQuery, PermissionGroup.class);

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

        applicationList.stream().parallel().forEach(application -> {
            migrateApplication(application, adminAndDeveloperPermissionGroupIds);
        });

        // all the applications of this workspace have been migrated, unset the flag for this workspace
        Update update = new Update();
        update.unset(MIGRATION_FLAG_WORKSPACE_WITHOUT_GIT_PERMISSIONS);

        Query updateWorkspaceQuery = Query.query(Criteria.where(idFieldPath).is(workspace.getId()));
        mongoTemplate.updateFirst(updateWorkspaceQuery, update, Workspace.class);
    }

    private void migrateApplication(Application application, Set<String> permissionGroupIds) {
        // add a new policy for git permissions and allow adminAndDeveloperPermissionGroupIds
        addGitPoliciesToPolicySet(application.getPolicies(), permissionGroupIds);

        // update the application object
        Update update = new Update();
        update.set(policiesFieldPath, application.getPolicies());

        Query updateQuery = Query.query(Criteria.where(idFieldPath).is(application.getId()));
        mongoTemplate.updateFirst(updateQuery, update, Application.class);
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
