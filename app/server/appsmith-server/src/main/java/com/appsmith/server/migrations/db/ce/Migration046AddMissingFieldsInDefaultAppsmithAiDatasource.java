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
import com.appsmith.server.domains.QNewAction;
import com.appsmith.server.domains.QPermissionGroup;
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
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@Slf4j
@ChangeUnit(order = "046", id = "add-missing-fields-in-default-appsmith-datasource", author = "")
public class Migration046AddMissingFieldsInDefaultAppsmithAiDatasource {
    private final MongoTemplate mongoTemplate;
    private final DatasourceStorageMigrationSolution datasourceStorageMigrationSolution =
            new DatasourceStorageMigrationSolution();
    Map<String, Set<PermissionGroup>> workspaceIdToPermissionGroups = new HashMap<>();
    Map<String, String> workspaceIdToEnvironmentId = null;
    String publicPermissionGroupId = null;
    private static int counter = 1;

    public Migration046AddMissingFieldsInDefaultAppsmithAiDatasource(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

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

        workspaceIdToEnvironmentId = datasourceStorageMigrationSolution.getDefaultEnvironmentsMap(mongoTemplate);
        publicPermissionGroupId = getPublicPermissionGroupId();

        Query datasourceQuery = new Query();
        datasourceQuery.addCriteria(Criteria.where(FieldName.PLUGIN_ID)
                .is(pluginId)
                .and(FieldName.CREATED_AT)
                .exists(false));
        try (Stream<Datasource> datasourceStream = mongoTemplate.stream(datasourceQuery, Datasource.class)) {
            // for each datasource, create policies based on default workspace permission groups, create a datasource
            // storage and set createdAt and updatedAt across
            datasourceStream.forEach(datasource -> {
                String workspaceId = datasource.getWorkspaceId();
                String uniqueGitSyncId = workspaceId + "_" + new ObjectId();

                Pair<Boolean, Set<String>> resultPair =
                        getAllApplicationIdsOfDatasourceAndCheckIfAnyAppPublic(datasource);
                boolean isPublic = resultPair.getLeft();
                Set<String> allApplicationIds = resultPair.getRight();

                Set<PermissionGroup> workspacePermissionGroups =
                        getWorkspacePermissionGroups(workspaceId, allApplicationIds);

                datasource.setPolicies(createPolicies(isPublic, workspacePermissionGroups));
                datasource.setInvalids(new HashSet<>());
                datasource.setCreatedAt(Instant.now());
                datasource.setUpdatedAt(Instant.now());
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
    public Pair<Boolean, Set<String>> getAllApplicationIdsOfDatasourceAndCheckIfAnyAppPublic(Datasource datasource) {
        Query newActionsQuery = new Query();
        newActionsQuery.addCriteria(
                Criteria.where("unpublishedAction.datasource.id").is(datasource.getId()));
        newActionsQuery
                .fields()
                .include(FieldName.ID, FieldName.APPLICATION_ID, fieldName(QNewAction.newAction.policies));

        Set<String> allApplicationIds = new HashSet<>();
        AtomicReference<Boolean> isPublic = new AtomicReference<>(false);
        try (Stream<NewAction> newActionStream = mongoTemplate.stream(newActionsQuery, NewAction.class)) {
            newActionStream.forEach(newAction -> {
                if (!StringUtils.hasText(newAction.getApplicationId())) {
                    return;
                }
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
            log.error("Error fetching new actions for datasource {}", datasource.getId(), e);
        }
        return new MutablePair<>(false, new HashSet<>());
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

        DatasourceStorage datasourceStorage = new DatasourceStorage();
        datasourceStorage.setDatasourceId(datasource.getId());
        datasourceStorage.setInvalids(new HashSet<>());
        datasourceStorage.setPolicies(new HashSet<>());
        datasourceStorage.setIsConfigured(true);
        datasourceStorage.setGitSyncId(datasource.getGitSyncId());
        datasourceStorage.setEnvironmentId(envId);
        datasourceStorage.setCreatedAt(Instant.now());
        datasourceStorage.setUpdatedAt(Instant.now());
        // empty datasource configuration required for Appsmith AI plugin to work properly
        datasourceStorage.setDatasourceConfiguration(createEmptyDatasourceConfiguration());

        mongoTemplate.insert(datasourceStorage);
    }

    /**
     * Create policies for the datasource based on the default permission groups of the workspace
     */
    private Set<Policy> createPolicies(boolean isPublic, Set<PermissionGroup> permissionGroups) {
        Set<String> devAdminPGIds = new HashSet<>();
        Set<String> allPGIds = new HashSet<>();

        for (PermissionGroup permissionGroup : permissionGroups) {
            String permissionGroupId = permissionGroup.getId();
            if (permissionGroup.getName().contains(FieldName.VIEWER)) {
                allPGIds.add(permissionGroupId);
            } else if (permissionGroup.getName().contains(FieldName.DEVELOPER)) {
                devAdminPGIds.add(permissionGroupId);
                allPGIds.add(permissionGroupId);
            } else if (permissionGroup.getName().contains(FieldName.ADMINISTRATOR)) {
                devAdminPGIds.add(permissionGroupId);
                allPGIds.add(permissionGroupId);
            }
        }
        if (isPublic) {
            allPGIds.add(publicPermissionGroupId);
        }

        return Set.of(
                new Policy(AclPermission.READ_DATASOURCES.getValue(), devAdminPGIds),
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

        Query permissionGroupQuery = new Query();
        permissionGroupQuery.fields().include(FieldName.ID, FieldName.NAME);
        Criteria applicationSpecificPermissionGroupCriteria = new Criteria();
        applicationSpecificPermissionGroupCriteria.andOperator(
                Criteria.where(fieldName(QPermissionGroup.permissionGroup.defaultDomainType))
                        .is("Application"),
                Criteria.where(fieldName(QPermissionGroup.permissionGroup.defaultDomainId))
                        .in(applicationIds));
        permissionGroupQuery.addCriteria(new Criteria()
                .orOperator(
                        applicationSpecificPermissionGroupCriteria,
                        Criteria.where(FieldName.ID).in(workspace.getDefaultPermissionGroups())));
        List<PermissionGroup> permissionGroups = mongoTemplate.find(permissionGroupQuery, PermissionGroup.class);
        if (CollectionUtils.isNullOrEmpty(permissionGroups)) {
            return new HashSet<>();
        }
        return new HashSet<>(permissionGroups);
    }
}
