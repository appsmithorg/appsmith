package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Tenant;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.FeatureFlagEnum;
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
    Mono<Void> getAllRemoteFeaturesForTenantAndUpdateFeatureFlagsWithPendingMigrations();

    /**
     * To get all features of the current tenant.
     * @return Mono of Map
     */
    Mono<Map<String, Boolean>> getTenantFeatures();

    Mono<Tenant> checkAndExecuteMigrationsForTenantFeatureFlags(Tenant tenant);

    CachedFeatures getCachedTenantFeatureFlags();
}
