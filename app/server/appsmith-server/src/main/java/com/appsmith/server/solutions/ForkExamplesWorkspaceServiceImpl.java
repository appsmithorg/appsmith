package com.appsmith.server.solutions;

import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.DatasourceStorageService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.ThemeService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ce.ForkExamplesWorkspaceServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class ForkExamplesWorkspaceServiceImpl extends ForkExamplesWorkspaceServiceCEImpl
        implements ForkExamplesWorkspace {

    public ForkExamplesWorkspaceServiceImpl(
            WorkspaceService workspaceService,
            WorkspaceRepository workspaceRepository,
            DatasourceService datasourceService,
            DatasourceStorageService datasourceStorageService,
            DatasourceRepository datasourceRepository,
            ConfigService configService,
            SessionUserService sessionUserService,
            UserService userService,
            ApplicationService applicationService,
            ApplicationPageService applicationPageService,
            NewPageRepository newPageRepository,
            NewActionService newActionService,
            LayoutActionService layoutActionService,
            ActionCollectionService actionCollectionService,
            ThemeService themeService,
            ApplicationPermission applicationPermission,
            PagePermission pagePermission) {
        super(
                workspaceService,
                workspaceRepository,
                datasourceService,
                datasourceStorageService,
                datasourceRepository,
                configService,
                sessionUserService,
                userService,
                applicationService,
                applicationPageService,
                newPageRepository,
                newActionService,
                layoutActionService,
                actionCollectionService,
                themeService,
                applicationPermission,
                pagePermission);
    }
}
