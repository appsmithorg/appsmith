package com.appsmith.server.exports.internal.partial;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.ApplicationPermission;
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
            ExportableService<NewAction> newActionExportableService,
            ExportableService<ActionCollection> actionCollectionExportableService,
            SessionUserService sessionUserService,
            AnalyticsService analyticsService,
            JsonSchemaVersions jsonSchemaVersions) {
        super(
                applicationService,
                applicationPermission,
                customJSLibService,
                actionCollectionService,
                newActionService,
                newPageService,
                datasourceExportableService,
                pluginExportableService,
                newActionExportableService,
                actionCollectionExportableService,
                sessionUserService,
                analyticsService,
                jsonSchemaVersions);
    }
}
