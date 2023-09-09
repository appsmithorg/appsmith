package com.appsmith.server.helpers;

import com.appsmith.server.constants.FeatureMigrationType;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.CacheableFeatureFlagHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

import static com.appsmith.server.constants.FeatureMigrationType.DISABLE;
import static com.appsmith.server.constants.FeatureMigrationType.ENABLE;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Component
@RequiredArgsConstructor
@Slf4j
public class MigrationFeatureFlagHelper {

    private final CacheableFeatureFlagHelper cacheableFeatureFlagHelper;

    /**
     *  1. Fetch current/saved feature flags from cache
     *  2. Force update the tenant flags keeping existing flags as fallback in case the API call to fetch the flags fails for some reason
     *  3. Get the diff and update the flags with pending migrations to be used to run migrations selectively
     */
    public Mono<Map<FeatureFlagEnum, FeatureMigrationType>> getUpdatedFlagsWithPendingMigration(Tenant defaultTenant) {

        return cacheableFeatureFlagHelper
                .fetchCachedTenantFeatures(defaultTenant.getId())
                .flatMap(existingCachedFlags -> this.refreshTenantFeatures(defaultTenant, existingCachedFlags)
                        .map(latestFlags -> this.getUpdatedFlagsWithPendingMigration(
                                defaultTenant, latestFlags, existingCachedFlags)));
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
        ;
        return cacheableFeatureFlagHelper
                .evictCachedTenantFeatures(tenantId)
                .then(cacheableFeatureFlagHelper.fetchCachedTenantFeatures(tenantId))
                .flatMap(features -> {
                    if (CollectionUtils.isNullOrEmpty(features.getFeatures())) {
                        // In case the retrieval of the latest flags from CS encounters an error, the previous flags
                        // will serve as a fallback value.
                        return cacheableFeatureFlagHelper.updateCachedTenantFeatures(tenantId, existingCachedFeatures);
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
                }
            }
        });
        return getUpdatedFlagsWithPendingMigration(featureDiffsWithMigrationType, tenant);
    }

    private Map<FeatureFlagEnum, FeatureMigrationType> getUpdatedFlagsWithPendingMigration(
            Map<FeatureFlagEnum, FeatureMigrationType> latestFeatureDiffsWithMigrationType, Tenant dbTenant) {

        Map<FeatureFlagEnum, FeatureMigrationType> featuresWithPendingMigrationDB =
                dbTenant.getTenantConfiguration().getFeaturesWithPendingMigration();

        Map<FeatureFlagEnum, FeatureMigrationType> updatedFlagsForMigrations =
                new HashMap<>(featuresWithPendingMigrationDB);

        // We should expect the following state after the latest run:
        // featuresWithPendingMigrationDB       => {feature1 : enable, feature2 : disable}
        // latestFeatureDiffsWithMigrationType  => {feature1 : enable, feature2 : enable, feature3 : disable}
        // updatedFlagsForMigrations            => {feature1 : enable, feature3 : disable}

        updatedFlagsForMigrations.forEach((featureFlagEnum, featureMigrationType) -> {
            if (latestFeatureDiffsWithMigrationType.containsKey(featureFlagEnum)
                    && !featureMigrationType.equals(latestFeatureDiffsWithMigrationType.get(featureFlagEnum))) {
                /*
                Scenario when the migrations will be blocked on user input and may end up in a case where we just have
                to remove the entry as migration it's no longer needed:
                    Step 1: Feature gets enabled by adding a valid licence and enable migration gets registered
                    Step 2: License expires which results in feature getting disabled so migration entry gets registered
                            with disable type (This will happen via cron to check the license status)
                    Step 3: As the migration will be blocked by the user input for downgrade migration, DB state will be
                            maintained
                    Step 4: User adds the valid key or renews the subscription again which results in enabling the
                            feature and ends up in nullifying the effect for step 2
                 */
                updatedFlagsForMigrations.remove(featureFlagEnum);
                latestFeatureDiffsWithMigrationType.remove(featureFlagEnum);
            }
        });
        // Add the latest flags which were not part of earlier check.
        updatedFlagsForMigrations.putAll(latestFeatureDiffsWithMigrationType);
        return updatedFlagsForMigrations;
    }

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
            return this.executeMigrationsBasedOnFeatureFlag(tenant, featureFlagEnum);
        });
    }

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

    private Mono<Boolean> executeMigrationsBasedOnFeatureFlag(Tenant tenant, FeatureFlagEnum featureFlagEnum) {
        // TODO implement migrations as per the supported features in license plan
        return Mono.just(TRUE);
    }
}
