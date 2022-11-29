package com.appsmith.server.services.ce;

import com.appsmith.external.git.GitExecutor;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.helpers.GitCloudServicesUtils;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.GitDeployKeysRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.ImportExportApplicationService;
import com.appsmith.server.solutions.PagePermission;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.doReturn;


@ExtendWith(SpringExtension.class)
@Slf4j
public class GitServiceCEImplTest {

    GitServiceCE gitService;

    @MockBean
    AnalyticsService analyticsService;
    @MockBean
    DatasourceService datasourceService;
    @MockBean
    PluginService pluginService;
    @MockBean
    NewPageService newPageService;
    @MockBean
    ApplicationService applicationService;
    @MockBean
    SessionUserService sessionUserService;
    @MockBean
    ResponseUtils responseUtils;
    @MockBean
    UserService userService;
    @MockBean
    UserDataService userDataService;
    @MockBean
    ApplicationPageService applicationPageService;
    @MockBean
    NewActionService newActionService;
    @MockBean
    ActionCollectionService actionCollectionService;
    @MockBean
    GitFileUtils gitFileUtils;
    @MockBean
    ImportExportApplicationService importExportApplicationService;
    @MockBean
    GitExecutor gitExecutor;
    @MockBean
    EmailConfig emailConfig;
    @MockBean
    GitCloudServicesUtils gitCloudServicesUtils;
    @MockBean
    GitDeployKeysRepository gitDeployKeysRepository;
    @MockBean
    DatasourcePermission datasourcePermission;
    @MockBean
    ApplicationPermission applicationPermission;
    @MockBean
    PagePermission pagePermission;
    @MockBean
    ActionPermission actionPermission;

    @BeforeEach
    public void setup() {
        gitService = new GitServiceCEImpl(
                userService, userDataService, sessionUserService, applicationService, applicationPageService,
                newPageService, newActionService, actionCollectionService, gitFileUtils, importExportApplicationService,
                gitExecutor, responseUtils, emailConfig, analyticsService, gitCloudServicesUtils, gitDeployKeysRepository,
                datasourceService, pluginService, datasourcePermission, applicationPermission, pagePermission,
                actionPermission
        );
    }

    @Test
    public void isRepoLimitReached_connectedAppCountIsLessThanLimit_Success() {

        doReturn(Mono.just(3))
                .when(gitCloudServicesUtils).getPrivateRepoLimitForOrg(Mockito.any(String.class), Mockito.any(Boolean.class));

        GitServiceCE gitService1 = Mockito.spy(gitService);
        doReturn(Mono.just(1L))
                .when(gitService1).getApplicationCountWithPrivateRepo(Mockito.any(String.class));

        StepVerifier
                .create(gitService1.isRepoLimitReached("workspaceId", false))
                .assertNext(aBoolean -> assertEquals(false, aBoolean))
                .verifyComplete();
    }

    @Test
    public void isRepoLimitReached_connectedAppCountIsSameAsLimit_Success() {
        doReturn(Mono.just(3))
                .when(gitCloudServicesUtils).getPrivateRepoLimitForOrg(Mockito.any(String.class), Mockito.any(Boolean.class));

        GitServiceCE gitService1 = Mockito.spy(gitService);
        doReturn(Mono.just(3L))
                .when(gitService1).getApplicationCountWithPrivateRepo(Mockito.any(String.class));

        StepVerifier
                .create(gitService1.isRepoLimitReached("workspaceId", false))
                .assertNext(aBoolean -> assertEquals(true, aBoolean))
                .verifyComplete();
    }
}