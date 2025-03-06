package com.appsmith.server.helpers;

import com.appsmith.external.git.FileInterface;
import com.appsmith.external.git.operations.FileOperations;
import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.git.files.FileUtilsImpl;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.helpers.ce.CommonGitFileUtilsCE;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Import({FileUtilsImpl.class})
public class CommonGitFileUtils extends CommonGitFileUtilsCE {

    public CommonGitFileUtils(
            ArtifactGitFileUtils<ApplicationJson> applicationGitFileUtils,
            GitServiceConfig gitServiceConfig,
            FileInterface fileUtils,
            FileOperations fileOperations,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            NewActionService newActionService,
            ActionCollectionService actionCollectionService,
            JsonSchemaVersions jsonSchemaVersions,
            ObjectMapper objectMapper) {
        super(
                applicationGitFileUtils,
                gitServiceConfig,
                fileUtils,
                fileOperations,
                analyticsService,
                sessionUserService,
                newActionService,
                actionCollectionService,
                jsonSchemaVersions,
                objectMapper);
    }
}
