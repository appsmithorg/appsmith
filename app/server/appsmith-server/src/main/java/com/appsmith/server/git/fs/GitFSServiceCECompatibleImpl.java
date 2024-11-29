package com.appsmith.server.git.fs;

import com.appsmith.external.git.handler.FSGitHandler;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.git.GitRedisUtils;
import com.appsmith.server.git.autocommit.helpers.GitAutoCommitHelper;
import com.appsmith.server.git.central.GitHandlingServiceCECompatible;
import com.appsmith.server.git.resolver.GitArtifactHelperResolver;
import com.appsmith.server.git.utils.GitAnalyticsUtils;
import com.appsmith.server.git.utils.GitProfileUtils;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.cakes.GitDeployKeysRepositoryCake;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.DatasourcePermission;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class GitFSServiceCECompatibleImpl extends GitFSServiceCEImpl implements GitHandlingServiceCECompatible {

    public GitFSServiceCECompatibleImpl(
            GitDeployKeysRepositoryCake gitDeployKeysRepository,
            GitPrivateRepoHelper gitPrivateRepoHelper,
            CommonGitFileUtils commonGitFileUtils,
            GitRedisUtils gitRedisUtils,
            SessionUserService sessionUserService,
            UserDataService userDataService,
            UserService userService,
            EmailConfig emailConfig,
            AnalyticsService analyticsService,
            ObservationRegistry observationRegistry,
            WorkspaceService workspaceService,
            DatasourceService datasourceService,
            DatasourcePermission datasourcePermission,
            PluginService pluginService,
            ExportService exportService,
            ImportService importService,
            FSGitHandler fsGitHandler,
            GitAutoCommitHelper gitAutoCommitHelper,
            GitProfileUtils gitProfileUtils,
            GitAnalyticsUtils gitAnalyticsUtils,
            GitArtifactHelperResolver gitArtifactHelperResolver) {
        super(
                gitDeployKeysRepository,
                gitPrivateRepoHelper,
                commonGitFileUtils,
                gitRedisUtils,
                sessionUserService,
                userDataService,
                userService,
                emailConfig,
                analyticsService,
                observationRegistry,
                workspaceService,
                datasourceService,
                datasourcePermission,
                pluginService,
                exportService,
                importService,
                fsGitHandler,
                gitAutoCommitHelper,
                gitProfileUtils,
                gitAnalyticsUtils,
                gitArtifactHelperResolver);
    }
}
