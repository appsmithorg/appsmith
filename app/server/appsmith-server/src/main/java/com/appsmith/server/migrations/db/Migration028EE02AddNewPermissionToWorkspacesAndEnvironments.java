package com.appsmith.server.migrations.db;

import com.appsmith.external.models.Environment;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.QEnvironment;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QApplication;
import com.appsmith.server.domains.QPermissionGroup;
import com.appsmith.server.domains.QWorkspace;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.migrations.CompatibilityUtils;
import com.appsmith.server.migrations.MigrationHelperMethods;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.migrations.db.Migration028EE01AddMigrationFlagForCustomEnvironment.CUSTOM_ENVIRONMENT_MIGRATION_FLAG;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

/**
 * This migration adds new permissions
 * WORKSPACE_CREATE_ENVIRONMENT, WORKSPACE_DELETE_ENVIRONMENTS, WORKSPACE_MANAGE_ENVIRONMENTS, WORKSPACE_READ_ENVIRONMENTS,
 * and WORKSPACE_EXECUTE_ENVIRONMENTS to existing workspaces based on policy graph
 * This migration also adds new permissions MANAGE_ENVIRONMENTS, READ_ENVIRONMENTS to existing environments.
 * For the purpose of back-filling policies default and app share permissionGroups  are getting used.
 * i.e.  WORKSPACE_READ_ENVIRONMENTS inherits from READ_WORKSPACES, in this inheritance instead of copying actual set of Ids,
 * we would only use default ones.
 */
@Slf4j
@ChangeUnit(order = "028-ee-02", id = "add-new-environment-perm-to-workspace", author = " ")
public class Migration028EE02AddNewPermissionToWorkspacesAndEnvironments {

    private final MongoTemplate mongoTemplate;
    private static final String POLICIES = fieldName(QWorkspace.workspace.policies);
    private static final String ID = fieldName(QWorkspace.workspace.id);
    private static final String DEFAULT_PERMISSION_GROUPS = fieldName(QWorkspace.workspace.defaultPermissionGroups);

    public Migration028EE02AddNewPermissionToWorkspacesAndEnvironments(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackMethod() {}

    @Execution
    public void addPermissionToWorkspacesAndEnvironments() {

        Map<String, Set<String>> workspaceToPermissionGroupIdMap = getMapOfWorkspaceToAppSharePermissionGroupIds();

        Query query = new Query().cursorBatchSize(1024).addCriteria(getWorkspaceCriteria());
        query.fields().include(ID, POLICIES, DEFAULT_PERMISSION_GROUPS);

        final Query performanceOptimizedQuery =
                CompatibilityUtils.optimizeQueryForNoCursorTimeout(mongoTemplate, query, Workspace.class);

        mongoTemplate.stream(performanceOptimizedQuery, Workspace.class).forEach(dbWorkspace -> {
            Set<String> defaultPermissionGroupsSet = dbWorkspace.getDefaultPermissionGroups();

            if (CollectionUtils.isNullOrEmpty(defaultPermissionGroupsSet)) {
                log.debug(
                        "workspace with workspaceId: {} has no default permissionGroup associated with it, "
                                + "skipping environment addition",
                        dbWorkspace.getId());
                return;
            }

            if (CollectionUtils.isNullOrEmpty(dbWorkspace.getPolicies())) {
                log.debug(
                        "workspace with workspaceId: {} has no policies attached with it, skipping policy addition",
                        dbWorkspace.getId());
                return;
            }

            List<String> defaultPermissionGroupIds =
                    defaultPermissionGroupsSet.stream().toList();

            List<PermissionGroup> permissionGroups = mongoTemplate.find(
                    query(where(fieldName(QPermissionGroup.permissionGroup.id)).in(defaultPermissionGroupIds)),
                    PermissionGroup.class);

            if (CollectionUtils.isNullOrEmpty(permissionGroups)) {
                log.debug(
                        "workspace with workspaceId: {} has no default permissionGroup found associated with it, "
                                + "skipping environment addition",
                        dbWorkspace.getId());
                return;
            }

            Set<String> permissionGroupIds = permissionGroups.parallelStream()
                    .map(permissionGroup -> permissionGroup.getId())
                    .collect(Collectors.toSet());

            Set<String> adminAndDeveloperPermissionGroupIds = permissionGroups.parallelStream()
                    .filter(permissionGroup -> !permissionGroup.getName().startsWith("App Viewer"))
                    .map(permissionGroup -> permissionGroup.getId())
                    .collect(Collectors.toSet());

            // create new policies
            Policy workspaceCreateEnvironmentPolicy =
                    getWorkspaceCreateEnvironmentPolicy(adminAndDeveloperPermissionGroupIds);
            Policy workspaceDeleteEnvironmentsPolicy =
                    getWorkspaceDeleteEnvironmentsPolicy(adminAndDeveloperPermissionGroupIds);
            Policy workspaceMangeEnvironmentsPolicy =
                    getWorkspaceManageEnvironmentsPolicy(adminAndDeveloperPermissionGroupIds);

            // WORKSPACE_READ_ENVIRONMENTS AND WORKSPACE_EXECUTE_ENVIRONMENTS Permissions inherits from lateral
            // READ_WORKSPACE Permission
            // When we share an application, the workspace adds a new permission group to a policy with permission
            // READ_WORKSPACES
            // Hence those application level permission will also be required for the above two
            Set<String> appLevelSharePermissionGroupIds = workspaceToPermissionGroupIdMap.get(dbWorkspace.getId());

            if (CollectionUtils.isNullOrEmpty(appLevelSharePermissionGroupIds)) {
                appLevelSharePermissionGroupIds = new HashSet<>();
            }

            Policy workspaceReadEnvironmentsPolicy =
                    getWorkspaceReadEnvironmentsPolicy(permissionGroupIds, appLevelSharePermissionGroupIds);
            Policy workspaceExecuteEnvironmentsPolicy =
                    getWorkspaceExecuteEnvironmentsPolicy(permissionGroupIds, appLevelSharePermissionGroupIds);

            // add the policies in existing policies for workspaces
            dbWorkspace
                    .getPolicies()
                    .addAll(Set.of(
                            workspaceCreateEnvironmentPolicy,
                            workspaceDeleteEnvironmentsPolicy,
                            workspaceMangeEnvironmentsPolicy,
                            workspaceReadEnvironmentsPolicy,
                            workspaceExecuteEnvironmentsPolicy));

            Query workspaceUpdateQuery = new Query()
                    .addCriteria(where(fieldName(QWorkspace.workspace.id)).is(dbWorkspace.getId()));
            Update workspaceUpdate =
                    new Update().set(POLICIES, dbWorkspace.getPolicies()).unset(CUSTOM_ENVIRONMENT_MIGRATION_FLAG);
            mongoTemplate.updateFirst(workspaceUpdateQuery, workspaceUpdate, Workspace.class);

            mongoTemplate.stream(
                            new Query().addCriteria(getEnvironmentCriteria(dbWorkspace.getId())), Environment.class)
                    .forEach(dbEnvironment -> {
                        if (CollectionUtils.isNullOrEmpty(dbEnvironment.getPolicies())) {
                            log.debug(
                                    "environment with environmentId: {} has no policies attached with it, skipping policy addition",
                                    dbEnvironment.getId());
                            return;
                        }

                        Policy manageEnvironmentsPolicy =
                                getManageEnvironmentsPolicy(adminAndDeveloperPermissionGroupIds);
                        Policy deleteEnvironmentsPolicy =
                                getDeleteEnvironmentPolicy(adminAndDeveloperPermissionGroupIds);
                        dbEnvironment.getPolicies().addAll(Set.of(manageEnvironmentsPolicy, deleteEnvironmentsPolicy));

                        Query environmentQuery = new Query()
                                .addCriteria(where(fieldName(QEnvironment.environment.id))
                                        .is(dbEnvironment.getId()));
                        Update environmentUpdate = new Update()
                                .set(POLICIES, dbWorkspace.getPolicies())
                                .unset(CUSTOM_ENVIRONMENT_MIGRATION_FLAG);
                        mongoTemplate.updateFirst(environmentQuery, environmentUpdate, Environment.class);
                    });
        });
    }

    private static Criteria getWorkspaceCriteria() {
        return Criteria.where(CUSTOM_ENVIRONMENT_MIGRATION_FLAG).is(false);
    }

    private static Criteria getEnvironmentCriteria(String workspaceId) {
        return Criteria.where(fieldName(QEnvironment.environment.workspaceId)).is(workspaceId);
    }

    private static Policy getWorkspaceCreateEnvironmentPolicy(Set<String> adminAndDeveloperPermissionGroupId) {
        return Policy.builder()
                .permission(AclPermission.WORKSPACE_CREATE_ENVIRONMENT.getValue())
                .permissionGroups(adminAndDeveloperPermissionGroupId)
                .build();
    }

    private static Policy getWorkspaceDeleteEnvironmentsPolicy(Set<String> adminAndDeveloperPermissionGroupId) {
        // same as WORKSPACE_CREATE_ENVIRONMENT

        return Policy.builder()
                .permission(AclPermission.WORKSPACE_DELETE_ENVIRONMENTS.getValue())
                .permissionGroups(adminAndDeveloperPermissionGroupId)
                .build();
    }

    private static Policy getWorkspaceManageEnvironmentsPolicy(Set<String> adminAndDeveloperPermissionGroupId) {

        return Policy.builder()
                .permission(AclPermission.WORKSPACE_MANAGE_ENVIRONMENTS.getValue())
                .permissionGroups(adminAndDeveloperPermissionGroupId)
                .build();
    }

    private static Policy getWorkspaceReadEnvironmentsPolicy(
            Set<String> defaultPermissionGroupIds, Set<String> appShareLevelPermissionGroupIds) {
        // this inherits permission from WORKSPACE_CREATE_ENVIRONMENT, WORKSPACE_DELETE_ENVIRONMENTS,
        // WORKSPACE_DELETE_ENVIRONMENTS and READ_WORKSPACES

        Set<String> permissionGroupSet = new HashSet<>();
        permissionGroupSet.addAll(defaultPermissionGroupIds);
        permissionGroupSet.addAll(appShareLevelPermissionGroupIds);
        return Policy.builder()
                .permission(AclPermission.WORKSPACE_READ_ENVIRONMENTS.getValue())
                .permissionGroups(permissionGroupSet)
                .build();
    }

    private static Policy getWorkspaceExecuteEnvironmentsPolicy(
            Set<String> defaultPermissionGroupIds, Set<String> appShareLevelPermissionGroupIds) {
        // WORKSPACE_EXECUTE_ENVIRONMENTS inherits from all the default groups similar to WORKSPACE_READ_ENVIRONMENTS

        Set<String> permissionGroupSet = new HashSet<>();
        permissionGroupSet.addAll(defaultPermissionGroupIds);
        permissionGroupSet.addAll(appShareLevelPermissionGroupIds);

        return Policy.builder()
                .permission(AclPermission.WORKSPACE_EXECUTE_ENVIRONMENTS.getValue())
                .permissionGroups(permissionGroupSet)
                .build();
    }

    private static Policy getManageEnvironmentsPolicy(Set<String> adminAndDeveloperPermissionGroupId) {
        // Inherited directly from WORKSPACE_MANAGE_ENVIRONMENTS so will have admin and developer permission only
        return Policy.builder()
                .permission(AclPermission.MANAGE_ENVIRONMENTS.getValue())
                .permissionGroups(adminAndDeveloperPermissionGroupId)
                .build();
    }

    private static Policy getDeleteEnvironmentPolicy(Set<String> adminAndDeveloperPermissionGroupId) {
        // Inherited directly from WORKSPACE_DELETE_ENVIRONMENTS so will have admin and developer permission only
        return Policy.builder()
                .permission(AclPermission.DELETE_ENVIRONMENTS.getValue())
                .permissionGroups(adminAndDeveloperPermissionGroupId)
                .build();
    }

    /**
     *  This method provides a map of workspaceIds to all permission groups which have been introduced as app level sharing
     * @return Map<String, Set<String>>
     */
    private Map<String, Set<String>> getMapOfWorkspaceToAppSharePermissionGroupIds() {
        // Fetch all app viewer permissions across the board
        Criteria appLevelPermissionGroupsCriteria = new Criteria()
                .andOperator(
                        MigrationHelperMethods.notDeleted(),
                        Criteria.where(fieldName(QPermissionGroup.permissionGroup.defaultDomainType))
                                .is("Application"));

        Query appLevelPermissionGroupsQuery = new Query().addCriteria(appLevelPermissionGroupsCriteria);
        appLevelPermissionGroupsQuery
                .fields()
                .include(
                        ID,
                        fieldName(QPermissionGroup.permissionGroup.name),
                        fieldName(QPermissionGroup.permissionGroup.defaultDomainId));

        List<PermissionGroup> appLevelPermissionGroups =
                mongoTemplate.find(appLevelPermissionGroupsQuery, PermissionGroup.class);

        Set<PermissionGroup> appSharePermissionGroupIds = appLevelPermissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith("App Viewer")
                        || permissionGroup.getName().startsWith("Developer"))
                .collect(Collectors.toSet());

        Map<String, Set<String>> appIdToPermissionGroupIdsMap = appSharePermissionGroupIds.stream()
                .collect(Collectors.toMap(
                        PermissionGroup::getDefaultDomainId,
                        permissionGroup -> {
                            String id = permissionGroup.getId();
                            HashSet<String> set = new HashSet<>();
                            set.add(id);
                            return set;
                        },
                        (a, b) -> {
                            a.addAll(b);
                            return a;
                        }));

        // Get list of all applications with app specific roles and their workspace ids
        Query fetchApplicationWorkspaceIdsQuery = new Query()
                .addCriteria(new Criteria()
                        .andOperator(
                                MigrationHelperMethods.notDeleted(),
                                Criteria.where(fieldName(QApplication.application.id))
                                        .in(appIdToPermissionGroupIdsMap.keySet())));
        fetchApplicationWorkspaceIdsQuery.fields().include(fieldName(QApplication.application.workspaceId));

        final Query performanceOptimizedApplicationQuery = CompatibilityUtils.optimizeQueryForNoCursorTimeout(
                mongoTemplate, fetchApplicationWorkspaceIdsQuery, Application.class);

        Map<String, Set<String>> workspaceToPermissionGroupIdsMap = mongoTemplate.stream(
                        performanceOptimizedApplicationQuery, Application.class)
                .collect(Collectors.toMap(
                        application -> application.getWorkspaceId(),
                        application -> appIdToPermissionGroupIdsMap.get(application.getId()),
                        (a, b) -> {
                            a.addAll(b);
                            return a;
                        }));

        return workspaceToPermissionGroupIdsMap;
    }
}
