package com.appsmith.server.controllers.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.HealthCheckService;
import com.appsmith.server.services.RateLimitService;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import reactor.core.publisher.Mono;

@RequestMapping(Url.HEALTH_CHECK)
@AllArgsConstructor
public class HealthCheckControllerCE {
    private final HealthCheckService healthCheckService;
    private final RateLimitService rateLimitService;

    @JsonView(Views.Public.class)
    @GetMapping
    public Mono<ResponseDTO<String>> getHealth() {
        return rateLimitService.tryIncreaseCounter("health-check", "user-1").flatMap(isAllowed -> {
            if (!isAllowed) {
                return Mono.just(new ResponseDTO<>(HttpStatus.TOO_MANY_REQUESTS.value(), null, null));
            }
            return healthCheckService.getHealth().map(health -> new ResponseDTO<>(HttpStatus.OK.value(), health, null));
        });
    }
}
