package com.appsmith.server.migrations.db;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.migrations.utils.AppsmithResources;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@ChangeUnit(order = "113-ee", id = "merge-tenant-policies-with-same-permission", author = " ")
public class Migration113EEMergeTenantPoliciesWithSamePermission {
    private final MongoTemplate mongoTemplate;

    public Migration113EEMergeTenantPoliciesWithSamePermission(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void executionRollback() {}

    @Execution
    public void mergeTenantPoliciesWithSamePermission() {
        Tenant defaultTenant = AppsmithResources.getDefaultTenant(mongoTemplate);
        Set<Policy> policies = defaultTenant.getPolicies();

        Map<String, Set<String>> mapPolicyToPermissionGroupIds = new HashMap<>();
        policies.forEach(policy -> {
            if (!mapPolicyToPermissionGroupIds.containsKey(policy.getPermission())) {
                Set<String> permissionGroupIdSet = new HashSet<>();
                mapPolicyToPermissionGroupIds.put(policy.getPermission(), permissionGroupIdSet);
            }
            mapPolicyToPermissionGroupIds.get(policy.getPermission()).addAll(policy.getPermissionGroups());
        });

        Set<Policy> updatedTenantPolicies = mapPolicyToPermissionGroupIds.entrySet().stream()
                .map(entry -> Policy.builder()
                        .permission(entry.getKey())
                        .permissionGroups(entry.getValue())
                        .build())
                .collect(Collectors.toSet());

        defaultTenant.setPolicies(updatedTenantPolicies);

        mongoTemplate.save(defaultTenant);
    }
}
