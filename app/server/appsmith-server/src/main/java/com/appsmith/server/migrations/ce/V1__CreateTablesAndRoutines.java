package com.appsmith.server.migrations.ce;


import com.appsmith.server.migrations.AppsmithJavaMigration;
import org.springframework.jdbc.core.JdbcTemplate;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

/**
 * Creates all the necessary tables from the domain entities. Any new additions to domain entities should be reflected in tables
 * by new migrations instead of editing this migration related SQL files.
 */
public class V1__CreateTablesAndRoutines extends AppsmithJavaMigration {

    @Override
    public void migrate(JdbcTemplate jdbcTemplate) throws Exception {
        String createTablesSQL = loadSQLFileAsString("/sql/createTables.sql");
        String createFunctionsSQL = loadSQLFileAsString("/sql/createRoutines.sql");
        jdbcTemplate.execute(createTablesSQL);
        jdbcTemplate.execute(createFunctionsSQL);
    }

    public String loadSQLFileAsString(String filePath) throws IOException {
        StringBuilder stringBuilder = new StringBuilder();
        // Load the SQL file from resources
        try(InputStream inputStream = this.getClass().getResourceAsStream(filePath);
            BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {

            String line;
            while((line = reader.readLine()) != null) {
                stringBuilder.append(line).append("\n");
            }
        }
        return stringBuilder.toString();
    }
}
