package com.appsmith.server.services;

import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.CommentThreadRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.ce.ApplicationPageServiceCEImpl;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class ApplicationPageServiceImpl extends ApplicationPageServiceCEImpl implements ApplicationPageService {

    public ApplicationPageServiceImpl(WorkspaceService workspaceService,
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
                                      CommentThreadRepository commentThreadRepository,
                                      ThemeService themeService,
                                      ResponseUtils responseUtils,
                                      WorkspacePermission workspacePermission,
                                      ApplicationPermission applicationPermission,
                                      PagePermission pagePermission,
                                      ActionPermission actionPermission) {

        super(workspaceService, applicationService, sessionUserService, workspaceRepository, layoutActionService, analyticsService,
                policyGenerator, applicationRepository, newPageService, newActionService, actionCollectionService,
                gitFileUtils, commentThreadRepository, themeService, responseUtils, workspacePermission,
                applicationPermission, pagePermission, actionPermission);
    }
}
