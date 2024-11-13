package com.appsmith.server.solutions;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.helpers.ActionExecutionSolutionHelper;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.AuthenticationValidator;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.DatasourceContextService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.solutions.ce.ActionExecutionSolutionCEImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.observation.ObservationRegistry;
import org.springframework.stereotype.Service;

@Service
public class ActionExecutionSolutionImpl extends ActionExecutionSolutionCEImpl implements ActionExecutionSolution {
    public ActionExecutionSolutionImpl(
            NewActionService newActionService,
            ActionPermission actionPermission,
            ObservationRegistry observationRegistry,
            ObjectMapper objectMapper,
            DatasourceService datasourceService,
            PluginService pluginService,
            DatasourceContextService datasourceContextService,
            PluginExecutorHelper pluginExecutorHelper,
            NewPageService newPageService,
            ApplicationService applicationService,
            SessionUserService sessionUserService,
            AuthenticationValidator authenticationValidator,
            DatasourcePermission datasourcePermission,
            AnalyticsService analyticsService,
            DatasourceStorageService datasourceStorageService,
            EnvironmentPermission environmentPermission,
            ConfigService configService,
            TenantService tenantService,
            CommonConfig commonConfig,
            ActionExecutionSolutionHelper actionExecutionSolutionHelper) {
        super(
                newActionService,
                actionPermission,
                observationRegistry,
                objectMapper,
                datasourceService,
                pluginService,
                datasourceContextService,
                pluginExecutorHelper,
                newPageService,
                applicationService,
                sessionUserService,
                authenticationValidator,
                datasourcePermission,
                analyticsService,
                datasourceStorageService,
                environmentPermission,
                configService,
                tenantService,
                commonConfig,
                actionExecutionSolutionHelper);
    }
}
