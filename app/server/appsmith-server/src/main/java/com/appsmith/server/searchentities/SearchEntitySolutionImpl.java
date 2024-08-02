package com.appsmith.server.searchentities;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.WorkspacePermission;
import org.springframework.stereotype.Component;

@Component
public class SearchEntitySolutionImpl extends SearchEntitySolutionCEImpl implements SearchEntitySolution {

    public SearchEntitySolutionImpl(
            WorkspaceService workspaceService,
            ApplicationService applicationService,
            WorkspacePermission workspacePermission,
            ApplicationPermission applicationPermission) {
        super(workspaceService, applicationService, workspacePermission, applicationPermission);
    }
}
