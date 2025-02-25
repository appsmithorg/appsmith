package com.appsmith.server.services;

import com.appsmith.server.helpers.FeatureFlagMigrationHelper;
import com.appsmith.server.services.ce.FeatureFlagServiceCEImpl;
import org.springframework.stereotype.Component;

@Component
public class FeatureFlagServiceImpl extends FeatureFlagServiceCEImpl implements FeatureFlagService {
    public FeatureFlagServiceImpl(
            SessionUserService sessionUserService,
            OrganizationService organizationService,
            UserIdentifierService userIdentifierService,
            CacheableFeatureFlagHelper cacheableFeatureFlagHelper,
            FeatureFlagMigrationHelper featureFlagMigrationHelper) {
        super(
                sessionUserService,
                organizationService,
                userIdentifierService,
                cacheableFeatureFlagHelper,
                featureFlagMigrationHelper);
    }
}
