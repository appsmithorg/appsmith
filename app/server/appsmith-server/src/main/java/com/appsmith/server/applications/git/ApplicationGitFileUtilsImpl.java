package com.appsmith.server.applications.git;

import com.appsmith.external.git.FileInterface;
import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.helpers.ArtifactGitFileUtils;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.newactions.base.NewActionService;
import com.google.gson.Gson;
import org.springframework.stereotype.Component;

@Component
public class ApplicationGitFileUtilsImpl extends ApplicationGitFileUtilsCEImpl
        implements ArtifactGitFileUtils<ApplicationGitReference> {

    public ApplicationGitFileUtilsImpl(
            Gson gson,
            NewActionService newActionService,
            FileInterface fileUtils,
            JsonSchemaMigration jsonSchemaMigration,
            ActionCollectionService actionCollectionService) {
        super(gson, newActionService, fileUtils, jsonSchemaMigration, actionCollectionService);
    }
}
