package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.migrations.solutions.UpdateSuperUserMigrationHelper;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.solutions.PolicySolution;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.EnvVariables.APPSMITH_ADMIN_EMAILS;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT_PERMISSION_GROUP;
import static com.appsmith.server.helpers.CollectionUtils.findSymmetricDiff;
import static com.appsmith.server.migrations.MigrationHelperMethods.evictPermissionCacheForUsers;
import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * The order of this migration is set to 10000 so that it always gets executed at the end.
 * This ensures that any permission changes for super users happen once all other migrations are completed.
 */
@Slf4j
@ChangeUnit(order = "10000", id = "update-super-users", author = "", runAlways = true)
public class Migration10000_UpdateSuperUser {

    private final MongoTemplate mongoTemplate;
    private final CacheableRepositoryHelper cacheableRepositoryHelper;
    private final PolicySolution policySolution;
    private final PolicyGenerator policyGenerator;
    private final UpdateSuperUserMigrationHelper updateSuperUserMigrationHelper;

    public Migration10000_UpdateSuperUser(
            MongoTemplate mongoTemplate,
            CacheableRepositoryHelper cacheableRepositoryHelper,
            PolicySolution policySolution,
            PolicyGenerator policyGenerator) {
        this.mongoTemplate = mongoTemplate;
        this.cacheableRepositoryHelper = cacheableRepositoryHelper;
        this.policySolution = policySolution;
        this.policyGenerator = policyGenerator;
        this.updateSuperUserMigrationHelper = new UpdateSuperUserMigrationHelper();
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void executeMigration() {
        // Read the admin emails from the environment and update the super users accordingly
        String adminEmailsStr = System.getenv(String.valueOf(APPSMITH_ADMIN_EMAILS));

        Set<String> adminEmails = TextUtils.csvToSet(adminEmailsStr);

        Query instanceConfigurationQuery = new Query();
        instanceConfigurationQuery.addCriteria(where(Config.Fields.name).is(FieldName.INSTANCE_CONFIG));
        Config instanceAdminConfiguration = mongoTemplate.findOne(instanceConfigurationQuery, Config.class);

        String instanceAdminPermissionGroupId =
                (String) instanceAdminConfiguration.getConfig().get(DEFAULT_PERMISSION_GROUP);

        Query instanceAdminPgQuery = new Query();
        instanceAdminPgQuery
                .addCriteria(where(PermissionGroup.Fields.id).is(instanceAdminPermissionGroupId))
                .fields()
                .include(PermissionGroup.Fields.assignedToUserIds);
        PermissionGroup instanceAdminPG = mongoTemplate.findOne(instanceAdminPgQuery, PermissionGroup.class);

        Query organizationQuery = new Query();
        organizationQuery.addCriteria(where(Organization.Fields.slug).is("default"));
        Organization organization = mongoTemplate.findOne(organizationQuery, Organization.class);

        // Find the default organization admin permission group
        Query orgAdminPermissionGroupQuery = new Query();
        orgAdminPermissionGroupQuery.addCriteria(
                where(PermissionGroup.Fields.defaultDomainType).is(Organization.class.getSimpleName()));
        orgAdminPermissionGroupQuery.addCriteria(
                where(PermissionGroup.Fields.defaultDomainId).is(organization.getId()));

        Set<String> userIds = adminEmails.stream()
                .map(email -> email.trim())
                .map(String::toLowerCase)
                .map(email -> {
                    Query userQuery = new Query();
                    userQuery.addCriteria(where(User.Fields.email).is(email));
                    User user = mongoTemplate.findOne(userQuery, User.class);

                    if (user == null) {
                        log.info("Creating super user with username {}", email);
                        user = updateSuperUserMigrationHelper.createNewUser(
                                email, organization, instanceAdminPG, mongoTemplate, policySolution, policyGenerator);
                    }

                    return user.getId();
                })
                .collect(Collectors.toSet());

        Set<String> oldSuperUsers = instanceAdminPG.getAssignedToUserIds();
        Set<String> updatedUserIds = findSymmetricDiff(oldSuperUsers, userIds);
        evictPermissionCacheForUsers(updatedUserIds, mongoTemplate, cacheableRepositoryHelper);

        // Assign the users to the instance admin pg
        Update update = new Update().set(PermissionGroup.Fields.assignedToUserIds, userIds);
        mongoTemplate.updateFirst(instanceAdminPgQuery, update, PermissionGroup.class);

        // Assign the users to the default organization admin pg
        Update orgAdminUpdate = new Update().set(PermissionGroup.Fields.assignedToUserIds, userIds);
        mongoTemplate.updateFirst(orgAdminPermissionGroupQuery, orgAdminUpdate, PermissionGroup.class);

        // Assign all super users to the default role
        updateSuperUserMigrationHelper.assignAllSuperUsersToDefaultRole(
                userIds, mongoTemplate, cacheableRepositoryHelper);
    }
}
