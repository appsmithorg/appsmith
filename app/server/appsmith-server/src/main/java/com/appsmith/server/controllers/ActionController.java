package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.ActionControllerCE;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.NewActionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.ACTION_URL)
@Slf4j
public class ActionController extends ActionControllerCE {

    public ActionController(ActionCollectionService actionCollectionService,
                            LayoutActionService layoutActionService,
                            NewActionService newActionService) {

        super(actionCollectionService, layoutActionService, newActionService);

    }

}
