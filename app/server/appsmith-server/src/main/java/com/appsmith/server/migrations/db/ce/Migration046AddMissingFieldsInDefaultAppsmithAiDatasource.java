package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.Property;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ce.FieldNameCE;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.migrations.solutions.DatasourceStorageMigrationSolution;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import static com.appsmith.external.constants.PluginConstants.PackageName.APPSMITH_AI_PLUGIN;
import static com.appsmith.server.constants.ce.FieldNameCE.ADMINISTRATOR;
import static com.appsmith.server.constants.ce.FieldNameCE.DEVELOPER;
import static com.appsmith.server.constants.ce.FieldNameCE.PACKAGE_NAME;
import static com.appsmith.server.constants.ce.FieldNameCE.VIEWER;

@Slf4j
@ChangeUnit(order = "046", id = "add-missing-fields-in-default-appsmith-datasource", author = "")
public class Migration046AddMissingFieldsInDefaultAppsmithAiDatasource {
    private final MongoTemplate mongoTemplate;
    private final DatasourceStorageMigrationSolution datasourceStorageMigrationSolution =
            new DatasourceStorageMigrationSolution();
    Map<String, Set<PermissionGroup>> workspaceIdToDefaultPermissionGroups = new HashMap<>();
    Map<String, String> workspaceIdToEnvironmentId = null;

    public Migration046AddMissingFieldsInDefaultAppsmithAiDatasource(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void addMissingFieldsInDefaultAppsmithAiDatasource() {
        // find Appsmith AI plugin id and then find existing Appsmith AI datasource without createdAt
        Query pluginQuery = new Query();
        pluginQuery.addCriteria(Criteria.where(PACKAGE_NAME).is(APPSMITH_AI_PLUGIN));
        Plugin plugin = mongoTemplate.findOne(pluginQuery, Plugin.class);
        if (plugin == null) {
            log.error("Appsmith AI plugin not found");
            return;
        }
        String pluginId = plugin.getId();

        Query datasourceQuery = new Query();
        datasourceQuery.addCriteria(Criteria.where(FieldNameCE.PLUGIN_ID)
                .is(pluginId)
                .and(FieldNameCE.CREATED_AT)
                .exists(false));
        try (Stream<Datasource> datasourceStream = mongoTemplate.stream(datasourceQuery, Datasource.class)) {
            // for each datasource, create policies based on default workspace permission groups, create a datasource
            // storage and set createdAt and updatedAt across
            datasourceStream.forEach(datasource -> {
                String workspaceId = datasource.getWorkspaceId();
                String uniqueGitSyncId = workspaceId + "_" + new ObjectId();

                Set<PermissionGroup> defaultPermissionGroups = getDefaultPermissionGroups(workspaceId);

                datasource.setPolicies(createPolicies(defaultPermissionGroups));
                datasource.setInvalids(new HashSet<>());
                datasource.setCreatedAt(Instant.now());
                datasource.setUpdatedAt(Instant.now());
                datasource.setGitSyncId(uniqueGitSyncId);
                datasource.setHasDatasourceStorage(true);

                createDatasourceStorage(datasource);
                mongoTemplate.save(datasource);
            });
        } catch (Exception e) {
            log.error("Error during processing migration add-created-at-updated-at-default-appsmith-datasource", e);
        }
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
        if (workspaceIdToEnvironmentId == null) {
            workspaceIdToEnvironmentId = datasourceStorageMigrationSolution.getDefaultEnvironmentsMap(mongoTemplate);
        }
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
    private Set<Policy> createPolicies(Set<PermissionGroup> permissionGroups) {
        Set<String> devAdminPGIds = new HashSet<>();
        Set<String> allPGIds = new HashSet<>();

        for (PermissionGroup permissionGroup : permissionGroups) {
            String permissionGroupId = permissionGroup.getId();
            if (permissionGroup.getName().contains(VIEWER)) {
                allPGIds.add(permissionGroupId);
            } else if (permissionGroup.getName().contains(DEVELOPER)) {
                devAdminPGIds.add(permissionGroupId);
                allPGIds.add(permissionGroupId);
            } else if (permissionGroup.getName().contains(ADMINISTRATOR)) {
                devAdminPGIds.add(permissionGroupId);
                allPGIds.add(permissionGroupId);
            }
        }

        return Set.of(
                new Policy(AclPermission.READ_DATASOURCES.getValue(), devAdminPGIds),
                new Policy(AclPermission.EXECUTE_DATASOURCES.getValue(), allPGIds),
                new Policy(AclPermission.DELETE_DATASOURCES.getValue(), devAdminPGIds),
                new Policy(AclPermission.MANAGE_DATASOURCES.getValue(), devAdminPGIds));
    }

    private Set<PermissionGroup> getDefaultPermissionGroups(String workspaceId) {
        return workspaceIdToDefaultPermissionGroups.computeIfAbsent(workspaceId, this::fetchDefaultPermissionGroups);
    }

    private Set<PermissionGroup> fetchDefaultPermissionGroups(String workspaceId) {
        Query workspaceQuery = new Query(Criteria.where(FieldNameCE.ID).is(workspaceId));
        workspaceQuery.fields().include(FieldNameCE.DEFAULT_PERMISSION_GROUPS);

        Workspace workspace = mongoTemplate.findOne(workspaceQuery, Workspace.class);
        if (workspace == null
                || workspace.getDefaultPermissionGroups() == null
                || workspace.getDefaultPermissionGroups().isEmpty()) {
            log.error("Workspace not found for id {} or no default permission groups", workspaceId);
            return new HashSet<>();
        }

        Query permissionGroupQuery = new Query();
        permissionGroupQuery.fields().include(FieldNameCE.ID, FieldNameCE.NAME);
        permissionGroupQuery.addCriteria(Criteria.where(FieldNameCE.ID).in(workspace.getDefaultPermissionGroups()));
        return new HashSet<>(mongoTemplate.find(permissionGroupQuery, PermissionGroup.class));
    }
}
