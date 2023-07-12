package com.appsmith.server.migrations.db;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import com.appsmith.server.migrations.utils.AppsmithResources;
import com.appsmith.server.solutions.PolicySolution;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.Map;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.DELETE_USERS;
import static com.appsmith.server.acl.AclPermission.READ_USERS;
import static com.appsmith.server.acl.AclPermission.TENANT_DELETE_ALL_USERS;
import static com.appsmith.server.acl.AclPermission.TENANT_READ_ALL_USERS;
import static com.appsmith.server.acl.AclPermission.TENANT_READ_USER_GROUPS;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.notDeleted;

@ChangeUnit(order = "102-EE", id = "migration-add-delete-user-policy-to-all-users-add-tenant-policy-to-default-tenant")
public class Migration102EeAddDeleteUserPolicyToAllUsersAndAddTenantPolicyToDefaultTenant {
    private final PolicySolution policySolution;
    private final MongoTemplate mongoTemplate;

    public Migration102EeAddDeleteUserPolicyToAllUsersAndAddTenantPolicyToDefaultTenant(
            PolicySolution policySolution, MongoTemplate mongoTemplate) {
        this.policySolution = policySolution;
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void executeRollback() {}

    @Execution
    public void addDeleteUserPolicyToAllUsersAndUpdateTenantWithNewPolicies() {
        String instanceAdminRoleId = AppsmithResources.getInstanceAdminRoleId(mongoTemplate);
        Tenant defaultTenant = AppsmithResources.getDefaultTenant(mongoTemplate);
        Map<String, Policy> tenantDeleteAndReadUsersPolicyMap = Map.of(
                TENANT_DELETE_ALL_USERS.getValue(),
                Policy.builder()
                        .permission(TENANT_DELETE_ALL_USERS.getValue())
                        .permissionGroups(Set.of(instanceAdminRoleId))
                        .build(),
                TENANT_READ_ALL_USERS.getValue(),
                Policy.builder()
                        .permission(TENANT_READ_USER_GROUPS.getValue())
                        .permissionGroups(Set.of(instanceAdminRoleId))
                        .build());
        policySolution.addPoliciesToExistingObject(tenantDeleteAndReadUsersPolicyMap, defaultTenant);
        mongoTemplate.save(defaultTenant);

        Policy deleteUserPolicy = Policy.builder()
                .permission(DELETE_USERS.getValue())
                .permissionGroups(Set.of(instanceAdminRoleId))
                .build();

        // These conditions will make sure that users with NO policies will not be affected by this Migration.
        // We currently have only one special user: anonymousUser, which does not have any policies and hence
        // DELETE USER policy will not be appended to the user policy.
        Criteria criteriaUsersWhereDeleteUsersPermissionDoesNotExist = new Criteria()
                .andOperator(
                        Criteria.where("policies").exists(Boolean.TRUE),
                        Criteria.where("policies").not().size(0),
                        // Only add the DELETE_USERS permission if it doesn't exist already. For a brand new instance
                        // coming up,
                        // this permission would automatically be added by the migration
                        // `addTenantAdminPermissionsToInstanceAdmin`.
                        // This migration adds this permission to existing instances only.
                        Criteria.where("policies.permission").ne(DELETE_USERS.getValue()),
                        notDeleted());
        // THis condition will make sure that the permissions are being added only to the users whose policies have
        // READ_USERS policy.
        // We currently have only one special user: anonymousUser, which does not have any policies and hence
        // READ_USER policy will not be appended to the user policy.
        Criteria criteriaUsersWhereReadUsersPermissionExists =
                Criteria.where("policies.permission").is(READ_USERS.getValue()).andOperator(notDeleted());

        Update updateAddDeleteUserPolicyToPolicies = new Update();
        updateAddDeleteUserPolicyToPolicies.addToSet("policies", deleteUserPolicy);
        mongoTemplate.updateMulti(
                new Query(criteriaUsersWhereDeleteUsersPermissionDoesNotExist),
                updateAddDeleteUserPolicyToPolicies,
                User.class);

        Update updateExistingReadUsersPolicy = new Update();
        updateExistingReadUsersPolicy.addToSet("policies.$.permissionGroups", instanceAdminRoleId);
        mongoTemplate.updateMulti(
                new Query(criteriaUsersWhereReadUsersPermissionExists), updateExistingReadUsersPolicy, User.class);
    }
}
