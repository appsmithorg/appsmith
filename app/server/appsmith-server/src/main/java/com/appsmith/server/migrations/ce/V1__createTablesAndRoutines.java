package com.appsmith.server.migrations.ce;

import com.appsmith.server.migrations.AppsmithJavaMigration;
import org.springframework.jdbc.core.JdbcTemplate;

import static com.appsmith.server.migrations.FileUtils.loadSQLFileAsString;

/**
 * Creates all the necessary tables from the domain entities. Any new additions to domain entities should be reflected in tables
 * by new migrations instead of editing this migration related SQL files.
 */
public class V1__createTablesAndRoutines extends AppsmithJavaMigration {

    @Override
    public void migrate(JdbcTemplate jdbcTemplate) throws Exception {
        String createTablesSQL = loadSQLFileAsString("/sql/createTables.sql");
        jdbcTemplate.execute(createTablesSQL);
    }
}
