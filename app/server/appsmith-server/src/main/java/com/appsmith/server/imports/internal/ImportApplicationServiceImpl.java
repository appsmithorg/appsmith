package com.appsmith.server.imports.internal;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.datasources.base.DatasourceService;
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
public class ImportApplicationServiceImpl extends ImportApplicationServiceCEImpl implements ImportApplicationService {

    public ImportApplicationServiceImpl(
            DatasourceService datasourceService,
            SessionUserService sessionUserService,
            PluginRepository pluginRepository,
            WorkspaceService workspaceService,
            ApplicationService applicationService,
            NewPageService newPageService,
            ApplicationPageService applicationPageService,
            NewActionService newActionService,
            SequenceService sequenceService,
            ActionCollectionService actionCollectionService,
            ThemeService themeService,
            AnalyticsService analyticsService,
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
                sessionUserService,
                pluginRepository,
                workspaceService,
                applicationService,
                newPageService,
                applicationPageService,
                newActionService,
                sequenceService,
                actionCollectionService,
                themeService,
                analyticsService,
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
