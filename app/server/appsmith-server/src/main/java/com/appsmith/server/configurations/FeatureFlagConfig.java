package com.appsmith.server.configurations;

import com.appsmith.server.featureflags.FeatureFlag;
import org.ff4j.FF4j;
import org.ff4j.conf.FF4jConfiguration;
import org.ff4j.core.Feature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Configuration
public class FeatureFlagConfig {

    @Autowired
    FeatureFlag featureFlag;

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
        Feature jsEditorFeature = new Feature("jsEditor");
        jsEditorFeature.setEnable(true);
        jsEditorFeature.setFlippingStrategy(new FeatureFlag().new JSEditorFeature());

        Feature weightage = new Feature("weightage");
        weightage.setEnable(true);
        weightage.setFlippingStrategy(new FeatureFlag().new WeightageFeature());

        return Map.of("jsEditor", jsEditorFeature, "weightage", weightage);
    }
}
