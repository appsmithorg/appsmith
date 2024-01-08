package com.appsmith.server.migrations.db.ce;

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
@ChangeUnit(order = "043", id = "add-index-to-action-collection-default-resources-pageid", author = "")
public class Migration043AddIndexActionCollectionPageID {
    private final MongoTemplate mongoTemplate;
    private static final String INDEX_KEYPATH = "unpublishedCollection.defaultResources.pageId";
    private static final String PREVIOUS_INDEX_NAME = "unpublishedCollection.defaultResources.pageId_1";

    public Migration043AddIndexActionCollectionPageID(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void addIndexToActionCollectionCollection() {
        Index index = makeIndex(INDEX_KEYPATH);

        try {
            dropIndexIfExists(mongoTemplate, ActionCollection.class, PREVIOUS_INDEX_NAME);
            dropIndexIfExists(mongoTemplate, ActionCollection.class, INDEX_KEYPATH);

            ensureIndexes(mongoTemplate, ActionCollection.class, index);
        } catch (UncategorizedMongoDbException exception) {
            log.error(
                    "An error occurred while creating the index : {}, skipping the additon of index because of {}.",
                    INDEX_KEYPATH,
                    exception.getMessage());
        } catch (Exception e) {
            log.error("An error occurred while creating the index : {}", INDEX_KEYPATH, e);
        }
    }
}
