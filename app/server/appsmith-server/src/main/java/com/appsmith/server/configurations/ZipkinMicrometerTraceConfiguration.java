package com.appsmith.server.configurations;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.autoconfigure.tracing.zipkin.ZipkinWebClientBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ZipkinMicrometerTraceConfiguration {
    public static final String DATA_FORMAT = "zipkin";
    public static final String DATA_VERSION = "2";

    @Value("${appsmith.newrelic.licensekey}")
    private String newRelicKey;

    @Bean
    public ZipkinWebClientBuilderCustomizer zipkinCustomizer() {
        return webClientBuilder -> webClientBuilder
                .defaultHeader("Api-Key", newRelicKey)
                .defaultHeader("Data-Format", DATA_FORMAT)
                .defaultHeader("Data-Format-Version", DATA_VERSION);
    }
}
