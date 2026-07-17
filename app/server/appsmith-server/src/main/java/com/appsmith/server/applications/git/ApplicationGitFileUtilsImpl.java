package com.appsmith.server.applications.git;

import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.helpers.ArtifactGitFileUtils;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

@Component
public class ApplicationGitFileUtilsImpl extends ApplicationGitFileUtilsCEImpl
        implements ArtifactGitFileUtils<ApplicationJson> {

    public ApplicationGitFileUtilsImpl(ObjectMapper objectMapper, JsonSchemaMigration jsonSchemaMigration) {
        super(objectMapper, jsonSchemaMigration);
    }
}
