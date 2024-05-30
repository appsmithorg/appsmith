package com.appsmith.server.configurations;

import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

@Profile("test")
@Configuration
public class TestDatabaseConfig {

    @Bean
    public JdbcTemplate jdbcTemplate(DataSourceProperties dataSourceProperties) {
        DataSource datasource =
                dataSourceProperties.initializeDataSourceBuilder().build();
        return new JdbcTemplate(datasource);
    }
}
