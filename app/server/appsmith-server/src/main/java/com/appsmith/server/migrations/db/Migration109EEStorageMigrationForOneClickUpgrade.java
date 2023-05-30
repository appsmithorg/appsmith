package com.appsmith.server.migrations.db;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.QDatasource;
import com.appsmith.external.models.QDatasourceStorage;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.migrations.CompatibilityUtils;
import com.appsmith.server.migrations.solutions.DatasourceStorageMigrationSolution;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.Map;
import java.util.concurrent.ConcurrentMap;
import java.util.stream.Collectors;

import static com.appsmith.server.migrations.solutions.DatasourceStorageMigrationSolution.newerCheckForDeletedCriteria;
import static com.appsmith.server.migrations.solutions.DatasourceStorageMigrationSolution.olderCheckForDeletedCriteria;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@Slf4j
@ChangeUnit(order = "109-ee", id = "update-data-storage-one-click-upgrade", author = " ")
public class Migration109EEStorageMigrationForOneClickUpgrade {

    private static final String unusedEnvKey  = FieldName.UNUSED_ENVIRONMENT_ID;
    private final DatasourceStorageMigrationSolution solution = new DatasourceStorageMigrationSolution();
    private final MongoTemplate mongoTemplate;


    public Migration109EEStorageMigrationForOneClickUpgrade(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void executionRollback() {
    }

    @Execution
    public void executeMigration() {
        // let's find all the required Maps first

        // First fetch all datasource ids and workspace ids for datasources
        final ConcurrentMap<String, String> datasourcesIdToWorkspaceIdMap = getDatasourceIdToWorkspaceIdMap(mongoTemplate);

        // Fetch all environment ids and workspace ids that are default in their workspaces
        // Store them in a map of workspaceId to environmentId
        final Map<String, String> workspaceIdToDefaultEnvironmentIdMap =  solution.getDefaultEnvironmentsMap(mongoTemplate);

        // query to find datasource-storages which have their environmentId value as unused_env
        Query getAllDatasourceStorageWhereEnvIdIsUnusedEnv = new Query()
                .cursorBatchSize(1024)
                .addCriteria(communityEditionDatasourceStorageCriteria());

        final Query performanceOptimizedQuery = CompatibilityUtils
                .optimizeQueryForNoCursorTimeout(mongoTemplate, getAllDatasourceStorageWhereEnvIdIsUnusedEnv, DatasourceStorage.class);

        mongoTemplate
                .stream(performanceOptimizedQuery, DatasourceStorage.class)
                .forEach(datasourceStorage -> {

                    if (!datasourcesIdToWorkspaceIdMap.containsKey(datasourceStorage.getDatasourceId())) {
                        log.debug("No workspace id  found for the datasource id : {}. " +
                                        "Skipping environmentId field modification for datasourceStorage id: {}",
                                datasourceStorage.getDatasourceId(),
                                datasourceStorage.getId());
                        return;
                    }

                    String workspaceIdForThisDatasourceStorage = datasourcesIdToWorkspaceIdMap.get(datasourceStorage.getDatasourceId());

                    // if this map doesn't contain the workspace key, environmentId for datasourceStorage will be modified to the constant.
                    // this is so that we will be able to collect this data later on and resolve it as needed.
                    if (!workspaceIdToDefaultEnvironmentIdMap.containsKey(workspaceIdForThisDatasourceStorage)) {
                        log.debug("No environment id found for the workspace id : {}. " +
                                        "environmentId field will be set to a constant: {} for datasourceStorage id: {}",
                                workspaceIdForThisDatasourceStorage,
                                FieldName.FAILED_ENVIRONMENT_ID_UPGRADE,
                                datasourceStorage.getId());
                    }

                    String defaultEnvironmentId = workspaceIdToDefaultEnvironmentIdMap.getOrDefault(workspaceIdForThisDatasourceStorage, FieldName.FAILED_ENVIRONMENT_ID_UPGRADE);

                    log.debug("workspaceId: {}, defaultEnvironmentId: {}", workspaceIdForThisDatasourceStorage, defaultEnvironmentId);

                    // This update operator sets the `environmentId` of datasourceStorage to the defaultEnvironmentId,
                    // Criteria for querying the datasourceStorage collection is respective objectIds
                    try {
                        mongoTemplate.updateFirst(
                                new Query().addCriteria(where(fieldName(QDatasourceStorage.datasourceStorage.id)).is(datasourceStorage.getId())),
                                new Update().set(fieldName(QDatasourceStorage.datasourceStorage.environmentId), defaultEnvironmentId),
                                DatasourceStorage.class
                        );
                    } catch (DuplicateKeyException duplicateKeyException) {
                        log.warn("Looks like the datasource storage with id: {} has the environmentId already set at: {}",
                                datasourceStorage.getId(), defaultEnvironmentId);
                        log.warn("Skipping the environmentId update as the right environmentId is already set ");
                    }

                });
    }

    public static Criteria communityEditionDatasourceStorageCriteria() {

        return new Criteria().andOperator(
                //Older check for deleted
                olderCheckForDeletedCriteria(),
                //New check for deleted
                newerCheckForDeletedCriteria(),
                where(fieldName(QDatasourceStorage.datasourceStorage.environmentId)).is(unusedEnvKey)
        );
    }

    public Criteria datasourceWorkspaceIdCriteria() {
        return new Criteria().andOperator(
                //Older check for deleted
                olderCheckForDeletedCriteria(),
                //New check for deleted
                newerCheckForDeletedCriteria(),
                where(fieldName(QDatasource.datasource.workspaceId)).exists(true),
                where(fieldName(QDatasource.datasource.workspaceId)).ne(null)
        );
    }

    public ConcurrentMap<String,String> getDatasourceIdToWorkspaceIdMap(MongoTemplate mongoTemplate) {

        final Query datasourceQuery = query(datasourceWorkspaceIdCriteria()).cursorBatchSize(1024);

        datasourceQuery.fields().include(
                fieldName(QDatasource.datasource.id),
                fieldName(QDatasource.datasource.workspaceId));

        final Query performanceOptimizedDatasourceQuery = com.appsmith.server.migrations.utils.CompatibilityUtils
                .optimizeQueryForNoCursorTimeout(mongoTemplate, datasourceQuery, Datasource.class);

        return mongoTemplate.find(performanceOptimizedDatasourceQuery, Datasource.class)
                .parallelStream()// TODO: find if stream().parallel() has different flow
                .collect(Collectors.toConcurrentMap(Datasource::getId, Datasource::getWorkspaceId));
    }

}
