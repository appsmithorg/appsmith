package com.appsmith.server.migrations;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;

@RequiredArgsConstructor
public class CommonMethods {
    private final JdbcTemplate jdbcTemplate;

    public String getDefaultTenantId() {
        return jdbcTemplate.queryForObject("SELECT id FROM tenant WHERE slug = 'default' LIMIT 1", String.class);
    }
}
