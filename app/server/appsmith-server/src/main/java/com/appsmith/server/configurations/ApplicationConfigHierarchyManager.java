package com.appsmith.server.configurations;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Class to define the configuration hierarchy for instance. This serves as a central place to define the relationship
 * between the env configs.
 * e.g. For air-gap instance telemetry and analytics event reporting should be disabled
 */
@RequiredArgsConstructor
@Configuration
public class ApplicationConfigHierarchyManager {

    private final AirgapInstanceConfig airgapInstanceConfig;

    private final CommonConfig commonConfig;

    /**
     * Bean to set up the config hierarchy for air-gap instance
     * - Disable analytics
     * - Disable telemetry
     */
    @Bean
    public void setupAirgappedConfig() {
        if (!airgapInstanceConfig.isAirgapEnabled()) {
            return;
        }
        // As Appsmith cloud never going to be hosted in air-gap environment, explicitly declaring it to self-hosted
        // instance
        commonConfig.setCloudHosting(false);
        // For air-gap instance telemetry is disabled and which eventually disables the analytics for current instance
        // Check SegmentConfig class for more details
        commonConfig.setTelemetryDisabled(true);
    }

}
