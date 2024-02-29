package com.appsmith.server.applications.git;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.GitArtifactHelper;

public class GitApplicationHelperImpl extends GitApplicationHelperCECompatibleImpl
    implements GitArtifactHelper<Application> {

    public GitApplicationHelperImpl(ApplicationService applicationService, ApplicationPageService applicationPageService) {
        super(applicationService, applicationPageService);
    }
}
