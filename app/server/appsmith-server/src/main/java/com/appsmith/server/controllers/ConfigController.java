package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.ConfigControllerCE;
import com.appsmith.server.services.ConfigService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.CONFIG_URL)
public class ConfigController extends ConfigControllerCE {

    public ConfigController(ConfigService service) {
        super(service);
    }
}
