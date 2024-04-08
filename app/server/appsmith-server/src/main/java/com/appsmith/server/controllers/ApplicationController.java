package com.appsmith.server.controllers;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.ApplicationControllerCE;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.exports.internal.partial.PartialExportService;
import com.appsmith.server.fork.internal.ApplicationForkingService;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.imports.internal.partial.PartialImportService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationSnapshotService;
import com.appsmith.server.solutions.ApplicationFetcher;
import com.appsmith.server.themes.base.ThemeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping(Url.APPLICATION_URL)
public class ApplicationController extends ApplicationControllerCE {

    public ApplicationController(
            ApplicationService service,
            ApplicationPageService applicationPageService,
            ApplicationFetcher applicationFetcher,
            ApplicationForkingService applicationForkingService,
            ThemeService themeService,
            ApplicationSnapshotService applicationSnapshotService,
            PartialExportService partialExportService,
            PartialImportService partialImportService,
            ImportService importService,
            ExportService exportService) {
        super(
                service,
                applicationPageService,
                applicationFetcher,
                applicationForkingService,
                themeService,
                applicationSnapshotService,
                partialExportService,
                partialImportService,
                importService,
                exportService);
    }
}
