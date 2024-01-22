package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
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
@ChangeUnit(order = "038", id = "add-compound-index-action-collection", author = " ")
public class Migration038AddCompoundIndexForActionCollection {

    private final MongoTemplate mongoTemplate;

    private static final String PROD_EXISTING_INDEX_NAME =
            "deleted_1_deletedAt_1_unpublishedCollection.deletedAt_1_createdAt_1_unpublishedCollection.defaultResources.pageId_1";

    // Keeping the name intentionally short and giving up on the naming conventions to keep up with the document db
    // limitation.
    private static final String ACTION_COLLECTION_COMPOUND_INDEX = "action_collection_compound_index_dec23";

    public Migration038AddCompoundIndexForActionCollection(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * Not a critical migration, so we can skip the rollback.
     */
    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void addIndexInActionCollection() {

        Index compoundIndex = makeIndex(
                        FieldName.DELETED,
                        FieldName.DELETED_AT,
                        "unpublishedCollection.deletedAt",
                        FieldName.CREATED_AT,
                        "unpublishedCollection.defaultResources.pageId")
                .named(ACTION_COLLECTION_COMPOUND_INDEX);

        try {
            // drop the manually created production index.
            dropIndexIfExists(mongoTemplate, ActionCollection.class, PROD_EXISTING_INDEX_NAME);

            dropIndexIfExists(mongoTemplate, ActionCollection.class, ACTION_COLLECTION_COMPOUND_INDEX);
            ensureIndexes(mongoTemplate, ActionCollection.class, compoundIndex);
        } catch (UncategorizedMongoDbException mongockException) {
            log.error(
                    "An error occurred while creating the index : {}, skipping the addition of index because of {}.",
                    ACTION_COLLECTION_COMPOUND_INDEX,
                    mongockException.getMessage());
        } catch (Exception exception) {
            log.error("An error occurred while creating the index : {}", ACTION_COLLECTION_COMPOUND_INDEX, exception);
        }
    }
}
