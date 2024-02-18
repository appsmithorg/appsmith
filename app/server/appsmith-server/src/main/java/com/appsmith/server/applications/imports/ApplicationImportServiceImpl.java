package com.appsmith.server.applications.imports;

import com.appsmith.server.actions.base.ActionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.imports.internal.artifactbased.ArtifactBasedImportService;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import com.google.gson.Gson;
import org.springframework.stereotype.Service;

@Service
public class ApplicationImportServiceImpl extends ApplicationImportServiceCEImpl
        implements ArtifactBasedImportService<Application, ApplicationImportDTO, ApplicationJson> {

    public ApplicationImportServiceImpl(
            ApplicationService applicationService,
            ApplicationPageService applicationPageService,
            ActionService actionService,
            UpdateLayoutService updateLayoutService,
            DatasourcePermission datasourcePermission,
            WorkspacePermission workspacePermission,
            ApplicationPermission applicationPermission,
            PagePermission pagePermission,
            ActionPermission actionPermission,
            Gson gson,
            ImportableService<Theme> themeImportableService,
            ImportableService<NewPage> newPageImportableService,
            ImportableService<CustomJSLib> customJSLibImportableService,
            ImportableService<Action> newActionImportableService,
            ImportableService<ActionCollection> actionCollectionImportableService) {
        super(
                applicationService,
                applicationPageService,
                actionService,
                updateLayoutService,
                datasourcePermission,
                workspacePermission,
                applicationPermission,
                pagePermission,
                actionPermission,
                gson,
                themeImportableService,
                newPageImportableService,
                customJSLibImportableService,
                newActionImportableService,
                actionCollectionImportableService);
    }
}
