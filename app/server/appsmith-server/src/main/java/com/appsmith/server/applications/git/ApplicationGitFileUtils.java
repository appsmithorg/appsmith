package com.appsmith.server.applications.git;

import com.appsmith.external.git.FileInterface;
import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.helpers.ArtifactGitFileUtils;
import com.appsmith.server.newactions.base.NewActionService;
import com.google.gson.Gson;
import org.springframework.stereotype.Component;

@Component
public class ApplicationGitFileUtils extends ApplicationGitFileUtilsCE
        implements ArtifactGitFileUtils<ApplicationGitReference> {

    public ApplicationGitFileUtils(
            Gson gson,
            NewActionService newActionService,
            FileInterface fileUtils,
            ActionCollectionService actionCollectionService) {
        super(gson, newActionService, fileUtils, actionCollectionService);
    }
}
