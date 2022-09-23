package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.PluginControllerCE;
import com.appsmith.server.dtos.RemotePluginWorkspaceDTO;
import com.appsmith.server.services.PluginService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import javax.validation.Valid;

@RestController
@Slf4j
@RequestMapping(Url.PLUGIN_URL)
public class PluginController extends PluginControllerCE {

    public PluginController(PluginService service) {
        super(service);
    }

    /**
     * This endpoint is accessible for server-to-server calls so that cloud services can install a plugin
     * to a specific installation on our Appsmith cloud version
     */
    @PostMapping("/remote/install")
    @ResponseStatus(HttpStatus.OK)
    public Mono<Void> remoteInstall(@Valid @RequestBody RemotePluginWorkspaceDTO plugin) {
        log.debug("Entered endpoint to install plugin at server ... ");
        log.debug("Plugin: {}", plugin);
        return service.installRemotePlugin(plugin);
    }
}
