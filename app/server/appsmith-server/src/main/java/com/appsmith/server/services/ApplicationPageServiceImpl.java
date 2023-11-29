package com.appsmith.server.services;

import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.ActionCollectionRepositoryCake;
import com.appsmith.server.repositories.ApplicationRepositoryCake;
import com.appsmith.server.repositories.DatasourceRepositoryCake;
import com.appsmith.server.repositories.NewActionRepositoryCake;
import com.appsmith.server.repositories.NewPageRepositoryCake;
import com.appsmith.server.repositories.WorkspaceRepositoryCake;
import com.appsmith.server.services.ce.ApplicationPageServiceCEImpl;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import com.appsmith.server.themes.base.ThemeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;

@Service
@Slf4j
public class ApplicationPageServiceImpl extends ApplicationPageServiceCEImpl implements ApplicationPageService {

    public ApplicationPageServiceImpl(
            WorkspaceService workspaceService,
            ApplicationService applicationService,
            SessionUserService sessionUserService,
            WorkspaceRepositoryCake workspaceRepository,
            LayoutActionService layoutActionService,
            UpdateLayoutService updateLayoutService,
            AnalyticsService analyticsService,
            PolicyGenerator policyGenerator,
            ApplicationRepositoryCake applicationRepository,
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
            PermissionGroupService permissionGroupService,
            ActionCollectionRepositoryCake actionCollectionRepository,
            NewActionRepositoryCake newActionRepository,
            NewPageRepositoryCake newPageRepository,
            DatasourceRepositoryCake datasourceRepository,
            DatasourcePermission datasourcePermission) {
        super(
                workspaceService,
                applicationService,
                sessionUserService,
                workspaceRepository,
                layoutActionService,
                updateLayoutService,
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
                permissionGroupService,
                actionCollectionRepository,
                newActionRepository,
                newPageRepository,
                datasourceRepository,
                datasourcePermission);
    }
}
