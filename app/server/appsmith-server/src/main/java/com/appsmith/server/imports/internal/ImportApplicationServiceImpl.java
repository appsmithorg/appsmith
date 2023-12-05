package com.appsmith.server.imports.internal;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;

@Slf4j
@Service
@Primary
public class ImportApplicationServiceImpl extends ImportApplicationServiceCEImpl implements ImportApplicationService {

    public ImportApplicationServiceImpl(
            DatasourceService datasourceService,
            SessionUserService sessionUserService,
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
            TransactionalOperator transactionalOperator,
            PermissionGroupRepository permissionGroupRepository,
            ImportableService<Plugin> pluginImportableService,
            ImportableService<Theme> themeImportableService,
            ImportableService<NewPage> newPageImportableService,
            ImportableService<CustomJSLib> customJSLibImportableService,
            ImportableService<Datasource> datasourceImportableService,
            ImportableService<NewAction> newActionImportableService,
            ImportableService<ActionCollection> actionCollectionImportableService) {
        super(
                datasourceService,
                sessionUserService,
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
                transactionalOperator,
                permissionGroupRepository,
                pluginImportableService,
                themeImportableService,
                newPageImportableService,
                customJSLibImportableService,
                datasourceImportableService,
                newActionImportableService,
                actionCollectionImportableService);
    }
}
