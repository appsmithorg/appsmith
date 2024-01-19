package com.appsmith.server.services;

import com.appsmith.external.dtos.GitBranchDTO;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.external.models.Policy;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.domains.ce.AutoDeployment;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitDeployApplicationResultDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.GitCloudServicesUtils;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.GitUtils;
import com.appsmith.server.imports.internal.ImportApplicationService;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.solutions.ApplicationPermission;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.AnalyticsEvents.GIT_ADD_PROTECTED_BRANCH;
import static com.appsmith.external.constants.AnalyticsEvents.GIT_REMOVE_PROTECTED_BRANCH;
import static com.appsmith.external.constants.AnalyticsEvents.GIT_UPDATE_DEFAULT_BRANCH;
import static com.appsmith.external.constants.GitConstants.ERROR_AUTO_DEPLOYMENT_NOT_CONFIGURED;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class GitServiceTest {

    @Autowired
    WorkspaceService workspaceService;

    @MockBean
    GitExecutor gitExecutor;

    @SpyBean
    FeatureFlagService featureFlagService;

    @SpyBean
    CommonConfig commonConfig;

    @MockBean
    GitCloudServicesUtils gitCloudServicesUtils;

    @MockBean
    GitFileUtils gitFileUtils;

    @Autowired
    GitService gitService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationPermission applicationPermission;

    @Autowired
    ApplicationRepository applicationRepository;

    @SpyBean
    AnalyticsService analyticsService;

    @SpyBean
    ImportApplicationService importApplicationService;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    private static final GitProfile testUserProfile = new GitProfile();

    private String workspaceId;

    @BeforeEach
    public void setup() throws IOException, GitAPIException {

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_git_unlimited_repo_enabled)))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_gac_enabled)))
                .thenReturn(Mono.just(FALSE));
        testUserProfile.setAuthorEmail("test@email.com");
        testUserProfile.setAuthorName("testUser");

        Workspace workspace = new Workspace();
        workspace.setName(UUID.randomUUID().toString());
        workspaceId = workspaceService.create(workspace).map(Workspace::getId).block();
    }

    private GitConnectDTO getConnectRequest(String remoteUrl, GitProfile gitProfile) {
        GitConnectDTO gitConnectDTO = new GitConnectDTO();
        gitConnectDTO.setRemoteUrl(remoteUrl);
        gitConnectDTO.setGitProfile(gitProfile);
        return gitConnectDTO;
    }

    private GitAuth getGitAuth() {
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl("docUrl");
        return gitAuth;
    }

    private void mockForValidConnectRequest() throws IOException, GitAPIException {
        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), anyString(), anyString(), anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitExecutor.commitApplication(
                        Mockito.any(Path.class),
                        anyString(),
                        anyString(),
                        anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("commit"));
        Mockito.when(gitExecutor.checkoutToBranch(Mockito.any(Path.class), anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(
                        Mockito.any(Path.class), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(Mono.just("success"));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class)))
                .thenReturn(Mono.just(true));
        Mockito.when(gitFileUtils.initializeReadme(Mockito.any(Path.class), anyString(), anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));
        Mockito.when(gitFileUtils.saveApplicationToLocalRepoWithAnalytics(
                        Mockito.any(Path.class), Mockito.any(ApplicationJson.class), anyString()))
                .thenReturn(Mono.just(Paths.get("path")));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void
            connectApplicationToGit_privateRepoLimit_auditLogsEnabled_supportedPrivateReposExhausted_AppsmithCloud_throwException() {

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_audit_logs_enabled)))
                .thenReturn(Mono.just(TRUE));
        Workspace workspace = new Workspace();
        workspace.setName(UUID.randomUUID().toString());
        String limitPrivateRepoTestWorkspaceId =
                workspaceService.create(workspace).map(Workspace::getId).block();

        Mockito.when(gitCloudServicesUtils.getPrivateRepoLimitForOrg(anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just(0));

        doReturn(TRUE).when(commonConfig).isCloudHosting();

        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        gitApplicationMetadata.setGitAuth(getGitAuth());
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName(
                "connectApplicationToGit_privateRepo_supportedPrivateReposExhausted_AppsmithCloud_throwException");
        testApplication.setWorkspaceId(limitPrivateRepoTestWorkspaceId);
        Application application =
                applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<Application> applicationMono =
                gitService.connectApplicationToGit(application.getId(), gitConnectDTO, "baseUrl");

        StepVerifier.create(applicationMono)
                .expectErrorMatches(error -> error instanceof AppsmithException
                        && error.getMessage().equals(AppsmithError.GIT_APPLICATION_LIMIT_ERROR.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void
            connectApplicationToGit_privateRepoLimit_auditLogsDisabled_supportedPrivateReposExhausted_AppsmithCloud_throwException() {

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_audit_logs_enabled)))
                .thenReturn(Mono.just(FALSE));
        Workspace workspace = new Workspace();
        workspace.setName(UUID.randomUUID().toString());
        String limitPrivateRepoTestWorkspaceId =
                workspaceService.create(workspace).map(Workspace::getId).block();

        Mockito.when(gitCloudServicesUtils.getPrivateRepoLimitForOrg(anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just(0));

        doReturn(TRUE).when(commonConfig).isCloudHosting();

        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        gitApplicationMetadata.setGitAuth(getGitAuth());
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName(
                "connectApplicationToGit_privateRepo_supportedPrivateReposExhausted_AppsmithCloud_throwException");
        testApplication.setWorkspaceId(limitPrivateRepoTestWorkspaceId);
        Application application =
                applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<Application> applicationMono =
                gitService.connectApplicationToGit(application.getId(), gitConnectDTO, "baseUrl");

        StepVerifier.create(applicationMono)
                .expectErrorMatches(error -> error instanceof AppsmithException
                        && error.getMessage().equals(AppsmithError.GIT_APPLICATION_LIMIT_ERROR.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void
            connectApplicationToGit_privateRepoLimit_auditLogsEnabled_privateRepoCountLessThanSupported_AppsmithCloud_success()
                    throws IOException, GitAPIException {

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_audit_logs_enabled)))
                .thenReturn(Mono.just(TRUE));
        Workspace workspace = new Workspace();
        workspace.setName(UUID.randomUUID().toString());
        String limitPrivateRepoTestWorkspaceId =
                workspaceService.create(workspace).map(Workspace::getId).block();

        mockForValidConnectRequest();
        Mockito.when(gitCloudServicesUtils.getPrivateRepoLimitForOrg(anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just(2));

        doReturn(TRUE).when(commonConfig).isCloudHosting();

        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        gitApplicationMetadata.setGitAuth(getGitAuth());
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName(
                "connectApplicationToGit_privateRepo_privateRepoCountLessThanSupported_AppsmithCloud_success");
        testApplication.setWorkspaceId(limitPrivateRepoTestWorkspaceId);
        Application application =
                applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<Application> applicationMono =
                gitService.connectApplicationToGit(application.getId(), gitConnectDTO, "baseUrl");

        StepVerifier.create(applicationMono)
                .assertNext(gitConnectedApp -> {
                    assertThat(gitConnectedApp.getGitApplicationMetadata()).isNotNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void
            connectApplicationToGit_privateRepoLimit_auditLogsDisabled_privateRepoCountLessThanSupported_AppsmithCloud_success()
                    throws IOException, GitAPIException {

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_audit_logs_enabled)))
                .thenReturn(Mono.just(FALSE));
        Workspace workspace = new Workspace();
        workspace.setName(UUID.randomUUID().toString());
        String limitPrivateRepoTestWorkspaceId =
                workspaceService.create(workspace).map(Workspace::getId).block();

        mockForValidConnectRequest();
        Mockito.when(gitCloudServicesUtils.getPrivateRepoLimitForOrg(anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just(2));

        doReturn(TRUE).when(commonConfig).isCloudHosting();

        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        gitApplicationMetadata.setGitAuth(getGitAuth());
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName(
                "connectApplicationToGit_privateRepo_privateRepoCountLessThanSupported_AppsmithCloud_success");
        testApplication.setWorkspaceId(limitPrivateRepoTestWorkspaceId);
        Application application =
                applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<Application> applicationMono =
                gitService.connectApplicationToGit(application.getId(), gitConnectDTO, "baseUrl");

        StepVerifier.create(applicationMono)
                .assertNext(gitConnectedApp -> {
                    assertThat(gitConnectedApp.getGitApplicationMetadata()).isNotNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_auditLogsEnabled_supportInfinitePrivateRepo_success()
            throws IOException, GitAPIException {

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_audit_logs_enabled)))
                .thenReturn(Mono.just(TRUE));
        Workspace workspace = new Workspace();
        workspace.setName(UUID.randomUUID().toString());
        String limitPrivateRepoTestWorkspaceId =
                workspaceService.create(workspace).map(Workspace::getId).block();

        mockForValidConnectRequest();

        doReturn(FALSE).when(commonConfig).isCloudHosting();

        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        gitApplicationMetadata.setGitAuth(getGitAuth());
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("connectApplicationToGit_supportInfinitePrivateRepo_success");
        testApplication.setWorkspaceId(limitPrivateRepoTestWorkspaceId);
        Application application =
                applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<Application> applicationMono =
                gitService.connectApplicationToGit(application.getId(), gitConnectDTO, "baseUrl");

        StepVerifier.create(applicationMono)
                .assertNext(gitConnectedApp -> {
                    assertThat(gitConnectedApp.getGitApplicationMetadata()).isNotNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_auditLogsDisabled_supportInfinitePrivateRepo_success()
            throws IOException, GitAPIException {

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_audit_logs_enabled)))
                .thenReturn(Mono.just(FALSE));
        Workspace workspace = new Workspace();
        workspace.setName(UUID.randomUUID().toString());
        String limitPrivateRepoTestWorkspaceId =
                workspaceService.create(workspace).map(Workspace::getId).block();

        mockForValidConnectRequest();

        doReturn(FALSE).when(commonConfig).isCloudHosting();

        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        gitApplicationMetadata.setGitAuth(getGitAuth());
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("connectApplicationToGit_supportInfinitePrivateRepo_success");
        testApplication.setWorkspaceId(limitPrivateRepoTestWorkspaceId);
        Application application =
                applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<Application> applicationMono =
                gitService.connectApplicationToGit(application.getId(), gitConnectDTO, "baseUrl");

        StepVerifier.create(applicationMono)
                .assertNext(gitConnectedApp -> {
                    assertThat(gitConnectedApp.getGitApplicationMetadata()).isNotNull();
                })
                .verifyComplete();
    }

    private Application createApplicationWithGitMetaData(
            String workspaceId, String name, GitApplicationMetadata gitApplicationMetadata) {
        Application application = new Application();
        application.setName(name);
        application.setWorkspaceId(workspaceId);
        application.setGitApplicationMetadata(gitApplicationMetadata);
        return application;
    }

    private GitApplicationMetadata createGitApplicationMetaData(
            String defaultAppId, String branch, String defaultBranch, GitAuth gitAuth) {
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        gitApplicationMetadata.setBranchName(branch);
        gitApplicationMetadata.setDefaultBranchName(defaultBranch);
        gitApplicationMetadata.setGitAuth(gitAuth);
        gitApplicationMetadata.setDefaultApplicationId(defaultAppId);
        gitApplicationMetadata.setRemoteUrl("https://example.com");
        gitApplicationMetadata.setRepoName("my-test-repo");
        return gitApplicationMetadata;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void setDefaultBranch_WhenApplicationFound_DefaultBranchNameUpdated() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_git_branch_protection_enabled)))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_audit_logs_enabled)))
                .thenReturn(Mono.just(FALSE));

        Workspace workspace = new Workspace();
        workspace.setName(UUID.randomUUID().toString());
        String workspaceId =
                workspaceService.create(workspace).map(Workspace::getId).block();
        String defaultBranchBeforeChange = "main", defaultBranchAfterChange = "branch2";

        // create the root application
        Application rootApp = applicationPageService
                .createApplication(createApplicationWithGitMetaData(workspaceId, "rootApp", null))
                .block();
        // now set the git application metadata, with the default application id
        assert rootApp != null;
        rootApp.setGitApplicationMetadata(createGitApplicationMetaData(
                rootApp.getId(), defaultBranchBeforeChange, defaultBranchBeforeChange, getGitAuth()));

        List<Application> applicationList = new ArrayList<>();
        applicationList.add(rootApp);

        // create 2 applications, one with branch=bracnh1, another with branch=branch2. default branch=main
        for (int i = 1; i <= 2; i++) {
            GitApplicationMetadata gitApplicationMetadata =
                    createGitApplicationMetaData(rootApp.getId(), "branch" + i, defaultBranchBeforeChange, null);
            Application application = createApplicationWithGitMetaData(workspaceId, "App" + i, gitApplicationMetadata);
            application.setPolicies(rootApp.getPolicies());
            applicationList.add(application);
        }

        // save all the applications
        Mono<List<Application>> applicationListMono = applicationRepository
                .saveAll(applicationList)
                .then(gitService.setDefaultBranch(rootApp.getId(), defaultBranchAfterChange))
                .thenMany(applicationRepository.findByWorkspaceId(workspaceId))
                .collectList();

        StepVerifier.create(applicationListMono)
                .assertNext(applications -> {
                    assertThat(applications.size()).isEqualTo(3);
                    applications.forEach(application -> {
                        GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                        assert application.getId() != null;
                        if (application.getId().equals(rootApp.getId())) {
                            assertThat(application.getGitApplicationMetadata().getGitAuth())
                                    .isNotNull();
                        }
                        assertThat(gitApplicationMetadata.getDefaultBranchName())
                                .isEqualTo(defaultBranchAfterChange);
                        assertThat(gitApplicationMetadata.getBranchName()).isNotNull();
                        verify(analyticsService, times(1))
                                .sendEvent(eq(GIT_UPDATE_DEFAULT_BRANCH.getEventName()), anyString(), anyMap());
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void setDefaultBranch_WhenPermissionDoesNotExist_ExceptionThrown() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_git_branch_protection_enabled)))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_audit_logs_enabled)))
                .thenReturn(Mono.just(FALSE));

        Workspace workspace = new Workspace();
        workspace.setName(UUID.randomUUID().toString());
        String workspaceId =
                workspaceService.create(workspace).map(Workspace::getId).block();
        String defaultBranchBeforeChange = "main", defaultBranchAfterChange = "branch2";

        // create the root application
        Application rootApp = applicationPageService
                .createApplication(createApplicationWithGitMetaData(workspaceId, "rootApp", null))
                .block();

        // remove permission from the application
        Set<Policy> newPoliciesWithoutPermission = rootApp.getPolicies().stream()
                .filter(policy ->
                        !policy.getPermission().equals(applicationPermission.getManageDefaultBranchPermission()))
                .collect(Collectors.toSet());
        rootApp.setPolicies(newPoliciesWithoutPermission);
        rootApp = applicationRepository.save(rootApp).block();

        StepVerifier.create(gitService.setDefaultBranch(rootApp.getId(), defaultBranchAfterChange))
                .expectErrorMessage(AppsmithError.NO_RESOURCE_FOUND.getMessage(
                        FieldName.APPLICATION, rootApp.getId() + "," + defaultBranchAfterChange))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void setDefaultBranch_WhenNoApplicationFoundWithBranchName_ExceptionThrown() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_git_branch_protection_enabled)))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_audit_logs_enabled)))
                .thenReturn(Mono.just(FALSE));

        Workspace workspace = new Workspace();
        workspace.setName(UUID.randomUUID().toString());
        String workspaceId =
                workspaceService.create(workspace).map(Workspace::getId).block();
        String defaultBranchBeforeChange = "main", defaultBranchAfterChange = "invalidBranchName";

        // create the root application
        Application rootApp = applicationPageService
                .createApplication(createApplicationWithGitMetaData(workspaceId, "rootApp", null))
                .block();
        // now set the git application metadata, with the default application id
        assert rootApp != null;
        rootApp.setGitApplicationMetadata(createGitApplicationMetaData(
                rootApp.getId(), defaultBranchBeforeChange, defaultBranchBeforeChange, getGitAuth()));

        List<Application> applicationList = new ArrayList<>();
        applicationList.add(rootApp);

        // create 2 applications, one with branch=bracnh1, another with branch=branch2. default branch=main
        for (int i = 1; i <= 2; i++) {
            GitApplicationMetadata gitApplicationMetadata =
                    createGitApplicationMetaData(rootApp.getId(), "branch" + i, defaultBranchBeforeChange, null);
            Application application = createApplicationWithGitMetaData(workspaceId, "App" + i, gitApplicationMetadata);
            application.setPolicies(rootApp.getPolicies());
            applicationList.add(application);
        }

        // save all the applications
        Mono<String> applicationListMono = applicationRepository
                .saveAll(applicationList)
                .then(gitService.setDefaultBranch(rootApp.getId(), defaultBranchAfterChange));

        StepVerifier.create(applicationListMono)
                .verifyErrorMessage(AppsmithError.NO_RESOURCE_FOUND.getMessage(
                        FieldName.APPLICATION, rootApp.getId() + "," + defaultBranchAfterChange));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void setDefaultBranch_WhenFeatureFlagIsOff_UnsupportedExceptionThrown() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_audit_logs_enabled)))
                .thenReturn(Mono.just(FALSE));

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_git_branch_protection_enabled)))
                .thenReturn(Mono.just(FALSE));

        StepVerifier.create(gitService.setDefaultBranch("abcd", "anyname"))
                .verifyErrorMessage(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
    }

    private void testDefaultBranchAfterListBranch(
            String localDefaultBranch, String remoteDefaultBranch, String expectedDefaultBranch) {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_audit_logs_enabled)))
                .thenReturn(Mono.just(FALSE));

        // mock the gitExecutor.getRemoteDefaultBranch so that it'll return value of remoteDefaultBranch
        Mockito.when(gitExecutor.getRemoteDefaultBranch(any(Path.class), anyString(), anyString(), anyString()))
                .thenReturn(Mono.just(remoteDefaultBranch));

        // mock the gitExecutor.createAndCheckoutToBranch so that it'll return value of remoteDefaultBranch
        Mockito.when(gitExecutor.createAndCheckoutToBranch(any(Path.class), anyString()))
                .thenReturn(Mono.just(remoteDefaultBranch));

        Mockito.when(gitExecutor.fetchRemote(
                        any(Path.class), anyString(), anyString(), anyBoolean(), anyString(), anyBoolean()))
                .thenReturn(Mono.just("success"));

        GitBranchDTO gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName(localDefaultBranch);
        Mockito.when(gitExecutor.listBranches(any(Path.class))).thenReturn(Mono.just(List.of(gitBranchDTO)));

        // create two real applications with default branch name=main
        Workspace workspace = new Workspace();
        workspace.setName(UUID.randomUUID().toString());
        String workspaceId =
                workspaceService.create(workspace).map(Workspace::getId).block();

        // create the root application
        Application rootApp = applicationPageService
                .createApplication(createApplicationWithGitMetaData(workspaceId, "rootApp", null))
                .block();
        assert rootApp != null;
        rootApp.setGitApplicationMetadata(
                createGitApplicationMetaData(rootApp.getId(), localDefaultBranch, localDefaultBranch, getGitAuth()));

        List<Application> applicationList = new ArrayList<>();
        applicationList.add(rootApp);

        // create 1 more application, with branch=remoteDefaultBranch
        for (int i = 1; i <= 1; i++) {
            GitApplicationMetadata gitApplicationMetadata =
                    createGitApplicationMetaData(rootApp.getId(), remoteDefaultBranch, localDefaultBranch, null);
            Application application = createApplicationWithGitMetaData(workspaceId, "App" + i, gitApplicationMetadata);
            application.setPolicies(rootApp.getPolicies());
            applicationList.add(application);
        }

        // save all the applications
        Mono<List<Application>> applicationListMono = applicationRepository
                .saveAll(applicationList)
                .then(gitService.listBranchForApplication(rootApp.getId(), true, localDefaultBranch))
                .thenMany(applicationRepository.findByWorkspaceId(workspaceId))
                .collectList();

        StepVerifier.create(applicationListMono)
                .assertNext(applications -> {
                    assertThat(applications.size()).isEqualTo(2);
                    applications.forEach(application -> {
                        GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                        assert application.getId() != null;
                        if (application.getId().equals(rootApp.getId())) {
                            assertThat(application.getGitApplicationMetadata().getGitAuth())
                                    .isNotNull();
                        }
                        assertThat(gitApplicationMetadata.getDefaultBranchName())
                                .isEqualTo(expectedDefaultBranch);
                        assertThat(gitApplicationMetadata.getBranchName()).isNotNull();
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void listBranchForApplication_WhenFeatureFlagOn_DefaultBranchIsNotUpdatedFromRemote() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_git_branch_protection_enabled)))
                .thenReturn(Mono.just(TRUE));
        testDefaultBranchAfterListBranch("main", "develop", "main");
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void listBranchForApplication_WhenFeatureFlagOff_DefaultBranchIsUpdatedFromRemote() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_git_branch_protection_enabled)))
                .thenReturn(Mono.just(FALSE));
        testDefaultBranchAfterListBranch("main", "develop", "develop");
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void listBranchForApplication_WhenPruneIsFalse_DefaultBranchIsNotUpdatedFromRemote() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_git_branch_protection_enabled)))
                .thenReturn(Mono.just(TRUE));
        testDefaultBranchAfterListBranch("main", "develop", "main");
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void protectBranch_WhenPermissionDoesNotExist_Fails() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_git_branch_protection_enabled)))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_audit_logs_enabled)))
                .thenReturn(Mono.just(FALSE));

        Workspace workspace = new Workspace();
        workspace.setName(UUID.randomUUID().toString());
        String limitPrivateRepoTestWorkspaceId =
                workspaceService.create(workspace).map(Workspace::getId).block();

        // create the root application
        Application rootApp = applicationPageService
                .createApplication(createApplicationWithGitMetaData(limitPrivateRepoTestWorkspaceId, "rootApp", null))
                .block();

        // remove permission from the application
        Set<Policy> newPoliciesWithoutPermission = rootApp.getPolicies().stream()
                .filter(policy -> !policy.getPermission()
                        .equals(applicationPermission
                                .getManageProtectedBranchPermission()
                                .getValue()))
                .collect(Collectors.toSet());
        rootApp.setPolicies(newPoliciesWithoutPermission);
        rootApp = applicationRepository.save(rootApp).block();

        StepVerifier.create(gitService.updateProtectedBranches(rootApp.getId(), List.of("master")))
                .expectErrorMessage(
                        AppsmithError.ACL_NO_RESOURCE_FOUND.getMessage(FieldName.APPLICATION, rootApp.getId()))
                .verify();
    }

    /**
     * This method will create n number of applications with the given branch list where n = branchList.size()
     * The first branch in the list will be set as default branch.
     * It'll return the default application id for all the created branches.
     *
     * @param branchList List of branches to create
     * @return Default application id
     */
    private String createBranchedApplication(List<String> branchList) {
        String appName = "App" + UUID.randomUUID();
        String defaultAppId = null, defaultBranchName = null;

        for (String s : branchList) {
            Application testApplication = new Application();
            testApplication.setName(appName);
            testApplication.setWorkspaceId(workspaceId);
            Application createdApp =
                    applicationPageService.createApplication(testApplication).block();
            assert createdApp != null;

            if (defaultAppId == null) { // set the first app id as default app id
                defaultAppId = createdApp.getId();
                defaultBranchName = s;
            }

            // set the git app meta data
            GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
            gitApplicationMetadata.setBranchName(s);
            gitApplicationMetadata.setDefaultBranchName(defaultBranchName);
            gitApplicationMetadata.setDefaultApplicationId(defaultAppId);
            gitApplicationMetadata.setRepoName("repo-name");
            createdApp.setGitApplicationMetadata(gitApplicationMetadata);

            applicationRepository.save(createdApp).block();
        }
        return defaultAppId;
    }

    @Test
    @WithUserDetails("api_user")
    public void updateProtectedBranches_WhenListContainsOnlyDefaultBranch_Success() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_git_branch_protection_enabled)))
                .thenReturn(Mono.just(TRUE));

        List<String> branchList = List.of("master", "develop", "feature");
        // create three app with master as the default branch
        String defaultAppId = createBranchedApplication(branchList);
        Flux<Application> applicationFlux = gitService
                .updateProtectedBranches(defaultAppId, List.of("develop", "feature"))
                .thenMany(applicationService.findAllApplicationsByDefaultApplicationId(
                        defaultAppId, applicationPermission.getEditPermission()));

        StepVerifier.create(applicationFlux.collectList())
                .assertNext(applicationList -> {
                    assertThat(applicationList.size()).isEqualTo(branchList.size());

                    for (Application application : applicationList) {
                        GitApplicationMetadata metadata = application.getGitApplicationMetadata();
                        assertThat(metadata.getDefaultBranchName()).isEqualTo("master");
                        // "develop" and "feature" branches should be protected
                        assertThat(!metadata.getBranchName().equals("master"))
                                .isEqualTo(metadata.getIsProtectedBranch());
                        if (application.getId().equals(defaultAppId)) {
                            // the default app should have the protected branch list
                            assertThat(metadata.getBranchProtectionRules()).containsExactly("develop", "feature");
                        }
                    }
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void getProtectedBranches_WhenDowngradedUserHasMultipleBranchProtected_ReturnsEmptyOrDefaultBranchOnly() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_git_branch_protection_enabled)))
                .thenReturn(Mono.just(FALSE));

        Application testApplication = new Application();
        testApplication.setName("App" + UUID.randomUUID());
        testApplication.setWorkspaceId(workspaceId);

        Mono<Application> applicationMono = applicationPageService
                .createApplication(testApplication)
                .flatMap(application -> {
                    GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
                    gitApplicationMetadata.setDefaultApplicationId(application.getId());
                    gitApplicationMetadata.setDefaultBranchName("master");
                    // include default branch in the list of the protected branches
                    gitApplicationMetadata.setBranchProtectionRules(List.of("master", "develop"));
                    application.setGitApplicationMetadata(gitApplicationMetadata);
                    return applicationRepository.save(application);
                })
                .cache();

        Mono<List<String>> branchListMonoWithDefaultBranch =
                applicationMono.flatMap(application -> gitService.getProtectedBranches(application.getId()));

        StepVerifier.create(branchListMonoWithDefaultBranch)
                .assertNext(branchList -> {
                    assertThat(branchList).containsExactly("master");
                })
                .verifyComplete();

        Mono<List<String>> branchListMonoWithoutDefaultBranch = applicationMono
                .flatMap(application -> {
                    GitApplicationMetadata gitApplicationMetadata = application.getGitApplicationMetadata();
                    // remove the default branch from the protected branches
                    gitApplicationMetadata.setBranchProtectionRules(List.of("develop", "feature"));
                    return applicationRepository.save(application);
                })
                .flatMap(application -> gitService.getProtectedBranches(application.getId()));

        StepVerifier.create(branchListMonoWithoutDefaultBranch)
                .assertNext(branchList -> {
                    assertThat(branchList).isNullOrEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void updateProtectedBranches_WhenListContainsMultipleBranches_Success() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_git_branch_protection_enabled)))
                .thenReturn(Mono.just(TRUE));

        List<String> branchList = List.of("master", "develop", "feature", "staging");
        // create four app with master as the default branch
        String defaultAppId = createBranchedApplication(branchList);

        Mono<Application> applicationMono = applicationRepository
                .findById(defaultAppId)
                .flatMap(application -> {
                    // initially setting develop and staging as protected
                    application.getGitApplicationMetadata().setBranchProtectionRules(List.of("develop", "staging"));
                    return applicationRepository.save(application).map(Application::getId);
                })
                // let's remove develop from protected and set master, feature and staging as new protected branches
                .then(gitService.updateProtectedBranches(defaultAppId, List.of("master", "feature", "staging")))
                .then(applicationService.findById(defaultAppId, applicationPermission.getEditPermission()));

        StepVerifier.create(applicationMono)
                .assertNext(application -> {
                    GitApplicationMetadata metadata = application.getGitApplicationMetadata();
                    // the root app should have the protected branch list
                    assertThat(metadata.getBranchProtectionRules()).containsExactly("master", "feature", "staging");

                    // master & feature branches added as protected, GIT_ADD_PROTECTED_BRANCH event should be sent twice
                    verify(analyticsService, times(2))
                            .sendEvent(eq(GIT_ADD_PROTECTED_BRANCH.getEventName()), anyString(), anyMap());
                    // develop branch removed from protected, GIT_REMOVE_PROTECTED_BRANCH event should be sent once
                    verify(analyticsService, times(1))
                            .sendEvent(eq(GIT_REMOVE_PROTECTED_BRANCH.getEventName()), anyString(), anyMap());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void generateBearerTokenForApplication_WhenFeatureFlagOff_ThrowsError() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_git_continuous_delivery_enabled)))
                .thenReturn(Mono.just(FALSE));

        StepVerifier.create(gitService.generateBearerTokenForApplication("dummy-id"))
                .verifyErrorMessage(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
    }

    @Test
    @WithUserDetails("api_user")
    public void generateBearerTokenForApplication_ApplicationExists_BotUserAdded() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_audit_logs_enabled)))
                .thenReturn(Mono.just(FALSE));

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_git_continuous_delivery_enabled)))
                .thenReturn(Mono.just(TRUE));

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_gac_enabled)))
                .thenReturn(Mono.just(TRUE));

        // create git connected applications
        List<String> branches = List.of("main", "develop");
        final String defaultApplicationId = createBranchedApplication(branches);

        /*
        Things to verify:
        1. Bot user is created
        2. Permission group is created for the bot user for the default application id
        3. Each branched application has the manage application permission allowed to this permission group
        */

        Mono<Tuple2<List<PermissionGroup>, List<Application>>> tuple2Mono = gitService
                .generateBearerTokenForApplication(defaultApplicationId)
                .then(userRepository.findByEmail(GitUtils.generateGitBotUserEmail(defaultApplicationId)))
                .flatMapMany(botUser -> permissionGroupRepository.findAllByAssignedToUserIdsIn(Set.of(botUser.getId())))
                .collectList()
                .zipWhen(ignored -> applicationService
                        .findAllApplicationsByDefaultApplicationId(
                                defaultApplicationId, applicationPermission.getEditPermission())
                        .collectList());

        StepVerifier.create(tuple2Mono)
                .assertNext(objects -> {
                    List<Application> applications = objects.getT2();
                    List<PermissionGroup> permissionGroups = objects.getT1();
                    PermissionGroup permissionGroup = permissionGroups.get(0);
                    assertThat(applications.size()).isEqualTo(branches.size());
                    assertThat(permissionGroups.size()).isEqualTo(1);

                    for (Application application : applications) {
                        Optional<Policy> optionalPolicy = application.getPolicies().stream()
                                .filter(policy -> policy.getPermission()
                                        .equals(applicationPermission
                                                .getEditPermission()
                                                .getValue()))
                                .findFirst();
                        assertThat(optionalPolicy.isPresent()).isTrue();
                        Policy policy = optionalPolicy.get();
                        assertThat(policy.getPermissionGroups()).contains(permissionGroup.getId());
                    }
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void configureAutoDeployment_WhenFeatureFlagIsOff_ThrowsError() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_git_continuous_delivery_enabled)))
                .thenReturn(Mono.just(FALSE));

        StepVerifier.create(gitService.configureAutoDeployment("dummy-id", "branch", true))
                .verifyErrorMessage(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
    }

    @Test
    @WithUserDetails("api_user")
    public void configureAutoDeployment_WhenBranchNotFound_ThrowsError() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_git_continuous_delivery_enabled)))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_audit_logs_enabled)))
                .thenReturn(Mono.just(FALSE));

        // create git connected applications
        List<String> branches = List.of("main", "develop");
        final String defaultApplicationId = createBranchedApplication(branches);

        StepVerifier.create(gitService.configureAutoDeployment(defaultApplicationId, "release", true))
                .verifyErrorMessage(AppsmithError.NO_RESOURCE_FOUND.getMessage(
                        FieldName.APPLICATION, defaultApplicationId + "," + "release"));
    }

    @Test
    @WithUserDetails("api_user")
    public void configureAutoDeployment_WhenNoConfigExists_NewConfigAdded() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_git_continuous_delivery_enabled)))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_audit_logs_enabled)))
                .thenReturn(Mono.just(FALSE));

        // create git connected applications
        List<String> branches = List.of("main", "develop");
        final String defaultApplicationId = createBranchedApplication(branches);
        Mono<Application> applicationMono = gitService
                .configureAutoDeployment(defaultApplicationId, "develop", true)
                .then(applicationService.findById(defaultApplicationId));

        StepVerifier.create(applicationMono)
                .assertNext(application -> {
                    assertThat(application.getGitApplicationMetadata()).isNotNull();
                    Set<AutoDeployment> autoDeployments =
                            application.getGitApplicationMetadata().getAutoDeploymentConfigs();
                    assertThat(autoDeployments.size()).isEqualTo(1);
                    AutoDeployment autoDeployment = new AutoDeployment();
                    autoDeployment.setBranchName("develop");
                    assertThat(autoDeployments).containsExactly(autoDeployment);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void configureAutoDeployment_WhenConfigAlreadyExists_NewConfigAdded() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_git_continuous_delivery_enabled)))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_audit_logs_enabled)))
                .thenReturn(Mono.just(FALSE));

        // create git connected applications
        List<String> branches = List.of("main", "develop", "release");
        final String defaultApplicationId = createBranchedApplication(branches);
        Mono<Application> applicationMono = gitService
                .configureAutoDeployment(defaultApplicationId, "develop", true)
                // add develop twice
                .then(gitService.configureAutoDeployment(defaultApplicationId, "develop", true))
                .then(gitService.configureAutoDeployment(defaultApplicationId, "main", true))
                .then(gitService.configureAutoDeployment(defaultApplicationId, "release", true))
                .then(gitService.configureAutoDeployment(defaultApplicationId, "develop", false))
                .then(applicationService.findById(defaultApplicationId));

        StepVerifier.create(applicationMono)
                .assertNext(application -> {
                    assertThat(application.getGitApplicationMetadata()).isNotNull();
                    Set<AutoDeployment> autoDeployments =
                            application.getGitApplicationMetadata().getAutoDeploymentConfigs();
                    assertThat(autoDeployments.size()).isEqualTo(2);
                    AutoDeployment autoDeploymentForMain = new AutoDeployment();
                    autoDeploymentForMain.setBranchName("main");

                    AutoDeployment autoDeploymentForRelease = new AutoDeployment();
                    autoDeploymentForRelease.setBranchName("release");
                    assertThat(autoDeployments).contains(autoDeploymentForMain, autoDeploymentForRelease);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void autoDeployGitApplication_WhenFeatureFlagIsOff_ThrowsError() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_git_continuous_delivery_enabled)))
                .thenReturn(Mono.just(FALSE));

        StepVerifier.create(gitService.autoDeployGitApplication("dummy-id", "branch"))
                .verifyErrorMessage(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
    }

    @Test
    @WithUserDetails("api_user")
    public void autoDeployGitApplication_WhenConfigDoesNotExist_ThrowsError() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_git_continuous_delivery_enabled)))
                .thenReturn(Mono.just(TRUE));

        String defaultAppId = createBranchedApplication(List.of("main", "develop"));
        StepVerifier.create(gitService.autoDeployGitApplication(defaultAppId, "develop"))
                .verifyErrorMessage(AppsmithError.INVALID_GIT_CONFIGURATION.getMessage(
                        ERROR_AUTO_DEPLOYMENT_NOT_CONFIGURED + "develop"));
    }

    @Test
    @WithUserDetails("api_user")
    public void autoDeployGitApplication_WhenConfigDoesNotExistForProvidedBranch_ThrowsError() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_git_continuous_delivery_enabled)))
                .thenReturn(Mono.just(TRUE));

        String defaultAppId = createBranchedApplication(List.of("main", "develop"));

        Mono<GitDeployApplicationResultDTO> resultDTOMono = applicationRepository
                .findById(defaultAppId)
                .flatMap(application -> {
                    application.getGitApplicationMetadata().setAutoDeploymentConfigs(new HashSet<>());
                    AutoDeployment autoDeployment = new AutoDeployment();
                    autoDeployment.setBranchName("develop");
                    application
                            .getGitApplicationMetadata()
                            .getAutoDeploymentConfigs()
                            .add(autoDeployment);
                    return applicationRepository.save(application);
                })
                .then(gitService.autoDeployGitApplication(defaultAppId, "main"));

        StepVerifier.create(resultDTOMono)
                .verifyErrorMessage(AppsmithError.INVALID_GIT_CONFIGURATION.getMessage(
                        ERROR_AUTO_DEPLOYMENT_NOT_CONFIGURED + "main"));
    }

    @Test
    @WithUserDetails("api_user")
    public void autoDeployGitApplication_WhenConfigExistsForTargetBranch_ApplicationPulledAndDeployed() {
        String defaultAppId = createBranchedApplication(List.of("main"));
        Application rootApplication =
                applicationRepository.findById(defaultAppId).block();

        ApplicationJson applicationJson = new ApplicationJson();

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_git_continuous_delivery_enabled)))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(gitExecutor.rebaseBranch(any(Path.class), eq("main"))).thenReturn(Mono.just(TRUE));
        Mockito.when(gitFileUtils.reconstructApplicationJsonFromGitRepoWithAnalytics(
                        anyString(), anyString(), anyString(), anyString()))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(importApplicationService.importApplicationInWorkspaceFromGit(
                        anyString(), any(ApplicationJson.class), anyString(), anyString()))
                .thenReturn(Mono.just(rootApplication));

        Mono<Application> resultDTOMono = applicationRepository
                .findById(defaultAppId)
                .flatMap(application -> {
                    application.getGitApplicationMetadata().setAutoDeploymentConfigs(new HashSet<>());
                    AutoDeployment autoDeployment = new AutoDeployment();
                    autoDeployment.setBranchName("main");
                    application
                            .getGitApplicationMetadata()
                            .getAutoDeploymentConfigs()
                            .add(autoDeployment);
                    return applicationRepository.save(application);
                })
                .flatMap(application -> {
                    assertThat(application.getPages().size()).isEqualTo(1);
                    assertThat(application.getPublishedPages().size()).isEqualTo(1);
                    return applicationPageService
                            .clonePage(application.getPages().get(0).getId())
                            .thenReturn(application);
                })
                .then(gitService.autoDeployGitApplication(defaultAppId, "main"))
                .then(applicationRepository.findById(defaultAppId));

        StepVerifier.create(resultDTOMono)
                .assertNext(application -> {
                    assertThat(application.getPages().size()).isEqualTo(2);
                    assertThat(application.getPublishedPages().size()).isEqualTo(2);
                })
                .verifyComplete();
    }
}
