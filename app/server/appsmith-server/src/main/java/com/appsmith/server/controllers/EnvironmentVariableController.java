package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.EnvironmentVariableControllerCE;
import com.appsmith.server.services.EnvironmentVariableService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.ENVIRONMENT_VARIABLE_URL)
@Slf4j
public class EnvironmentVariableController extends EnvironmentVariableControllerCE {

    public EnvironmentVariableController(EnvironmentVariableService environmentVariableService) {
        super(environmentVariableService);
    }

}
