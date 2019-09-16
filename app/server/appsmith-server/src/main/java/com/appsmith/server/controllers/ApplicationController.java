package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Application;
import com.appsmith.server.services.ApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.APPLICATION_URL)
public class ApplicationController extends BaseController<ApplicationService, Application, String> {
    @Autowired
    public ApplicationController(ApplicationService service) {
        super(service);
    }
}
