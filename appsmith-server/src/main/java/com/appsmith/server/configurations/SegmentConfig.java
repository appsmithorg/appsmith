package com.appsmith.server.configurations;

import com.segment.analytics.Analytics;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SegmentConfig {
    @Value("${segment.writeKey}")
    private String writeKey;

    @Bean
    public Analytics analyticsRunner() {
        return Analytics.builder(writeKey).build();
    }
}
