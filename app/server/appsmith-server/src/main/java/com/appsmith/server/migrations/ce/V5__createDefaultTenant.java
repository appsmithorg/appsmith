package com.appsmith.server.migrations.ce;

import com.appsmith.server.migrations.AppsmithJavaMigration;
import com.appsmith.server.migrations.RepositoryHelperMethods;
import org.apache.commons.lang3.StringUtils;
import org.springframework.jdbc.core.JdbcTemplate;

public class V5__createDefaultTenant extends AppsmithJavaMigration {

    @Override
    public void migrate(JdbcTemplate jdbcTemplate) throws Exception {
        RepositoryHelperMethods helperMethods = new RepositoryHelperMethods(jdbcTemplate);
        if (!StringUtils.isBlank(helperMethods.getDefaultTenantId())) {
            return;
        }
        jdbcTemplate.execute(
                "INSERT INTO tenant (id, slug, display_name, pricing_plan, created_at, updated_at) VALUES (gen_random_uuid(), 'default', 'Default', 'FREE', now(), now())");
    }
}
