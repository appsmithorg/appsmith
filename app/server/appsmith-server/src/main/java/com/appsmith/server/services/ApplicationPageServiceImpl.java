package com.appsmith.server.services;

import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.actions.base.ActionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.clonepage.ClonePageService;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.helpers.DSLMigrationUtils;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.helpers.ce.GitAutoCommitHelper;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.ActionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
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
            WorkspaceRepository workspaceRepository,
            LayoutActionService layoutActionService,
            UpdateLayoutService updateLayoutService,
            AnalyticsService analyticsService,
            PolicyGenerator policyGenerator,
            ApplicationRepository applicationRepository,
            NewPageService newPageService,
            ActionService actionService,
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
            ActionCollectionRepository actionCollectionRepository,
            ActionRepository actionRepository,
            NewPageRepository newPageRepository,
            DatasourceRepository datasourceRepository,
            DatasourcePermission datasourcePermission,
            DSLMigrationUtils dslMigrationUtils,
            GitAutoCommitHelper gitAutoCommitHelper,
            ClonePageService<Action> actionClonePageService,
            ClonePageService<ActionCollection> actionCollectionClonePageService) {

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
                actionService,
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
                actionRepository,
                newPageRepository,
                datasourceRepository,
                datasourcePermission,
                dslMigrationUtils,
                gitAutoCommitHelper,
                actionClonePageService,
                actionCollectionClonePageService);
    }
}
