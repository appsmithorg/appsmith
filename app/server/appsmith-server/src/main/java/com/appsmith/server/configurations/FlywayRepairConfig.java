package com.appsmith.server.configurations;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayRepairConfig {

    private final DataSourceProperties dataSourceProperties;

    @Autowired
    public FlywayRepairConfig(DataSourceProperties dataSourceProperties) {
        this.dataSourceProperties = dataSourceProperties;
    }

    @Bean
    public Flyway flyway() {
        return Flyway.configure()
                .dataSource(
                        dataSourceProperties.getUrl(),
                        dataSourceProperties.getUsername(),
                        dataSourceProperties.getPassword())
                .locations("classpath:db/migration") // Adjust path if needed
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .load();
    }

    // ApplicationRunner bean to run migrations at startup
    // TODO - Remove this once the pg and release branch is merged
    @Bean
    public ApplicationRunner flywayMigrationRunner(Flyway flyway) {
        return args -> {
            flyway.repair(); // Fixes any inconsistencies in the schema history
            flyway.migrate();
        };
    }
}
