package com.mobtools.server.controllers;

import com.mobtools.server.constants.Url;
import com.mobtools.server.domains.Resource;
import com.mobtools.server.services.ResourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.RESOURCE_URL)
public class ResourceController extends BaseController<ResourceService, Resource, String> {

    @Autowired
    public ResourceController(ResourceService service) {
        super(service);
    }
}
