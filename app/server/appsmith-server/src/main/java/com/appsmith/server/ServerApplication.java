package com.appsmith.server;

import com.appsmith.server.annotations.ConditionalOnMicrometerMetricsEnabled;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.Banner;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.time.Duration;

@SpringBootApplication
@ComponentScan({"com.appsmith"})
@EnableScheduling
@Slf4j
public class ServerApplication {
    public static final String NEW_RELIC_MICROMETER_METRICS_ENDPOINT = "https://otlp.nr-data.net:4317";
    public static final String API_KEY = "api-key";
    public static final String SERVICE_NAME_KEY = "service.name";
    public static final String INSTRUMENTATION_PROVIDER_KEY = "instrumentation.provider";
    public static final String MICROMETER = "micrometer";
    public static final int MICROMETER_COLLECTION_INTERVAL_SECONDS = 60;

    private final ProjectProperties projectProperties;

    @Value("${appsmith.newrelic.micrometer.metrics.application.name}")
    private String newRelicApplicationName;

    @Value("${appsmith.newrelic.licensekey}")
    private String newRelicKey;

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
    @ConditionalOnMicrometerMetricsEnabled
    public TimedAspect timedAspect(MeterRegistry registry) {
        return new TimedAspect(registry);
    }

    @Bean
    @ConditionalOnMicrometerMetricsEnabled
    public MeterRegistry meterRegistry(OpenTelemetry openTelemetry) {
        return OpenTelemetryMeterRegistry.builder(openTelemetry).build();
    }

    @Bean
    @ConditionalOnMicrometerMetricsEnabled
    public OpenTelemetry openTelemetry() {
        return OpenTelemetrySdk.builder()
                .setMeterProvider(SdkMeterProvider.builder()
                        .setResource(Resource.getDefault().toBuilder()
                                .put(SERVICE_NAME_KEY, newRelicApplicationName)
                                // Include instrumentation.provider=micrometer to enable micrometer metrics
                                // experience in New Relic
                                .put(INSTRUMENTATION_PROVIDER_KEY, MICROMETER)
                                .build())
                        .registerMetricReader(PeriodicMetricReader.builder(OtlpGrpcMetricExporter.builder()
                                        .setEndpoint(NEW_RELIC_MICROMETER_METRICS_ENDPOINT)
                                        .addHeader(API_KEY, newRelicKey)
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
                                .setInterval(Duration.ofSeconds(MICROMETER_COLLECTION_INTERVAL_SECONDS))
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
