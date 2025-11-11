package com.appsmith.server.services;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.services.ce.WorkspaceDatasourceUsageServiceCEImpl;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class WorkspaceDatasourceUsageServiceImpl extends WorkspaceDatasourceUsageServiceCEImpl
        implements WorkspaceDatasourceUsageService {

    public WorkspaceDatasourceUsageServiceImpl(
            WorkspaceService workspaceService,
            DatasourceService datasourceService,
            NewActionService newActionService,
            NewPageService newPageService,
            ApplicationService applicationService,
            WorkspacePermission workspacePermission,
            DatasourcePermission datasourcePermission,
            ActionPermission actionPermission,
            ApplicationPermission applicationPermission) {
        super(
                workspaceService,
                datasourceService,
                newActionService,
                newPageService,
                applicationService,
                workspacePermission,
                datasourcePermission,
                actionPermission,
                applicationPermission);
    }
}
