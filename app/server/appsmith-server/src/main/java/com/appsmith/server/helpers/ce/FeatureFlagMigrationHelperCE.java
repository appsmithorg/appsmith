package com.appsmith.server.helpers.ce;

import com.appsmith.server.constants.FeatureMigrationType;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface FeatureFlagMigrationHelperCE {

    Mono<Map<FeatureFlagEnum, FeatureMigrationType>> getUpdatedFlagsWithPendingMigration(Tenant defaultTenant);

    Mono<Map<FeatureFlagEnum, FeatureMigrationType>> getUpdatedFlagsWithPendingMigration(
            Tenant tenant, boolean forceUpdate);

    Mono<Boolean> checkAndExecuteMigrationsForFeatureFlag(Tenant tenant, FeatureFlagEnum featureFlagEnum);

    Mono<Boolean> executeMigrationsBasedOnFeatureFlag(Tenant tenant, FeatureFlagEnum featureFlagEnum);
}
