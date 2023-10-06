package com.appsmith.server.services.ce_compatible;

import com.appsmith.external.git.GitExecutor;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.GitPrivateRepoHelper;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.repositories.GitDeployKeysRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.services.ce.GitServiceCEImpl;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.ImportExportApplicationService;
import io.micrometer.observation.ObservationRegistry;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
public class GitServiceCECompatibleImpl extends GitServiceCEImpl implements GitServiceCECompatible {
    public GitServiceCECompatibleImpl(
            UserService userService,
            UserDataService userDataService,
            SessionUserService sessionUserService,
            ApplicationService applicationService,
            ApplicationPageService applicationPageService,
            NewPageService newPageService,
            NewActionService newActionService,
            ActionCollectionService actionCollectionService,
            GitFileUtils fileUtils,
            ImportExportApplicationService importExportApplicationService,
            GitExecutor gitExecutor,
            ResponseUtils responseUtils,
            EmailConfig emailConfig,
            AnalyticsService analyticsService,
            GitDeployKeysRepository gitDeployKeysRepository,
            DatasourceService datasourceService,
            PluginService pluginService,
            DatasourcePermission datasourcePermission,
            ApplicationPermission applicationPermission,
            WorkspaceService workspaceService,
            RedisUtils redisUtils,
            ObservationRegistry observationRegistry,
            GitPrivateRepoHelper gitPrivateRepoCountHelper) {
        super(
                userService,
                userDataService,
                sessionUserService,
                applicationService,
                applicationPageService,
                newPageService,
                newActionService,
                actionCollectionService,
                fileUtils,
                importExportApplicationService,
                gitExecutor,
                responseUtils,
                emailConfig,
                analyticsService,
                gitDeployKeysRepository,
                datasourceService,
                pluginService,
                datasourcePermission,
                applicationPermission,
                workspaceService,
                redisUtils,
                observationRegistry,
                gitPrivateRepoCountHelper);
    }

    @Override
    public Mono<String> setDefaultBranch(String defaultApplicationId, String newDefaultBranchName) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Application> protectBranch(String defaultApplicationId, String branchName) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Application> unProtectBranch(String defaultApplicationId, String branchName) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<List<String>> getProtectedBranches(String defaultApplicationId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
