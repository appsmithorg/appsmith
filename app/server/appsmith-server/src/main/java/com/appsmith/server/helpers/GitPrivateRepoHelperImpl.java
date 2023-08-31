package com.appsmith.server.helpers;

import com.appsmith.server.helpers.ce.GitPrivateRepoHelperCEImpl;
import com.appsmith.server.services.ApplicationService;
import org.springframework.stereotype.Component;

@Component
public class GitPrivateRepoHelperImpl extends GitPrivateRepoHelperCEImpl implements GitPrivateRepoHelper {
    public GitPrivateRepoHelperImpl(
            GitCloudServicesUtils gitCloudServicesUtils, ApplicationService applicationService) {
        super(gitCloudServicesUtils, applicationService);
    }
}
