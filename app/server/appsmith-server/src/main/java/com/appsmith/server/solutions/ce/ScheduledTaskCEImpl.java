package com.appsmith.server.solutions.ce;

import com.appsmith.server.helpers.LoadShifter;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.OrganizationService;
import io.micrometer.observation.annotation.Observed;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@RequiredArgsConstructor
@Slf4j
@Component
public class ScheduledTaskCEImpl implements ScheduledTaskCE {

    private final FeatureFlagService featureFlagService;

    private final OrganizationService tenantService;

    @Scheduled(initialDelay = 10 * 1000 /* ten seconds */, fixedRate = 30 * 60 * 1000 /* thirty minutes */)
    @Observed(name = "fetchFeatures")
    public void fetchFeatures() {
        log.info("Fetching features for default tenant");
        featureFlagService
                .getAllRemoteFeaturesForOrganizationAndUpdateFeatureFlagsWithPendingMigrations()
                .then(tenantService
                        .getDefaultOrganization()
                        .flatMap(featureFlagService::checkAndExecuteMigrationsForOrganizationFeatureFlags)
                        .then(tenantService.restartOrganization()))
                .doOnError(error -> log.error("Error while fetching tenant feature flags", error))
                .subscribeOn(LoadShifter.elasticScheduler)
                .subscribe();
    }
}
