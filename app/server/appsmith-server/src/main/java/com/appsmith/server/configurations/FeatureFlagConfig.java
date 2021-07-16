package com.appsmith.server.configurations;

import com.appsmith.server.featureflags.FeatureFlagEnum;
import org.ff4j.FF4j;
import org.ff4j.conf.FF4jConfiguration;
import org.ff4j.core.Feature;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.EnumSet;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class FeatureFlagConfig {

    @Bean
    public FF4j getFF4j() {
        FF4jConfiguration ff4jConfiguration = new FF4jConfiguration();
        ff4jConfiguration.setAudit(true);
        ff4jConfiguration.setAutoCreate(true);

        ff4jConfiguration.setFeatures(init());
        FF4j ff4j = new FF4j(ff4jConfiguration);
        return ff4j;
    }

    private Map<String, Feature> init() {
        Map<String, Feature> featureMap = new HashMap<>();
        EnumSet.allOf(FeatureFlagEnum.class)
                .forEach(feat -> {
                    Feature feature = new Feature(feat.name());
                    feature.setEnable(true);
                    feature.setFlippingStrategy(feat.getStrategy());
                    featureMap.put(feat.name(), feature);
                });

        return featureMap;
    }
}
