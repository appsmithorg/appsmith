package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.PageControllerCE;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.solutions.CreateDBTablePageSolution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.PAGE_URL)
@Slf4j
public class PageController extends PageControllerCE {

    public PageController(ApplicationPageService applicationPageService,
                          NewPageService newPageService,
                          CreateDBTablePageSolution createDBTablePageSolution) {

        super(applicationPageService, newPageService, createDBTablePageSolution);
    }
}
