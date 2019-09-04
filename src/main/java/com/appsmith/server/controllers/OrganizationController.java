package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.services.OrganizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.ORGANIZATION_URL)
public class OrganizationController extends BaseController<OrganizationService, Organization, String> {


    @Autowired
    public OrganizationController(OrganizationService organizationService) {
        super(organizationService);
    }

}
