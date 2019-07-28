package com.mobtools.server.controllers;

import com.mobtools.server.constants.Url;
import com.mobtools.server.domains.Tenant;
import com.mobtools.server.services.TenantService;
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
