package com.appsmith.server.migrations.db;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.migrations.utils.AppsmithResources;
import com.appsmith.server.solutions.PolicySolution;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.util.Map;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.TENANT_READ_ALL_USERS;

@ChangeUnit(order = "103-EE", id = "migration-fix-migration-102-EE-tenant-read-all-users-policy-to-default-tenant")
public class Migration103EeFixEe102DeleteUserTenantPolicy {
    private final PolicySolution policySolution;
    private final MongoTemplate mongoTemplate;

    public Migration103EeFixEe102DeleteUserTenantPolicy(PolicySolution policySolution, MongoTemplate mongoTemplate) {
        this.policySolution = policySolution;
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void executeRollback() {}

    @Execution
    public void fixTenantPolicyWithTenantReadAllUsers() {
        String instanceAdminRoleId = AppsmithResources.getInstanceAdminRoleId(mongoTemplate);
        Tenant defaultTenant = AppsmithResources.getDefaultTenant(mongoTemplate);

        Map<String, Policy> tenantDeleteAndReadUsersPolicyMap = Map.of(
                TENANT_READ_ALL_USERS.getValue(),
                Policy.builder()
                        .permission(TENANT_READ_ALL_USERS.getValue())
                        .permissionGroups(Set.of(instanceAdminRoleId))
                        .build());

        policySolution.addPoliciesToExistingObject(tenantDeleteAndReadUsersPolicyMap, defaultTenant);
        mongoTemplate.save(defaultTenant);
    }
}
