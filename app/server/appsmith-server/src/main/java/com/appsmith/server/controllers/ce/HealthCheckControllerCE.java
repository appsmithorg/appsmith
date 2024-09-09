package com.appsmith.server.controllers.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.HealthCheckService;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import reactor.core.publisher.Mono;

@Slf4j
@RequestMapping(Url.HEALTH_CHECK)
@AllArgsConstructor
public class HealthCheckControllerCE {
    private final HealthCheckService healthCheckService;

    @JsonView(Views.Public.class)
    @GetMapping
    public Mono<ResponseDTO<String>> getHealth() {
        log.debug("Checking server health ...");
        return healthCheckService.getHealth().map(health -> new ResponseDTO<>(HttpStatus.OK.value(), health, null));
    }
}
