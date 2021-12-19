package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.PluginControllerCE;
import com.appsmith.server.services.PluginService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping(Url.PLUGIN_URL)
public class PluginController extends PluginControllerCE {

    public PluginController(PluginService service) {
        super(service);
    }

}
