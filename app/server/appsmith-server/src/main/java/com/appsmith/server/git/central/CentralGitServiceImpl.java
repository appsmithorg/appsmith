package com.appsmith.server.git.central;

import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.git.GitRedisUtils;
import com.appsmith.server.git.autocommit.helpers.GitAutoCommitHelper;
import com.appsmith.server.git.resolver.GitArtifactHelperResolver;
import com.appsmith.server.git.resolver.GitHandlingServiceResolver;
import com.appsmith.server.git.utils.GitAnalyticsUtils;
import com.appsmith.server.git.utils.GitProfileUtils;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.DatasourcePermission;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;

@Slf4j
@Service
public class CentralGitServiceImpl extends CentralGitServiceCECompatibleImpl implements CentralGitService {

    public CentralGitServiceImpl(GitRedisUtils gitRedisUtils, GitProfileUtils gitProfileUtils, GitAnalyticsUtils gitAnalyticsUtils, UserDataService userDataService, SessionUserService sessionUserService, GitArtifactHelperResolver gitArtifactHelperResolver, GitHandlingServiceResolver gitHandlingServiceResolver, GitPrivateRepoHelper gitPrivateRepoHelper, DatasourceService datasourceService, DatasourcePermission datasourcePermission, WorkspaceService workspaceService, PluginService pluginService, ImportService importService, ExportService exportService, GitAutoCommitHelper gitAutoCommitHelper, TransactionalOperator transactionalOperator, ObservationRegistry observationRegistry) {
        super(gitRedisUtils, gitProfileUtils, gitAnalyticsUtils, userDataService, sessionUserService, gitArtifactHelperResolver, gitHandlingServiceResolver, gitPrivateRepoHelper, datasourceService, datasourcePermission, workspaceService, pluginService, importService, exportService, gitAutoCommitHelper, transactionalOperator, observationRegistry);
    }
}
