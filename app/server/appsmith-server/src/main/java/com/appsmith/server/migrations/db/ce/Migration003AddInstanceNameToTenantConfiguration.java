package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

import java.util.Objects;

import static com.appsmith.server.constants.Appsmith.DEFAULT_INSTANCE_NAME;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_INSTANCE_NAME;
import static com.appsmith.server.constants.FieldName.DEFAULT;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@ChangeUnit(order = "003", id = "add-instance-name-env-variable-tenant-configuration")
public class Migration003AddInstanceNameToTenantConfiguration {
    private final MongoTemplate mongoTemplate;

    public Migration003AddInstanceNameToTenantConfiguration(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void executionRollback() {}

    @Execution
    public void addInstanceNameEnvVarToTenantConfiguration() {
        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(Tenant.Fields.slug).is(DEFAULT));
        Tenant defaultTenant = mongoTemplate.findOne(tenantQuery, Tenant.class);

        // Using default name as Appsmith here.
        String instanceName = StringUtils.defaultIfEmpty(
                System.getenv(String.valueOf(APPSMITH_INSTANCE_NAME)), DEFAULT_INSTANCE_NAME);

        TenantConfiguration defaultTenantConfiguration = new TenantConfiguration();
        if (Objects.nonNull(defaultTenant.getTenantConfiguration())) {
            defaultTenantConfiguration = defaultTenant.getTenantConfiguration();
        }
        defaultTenantConfiguration.setInstanceName(instanceName);
        defaultTenant.setTenantConfiguration(defaultTenantConfiguration);
        mongoTemplate.save(defaultTenant);
    }
}
