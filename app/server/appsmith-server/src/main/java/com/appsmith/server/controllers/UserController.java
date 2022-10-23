package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.UserControllerCE;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserWorkspaceService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import com.appsmith.server.solutions.UserSignup;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.USER_URL)
@Slf4j
public class UserController extends UserControllerCE {

    public UserController(UserService service,
                          SessionUserService sessionUserService,
                          UserWorkspaceService userWorkspaceService,
                          UserSignup userSignup,
                          UserDataService userDataService,
                          UserAndAccessManagementService userAndAccessManagementService) {

        super(service, sessionUserService, userWorkspaceService, userSignup, userDataService, userAndAccessManagementService);
    }
}
