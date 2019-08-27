package com.appsmith.server.controllers;

import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.dtos.PluginTenantDTO;
import com.appsmith.server.dtos.ResponseDto;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.constants.Url;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import javax.validation.Valid;


@RestController
@RequestMapping(Url.PLUGIN_URL)
public class PluginController extends BaseController<PluginService, Plugin, String> {

    @Autowired
    public PluginController(PluginService service) {
        super(service);
    }

    @PostMapping("/install")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDto<Tenant>> install(@Valid @RequestBody PluginTenantDTO plugin) {
        return service.installPlugin(plugin)
                .map(tenant -> new ResponseDto<>(HttpStatus.CREATED.value(), tenant, null));
    }

    @PostMapping("/uninstall")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDto<Tenant>> uninstall(@Valid @RequestBody PluginTenantDTO plugin) {
        return service.uninstallPlugin(plugin)
                .map(tenant -> new ResponseDto<>(HttpStatus.CREATED.value(), tenant, null));
    }

}
