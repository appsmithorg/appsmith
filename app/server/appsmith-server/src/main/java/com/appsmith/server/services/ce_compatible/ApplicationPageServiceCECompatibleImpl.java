package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.ThemeService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.services.ce.ApplicationPageServiceCEImpl;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;

@Service
public class ApplicationPageServiceCECompatibleImpl extends ApplicationPageServiceCEImpl
        implements ApplicationPageServiceCECompatible {
    public ApplicationPageServiceCECompatibleImpl(
            WorkspaceService workspaceService,
            ApplicationService applicationService,
            SessionUserService sessionUserService,
            WorkspaceRepository workspaceRepository,
            LayoutActionService layoutActionService,
            AnalyticsService analyticsService,
            PolicyGenerator policyGenerator,
            ApplicationRepository applicationRepository,
            NewPageService newPageService,
            NewActionService newActionService,
            ActionCollectionService actionCollectionService,
            GitFileUtils gitFileUtils,
            ThemeService themeService,
            ResponseUtils responseUtils,
            WorkspacePermission workspacePermission,
            ApplicationPermission applicationPermission,
            PagePermission pagePermission,
            ActionPermission actionPermission,
            TransactionalOperator transactionalOperator,
            PermissionGroupService permissionGroupService) {
        super(
                workspaceService,
                applicationService,
                sessionUserService,
                workspaceRepository,
                layoutActionService,
                analyticsService,
                policyGenerator,
                applicationRepository,
                newPageService,
                newActionService,
                actionCollectionService,
                gitFileUtils,
                themeService,
                responseUtils,
                workspacePermission,
                applicationPermission,
                pagePermission,
                actionPermission,
                transactionalOperator,
                permissionGroupService);
    }
}
