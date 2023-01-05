package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.EnvironmentVariableControllerCE;
import com.appsmith.server.services.EnvironmentVariableService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping(Url.ENVIRONMENT_VARIABLE_URL)
public class EnvironmentVariableController extends EnvironmentVariableControllerCE {

    private final EnvironmentVariableService environmentVariableService;

    @Autowired
    public EnvironmentVariableController(EnvironmentVariableService environmentVariableService) {
        super(environmentVariableService);
        this.environmentVariableService = environmentVariableService;
    }

}
