package com.appsmith.server.configurations;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.mongodb.autoconfigure.MongoProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

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
}
