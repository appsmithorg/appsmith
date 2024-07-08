package com.appsmith.server.testhelpers.cleanup;

import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

public class DBCleanup {
    public static void deleteAllTables(JdbcTemplate jdbcTemplate) {
        List<String> tableNames =
                jdbcTemplate.queryForList("SELECT tablename FROM pg_tables WHERE schemaname = 'public'", String.class);

        for (String tableName : tableNames) {
            if (tableName.equals("user")) {
                tableName = "\"user\"";
            }
            jdbcTemplate.execute("DROP TABLE IF EXISTS " + tableName + " CASCADE");
        }
    }

    public static void deleteAllRoutines(JdbcTemplate jdbcTemplate) {
        List<String> routineNames = jdbcTemplate.queryForList(
                "SELECT routine_name FROM information_schema.routines WHERE specific_schema = 'public'", String.class);

        for (String routineName : routineNames) {
            jdbcTemplate.execute("DROP FUNCTION IF EXISTS public." + routineName + " CASCADE");
        }
    }
}
