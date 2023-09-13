package com.appsmith.server.services;

import com.appsmith.external.git.GitExecutor;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.GitCloudServicesUtils;
import com.appsmith.server.helpers.GitFileUtils;
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
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.UUID;

import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class GitServiceTest {

    @Autowired
    WorkspaceService workspaceService;

    @MockBean
    GitExecutor gitExecutor;

    @MockBean
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

    private static final GitProfile testUserProfile = new GitProfile();

    @BeforeEach
    public void setup() throws IOException, GitAPIException {

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_git_unlimited_repo_enabled)))
                .thenReturn(Mono.just(TRUE));
        testUserProfile.setAuthorEmail("test@email.com");
        testUserProfile.setAuthorName("testUser");
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
        Mockito.when(gitExecutor.cloneApplication(
                        Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitExecutor.commitApplication(
                        Mockito.any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("commit"));
        Mockito.when(gitExecutor.checkoutToBranch(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(
                        Mockito.any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString()))
                .thenReturn(Mono.just("success"));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class)))
                .thenReturn(Mono.just(true));
        Mockito.when(gitFileUtils.initializeReadme(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));
        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(
                        Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
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

        Mockito.when(gitCloudServicesUtils.getPrivateRepoLimitForOrg(Mockito.anyString(), Mockito.anyBoolean()))
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

        Mockito.when(gitCloudServicesUtils.getPrivateRepoLimitForOrg(Mockito.anyString(), Mockito.anyBoolean()))
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
        Mockito.when(gitCloudServicesUtils.getPrivateRepoLimitForOrg(Mockito.anyString(), Mockito.anyBoolean()))
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
        Mockito.when(gitCloudServicesUtils.getPrivateRepoLimitForOrg(Mockito.anyString(), Mockito.anyBoolean()))
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
}
