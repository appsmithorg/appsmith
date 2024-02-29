package com.appsmith.server.applications.git;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ce_compatible.GitArtifactHelperCECompatible;
import com.appsmith.server.solutions.ApplicationPermission;

public class GitApplicationHelperCECompatibleImpl extends GitApplicationHelperCEImpl
        implements GitArtifactHelperCECompatible<Application> {
    public GitApplicationHelperCECompatibleImpl(
            ApplicationService applicationService,
            ApplicationPageService applicationPageService,
            ApplicationPermission applicationPermission) {
        super(applicationService, applicationPageService, applicationPermission);
    }
}
