package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.constants.FieldName;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.UncategorizedMongoDbException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import static com.appsmith.server.migrations.DatabaseChangelog1.dropIndexIfExists;
import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;

@Slf4j
@ChangeUnit(order = "039", id = "add-compound-index-datasource-storage", author = " ")
public class Migration039AddCompoundIndexForDatasourceStorage {

    private final MongoTemplate mongoTemplate;

    private static final String DATASOURCE_STORAGE_COMPOUND_INDEX = "environmentId_1_deleted_1";

    public Migration039AddCompoundIndexForDatasourceStorage(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * Not a critical migration, so we can skip the rollback.
     */
    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void addIndexInDatasourceStorageCollection() {

        Index compoundIndex =
                makeIndex(FieldName.ENVIRONMENT_ID, FieldName.DELETED).named(DATASOURCE_STORAGE_COMPOUND_INDEX);

        try {
            dropIndexIfExists(mongoTemplate, DatasourceStorage.class, DATASOURCE_STORAGE_COMPOUND_INDEX);
            ensureIndexes(mongoTemplate, DatasourceStorage.class, compoundIndex);
        } catch (UncategorizedMongoDbException mongockException) {
            log.error(
                    "An error occurred while creating the index : {}, skipping the addition of index because of {}.",
                    DATASOURCE_STORAGE_COMPOUND_INDEX,
                    mongockException.getMessage());
        } catch (Exception exception) {
            log.error("An error occurred while creating the index : {}", DATASOURCE_STORAGE_COMPOUND_INDEX, exception);
        }
    }
}
