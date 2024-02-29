package com.appsmith.server.services;

import com.appsmith.external.git.GitExecutor;
import com.appsmith.server.domains.Application;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.services.ce_compatible.CommonGitServiceCECompatibleImpl;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class CommonGitServiceImpl extends CommonGitServiceCECompatibleImpl implements CommonGitService {
    public CommonGitServiceImpl(
            CommonGitFileUtils commonGitFileUtils,
            GitFileUtils gitFileUtils,
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
                commonGitFileUtils,
                gitFileUtils,
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
