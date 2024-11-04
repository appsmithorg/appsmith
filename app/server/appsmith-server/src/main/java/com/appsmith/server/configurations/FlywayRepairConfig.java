package com.appsmith.server.configurations;

import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.output.MigrateResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.event.ApplicationStartingEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class FlywayRepairConfig implements ApplicationListener<ApplicationStartingEvent> {

    private final DataSourceProperties dataSourceProperties;

    @Autowired
    public FlywayRepairConfig(DataSourceProperties dataSourceProperties) {
        this.dataSourceProperties = dataSourceProperties;
    }

    @Override
    public void onApplicationEvent(ApplicationStartingEvent event) {
        Flyway flyway = Flyway.configure()
                .dataSource(
                        dataSourceProperties.getUrl(),
                        dataSourceProperties.getUsername(),
                        dataSourceProperties.getPassword())
                .locations("classpath:com/appsmith/server/migrations")
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .load();
        flyway.repair();
        MigrateResult result = flyway.migrate();
        log.info(" Migration completed, total time " + result.getTotalMigrationTime());
    }
}
