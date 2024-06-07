package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.NewAction;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;
import org.springframework.data.mongodb.core.index.Index;

import static com.appsmith.server.migrations.DatabaseChangelog1.dropIndexIfExists;
import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;

@Slf4j
@ChangeUnit(order = "051", id = "add-idx-new-action-coll-id", author = " ")
public class Migration051AddNewActionCollectionIdIndex {

    private final MongoTemplate mongoTemplate;

    public Migration051AddNewActionCollectionIdIndex(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void addMissingIndexInNewActionCollection() {

        String unpublishedCollectionIdIndexName = "unpublished_collectionId_deletedAt_index";
        String publishedCollectionIdIndexName = "published_collectionId_deletedAt_index";

        // Prod index name
        dropIndexIfExists(mongoTemplate, NewAction.class, unpublishedCollectionIdIndexName);
        dropIndexIfExists(mongoTemplate, NewAction.class, "unpublishedAction.collectionId_1_deletedAt_1");
        dropIndexIfExists(mongoTemplate, NewAction.class, publishedCollectionIdIndexName);
        dropIndexIfExists(mongoTemplate, NewAction.class, "publishedAction.collectionId_1_deletedAt_1");

        Document unpublishedDoc = new Document();
        unpublishedDoc.put(NewAction.Fields.unpublishedAction_collectionId, 1);
        unpublishedDoc.put(NewAction.Fields.deletedAt, 1);
        Index unpublishedCollectionIdIndex =
                new CompoundIndexDefinition(unpublishedDoc).named(unpublishedCollectionIdIndexName);
        ensureIndexes(mongoTemplate, NewAction.class, unpublishedCollectionIdIndex);

        Document publishedDoc = new Document();
        publishedDoc.put(NewAction.Fields.publishedAction_collectionId, 1);
        publishedDoc.put(NewAction.Fields.deletedAt, 1);
        Index publishedCollectionIdIndex =
                new CompoundIndexDefinition(publishedDoc).named(publishedCollectionIdIndexName);
        ensureIndexes(mongoTemplate, NewAction.class, publishedCollectionIdIndex);
    }
}
