package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.AIConfigControllerCE;
import com.appsmith.server.services.AIConfigService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Slf4j
@RequestMapping(Url.ORGANIZATION_URL)
public class AIConfigController extends AIConfigControllerCE {

    public AIConfigController(AIConfigService aiConfigService) {
        super(aiConfigService);
    }
}
