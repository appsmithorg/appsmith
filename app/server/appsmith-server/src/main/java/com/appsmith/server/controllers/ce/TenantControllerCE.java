package com.appsmith.server.controllers.ce;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.TenantService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import reactor.core.publisher.Mono;

@RequestMapping(Url.TENANT_URL)
public class TenantControllerCE {

    private final TenantService service;

    public TenantControllerCE(TenantService service) {
        this.service = service;
    }

    @GetMapping("/config")
    public Mono<ResponseDTO<TenantConfiguration>> getTenantConfig() {
        return service.getTenantConfiguration()
                .map(resource -> new ResponseDTO<>(HttpStatus.OK.value(), resource, null));
    }

}
