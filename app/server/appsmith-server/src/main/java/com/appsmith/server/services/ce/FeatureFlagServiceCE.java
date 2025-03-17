package com.appsmith.server.services.ce;

import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.domains.Organization;
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
     * To get all features of the organization from Cloud Services and store them locally
     * @return Mono of Void
     */
    Mono<Organization> getAllRemoteFeaturesForOrganizationAndUpdateFeatureFlagsWithPendingMigrations(
            Organization organization);

    /**
     * To get all features of the current organization.
     * @return Mono of Map
     */
    Mono<Map<String, Boolean>> getOrganizationFeatures();

    Mono<Map<String, Boolean>> getOrganizationFeatures(String orgId);

    Mono<Organization> checkAndExecuteMigrationsForOrganizationFeatureFlags(Organization organization);

    CachedFeatures getCachedOrganizationFeatureFlags(String organizationId);
}
