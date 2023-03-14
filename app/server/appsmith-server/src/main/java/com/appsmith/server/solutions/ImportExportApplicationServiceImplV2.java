package com.appsmith.server.solutions;

import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.ApplicationSnapshotService;
import com.appsmith.server.services.CustomJSLibService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.SequenceService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.ThemeService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ce.ImportExportApplicationServiceCEImplV2;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.transaction.reactive.TransactionalOperator;

@Slf4j
@Component
@Qualifier("importExportServiceCEImplV2")
public class ImportExportApplicationServiceImplV2 extends ImportExportApplicationServiceCEImplV2 implements ImportExportApplicationService {

    public ImportExportApplicationServiceImplV2(DatasourceService datasourceService,
                                                SessionUserService sessionUserService,
                                                NewActionRepository newActionRepository,
                                                DatasourceRepository datasourceRepository,
                                                PluginRepository pluginRepository,
                                                WorkspaceService workspaceService,
                                                ApplicationService applicationService,
                                                NewPageService newPageService,
                                                ApplicationPageService applicationPageService,
                                                NewPageRepository newPageRepository,
                                                NewActionService newActionService,
                                                SequenceService sequenceService,
                                                ExamplesWorkspaceCloner examplesWorkspaceCloner,
                                                ActionCollectionRepository actionCollectionRepository,
                                                ActionCollectionService actionCollectionService,
                                                ThemeService themeService,
                                                AnalyticsService analyticsService,
                                                CustomJSLibService customJSLibService,
                                                DatasourcePermission datasourcePermission,
                                                WorkspacePermission workspacePermission,
                                                ApplicationPermission applicationPermission,
                                                PagePermission pagePermission,
                                                ActionPermission actionPermission,
                                                Gson gson,
                                                TransactionalOperator transactionalOperator,
                                                ApplicationSnapshotService applicationSnapshotService) {

        super(datasourceService, sessionUserService, newActionRepository, datasourceRepository, pluginRepository,
                workspaceService, applicationService, newPageService, applicationPageService, newPageRepository,
                newActionService, sequenceService, examplesWorkspaceCloner, actionCollectionRepository,
                actionCollectionService, themeService, analyticsService, customJSLibService, datasourcePermission,
                workspacePermission, applicationPermission, pagePermission, actionPermission, gson, transactionalOperator,
                applicationSnapshotService);
    }
}
