package com.appsmith.server.services.ce;

import com.appsmith.external.git.GitExecutor;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.helpers.GitCloudServicesUtils;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.PluginExecutorHelper;
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
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ImportExportApplicationService;
import lombok.extern.slf4j.Slf4j;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.junit.Assert.assertEquals;
import static org.mockito.ArgumentMatchers.eq;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
public class GitServiceCEImplTest {

    GitServiceCE gitService;

    @MockBean
    WorkspaceService workspaceService;

    @MockBean
    ApplicationPageService applicationPageService;

    @MockBean
    UserService userService;

    @MockBean
    ApplicationService applicationService;

    @MockBean
    NewPageService newPageService;
    @MockBean
    NewActionService newActionService;
    @MockBean
    ActionCollectionService actionCollectionService;
    @MockBean
    DatasourceService datasourceService;
    @MockBean
    GitExecutor gitExecutor;
    @MockBean
    GitFileUtils gitFileUtils;
    @MockBean
    GitCloudServicesUtils gitCloudServicesUtils;
    @MockBean
    PluginExecutorHelper pluginExecutorHelper;
    @MockBean
    UserDataService userDataService;
    @MockBean
    SessionUserService sessionUserService;
    @MockBean
    ImportExportApplicationService importExportApplicationService;
    @MockBean
    ResponseUtils responseUtils;
    @MockBean
    EmailConfig emailConfig;
    @MockBean
    AnalyticsService analyticsService;
    @MockBean
    GitDeployKeysRepository gitDeployKeysRepository;
    @MockBean
    PluginService pluginService;

    @Before
    public void setUp() {
        gitService = new GitServiceCEImpl(
                userService, userDataService, sessionUserService, applicationService, applicationPageService,
                newPageService, newActionService, actionCollectionService, gitFileUtils, importExportApplicationService,
                gitExecutor, responseUtils, emailConfig, analyticsService, gitCloudServicesUtils, gitDeployKeysRepository,
                datasourceService, pluginService
        );
    }

    @Test
    public void isRepoLimitReached_connectedAppCountIsLessThanLimit_Success() {
        Mockito
                .when(gitCloudServicesUtils.getPrivateRepoLimitForOrg(eq(Mockito.any()), Mockito.anyBoolean()))
                .thenReturn(Mono.just(3));
        Mockito.when(gitService.getApplicationCountWithPrivateRepo(Mockito.any()))
                .thenReturn(Mono.just(Long.valueOf(1)));

        StepVerifier
                .create(gitService.isRepoLimitReached(null, null))
                .assertNext(aBoolean -> assertEquals(false, aBoolean))
                .verifyComplete();
    }

    @Test
    public void isRepoLimitReached_connectedAppCountIsSameAsLimit_Success() {
        Mockito
                .when(gitCloudServicesUtils.getPrivateRepoLimitForOrg(eq(Mockito.any()), Mockito.anyBoolean()))
                .thenReturn(Mono.just(3));
        Mockito.when(gitService.getApplicationCountWithPrivateRepo(Mockito.any()))
                .thenReturn(Mono.just(Long.valueOf(3)));

        StepVerifier
                .create(gitService.isRepoLimitReached(null, null))
                .assertNext(aBoolean -> assertEquals(true, aBoolean))
                .verifyComplete();
    }


}
