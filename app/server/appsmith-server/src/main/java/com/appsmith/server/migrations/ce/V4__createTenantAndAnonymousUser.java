package com.appsmith.server.migrations.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Config;
import com.appsmith.server.migrations.AppsmithJavaMigration;
import com.appsmith.server.migrations.CommonMethods;
import com.appsmith.server.migrations.JsonHelper;
import com.fasterxml.jackson.core.JsonProcessingException;
import net.minidev.json.JSONObject;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

public class V4__createTenantAndAnonymousUser extends AppsmithJavaMigration {
    private JdbcTemplate jdbcTemplate;
    public static final String INSTANCE_ID = "instance-id";

    @Override
    public void migrate(JdbcTemplate jdbcTemplate) throws Exception {
        this.jdbcTemplate = jdbcTemplate;
        addInstanceId();
        createDefaultTenant();
        addAnonymousUser();
    }

    private void addInstanceId() throws JsonProcessingException {
        String sql = "SELECT COUNT(*) FROM config WHERE name = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, INSTANCE_ID);
        if (count != null && count != 0) {
            return;
        }
        final String valueStr = UUID.randomUUID().toString();

        Config instanceIdConfig = new Config(new JSONObject(Map.of("value", valueStr)), INSTANCE_ID);
        String jsonConfig = JsonHelper.convertToString(instanceIdConfig.getConfig());
        String insertInstanceConfigurationQuery =
                "INSERT INTO config (id, name,  config, created_at, updated_at) VALUES (gen_random_uuid(), ?, cast(? as jsonb), now(), now())";
        jdbcTemplate.update(insertInstanceConfigurationQuery, INSTANCE_ID, jsonConfig);
    }

    private void addAnonymousUser() throws JsonProcessingException {
        String defaultTenantId = CommonMethods.getDefaultTenantId(jdbcTemplate);
        if (doesAnonymousUserExist(defaultTenantId)) {
            return;
        }
        String insertUserQuery =
                "INSERT INTO \"user\" (id, email, name,  current_workspace_id, workspace_ids, is_anonymous, tenant_id, created_at, updated_at) VALUES (gen_random_uuid(), ?, ?, ?, cast(? as jsonb), ?, ?, now() ,now())";
        jdbcTemplate.update(
                insertUserQuery,
                FieldName.ANONYMOUS_USER,
                FieldName.ANONYMOUS_USER,
                "",
                JsonHelper.convertToString(Set.of()),
                true,
                defaultTenantId);
    }

    private boolean doesAnonymousUserExist(String tenantId) {
        String sql = "SELECT COUNT(*) FROM \"user\" WHERE email = ? and tenant_id = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, FieldName.ANONYMOUS_USER, tenantId);
        return count != null && count != 0;
    }

    private void createDefaultTenant() {
        if (isDefaultTenantExist()) {
            return;
        }
        jdbcTemplate.execute(
                "INSERT INTO tenant (id, slug, display_name, pricing_plan, created_at, updated_at) VALUES (gen_random_uuid(), 'default', 'Default', 'FREE', now(), now())");
    }

    private boolean isDefaultTenantExist() {
        Integer count =
                jdbcTemplate.queryForObject("SELECT COUNT(*) FROM tenant WHERE slug = 'default'", Integer.class);
        return count != null && count != 0;
    }
}
