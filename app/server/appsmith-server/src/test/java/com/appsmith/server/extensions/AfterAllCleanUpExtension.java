package com.appsmith.server.extensions;

import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.util.List;

/**
 * This SpringExtension is used to clean up the database after all tests have run. It drops all tables and routines.
 * <br>
 * Annotate it in your test class to ensure database cleanup after all tests have run and doesn't affect state of other tests.
 * Use it in conjunction with @DirtiesContext
 * <br>
 * Example:
 * <br>
 * @ExtendWith(AfterAllCleanUpExtension.class)
 * <br>
 * @DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
 * <br>
 */
@Slf4j
public class AfterAllCleanUpExtension extends SpringExtension {
    @Override
    public void afterAll(ExtensionContext context) {
        Class<?> testClass = context.getRequiredTestClass();
        ApplicationContext applicationContext = SpringExtension.getApplicationContext(context);
        JdbcTemplate jdbcTemplate = applicationContext.getBean(JdbcTemplate.class);

        log.debug("Cleaning up after all tests for {}", testClass.getName());
        deleteAllTables(jdbcTemplate);
        deleteAllRoutines(jdbcTemplate);
    }

    public void deleteAllTables(JdbcTemplate jdbcTemplate) {
        List<String> tableNames =
                jdbcTemplate.queryForList("SELECT tablename FROM pg_tables WHERE schemaname = 'public'", String.class);

        for (String tableName : tableNames) {
            if (tableName.equals("user")) {
                tableName = "\"user\"";
            }
            jdbcTemplate.execute("DROP TABLE IF EXISTS " + tableName + " CASCADE");
        }
    }

    public void deleteAllRoutines(JdbcTemplate jdbcTemplate) {
        List<String> routineNames = jdbcTemplate.queryForList(
                "SELECT routine_name FROM information_schema.routines WHERE specific_schema = 'public'", String.class);

        for (String routineName : routineNames) {
            jdbcTemplate.execute("DROP FUNCTION IF EXISTS public." + routineName + " CASCADE");
        }
    }
}
