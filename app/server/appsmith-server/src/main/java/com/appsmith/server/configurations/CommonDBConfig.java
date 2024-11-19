package com.appsmith.server.configurations;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.mongo.MongoProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.URISyntaxException;

/**
 * Class to configure beans based on DB url. This could have been implemented in {@link MongoConfig} or
 * {@link DBConfig} but extracted to seperate class as we were facing cyclical dependency issue with the other approach
 */
@Configuration
@Slf4j
public class CommonDBConfig {

    @Value("${appsmith.db.url}")
    private String appsmithDbUrl;

    static final String JDBC_PREFIX = "jdbc:";

    @Bean
    @Primary
    @Profile("!test")
    public MongoProperties configureMongoDB() {
        if (!appsmithDbUrl.startsWith("mongodb")) {
            return null;
        }
        log.info("Found MongoDB uri configuring now");
        MongoProperties mongoProperties = new MongoProperties();
        mongoProperties.setUri(appsmithDbUrl);
        return mongoProperties;
    }

    @Bean
    @Primary
    public CustomHikariDataSource configurePostgresDB() {
        if (!appsmithDbUrl.contains("postgresql")) {
            return null;
        }
        log.info("Found PostgreSQL uri configuring now");
        return extractJdbcProperties(appsmithDbUrl);
    }

    /**
     * Method to extract Jdbc props from the given DB URL
     * Expected DB URL: postgresql://{username}:{password}@localhost:{port}/{db_name}
     */
    public CustomHikariDataSource extractJdbcProperties(String dbUrl) {
        try {
            URI uri = new URI(dbUrl);

            if (!StringUtils.hasLength(uri.getHost())) {
                throw new IllegalArgumentException(String.format(
                        "Malformed DB URL! Expected format: postgresql://{username}:{password}@localhost:{port}/{db_name}, provided url is %s",
                        dbUrl));
            }

            String userInfo = uri.getUserInfo();
            String username = null;
            String password = null;
            if (StringUtils.hasLength(userInfo)) {
                String[] userDetails = userInfo.split(":");
                username = userDetails[0];
                password = userDetails[1];
            }

            // Default port to 5432 if not mentioned
            int port = uri.getPort() == -1 ? 5432 : uri.getPort();

            // Check for query parameters
            String query = uri.getQuery();
            String updatedUrl = StringUtils.hasLength(query)
                    ? String.format(
                            "%s%s://%s:%s%s?%s&currentSchema=appsmith",
                            JDBC_PREFIX, uri.getScheme(), uri.getHost(), port, uri.getPath(), query)
                    : String.format(
                            "%s%s://%s:%s%s?currentSchema=appsmith",
                            JDBC_PREFIX, uri.getScheme(), uri.getHost(), port, uri.getPath());

            // Create a CustomHikariDataSource
            CustomHikariDataSource dataSource = new CustomHikariDataSource();
            dataSource.setJdbcUrl(updatedUrl);
            dataSource.setUsername(username);
            dataSource.setPassword(password);

            return dataSource;
        } catch (URISyntaxException e) {
            throw new RuntimeException(e);
        }
    }
}
