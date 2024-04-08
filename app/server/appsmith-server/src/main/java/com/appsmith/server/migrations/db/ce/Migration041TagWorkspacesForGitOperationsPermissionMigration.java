package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
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

    public static final String MIGRATION_FLAG_TAG_WITHOUT_GIT_PERMISSIONS = "tagWithoutGitPermissions";

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
        This migration is going to add a new field to all Workspace and Application objects.
        It will be used in the next migration class to select workspaces and applications that need to be migrated.
        If workspace has this flag set, it means all the applications of this workspace have not been migrated.
        If application has this flag set, it means this application does not have all new policies added.
        This field will be unset once the migration is done on workspae and application.
         */
        Criteria criteria = Criteria.where(FieldName.DELETED_AT).exists(false);
        Query query = new Query(criteria);

        Update update = new Update();
        update.set(MIGRATION_FLAG_TAG_WITHOUT_GIT_PERMISSIONS, true);

        // set tag to the workspaces
        mongoTemplate.updateMulti(query, update, Workspace.class);

        // set tag to the applications
        mongoTemplate.updateMulti(query, update, Application.class);
    }
}
