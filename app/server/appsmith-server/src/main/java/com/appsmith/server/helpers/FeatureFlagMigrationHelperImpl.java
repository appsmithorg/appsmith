package com.appsmith.server.helpers;

import com.appsmith.server.helpers.ce.FeatureFlagMigrationHelperCEImpl;
import com.appsmith.server.services.CacheableFeatureFlagHelper;
import org.springframework.stereotype.Component;

@Component
public class FeatureFlagMigrationHelperImpl extends FeatureFlagMigrationHelperCEImpl
        implements FeatureFlagMigrationHelper {
    public FeatureFlagMigrationHelperImpl(CacheableFeatureFlagHelper cacheableFeatureFlagHelper) {
        super(cacheableFeatureFlagHelper);
    }
}
