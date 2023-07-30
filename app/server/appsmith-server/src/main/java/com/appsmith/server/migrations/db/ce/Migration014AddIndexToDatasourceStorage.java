package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.DatasourceStorage;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;

@ChangeUnit(order = "014", id = "index-for-datasource-storage")
public class Migration014AddIndexToDatasourceStorage {

    private final MongoTemplate mongoTemplate;

    public Migration014AddIndexToDatasourceStorage(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {
        // Not getting used here, however it's mandatory to declare
    }

    @Execution
    public void addingIndexToDatasourceStorage() {
        Index datasourceIdAndEnvironmentId = makeIndex("datasourceId", "environmentId", "deletedAt")
                .unique()
                .named("datasource_storage_compound_index");

        ensureIndexes(mongoTemplate, DatasourceStorage.class, datasourceIdAndEnvironmentId);
    }
}
