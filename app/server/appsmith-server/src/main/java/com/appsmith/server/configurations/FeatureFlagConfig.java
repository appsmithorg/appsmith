package com.appsmith.server.configurations;

import org.ff4j.FF4j;
import org.ff4j.parser.yaml.YamlParser;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeatureFlagConfig {

    @Bean
    public FF4j ff4j() {
        return new FF4j(new YamlParser(), "features/init-flags.yml")
                .audit(true)
                .autoCreate(true);
    }
}
