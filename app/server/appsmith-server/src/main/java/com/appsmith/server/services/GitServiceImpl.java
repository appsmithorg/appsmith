package com.appsmith.server.services;


import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.service.GitExecutorImpl;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.helpers.GitCloudServicesUtils;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.GitDeployKeysRepository;
import com.appsmith.server.services.ce.GitServiceCEImpl;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.ImportExportApplicationService;
import com.appsmith.server.solutions.PagePermission;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@Import({GitExecutorImpl.class})
public class GitServiceImpl extends GitServiceCEImpl implements GitService {

    GitCloudServicesUtils gitCloudServicesUtils;
    CommonConfig commonConfig;

    public GitServiceImpl(UserService userService,
                          UserDataService userDataService,
                          SessionUserService sessionUserService,
                          ApplicationService applicationService,
                          ApplicationPageService applicationPageService,
                          NewPageService newPageService,
                          NewActionService newActionService,
                          ActionCollectionService actionCollectionService,
                          GitFileUtils fileUtils,
                          @Qualifier("importExportServiceCEImplV2") ImportExportApplicationService importExportApplicationService,
                          GitExecutor gitExecutor,
                          ResponseUtils responseUtils,
                          EmailConfig emailConfig,
                          AnalyticsService analyticsService,
                          GitCloudServicesUtils gitCloudServicesUtils,
                          GitDeployKeysRepository gitDeployKeysRepository,
                          DatasourceService datasourceService,
                          PluginService pluginService,
                          CommonConfig commonConfig,
                          DatasourcePermission datasourcePermission,
                          ApplicationPermission applicationPermission,
                          PagePermission pagePermission,
                          ActionPermission actionPermission,
                          WorkspaceService workspaceService) {

        super(userService, userDataService, sessionUserService, applicationService, applicationPageService,
                newPageService, newActionService, actionCollectionService, fileUtils, importExportApplicationService,
                gitExecutor, responseUtils, emailConfig, analyticsService, gitCloudServicesUtils, gitDeployKeysRepository,
                datasourceService, pluginService, datasourcePermission, applicationPermission, pagePermission,
                actionPermission, workspaceService);
        this.gitCloudServicesUtils = gitCloudServicesUtils;
        this.commonConfig = commonConfig;
    }

    // Override the repo limit check for EE. Unlimited repos for the EE image
    @Override
    public Mono<Boolean> isRepoLimitReached(String workspaceId, Boolean isClearCache) {
        if(commonConfig.isCloudHosting()) {
            return super.isRepoLimitReached(workspaceId, isClearCache);
        }
        return Mono.just(Boolean.FALSE);
    }

}
