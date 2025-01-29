package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationConfiguration;
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
        tenantQuery.addCriteria(where(Organization.Fields.slug).is(DEFAULT));
        Organization defaultOrganization = mongoTemplate.findOne(tenantQuery, Organization.class);

        // Using default name as Appsmith here.
        String instanceName = StringUtils.defaultIfEmpty(
                System.getenv(String.valueOf(APPSMITH_INSTANCE_NAME)), DEFAULT_INSTANCE_NAME);

        OrganizationConfiguration defaultTenantConfiguration = new OrganizationConfiguration();
        if (Objects.nonNull(defaultOrganization.getOrganizationConfiguration())) {
            defaultTenantConfiguration = defaultOrganization.getOrganizationConfiguration();
        }
        defaultTenantConfiguration.setInstanceName(instanceName);
        defaultOrganization.setOrganizationConfiguration(defaultTenantConfiguration);
        mongoTemplate.save(defaultOrganization);
    }
}
