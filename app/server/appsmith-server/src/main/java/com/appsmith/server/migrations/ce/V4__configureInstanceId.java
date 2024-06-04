package com.appsmith.server.migrations.ce;

import com.appsmith.external.helpers.JsonForDatabase;
import com.appsmith.server.domains.Config;
import com.appsmith.server.migrations.AppsmithJavaMigration;
import net.minidev.json.JSONObject;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Map;
import java.util.UUID;

public class V4__configureInstanceId extends AppsmithJavaMigration {

    public static final String INSTANCE_ID = "instance-id";

    @Override
    public void migrate(JdbcTemplate jdbcTemplate) throws Exception {
        String sql = "SELECT COUNT(*) FROM config WHERE name = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, INSTANCE_ID);
        if (count != null && count != 0) {
            return;
        }
        final String valueStr = UUID.randomUUID().toString();

        Config instanceIdConfig = new Config(new JSONObject(Map.of("value", valueStr)), INSTANCE_ID);
        String jsonConfig = JsonForDatabase.writeValueAsString(instanceIdConfig.getConfig());
        String insertInstanceConfigurationQuery =
                "INSERT INTO config (id, name,  config, created_at, updated_at) VALUES (gen_random_uuid(), ?, cast(? as jsonb), now(), now())";
        jdbcTemplate.update(insertInstanceConfigurationQuery, INSTANCE_ID, jsonConfig);
    }
}
