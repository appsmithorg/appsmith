package com.appsmith.server.fork.internal;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.actions.base.ActionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.fork.forkable.ForkableService;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.ActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import com.appsmith.server.themes.base.ThemeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class ApplicationForkingServiceImpl extends ApplicationForkingServiceCEImpl
        implements ApplicationForkingService {

    public ApplicationForkingServiceImpl(
            ApplicationService applicationService,
            WorkspaceService workspaceService,
            SessionUserService sessionUserService,
            AnalyticsService analyticsService,
            ResponseUtils responseUtils,
            WorkspacePermission workspacePermission,
            ApplicationPermission applicationPermission,
            ImportService importService,
            ApplicationPageService applicationPageService,
            NewPageRepository newPageRepository,
            ActionService actionService,
            LayoutActionService layoutActionService,
            ActionCollectionService actionCollectionService,
            ThemeService themeService,
            PagePermission pagePermission,
            ActionPermission actionPermission,
            PermissionGroupService permissionGroupService,
            ActionCollectionRepository actionCollectionRepository,
            ActionRepository actionRepository,
            WorkspaceRepository workspaceRepository,
            ForkableService<Datasource> datasourceForkableService) {
        super(
                applicationService,
                workspaceService,
                sessionUserService,
                analyticsService,
                responseUtils,
                workspacePermission,
                applicationPermission,
                importService,
                applicationPageService,
                newPageRepository,
                actionService,
                layoutActionService,
                actionCollectionService,
                themeService,
                pagePermission,
                actionPermission,
                permissionGroupService,
                actionCollectionRepository,
                actionRepository,
                workspaceRepository,
                datasourceForkableService);
    }
}
