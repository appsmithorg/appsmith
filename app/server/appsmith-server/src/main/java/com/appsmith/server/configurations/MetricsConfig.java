package com.appsmith.server.configurations;

import com.appsmith.server.annotations.ConditionalOnMicrometerMetricsEnabled;
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
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * This configuration file configures beans as required by NewRelic
 */
@RequiredArgsConstructor
@Configuration
public class MetricsConfig {

    public static final String NEW_RELIC_MICROMETER_METRICS_ENDPOINT = "https://otlp.nr-data.net:4317";
    public static final String API_KEY = "api-key";
    public static final String DEPLOYMENT_NAME_KEY = "deployment.name";
    public static final String SERVICE_INSTANCE_ID_KEY = "service.instance.id";
    public static final String SERVICE_NAME_KEY = "service.name";
    public static final String SERVICE_NAME = "appsmith-server";
    public static final String INSTRUMENTATION_PROVIDER_KEY = "instrumentation.provider";
    public static final String MICROMETER = "micrometer";

    @Value("${appsmith.newrelic.licensekey}")
    private String newRelicKey;

    @Value("${appsmith.observability.deployment.name}")
    private String deploymentName;

    @Value("${appsmith.observability.service.instance.id}")
    private String serviceInstanceId;

    private final CommonConfig commonConfig;

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
                                .put(DEPLOYMENT_NAME_KEY, deploymentName)
                                .put(SERVICE_NAME_KEY, SERVICE_NAME)
                                // Include instrumentation.provider=micrometer to enable micrometer metrics
                                // experience in New Relic
                                .put(INSTRUMENTATION_PROVIDER_KEY, MICROMETER)
                                .put(SERVICE_INSTANCE_ID_KEY, serviceInstanceId)
                                .build())
                        .registerMetricReader(PeriodicMetricReader.builder(OtlpGrpcMetricExporter.builder()
                                        .setEndpoint(NEW_RELIC_MICROMETER_METRICS_ENDPOINT)
                                        .addHeader(API_KEY, newRelicKey)
                                        // IMPORTANT: New Relic requires metrics to be delta temporality

                                        .setAggregationTemporalitySelector(
                                                AggregationTemporalitySelector.deltaPreferred())
                                        // Use exponential histogram aggregation for histogram instruments
                                        // to produce better data and compression
                                        .setDefaultAggregationSelector(DefaultAggregationSelector.getDefault()
                                                .with(
                                                        InstrumentType.HISTOGRAM,
                                                        Aggregation.base2ExponentialBucketHistogram()))
                                        .build())
                                // Match default micrometer collection interval of 60 seconds
                                .setInterval(Duration.ofMillis(commonConfig.getMetricsIntervalMillis()))
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
