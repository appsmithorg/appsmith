package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.PermissionControllerCE;
import com.appsmith.server.services.PermissionService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.PERMISSION_URL)
public class PermissionController extends PermissionControllerCE {

    public PermissionController(PermissionService service) {
        super(service);
    }
}
