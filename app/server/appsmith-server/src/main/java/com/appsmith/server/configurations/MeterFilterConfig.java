package com.appsmith.server.configurations;

import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MeterFilterConfig {

    public MeterFilterConfig(MeterRegistry registry) {
        registry.config().meterFilter(new NoTagsMeterFilter());
    }
}
