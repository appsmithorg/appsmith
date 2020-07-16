package com.appsmith.server.configurations;

import com.rollbar.notifier.Rollbar;
import com.rollbar.notifier.config.ConfigBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import static com.rollbar.notifier.config.ConfigBuilder.withAccessToken;

@Configuration
@ConditionalOnExpression(value = "!'${com.rollbar.access-token:}'.isEmpty()")
public class RollbarConfig {

    @Value("${com.rollbar.access-token}")
    private String rollbarAccessToken;

    @Value("${rollbar.env:}")
    private String rollbarEnv;

    final Environment env;

    public RollbarConfig(Environment env) {
        this.env = env;
    }

    @Bean
    Rollbar rollbarConfiguration() {
        // The Rollbar env, if not set, defaults to being the first Spring profile.
        String environment = rollbarEnv;
        if ((environment == null || environment.isEmpty()) && env.getActiveProfiles().length > 0) {
            environment = env.getActiveProfiles()[0];
        }

        ConfigBuilder builder = withAccessToken(rollbarAccessToken);

        if (environment != null) {
            builder = builder.environment(environment);
        }

        return Rollbar.init(builder.build());
    }
}
