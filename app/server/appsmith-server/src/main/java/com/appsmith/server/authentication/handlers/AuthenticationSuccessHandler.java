package com.appsmith.server.authentication.handlers;

import com.appsmith.server.authentication.handlers.ce.AuthenticationSuccessHandlerCE;
import com.appsmith.server.helpers.RedirectHelper;
import com.appsmith.server.helpers.UserSignupHelper;
import com.appsmith.server.helpers.WorkspaceServiceHelper;
import com.appsmith.server.instanceconfigs.helpers.InstanceVariablesHelper;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class AuthenticationSuccessHandler extends AuthenticationSuccessHandlerCE {

    public AuthenticationSuccessHandler(
            RedirectHelper redirectHelper,
            SessionUserService sessionUserService,
            AnalyticsService analyticsService,
            UserDataService userDataService,
            UserRepository userRepository,
            ApplicationPageService applicationPageService,
            RateLimitService rateLimitService,
            OrganizationService organizationService,
            UserService userService,
            WorkspaceServiceHelper workspaceServiceHelper,
            InstanceVariablesHelper instanceVariablesHelper,
            UserSignupHelper userSignupHelper) {
        super(
                redirectHelper,
                sessionUserService,
                analyticsService,
                userDataService,
                userRepository,
                applicationPageService,
                rateLimitService,
                organizationService,
                userService,
                workspaceServiceHelper,
                instanceVariablesHelper,
                userSignupHelper);
    }
}
