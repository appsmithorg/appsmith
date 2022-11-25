package com.appsmith.server.solutions;

import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.ThemeService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.ce.ExamplesWorkspaceClonerCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class ExamplesWorkspaceClonerImpl extends ExamplesWorkspaceClonerCEImpl implements ExamplesWorkspaceCloner {

    public ExamplesWorkspaceClonerImpl(WorkspaceService workspaceService,
                                          WorkspaceRepository workspaceRepository,
                                          DatasourceService datasourceService,
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
                                          LayoutCollectionService layoutCollectionService,
                                          ThemeService themeService,
                                       ApplicationPermission applicationPermission,
                                       PagePermission pagePermission) {

        super(workspaceService, workspaceRepository, datasourceService, datasourceRepository, configService,
                sessionUserService, userService, applicationService, applicationPageService, newPageRepository,
                newActionService, layoutActionService, actionCollectionService, layoutCollectionService, themeService,
                applicationPermission, pagePermission);
    }
}
