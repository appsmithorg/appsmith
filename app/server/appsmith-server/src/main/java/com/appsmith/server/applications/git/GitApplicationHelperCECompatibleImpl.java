package com.appsmith.server.applications.git;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ce_compatible.GitArtifactHelperCECompatible;


public class GitApplicationHelperCECompatibleImpl extends GitApplicationHelperCEImpl
    implements GitArtifactHelperCECompatible<Application> {

    public GitApplicationHelperCECompatibleImpl(ApplicationService applicationService, ApplicationPageService applicationPageService) {
        super(applicationService, applicationPageService);
    }
}
