package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationConfiguration;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

import java.io.IOException;
import java.util.Objects;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@ChangeUnit(order = "055", id = "add-is-atomic-push-allowed-env-variable-tenant-configuration")
public class Migration055AddIsAtomicPushAllowedEnvVarToTenantConfiguration {
    private final MongoTemplate mongoTemplate;

    public Migration055AddIsAtomicPushAllowedEnvVarToTenantConfiguration(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void executionRollback() {}

    @Execution
    public void executeMigration() throws IOException {
        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(Organization.Fields.slug).is("default"));
        Organization defaultOrganization = mongoTemplate.findOne(tenantQuery, Organization.class);

        boolean isAtomicPushAllowed = false;

        OrganizationConfiguration defaultTenantConfiguration = new OrganizationConfiguration();
        if (defaultOrganization == null) {
            throw new IllegalStateException("Default tenant not found");
        }
        if (Objects.nonNull(defaultOrganization.getOrganizationConfiguration())) {
            defaultTenantConfiguration = defaultOrganization.getOrganizationConfiguration();
        }
        defaultTenantConfiguration.setIsAtomicPushAllowed(isAtomicPushAllowed);
        defaultOrganization.setOrganizationConfiguration(defaultTenantConfiguration);
        mongoTemplate.save(defaultOrganization);
    }
}
