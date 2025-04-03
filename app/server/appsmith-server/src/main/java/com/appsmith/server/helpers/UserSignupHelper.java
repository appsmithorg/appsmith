package com.appsmith.server.helpers;

import com.appsmith.server.helpers.ce.UserSignupHelperCE;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.WorkspacePermission;
import org.springframework.stereotype.Component;

@Component
public class UserSignupHelper extends UserSignupHelperCE {

    public UserSignupHelper(
            WorkspaceRepository workspaceRepository,
            WorkspaceService workspaceService,
            ApplicationPageService applicationPageService,
            UserRepository userRepository,
            OrganizationService organizationService,
            WorkspacePermission workspacePermission) {
        super(
                workspaceRepository,
                workspaceService,
                applicationPageService,
                userRepository,
                organizationService,
                workspacePermission);
    }
}
