package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.WorkspaceControllerCE;
import com.appsmith.server.services.UserWorkspaceService;
import com.appsmith.server.services.WorkspaceService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.WORKSPACE_URL)
public class WorkspaceController extends WorkspaceControllerCE {

    public WorkspaceController(WorkspaceService workspaceService, UserWorkspaceService userWorkspaceService) {

        super(workspaceService, userWorkspaceService);
    }
}
