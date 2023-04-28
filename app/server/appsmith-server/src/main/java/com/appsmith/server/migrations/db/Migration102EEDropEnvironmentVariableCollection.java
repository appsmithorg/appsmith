package com.appsmith.server.migrations.db;

import com.appsmith.server.constants.FieldName;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;

@Slf4j
@ChangeUnit(order = "102-EE", id="drop-environment-variable-collection", author = " ")
public class Migration102EEDropEnvironmentVariableCollection {

    private final MongoTemplate mongoTemplate;
    public Migration102EEDropEnvironmentVariableCollection(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollBackExecution() {
    }

    @Execution
    public void dropEnvironmentVariableCollection() {
        // Since the implementation of phase 2 of multiple environment steers away from environment variable concept,
        // The environment variable collection is obsolete, hence it's being removed from the collection
        mongoTemplate.dropCollection(FieldName.ENVIRONMENT_VARIABLE);
    }

}

