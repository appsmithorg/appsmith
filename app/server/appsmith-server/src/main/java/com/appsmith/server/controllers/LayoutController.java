package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.LayoutControllerCE;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.LAYOUT_URL)
@Slf4j
public class LayoutController extends LayoutControllerCE {

    public LayoutController(LayoutService layoutService,
                            LayoutActionService layoutActionService) {

        super(layoutService, layoutActionService);
    }

}
