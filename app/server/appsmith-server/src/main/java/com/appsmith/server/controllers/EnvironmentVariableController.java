package com.appsmith.server.controllers;

import com.appsmith.server.controllers.ce.EnvironmentVariableControllerCE;
import com.appsmith.server.services.EnvironmentVariableService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class EnvironmentVariableController extends EnvironmentVariableControllerCE {

    public EnvironmentVariableController(EnvironmentVariableService environmentVariableService) {
        super(environmentVariableService);
    }


}
