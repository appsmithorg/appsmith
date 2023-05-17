package com.appsmith.server.migrations.db;

import com.appsmith.server.domains.QWorkspace;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.mongodb.client.result.UpdateResult;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.notDeleted;
import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * @implNote This is a helper migration for {@link Migration103EeAddInviteUsersApplicationPolicyToApplicationPolicies}.
 * This will set the {@code migrationFlag} - "flagForApplicationPolicyMigration" to {@code true} in workspaces.
 * This flag will now be used in the next migration to query only the workspaces which haven't been migrated.
 */
@Slf4j
@ChangeUnit(order = "102-EE", id="add-flag-to-workspace-before-invite-users-policy-to-application-policy-migration", author = " ")
public class Migration102EeAddFlagToWorkspaceBeforeInviteUsersPolicyToApplicationPolicyMigration {
    private final MongoTemplate mongoTemplate;
    public static final String migrationFlag = "flagForApplicationPolicyMigration";
    private static final int migrationRetries = 5;
    private static final String migrationId = "add-flag-to-workspace-before-invite-users-policy-to-application-policy-migration";
    private static final String migrationNote = "This will not have any adverse effects on the Data. Restarting the " +
            "server will begin the migration from where it left.";

    public Migration102EeAddFlagToWorkspaceBeforeInviteUsersPolicyToApplicationPolicyMigration(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void executionRollback() {
    }

    @Execution
    public void setFlagInWorkspaceForEnvironmentMigration() {
        int migrationAttempt = 1;
        Criteria criteriaWorkspacesToBeUpdatedWithFlag = where(migrationFlag).exists(false)
                .andOperator(notDeleted(),
                        where(fieldName(QWorkspace.workspace.defaultPermissionGroups)).exists(true),
                        where(fieldName(QWorkspace.workspace.defaultPermissionGroups)).not().size(0));
        Criteria criteriaWorkspacesUpdatedWithFlag = where(migrationFlag).exists(true)
                .andOperator(notDeleted(),
                        where(fieldName(QWorkspace.workspace.defaultPermissionGroups)).exists(true),
                        where(fieldName(QWorkspace.workspace.defaultPermissionGroups)).not().size(0));

        Query queryWorkspacesToBeUpdatedWithFlag = new Query().addCriteria(criteriaWorkspacesToBeUpdatedWithFlag);
        Query queryWorkspacesUpdatedWithFlag = new Query().addCriteria(criteriaWorkspacesUpdatedWithFlag);

        Update updateSetMigrationFlag = new Update().set(migrationFlag, true);

        long countWorkspacesToBeUpdated = mongoTemplate.count(queryWorkspacesToBeUpdatedWithFlag, Workspace.class);
        long countWorkspacesUpdated = 0;

        log.debug("Count of workspaces where flag needs to be set: {}. Query used: {}", countWorkspacesToBeUpdated, queryWorkspacesToBeUpdatedWithFlag);
        while (migrationAttempt <= migrationRetries && countWorkspacesUpdated != countWorkspacesToBeUpdated) {
            log.debug("Migration attempt: {}, Maximum Retries: {}", migrationAttempt, migrationRetries);
            UpdateResult updateResult = mongoTemplate.updateMulti(queryWorkspacesToBeUpdatedWithFlag, updateSetMigrationFlag, Workspace.class);

            log.debug("Update result: {}", updateResult);
            migrationAttempt += 1;
            countWorkspacesUpdated = mongoTemplate.count(queryWorkspacesUpdatedWithFlag, Workspace.class);
        }
        log.debug("Count of workspaces where flag has been set: {}. Query used: {}", countWorkspacesUpdated, queryWorkspacesUpdatedWithFlag);

        if (countWorkspacesUpdated != countWorkspacesToBeUpdated) {
            String reasonForFailure = "Failed to update all the workspaces with the migration flag";
            throw new AppsmithException(AppsmithError.MIGRATION_FAILED, migrationId, reasonForFailure, migrationNote);
        }
    }
}
