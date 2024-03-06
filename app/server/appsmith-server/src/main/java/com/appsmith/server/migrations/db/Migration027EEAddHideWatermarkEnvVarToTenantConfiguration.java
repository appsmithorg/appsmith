package com.appsmith.server.migrations.db;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

import java.io.IOException;
import java.nio.file.NoSuchFileException;
import java.util.Objects;

import static com.appsmith.server.migrations.db.ce.Migration021MoveGoogleMapsKeyToTenantConfiguration.commentEnvInFile;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@ChangeUnit(order = "027-ee-01", id = "add-hide-watermark-env-variable-tenant-configuration")
public class Migration027EEAddHideWatermarkEnvVarToTenantConfiguration {
    private final MongoTemplate mongoTemplate;

    private final CommonConfig commonConfig;

    public Migration027EEAddHideWatermarkEnvVarToTenantConfiguration(
            MongoTemplate mongoTemplate, CommonConfig commonConfig) {
        this.mongoTemplate = mongoTemplate;
        this.commonConfig = commonConfig;
    }

    @RollbackExecution
    public void executionRollback() {}

    @Execution
    public void executeMigration() throws IOException {
        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(Tenant.Fields.slug).is("default"));
        Tenant defaultTenant = mongoTemplate.findOne(tenantQuery, Tenant.class);

        final String envName = "APPSMITH_HIDE_WATERMARK";
        boolean hideWatermarkEnabled = Boolean.parseBoolean(System.getenv(envName));

        TenantConfiguration defaultTenantConfiguration = new TenantConfiguration();
        assert defaultTenant != null : "Default tenant not found";
        if (Objects.nonNull(defaultTenant.getTenantConfiguration())) {
            defaultTenantConfiguration = defaultTenant.getTenantConfiguration();
        }
        defaultTenantConfiguration.setHideWatermark(hideWatermarkEnabled);
        defaultTenant.setTenantConfiguration(defaultTenantConfiguration);
        mongoTemplate.save(defaultTenant);

        try {
            commentEnvInFile(envName, commonConfig.getEnvFilePath());
        } catch (IOException e) {
            if (e instanceof NoSuchFileException) {
                log.debug("Env file not found, skipping commenting env variable: {}", envName);
            } else {
                log.debug("Error while commenting env variable in file", e);
            }
        }
    }
}
