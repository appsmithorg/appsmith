package com.appsmith.server.helpers.ce;

import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.constants.FeatureMigrationType;
import com.appsmith.server.domains.Organization;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface FeatureFlagMigrationHelperCE {

    Mono<Map<FeatureFlagEnum, FeatureMigrationType>> getUpdatedFlagsWithPendingMigration(
            Organization defaultOrganization);

    Mono<Map<FeatureFlagEnum, FeatureMigrationType>> getUpdatedFlagsWithPendingMigration(
            Organization organization, boolean forceUpdate);

    Mono<Boolean> checkAndExecuteMigrationsForFeatureFlag(Organization organization, FeatureFlagEnum featureFlagEnum);

    Mono<Boolean> executeMigrationsBasedOnFeatureFlag(Organization organization, FeatureFlagEnum featureFlagEnum);
}
