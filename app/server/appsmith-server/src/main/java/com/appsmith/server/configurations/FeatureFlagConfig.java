package com.appsmith.server.configurations;

import org.ff4j.FF4j;
import org.ff4j.conf.XmlParser;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeatureFlagConfig {

    // Since we rely on cloud services to retrieve the most up-to-date flags, we avoid automatically generating the same
    // flag in the FF4J context.
    @Bean
    public FF4j ff4j() {
        return new FF4j(new XmlParser(), "features/init-flags.xml").audit(true).autoCreate(false);
    }
}
