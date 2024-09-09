package com.appsmith.server.services;

import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.clonepage.ClonePageService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.DSLMigrationUtils;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.ce.ApplicationPageServiceCEImpl;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import com.appsmith.server.themes.base.ThemeService;
import io.micrometer.observation.ObservationRegistry;
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
            UpdateLayoutService updateLayoutService,
            AnalyticsService analyticsService,
            PolicyGenerator policyGenerator,
            ApplicationRepository applicationRepository,
            NewPageService newPageService,
            NewActionService newActionService,
            ActionCollectionService actionCollectionService,
            CommonGitFileUtils commonGitFileUtils,
            ThemeService themeService,
            WorkspacePermission workspacePermission,
            ApplicationPermission applicationPermission,
            PagePermission pagePermission,
            ActionPermission actionPermission,
            TransactionalOperator transactionalOperator,
            PermissionGroupService permissionGroupService,
            ActionCollectionRepository actionCollectionRepository,
            NewActionRepository newActionRepository,
            NewPageRepository newPageRepository,
            DatasourceRepository datasourceRepository,
            DatasourcePermission datasourcePermission,
            DSLMigrationUtils dslMigrationUtils,
            ClonePageService<NewAction> actionClonePageService,
            ClonePageService<ActionCollection> actionCollectionClonePageService,
            ObservationRegistry observationRegistry,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(
                workspaceService,
                applicationService,
                sessionUserService,
                workspaceRepository,
                updateLayoutService,
                analyticsService,
                policyGenerator,
                applicationRepository,
                newPageService,
                newActionService,
                actionCollectionService,
                commonGitFileUtils,
                themeService,
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
                datasourcePermission,
                dslMigrationUtils,
                actionClonePageService,
                actionCollectionClonePageService,
                observationRegistry,
                cacheableRepositoryHelper);
    }
}
