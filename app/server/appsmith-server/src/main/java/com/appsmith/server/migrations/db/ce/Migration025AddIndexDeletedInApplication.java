package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
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
@ChangeUnit(order = "025", id = "add-index-application-deleted", author = " ")
public class Migration025AddIndexDeletedInApplication {

    private final MongoTemplate mongoTemplate;
    private static final String APPLICATION_COMPOUND_INDEX_DELETED = "deleted_compound_index";

    public Migration025AddIndexDeletedInApplication(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * mandatory to declare, but we don't have a use-case for this yet.
     */
    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void createIndexInApplicationCollection() {
        dropIndexIfExists(mongoTemplate, Application.class, APPLICATION_COMPOUND_INDEX_DELETED);

        Index deletedAtDeletedIndex =
                makeIndex(FieldName.DELETED, FieldName.DELETED_AT).named(APPLICATION_COMPOUND_INDEX_DELETED);

        try {
            ensureIndexes(mongoTemplate, Application.class, deletedAtDeletedIndex);
        } catch (UncategorizedMongoDbException mongockException) {
            log.debug(
                    "An error occurred while creating the index : {}, skipping the addition of index because of {}.",
                    APPLICATION_COMPOUND_INDEX_DELETED,
                    mongockException.getMessage());
        } catch (Exception exception) {
            log.debug("An error occurred while creating the index : {}", APPLICATION_COMPOUND_INDEX_DELETED);
            exception.printStackTrace();
        }
    }
}
