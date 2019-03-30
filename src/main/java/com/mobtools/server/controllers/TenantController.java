package com.mobtools.server.controllers;

import com.mobtools.server.constants.Url;
import com.mobtools.server.domains.Tenant;
import com.mobtools.server.dtos.ResponseDto;
import com.mobtools.server.services.TenantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(Url.TENANT_URL)
public class TenantController extends BaseController<TenantService, Tenant, String> {


    @Autowired
    public TenantController(TenantService tenantService) {
        super(tenantService);
    }

    @GetMapping("/{name}")
    public Mono<ResponseDto<Tenant>> getByName(@PathVariable String name) {
        return service.getByName(name)
                .map(widget -> new ResponseDto<>(HttpStatus.OK.value(), widget, null));
    }

}
