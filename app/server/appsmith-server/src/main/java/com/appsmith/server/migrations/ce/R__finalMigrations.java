package com.appsmith.server.migrations.ce;

import com.appsmith.server.migrations.AppsmithJavaMigration;
import org.springframework.jdbc.core.JdbcTemplate;

public class R__finalMigrations extends AppsmithJavaMigration {
    private JdbcTemplate jdbcTemplate;

    @Override
    public void migrate(JdbcTemplate jdbcTemplate) throws Exception {
        this.jdbcTemplate = jdbcTemplate;
        // This is a placeholder migration that will be the last migration to run in any CE/EE version.
        // This migration will be used to add any final migrations that need to be run after all other migrations.

    }
}
