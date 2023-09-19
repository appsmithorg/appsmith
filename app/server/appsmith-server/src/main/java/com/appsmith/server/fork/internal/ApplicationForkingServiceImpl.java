package com.appsmith.server.fork.internal;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.fork.forkable.ForkableService;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.ThemeService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.ImportExportApplicationService;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
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
            ImportExportApplicationService importExportApplicationService,
            ApplicationPageService applicationPageService,
            NewPageRepository newPageRepository,
            NewActionService newActionService,
            LayoutActionService layoutActionService,
            ActionCollectionService actionCollectionService,
            ThemeService themeService,
            PagePermission pagePermission,
            ForkableService<Datasource> datasourceForkableService) {
        super(
                applicationService,
                workspaceService,
                sessionUserService,
                analyticsService,
                responseUtils,
                workspacePermission,
                applicationPermission,
                importExportApplicationService,
                applicationPageService,
                newPageRepository,
                newActionService,
                layoutActionService,
                actionCollectionService,
                themeService,
                pagePermission,
                datasourceForkableService);
    }
}
