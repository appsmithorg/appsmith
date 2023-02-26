package com.appsmith.server.controllers.ce;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Config;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ConfigService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import reactor.core.publisher.Mono;

@RequestMapping(Url.CONFIG_URL)
public class ConfigControllerCE {

    private final ConfigService service;
    public ConfigControllerCE(ConfigService service) {
        this.service = service;
    }

    @GetMapping("/name/{name}")
    public Mono<ResponseDTO<Config>> getByName(@PathVariable String name) {
        return service.getByName(name)
                .map(resource -> new ResponseDTO<>(HttpStatus.OK.value(), resource, null));
    }

    @PutMapping("/name/{name}")
    public Mono<ResponseDTO<Config>> updateByName(@PathVariable String name, @RequestBody Config config) {
        return service.updateByName(config)
                .map(resource -> new ResponseDTO<>(HttpStatus.OK.value(), resource, null));
    }
}
