package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

@Slf4j
@ChangeUnit(order = "039", id = "add-permissions-for-git-operations", author = " ")
public class Migration039TagApplicationsForGitOperationsPermissionMigration {

    private final MongoTemplate mongoTemplate;

    public static final String MIGRATION_FLAG_039_TAG_APPLICATIONS_WITHOUT_GIT_PERMISSIONS =
            "tagApplicationsWithoutGitPermissions";

    public Migration039TagApplicationsForGitOperationsPermissionMigration(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * mandatory to declare, but we don't have a use-case for this yet.
     */
    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void addPermissionForGitOperationsToExistingApplications() {
        /*
        This migration is going to add a new field to all Application objects.
        This field will indicate whether the new git permissions have been added to application's policies or not.
        The flag exists means the application.policies does not have the new permissions yet and hence need migration.
        In the next migration, this field will be used to select which application object should be migrated.
        This field will be unset once the migration is done.
         */
        Criteria criteria = Criteria.where(FieldName.DELETED_AT).exists(false);
        Query query = Query.query(criteria);

        Update update = new Update();
        update.set(MIGRATION_FLAG_039_TAG_APPLICATIONS_WITHOUT_GIT_PERMISSIONS, true);
        mongoTemplate.updateMulti(query, update, Application.class);
    }
}
