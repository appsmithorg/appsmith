package com.appsmith.server.controllers.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.TenantService;
import com.fasterxml.jackson.annotation.JsonView;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import reactor.core.publisher.Mono;

import java.util.Map;

@RequestMapping(Url.TENANT_URL)
public class TenantControllerCE {

    private final TenantService service;

    public TenantControllerCE(TenantService service) {
        this.service = service;
    }

    /**
     * This API returns the tenant configuration for any user (anonymous or logged in). The configurations are set
     * in {@link com.appsmith.server.controllers.ce.InstanceAdminControllerCE#saveEnvChanges(Map<String,String>)}
     * <p>
     * The update and retrieval are in different controllers because it would have been weird to fetch the configurations
     * from the InstanceAdminController
     *
     * @return
     */
    @JsonView(Views.Public.class)
    @GetMapping("/current")
    public Mono<ResponseDTO<Tenant>> getTenantConfig() {
        return service.getTenantConfiguration()
                .map(resource -> new ResponseDTO<>(HttpStatus.OK.value(), resource, null));
    }

}
