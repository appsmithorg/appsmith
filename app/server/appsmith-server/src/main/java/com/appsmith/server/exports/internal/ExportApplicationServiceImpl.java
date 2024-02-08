package com.appsmith.server.exports.internal;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ExportApplicationServiceImpl extends ExportApplicationServiceCEImpl implements ExportApplicationService {

    public ExportApplicationServiceImpl(
            SessionUserService sessionUserService,
            WorkspaceService workspaceService,
            ApplicationService applicationService,
            AnalyticsService analyticsService,
            ApplicationPermission applicationPermission,
            Gson gson,
            ExportableService<Datasource> datasourceExportableService,
            ExportableService<Plugin> pluginExportableService,
            ExportableService<NewPage> newPageExportableService,
            ExportableService<NewAction> newActionExportableService,
            ExportableService<ActionCollection> actionCollectionExportableService,
            ExportableService<Theme> themeExportableService,
            ExportableService<CustomJSLib> customJSLibExportableService) {
        super(
                sessionUserService,
                workspaceService,
                applicationService,
                analyticsService,
                applicationPermission,
                gson,
                datasourceExportableService,
                pluginExportableService,
                newPageExportableService,
                newActionExportableService,
                actionCollectionExportableService,
                themeExportableService,
                customJSLibExportableService);
    }
}
