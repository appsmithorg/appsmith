package com.appsmith.server.services;

import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.service.GitExecutorImpl;
import com.appsmith.server.domains.Application;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.services.ce_compatible.CommonGitServiceCECompatibleImpl;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@Import({GitExecutorImpl.class})
public class CommonGitServiceImpl extends CommonGitServiceCECompatibleImpl implements CommonGitService {

    public CommonGitServiceImpl(
            GitPrivateRepoHelper gitPrivateRepoHelper,
            CommonGitFileUtils commonGitFileUtils,
            RedisUtils redisUtils,
            SessionUserService sessionUserService,
            UserDataService userDataService,
            UserService userService,
            AnalyticsService analyticsService,
            ObservationRegistry observationRegistry,
            ExportService exportService,
            ImportService importService,
            GitExecutor gitExecutor,
            GitArtifactHelper<Application> gitApplicationHelper) {
        super(
                gitPrivateRepoHelper,
                commonGitFileUtils,
                redisUtils,
                sessionUserService,
                userDataService,
                userService,
                analyticsService,
                observationRegistry,
                exportService,
                importService,
                gitExecutor,
                gitApplicationHelper);
    }
}
