package com.appsmith.server;

import com.appsmith.server.configurations.ProjectProperties;
import io.micrometer.core.aop.TimedAspect;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.observation.ObservationRegistry;
import io.micrometer.observation.aop.ObservedAspect;
import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.exporter.otlp.metrics.OtlpGrpcMetricExporter;
import io.opentelemetry.instrumentation.micrometer.v1_5.OpenTelemetryMeterRegistry;
import io.opentelemetry.sdk.OpenTelemetrySdk;
import io.opentelemetry.sdk.metrics.Aggregation;
import io.opentelemetry.sdk.metrics.InstrumentType;
import io.opentelemetry.sdk.metrics.SdkMeterProvider;
import io.opentelemetry.sdk.metrics.export.AggregationTemporalitySelector;
import io.opentelemetry.sdk.metrics.export.DefaultAggregationSelector;
import io.opentelemetry.sdk.metrics.export.PeriodicMetricReader;
import io.opentelemetry.sdk.resources.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.Banner;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.time.Duration;
import java.util.Optional;

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
    public TimedAspect timedAspect(MeterRegistry registry) {
        return new TimedAspect(registry);
    }

    @Bean
    public MeterRegistry meterRegistry(OpenTelemetry openTelemetry) {
        return OpenTelemetryMeterRegistry.builder(openTelemetry).build();
    }

    @Bean
    public OpenTelemetry openTelemetry() {
        return OpenTelemetrySdk.builder()
                .setMeterProvider(SdkMeterProvider.builder()
                        .setResource(Resource.getDefault().toBuilder()
                                .put("service.name", "sumit-test-micrometer-shim-with-zipkin-3")
                                // Include instrumentation.provider=micrometer to enable micrometer metrics
                                // experience in New Relic
                                .put("instrumentation.provider", "micrometer")
                                .build())
                        .registerMetricReader(PeriodicMetricReader.builder(OtlpGrpcMetricExporter.builder()
                                        .setEndpoint("https://otlp.nr-data.net:4317")
                                        .addHeader(
                                                "api-key",
                                                Optional.ofNullable(System.getenv("APPSMITH_NEW_RELIC_OTLP_LICENSE_KEY"))
                                                        .filter(str -> !str.isEmpty() && !str.isBlank())
                                                        .orElseThrow())
                                        // IMPORTANT: New Relic requires metrics to be delta temporality
                                        .setAggregationTemporalitySelector(
                                                AggregationTemporalitySelector.deltaPreferred())
                                        // Use exponential histogram aggregation for histogram instruments
                                        // to
                                        // produce better data and compression
                                        .setDefaultAggregationSelector(DefaultAggregationSelector.getDefault()
                                                .with(
                                                        InstrumentType.HISTOGRAM,
                                                        Aggregation.base2ExponentialBucketHistogram()))
                                        .build())
                                // Match default micrometer collection interval of 60 seconds
                                .setInterval(Duration.ofSeconds(60))
                                .build())
                        .build())
                .build();
    }

    @Bean
    @ConditionalOnExpression("${logging.verbose.enabled}")
    ObservedAspect observedAspect(ObservationRegistry observationRegistry) {
        return new ObservedAspect(observationRegistry);
    }
}
