package com.appsmith.server.featureflags;

import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.constants.FeatureMigrationType;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.EnumUtils;

import java.util.HashMap;
import java.util.Map;

public class FeatureFlagUtils {

    public static Map<FeatureFlagEnum, FeatureMigrationType> getValidFeaturesWithPendingMigration(
            TenantConfiguration tenantConfiguration) {
        Map<FeatureFlagEnum, FeatureMigrationType> featureMigrationTypeMap = new HashMap<>();

        if (tenantConfiguration == null
                || CollectionUtils.isNullOrEmpty(tenantConfiguration.getFeaturesWithPendingMigration())) {
            return featureMigrationTypeMap;
        }
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
