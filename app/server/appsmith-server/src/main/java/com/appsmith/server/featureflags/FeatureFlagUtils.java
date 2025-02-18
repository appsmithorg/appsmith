package com.appsmith.server.featureflags;

import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.constants.FeatureMigrationType;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.helpers.EnumUtils;

import java.util.HashMap;
import java.util.Map;

public class FeatureFlagUtils {

    public static Map<FeatureFlagEnum, FeatureMigrationType> getValidFeaturesWithPendingMigration(
            TenantConfiguration tenantConfiguration) {

        // Only check for null value for featuresWithPendingMigration as empty map is a valid state and migration
        // status is updated to completed based on number of elements in the map
        if (tenantConfiguration == null || tenantConfiguration.getFeaturesWithPendingMigration() == null) {
            return null;
        }

        Map<FeatureFlagEnum, FeatureMigrationType> featureMigrationTypeMap = new HashMap<>();
        tenantConfiguration.getFeaturesWithPendingMigration().forEach((featureFlag, featureMigrationType) -> {
            FeatureFlagEnum featureFlagEnum = EnumUtils.getEnumFromString(FeatureFlagEnum.class, featureFlag);
            if (featureFlagEnum == null) {
                return;
            }
            featureMigrationTypeMap.put(featureFlagEnum, featureMigrationType);
        });
        return featureMigrationTypeMap;
    }
}
