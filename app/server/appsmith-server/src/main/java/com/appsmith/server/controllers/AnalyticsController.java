package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.AnalyticsControllerCE;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.NewActionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.ANALYTICS_URL)
@Slf4j
public class AnalyticsController extends AnalyticsControllerCE {

    public AnalyticsController(ApplicationPageService applicationPageService, NewActionService newActionService) {

        super(applicationPageService, newActionService);

    }

}
