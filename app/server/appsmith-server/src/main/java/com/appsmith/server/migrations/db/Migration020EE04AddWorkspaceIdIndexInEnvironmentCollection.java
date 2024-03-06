package com.appsmith.server.migrations.db;

import com.appsmith.external.models.Environment;
import com.appsmith.server.constants.FieldName;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;

import static com.appsmith.server.migrations.DatabaseChangelog1.dropIndexIfExists;
import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;

@ChangeUnit(order = "020-ee-04", id = "add-ws-id-index-to-environment")
public class Migration020EE04AddWorkspaceIdIndexInEnvironmentCollection {

    private final MongoTemplate mongoTemplate;

    private static final String workspaceIdIndexName = "environment_wsId_deleted_deletedAt";

    public Migration020EE04AddWorkspaceIdIndexInEnvironmentCollection(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollBackExecution() {
        // We don't need a rollback strategy because we don't care about this value anymore
    }

    @Execution
    public void executeMigration() {
        dropIndexIfExists(mongoTemplate, Environment.class, workspaceIdIndexName);

        ensureIndexes(
                mongoTemplate,
                Environment.class,
                makeIndex(FieldName.WORKSPACE_ID, FieldName.DELETED, FieldName.DELETED_AT)
                        .named(workspaceIdIndexName));
    }
}
