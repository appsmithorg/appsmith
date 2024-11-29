package com.appsmith.server.git.central;

import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.git.resolver.GitArtifactHelperResolver;
import com.appsmith.server.git.resolver.GitHandlingServiceResolver;
import com.appsmith.server.git.utils.GitAnalyticsUtils;
import com.appsmith.server.git.utils.GitProfileUtils;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.DatasourcePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class CentralGitServiceImpl extends CentralGitServiceCECompatibleImpl implements CentralGitService {

    public CentralGitServiceImpl(
            GitProfileUtils gitProfileUtils,
            GitAnalyticsUtils gitAnalyticsUtils,
            UserDataService userDataService,
            GitArtifactHelperResolver gitArtifactHelperResolver,
            GitHandlingServiceResolver gitHandlingServiceResolver,
            GitPrivateRepoHelper gitPrivateRepoHelper,
            DatasourceService datasourceService,
            DatasourcePermission datasourcePermission,
            WorkspaceService workspaceService,
            PluginService pluginService,
            ImportService importService,
            ExportService exportService) {
        super(
                gitProfileUtils,
                gitAnalyticsUtils,
                userDataService,
                gitArtifactHelperResolver,
                gitHandlingServiceResolver,
                gitPrivateRepoHelper,
                datasourceService,
                datasourcePermission,
                workspaceService,
                pluginService,
                importService,
                exportService);
    }
}
