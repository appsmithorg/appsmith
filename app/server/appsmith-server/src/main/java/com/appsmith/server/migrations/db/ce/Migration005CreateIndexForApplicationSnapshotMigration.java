package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.ApplicationSnapshot;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;

@ChangeUnit(order = "005", id = "create-index-for-application-snapshot-collection")
public class Migration005CreateIndexForApplicationSnapshotMigration {
    private final MongoTemplate mongoTemplate;

    public Migration005CreateIndexForApplicationSnapshotMigration(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void demoRollbackExecution() {}

    @Execution
    public void addIndexOnApplicationIdAndChunkOrder() {
        Index applicationIdChunkOrderUniqueIndex = makeIndex(
                        ApplicationSnapshot.Fields.applicationId, ApplicationSnapshot.Fields.chunkOrder)
                .named("applicationId_chunkOrder_unique_index")
                .unique();

        ensureIndexes(mongoTemplate, ApplicationSnapshot.class, applicationIdChunkOrderUniqueIndex);
    }
}
