package com.appsmith.server.helpers.ce;

import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.constants.FeatureMigrationType;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.services.CacheableFeatureFlagHelper;
import com.appsmith.server.solutions.ce.ScheduledTaskCEImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.server.constants.FeatureMigrationType.DISABLE;
import static com.appsmith.server.constants.FeatureMigrationType.ENABLE;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@RequiredArgsConstructor
@Slf4j
public class FeatureFlagMigrationHelperCEImpl implements FeatureFlagMigrationHelperCE {

    private final CacheableFeatureFlagHelper cacheableFeatureFlagHelper;

    /**
     * To avoid race condition keep the refresh rate lower than cron execution interval {@link ScheduledTaskCEImpl}
     * to update the tenant level feature flags
     */
    private static final long TENANT_FEATURES_CACHE_TIME_MIN = 29;

    @Override
    public Mono<Map<FeatureFlagEnum, FeatureMigrationType>> getUpdatedFlagsWithPendingMigration(Tenant defaultTenant) {
        return getUpdatedFlagsWithPendingMigration(defaultTenant, FALSE);
    }

    /**
     * Method to get the updated feature flags with pending migrations. This method finds and registers the flags for
     * migration by comparing the diffs between the feature flags stored in cache and the latest one pulled from CS
     * @param tenant        Tenant for which the feature flags need to be updated
     * @param forceUpdate   Flag to force update the tenant level feature flags
     * @return              Map of feature flags with pending migrations
     */
    @Override
    public Mono<Map<FeatureFlagEnum, FeatureMigrationType>> getUpdatedFlagsWithPendingMigration(
            Tenant tenant, boolean forceUpdate) {

        /*
         *  1. Fetch current/saved feature flags from cache
         *  2. Force update the tenant flags keeping existing flags as fallback in case the API call to fetch the flags fails for some reason
         *  3. Get the diff and update the flags with pending migrations to be used to run migrations selectively
         */
        return cacheableFeatureFlagHelper
                .fetchCachedTenantFeatures(tenant.getId())
                .zipWhen(existingCachedFlags -> {
                    if (existingCachedFlags.getRefreshedAt().until(Instant.now(), ChronoUnit.MINUTES)
                                    < TENANT_FEATURES_CACHE_TIME_MIN
                            && !forceUpdate) {
                        return Mono.just(existingCachedFlags);
                    }
                    return this.refreshTenantFeatures(tenant, existingCachedFlags);
                })
                .map(tuple2 -> {
                    CachedFeatures existingCachedFlags = tuple2.getT1();
                    CachedFeatures latestFlags = tuple2.getT2();
                    return this.getUpdatedFlagsWithPendingMigration(tenant, latestFlags, existingCachedFlags);
                });
    }

    /**
     * Method to force update the tenant level feature flags. This will be utilised in scenarios where we don't want
     * to wait for the flags to get updated for cron scheduled time
     *
     * @param tenant    tenant for which the feature flags need to be updated
     * @return          Cached features
     */
    private Mono<CachedFeatures> refreshTenantFeatures(Tenant tenant, CachedFeatures existingCachedFeatures) {
        /*
        1. Force update the flag
            a. Evict the cache
            b. Fetch and save latest flags from CS
        2. In case the tenant is unable to fetch the latest flags save the existing flags from step 1 to cache (fallback)
         */
        String tenantId = tenant.getId();
        return cacheableFeatureFlagHelper
                .evictCachedTenantFeatures(tenantId)
                .then(cacheableFeatureFlagHelper.fetchCachedTenantFeatures(tenantId))
                .flatMap(features -> {
                    if (CollectionUtils.isNullOrEmpty(features.getFeatures())) {
                        // In case the retrieval of the latest flags from CS encounters an error, the previous flags
                        // will serve as a fallback value.
                        return cacheableFeatureFlagHelper
                                .evictCachedTenantFeatures(tenantId)
                                .then(cacheableFeatureFlagHelper.updateCachedTenantFeatures(
                                        tenantId, existingCachedFeatures));
                    }
                    return Mono.just(features);
                });
    }

    /**
     * Method to check the diffs between the existing feature flags and the latest flags pulled from CS. If there are
     * any diffs save the flags with required migration types:
     * Flag transitions:
     * 1. false -> true : Migration to enable the feature flag
     * 2. true -> false : Migration to disable the feature flag
     * 3. There is a scenario when the migrations will be blocked on user input and may end up in a case where we just
     * have to remove the entry as migration it's no longer needed:
     *      Step 1: Feature gets enabled by adding a valid licence and enable migration gets registered
     *      Step 2: License expires which results in feature getting disabled so migration entry gets registered with
     *              disable type (This will happen via cron to check the license status)
     *      Step 3: As the migration will be blocked by the user input for downgrade migration, DB state will be
     *              maintained
     *      Step 4: User adds the valid key or renews the subscription again which results in enabling the feature and
     *              ends up in nullifying the effect for step 2
     *
     * @param tenant                    Tenant for which the feature flag migrations stats needs to be stored
     * @param latestFlags               Latest flags pulled in from CS
     * @param existingCachedFlags       Flags which are already stored in cache
     * @return                          updated tenant with the required flags with pending migrations
     */
    private Map<FeatureFlagEnum, FeatureMigrationType> getUpdatedFlagsWithPendingMigration(
            Tenant tenant, CachedFeatures latestFlags, CachedFeatures existingCachedFlags) {

        // 1. Check if there are any diffs for the feature flags
        // 2. Update the flags for pending migration within provided tenant object
        Map<FeatureFlagEnum, FeatureMigrationType> featureDiffsWithMigrationType = new HashMap<>();
        Map<String, Boolean> existingFeatureMap = existingCachedFlags.getFeatures();
        latestFlags.getFeatures().forEach((key, value) -> {
            if (value != null && !value.equals(existingFeatureMap.get(key))) {
                try {
                    featureDiffsWithMigrationType.put(
                            FeatureFlagEnum.valueOf(key), Boolean.TRUE.equals(value) ? ENABLE : DISABLE);
                } catch (Exception e) {
                    // Ignore IllegalArgumentException as all the feature flags are not added on
                    // server side
                    if (!(e instanceof IllegalArgumentException)) {
                        log.error("Error while parsing the feature flag {} with value {}", key, value, e);
                    }
                }
            }
        });
        return getUpdatedFlagsWithPendingMigration(featureDiffsWithMigrationType, tenant);
    }

    private Map<FeatureFlagEnum, FeatureMigrationType> getUpdatedFlagsWithPendingMigration(
            Map<FeatureFlagEnum, FeatureMigrationType> latestFeatureDiffsWithMigrationType, Tenant dbTenant) {

        Map<FeatureFlagEnum, FeatureMigrationType> featuresWithPendingMigrationDB =
                dbTenant.getTenantConfiguration().getFeaturesWithPendingMigration() == null
                        ? new HashMap<>()
                        : dbTenant.getTenantConfiguration().getFeaturesWithPendingMigration();

        Map<FeatureFlagEnum, FeatureMigrationType> updatedFlagsForMigrations =
                new HashMap<>(featuresWithPendingMigrationDB);

        // We should expect the following state after the latest run:
        // featuresWithPendingMigrationDB       => {feature1 : enable, feature2 : disable}
        // latestFeatureDiffsWithMigrationType  => {feature1 : enable, feature2 : enable, feature3 : disable}
        // updatedFlagsForMigrations            => {feature1 : enable, feature3 : disable}
        List<FeatureFlagEnum> featureFlagsToBeRemoved = new ArrayList<>();
        updatedFlagsForMigrations.forEach((featureFlagEnum, featureMigrationType) -> {
            if (latestFeatureDiffsWithMigrationType.containsKey(featureFlagEnum)
                    && !featureMigrationType.equals(latestFeatureDiffsWithMigrationType.get(featureFlagEnum))) {
                /*
                Scenario when the migrations will be blocked on user input and may end up in a case where we just have
                to remove the entry as migration is no longer needed:
                    Step 1: Feature gets enabled by adding a valid licence and enable migration gets registered
                    Step 2: License expires which results in feature getting disabled so migration entry gets registered
                            with disable type (This will happen via cron to check the license status)
                    Step 3: As the migration will be blocked by the user input for downgrade migration, DB state will be
                            maintained
                    Step 4: User adds the valid key or renews the subscription again which results in enabling the
                            feature and ends up in nullifying the effect for step 2
                 */
                featureFlagsToBeRemoved.add(featureFlagEnum);
            }
        });

        // Added a separate loop to remove the flags as we cannot remove the entry while iterating over the map to
        // avoid the ConcurrentModificationException
        featureFlagsToBeRemoved.forEach(featureFlagEnum -> {
            updatedFlagsForMigrations.remove(featureFlagEnum);
            latestFeatureDiffsWithMigrationType.remove(featureFlagEnum);
        });
        // Add the latest flags which were not part of earlier check.
        updatedFlagsForMigrations.putAll(latestFeatureDiffsWithMigrationType);
        return updatedFlagsForMigrations;
    }

    /**
     * Method to check and execute if the migrations are required for the provided feature flag.
     * @param tenant            Tenant for which the migrations need to be executed
     * @param featureFlagEnum   Feature flag for which the migrations need to be executed
     * @return                  Boolean indicating if the migrations is successfully executed or not
     */
    public Mono<Boolean> checkAndExecuteMigrationsForFeatureFlag(Tenant tenant, FeatureFlagEnum featureFlagEnum) {

        TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
        if (featureFlagEnum == null
                || tenantConfiguration == null
                || CollectionUtils.isNullOrEmpty(tenantConfiguration.getFeaturesWithPendingMigration())) {
            return Mono.just(TRUE);
        }
        return isMigrationRequired(tenant, featureFlagEnum).flatMap(isMigrationRequired -> {
            if (FALSE.equals(isMigrationRequired)) {
                return Mono.just(TRUE);
            }

            Map<FeatureFlagEnum, FeatureMigrationType> featuresWithPendingMigration =
                    tenantConfiguration.getFeaturesWithPendingMigration();
            if (CollectionUtils.isNullOrEmpty(featuresWithPendingMigration)
                    || !featuresWithPendingMigration.containsKey(featureFlagEnum)) {
                return Mono.just(TRUE);
            }
            log.debug(
                    "Running the migration for flag {} with migration type {}",
                    featureFlagEnum.name(),
                    featuresWithPendingMigration.get(featureFlagEnum));
            return this.executeMigrationsBasedOnFeatureFlag(tenant, featureFlagEnum);
        });
    }

    /**
     * Method to check if the migrations are required for the provided feature flag.
     * @param tenant            Tenant for which the migrations need to be executed
     * @param featureFlagEnum   Feature flag for which the migrations need to be executed
     * @return                  Boolean indicating if the migrations is required or not
     */
    private Mono<Boolean> isMigrationRequired(Tenant tenant, FeatureFlagEnum featureFlagEnum) {
        Map<FeatureFlagEnum, FeatureMigrationType> featureMigrationTypeMap =
                tenant.getTenantConfiguration().getFeaturesWithPendingMigration();
        if (CollectionUtils.isNullOrEmpty(featureMigrationTypeMap)) {
            return Mono.just(FALSE);
        }
        return cacheableFeatureFlagHelper
                .fetchCachedTenantFeatures(tenant.getId())
                .map(cachedFeatures -> {
                    Map<String, Boolean> featureFlags = cachedFeatures.getFeatures();
                    if (featureFlags.containsKey(featureFlagEnum.name())) {
                        return (TRUE.equals(featureFlags.get(featureFlagEnum.name()))
                                        && FeatureMigrationType.ENABLE.equals(
                                                featureMigrationTypeMap.get(featureFlagEnum)))
                                || (FALSE.equals(featureFlags.get(featureFlagEnum.name()))
                                        && FeatureMigrationType.DISABLE.equals(
                                                featureMigrationTypeMap.get(featureFlagEnum)));
                    }
                    return FALSE;
                });
    }

    /**
     * Method to execute the migrations for the given feature flag.
     * @param tenant                Tenant for which the migrations need to be executed
     * @param featureFlagEnum       Feature flag for which the migrations need to be executed
     * @return                      Boolean indicating if the migrations is successfully executed or not
     */
    @Override
    public Mono<Boolean> executeMigrationsBasedOnFeatureFlag(Tenant tenant, FeatureFlagEnum featureFlagEnum) {
        return Mono.just(TRUE);
    }
}
