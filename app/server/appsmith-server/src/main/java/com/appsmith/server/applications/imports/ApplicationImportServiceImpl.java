package com.appsmith.server.applications.imports;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.imports.internal.artifactbased.ArtifactBasedImportService;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import org.springframework.stereotype.Service;

@Service
public class ApplicationImportServiceImpl extends ApplicationImportServiceCEImpl
        implements ArtifactBasedImportService<Application, ApplicationImportDTO, ApplicationJson> {

    public ApplicationImportServiceImpl(
            ApplicationService applicationService,
            ApplicationPageService applicationPageService,
            NewActionService newActionService,
            UpdateLayoutService updateLayoutService,
            DatasourcePermission datasourcePermission,
            WorkspacePermission workspacePermission,
            ApplicationPermission applicationPermission,
            PagePermission pagePermission,
            ActionPermission actionPermission,
            JsonSchemaMigration jsonSchemaMigration,
            ImportableService<Theme> themeImportableService,
            ImportableService<NewPage> newPageImportableService,
            ImportableService<CustomJSLib> customJSLibImportableService,
            ImportableService<NewAction> newActionImportableService,
            ImportableService<ActionCollection> actionCollectionImportableService) {
        super(
                applicationService,
                applicationPageService,
                newActionService,
                updateLayoutService,
                datasourcePermission,
                workspacePermission,
                applicationPermission,
                pagePermission,
                actionPermission,
                jsonSchemaMigration,
                themeImportableService,
                newPageImportableService,
                customJSLibImportableService,
                newActionImportableService,
                actionCollectionImportableService);
    }
}
