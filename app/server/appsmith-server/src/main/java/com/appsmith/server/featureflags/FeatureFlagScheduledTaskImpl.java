package com.appsmith.server.featureflags;

import com.appsmith.server.services.FeatureFlagService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import reactor.core.scheduler.Schedulers;

/**
 * This class represents a scheduled task that pings cloud services
 * for any updates in feature flags for known users.
 */
@Slf4j
@RequiredArgsConstructor
@Component
public class FeatureFlagScheduledTaskImpl implements FeatureFlagScheduledTask {

    private final FeatureFlagService featureFlagService;

    // Number of milliseconds between the start of each scheduled calls to this method.
    @Scheduled(
            initialDelay = 1 * 60 * 1000 /* 1 minute */,
            fixedDelay = 1 * 60 * 1000 /* 1 minute */)
    @Override
    public void updateFeatureFlags() {
        featureFlagService.refreshFeatureFlagsForAllUsers()
                .subscribeOn(Schedulers.single())
                .subscribe();
    }
}