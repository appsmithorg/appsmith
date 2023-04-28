package com.appsmith.server.migrations.db;

import com.appsmith.external.models.Policy;
import com.appsmith.external.models.QBaseDomain;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.QApplication;
import com.appsmith.server.domains.QWorkspace;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.mongodb.client.result.UpdateResult;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.UncategorizedMongoDbException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.List;

import static com.appsmith.server.acl.AclPermission.INVITE_USERS_APPLICATIONS;
import static com.appsmith.server.migrations.db.Migration102EeAddFlagToWorkspaceBeforeInviteUsersPolicyToApplicationPolicyMigration.migrationFlag;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.notDeleted;
import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * @implNote The migration makes use of a {@code migrationFlag} - "flagForApplicationPolicyMigration" from
 * {@link Migration102EeAddFlagToWorkspaceBeforeInviteUsersPolicyToApplicationPolicyMigration} to filter all the
 * workspaces which haven't been migrated.
 * Now the migration will only happen for these workspaces, and all applications within these workspaces will be updated
 * to have inviteUsers:applications permission in their policies.
 */
@Slf4j
@ChangeUnit(order = "103-EE", id="add-invite-users-application-policy-to-application-policy", author = " ")
public class Migration103EeAddInviteUsersApplicationPolicyToApplicationPolicies {

    private final MongoTemplate mongoTemplate;
    private static final int migrationRetries = 5;
    private static final String migrationId = "add-invite-users-application-policy-to-application-policy";
    private static final String migrationNote = "This will not have any adverse effects on the Data. Restarting the " +
            "server will begin the migration from where it left.";

    public Migration103EeAddInviteUsersApplicationPolicyToApplicationPolicies(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollBackExecution() {
    }

    @Execution
    public void addInviteUsersApplicationPolicyToApplicationPolicy() {
        /*
         * Step 1: Find Default Permission Group Ids for all non-deleted workspaces for which the migration flag is set.
         * All the steps will now happen inside for loop.
         * Step 2: For each workspace, now there can exist two type of application resources: applications which don't
         * have inviteUsers:applications policy, and those which do.
         * For application resources, which don't contain the inviteUsers:application policy, we will add a policy
         * with all the default workspace permission group ids.
         * Now, these applications which do have the inviteUsers:application, either these would be new application
         * resources, and these will contain all the default workspace permission group ids in this policy, or those
         * applications which would have been shared via application share modal, which will only contain the default
         * application roles in the policy. We are not differentiating between these 2 types of application resources,
         * and adding the default workspace permission group ids to both the types, because otherwise we will have
         * to add additional queries for fetching individual application and check for existing permission.
         * Step 3: With an UpdateMulti, append the inviteUsers:application policy to the existing policies in
         * application resources.
         * Step 4: With an UpdateMulti, update the existing inviteUsers:applications policy with the default workspace
         * permission group ids.
         * Step 5: Dp an UpdateFirst on workspace to unset the migrationFlag. This would mean that the migration for all
         * applications inside the workspace happened successfully.
         */
        List<String> includedFields = List.of(fieldName(QWorkspace.workspace.id), fieldName(QWorkspace.workspace.defaultPermissionGroups));
        Criteria notDeletedMigrationFlagCriteria = new Criteria().andOperator(notDeleted(),
                where(migrationFlag).is(true),
                where(fieldName(QWorkspace.workspace.defaultPermissionGroups)).exists(true),
                where(fieldName(QWorkspace.workspace.defaultPermissionGroups)).not().size(0)
        );
        Query workspaceQuery = new Query()
                .addCriteria(notDeletedMigrationFlagCriteria)
                .cursorBatchSize(1024);
        /*
         * So here we are going to perform a check which will help us understand whether we can use a performant query
         * to find all the workspaces where applications need to migrate or not.
         *
         * We are doing this because Free tier and Shared clusters for MongoDB Atlas have an operational limitation that
         * they can't use the noTimeout cursor, as has been mentioned in the Atlas reference here
         * https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/#operational-limitations
         *
         * Due to this, we are performing a sample limit(1) query on workspace with the noCursorTimeout with
         * MongoTemplate$stream to verify if the performant query can be run or not. If yes, we will go forward with
         * using that, other go with using a regular batched query without noCursorTimeout.
         *
         * When we say that the query is not performant enough, this is what we mean:
         * Without noCursorTimeout on EC2 instance with production snapshot, to migrate ~21k applications, it took
         * 3hrs 15mins. To put that to perspective, it took ~15mins to migrate ~1.5lac applications with the noCursorTimeout.
         */
        try {
            log.debug("Check if performant workspace query can be used.");
            Query workspaceQueryBatchedPerformant = Query.of(workspaceQuery).noCursorTimeout();
            Query workspaceQueryBatchedPerformantLimit1 = Query.of(workspaceQueryBatchedPerformant).limit(1);
            mongoTemplate.stream(workspaceQueryBatchedPerformantLimit1, Workspace.class)
                    .forEach(workspace -> log.debug("Workspace ID: {}", workspace.getId()));
            log.debug("Using performant query.");
            workspaceQuery = workspaceQueryBatchedPerformant;

        } catch (UncategorizedMongoDbException uncategorizedMongoDbException) {
            log.debug("Using non-performant query");
        }


        Query finalWorkspaceQuery = workspaceQuery;
        includedFields.forEach(field -> finalWorkspaceQuery.fields().include(field));
        long countWorkspacesWhereApplicationsWillBeMigrated = mongoTemplate.count(workspaceQuery, Workspace.class);
        log.debug("Count of workspaces where applications will be migrated: {}, Query used: {}", countWorkspacesWhereApplicationsWillBeMigrated, workspaceQuery);

        mongoTemplate.stream(finalWorkspaceQuery, Workspace.class)
                .forEach(this::migrateApplicationsInWorkspace);
    }

    private void migrateApplicationsInWorkspace(Workspace workspace) {
        int migrationAttempt = 1;
        Policy inviteUsersApplicationPolicy = Policy.builder()
                .permission(INVITE_USERS_APPLICATIONS.getValue())
                .permissionGroups(workspace.getDefaultPermissionGroups())
                .build();

        Criteria criteriaWorkspaceId = where(fieldName(QApplication.application.workspaceId)).is(workspace.getId());
        Criteria criteriaAllApplicationsToBeUpdated = criteriaWorkspaceId.andOperator(notDeleted());
        Criteria criteriaApplicationsWhereInviteUsersPermissionExists = Criteria.where("policies.permission").is(INVITE_USERS_APPLICATIONS.getValue())
                .andOperator(criteriaWorkspaceId, notDeleted());
        Criteria criteriaApplicationsWhereInviteUsersPermissionDoesNotExist = Criteria.where("policies.permission").ne(INVITE_USERS_APPLICATIONS.getValue())
                .andOperator(criteriaWorkspaceId, notDeleted());
        Criteria criteriaApplicationsWhichHaveInviteUsersPermissionWithWorkspacePermissionGroup = Criteria.where(fieldName(QBaseDomain.baseDomain.policies))
                .elemMatch(Criteria.where("permissionGroups").in(workspace.getDefaultPermissionGroups())
                        .and("permission").is(INVITE_USERS_APPLICATIONS.getValue()))
                .andOperator(criteriaWorkspaceId, notDeleted());

        Query queryAllApplicationsToBeUpdated = new Query().addCriteria(criteriaAllApplicationsToBeUpdated);
        Query queryApplicationsWhereInviteUsersPermissionExists = new Query().addCriteria(criteriaApplicationsWhereInviteUsersPermissionExists);
        Query queryApplicationsWhereInviteUsersPermissionDoesNotExist = new Query().addCriteria(criteriaApplicationsWhereInviteUsersPermissionDoesNotExist);
        Query queryApplicationsWhichHaveInviteUsersPermissionWithWorkspacePermissionGroup = new Query().addCriteria(criteriaApplicationsWhichHaveInviteUsersPermissionWithWorkspacePermissionGroup);

        Update updateAddInviteUsersToApplicationsPolicy = new Update();
        updateAddInviteUsersToApplicationsPolicy.addToSet(fieldName(QApplication.application.policies), inviteUsersApplicationPolicy);
        Update updateExistingInviteUsersToApplicationPolicy = new Update();
        updateExistingInviteUsersToApplicationPolicy.addToSet("policies.$.permissionGroups").each(workspace.getDefaultPermissionGroups().toArray());

        long countAllApplicationsToBeUpdated = mongoTemplate.count(queryAllApplicationsToBeUpdated, Application.class);
        long countApplicationsWhichHaveInviteUsersPermissionWithWorkspacePermissionGroup = 0;

        while (migrationAttempt <= migrationRetries &&
                countApplicationsWhichHaveInviteUsersPermissionWithWorkspacePermissionGroup != countAllApplicationsToBeUpdated) {

            mongoTemplate.updateMulti(queryApplicationsWhereInviteUsersPermissionExists, updateExistingInviteUsersToApplicationPolicy, Application.class);

            mongoTemplate.updateMulti(queryApplicationsWhereInviteUsersPermissionDoesNotExist, updateAddInviteUsersToApplicationsPolicy, Application.class);

            countApplicationsWhichHaveInviteUsersPermissionWithWorkspacePermissionGroup = mongoTemplate.count(queryApplicationsWhichHaveInviteUsersPermissionWithWorkspacePermissionGroup, Application.class);

            migrationAttempt += 1;
        }

        if (countApplicationsWhichHaveInviteUsersPermissionWithWorkspacePermissionGroup != countAllApplicationsToBeUpdated) {
            String reasonForFailure = "Failed to update policies for all the applications for workspaceId " + workspace.getId();
            throw new AppsmithException(AppsmithError.MIGRATION_FAILED, migrationId, reasonForFailure, migrationNote);
        }
        // Unset the Migration flag to signify that the migration for all applications in this workspace succeeded.
        Query workspaceIdQuery = new Query().addCriteria(where(fieldName(QWorkspace.workspace.id)).is(workspace.getId()));
        mongoTemplate.updateFirst(workspaceIdQuery, new Update().unset(migrationFlag), Workspace.class);
    }

}
