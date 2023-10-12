package com.appsmith.server.services.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.MigrationStatus;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.CachedFlags;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.FeatureFlagMigrationHelper;
import com.appsmith.server.services.CacheableFeatureFlagHelper;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserIdentifierService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.ff4j.FF4j;
import org.ff4j.core.FlippingExecutionContext;
import org.ff4j.exception.FeatureNotFoundException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

import static java.lang.Boolean.TRUE;

@Slf4j
@RequiredArgsConstructor
public class FeatureFlagServiceCEImpl implements FeatureFlagServiceCE {

    private final SessionUserService sessionUserService;

    private final FF4j ff4j;

    private final TenantService tenantService;

    private final UserIdentifierService userIdentifierService;

    private final CacheableFeatureFlagHelper cacheableFeatureFlagHelper;

    private final FeatureFlagMigrationHelper featureFlagMigrationHelper;
    private static final long FEATURE_FLAG_CACHE_TIME_MIN = 120;

    private CachedFeatures cachedTenantFeatureFlags;

    private Mono<Boolean> checkAll(String featureName, User user) {
        Boolean check = check(featureName, user);

        if (TRUE.equals(check)) {
            return Mono.just(true);
        }

        return getAllFeatureFlagsForUser()
                .flatMap(featureMap -> Mono.justOrEmpty(featureMap.get(featureName)))
                .switchIfEmpty(Mono.just(false));
    }

    @Override
    public Mono<Boolean> check(FeatureFlagEnum featureEnum, User user) {
        if (featureEnum == null) {
            return Mono.just(false);
        }
        return checkAll(featureEnum.toString(), user);
    }

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
        // Check if the feature is supported at the tenant level and provide a fallback as falsy value
        // i.e. not supported
        Mono<Boolean> isTenantFeatureSupported = this.getTenantFeatures()
                .flatMap(featureMap -> Mono.justOrEmpty(featureMap.get(featureEnum.name())))
                .switchIfEmpty(Mono.just(false));

        return sessionUserService
                .getCurrentUser()
                .flatMap(user -> check(featureEnum, user))
                .switchIfEmpty(isTenantFeatureSupported);
    }

    @Override
    public Boolean check(String featureName, User user) {
        try {
            return ff4j.check(featureName, new FlippingExecutionContext(Map.of(FieldName.USER, user)));
        } catch (Exception e) {
            // FF4J is configured not to auto-generate a flag if it's not present in init-flags.xml
            // (see FeatureFlagConfig.java).
            // Consequently, we anticipate that the flag may not exist in the FF4J context and need to handle any
            // related exceptions silently.
            if (!(e instanceof FeatureNotFoundException)) {
                log.error("Error checking feature flag: {}", featureName, e);
            }
        }
        return false;
    }

    /**
     * Retrieves a map of feature flags along with their corresponding boolean values for the current user.
     * This takes into account for both user-level and tenant-level feature flags
     *
     * @return A Mono emitting a Map where keys are feature names and values are corresponding boolean flags.
     */
    @Override
    public Mono<Map<String, Boolean>> getAllFeatureFlagsForUser() {
        Mono<User> currentUser = sessionUserService.getCurrentUser().cache();
        Flux<Tuple2<String, User>> featureUserTuple = Flux.fromIterable(
                        ff4j.getFeatures().keySet())
                .flatMap(featureName -> Mono.just(featureName).zipWith(currentUser));

        // Filter out anonymous users, then collect feature flags into a Map
        Mono<Map<String, Boolean>> localFlagsForUser = featureUserTuple
                .filter(objects -> !objects.getT2().isAnonymous())
                .collectMap(Tuple2::getT1, tuple -> check(tuple.getT1(), tuple.getT2()));

        // Combine local flags, remote flags, and tenant features, and merge them into a single map
        return localFlagsForUser.flatMap(localFlags -> this.getAllRemoteFeatureFlagsForUser()
                .zipWith(this.getTenantFeatures())
                .map(remoteAndTenantFlags -> {
                    Map<String, Boolean> combinedFlags = new HashMap<>(localFlags);
                    combinedFlags.putAll(remoteAndTenantFlags.getT1());
                    // Always add the tenant level flags after the user flags to make sure tenant flags gets the
                    // precedence
                    combinedFlags.putAll(remoteAndTenantFlags.getT2());
                    return combinedFlags;
                }));
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
                        } else {
                            // empty the cache for the userIdentifier as expired
                            return cacheableFeatureFlagHelper
                                    .evictUserCachedFlags(userIdentifier)
                                    .then(cacheableFeatureFlagHelper.fetchUserCachedFlags(userIdentifier, user))
                                    .flatMap(cachedFlagsUpdated -> {
                                        // In case the retrieval of the latest flags from CS encounters an error, the
                                        // previous flags will serve as a fallback value.
                                        if (cachedFlagsUpdated == null
                                                || CollectionUtils.isNullOrEmpty(cachedFlagsUpdated.getFlags())) {
                                            return cacheableFeatureFlagHelper
                                                    .updateUserCachedFlags(userIdentifier, cachedFlags)
                                                    .map(CachedFlags::getFlags);
                                        }
                                        return Mono.just(cachedFlagsUpdated.getFlags());
                                    });
                        }
                    });
        });
    }

    /**
     * To get all features of the tenant from Cloud Services and store them locally
     * @return Mono of Void
     */
    public Mono<Void> getAllRemoteFeaturesForTenantAndUpdateFeatureFlagsWithPendingMigrations() {
        return tenantService
                .getDefaultTenant()
                .flatMap(defaultTenant ->
                        // 1. Fetch current/saved feature flags from cache
                        // 2. Force update the tenant flags keeping existing flags as fallback in case the API
                        //    call to fetch the flags fails for some reason
                        // 3. Get the diff and update the flags with pending migrations to be used to run
                        //    migrations selectively
                        featureFlagMigrationHelper
                                .getUpdatedFlagsWithPendingMigration(defaultTenant)
                                .flatMap(featureFlagWithPendingMigrations -> {
                                    TenantConfiguration tenantConfig = defaultTenant.getTenantConfiguration() == null
                                            ? new TenantConfiguration()
                                            : defaultTenant.getTenantConfiguration();
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
                                        return tenantService.update(defaultTenant.getId(), defaultTenant);
                                    }
                                    return Mono.just(defaultTenant);
                                }))
                .then();
    }

    /**
     * To get all features of the current tenant.
     * @return Mono of Map
     */
    public Mono<Map<String, Boolean>> getTenantFeatures() {
        return tenantService
                .getDefaultTenantId()
                .flatMap(cacheableFeatureFlagHelper::fetchCachedTenantFeatures)
                .map(cachedFeatures -> {
                    cachedTenantFeatureFlags = cachedFeatures;
                    return cachedFeatures.getFeatures();
                });
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
        return this.cachedTenantFeatureFlags;
    }
}
