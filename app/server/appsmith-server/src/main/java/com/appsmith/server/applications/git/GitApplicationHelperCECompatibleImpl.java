package com.appsmith.server.applications.git;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ce_compatible.GitArtifactHelperCECompatible;
import com.appsmith.server.solutions.ApplicationPermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class GitApplicationHelperCECompatibleImpl extends GitApplicationHelperCEImpl
        implements GitArtifactHelperCECompatible<Application> {
    public GitApplicationHelperCECompatibleImpl(
            CommonGitFileUtils commonGitFileUtils,
            GitPrivateRepoHelper gitPrivateRepoHelper,
            ApplicationService applicationService,
            ApplicationPageService applicationPageService,
            ApplicationPermission applicationPermission,
            NewPageService newPageService,
            ActionCollectionService actionCollectionService,
            NewActionService newActionService,
            JsonSchemaVersions jsonSchemaVersions) {
        super(
                commonGitFileUtils,
                gitPrivateRepoHelper,
                applicationService,
                applicationPageService,
                applicationPermission,
                newPageService,
                actionCollectionService,
                newActionService,
                jsonSchemaVersions);
    }
}
