package com.appsmith.server.services.ce;

import com.appsmith.server.constants.FeatureMigrationType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.MigrationStatus;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.CachedFlags;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.MigrationFeatureFlagHelper;
import com.appsmith.server.services.CacheableFeatureFlagHelper;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserIdentifierService;
import com.appsmith.server.solutions.ce.ScheduledTaskCEImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.ff4j.FF4j;
import org.ff4j.core.FlippingExecutionContext;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import static java.lang.Boolean.TRUE;

@Slf4j
@RequiredArgsConstructor
public class FeatureFlagServiceCEImpl implements FeatureFlagServiceCE {

    private final SessionUserService sessionUserService;

    private final FF4j ff4j;

    private final TenantService tenantService;

    private final UserIdentifierService userIdentifierService;

    private final CacheableFeatureFlagHelper cacheableFeatureFlagHelper;

    private final MigrationFeatureFlagHelper migrationFeatureFlagHelper;
    private final long featureFlagCacheTimeMin = 120;

    /**
     * To avoid race condition keep the refresh rate lower than cron execution interval {@link ScheduledTaskCEImpl}
     * to update the tenant level feature flags
     */
    private final long tenantFeaturesCacheTimeMin = 115;

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

    @Override
    public Mono<Boolean> check(FeatureFlagEnum featureEnum) {
        return sessionUserService.getCurrentUser().flatMap(user -> check(featureEnum, user));
    }

    @Override
    public Boolean check(String featureName, User user) {
        return ff4j.check(featureName, new FlippingExecutionContext(Map.of(FieldName.USER, user)));
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
                                < this.featureFlagCacheTimeMin) {
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
                .flatMap(defaultTenant -> cacheableFeatureFlagHelper
                        .fetchCachedTenantFeatures(defaultTenant.getId())
                        .flatMap(cachedFeatures -> {
                            if (cachedFeatures.getRefreshedAt().until(Instant.now(), ChronoUnit.MINUTES)
                                    < this.tenantFeaturesCacheTimeMin) {
                                return Mono.just(cachedFeatures);
                            } else {
                                // 1. Fetch current/saved feature flags from cache
                                // 2. Force update the tenant flags keeping existing flags as fallback in case the API
                                // call to fetch the flags fails for some reason
                                // 3. Get the diff and update the flags with pending migrations to be used to run
                                // migrations selectively
                                return migrationFeatureFlagHelper
                                        .getUpdatedFlagsWithPendingMigration(defaultTenant)
                                        .flatMap(featureFlagWithPendingMigrations -> {
                                            TenantConfiguration tenantConfig =
                                                    defaultTenant.getTenantConfiguration() == null
                                                            ? new TenantConfiguration()
                                                            : defaultTenant.getTenantConfiguration();
                                            tenantConfig.setFeaturesWithPendingMigration(
                                                    featureFlagWithPendingMigrations);
                                            if (!featureFlagWithPendingMigrations.isEmpty()) {
                                                tenantConfig.setMigrationStatus(MigrationStatus.PENDING);
                                            }
                                            return tenantService.update(defaultTenant.getId(), defaultTenant);
                                        });
                            }
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
                .map(CachedFeatures::getFeatures);
    }

    @Override
    public Mono<Tenant> checkAndExecuteMigrationsForFeatureFlag(Tenant tenant) {
        if (tenant.getTenantConfiguration() == null
                || tenant.getTenantConfiguration().getFeaturesWithPendingMigration() == null) {
            return Mono.just(tenant);
        }
        Map<FeatureFlagEnum, FeatureMigrationType> featureMigrationTypeMap =
                tenant.getTenantConfiguration().getFeaturesWithPendingMigration();

        Set<FeatureFlagEnum> featureFlagSet = featureMigrationTypeMap.keySet();
        FeatureFlagEnum featureFlagEnum = featureFlagSet.stream().findFirst().orElse(null);
        return migrationFeatureFlagHelper
                .checkAndExecuteMigrationsForFeatureFlag(tenant, featureFlagEnum)
                .flatMap(isSuccessful -> {
                    if (TRUE.equals(isSuccessful)) {
                        featureMigrationTypeMap.remove(featureFlagEnum);
                        if (CollectionUtils.isNullOrEmpty(featureMigrationTypeMap)) {
                            tenant.getTenantConfiguration().setMigrationStatus(MigrationStatus.EXECUTED);
                        } else {
                            tenant.getTenantConfiguration().setMigrationStatus(MigrationStatus.IN_PROGRESS);
                        }
                        return tenantService
                                .update(tenant.getId(), tenant)
                                .flatMap(this::checkAndExecuteMigrationsForFeatureFlag);
                    }
                    return Mono.error(new AppsmithException(AppsmithError.IO_ERROR));
                });
    }
}
