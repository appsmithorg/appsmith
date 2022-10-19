package com.appsmith.server.controllers.ce;

import com.appsmith.server.constants.Url;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;


import com.appsmith.server.services.EnvironmentVariableService;

@Slf4j
@RequestMapping(Url.ENVIRONMENT_VARIABLE_URL) // will be added to the url post discussion
public class EnvironmentVariableControllerCE {

    private final EnvironmentVariableService environmentVariableService;

    @Autowired
    public EnvironmentVariableControllerCE(EnvironmentVariableService environmentVariableService) {
        this.environmentVariableService = environmentVariableService;
    }


}
