package com.appsmith.server.controllers;

import com.appsmith.external.models.ApiTemplate;
import com.appsmith.server.constants.Url;
import com.appsmith.server.services.ApiTemplateService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.API_TEMPLATE_URL)
public class ApiTemplateController extends BaseController<ApiTemplateService, ApiTemplate, String> {
    public ApiTemplateController(ApiTemplateService service) {
        super(service);
    }
}
