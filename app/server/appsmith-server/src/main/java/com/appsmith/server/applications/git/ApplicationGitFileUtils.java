package com.appsmith.server.applications.git;

import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.helpers.ArtifactGitFileUtils;
import com.appsmith.server.newactions.base.NewActionService;
import org.springframework.stereotype.Component;

@Component
public class ApplicationGitFileUtils extends ApplicationGitFileUtilsCE
        implements ArtifactGitFileUtils<ApplicationGitReference> {

    public ApplicationGitFileUtils(NewActionService newActionService, ActionCollectionService actionCollectionService) {
        super(newActionService, actionCollectionService);
    }
}
