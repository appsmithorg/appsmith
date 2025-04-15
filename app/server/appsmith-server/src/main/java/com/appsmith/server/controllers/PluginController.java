package com.appsmith.server.controllers;

import com.appsmith.server.configurations.ce.CloudServicesConfigCE;
import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.PluginControllerCE;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.plugins.solutions.PluginTriggerSolution;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.PLUGIN_URL)
public class PluginController extends PluginControllerCE {

    public PluginController(
            PluginService service,
            PluginTriggerSolution pluginTriggerSolution,
            CloudServicesConfigCE cloudServicesConfig) {
        super(service, pluginTriggerSolution, cloudServicesConfig);
    }
}
