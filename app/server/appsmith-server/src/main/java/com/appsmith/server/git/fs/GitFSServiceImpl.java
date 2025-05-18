package com.appsmith.server.git.fs;

import com.appsmith.external.git.handler.FSGitHandler;
import com.appsmith.server.git.GitRedisUtils;
import com.appsmith.server.git.central.GitHandlingService;
import com.appsmith.server.git.resolver.GitArtifactHelperResolver;
import com.appsmith.server.git.utils.GitAnalyticsUtils;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.repositories.GitDeployKeysRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.SessionUserService;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class GitFSServiceImpl extends GitFSServiceCECompatibleImpl implements GitHandlingService {

    public GitFSServiceImpl(
            GitDeployKeysRepository gitDeployKeysRepository,
            CommonGitFileUtils commonGitFileUtils,
            GitRedisUtils gitRedisUtils,
            SessionUserService sessionUserService,
            AnalyticsService analyticsService,
            ObservationRegistry observationRegistry,
            FSGitHandler fsGitHandler,
            GitAnalyticsUtils gitAnalyticsUtils,
            GitArtifactHelperResolver gitArtifactHelperResolver,
            FeatureFlagService featureFlagService) {
        super(
                gitDeployKeysRepository,
                commonGitFileUtils,
                gitRedisUtils,
                sessionUserService,
                analyticsService,
                observationRegistry,
                fsGitHandler,
                gitAnalyticsUtils,
                gitArtifactHelperResolver,
                featureFlagService);
    }
}
