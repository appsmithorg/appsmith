package com.appsmith.server.testhelpers.cleanup;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
public class DBCleanup {
    public static void deleteAllTables(JdbcTemplate jdbcTemplate) {
        List<String> tableNames =
                jdbcTemplate.queryForList("SELECT tablename FROM pg_tables WHERE schemaname = 'public'", String.class);

        for (String tableName : tableNames) {
            jdbcTemplate.execute("DROP TABLE IF EXISTS \"" + tableName + "\" CASCADE");
        }
    }

    public static void deleteAllRoutines(JdbcTemplate jdbcTemplate) {
        List<String> routineNames = jdbcTemplate.queryForList(
                "SELECT routine_name FROM information_schema.routines WHERE specific_schema = 'public'", String.class);

        for (String routineName : routineNames) {
            jdbcTemplate.execute("DROP FUNCTION IF EXISTS public." + routineName + " CASCADE");
        }
    }

    public static Mono<Long> deleteKeysWithPattern(
            String pattern, ReactiveRedisTemplate<String, Object> reactiveRedisTemplate) {
        // SCAN for keys that match the pattern
        return reactiveRedisTemplate
                .scan()
                .filter(key -> key.matches(pattern)) // Filter keys based on the pattern
                .collectList()
                .flatMap(keys -> {
                    // Use Redis to delete all matched keys
                    if (!keys.isEmpty()) {
                        log.info("Deleting keys: {}", keys);
                        return reactiveRedisTemplate.delete(Flux.fromIterable(keys));
                    } else {
                        return Mono.just(0L); // No keys to delete
                    }
                });
    }
}
