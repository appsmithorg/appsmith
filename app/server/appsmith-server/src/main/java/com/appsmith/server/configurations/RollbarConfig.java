package com.appsmith.server.configurations;

import com.rollbar.notifier.Rollbar;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import static com.rollbar.notifier.config.ConfigBuilder.withAccessToken;

@Configuration
public class RollbarConfig {

    @Value("${com.rollbar.access-token}")
    String rollbarAccessToken;

    // Allow being able to disable Rollbar in dev/test environments.
    // If the `rollbar.enabled` property is not set, it defaults to `true` (by the `:true` part below).
    @Value("#{new Boolean('${rollbar.enabled:true}'.trim())}")
    boolean rollbarEnabled;

    @Autowired
    Environment env;

    @Bean
    Rollbar rollbarConfiguration() {
        return Rollbar.init(withAccessToken(rollbarAccessToken)
                .enabled(rollbarEnabled)
                .environment(env.getActiveProfiles()[0])
                .build());
    }
}
