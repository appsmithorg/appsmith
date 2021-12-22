package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.InstanceAdminControllerCE;
import com.appsmith.server.solutions.EnvManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.INSTANCE_ADMIN_URL)
@Slf4j
public class InstanceAdminController extends InstanceAdminControllerCE {

    public InstanceAdminController(EnvManager envManager) {
        super(envManager);
    }

}
