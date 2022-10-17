package com.appsmith.server.controllers;


import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.EnvironmentControllerCE;
import com.appsmith.server.services.EnvironmentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Slf4j
@RequestMapping(Url.ENVIRONMENT_URL)
public class EnvironmentController extends EnvironmentControllerCE {

    @Autowired
    public EnvironmentController (EnvironmentService environmentService) {
        super(environmentService);
    }
}
