package com.appsmith.server.git;

import com.appsmith.external.git.GitExecutor;
import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.DSLMigrationUtils;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.services.AnalyticsService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
public class AutoCommitEventHandlerImpl extends AutoCommitEventHandlerCEImpl implements AutoCommitEventHandler {

    public AutoCommitEventHandlerImpl(
            ApplicationEventPublisher applicationEventPublisher,
            GitRedisUtils gitRedisUtils,
            RedisUtils redisUtils,
            DSLMigrationUtils dslMigrationUtils,
            GitFileUtils fileUtils,
            CommonGitFileUtils commonGitFileUtils,
            GitExecutor gitExecutor,
            ProjectProperties projectProperties,
            AnalyticsService analyticsService) {
        super(
                applicationEventPublisher,
                gitRedisUtils,
                redisUtils,
                dslMigrationUtils,
                fileUtils,
                commonGitFileUtils,
                gitExecutor,
                projectProperties,
                analyticsService);
    }
}
