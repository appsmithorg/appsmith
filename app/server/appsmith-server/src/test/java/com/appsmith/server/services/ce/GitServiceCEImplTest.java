package com.appsmith.server.services.ce;

import com.appsmith.external.git.GitExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.EmailConfig;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.helpers.GitCloudServicesUtils;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.helpers.ce.ExecutionTimeLogging;
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
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.ImportExportApplicationService;
import com.appsmith.server.solutions.PagePermission;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.lib.BranchTrackingStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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

    @MockBean
    WorkspaceService workspaceService;

    @MockBean
    RedisUtils redisUtils;

    @MockBean
    ExecutionTimeLogging executionTimeLogging;

    @BeforeEach
    public void setup() {
        gitService = new GitServiceCEImpl(
                userService,
                userDataService,
                sessionUserService,
                applicationService,
                applicationPageService,
                newPageService,
                newActionService,
                actionCollectionService,
                gitFileUtils,
                importExportApplicationService,
                gitExecutor,
                responseUtils,
                emailConfig,
                analyticsService,
                gitCloudServicesUtils,
                gitDeployKeysRepository,
                datasourceService,
                pluginService,
                datasourcePermission,
                applicationPermission,
                pagePermission,
                actionPermission,
                workspaceService,
                redisUtils,
                executionTimeLogging);
    }

    @Test
    public void isRepoLimitReached_connectedAppCountIsLessThanLimit_Success() {

        doReturn(Mono.just(3))
                .when(gitCloudServicesUtils)
                .getPrivateRepoLimitForOrg(any(String.class), any(Boolean.class));

        GitServiceCE gitService1 = Mockito.spy(gitService);
        doReturn(Mono.just(1L)).when(gitService1).getApplicationCountWithPrivateRepo(any(String.class));

        StepVerifier.create(gitService1.isRepoLimitReached("workspaceId", false))
                .assertNext(aBoolean -> assertEquals(false, aBoolean))
                .verifyComplete();
    }

    @Test
    public void isRepoLimitReached_connectedAppCountIsSameAsLimit_Success() {
        doReturn(Mono.just(3))
                .when(gitCloudServicesUtils)
                .getPrivateRepoLimitForOrg(any(String.class), any(Boolean.class));

        GitServiceCE gitService1 = Mockito.spy(gitService);
        doReturn(Mono.just(3L)).when(gitService1).getApplicationCountWithPrivateRepo(any(String.class));

        StepVerifier.create(gitService1.isRepoLimitReached("workspaceId", true))
                .assertNext(aBoolean -> assertEquals(true, aBoolean))
                .verifyComplete();
    }

    // This test is to check if the limit is reached when the count of connected apps is more than the limit
    // This happens when public visible git repo is synced with application and then the visibility is changed
    @Test
    public void isRepoLimitReached_connectedAppCountIsMoreThanLimit_Success() {
        doReturn(Mono.just(3))
                .when(gitCloudServicesUtils)
                .getPrivateRepoLimitForOrg(any(String.class), any(Boolean.class));

        GitServiceCE gitService1 = Mockito.spy(gitService);
        doReturn(Mono.just(4L)).when(gitService1).getApplicationCountWithPrivateRepo(any(String.class));

        StepVerifier.create(gitService1.isRepoLimitReached("workspaceId", false))
                .assertNext(aBoolean -> assertEquals(true, aBoolean))
                .verifyComplete();
    }

    @Test
    public void getUncommittedChanges_WhenRepoIsNotConnectedToGit_ReturnsFalse() {
        AclPermission permission = AclPermission.READ_APPLICATIONS;
        String applicationId = "test-app-id", branch = "test-branch";
        Mockito.when(applicationPermission.getReadPermission()).thenReturn(permission);
        Mockito.when(applicationService.findByBranchNameAndDefaultApplicationId(branch, applicationId, permission))
                .thenReturn(Mono.empty());

        StepVerifier.create(gitService.getUncommittedChanges(applicationId, branch))
                .assertNext(uncommittedChangesDTO -> {
                    assertThat(uncommittedChangesDTO.isClean()).isFalse();
                })
                .verifyComplete();
    }

    @Test
    public void getUncommittedChanges_WhenApplicationLastUpdateAfterLastCommit_ReturnsTrue() {
        AclPermission permission = AclPermission.READ_APPLICATIONS;
        Application application = new Application();
        application.setLastEditedAt(Instant.now());
        application.setGitApplicationMetadata(new GitApplicationMetadata());
        application.getGitApplicationMetadata().setLastCommittedAt(Instant.now().minusSeconds(30)); // 120 seconds ago

        String applicationId = "test-app-id", branch = "test-branch";
        Mockito.when(applicationPermission.getReadPermission()).thenReturn(permission);
        Mockito.when(applicationService.findByBranchNameAndDefaultApplicationId(branch, applicationId, permission))
                .thenReturn(Mono.just(application));

        StepVerifier.create(gitService.getUncommittedChanges(applicationId, branch))
                .assertNext(uncommittedChangesDTO -> {
                    assertThat(uncommittedChangesDTO.isClean()).isFalse();
                })
                .verifyComplete();
    }

    @Test
    public void compareWithRemote_WhenSuccessful_ReturnsResponse() {
        String defaultAppId = "default-app-id", branch = "test-branch";
        AclPermission permission = AclPermission.MANAGE_APPLICATIONS;
        UserData userData = new UserData();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("public-key");
        gitAuth.setPrivateKey("private-key");

        Application defaultApplication = new Application();
        defaultApplication.setGitApplicationMetadata(new GitApplicationMetadata());
        defaultApplication.getGitApplicationMetadata().setGitAuth(gitAuth);

        GitApplicationMetadata gitData = new GitApplicationMetadata();
        gitData.setBranchName(branch);
        gitData.setRepoName("test-repo-name");
        gitData.setDefaultApplicationId(defaultAppId);

        Application branchedApplication = new Application();
        branchedApplication.setWorkspaceId("test-workspace-id");
        branchedApplication.setGitApplicationMetadata(gitData);

        Path repoSuffix = Paths.get(
                branchedApplication.getWorkspaceId(), gitData.getDefaultApplicationId(), gitData.getRepoName());
        Path repoPath = Paths.get("test", "git", "root", repoSuffix.toString());

        BranchTrackingStatus branchTrackingStatus = Mockito.mock(BranchTrackingStatus.class);
        Mockito.when(branchTrackingStatus.getAheadCount()).thenReturn(1);
        Mockito.when(branchTrackingStatus.getBehindCount()).thenReturn(2);

        Mockito.when(applicationPermission.getEditPermission()).thenReturn(permission);
        Mockito.when(gitExecutor.createRepoPath(repoSuffix)).thenReturn(repoPath);
        Mockito.when(userDataService.getForCurrentUser()).thenReturn(Mono.just(userData));
        Mockito.when(applicationService.findById(eq(defaultAppId), any(AclPermission.class)))
                .thenReturn(Mono.just(defaultApplication));
        Mockito.when(applicationService.findByBranchNameAndDefaultApplicationId(
                        eq(branch), eq(defaultAppId), any(AclPermission.class)))
                .thenReturn(Mono.just(branchedApplication));

        Mockito.when(gitExecutor.checkoutToBranch(repoSuffix, branch)).thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.fetchRemote(
                        repoPath, gitAuth.getPublicKey(), gitAuth.getPrivateKey(), true, branch, false))
                .thenReturn(Mono.just("success"));
        Mockito.when(gitExecutor.getBranchTrackingStatus(repoPath, branch)).thenReturn(Mono.just(branchTrackingStatus));

        StepVerifier.create(gitService.compareWithRemote(defaultAppId, branch, false))
                .assertNext(response -> {
                    assertThat(response.getAheadCount()).isEqualTo(1);
                    assertThat(response.getBehindCount()).isEqualTo(2);
                })
                .verifyComplete();
    }
}
