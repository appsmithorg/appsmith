package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Action;
import com.appsmith.server.services.ActionService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.ACTION_URL)
public class ActionController extends BaseController<ActionService, Action, String> {

    public ActionController(ActionService service) {
        super(service);
    }
}
