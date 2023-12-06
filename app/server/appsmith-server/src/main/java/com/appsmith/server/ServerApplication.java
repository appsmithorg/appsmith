package com.appsmith.server;

import io.micrometer.observation.ObservationRegistry;
import io.micrometer.observation.aop.ObservedAspect;
import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.sdk.autoconfigure.AutoConfiguredOpenTelemetrySdk;
import org.apache.commons.lang3.StringUtils;
import org.springframework.boot.Banner;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

import static com.appsmith.server.constants.EnvVariables.APPSMITH_NEW_RELIC_ACCOUNT_ENABLE;

@SpringBootApplication
@EnableScheduling
public class ServerApplication {

    public static void main(String[] args) {
        new SpringApplicationBuilder(ServerApplication.class)
                .bannerMode(Banner.Mode.OFF)
                .run(args);
    }

    @Bean
    public OpenTelemetry openTelemetry() {
        String instanceName =
                StringUtils.defaultIfEmpty(System.getenv(String.valueOf(APPSMITH_NEW_RELIC_ACCOUNT_ENABLE)), null);
        // generate the bean only if the telemetry env variable is enabled

        if ("true".equalsIgnoreCase(instanceName)) {
            return AutoConfiguredOpenTelemetrySdk.initialize().getOpenTelemetrySdk();
        }
        return null;
    }

    @Bean
    @ConditionalOnExpression("${logging.verbose.enabled}")
    ObservedAspect observedAspect(ObservationRegistry observationRegistry) {
        return new ObservedAspect(observationRegistry);
    }
}
