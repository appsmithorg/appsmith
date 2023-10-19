package com.appsmith.server.exports.internal;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.exports.exportable.ExportableServiceCE;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class PartialExportServiceImpl extends PartialExportServiceCEImpl implements PartialExportService {
    public PartialExportServiceImpl(
            ApplicationService applicationService,
            ApplicationPermission applicationPermission,
            CustomJSLibService customJSLibService,
            ActionCollectionService actionCollectionService,
            NewActionService newActionService,
            NewPageService newPageService,
            ExportableService<Datasource> datasourceExportableService,
            ExportableService<Plugin> pluginExportableService,
            ExportableService<NewPage> newPageExportableService,
            ExportableService<NewAction> newActionExportableService,
            ExportableService<ActionCollection> actionCollectionExportableService,
            ExportableServiceCE<Theme> themeExportableService,
            ExportableService<CustomJSLib> customJSLibExportableService,
            Gson gson) {
        super(
                applicationService,
                applicationPermission,
                customJSLibService,
                actionCollectionService,
                newActionService,
                newPageService,
                datasourceExportableService,
                pluginExportableService,
                newPageExportableService,
                newActionExportableService,
                actionCollectionExportableService,
                themeExportableService,
                customJSLibExportableService,
                gson);
    }
}
