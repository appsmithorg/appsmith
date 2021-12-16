package com.appsmith.server.controllers.ce;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Permission;
import com.appsmith.server.services.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;


@RequestMapping(Url.PERMISSION_URL)
public class PermissionControllerCE extends BaseController<PermissionService, Permission, String> {

    @Autowired
    public PermissionControllerCE(PermissionService service) {
        super(service);
    }
}
