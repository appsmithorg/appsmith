package com.appsmith.server.services.ce;

import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.featureflags.CachedFeatures;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface FeatureFlagServiceCE {

    /**
     * Check if a particular feature is enabled for the current logged in user. Useful in chaining reactive functions
     * while writing business logic that may depend on a feature flag
     *
     * @param featureEnum
     * @return Mono<Boolean>
     */
    Mono<Boolean> check(FeatureFlagEnum featureEnum);

    /**
     * Fetch all the flags and their values for the current logged in user
     *
     * @return Mono<Map < String, Boolean>>
     */
    Mono<Map<String, Boolean>> getAllFeatureFlagsForUser();

    /**
     * To get all features of the tenant from Cloud Services and store them locally
     * @return Mono of Void
     */
    Mono<Tenant> getAllRemoteFeaturesForAllTenantAndUpdateFeatureFlagsWithPendingMigrations(Tenant tenant);

    /**
     * To get all features of the current tenant.
     * @return Mono of Map
     */
    Mono<Map<String, Boolean>> getTenantFeatures();

    Mono<Map<String, Boolean>> getTenantFeatures(String tenantId);

    Mono<Tenant> checkAndExecuteMigrationsForTenantFeatureFlags(Tenant tenant);

    CachedFeatures getCachedTenantFeatureFlags();
}
