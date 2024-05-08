package com.appsmith.server.migrations;

import org.springframework.jdbc.core.JdbcTemplate;

public class CommonMethods {
    public static String getDefaultTenantId(JdbcTemplate jdbcTemplate) {
        return jdbcTemplate.queryForObject("SELECT id FROM tenant WHERE slug = 'default' LIMIT 1", String.class);
    }
}
