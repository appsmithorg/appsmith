package com.appsmith.server.configurations;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.autoconfigure.mongo.MongoProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
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

    @Bean
    @Primary
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
    public DataSourceProperties configurePostgresDB() {
        if (!appsmithDbUrl.startsWith("jdbc:postgresql")) {
            return null;
        }
        log.info("Found PostgreSQL uri configuring now");
        return extractJdbcProperties(appsmithDbUrl);
    }

    /**
     * Method to extract Jdbc props from the given DB URL
     * Expected DB URL: jdbc:postgresql://{username}:{password}@localhost:{port}/{db_name}
     */
    public DataSourceProperties extractJdbcProperties(String dbUrl) {
        DataSourceProperties ds = new DataSourceProperties();
        try {
            URI uri = new URI(dbUrl.substring(5)); // remove "jdbc:" prefix
            String userInfo = uri.getUserInfo();
            if (StringUtils.hasLength(userInfo)) {
                String[] userDetails = userInfo.split(":");
                ds.setUsername(userDetails[0]);
                ds.setPassword(userDetails[1]);
            }
            // If the port is not mentioned default it to standard 5432
            int port = uri.getPort() == -1 ? 5432 : uri.getPort();
            String updatedUrl = String.format("jdbc:%s://%s:%s%s", uri.getScheme(), uri.getHost(), port, uri.getPath());
            ds.setUrl(updatedUrl);
            return ds;
        } catch (URISyntaxException e) {
            throw new RuntimeException(e);
        }
    }
}
