package com.appsmith.server;

import com.appsmith.server.configurations.ProjectProperties;
import io.micrometer.core.instrument.Clock;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.newrelic.NewRelicConfig;
import io.micrometer.newrelic.NewRelicMeterRegistry;
import io.micrometer.observation.ObservationRegistry;
import io.micrometer.observation.aop.ObservedAspect;
import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.sdk.autoconfigure.AutoConfiguredOpenTelemetrySdk;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
public class ServerApplication {

    private final ProjectProperties projectProperties;

    public ServerApplication(ProjectProperties projectProperties) {
        this.projectProperties = projectProperties;
        printBuildInfo();
    }

    public static void main(String[] args) {
        new SpringApplicationBuilder(ServerApplication.class)
                .bannerMode(Banner.Mode.OFF)
                .run(args);
    }

    private void printBuildInfo() {
        String version = projectProperties.getVersion();
        String commitId = projectProperties.getCommitSha();
        log.info("Application started with build version {}, and commitSha {}", version, commitId);
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
    public MeterRegistry getNewRelicMeterRegistry() {
        NewRelicConfig newRelicConfig = new NewRelicConfig() {
            @Override
            public String accountId() {
                return "id";
                // return System.getenv("APPSMITH_NEW_RELIC_ACCOUNT_ID");
            }

            @Override
            public String apiKey() {
                return "key";
                // return System.getenv("APPSMITH_NEW_RELIC_OTLP_LICENSE_KEY");
            }

            @Override
            public String get(String k) {
                return null; // accept the rest of the defaults
            }
        };

        //NewRelicConfig newRelicConfig = new NewRelicConfig();

        return new NewRelicMeterRegistry(newRelicConfig, Clock.SYSTEM);
    }

    @Bean
    @ConditionalOnExpression("${logging.verbose.enabled}")
    ObservedAspect observedAspect(ObservationRegistry observationRegistry) {
        return new ObservedAspect(observationRegistry);
    }
}
