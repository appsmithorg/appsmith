package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.Property;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.migrations.solutions.DatasourceStorageMigrationSolution;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.tuple.MutablePair;
import org.apache.commons.lang3.tuple.Pair;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Stream;

import static com.appsmith.external.constants.PluginConstants.PackageName.APPSMITH_AI_PLUGIN;
import static com.appsmith.server.migrations.constants.DeprecatedFieldName.POLICIES;
import static com.appsmith.server.migrations.constants.FieldName.POLICY_MAP;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@ChangeUnit(order = "047", id = "add-missing-fields-in-default-appsmith-datasource", author = " ")
public class Migration047AddMissingFieldsInDefaultAppsmithAiDatasource {
    private final MongoTemplate mongoTemplate;
    private final DatasourceStorageMigrationSolution datasourceStorageMigrationSolution =
            new DatasourceStorageMigrationSolution();
    Map<String, Set<PermissionGroup>> workspaceIdToPermissionGroups = new HashMap<>();
    Map<String, String> workspaceIdToEnvironmentId;
    String publicPermissionGroupId = null;
    public static final String APPLICATION = "Application";

    public Migration047AddMissingFieldsInDefaultAppsmithAiDatasource(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    /**
     * Steps of the migration:
     * 0. Find the plugin for Appsmith ai datasource type
     * 1. Find all Appsmith AI datasources without createdAt field created from Migration 045
     * 2. For each datasource, create policies based on default workspace permission groups and application specific permission groups
     * 3. create a datasource storage
     * 4. set createdAt and updatedAt across
     */
    @Execution
    public void addMissingFieldsInDefaultAppsmithAiDatasource() {
        // find Appsmith AI plugin id and then find existing Appsmith AI datasource without createdAt

        Query pluginQuery = new Query();
        pluginQuery.addCriteria(Criteria.where(FieldName.PACKAGE_NAME).is(APPSMITH_AI_PLUGIN));
        Plugin plugin = mongoTemplate.findOne(pluginQuery, Plugin.class);
        if (plugin == null) {
            log.error("Appsmith AI plugin not found");
            return;
        }
        String pluginId = plugin.getId();

        // mapping to store workspace id to environment id
        workspaceIdToEnvironmentId = datasourceStorageMigrationSolution.getDefaultEnvironmentsMap(mongoTemplate);
        publicPermissionGroupId = getPublicPermissionGroupId();

        Query datasourceQuery = new Query().addCriteria(datasourceCriteria(pluginId));

        try (Stream<Datasource> datasourceStream = mongoTemplate.stream(datasourceQuery, Datasource.class)) {
            // for each datasource, create policies based on default workspace permission groups and application based
            // permission groups
            // create a datasource storage and set createdAt and updatedAt across
            datasourceStream.forEach(datasource -> {
                String workspaceId = datasource.getWorkspaceId();
                String uniqueGitSyncId = workspaceId + "_" + new ObjectId();
                Instant now = Instant.now();

                Pair<Boolean, Set<String>> resultPair =
                        getAllApplicationIdsOfDatasourceAndCheckIfAnyAppPublic(datasource.getId());
                boolean isPublic = resultPair.getLeft();
                Set<String> allApplicationIds = resultPair.getRight();

                Set<PermissionGroup> workspacePermissionGroups =
                        getWorkspacePermissionGroups(workspaceId, allApplicationIds);

                datasource.setPolicies(createPolicies(isPublic, workspacePermissionGroups), false);
                datasource.setInvalids(new HashSet<>());
                datasource.setCreatedAt(now);
                datasource.setUpdatedAt(now);
                if (!StringUtils.hasText(datasource.getGitSyncId())) {
                    datasource.setGitSyncId(uniqueGitSyncId);
                }
                datasource.setHasDatasourceStorage(true);

                createDatasourceStorage(datasource);
                mongoTemplate.save(datasource);
            });
        } catch (Exception e) {
            log.error("Error during processing migration add-created-at-updated-at-default-appsmith-datasource", e);
        }
    }

    /**
     * Fetch list of all application ids for the datasource and check if any policy contains public permission group id
     */
    private Pair<Boolean, Set<String>> getAllApplicationIdsOfDatasourceAndCheckIfAnyAppPublic(String datasourceId) {
        Query newActionsQuery = new Query().addCriteria(newActionCriteria(datasourceId));
        newActionsQuery.fields().include(FieldName.ID, FieldName.APPLICATION_ID, POLICIES, POLICY_MAP);

        Set<String> allApplicationIds = new HashSet<>();
        AtomicReference<Boolean> isPublic = new AtomicReference<>(false);
        try (Stream<NewAction> newActionStream = mongoTemplate.stream(newActionsQuery, NewAction.class)) {
            newActionStream
                    .filter(newAction -> StringUtils.hasText(newAction.getApplicationId()))
                    .forEach(newAction -> {
                        allApplicationIds.add(newAction.getApplicationId());
                        Set<Policy> newActionPolicies = newAction.getPolicies();
                        // check if any policy contains public permission group id
                        for (Policy policy : newActionPolicies) {
                            if (!CollectionUtils.isNullOrEmpty(policy.getPermissionGroups())
                                    && policy.getPermissionGroups().contains(publicPermissionGroupId)) {
                                isPublic.set(true);
                            }
                        }
                    });
            return new MutablePair<>(isPublic.get(), allApplicationIds);
        } catch (Exception e) {
            log.error("Error fetching new actions for datasource {}", datasourceId, e);
        }
        return new MutablePair<>(false, new HashSet<>());
    }

    public static Criteria newActionCriteria(String datasourceId) {
        return new Criteria()
                .orOperator(
                        where("unpublishedAction.datasource.id").is(datasourceId),
                        where("publishedAction.datasource.id").is(datasourceId));
    }

    /**
     * Fetch public permission group id from the config service
     */
    private String getPublicPermissionGroupId() {
        Query publicPermissionGroupQuery = new Query();
        publicPermissionGroupQuery.addCriteria(Criteria.where(FieldName.NAME).is(FieldName.PUBLIC_PERMISSION_GROUP));
        Config config = mongoTemplate.findOne(publicPermissionGroupQuery, Config.class);
        if (config == null) {
            log.error("Public permission group not found");
            return null;
        }
        return config.getConfig().getAsString(FieldName.PERMISSION_GROUP_ID);
    }

    /**
     * Creates a basic empty datasource configuration
     */
    private DatasourceConfiguration createEmptyDatasourceConfiguration() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setProperties(List.of(new Property("Files", new ArrayList<>())));
        datasourceConfiguration.setUrl("https://ai.appsmith.com");
        return datasourceConfiguration;
    }

    /**
     * Create a datasource storage for the datasource
     */
    private void createDatasourceStorage(Datasource datasource) {
        String envId = datasourceStorageMigrationSolution.getEnvironmentIdForDatasource(
                workspaceIdToEnvironmentId, datasource.getWorkspaceId());

        Instant now = Instant.now();
        DatasourceStorage datasourceStorage = new DatasourceStorage();
        datasourceStorage.setDatasourceId(datasource.getId());
        datasourceStorage.setInvalids(new HashSet<>());
        datasourceStorage.setPolicies(new HashSet<>(), false);
        datasourceStorage.setIsConfigured(true);
        datasourceStorage.setGitSyncId(datasource.getGitSyncId());
        datasourceStorage.setEnvironmentId(envId);
        datasourceStorage.setCreatedAt(now);
        datasourceStorage.setUpdatedAt(now);
        // empty datasource configuration required for Appsmith AI plugin to work properly
        datasourceStorage.setDatasourceConfiguration(createEmptyDatasourceConfiguration());

        try {
            mongoTemplate.insert(datasourceStorage);
        } catch (Exception exception) {
            log.error(
                    "error while inserting datasource storage for datasource id: {} and environmentId: {}, error: {}",
                    datasource.getId(),
                    envId,
                    exception.getMessage());
        }
    }

    /**
     * Create policies for the datasource based on the permission groups of the workspace and associated applications
     */
    private Set<Policy> createPolicies(boolean isPublic, Set<PermissionGroup> permissionGroups) {
        // all workspace dev and admins
        Set<String> devAdminPGIds = new HashSet<>();
        // all app developers, creating for all permission groups which can read a datasource
        Set<String> appDevIds = new HashSet<>();
        // all workspace and app related permission groups
        Set<String> allPGIds = new HashSet<>();

        for (PermissionGroup permissionGroup : permissionGroups) {
            String permissionGroupId = permissionGroup.getId();
            if (permissionGroup.getName().contains(FieldName.VIEWER)) {
                allPGIds.add(permissionGroupId);
            } else if (permissionGroup.getName().contains(FieldName.DEVELOPER)) {
                // if developer is app developer, add it to appDevIds
                allPGIds.add(permissionGroupId);
                if (APPLICATION.equals(permissionGroup.getDefaultDomainType())) {
                    appDevIds.add(permissionGroupId);
                } else {
                    devAdminPGIds.add(permissionGroupId);
                }
            } else if (permissionGroup.getName().contains(FieldName.ADMINISTRATOR)) {
                devAdminPGIds.add(permissionGroupId);
                allPGIds.add(permissionGroupId);
            }
        }
        if (isPublic) {
            allPGIds.add(publicPermissionGroupId);
        }

        appDevIds.addAll(devAdminPGIds);
        // app developers can read and execute
        // workspace developers and admins can read, execute, delete and manage
        // all permission groups can execute
        return Set.of(
                new Policy(AclPermission.READ_DATASOURCES.getValue(), appDevIds),
                new Policy(AclPermission.EXECUTE_DATASOURCES.getValue(), allPGIds),
                new Policy(AclPermission.DELETE_DATASOURCES.getValue(), devAdminPGIds),
                new Policy(AclPermission.MANAGE_DATASOURCES.getValue(), devAdminPGIds));
    }

    private Set<PermissionGroup> getWorkspacePermissionGroups(String workspaceId, Set<String> applicationIds) {
        try {
            if (!workspaceIdToPermissionGroups.containsKey(workspaceId)) {
                workspaceIdToPermissionGroups.put(
                        workspaceId, fetchWorkspacePermissionGroups(workspaceId, applicationIds));
            }
            return workspaceIdToPermissionGroups.get(workspaceId);
        } catch (Exception e) {
            log.error("Error fetching default permission groups for workspace {}", workspaceId, e);
            return new HashSet<>();
        }
    }

    private Set<PermissionGroup> fetchWorkspacePermissionGroups(String workspaceId, Set<String> applicationIds) {
        Query workspaceQuery = new Query(Criteria.where(FieldName.ID).is(workspaceId));
        workspaceQuery.fields().include(FieldName.DEFAULT_PERMISSION_GROUPS);

        Workspace workspace = mongoTemplate.findOne(workspaceQuery, Workspace.class);
        if (workspace == null || CollectionUtils.isNullOrEmpty(workspace.getDefaultPermissionGroups())) {
            log.error("Workspace not found for id {} or no default permission groups", workspaceId);
            return new HashSet<>();
        }

        Query permissionGroupQuery = new Query()
                .addCriteria(permissionGroupCriteria(workspace.getDefaultPermissionGroups(), applicationIds));
        permissionGroupQuery.fields().include(FieldName.ID, FieldName.NAME, PermissionGroup.Fields.defaultDomainType);

        List<PermissionGroup> permissionGroups = mongoTemplate.find(permissionGroupQuery, PermissionGroup.class);
        if (CollectionUtils.isNullOrEmpty(permissionGroups)) {
            return new HashSet<>();
        }
        return new HashSet<>(permissionGroups);
    }

    public static Criteria permissionGroupCriteria(Set<String> permissionGroupIds, Set<String> applicationIds) {
        return new Criteria()
                .orOperator(
                        where(FieldName.ID).in(permissionGroupIds), appShareAndAppDeveloperCriteria(applicationIds));
    }

    public static Criteria appShareAndAppDeveloperCriteria(Set<String> applicationIds) {
        return new Criteria()
                .andOperator(
                        where(PermissionGroup.Fields.defaultDomainId).in(applicationIds),
                        where(PermissionGroup.Fields.defaultDomainType).is(APPLICATION),
                        olderCheckForDeletedCriteria(),
                        newerCheckForDeletedCriteria());
    }

    public static Criteria datasourceCriteria(String pluginId) {
        return new Criteria().andOperator(where(FieldName.PLUGIN_ID).is(pluginId), checkForCreatedAt());
    }

    public static Criteria checkForCreatedAt() {
        return new Criteria()
                .orOperator(
                        where(FieldName.CREATED_AT).exists(false),
                        where(FieldName.CREATED_AT).is(null));
    }

    public static Criteria olderCheckForDeletedCriteria() {
        return new Criteria()
                .orOperator(
                        where(FieldName.DELETED).exists(false),
                        where(FieldName.DELETED).is(false));
    }

    public static Criteria newerCheckForDeletedCriteria() {
        return new Criteria()
                .orOperator(
                        where(FieldName.DELETED_AT).exists(false),
                        where(FieldName.DELETED_AT).is(null));
    }
}
