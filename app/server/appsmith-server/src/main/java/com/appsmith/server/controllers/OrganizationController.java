package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.OrganizationControllerCE;
import com.appsmith.server.services.OrganizationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Slf4j
@RequestMapping(Url.TENANT_URL)
public class OrganizationController extends OrganizationControllerCE {

    public OrganizationController(OrganizationService service) {
        super(service);
    }
}
