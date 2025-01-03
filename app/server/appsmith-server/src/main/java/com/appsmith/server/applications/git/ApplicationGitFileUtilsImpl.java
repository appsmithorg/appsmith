package com.appsmith.server.applications.git;

import com.appsmith.external.git.FileInterface;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.helpers.ArtifactGitFileUtils;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.newactions.base.NewActionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import org.springframework.stereotype.Component;

@Component
public class ApplicationGitFileUtilsImpl extends ApplicationGitFileUtilsCEImpl
        implements ArtifactGitFileUtils<ApplicationJson> {

    public ApplicationGitFileUtilsImpl(
            Gson gson,
            ObjectMapper objectMapper,
            NewActionService newActionService,
            FileInterface fileUtils,
            JsonSchemaMigration jsonSchemaMigration,
            ActionCollectionService actionCollectionService) {
        super(gson, objectMapper, newActionService, fileUtils, jsonSchemaMigration, actionCollectionService);
    }
}
