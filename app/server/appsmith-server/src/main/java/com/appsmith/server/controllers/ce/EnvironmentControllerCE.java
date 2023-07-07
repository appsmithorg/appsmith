package com.appsmith.server.controllers.ce;

import com.appsmith.server.constants.Url;
import com.appsmith.server.services.EnvironmentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;

@Slf4j
@RequestMapping(Url.ENVIRONMENT_URL)
public class EnvironmentControllerCE {

    @Autowired
    public EnvironmentControllerCE(EnvironmentService environmentService) {}
}
