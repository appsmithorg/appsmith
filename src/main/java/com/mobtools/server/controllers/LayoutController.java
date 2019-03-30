package com.mobtools.server.controllers;

import com.mobtools.server.constants.Url;
import com.mobtools.server.domains.Layout;
import com.mobtools.server.services.LayoutService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.LAYOUT_URL)
public class LayoutController extends BaseController<LayoutService, Layout, String>  {

    @Autowired
    public LayoutController(LayoutService service) {
        super(service);
    }
}
