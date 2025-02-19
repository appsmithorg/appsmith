package com.appsmith.server.solutions.ce;

import com.appsmith.caching.annotations.DistributedLock;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.helpers.LoadShifter;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.OrganizationService;
import io.micrometer.observation.annotation.Observed;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

@RequiredArgsConstructor
@Slf4j
@Component
public class ScheduledTaskCEImpl implements ScheduledTaskCE {

    private final FeatureFlagService featureFlagService;

    private final OrganizationService organizationService;

    @Scheduled(initialDelay = 10 * 1000 /* ten seconds */, fixedRate = 30 * 60 * 1000 /* thirty minutes */)
    @DistributedLock(
            key = "fetchFeatures",
            ttl = 20 * 60, // 20 minutes
            shouldReleaseLock = false) // Ensure only one pod executes this
    @Observed(name = "fetchFeatures")
    public void fetchFeatures() {
        log.info("Fetching features for default organization");
        Flux<Organization> organizationFlux = organizationService.retrieveAll();
        organizationFlux
                .flatMap(featureFlagService::getAllRemoteFeaturesForOrganizationAndUpdateFeatureFlagsWithPendingMigrations)
            .flatMap(featureFlagService::checkAndExecuteMigrationsForOrganizationFeatureFlags)
                .doOnError(error -> log.error("Error while fetching tenant feature flags", error))
                .then(organizationService.restartOrganization())
                .subscribeOn(LoadShifter.elasticScheduler)
                .subscribe();
    }
}
