package com.appsmith.server.migrations.ce;

import com.appsmith.server.migrations.AppsmithJavaMigration;
import org.springframework.jdbc.core.JdbcTemplate;

import static com.appsmith.server.migrations.FileUtils.loadSQLFileAsString;

public class V2__createIndexes extends AppsmithJavaMigration {
    @Override
    public void migrate(JdbcTemplate jdbcTemplate) throws Exception {
        String createIndexesSQL = loadSQLFileAsString("/sql/createIndexes.sql");
        jdbcTemplate.execute(createIndexesSQL);
    }
}
