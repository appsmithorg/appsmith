package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.ApiTemplateControllerCE;
import com.appsmith.server.services.ApiTemplateService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.API_TEMPLATE_URL)
@Slf4j
public class ApiTemplateController extends ApiTemplateControllerCE {

    public ApiTemplateController(ApiTemplateService service) {
        super(service);
    }

}
