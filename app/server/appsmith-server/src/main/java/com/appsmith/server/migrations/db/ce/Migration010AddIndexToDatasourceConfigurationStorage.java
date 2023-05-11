package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.DatasourceConfigurationStorage;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;

@ChangeUnit(order="010", id="index-for-datasource-configuration-storage")
public class Migration010AddIndexToDatasourceConfigurationStorage {

    private final MongoTemplate mongoTemplate;
    public Migration010AddIndexToDatasourceConfigurationStorage(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {
        // Not getting used here, however it's mandatory to declare
    }

    @Execution
    public void addingIndexToDatasourceConfigurationStorage() {
        Index datasourceIdAndEnvironmentId = makeIndex("datasourceId", "environmentId", "deletedAt").unique()
                .named("datasource_configuration_storage_compound_index");

        ensureIndexes(mongoTemplate, DatasourceConfigurationStorage.class, datasourceIdAndEnvironmentId);
    }
}
