package com.appsmith.server.migrations.db;

import com.appsmith.external.constants.CommonFieldName;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Environment;
import com.appsmith.external.models.QDatasource;
import com.appsmith.external.models.QEnvironment;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QApplication;
import com.appsmith.server.domains.QConfig;
import com.appsmith.server.domains.QPermissionGroup;
import com.appsmith.server.domains.QWorkspace;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.migrations.CompatibilityUtils;
import com.google.common.collect.Sets;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
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
@ChangeUnit(order = "020-ee-07", id = "adding-all-custom-permission-groups-to-envs", author = " ")
public class Migration020EE07AddCustomPermissionGroupsToExistingEnvironments {
    private final MongoTemplate mongoTemplate;

    public Migration020EE07AddCustomPermissionGroupsToExistingEnvironments(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void executionRollback() {}

    @Execution
    public void executeMigration() {

        // First get the value of publicPermissionGroupId for this instance, this is anon user
        String publicPermissionGroupId = getPublicPermissionGroupId();

        // Fetch all app viewer permissions across the board
        Criteria appLevelPermissionGroupsCriteria = new Criteria()
                .andOperator(
                        olderCheckForDeletedCriteria(),
                        Criteria.where(fieldName(QPermissionGroup.permissionGroup.defaultDomainType))
                                .is("Application"));
        Query appLevelPermissionGroupsQuery = new Query().addCriteria(appLevelPermissionGroupsCriteria);
        appLevelPermissionGroupsQuery
                .fields()
                .include(
                        fieldName(QPermissionGroup.permissionGroup.id),
                        fieldName(QPermissionGroup.permissionGroup.name),
                        fieldName(QPermissionGroup.permissionGroup.defaultDomainId));

        List<PermissionGroup> appLevelPermissionGroups =
                mongoTemplate.find(appLevelPermissionGroupsQuery, PermissionGroup.class);

        Set<String> appViewerPermissionGroupIds = appLevelPermissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith("App Viewer"))
                .map(permissionGroup -> permissionGroup.getId())
                .collect(Collectors.toSet());

        Map<String, Set<String>> appIdToPermissionGroupIdsMap = appLevelPermissionGroups.stream()
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
        Criteria notDeletedCriteria =
                new Criteria().andOperator(olderCheckForDeletedCriteria(), newerCheckForDeletedCriteria());

        Query fetchApplicationWorkspaceIdsQuery = new Query()
                .addCriteria(new Criteria()
                        .andOperator(
                                notDeletedCriteria,
                                Criteria.where(fieldName(QApplication.application.id))
                                        .in(appIdToPermissionGroupIdsMap.keySet())));
        fetchApplicationWorkspaceIdsQuery.fields().include(fieldName(QApplication.application.workspaceId));

        final Query performanceOptimizedApplicationQuery = CompatibilityUtils.optimizeQueryForNoCursorTimeout(
                mongoTemplate, fetchApplicationWorkspaceIdsQuery, Application.class);

        Map<String, Set<String>> workspaceToAppLevelIdsMap = mongoTemplate.stream(
                        performanceOptimizedApplicationQuery, Application.class)
                .collect(Collectors.toMap(
                        application -> application.getWorkspaceId(),
                        application -> appIdToPermissionGroupIdsMap.get(application.getId()),
                        (a, b) -> {
                            a.addAll(b);
                            return a;
                        }));

        Map<String, Set<String>> workspaceToAppLevelWithoutViewerIdsMap = new HashMap<>();
        workspaceToAppLevelIdsMap.forEach((k, v) -> {
            HashSet<String> withoutViewerPermissionGroupIds = new HashSet<>(v);
            withoutViewerPermissionGroupIds.removeAll(appViewerPermissionGroupIds);
            workspaceToAppLevelWithoutViewerIdsMap.put(k, withoutViewerPermissionGroupIds);
        });

        // Get list of all workspaces and their default permission groups
        // This is admin, app dev and app viewer
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
        Map<String, Set<String>> workspaceIdToApplicablePermissionGroupIdsWithoutAppViewersMap =
                new ConcurrentHashMap<>();

        // For each workspace, pick the permissions that are part of workspace execute datasources
        // but are not a default permission group
        getWorkspacesToUpdateFromWorkspacePermissions(
                publicPermissionGroupId,
                workspaces,
                workspaceDefaultGroupsMap,
                appViewerPermissionGroupIds,
                workspaceIdToApplicablePermissionGroupIdsMap,
                workspaceIdToApplicablePermissionGroupIdsWithoutAppViewersMap);

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
                appViewerPermissionGroupIds,
                workspaceIdToApplicablePermissionGroupIdsMap,
                workspaceIdToApplicablePermissionGroupIdsWithoutAppViewersMap,
                performanceOptimizedDatasourceQuery);

        // For each workspace, add all these permission groups to the execute environment policy
        // Make sure that this is a distinct set
        workspaceIdToApplicablePermissionGroupIdsMap.forEach((workspaceId, customPermissionGroupIds) -> {
            if (workspaceToAppLevelIdsMap.get(workspaceId) != null) {
                customPermissionGroupIds.addAll(workspaceToAppLevelIdsMap.get(workspaceId));
            }
            // When executing with app viewer permission groups, update production environment
            Criteria applicableEnvironmentsCriteria = getApplicableEnvironmentsCriteria(workspaceId)
                    .and(fieldName(QEnvironment.environment.name))
                    .is(CommonFieldName.PRODUCTION_ENVIRONMENT);
            Query query = new Query().addCriteria(applicableEnvironmentsCriteria);

            Update environmentUpdateQuery =
                    new Update().addToSet("policies.$.permissionGroups").each(customPermissionGroupIds);

            mongoTemplate.updateMulti(query, environmentUpdateQuery, Environment.class);
        });

        workspaceIdToApplicablePermissionGroupIdsWithoutAppViewersMap.forEach(
                (workspaceId, customPermissionGroupIds) -> {
                    if (workspaceToAppLevelWithoutViewerIdsMap.get(workspaceId) != null) {
                        customPermissionGroupIds.addAll(workspaceToAppLevelWithoutViewerIdsMap.get(workspaceId));
                    }
                    // When executing without app viewer permission groups, update staging environment
                    Criteria applicableEnvironmentsCriteria = getApplicableEnvironmentsCriteria(workspaceId)
                            .and(fieldName(QEnvironment.environment.name))
                            .is(CommonFieldName.STAGING_ENVIRONMENT);
                    Query query = new Query().addCriteria(applicableEnvironmentsCriteria);

                    Update environmentUpdateQuery =
                            new Update().addToSet("policies.$.permissionGroups").each(customPermissionGroupIds);

                    mongoTemplate.updateMulti(query, environmentUpdateQuery, Environment.class);
                });
    }

    @NotNull private static Criteria getApplicableEnvironmentsCriteria(String workspaceId) {
        return new Criteria()
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
    }

    private void getWorkspacesToUpdateFromDatasourcePermissions(
            String publicPermissionGroupId,
            Map<String, Set<String>> workspaceDefaultGroupsMap,
            Set<String> appViewerPermissionGroupIds,
            Map<String, Set<String>> workspaceIdToApplicablePermissionGroupIdsMap,
            Map<String, Set<String>> workspaceIdToApplicablePermissionGroupIdsWithoutAppViewersMap,
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
                    Set<String> allCustomPermissionGroupIds =
                            workspaceIdToApplicablePermissionGroupIdsMap.get(datasource.getWorkspaceId());
                    Set<String> withoutAppViewerCustomPermissionGroupIds =
                            workspaceIdToApplicablePermissionGroupIdsWithoutAppViewersMap.get(
                                    datasource.getWorkspaceId());
                    boolean isNewSet = false;
                    if (allCustomPermissionGroupIds == null && withoutAppViewerCustomPermissionGroupIds == null) {
                        allCustomPermissionGroupIds = ConcurrentHashMap.newKeySet();
                        withoutAppViewerCustomPermissionGroupIds = ConcurrentHashMap.newKeySet();
                        isNewSet = true;
                    }

                    final Set<String> finalAllCustomPermissionGroupIds = allCustomPermissionGroupIds;
                    final Set<String> finalWithoutAppViewerCustomPermissionGroupIds =
                            withoutAppViewerCustomPermissionGroupIds;
                    datasource.getPolicies().stream()
                            .filter(policy ->
                                    AclPermission.EXECUTE_DATASOURCES.getValue().equals(policy.getPermission()))
                            .forEach(policy -> {
                                finalAllCustomPermissionGroupIds.addAll(policy.getPermissionGroups());
                                finalWithoutAppViewerCustomPermissionGroupIds.addAll(policy.getPermissionGroups());
                                appViewerPermissionGroupIds.forEach(
                                        finalWithoutAppViewerCustomPermissionGroupIds::remove);
                            });

                    if (isNewSet) {
                        workspaceIdToApplicablePermissionGroupIdsMap.merge(
                                datasource.getWorkspaceId(), finalAllCustomPermissionGroupIds, Sets::union);
                        workspaceIdToApplicablePermissionGroupIdsWithoutAppViewersMap.merge(
                                datasource.getWorkspaceId(),
                                finalWithoutAppViewerCustomPermissionGroupIds,
                                Sets::union);
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
            Set<String> appViewerPermissionGroupIds,
            Map<String, Set<String>> workspaceIdToApplicablePermissionGroupIdsMap,
            Map<String, Set<String>> workspaceIdToApplicablePermissionGroupIdsWithoutAppViewersMap) {
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
                    Set<String> allCustomPermissionGroupIds =
                            workspaceIdToApplicablePermissionGroupIdsMap.get(workspace.getId());
                    Set<String> withoutAppViewerCustomPermissionGroupIds =
                            workspaceIdToApplicablePermissionGroupIdsWithoutAppViewersMap.get(workspace.getId());
                    boolean isNewSet = false;
                    if (allCustomPermissionGroupIds == null && withoutAppViewerCustomPermissionGroupIds == null) {
                        allCustomPermissionGroupIds = ConcurrentHashMap.newKeySet();
                        withoutAppViewerCustomPermissionGroupIds = ConcurrentHashMap.newKeySet();
                        isNewSet = true;
                    }

                    final Set<String> finalAllCustomPermissionGroupIds = allCustomPermissionGroupIds;
                    final Set<String> finalWithoutAppViewerCustomPermissionGroupIds =
                            withoutAppViewerCustomPermissionGroupIds;
                    workspace.getPolicies().stream()
                            .filter(policy -> AclPermission.WORKSPACE_EXECUTE_DATASOURCES
                                    .getValue()
                                    .equals(policy.getPermission()))
                            .forEach(policy -> {
                                finalAllCustomPermissionGroupIds.addAll(policy.getPermissionGroups());
                                finalWithoutAppViewerCustomPermissionGroupIds.addAll(policy.getPermissionGroups());
                                appViewerPermissionGroupIds.forEach(
                                        finalWithoutAppViewerCustomPermissionGroupIds::remove);
                            });

                    if (isNewSet) {
                        workspaceIdToApplicablePermissionGroupIdsMap.merge(
                                workspace.getId(), finalAllCustomPermissionGroupIds, Sets::union);
                        workspaceIdToApplicablePermissionGroupIdsWithoutAppViewersMap.merge(
                                workspace.getId(), finalWithoutAppViewerCustomPermissionGroupIds, Sets::union);
                    }
                });
    }
}
