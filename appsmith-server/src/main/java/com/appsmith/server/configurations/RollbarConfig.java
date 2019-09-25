package com.appsmith.server.configurations;

import com.rollbar.notifier.Rollbar;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import static com.rollbar.notifier.config.ConfigBuilder.withAccessToken;

@Configuration
public class RollbarConfig {

    @Value("${com.rollbar.access-token}")
    String rollbarAccessToken;

    @Bean
    Rollbar rollbarConfiguration() {
        return Rollbar.init(withAccessToken(rollbarAccessToken).build());
    }
}
