package com.appsmith.server.export.internal;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.export.exportable.ExportableService;
import com.appsmith.server.export.exportable.ExportableServiceCE;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.SequenceService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import com.appsmith.server.themes.base.ThemeService;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.springframework.transaction.reactive.TransactionalOperator;

@Slf4j
@Component
@Primary
public class ImportExportApplicationServiceImpl extends ImportExportApplicationServiceCEImpl
        implements ImportExportApplicationService {

    public ImportExportApplicationServiceImpl(
            DatasourceService datasourceService,
            ExportableService<Datasource> datasourceExportableService,
            SessionUserService sessionUserService,
            PluginRepository pluginRepository,
            WorkspaceService workspaceService,
            ApplicationService applicationService,
            NewPageService newPageService,
            ApplicationPageService applicationPageService,
            ExportableService<NewPage> newPageExportableService,
            NewActionService newActionService,
            SequenceService sequenceService,
            ExportableService<NewAction> newActionExportableService,
            ExportableService<ActionCollection> actionCollectionExportableService,
            ActionCollectionService actionCollectionService,
            ExportableServiceCE<Theme> themeExportableService,
            ThemeService themeService,
            AnalyticsService analyticsService,
            ExportableService<CustomJSLib> customJSLibExportableService,
            CustomJSLibService customJSLibService,
            DatasourcePermission datasourcePermission,
            WorkspacePermission workspacePermission,
            ApplicationPermission applicationPermission,
            PagePermission pagePermission,
            ActionPermission actionPermission,
            Gson gson,
            TransactionalOperator transactionalOperator,
            PermissionGroupRepository permissionGroupRepository) {
        super(
                datasourceService,
                datasourceExportableService,
                sessionUserService,
                pluginRepository,
                workspaceService,
                applicationService,
                newPageService,
                applicationPageService,
                newPageExportableService,
                newActionService,
                sequenceService,
                newActionExportableService,
                actionCollectionExportableService,
                actionCollectionService,
                themeExportableService,
                themeService,
                analyticsService,
                customJSLibExportableService,
                customJSLibService,
                datasourcePermission,
                workspacePermission,
                applicationPermission,
                pagePermission,
                actionPermission,
                gson,
                transactionalOperator,
                permissionGroupRepository);
    }
}
