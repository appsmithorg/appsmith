package com.appsmith.server.featureflags;

import org.springframework.scheduling.annotation.Scheduled;

public interface FeatureFlagScheduledTask {

    void updateFeatureFlags();
}