package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.WorkspaceControllerCE;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.services.UserOrganizationService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.ORGANIZATION_URL)
public class OrganizationController extends WorkspaceControllerCE {

    public OrganizationController(WorkspaceService organizationService,
                                  UserOrganizationService userOrganizationService) {

        super(organizationService, userOrganizationService);
    }
}
