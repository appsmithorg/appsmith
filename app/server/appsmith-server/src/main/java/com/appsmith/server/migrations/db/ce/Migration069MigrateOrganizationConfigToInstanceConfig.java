package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.constants.Appsmith;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationConfiguration;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@ChangeUnit(order = "069", id = "migrate-organization-config-to-instance-config", author = "")
public class Migration069MigrateOrganizationConfigToInstanceConfig {

    private final MongoTemplate mongoTemplate;

    public Migration069MigrateOrganizationConfigToInstanceConfig(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {
        // This is a data migration, no rollback required
    }

    @Execution
    public void migrateOrganizationConfigToInstanceConfig() {
        log.info("Starting migration of organization configuration fields to instance config");

        // 1. Fetch the instanceConfig from Config collection
        Query instanceConfigQuery = new Query();
        instanceConfigQuery.addCriteria(where(Config.Fields.name).is(FieldName.INSTANCE_CONFIG));
        Config instanceConfig = mongoTemplate.findOne(instanceConfigQuery, Config.class);

        if (instanceConfig == null) {
            log.error("Instance config not found. Migration cannot proceed.");
            return;
        }

        // 2. Fetch the Organization with its OrganizationConfiguration
        Query organizationQuery = new Query();
        Organization organization = mongoTemplate.findOne(organizationQuery, Organization.class);

        if (organization == null || organization.getOrganizationConfiguration() == null) {
            log.info("No organization or organization configuration found. Nothing to migrate.");
            return;
        }

        // 3. Create instanceVariables JSON object with the required fields
        OrganizationConfiguration orgConfig = organization.getOrganizationConfiguration();
        JSONObject config = instanceConfig.getConfig();
        if (config == null) {
            config = new JSONObject();
        }

        // Create instanceVariables object
        JSONObject instanceVariables = new JSONObject();

        // Copy values from OrganizationConfiguration to instanceVariables
        if (orgConfig.getInstanceName() != null) {
            instanceVariables.put("instanceName", orgConfig.getInstanceName());
        } else {
            instanceVariables.put("instanceName", Appsmith.DEFAULT_INSTANCE_NAME);
        }

        instanceVariables.put("emailVerificationEnabled", orgConfig.getEmailVerificationEnabled());
        instanceVariables.put("googleMapsKey", orgConfig.getGoogleMapsKey());

        // Add instanceVariables to config
        config.put("instanceVariables", instanceVariables);
        instanceConfig.setConfig(config);

        // 4. Save the updated instanceConfig
        mongoTemplate.save(instanceConfig);

        log.info("Successfully migrated organization configuration fields to instance config");
    }
}
