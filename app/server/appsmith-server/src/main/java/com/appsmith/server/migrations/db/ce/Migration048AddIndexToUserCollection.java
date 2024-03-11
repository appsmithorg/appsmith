package com.appsmith.server.migrations.db.ce;

import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;

@Slf4j
@ChangeUnit(order = "047", id = "add-missing-index-in-user-collection", author = " ")
public class Migration048AddIndexToUserCollection {

    private final MongoTemplate mongoTemplate;

    public Migration048AddIndexToUserCollection(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    /**
     * Steps of the migration:
     * 0. Find the plugin for Appsmith ai datasource type
     * 1. Find all Appsmith AI datasources without createdAt field created from Migration 045
     * 2. For each datasource, create policies based on default workspace permission groups and application specific permission groups
     * 3. create a datasource storage
     * 4. set createdAt and updatedAt across
     */
    @Execution
    public void addMissingIndexInUserCollection() {}
}
