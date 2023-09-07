package com.appsmith.server.solutions.ce_compatible;

import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.ForkExamplesWorkspace;
import com.appsmith.server.solutions.ImportExportApplicationService;
import com.appsmith.server.solutions.WorkspacePermission;
import com.appsmith.server.solutions.ce.ApplicationForkingServiceCEImpl;
import org.springframework.stereotype.Component;

@Component
public class ApplicationForkingServiceCeCompatibleImpl extends ApplicationForkingServiceCEImpl
        implements ApplicationForkingServiceCeCompatible {
    public ApplicationForkingServiceCeCompatibleImpl(
            ApplicationService applicationService,
            WorkspaceService workspaceService,
            ForkExamplesWorkspace forkExamplesWorkspace,
            SessionUserService sessionUserService,
            AnalyticsService analyticsService,
            ResponseUtils responseUtils,
            WorkspacePermission workspacePermission,
            ApplicationPermission applicationPermission,
            ImportExportApplicationService importExportApplicationService) {
        super(
                applicationService,
                workspaceService,
                forkExamplesWorkspace,
                sessionUserService,
                analyticsService,
                responseUtils,
                workspacePermission,
                applicationPermission,
                importExportApplicationService);
    }
}
