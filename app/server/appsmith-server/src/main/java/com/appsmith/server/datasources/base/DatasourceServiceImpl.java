package com.appsmith.server.datasources.base;

import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.DatasourceContextService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.SequenceService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.appsmith.server.solutions.WorkspacePermission;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class DatasourceServiceImpl extends DatasourceServiceCEImpl implements DatasourceService {

    public DatasourceServiceImpl(
            DatasourceRepository repository,
            WorkspaceService workspaceService,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            PluginService pluginService,
            PluginExecutorHelper pluginExecutorHelper,
            PolicyGenerator policyGenerator,
            SequenceService sequenceService,
            NewActionRepository newActionRepository,
            DatasourceContextService datasourceContextService,
            DatasourcePermission datasourcePermission,
            WorkspacePermission workspacePermission,
            DatasourceStorageService datasourceStorageService,
            EnvironmentPermission environmentPermission,
            RateLimitService rateLimitService,
            FeatureFlagService featureFlagService,
            ObservationRegistry observationRegistry,
            TenantService tenantService,
            ConfigService configService) {

        super(
                repository,
                workspaceService,
                analyticsService,
                sessionUserService,
                pluginService,
                pluginExecutorHelper,
                policyGenerator,
                sequenceService,
                newActionRepository,
                datasourceContextService,
                datasourcePermission,
                workspacePermission,
                datasourceStorageService,
                environmentPermission,
                rateLimitService,
                featureFlagService,
                observationRegistry,
                tenantService,
                configService);
    }
}
