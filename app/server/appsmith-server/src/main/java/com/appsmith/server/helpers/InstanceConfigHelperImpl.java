package com.appsmith.server.helpers;

import com.appsmith.external.services.RTSCaller;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.helpers.ce.InstanceConfigHelperCEImpl;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.solutions.ReleaseNotesService;
import org.springframework.context.ApplicationContext;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.stereotype.Component;

@Component
public class InstanceConfigHelperImpl extends InstanceConfigHelperCEImpl implements InstanceConfigHelper {
    public InstanceConfigHelperImpl(
            ConfigService configService,
            CloudServicesConfig cloudServicesConfig,
            CommonConfig commonConfig,
            ApplicationContext applicationContext,
            ReactiveMongoTemplate reactiveMongoTemplate,
            FeatureFlagService featureFlagService,
            AnalyticsService analyticsService,
            NetworkUtils networkUtils,
            ReleaseNotesService releaseNotesService,
            RTSCaller rtsCaller,
            TenantService tenantService) {
        super(
                configService,
                cloudServicesConfig,
                commonConfig,
                applicationContext,
                reactiveMongoTemplate,
                featureFlagService,
                analyticsService,
                networkUtils,
                releaseNotesService,
                rtsCaller,
                tenantService);
    }
}
