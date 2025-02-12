package com.appsmith.server.services.ce;

import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.constants.MigrationStatus;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.CachedFlags;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.FeatureFlagMigrationHelper;
import com.appsmith.server.services.CacheableFeatureFlagHelper;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserIdentifierService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@Slf4j
@RequiredArgsConstructor
public class FeatureFlagServiceCEImpl implements FeatureFlagServiceCE {

    private final SessionUserService sessionUserService;

    private final TenantService tenantService;

    private final UserIdentifierService userIdentifierService;

    private final CacheableFeatureFlagHelper cacheableFeatureFlagHelper;

    private final FeatureFlagMigrationHelper featureFlagMigrationHelper;
    private static final long FEATURE_FLAG_CACHE_TIME_MIN = 120;

    private Map<String, CachedFeatures> cachedTenantFeatureFlags = new HashMap<>();

    /**
     * This function checks if the feature is enabled for the current user. In case the user object is not present,
     * i.e. when the method is getting called internally via cron or other mechanism check for tenant level flag and
     * provide a fallback as falsy value i.e. not supported
     *
     * @param featureEnum   feature flag to be checked
     * @return              Mono emitting a boolean value if the feature is supported
     */
    @Override
    public Mono<Boolean> check(FeatureFlagEnum featureEnum) {
        if (Objects.isNull(featureEnum)) {
            return Mono.just(Boolean.FALSE);
        }
        return this.getAllFeatureFlagsForUser()
                .map(featureMap -> featureMap.getOrDefault(featureEnum.name(), Boolean.FALSE));
    }

    /**
     * Retrieves a map of feature flags along with their corresponding boolean values for the current user.
     * This takes into account for both user-level and tenant-level feature flags
     *
     * @return A Mono emitting a Map where keys are feature names and values are corresponding boolean flags.
     */
    @Override
    public Mono<Map<String, Boolean>> getAllFeatureFlagsForUser() {
        // Combine local flags, remote flags, and tenant features, and merge them into a single map
        return Mono.zip(this.getAllRemoteFeatureFlagsForUser(), this.getTenantFeatures())
                .map(remoteAndTenantFlags -> {
                    Map<String, Boolean> combinedFlags = new HashMap<>();
                    combinedFlags.putAll(remoteAndTenantFlags.getT1());
                    // Always add the tenant level flags after the user flags to make sure tenant flags gets the
                    // precedence
                    combinedFlags.putAll(remoteAndTenantFlags.getT2());
                    return combinedFlags;
                });
    }

    /**
     * This function fetches remote flags (i.e. flagsmith flags)
     *
     * @return
     */
    private Mono<Map<String, Boolean>> getAllRemoteFeatureFlagsForUser() {
        Mono<User> userMono = sessionUserService.getCurrentUser().cache();
        return userMono.flatMap(user -> {
                    String userIdentifier = userIdentifierService.getUserIdentifier(user);
                    // Checks for flags present in cache and if the cache is not expired
                    return cacheableFeatureFlagHelper
                            .fetchUserCachedFlags(userIdentifier, user)
                            .flatMap(cachedFlags -> {
                                if (cachedFlags.getRefreshedAt().until(Instant.now(), ChronoUnit.MINUTES)
                                        < FEATURE_FLAG_CACHE_TIME_MIN) {
                                    return Mono.just(cachedFlags.getFlags());
                                }
                                // empty the cache for the userIdentifier as expired
                                return cacheableFeatureFlagHelper
                                        .evictUserCachedFlags(userIdentifier)
                                        .then(cacheableFeatureFlagHelper.fetchUserCachedFlags(userIdentifier, user))
                                        .flatMap(cachedFlagsUpdated -> {
                                            // In case the retrieval of the latest flags from CS encounters an error,
                                            // the previous flags will serve as a fallback value.
                                            if (cachedFlagsUpdated == null
                                                    || CollectionUtils.isNullOrEmpty(cachedFlagsUpdated.getFlags())) {
                                                return cacheableFeatureFlagHelper
                                                        .updateUserCachedFlags(userIdentifier, cachedFlags)
                                                        .map(CachedFlags::getFlags);
                                            }
                                            return Mono.just(cachedFlagsUpdated.getFlags());
                                        });
                            });
                })
                .switchIfEmpty(Mono.just(new HashMap<>()));
    }

    /**
     * To get all features of the tenant from Cloud Services and store them locally
     * @return Mono updated tenant
     */
    @Override
    public Mono<Tenant> getAllRemoteFeaturesForAllTenantAndUpdateFeatureFlagsWithPendingMigrations(Tenant tenant) {
        // 1. Fetch current/saved feature flags from cache
        // 2. Force update the tenant flags keeping existing flags as fallback in case the API
        //    call to fetch the flags fails for some reason
        // 3. Get the diff and update the flags with pending migrations to be used to run
        //    migrations selectively
        return featureFlagMigrationHelper
                .getUpdatedFlagsWithPendingMigration(tenant)
                .flatMap(featureFlagWithPendingMigrations -> {
                    TenantConfiguration tenantConfig = tenant.getTenantConfiguration() == null
                            ? new TenantConfiguration()
                            : tenant.getTenantConfiguration();
                    // We expect the featureFlagWithPendingMigrations to be empty hence
                    // verifying only for null
                    if (featureFlagWithPendingMigrations != null
                            && !featureFlagWithPendingMigrations.equals(
                                    tenantConfig.getFeaturesWithPendingMigration())) {
                        tenantConfig.setFeaturesWithPendingMigration(featureFlagWithPendingMigrations);
                        if (!featureFlagWithPendingMigrations.isEmpty()) {
                            tenantConfig.setMigrationStatus(MigrationStatus.PENDING);
                        } else {
                            tenantConfig.setMigrationStatus(MigrationStatus.COMPLETED);
                        }
                        return tenantService.update(tenant.getId(), tenant);
                    }
                    return Mono.just(tenant);
                });
    }

    /**
     * To get all features of the current tenant.
     * @return Mono of Map
     */
    @Override
    public Mono<Map<String, Boolean>> getTenantFeatures() {
        // TODO change this to use the tenant from the user session for multi-tenancy
        return tenantService.getDefaultTenantId().flatMap(this::getTenantFeatures);
    }

    @Override
    public Mono<Map<String, Boolean>> getTenantFeatures(String tenantId) {
        return cacheableFeatureFlagHelper
                .fetchCachedTenantFeatures(tenantId)
                .map(cachedFeatures -> {
                    cachedTenantFeatureFlags.put(tenantId, cachedFeatures);
                    return cachedFeatures.getFeatures();
                })
                .switchIfEmpty(Mono.just(new HashMap<>()));
    }

    /**
     * This function checks if there are any pending migrations for a feature flag and executes them.
     * @param tenant    tenant for which the migrations need to be executed
     * @return          tenant with migrations executed
     */
    @Override
    public Mono<Tenant> checkAndExecuteMigrationsForTenantFeatureFlags(Tenant tenant) {
        return tenantService.checkAndExecuteMigrationsForTenantFeatureFlags(tenant);
    }

    @Override
    public CachedFeatures getCachedTenantFeatureFlags() {
        // TODO Avoid blocking call
        return tenantService
                .getDefaultTenantId()
                .map(id -> this.cachedTenantFeatureFlags.get(id))
                .block();
    }
}
