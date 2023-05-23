package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.QDatasource;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.migrations.solutions.DatasourceStorageMigrationSolution;
import com.appsmith.server.migrations.utils.CompatibilityUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

/**
 * In this migration, we are moving configurations from each valid datasource
 * to a new collection. The datasource will cease to have configurations after this point
 */
@Slf4j
//@ChangeUnit(order = "012", id = "migrate-configurations-to-data-storage", author = " ")
public class Migration012TransferToDatasourceStorage {
    private final MongoTemplate mongoTemplate;

    private final String migrationFlag = "hasDatasourceStorage";

    private final DatasourceStorageMigrationSolution solution = new DatasourceStorageMigrationSolution();

    public Migration012TransferToDatasourceStorage(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    //    @RollbackExecution
    public void rollbackExecution() {
        // We're handling rollbacks using marker fields, so we don't need to implement this
    }

    //    @Execution
    public void executeMigration() {
        // First fetch all datasource ids and workspace ids for datasources that
        // do not have `hasDatasourceStorage` value set as true
        final Query datasourceQuery = query(findDatasourceIdsToUpdate()).cursorBatchSize(1024);
        datasourceQuery.fields().include(
                fieldName(QDatasource.datasource.id),
                fieldName(QDatasource.datasource.workspaceId));

        final Query performanceOptimizedQuery = CompatibilityUtils
                .optimizeQueryForNoCursorTimeout(mongoTemplate, datasourceQuery, Datasource.class);

        final List<Datasource> datasourcesWithIds =
                mongoTemplate.find(performanceOptimizedQuery, Datasource.class);

        // Prepare a map of datasourceId to workspaceId
        final Map<String, String> datasourceIdMap = datasourcesWithIds.stream().parallel()
                .collect(Collectors.toMap(Datasource::getId, Datasource::getWorkspaceId));

        // Fetch all environment ids and workspace ids that are default in their workspaces
        // Store them in a map of workspaceId to environmentId
        Map<String, String> environmentsMap = solution.getDefaultEnvironmentsMap(mongoTemplate);

        // Now go back to streaming through each datasource that has
        // `hasDatasourceStorage` value set as true
        Query datasourcesToUpdateQuery = query(findDatasourceIdsToUpdate()).cursorBatchSize(1024);
        datasourcesToUpdateQuery.fields().include(
                fieldName(QDatasource.datasource.id),
                fieldName(QDatasource.datasource.workspaceId),
                fieldName(QDatasource.datasource.isConfigured),
                fieldName(QDatasource.datasource.gitSyncId),
                fieldName(QDatasource.datasource.invalids),
                fieldName(QDatasource.datasource.hasDatasourceStorage),
                fieldName(QDatasource.datasource.datasourceConfiguration)
        );

        final Query performanceOptimizedUpdateQuery = CompatibilityUtils
                .optimizeQueryForNoCursorTimeout(mongoTemplate, datasourcesToUpdateQuery, Datasource.class);

        mongoTemplate
                .stream(performanceOptimizedUpdateQuery, Datasource.class)
                .forEach(datasource -> {
                    // For each of these datasources, we want to build a new datasource storage

                    // Fetch the correct environment id to use with this datasource storage
                    String environmentId = solution
                            .getEnvironmentIdForDatasource(environmentsMap, datasource.getWorkspaceId());

                    // If none exists, this is an error scenario, log the error and skip the datasource
                    if (environmentId == null) {
                        log.error("Could not find default environment id for workspace id: {}, skipping datasource id: {}",
                                datasource.getWorkspaceId(), datasource.getId());
                        return;
                    }

                    DatasourceStorage datasourceStorage = new DatasourceStorage(datasource, environmentId);

                    log.debug("Creating datasource storage for datasource id: {} with environment id: {}",
                            datasource.getId(), environmentId);

                    // Insert the populated datasource storage into database
                    try {
                        mongoTemplate.insert(datasourceStorage);
                    } catch (DuplicateKeyException e) {
                        log.warn("Looks like the datasource storage already exists for datasource id: {}",
                                datasource.getId());
                        log.warn("We will attempt to reset the datasource again.");
                    }

                    // Once the datasource storage exists, delete the older config inside datasource
                    // And set `hasDatasourceStorage` value to true
                    mongoTemplate.updateFirst(
                            new Query()
                                    .addCriteria(where(fieldName(QDatasource.datasource.id)).is(datasource.getId())),
                            new Update()
                                    .set(migrationFlag, true)
                                    .unset(fieldName(QDatasource.datasource.datasourceConfiguration))
                                    .unset(fieldName(QDatasource.datasource.invalids))
                                    .unset(fieldName(QDatasource.datasource.isConfigured)),
                            Datasource.class);
                });

    }

    private Criteria findDatasourceIdsToUpdate() {
        return new Criteria().andOperator(
                // Check for migration flag
                new Criteria().orOperator(
                        where(migrationFlag).exists(false),
                        where(migrationFlag).is(false)
                ),
                //Older check for deleted
                new Criteria().orOperator(
                        where(FieldName.DELETED).exists(false),
                        where(FieldName.DELETED).is(false)
                ),
                //New check for deleted
                new Criteria().orOperator(
                        where(FieldName.DELETED_AT).exists(false),
                        where(FieldName.DELETED_AT).is(null)
                )
        );
    }

}


