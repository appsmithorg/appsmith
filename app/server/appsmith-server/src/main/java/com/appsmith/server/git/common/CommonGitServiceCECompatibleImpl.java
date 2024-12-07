package com.appsmith.server.git.common;

import com.appsmith.external.git.GitExecutor;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.git.GitRedisUtils;
import com.appsmith.server.git.autocommit.helpers.GitAutoCommitHelper;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.GitDeployKeysRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.GitArtifactHelper;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.DatasourcePermission;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;

@Slf4j
@Service
public class CommonGitServiceCECompatibleImpl extends CommonGitServiceCEImpl implements CommonGitServiceCECompatible {

    public CommonGitServiceCECompatibleImpl(
            GitDeployKeysRepository gitDeployKeysRepository,
            GitPrivateRepoHelper gitPrivateRepoHelper,
            CommonGitFileUtils commonGitFileUtils,
            GitRedisUtils gitRedisUtils,
            SessionUserService sessionUserService,
            UserDataService userDataService,
            UserService userService,
            TransactionalOperator transactionalOperator,
            AnalyticsService analyticsService,
            ObservationRegistry observationRegistry,
            WorkspaceService workspaceService,
            DatasourceService datasourceService,
            DatasourcePermission datasourcePermission,
            PluginService pluginService,
            ExportService exportService,
            ImportService importService,
            GitExecutor gitExecutor,
            GitArtifactHelper<Application> gitApplicationHelper,
            GitAutoCommitHelper gitAutoCommitHelper) {
        super(
                gitDeployKeysRepository,
                gitPrivateRepoHelper,
                commonGitFileUtils,
                gitRedisUtils,
                sessionUserService,
                userDataService,
                userService,
                transactionalOperator,
                analyticsService,
                observationRegistry,
                workspaceService,
                datasourceService,
                datasourcePermission,
                pluginService,
                exportService,
                importService,
                gitExecutor,
                gitApplicationHelper,
                gitAutoCommitHelper);
    }
}
