package com.appsmith.server.applications.base;

import com.appsmith.server.applications.imports.ApplicationImportService;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import com.google.gson.Gson;
import org.springframework.stereotype.Component;

@Component
public class ApplicationImportServiceImpl extends ApplicationImportServiceCEImpl implements ApplicationImportService {

    public ApplicationImportServiceImpl(
            DatasourceService datasourceService,
            WorkspaceService workspaceService,
            ApplicationService applicationService,
            ApplicationPageService applicationPageService,
            NewActionService newActionService,
            AnalyticsService analyticsService,
            DatasourcePermission datasourcePermission,
            WorkspacePermission workspacePermission,
            ApplicationPermission applicationPermission,
            PagePermission pagePermission,
            ActionPermission actionPermission,
            Gson gson,
            ImportableService<Theme> themeImportableService,
            ImportableService<NewPage> newPageImportableService,
            ImportableService<CustomJSLib> customJSLibImportableService,
            ImportableService<NewAction> newActionImportableService,
            ImportableService<ActionCollection> actionCollectionImportableService) {
        super(
                datasourceService,
                workspaceService,
                applicationService,
                applicationPageService,
                newActionService,
                analyticsService,
                datasourcePermission,
                workspacePermission,
                applicationPermission,
                pagePermission,
                actionPermission,
                gson,
                themeImportableService,
                newPageImportableService,
                customJSLibImportableService,
                newActionImportableService,
                actionCollectionImportableService);
    }
}
