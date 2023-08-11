package com.appsmith.server.migrations.db;

import com.appsmith.server.domains.License;
import com.appsmith.server.domains.QTenant;
import com.appsmith.server.domains.Tenant;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.util.StringUtils;

import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@ChangeUnit(order = "021-ee-04", id = "update-license-plan-for-tenant")
public class Migration021EE04UpdateLicensePlanForDefaultTenant {
    private final MongoTemplate mongoTemplate;

    public Migration021EE04UpdateLicensePlanForDefaultTenant(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void executionRollback() {}

    @Execution
    public void updateLicensePlanForTenant() {
        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(fieldName(QTenant.tenant.slug)).is(DEFAULT));
        Tenant defaultTenant = mongoTemplate.findOne(tenantQuery, Tenant.class);
        if (defaultTenant == null) {
            log.debug("Unable to find default tenant");
            return;
        }

        if (isValidLicenseConfiguration(defaultTenant)) {
            License license = defaultTenant.getTenantConfiguration().getLicense();
            license.setPreviousPlan(license.getPlan());
        }
        defaultTenant.setPricingPlan(null);
        mongoTemplate.save(defaultTenant);
    }

    public Boolean isValidLicenseConfiguration(Tenant tenant) {
        return tenant.getTenantConfiguration() != null
                && tenant.getTenantConfiguration().getLicense() != null
                && StringUtils.hasLength(
                        tenant.getTenantConfiguration().getLicense().getKey());
    }
}
