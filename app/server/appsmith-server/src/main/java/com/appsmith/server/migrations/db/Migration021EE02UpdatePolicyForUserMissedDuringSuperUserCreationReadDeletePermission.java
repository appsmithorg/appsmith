package com.appsmith.server.migrations.db;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.User;
import com.appsmith.server.migrations.utils.AppsmithResources;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.Set;

import static com.appsmith.server.acl.AclPermission.DELETE_USERS;
import static com.appsmith.server.acl.AclPermission.READ_USERS;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.notDeleted;

@Slf4j
@ChangeUnit(
        order = "021-ee-02",
        id = "update-policy-for-user-missed-during-super-user-creation-read-delete-permission",
        author = "")
public class Migration021EE02UpdatePolicyForUserMissedDuringSuperUserCreationReadDeletePermission {

    private final MongoTemplate mongoTemplate;

    public Migration021EE02UpdatePolicyForUserMissedDuringSuperUserCreationReadDeletePermission(
            MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void executionRollback() {}

    @Execution
    public void updatePolicyForUserMissedDuringSuperUserCreation() {
        String instanceAdminRoleId = AppsmithResources.getInstanceAdminRoleId(mongoTemplate);
        String provisioningRoleId = AppsmithResources.getProvisioningRoleId(mongoTemplate);

        Policy deleteUserPolicy = Policy.builder()
                .permission(DELETE_USERS.getValue())
                .permissionGroups(Set.of(instanceAdminRoleId))
                .build();

        // These conditions will make sure that users with NO policies will not be affected by this Migration.
        // We currently have two special users: anonymousUser & provisioningUser, which does not have any policies and
        // hence
        // DELETE USER policy will not be appended to the user policy.
        Criteria criteriaUsersWhereDeleteUsersPermissionDoesNotExist = new Criteria()
                .andOperator(
                        Criteria.where("policies").exists(Boolean.TRUE),
                        Criteria.where("policies").not().size(0),
                        // Only add the DELETE_USERS permission if it doesn't exist already. For a brand-new instance
                        // coming up,
                        // this permission would automatically be added by the migration
                        // `addTenantAdminPermissionsToInstanceAdmin`.
                        // This migration adds this permission to existing instances only.
                        Criteria.where("policies.permission").ne(DELETE_USERS.getValue()),
                        notDeleted());
        // THis condition will make sure that the permissions are being added only to the users whose policies have
        // READ_USERS policy.
        // We currently have two special users: anonymousUser & provisioningUser, which does not have any policies and
        // hence
        // READ_USER policy will not be appended to the user policy.
        Criteria criteriaUsersWhereReadUsersPermissionExists =
                Criteria.where("policies.permission").is(READ_USERS.getValue()).andOperator(notDeleted());

        Update updateAddDeleteUserPolicyToPolicies = new Update();
        updateAddDeleteUserPolicyToPolicies.addToSet("policies", deleteUserPolicy);
        mongoTemplate.updateMulti(
                new Query(criteriaUsersWhereDeleteUsersPermissionDoesNotExist),
                updateAddDeleteUserPolicyToPolicies,
                User.class);

        // Give Instance Administrator Role and Provisioning Role the ability to read users.
        Update updateExistingReadUsersPolicy = new Update();
        updateExistingReadUsersPolicy
                .addToSet("policies.$.permissionGroups")
                .each(provisioningRoleId, instanceAdminRoleId);
        mongoTemplate.updateMulti(
                new Query(criteriaUsersWhereReadUsersPermissionExists), updateExistingReadUsersPolicy, User.class);
    }
}
