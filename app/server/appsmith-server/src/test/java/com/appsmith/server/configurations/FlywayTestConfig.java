package com.appsmith.server.configurations;

import org.flywaydb.core.Flyway;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

@TestConfiguration
public class FlywayTestConfig {

    @Bean
    @Primary
    public ApplicationRunner testFlywayMigrationRunner(Flyway flyway) {
        return args -> {
            flyway.repair();
            flyway.migrate();
        };
    }
}
