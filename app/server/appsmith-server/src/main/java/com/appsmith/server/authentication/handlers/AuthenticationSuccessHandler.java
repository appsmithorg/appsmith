package com.appsmith.server.authentication.handlers;

import com.appsmith.server.authentication.handlers.ce.AuthenticationSuccessHandlerCE;
import com.appsmith.server.helpers.RedirectHelper;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.solutions.ExamplesOrganizationCloner;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class AuthenticationSuccessHandler extends AuthenticationSuccessHandlerCE {

    public AuthenticationSuccessHandler(ExamplesOrganizationCloner examplesOrganizationCloner,
                                        RedirectHelper redirectHelper,
                                        SessionUserService sessionUserService,
                                        AnalyticsService analyticsService,
                                        UserDataService userDataService,
                                        UserRepository userRepository,
                                        OrganizationRepository organizationRepository,
                                        ApplicationPageService applicationPageService) {
        super(examplesOrganizationCloner, redirectHelper, sessionUserService, analyticsService, userDataService,
                userRepository, organizationRepository, applicationPageService);
    }
}
