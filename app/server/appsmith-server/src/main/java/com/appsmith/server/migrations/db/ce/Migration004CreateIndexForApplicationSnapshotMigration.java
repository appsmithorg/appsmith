package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.ApplicationSnapshot;
import com.appsmith.server.domains.QApplicationSnapshot;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@ChangeUnit(order = "004", id="create-index-for-application-snapshot-collection")
public class Migration004CreateIndexForApplicationSnapshotMigration {
    private final MongoTemplate mongoTemplate;

    public Migration004CreateIndexForApplicationSnapshotMigration(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void demoRollbackExecution() {
    }

    @Execution
    public void addIndexOnApplicationIdAndChunkOrder() {
        Index applicationIdChunkOrderUniqueIndex = makeIndex(
                fieldName(QApplicationSnapshot.applicationSnapshot.applicationId),
                fieldName(QApplicationSnapshot.applicationSnapshot.chunkOrder)
        ).named("applicationId_chunkOrder_unique_index").unique();

        ensureIndexes(mongoTemplate, ApplicationSnapshot.class, applicationIdChunkOrderUniqueIndex);
    }
}
