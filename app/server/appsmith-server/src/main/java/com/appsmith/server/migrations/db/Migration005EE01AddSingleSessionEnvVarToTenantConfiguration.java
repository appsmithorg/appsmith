package com.appsmith.server.migrations.db;

import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

import java.util.Objects;

import static com.appsmith.server.constants.EnvVariables.APPSMITH_ENABLE_SINGLE_SESSION_PER_USER;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@ChangeUnit(order = "005-ee-01", id = "add-single-session-env-variable-tenant-configuration")
public class Migration005EE01AddSingleSessionEnvVarToTenantConfiguration {
    private final MongoTemplate mongoTemplate;

    public Migration005EE01AddSingleSessionEnvVarToTenantConfiguration(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void executionRollback() {}

    @Execution
    public void addSingleSessionEnvVarToTenantConfiguration() {
        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(Tenant.Fields.slug).is("default"));
        Tenant defaultTenant = mongoTemplate.findOne(tenantQuery, Tenant.class);

        boolean singleSessionPerUserEnabled =
                Boolean.parseBoolean(System.getenv(String.valueOf(APPSMITH_ENABLE_SINGLE_SESSION_PER_USER)));

        TenantConfiguration defaultTenantConfiguration = new TenantConfiguration();
        if (Objects.nonNull(defaultTenant.getTenantConfiguration())) {
            defaultTenantConfiguration = defaultTenant.getTenantConfiguration();
        }
        defaultTenantConfiguration.setSingleSessionPerUserEnabled(singleSessionPerUserEnabled);
        defaultTenant.setTenantConfiguration(defaultTenantConfiguration);
        mongoTemplate.save(defaultTenant);
    }
}
