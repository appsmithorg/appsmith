package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.Organization;
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
        tenantQuery.addCriteria(where(Organization.Fields.slug).is(DEFAULT));
        Organization defaultOrganization = mongoTemplate.findOne(tenantQuery, Organization.class);
        if (defaultOrganization == null) {
            log.error(
                    "No default tenant found. Aborting migration to update policy set to map in tenant Migration061TenantPolicySetToPolicyMap.");
            return;
        }
        // Evict the tenant to avoid any cache inconsistencies
        if (CollectionUtils.isNullOrEmpty(defaultOrganization.getPolicyMap())) {
            Map<String, Policy> policyMap = new HashMap<>();
            defaultOrganization.getPolicies().forEach(policy -> policyMap.put(policy.getPermission(), policy));
            defaultOrganization.setPolicyMap(policyMap);
            mongoTemplate.save(defaultOrganization);
            cacheableRepositoryHelper
                    .evictCachedOrganization(defaultOrganization.getId())
                    .block();
        } else {
            log.info(
                    "Organization already has policyMap set. Skipping migration to update policy set to map in tenant Migration061TenantPolicySetToPolicyMap.");
        }
    }
}
