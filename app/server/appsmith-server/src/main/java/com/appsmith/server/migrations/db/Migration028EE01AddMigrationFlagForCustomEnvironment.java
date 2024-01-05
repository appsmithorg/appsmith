package com.appsmith.server.migrations.db;

import com.appsmith.external.models.Environment;
import com.appsmith.server.domains.Workspace;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.notDeleted;

@ChangeUnit(order = "028-ee-01", id = "add-migration-flags-custom-envs-rerun", author = " ")
public class Migration028EE01AddMigrationFlagForCustomEnvironment {

    private final MongoTemplate mongoTemplate;

    protected static final String CUSTOM_ENVIRONMENT_MIGRATION_FLAG = "customEnvMigrationFlag";

    public Migration028EE01AddMigrationFlagForCustomEnvironment(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackMethod() {}

    @Execution
    public void addMigrationFlags() {
        Query workspaceQuery = new Query().addCriteria(workspaceSelectionCriteria());
        Update workspaceFlagUpdate = new Update().set(CUSTOM_ENVIRONMENT_MIGRATION_FLAG, false);
        mongoTemplate.updateMulti(workspaceQuery, workspaceFlagUpdate, Workspace.class);

        Query environmentQuery = new Query().addCriteria(environmentSelectionCriteria());
        Update environmentFlagUpdate = new Update().set(CUSTOM_ENVIRONMENT_MIGRATION_FLAG, false);
        mongoTemplate.updateMulti(environmentQuery, environmentFlagUpdate, Environment.class);
    }

    private static Criteria workspaceSelectionCriteria() {
        return notDeleted();
    }

    private static Criteria environmentSelectionCriteria() {
        return notDeleted();
    }
}
