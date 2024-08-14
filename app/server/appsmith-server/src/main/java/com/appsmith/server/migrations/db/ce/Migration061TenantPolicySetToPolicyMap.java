package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

import java.util.HashMap;
import java.util.Map;

import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@ChangeUnit(order = "061", id = "migrate-policy-set-to-map-tenant", author = " ")
public class Migration061TenantPolicySetToPolicyMap {
    private final MongoTemplate mongoTemplate;
    private final CacheableRepositoryHelper cacheableRepositoryHelper;

    public Migration061TenantPolicySetToPolicyMap(
            MongoTemplate mongoTemplate, CacheableRepositoryHelper cacheableRepositoryHelper) {
        this.mongoTemplate = mongoTemplate;
        this.cacheableRepositoryHelper = cacheableRepositoryHelper;
    }

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void executeMigration() {
        // Fetch default tenant and verify earlier migration has updated the policyMap field
        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(Tenant.Fields.slug).is(DEFAULT));
        Tenant defaultTenant = mongoTemplate.findOne(tenantQuery, Tenant.class);
        if (defaultTenant == null) {
            log.error(
                    "No default tenant found. Aborting migration to update policy set to map in tenant Migration061TenantPolicySetToPolicyMap.");
            return;
        }
        // Evict the tenant to avoid any cache inconsistencies
        if (CollectionUtils.isNullOrEmpty(defaultTenant.getPolicyMap())) {
            Map<String, Policy> policyMap = new HashMap<>();
            defaultTenant.getPolicies().forEach(policy -> policyMap.put(policy.getPermission(), policy));
            defaultTenant.setPolicyMap(policyMap);
            mongoTemplate.save(defaultTenant);
            cacheableRepositoryHelper.evictCachedTenant(defaultTenant.getId()).block();
        } else {
            log.info(
                    "Tenant already has policyMap set. Skipping migration to update policy set to map in tenant Migration061TenantPolicySetToPolicyMap.");
        }
    }
}
