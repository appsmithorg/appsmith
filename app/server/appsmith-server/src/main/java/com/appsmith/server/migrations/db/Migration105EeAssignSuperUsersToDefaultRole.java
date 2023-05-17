package com.appsmith.server.migrations.db;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QConfig;
import com.appsmith.server.domains.QPermissionGroup;
import com.appsmith.server.domains.QUser;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.EnvVariables.APPSMITH_ADMIN_EMAILS;
import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT_PERMISSION_GROUP;
import static com.appsmith.server.migrations.MigrationHelperMethods.evictPermissionCacheForUsers;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;


/*
 * This migration has been marked as runAlways=true, because when users are added directly via the Admin Emails,
 * the user should be assigned to both Instance Admin Role and Default Role For All Users.
 * The user creation and assignment to Instance Admin Role is taken care of in DatabaseChangelog2.updateSuperUsers.
 * 
 * In this migration, we are only assigning  Default Role For All Users to all the Super Admin Users, which are present in
 * System environment variable APPSMITH_ADMIN_EMAILS.
 */
@Slf4j
@ChangeUnit(order = "105-EE", id="assign-super-users-to-default-role", author = "", runAlways = true)
public class Migration105EeAssignSuperUsersToDefaultRole {
    private final MongoTemplate mongoTemplate;
    private final CacheableRepositoryHelper cacheableRepositoryHelper;

    public Migration105EeAssignSuperUsersToDefaultRole(MongoTemplate mongoTemplate, CacheableRepositoryHelper cacheableRepositoryHelper) {
        this.mongoTemplate = mongoTemplate;
        this.cacheableRepositoryHelper = cacheableRepositoryHelper;
    }

    @RollbackExecution
    public void executionRollback() {
    }

    @Execution
    public void assignAllSuperUsersToDefaultRole() {
        Query queryDefaultRoleForUserConfig = new Query();
        queryDefaultRoleForUserConfig.addCriteria(where(fieldName(QConfig.config1.name)).is(FieldName.DEFAULT_USER_PERMISSION_GROUP));

        Config defaultRoleConfig = mongoTemplate.findOne(queryDefaultRoleForUserConfig, Config.class);
        JSONObject defaultRoleConfigDetails = defaultRoleConfig.getConfig();
        String defaultRoleId = defaultRoleConfigDetails.getAsString(DEFAULT_PERMISSION_GROUP);

        Query queryDefaultRole = new Query();
        queryDefaultRole.addCriteria(where(fieldName(QPermissionGroup.permissionGroup.id)).is(defaultRoleId));

        String adminEmailsStr = System.getenv(String.valueOf(APPSMITH_ADMIN_EMAILS));
        Set<String> adminEmails = TextUtils.csvToSet(adminEmailsStr);
        Set<String> updatedUserIds = adminEmails.stream()
                .map(email -> email.trim())
                .map(String::toLowerCase)
                .map(email -> {
                    Query userQuery = new Query();
                    userQuery.addCriteria(where(fieldName(QUser.user.email)).is(email));
                    User user = mongoTemplate.findOne(userQuery, User.class);
                    return user.getId();
                })
                .collect(Collectors.toSet());

        evictPermissionCacheForUsers(updatedUserIds, mongoTemplate, cacheableRepositoryHelper);
        Update updateAddUsersToDefaultRole = new Update().addToSet(fieldName(QPermissionGroup.permissionGroup.assignedToUserIds)).each(updatedUserIds.toArray());
        mongoTemplate.updateFirst(queryDefaultRole, updateAddUsersToDefaultRole, PermissionGroup.class);
    }
}
