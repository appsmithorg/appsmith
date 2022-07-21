package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.ApplicationTemplateControllerCE;
import com.appsmith.server.services.ApplicationTemplateService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.APP_TEMPLATE_URL)
public class ApplicationTemplateController extends ApplicationTemplateControllerCE {

    public ApplicationTemplateController(ApplicationTemplateService applicationTemplateService) {
        super(applicationTemplateService);
    }
}
