package com.appsmith.server.solutions;

import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ce.SearchEntitySolutionCEImpl;
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
