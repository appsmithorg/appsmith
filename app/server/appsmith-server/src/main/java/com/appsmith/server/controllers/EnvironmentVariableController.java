package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.EnvironmentVariableControllerCE;
import com.appsmith.server.domains.EnvironmentVariable;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.EnvironmentVariableService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;

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
