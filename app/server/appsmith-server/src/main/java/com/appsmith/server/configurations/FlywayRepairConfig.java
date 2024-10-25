package com.appsmith.server.configurations;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Autowired;
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
        Flyway flyway = Flyway.configure()
                .dataSource(
                        dataSourceProperties.getUrl(),
                        dataSourceProperties.getUsername(),
                        dataSourceProperties.getPassword())
                .locations("classpath:com/appsmith/server/migrations")
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .load();
        flyway.repair(); // Optionally repair the schema history if needed
        flyway.migrate();
        return flyway;
    }
}
