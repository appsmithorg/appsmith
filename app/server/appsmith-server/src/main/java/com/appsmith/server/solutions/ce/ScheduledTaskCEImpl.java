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

    private final OrganizationService organizationService;

    @Scheduled(initialDelay = 10 * 1000 /* ten seconds */, fixedRate = 30 * 60 * 1000 /* thirty minutes */)
    @Observed(name = "fetchFeatures")
    public void fetchFeatures() {
        log.info("Fetching features for default organization");
        featureFlagService
                .getAllRemoteFeaturesForOrganizationAndUpdateFeatureFlagsWithPendingMigrations()
                .then(organizationService
                        .getDefaultOrganization()
                        .flatMap(featureFlagService::checkAndExecuteMigrationsForOrganizationFeatureFlags)
                        .then(organizationService.restartOrganization()))
                .doOnError(error -> log.error("Error while fetching organization feature flags", error))
                .subscribeOn(LoadShifter.elasticScheduler)
                .subscribe();
    }
}
