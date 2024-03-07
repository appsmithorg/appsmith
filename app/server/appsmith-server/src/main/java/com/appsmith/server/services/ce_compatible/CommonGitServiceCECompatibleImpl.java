package com.appsmith.server.services.ce_compatible;

import com.appsmith.external.git.GitExecutor;
import com.appsmith.server.domains.Application;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.GitArtifactHelper;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.ce.CommonGitServiceCEImpl;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class CommonGitServiceCECompatibleImpl extends CommonGitServiceCEImpl implements CommonGitServiceCECompatible {

    public CommonGitServiceCECompatibleImpl(
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
