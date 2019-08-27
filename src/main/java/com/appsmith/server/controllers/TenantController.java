package com.appsmith.server.controllers;

import com.appsmith.server.domains.Tenant;
import com.appsmith.server.constants.Url;
import com.appsmith.server.services.TenantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.TENANT_URL)
public class TenantController extends BaseController<TenantService, Tenant, String> {


    @Autowired
    public TenantController(TenantService tenantService) {
        super(tenantService);
    }

}
