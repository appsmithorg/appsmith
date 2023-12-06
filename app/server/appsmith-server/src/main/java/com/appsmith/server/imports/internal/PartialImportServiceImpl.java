package com.appsmith.server.imports.internal;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;

@Slf4j
@Service
@Primary
public class PartialImportServiceImpl extends PartialImportServiceCEImpl implements PartialImportService {

    public PartialImportServiceImpl(
            ImportApplicationService importApplicationService,
            WorkspaceService workspaceService,
            ApplicationService applicationService,
            AnalyticsService analyticsService,
            DatasourcePermission datasourcePermission,
            WorkspacePermission workspacePermission,
            ApplicationPermission applicationPermission,
            PagePermission pagePermission,
            ActionPermission actionPermission,
            SessionUserService sessionUserService,
            TransactionalOperator transactionalOperator,
            PermissionGroupRepository permissionGroupRepository,
            ImportableService<Plugin> pluginImportableService,
            ImportableService<NewPage> newPageImportableService,
            ImportableService<CustomJSLib> customJSLibImportableService,
            ImportableService<Datasource> datasourceImportableService,
            ImportableService<NewAction> newActionImportableService,
            ImportableService<ActionCollection> actionCollectionImportableService,
            NewPageService newPageService) {
        super(
                importApplicationService,
                workspaceService,
                applicationService,
                analyticsService,
                datasourcePermission,
                workspacePermission,
                applicationPermission,
                pagePermission,
                actionPermission,
                sessionUserService,
                transactionalOperator,
                permissionGroupRepository,
                pluginImportableService,
                newPageImportableService,
                customJSLibImportableService,
                datasourceImportableService,
                newActionImportableService,
                actionCollectionImportableService,
                newPageService);
    }
}
