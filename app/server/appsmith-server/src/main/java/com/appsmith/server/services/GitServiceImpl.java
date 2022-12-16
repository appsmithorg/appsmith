package com.appsmith.server.services;


import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.service.GitExecutorImpl;
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
import io.sentry.protocol.App;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@Import({GitExecutorImpl.class})
public class GitServiceImpl extends GitServiceCEImpl implements GitService {
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
                          DatasourcePermission datasourcePermission,
                          ApplicationPermission applicationPermission,
                          PagePermission pagePermission,
                          ActionPermission actionPermission) {

        super(userService, userDataService, sessionUserService, applicationService, applicationPageService,
                newPageService, newActionService, actionCollectionService, fileUtils, importExportApplicationService,
                gitExecutor, responseUtils, emailConfig, analyticsService, gitCloudServicesUtils, gitDeployKeysRepository,
                datasourceService, pluginService, datasourcePermission, applicationPermission, pagePermission,
                actionPermission);
    }
}
