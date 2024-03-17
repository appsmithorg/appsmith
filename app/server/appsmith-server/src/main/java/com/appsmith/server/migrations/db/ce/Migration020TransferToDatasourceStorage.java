package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.migrations.solutions.DatasourceStorageMigrationSolution;
import com.appsmith.server.migrations.utils.CompatibilityUtils;
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

import static com.appsmith.server.constants.FieldName.PASSWORD;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

/**
 * In this migration, we are moving configurations from each valid datasource
 * to a new collection. The datasource will cease to have configurations after this point
 */
@Slf4j
@ChangeUnit(order = "109", id = "migrate-configurations-to-data-storage-v2", author = " ")
// Although this migration is common to CE and BE, the ordering of this change-unit needs to be specifically after
// 107-ee,
// as this migration has EE overrides for default environmentId, and for getting the environments on existing
// workspaces, 107-ee needs to run
public class Migration020TransferToDatasourceStorage {
    private final MongoTemplate mongoTemplate;

    private final String migrationFlag = "hasDatasourceStorage";
    private static final String datasourceConfigurationFieldName = Datasource.Fields.datasourceConfiguration;
    private static final String authenticationFieldName = DatasourceConfiguration.Fields.authentication;
    private static final String delimiter = ".";

    private final DatasourceStorageMigrationSolution solution = new DatasourceStorageMigrationSolution();

    public Migration020TransferToDatasourceStorage(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {
        // We're handling rollbacks using marker fields, so we don't need to implement this
    }

    @Execution
    public void executeMigration() {
        // Fetch all environment ids and workspace ids that are default in their workspaces
        // Store them in a map of workspaceId to environmentId
        Map<String, String> environmentsMap = solution.getDefaultEnvironmentsMap(mongoTemplate);

        // query to fetch all datasource that
        // do not have `hasDatasourceStorage` value set as true
        Query datasourcesToUpdateQuery = query(findDatasourceIdsToUpdate()).cursorBatchSize(1024);
        datasourcesToUpdateQuery
                .fields()
                .include(
                        Datasource.Fields.id,
                        Datasource.Fields.workspaceId,
                        Datasource.Fields.isConfigured,
                        Datasource.Fields.gitSyncId,
                        Datasource.Fields.invalids,
                        Datasource.Fields.hasDatasourceStorage,
                        Datasource.Fields.datasourceConfiguration);

        final Query performanceOptimizedUpdateQuery = CompatibilityUtils.optimizeQueryForNoCursorTimeout(
                mongoTemplate, datasourcesToUpdateQuery, Datasource.class);

        // Now go back to streaming through each datasource that has
        // `hasDatasourceStorage` value set as true
        mongoTemplate.stream(performanceOptimizedUpdateQuery, Datasource.class).forEach(datasource -> {
            // For each of these datasource, we want to build a new datasource storage

            // Fetch the correct environment id to use with this datasource storage
            String environmentId = solution.getEnvironmentIdForDatasource(environmentsMap, datasource.getWorkspaceId());

            // If none exists, this is an error scenario, log the error and skip the datasource
            if (environmentId == null) {
                log.error(
                        "Could not find default environment id for workspace id: {}, skipping datasource id: {}",
                        datasource.getWorkspaceId(),
                        datasource.getId());
                return;
            }

            DatasourceStorage datasourceStorage = createDatasourceStorageFromDatasource(datasource, environmentId);

            log.debug(
                    "Creating datasource storage for datasource id: {} with environment id: {}",
                    datasource.getId(),
                    environmentId);

            // Insert the populated datasource storage into database
            try {
                mongoTemplate.insert(datasourceStorage);
            } catch (DuplicateKeyException e) {
                log.warn("Looks like the datasource storage already exists for datasource id: {}", datasource.getId());
                log.warn("We will attempt to reset the datasource again.");
            }

            // Once the datasource storage exists, delete the older config inside datasource
            // And set `hasDatasourceStorage` value to true
            mongoTemplate.updateFirst(
                    new Query().addCriteria(where(Datasource.Fields.id).is(datasource.getId())),
                    new Update()
                            .set(migrationFlag, true)
                            .unset(Datasource.Fields.datasourceConfiguration)
                            .unset(Datasource.Fields.invalids)
                            .unset(Datasource.Fields.isConfigured),
                    Datasource.class);
        });
    }

    private Criteria findDatasourceIdsToUpdate() {
        return new Criteria()
                .andOperator(
                        // Check for migration flag
                        new Criteria()
                                .orOperator(
                                        where(migrationFlag).exists(false),
                                        where(migrationFlag).is(false)),
                        // Older check for deleted
                        new Criteria()
                                .orOperator(
                                        where(FieldName.DELETED).exists(false),
                                        where(FieldName.DELETED).is(false)),
                        // New check for deleted
                        new Criteria()
                                .orOperator(
                                        where(FieldName.DELETED_AT).exists(false),
                                        where(FieldName.DELETED_AT).is(null)),
                        // these checks are placed because we are getting values which are empty and while decrypting
                        // those values, we are getting ArrayOutOfBoundException because password is set to ""
                        where(Datasource.Fields.workspaceId).exists(true),
                        where(Datasource.Fields.workspaceId).ne(null),
                        where(datasourceConfigurationFieldName
                                        + delimiter
                                        + authenticationFieldName
                                        + delimiter
                                        + PASSWORD)
                                .ne(""));
    }

    private static DatasourceStorage createDatasourceStorageFromDatasource(
            Datasource datasource, String environmentId) {
        DatasourceStorage datasourceStorage = new DatasourceStorage(
                datasource.getId(),
                environmentId,
                datasource.getDatasourceConfiguration(),
                datasource.getIsConfigured(),
                datasource.getInvalids(),
                datasource.getMessages());

        datasourceStorage.prepareTransientFields(datasource);
        return datasourceStorage;
    }
}
