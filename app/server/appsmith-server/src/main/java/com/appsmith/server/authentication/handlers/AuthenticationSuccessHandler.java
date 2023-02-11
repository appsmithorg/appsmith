package com.appsmith.server.authentication.handlers;

import com.appsmith.server.authentication.handlers.ce.AuthenticationSuccessHandlerCE;
import com.appsmith.server.helpers.RedirectHelper;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ExamplesWorkspaceCloner;
import com.appsmith.server.solutions.WorkspacePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class AuthenticationSuccessHandler extends AuthenticationSuccessHandlerCE {

    public AuthenticationSuccessHandler(ExamplesWorkspaceCloner examplesWorkspaceCloner,
                                        RedirectHelper redirectHelper,
                                        SessionUserService sessionUserService,
                                        AnalyticsService analyticsService,
                                        UserDataService userDataService,
                                        UserRepository userRepository,
                                        WorkspaceService workspaceService,
                                        WorkspaceRepository workspaceRepository,
                                        ApplicationPageService applicationPageService,
                                        WorkspacePermission workspacePermission) {

        super(examplesWorkspaceCloner, redirectHelper, sessionUserService, analyticsService, userDataService,
                userRepository, workspaceRepository, workspaceService, applicationPageService, workspacePermission);
    }
}