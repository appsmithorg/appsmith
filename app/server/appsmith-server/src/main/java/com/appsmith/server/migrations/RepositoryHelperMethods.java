package com.appsmith.server.migrations;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;

@RequiredArgsConstructor
public class RepositoryHelperMethods {
    private final JdbcTemplate jdbcTemplate;

    public String getDefaultTenantId() {
        try {
            return jdbcTemplate.queryForObject("SELECT id FROM tenant WHERE slug = 'default' LIMIT 1", String.class);
        } catch (Exception e) {
            return null;
        }
    }
}
