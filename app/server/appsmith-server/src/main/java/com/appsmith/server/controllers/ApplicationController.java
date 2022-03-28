package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.ApplicationControllerCE;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.ThemeService;
import com.appsmith.server.solutions.ApplicationFetcher;
import com.appsmith.server.solutions.ApplicationForkingService;
import com.appsmith.server.solutions.ImportExportApplicationService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.APPLICATION_URL)
public class ApplicationController extends ApplicationControllerCE {

    public ApplicationController(ApplicationService service,
                                 ApplicationPageService applicationPageService,
                                 ApplicationFetcher applicationFetcher,
                                 ApplicationForkingService applicationForkingService,
                                 ImportExportApplicationService importExportApplicationService,
                                 ThemeService themeService) {

        super(service, applicationPageService, applicationFetcher, applicationForkingService,
                importExportApplicationService, themeService);

    }
}
