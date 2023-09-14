package com.appsmith.server.helpers;

import com.appsmith.server.helpers.ce.GitRepoHelperCEImpl;
import com.appsmith.server.services.ApplicationService;
import org.springframework.stereotype.Component;

@Component
public class GitRepoHelperImpl extends GitRepoHelperCEImpl implements GitRepoHelper {
    public GitRepoHelperImpl(GitCloudServicesUtils gitCloudServicesUtils, ApplicationService applicationService) {
        super(gitCloudServicesUtils, applicationService);
    }
}
