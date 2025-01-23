package com.appsmith.server.configurations;

import io.r2dbc.pool.ConnectionPool;
import io.r2dbc.pool.ConnectionPoolConfiguration;
import io.r2dbc.postgresql.PostgresqlConnectionConfiguration;
import io.r2dbc.postgresql.PostgresqlConnectionFactory;
import io.r2dbc.spi.ConnectionFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.r2dbc.config.AbstractR2dbcConfiguration;
import org.springframework.data.r2dbc.repository.config.EnableR2dbcRepositories;

import java.time.Duration;

@Configuration
@EnableR2dbcRepositories(basePackages = "com.appsmith.server.repositories.r2dbc")
public class R2DBCConfig extends AbstractR2dbcConfiguration {

    @Value("${spring.datasource.url}")
    private String url = "postgresql://postgres:hammer@localhost:5432/r2dbc";

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    @Bean
    @Override
    public ConnectionFactory connectionFactory() {
        PostgresqlConnectionConfiguration pgConfig = PostgresqlConnectionConfiguration.builder()
                .host(extractHost(url))
                .port(extractPort(url))
                .database(extractDatabase(url))
                .username(username)
                .password(password)
                .build();

        ConnectionPoolConfiguration poolConfig = ConnectionPoolConfiguration.builder()
                .connectionFactory(new PostgresqlConnectionFactory(pgConfig))
                .maxIdleTime(Duration.ofMinutes(30))
                .initialSize(5)
                .maxSize(20)
                .build();

        return new ConnectionPool(poolConfig);
    }

    private String extractHost(String url) {
        // Extract host from jdbc:postgresql://host:port/database
        return url.split("://")[1].split(":")[0];
    }

    private int extractPort(String url) {
        // Extract port from jdbc:postgresql://host:port/database
        return Integer.parseInt(url.split("://")[1].split(":")[1].split("/")[0]);
    }

    private String extractDatabase(String url) {
        // Extract database from jdbc:postgresql://host:port/database
        return url.split("/")[3];
    }
}
