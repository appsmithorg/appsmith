package com.appsmith.server.services;

import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.CommentThreadRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.services.ce.ApplicationPageServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class ApplicationPageServiceImpl extends ApplicationPageServiceCEImpl implements ApplicationPageService {

    public ApplicationPageServiceImpl(ApplicationService applicationService,
                                      SessionUserService sessionUserService,
                                      OrganizationRepository organizationRepository,
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
                                      ResponseUtils responseUtils) {

        super(applicationService, sessionUserService, organizationRepository, layoutActionService, analyticsService,
                policyGenerator, applicationRepository, newPageService, newActionService, actionCollectionService,
                gitFileUtils, commentThreadRepository, themeService, responseUtils);
    }
}
