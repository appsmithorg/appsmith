package com.appsmith.server.solutions;

import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.ce.ApplicationFetcherCEImpl;
import org.springframework.stereotype.Component;


@Component
public class ApplicationFetcherImpl extends ApplicationFetcherCEImpl implements ApplicationFetcher {

    public ApplicationFetcherImpl(SessionUserService sessionUserService,
                                  UserService userService,
                                  UserDataService userDataService,
                                  OrganizationService organizationService,
                                  ApplicationRepository applicationRepository,
                                  ReleaseNotesService releaseNotesService,
                                  ResponseUtils responseUtils,
                                  NewPageService newPageService) {

        super(sessionUserService, userService, userDataService, organizationService, applicationRepository,
                releaseNotesService, responseUtils, newPageService);
    }
}
