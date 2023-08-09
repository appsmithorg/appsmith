package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.HealthCheckControllerCE;
import com.appsmith.server.services.HealthCheckService;
import com.appsmith.server.services.RateLimitService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.HEALTH_CHECK)
public class HealthCheckController extends HealthCheckControllerCE {

    public HealthCheckController(HealthCheckService healthCheckService, RateLimitService rateLimitService) {
        super(healthCheckService, rateLimitService);
    }
}
