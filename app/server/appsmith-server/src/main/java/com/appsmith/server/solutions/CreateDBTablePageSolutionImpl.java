package com.appsmith.server.solutions;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.ce.CreateDBTablePageSolutionCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class CreateDBTablePageSolutionImpl extends CreateDBTablePageSolutionCEImpl
        implements CreateDBTablePageSolution {
    public CreateDBTablePageSolutionImpl(
            DatasourceService datasourceService,
            DatasourceStorageService datasourceStorageService,
            NewPageService newPageService,
            LayoutActionService layoutActionService,
            UpdateLayoutService updateLayoutService,
            ApplicationPageService applicationPageService,
            ApplicationService applicationService,
            PluginService pluginService,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            PluginExecutorHelper pluginExecutorHelper,
            DatasourcePermission datasourcePermission,
            ApplicationPermission applicationPermission,
            PagePermission pagePermission,
            DatasourceStructureSolution datasourceStructureSolution,
            EnvironmentPermission environmentPermission,
            JsonSchemaMigration jsonSchemaMigration) {
        super(
                datasourceService,
                datasourceStorageService,
                newPageService,
                layoutActionService,
                updateLayoutService,
                applicationPageService,
                applicationService,
                pluginService,
                analyticsService,
                sessionUserService,
                pluginExecutorHelper,
                datasourcePermission,
                applicationPermission,
                pagePermission,
                datasourceStructureSolution,
                environmentPermission,
                jsonSchemaMigration);
    }
}
