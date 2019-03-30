package com.mobtools.server.controllers;

import com.mobtools.server.constants.Url;
import com.mobtools.server.domains.Plugin;
import com.mobtools.server.services.PluginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping(Url.PLUGIN_URL)
public class PluginController extends BaseController<PluginService, Plugin, String> {

    @Autowired
    public PluginController(PluginService service) {
        super(service);
    }
}
