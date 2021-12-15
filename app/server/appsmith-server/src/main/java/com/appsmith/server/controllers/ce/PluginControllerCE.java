package com.appsmith.server.controllers.ce;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.dtos.PluginOrgDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.PluginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import reactor.core.publisher.Mono;

import javax.validation.Valid;


@RequestMapping(Url.PLUGIN_URL)
public class PluginControllerCE extends BaseController<PluginService, Plugin, String> {

    @Autowired
    public PluginControllerCE(PluginService service) {
        super(service);
    }

    @PostMapping("/install")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<Organization>> install(@Valid @RequestBody PluginOrgDTO plugin) {
        return service.installPlugin(plugin)
                .map(organization -> new ResponseDTO<>(HttpStatus.CREATED.value(), organization, null));
    }

    @PostMapping("/uninstall")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<Organization>> uninstall(@Valid @RequestBody PluginOrgDTO plugin) {
        return service.uninstallPlugin(plugin)
                .map(organization -> new ResponseDTO<>(HttpStatus.CREATED.value(), organization, null));
    }

    @GetMapping("/{pluginId}/form")
    public Mono<ResponseDTO<Object>> getDatasourceForm(@PathVariable String pluginId) {
        return service.getFormConfig(pluginId)
                .map(form -> new ResponseDTO<>(HttpStatus.OK.value(), form, null));
    }
}
