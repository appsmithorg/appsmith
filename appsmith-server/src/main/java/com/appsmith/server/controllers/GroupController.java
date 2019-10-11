package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Group;
import com.appsmith.server.services.GroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.GROUP_URL)
public class GroupController extends BaseController<GroupService, Group, String> {

    @Autowired
    public GroupController(GroupService service) {
        super(service);
    }
}
