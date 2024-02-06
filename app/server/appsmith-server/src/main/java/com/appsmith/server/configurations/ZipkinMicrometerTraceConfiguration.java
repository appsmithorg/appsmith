package com.appsmith.server.configurations;

import com.newrelic.telemetry.micrometer.NewRelicRegistry;
import org.springframework.boot.actuate.autoconfigure.metrics.CompositeMeterRegistryAutoConfiguration;
import org.springframework.boot.actuate.autoconfigure.metrics.MetricsAutoConfiguration;
import org.springframework.boot.actuate.autoconfigure.metrics.export.simple.SimpleMetricsExportAutoConfiguration;
import org.springframework.boot.actuate.autoconfigure.tracing.zipkin.ZipkinWebClientBuilderCustomizer;
import org.springframework.boot.autoconfigure.AutoConfigureAfter;
import org.springframework.boot.autoconfigure.AutoConfigureBefore;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@AutoConfigureBefore({CompositeMeterRegistryAutoConfiguration.class, SimpleMetricsExportAutoConfiguration.class})
@AutoConfigureAfter(MetricsAutoConfiguration.class)
@ConditionalOnClass(NewRelicRegistry.class)
public class ZipkinMicrometerTraceConfiguration {
    @Bean
    public ZipkinWebClientBuilderCustomizer zipkinCustomizer() {
        return webClientBuilder -> webClientBuilder
                .defaultHeader("Api-Key", System.getenv("APPSMITH_NEW_RELIC_OTLP_LICENSE_KEY"))
                .defaultHeader("Data-Format", "zipkin")
                .defaultHeader("Data-Format-Version", "2");
    }
}
