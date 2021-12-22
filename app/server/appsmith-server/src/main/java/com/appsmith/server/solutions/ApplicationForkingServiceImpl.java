package com.appsmith.server.solutions;

import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.ce.ApplicationForkingServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class ApplicationForkingServiceImpl extends ApplicationForkingServiceCEImpl implements ApplicationForkingService {

    public ApplicationForkingServiceImpl(ApplicationService applicationService,
                                         OrganizationService organizationService,
                                         ExamplesOrganizationCloner examplesOrganizationCloner,
                                         PolicyUtils policyUtils,
                                         SessionUserService sessionUserService,
                                         AnalyticsService analyticsService,
                                         ResponseUtils responseUtils) {

        super(applicationService, organizationService, examplesOrganizationCloner, policyUtils, sessionUserService,
                analyticsService, responseUtils);
    }
}
