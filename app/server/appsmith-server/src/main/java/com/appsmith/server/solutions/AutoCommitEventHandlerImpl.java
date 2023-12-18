package com.appsmith.server.solutions;

import com.appsmith.external.git.GitExecutor;
import com.appsmith.server.configurations.ProjectProperties;
import com.appsmith.server.helpers.DSLMigrationUtils;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.solutions.ce.AutoCommitEventHandlerCEImpl;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
public class AutoCommitEventHandlerImpl extends AutoCommitEventHandlerCEImpl implements AutoCommitEventHandler {

    public AutoCommitEventHandlerImpl(
            ApplicationEventPublisher applicationEventPublisher,
            RedisUtils redisUtils,
            DSLMigrationUtils dslMigrationUtils,
            GitFileUtils fileUtils,
            GitExecutor gitExecutor,
            ProjectProperties projectProperties,
            AnalyticsService analyticsService) {
        super(
                applicationEventPublisher,
                redisUtils,
                dslMigrationUtils,
                fileUtils,
                gitExecutor,
                projectProperties,
                analyticsService);
    }
}
