package com.appsmith.server.migrations.ce;

import com.appsmith.external.helpers.JsonForDatabase;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.migrations.AppsmithJavaMigration;
import com.appsmith.server.migrations.RepositoryHelperMethods;
import org.apache.commons.lang3.StringUtils;
import org.springframework.jdbc.core.JdbcTemplate;

import static com.appsmith.server.constants.Appsmith.DEFAULT_INSTANCE_NAME;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_INSTANCE_NAME;

public class V006__createDefaultTenant extends AppsmithJavaMigration {

    @Override
    public void migrate(JdbcTemplate jdbcTemplate) throws Exception {
        RepositoryHelperMethods helperMethods = new RepositoryHelperMethods(jdbcTemplate);
        if (!StringUtils.isBlank(helperMethods.getDefaultTenantId())) {
            return;
        }
        // Using default name as Appsmith here.
        String instanceName = StringUtils.defaultIfEmpty(
                System.getenv(String.valueOf(APPSMITH_INSTANCE_NAME)), DEFAULT_INSTANCE_NAME);

        TenantConfiguration defaultTenantConfiguration = new TenantConfiguration();
        defaultTenantConfiguration.setInstanceName(instanceName);
        String tenantConfigurationJson = JsonForDatabase.writeValueAsString(defaultTenantConfiguration);
        jdbcTemplate.update(
                "INSERT INTO tenant (id, slug, display_name, pricing_plan, tenant_configuration, created_at, updated_at) VALUES (gen_random_uuid(), 'default', 'Default', 'FREE', cast (? as jsonb), now(), now())",
                tenantConfigurationJson);
    }
}
