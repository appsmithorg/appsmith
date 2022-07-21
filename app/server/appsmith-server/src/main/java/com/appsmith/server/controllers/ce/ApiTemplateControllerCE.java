package com.appsmith.server.controllers.ce;

import com.appsmith.external.models.ApiTemplate;
import com.appsmith.server.constants.Url;
import com.appsmith.server.services.ApiTemplateService;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping(Url.API_TEMPLATE_URL)
public class ApiTemplateControllerCE extends BaseController<ApiTemplateService, ApiTemplate, String> {
    public ApiTemplateControllerCE(ApiTemplateService service) {
        super(service);
    }
}
