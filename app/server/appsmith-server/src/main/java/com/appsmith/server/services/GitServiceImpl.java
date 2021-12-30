package com.appsmith.server.services;


import com.appsmith.external.git.GitExecutor;
import com.appsmith.git.service.GitExecutorImpl;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.services.ce.GitServiceCEImpl;
import com.appsmith.server.solutions.ImportExportApplicationService;
import lombok.extern.slf4j.Slf4j;
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
                          ImportExportApplicationService importExportApplicationService,
                          GitExecutor gitExecutor,
                          ResponseUtils responseUtils,
                          EmailConfig emailConfig,
                          CommonConfig commonConfig,
                          ConfigService configService,
                          CloudServicesConfig cloudServicesConfig,
                          AnalyticsService analyticsService) {
        super(userService, userDataService, sessionUserService, applicationService, applicationPageService, newPageService, newActionService, actionCollectionService, fileUtils, importExportApplicationService, gitExecutor, responseUtils, emailConfig, commonConfig, configService, cloudServicesConfig, analyticsService);
    }
}
