package com.appsmith.server.migrations.db;

import com.appsmith.external.models.EnvironmentVariable;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;

@Slf4j
@ChangeUnit(order = "101-EE", id="add-index-for-environment-variable", author = " ")
public class Migration101EeEnvVariableIndexes {

    private final MongoTemplate mongoTemplate;
    public Migration101EeEnvVariableIndexes(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollBackExecution() {
    }

    @Execution
    public void addInitialIndexforEnvironmentVariable() {
        // name of each non-archived environment variable should be unique per workspace per environment per datasourceId.
        // envVar name is of the format <ds_name>.<configuration_field_name>
        // i.e. datasource1.HOST_ADDRESS --> this should be unique for each of the environments per workspace if it's non archived
        Index environmentVariableUniqueness = makeIndex("name", "datasourceId", "environmentId", "deletedAt").unique()
                .named("environment_variable_compound_index");
        ensureIndexes(mongoTemplate, EnvironmentVariable.class, environmentVariableUniqueness);
    }

}
