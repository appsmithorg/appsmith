package com.appsmith.server.applications.exports;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.solutions.ApplicationPermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class ApplicationExportServiceImpl extends ApplicationExportServiceCEImpl implements ApplicationExportService {

    public ApplicationExportServiceImpl(
            ApplicationService applicationService,
            ApplicationPermission applicationPermission,
            ExportableService<NewPage> newPageExportableService,
            ExportableService<NewAction> newActionExportableService,
            ExportableService<ActionCollection> actionCollectionExportableService,
            ExportableService<Theme> themeExportableService) {
        super(
                applicationService,
                applicationPermission,
                newPageExportableService,
                newActionExportableService,
                actionCollectionExportableService,
                themeExportableService);
    }
}
