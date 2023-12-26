package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Workspace;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

@Slf4j
@ChangeUnit(order = "041", id = "tag-workspaces-to-migrate-adding-git-permissions", author = " ")
public class Migration041TagWorkspacesForGitOperationsPermissionMigration {

    private final MongoTemplate mongoTemplate;

    public static final String MIGRATION_FLAG_WORKSPACE_WITHOUT_GIT_PERMISSIONS = "tagWorkspacesWithoutGitPermissions";

    public Migration041TagWorkspacesForGitOperationsPermissionMigration(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * mandatory to declare, but we don't have a use-case for this yet.
     */
    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void addPermissionForGitOperationsToExistingWorkspaces() {
        /*
        This migration is going to add a new field to all Workspace objects.
        It will be used in the next migration class to select workspaces whose applications need to be migrated.
        When the exists then the application.policies does not have the new permissions yet and hence need migration.
        This field will be unset once the migration is done.
         */
        Criteria criteria = Criteria.where(FieldName.DELETED_AT).exists(false);
        Query query = Query.query(criteria);

        Update update = new Update();
        update.set(MIGRATION_FLAG_WORKSPACE_WITHOUT_GIT_PERMISSIONS, true);
        mongoTemplate.updateMulti(query, update, Workspace.class);
    }
}
