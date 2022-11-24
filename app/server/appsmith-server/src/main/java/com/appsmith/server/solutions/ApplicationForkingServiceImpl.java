package com.appsmith.server.solutions;

import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.ce.ApplicationForkingServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class ApplicationForkingServiceImpl extends ApplicationForkingServiceCEImpl implements ApplicationForkingService {

    public ApplicationForkingServiceImpl(ApplicationService applicationService,
                                         WorkspaceService workspaceService,
                                         ExamplesWorkspaceCloner examplesWorkspaceCloner,
                                         PolicyUtils policyUtils,
                                         SessionUserService sessionUserService,
                                         AnalyticsService analyticsService,
                                         ResponseUtils responseUtils,
                                         WorkspacePermission workspacePermission,
                                         ApplicationPermission applicationPermission) {

        super(applicationService, workspaceService, examplesWorkspaceCloner, policyUtils, sessionUserService,
                analyticsService, responseUtils, workspacePermission, applicationPermission);
    }
}
