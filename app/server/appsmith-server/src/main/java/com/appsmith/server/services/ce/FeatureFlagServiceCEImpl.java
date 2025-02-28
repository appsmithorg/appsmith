package com.appsmith.server.services.ce;

import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.constants.MigrationStatus;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.CachedFlags;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.FeatureFlagMigrationHelper;
import com.appsmith.server.services.CacheableFeatureFlagHelper;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserIdentifierService;
import lombok.Getter;
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

    private final OrganizationService organizationService;

    private final UserIdentifierService userIdentifierService;

    private final CacheableFeatureFlagHelper cacheableFeatureFlagHelper;

    private final FeatureFlagMigrationHelper featureFlagMigrationHelper;
    private static final long FEATURE_FLAG_CACHE_TIME_MIN = 120;

    // TODO @CloudBilling: Remove once all the helper methods consuming @FeatureFlagged are converted to reactive
    @Getter
    private CachedFeatures cachedOrganizationFeatureFlags;

    /**
     * This function checks if the feature is enabled for the current user. In case the user object is not present,
     * i.e. when the method is getting called internally via cron or other mechanism check for organization level flag and
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
     * This takes into account for both user-level and organization-level feature flags.
     *
     * @return A Mono emitting a Map where keys are feature names and values are corresponding boolean flags.
     */
    @Override
    public Mono<Map<String, Boolean>> getAllFeatureFlagsForUser() {
        // Combine local flags, remote flags, and organization features, and merge them into a single map
        return Mono.zip(this.getAllRemoteFeatureFlagsForUser(), this.getOrganizationFeatures())
                .map(remoteAndOrganizationFlags -> {
                    Map<String, Boolean> combinedFlags = new HashMap<>();
                    combinedFlags.putAll(remoteAndOrganizationFlags.getT1());
                    // Always add the organization level flags after the user flags to make sure organization flags gets
                    // the precedence
                    combinedFlags.putAll(remoteAndOrganizationFlags.getT2());
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
     * To get all features of the organization from Cloud Services and store them locally
     * @return Mono updated org
     */
    @Override
    public Mono<Organization> getAllRemoteFeaturesForOrganizationAndUpdateFeatureFlagsWithPendingMigrations(
            Organization organization) {
        // 1. Fetch current/saved feature flags from cache
        // 2. Force update the org flags keeping existing flags as fallback in case the API
        //    call to fetch the flags fails for some reason
        // 3. Get the diff and update the flags with pending migrations to be used to run
        //    migrations selectively
        return featureFlagMigrationHelper
                .getUpdatedFlagsWithPendingMigration(organization)
                .flatMap(featureFlagWithPendingMigrations -> {
                    OrganizationConfiguration organizationConfiguration =
                            organization.getOrganizationConfiguration() == null
                                    ? new OrganizationConfiguration()
                                    : organization.getOrganizationConfiguration();
                    // We expect the featureFlagWithPendingMigrations to be empty hence
                    // verifying only for null
                    if (featureFlagWithPendingMigrations != null
                            && !featureFlagWithPendingMigrations.equals(
                                    organizationConfiguration.getFeaturesWithPendingMigration())) {
                        organizationConfiguration.setFeaturesWithPendingMigration(featureFlagWithPendingMigrations);
                        if (!featureFlagWithPendingMigrations.isEmpty()) {
                            organizationConfiguration.setMigrationStatus(MigrationStatus.PENDING);
                        } else {
                            organizationConfiguration.setMigrationStatus(MigrationStatus.COMPLETED);
                        }
                        return organizationService.update(organization.getId(), organization);
                    }
                    return Mono.just(organization);
                });
    }

    /**
     * To get all features of the current organization.
     * @return Mono of Map
     */
    @Override
    public Mono<Map<String, Boolean>> getOrganizationFeatures() {
        return organizationService.getCurrentUserOrganizationId().flatMap(this::getOrganizationFeatures);
    }

    @Override
    public Mono<Map<String, Boolean>> getOrganizationFeatures(String organizationId) {
        return cacheableFeatureFlagHelper
                .fetchCachedOrganizationFeatures(organizationId)
                .map(cachedFeatures -> {
                    cachedOrganizationFeatureFlags = cachedFeatures;
                    return cachedFeatures.getFeatures();
                })
                .switchIfEmpty(Mono.just(new HashMap<>()));
    }

    /**
     * This function checks if there are any pending migrations for a feature flag and executes them.
     * @param organization    organization for which the migrations need to be executed
     * @return          organization with migrations executed
     */
    @Override
    public Mono<Organization> checkAndExecuteMigrationsForOrganizationFeatureFlags(Organization organization) {
        return organizationService.checkAndExecuteMigrationsForOrganizationFeatureFlags(organization);
    }
}
