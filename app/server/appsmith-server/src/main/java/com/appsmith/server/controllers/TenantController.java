package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.TenantControllerCE;
import com.appsmith.server.services.TenantService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Slf4j
@RequestMapping(Url.TENANT_URL)
public class TenantController extends TenantControllerCE {

    public TenantController(TenantService service) {
        super(service);
    }
}
