package com.appsmith.server.solutions;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.solutions.ce.ScheduledTaskCEImpl;

public class ScheduledTaskImpl extends ScheduledTaskCEImpl implements ScheduledTask {
    public ScheduledTaskImpl(
            FeatureFlagService featureFlagService, TenantService tenantService, CommonConfig commonConfig) {
        super(featureFlagService, tenantService, commonConfig);
    }
}
