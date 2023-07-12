package com.appsmith.server.migrations.db;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Environment;
import com.appsmith.external.models.QDatasource;
import com.appsmith.external.models.QEnvironment;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.QConfig;
import com.appsmith.server.domains.QWorkspace;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.migrations.CompatibilityUtils;
import com.google.common.collect.Sets;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.ce.FieldNameCE.PERMISSION_GROUP_ID;
import static com.appsmith.server.constants.ce.FieldNameCE.PUBLIC_PERMISSION_GROUP;
import static com.appsmith.server.migrations.solutions.DatasourceStorageMigrationSolution.newerCheckForDeletedCriteria;
import static com.appsmith.server.migrations.solutions.DatasourceStorageMigrationSolution.olderCheckForDeletedCriteria;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@Slf4j
@ChangeUnit(order = "112-ee", id = "adding-custom-permission-groups-to-envs", author = " ")
public class Migration112EEAddCustomPermissionGroupsToExistingEnvironments {
    private final MongoTemplate mongoTemplate;

    public Migration112EEAddCustomPermissionGroupsToExistingEnvironments(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void executionRollback() {}

    @Execution
    public void executeMigration() {

        // First get the value of publicPermissionGroupId for this instance
        String publicPermissionGroupId = getPublicPermissionGroupId();

        // Get list of all workspaces and their default permission groups
        Criteria notDeletedCriteria =
                new Criteria().andOperator(olderCheckForDeletedCriteria(), newerCheckForDeletedCriteria());

        Query fetchWorkspaceDefaultGroupsQuery = new Query().addCriteria(notDeletedCriteria);
        fetchWorkspaceDefaultGroupsQuery
                .fields()
                .include(
                        fieldName(QWorkspace.workspace.defaultPermissionGroups),
                        fieldName(QWorkspace.workspace.policies));

        final Query performanceOptimizedWorkspaceQuery = CompatibilityUtils.optimizeQueryForNoCursorTimeout(
                mongoTemplate, fetchWorkspaceDefaultGroupsQuery, Workspace.class);

        Set<Workspace> workspaces = mongoTemplate.stream(performanceOptimizedWorkspaceQuery, Workspace.class)
                .collect(Collectors.toSet());

        Map<String, Set<String>> workspaceDefaultGroupsMap = workspaces.stream()
                .collect(Collectors.toMap(
                        workspace -> workspace.getId(),
                        workspace ->
                                Objects.requireNonNullElseGet(workspace.getDefaultPermissionGroups(), HashSet::new)));

        Map<String, Set<String>> workspaceIdToApplicablePermissionGroupIdsMap = new ConcurrentHashMap<>();

        // For each workspace, pick the permissions that are part of workspace execute datasources
        // but are not a default permission group
        getWorkspacesToUpdateFromWorkspacePermissions(
                publicPermissionGroupId,
                workspaces,
                workspaceDefaultGroupsMap,
                workspaceIdToApplicablePermissionGroupIdsMap);

        // For each datasource, pick the permission groups that are part of execute datasources permission
        // but are not a default permission group
        Query fetchDatasourcesQuery = new Query()
                .addCriteria(notDeletedCriteria
                        .and(fieldName(QDatasource.datasource.workspaceId))
                        .exists(true));
        fetchDatasourcesQuery
                .fields()
                .include(fieldName(QDatasource.datasource.workspaceId), fieldName(QDatasource.datasource.policies));

        final Query performanceOptimizedDatasourceQuery = CompatibilityUtils.optimizeQueryForNoCursorTimeout(
                mongoTemplate, fetchDatasourcesQuery, Datasource.class);

        getWorkspacesToUpdateFromDatasourcePermissions(
                publicPermissionGroupId,
                workspaceDefaultGroupsMap,
                workspaceIdToApplicablePermissionGroupIdsMap,
                performanceOptimizedDatasourceQuery);

        // For each workspace, add all these permission groups to the execute environment policy
        // Make sure that this is a distinct set
        workspaceIdToApplicablePermissionGroupIdsMap.forEach((workspaceId, customPermissionGroupIds) -> {
            Criteria applicableEnvironmentsCriteria = new Criteria()
                    .andOperator(
                            olderCheckForDeletedCriteria(),
                            newerCheckForDeletedCriteria(),
                            Criteria.where(fieldName(QEnvironment.environment.workspaceId))
                                    .is(workspaceId),
                            Criteria.where(fieldName(QEnvironment.environment.policies))
                                    .elemMatch(new Criteria()
                                            .andOperator(Criteria.where("permission")
                                                    .is(AclPermission.EXECUTE_ENVIRONMENTS.getValue())))
                                    .and("policies.permissionGroups")
                                    .exists(true));
            Query applicableEnvironmentsQuery = new Query().addCriteria(applicableEnvironmentsCriteria);

            Update environmentUpdateQuery =
                    new Update().addToSet("policies.$.permissionGroups").each(customPermissionGroupIds);

            mongoTemplate.updateMulti(applicableEnvironmentsQuery, environmentUpdateQuery, Environment.class);
        });
    }

    private void getWorkspacesToUpdateFromDatasourcePermissions(
            String publicPermissionGroupId,
            Map<String, Set<String>> workspaceDefaultGroupsMap,
            Map<String, Set<String>> workspaceIdToApplicablePermissionGroupIdsMap,
            Query performanceOptimizedDatasourceQuery) {
        mongoTemplate.stream(performanceOptimizedDatasourceQuery, Datasource.class)
                .filter(datasource -> {
                    // We're trying to capture datasources that have
                    // execute policies for anything outside of default or anon roles
                    return datasource.getPolicies().stream().anyMatch(policy -> {
                        // First check if this policy is related to execute datasources
                        boolean isExecutePermission =
                                AclPermission.EXECUTE_DATASOURCES.getValue().equals(policy.getPermission());

                        if (isExecutePermission) {
                            // If it is, remove defaults and anon permissions from allocated permission groups
                            if (workspaceDefaultGroupsMap.containsKey(datasource.getWorkspaceId())) {
                                policy.getPermissionGroups()
                                        .removeAll(workspaceDefaultGroupsMap.get(datasource.getWorkspaceId()));
                            }
                            policy.getPermissionGroups().remove(publicPermissionGroupId);

                            // If there are still permissions left, environments in this workspace will be eligible
                            // For adding custom permission groups to them
                            return !policy.getPermissionGroups().isEmpty();
                        }
                        return false;
                    });
                })
                .forEach(datasource -> {
                    Set<String> customPermissionGroupIds =
                            workspaceIdToApplicablePermissionGroupIdsMap.get(datasource.getWorkspaceId());
                    boolean isNewSet = false;
                    if (customPermissionGroupIds == null) {
                        customPermissionGroupIds = ConcurrentHashMap.newKeySet();
                        isNewSet = true;
                    }

                    final Set<String> finalCustomPermissionGroupIds = customPermissionGroupIds;
                    datasource.getPolicies().stream()
                            .filter(policy ->
                                    AclPermission.EXECUTE_DATASOURCES.getValue().equals(policy.getPermission()))
                            .forEach(policy -> finalCustomPermissionGroupIds.addAll(policy.getPermissionGroups()));

                    if (isNewSet) {
                        workspaceIdToApplicablePermissionGroupIdsMap.merge(
                                datasource.getWorkspaceId(), finalCustomPermissionGroupIds, Sets::union);
                    }
                });
    }

    private String getPublicPermissionGroupId() {
        Criteria publicPermissionGroupCriterion =
                Criteria.where(fieldName(QConfig.config1.name)).is(PUBLIC_PERMISSION_GROUP);
        Query publicPermissionGroupQuery = new Query().addCriteria(publicPermissionGroupCriterion);
        Config publicPermissionGroupConfig = mongoTemplate.findOne(publicPermissionGroupQuery, Config.class);
        String publicPermissionGroupId = publicPermissionGroupConfig.getConfig().getAsString(PERMISSION_GROUP_ID);
        return publicPermissionGroupId;
    }

    private static void getWorkspacesToUpdateFromWorkspacePermissions(
            String publicPermissionGroupId,
            Set<Workspace> workspaces,
            Map<String, Set<String>> workspaceDefaultGroupsMap,
            Map<String, Set<String>> workspaceIdToApplicablePermissionGroupIdsMap) {
        workspaces.stream()
                .filter(workspace -> {
                    // We're trying to capture workspaces that have
                    // execute policies on datasources for anything outside of default or anon roles
                    return workspace.getPolicies().stream().anyMatch(policy -> {
                        // First check if this policy is related to execute workspace datasources
                        boolean isExecutePermission = AclPermission.WORKSPACE_EXECUTE_DATASOURCES
                                .getValue()
                                .equals(policy.getPermission());

                        if (isExecutePermission) {
                            // If it is, remove defaults and anon permissions from allocated permission groups
                            if (workspaceDefaultGroupsMap.containsKey(workspace.getId())) {
                                policy.getPermissionGroups()
                                        .removeAll(workspaceDefaultGroupsMap.get(workspace.getId()));
                            }
                            policy.getPermissionGroups().remove(publicPermissionGroupId);

                            // If there are still permissions left, environments in this workspace will be eligible
                            // For adding custom permission groups to them
                            return !policy.getPermissionGroups().isEmpty();
                        }
                        return false;
                    });
                })
                .forEach(workspace -> {
                    Set<String> customPermissionGroupIds =
                            workspaceIdToApplicablePermissionGroupIdsMap.get(workspace.getId());
                    boolean isNewSet = false;
                    if (customPermissionGroupIds == null) {
                        customPermissionGroupIds = ConcurrentHashMap.newKeySet();
                        isNewSet = true;
                    }

                    final Set<String> finalCustomPermissionGroupIds = customPermissionGroupIds;
                    workspace.getPolicies().stream()
                            .filter(policy -> AclPermission.WORKSPACE_EXECUTE_DATASOURCES
                                    .getValue()
                                    .equals(policy.getPermission()))
                            .forEach(policy -> finalCustomPermissionGroupIds.addAll(policy.getPermissionGroups()));

                    if (isNewSet) {
                        workspaceIdToApplicablePermissionGroupIdsMap.merge(
                                workspace.getId(), finalCustomPermissionGroupIds, Sets::union);
                    }
                });
    }
}
