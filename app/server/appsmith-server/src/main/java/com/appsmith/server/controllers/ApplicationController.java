package com.appsmith.server.controllers;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.ApplicationControllerCE;
import com.appsmith.server.exports.internal.ExportApplicationService;
import com.appsmith.server.exports.internal.PartialExportService;
import com.appsmith.server.fork.internal.ApplicationForkingService;
import com.appsmith.server.imports.internal.ImportApplicationService;
import com.appsmith.server.imports.internal.PartialImportService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationSnapshotService;
import com.appsmith.server.solutions.ApplicationFetcher;
import com.appsmith.server.themes.base.ThemeService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.APPLICATION_URL)
public class ApplicationController extends ApplicationControllerCE {

    public ApplicationController(
            ApplicationService service,
            ApplicationPageService applicationPageService,
            ApplicationFetcher applicationFetcher,
            ApplicationForkingService applicationForkingService,
            ImportApplicationService importApplicationService,
            ExportApplicationService exportApplicationService,
            ThemeService themeService,
            ApplicationSnapshotService applicationSnapshotService,
            PartialExportService partialExportService,
            PartialImportService partialImportService) {
        super(
                service,
                applicationPageService,
                applicationFetcher,
                applicationForkingService,
                importApplicationService,
                exportApplicationService,
                themeService,
                applicationSnapshotService,
                partialExportService,
                partialImportService);
    }
}
