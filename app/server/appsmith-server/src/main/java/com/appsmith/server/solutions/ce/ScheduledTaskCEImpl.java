package com.appsmith.server.solutions.ce;

import com.appsmith.server.domains.Tenant;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.TenantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@RequiredArgsConstructor
@Slf4j
@Component
public class ScheduledTaskCEImpl implements ScheduledTaskCE {

    private final FeatureFlagService featureFlagService;

    private final TenantService tenantService;

    @Scheduled(initialDelay = 10 * 1000 /* ten seconds */, fixedRate = 2 * 60 * 60 * 1000 /* two hours */)
    public void fetchFeatures() {
        log.info("Fetching features for default tenant");
        Mono<Tenant> tenantMono = tenantService.getDefaultTenant();
        tenantMono
                .flatMap(tenant -> featureFlagService.getAllRemoteFeaturesForTenant(tenant.getId()))
                .doOnError(error -> log.error("Error while fetching features from Cloud Services {0}", error))
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe();
    }
}
