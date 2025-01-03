package com.appsmith.server.git.ops;

import com.appsmith.external.git.handler.FSGitHandler;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.git.central.CentralGitService;
import com.appsmith.server.git.central.GitHandlingService;
import com.appsmith.server.git.central.GitType;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.GitCloudServicesUtils;
import com.appsmith.server.repositories.cakes.ApplicationRepositoryCake;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;

@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class GitConnectTests {

    @Autowired
    CentralGitService centralGitService;

    @Autowired
    ApplicationPermission applicationPermission;

    @Autowired
    UserService userService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    ApplicationRepositoryCake applicationRepository;

    @Autowired
    WorkspaceService workspaceService;

    @SpyBean
    FSGitHandler fsGitHandler;

    @SpyBean
    CommonGitFileUtils commonGitFileUtils;

    @SpyBean
    GitCloudServicesUtils gitCloudServicesUtils;

    @SpyBean
    GitHandlingService gitHandlingService;

    @Test
    @WithUserDetails(value = "api_user")
    public void connectArtifactToGit_withEmptyRemoteUrl_throwsInvalidParameterException() {

        GitConnectDTO gitConnectDTO = new GitConnectDTO();
        gitConnectDTO.setRemoteUrl(null);
        gitConnectDTO.setGitProfile(new GitProfile());
        Mono<Application> applicationMono = centralGitService
                .connectArtifactToGit("testID", gitConnectDTO, "baseUrl", ArtifactType.APPLICATION, GitType.FILE_SYSTEM)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorSatisfies(throwable -> {
                    assertThat(throwable).isInstanceOf(AppsmithException.class);
                    assertThat(throwable)
                            .message()
                            .containsAnyOf(
                                    AppsmithError.INVALID_PARAMETER.getMessage("browserSupportedRemoteUrl"),
                                    AppsmithError.INVALID_PARAMETER.getMessage("remoteUrl"));
                })
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectArtifactToGit_withEmptyOriginHeader_throwsInvalidParameterException() {

        GitConnectDTO gitConnectDTO = new GitConnectDTO();
        gitConnectDTO.setRemoteUrl("git@github.com:test/testRepo.git");
        gitConnectDTO.setGitProfile(new GitProfile());

        Mono<Application> applicationMono = centralGitService
                .connectArtifactToGit("testID", gitConnectDTO, null, ArtifactType.APPLICATION, GitType.FILE_SYSTEM)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage("origin")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectArtifactToGit_whenConnectingMorePrivateReposThanSupported_throwsException() {
        Workspace workspace = new Workspace();
        workspace.setName("Limit Private Repo Test Workspace");
        String limitPrivateRepoTestWorkspaceId =
                workspaceService.create(workspace).map(Workspace::getId).block();

        Mockito.doReturn(Mono.just(0))
                .when(gitCloudServicesUtils)
                .getPrivateRepoLimitForOrg(Mockito.anyString(), Mockito.anyBoolean());

        Application testApplication = new Application();
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl("docUrl");
        gitArtifactMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        testApplication.setName("connectArtifactToGit_WithNonEmptyPublishedPages");
        testApplication.setWorkspaceId(limitPrivateRepoTestWorkspaceId);
        Application application =
                applicationPageService.createApplication(testApplication).block();

        GitProfile gitProfile = new GitProfile();
        gitProfile.setAuthorEmail("test@email.com");
        gitProfile.setAuthorName("testUser");
        GitConnectDTO gitConnectDTO = new GitConnectDTO();
        gitConnectDTO.setRemoteUrl("git@github.com:test/testRepo.git");
        gitConnectDTO.setGitProfile(gitProfile);
        Mono<Application> applicationMono = centralGitService
                .connectArtifactToGit(
                        application.getId(), gitConnectDTO, "baseUrl", ArtifactType.APPLICATION, GitType.FILE_SYSTEM)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(error -> error instanceof AppsmithException
                        && error.getMessage().equals(AppsmithError.GIT_APPLICATION_LIMIT_ERROR.getMessage()))
                .verify();
    }

    @WithUserDetails("api_user")
    @Test
    public void connectArtifactToGit_whenUserDoesNotHaveRequiredPermission_operationFails() {
        Application application =
                createApplicationAndRemovePermissionFromApplication(applicationPermission.getGitConnectPermission());

        GitConnectDTO gitConnectDTO = new GitConnectDTO();
        gitConnectDTO.setRemoteUrl("git@github.com:test/testRepo.git");
        gitConnectDTO.setGitProfile(new GitProfile());
        Mono<Application> applicationMono = centralGitService
                .connectArtifactToGit(
                        application.getId(), gitConnectDTO, "baseUrl", ArtifactType.APPLICATION, GitType.FILE_SYSTEM)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMessage(
                        AppsmithError.ACL_NO_RESOURCE_FOUND.getMessage(FieldName.APPLICATION, application.getId()))
                .verify();
    }

    /**
     * This method creates a workspace, creates an application in the workspace and removes the
     * create application permission from the workspace for the api_user.
     *
     * @return Created Application
     */
    private Application createApplicationAndRemovePermissionFromApplication(AclPermission permission) {
        User apiUser = userService.findByEmail("api_user").block();

        Workspace toCreate = new Workspace();
        toCreate.setName("Workspace_" + UUID.randomUUID());
        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        assertThat(workspace).isNotNull();

        Application testApplication = new Application();
        testApplication.setWorkspaceId(workspace.getId());
        testApplication.setName("Test App");
        Application application1 =
                applicationPageService.createApplication(testApplication).block();

        assertThat(application1).isNotNull();

        // remove permission from the application for the api user
        application1.getPolicyMap().remove(permission.getValue());

        return applicationRepository.save(application1).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectArtifactToGit_whenCloneOperationFails_throwsGitException() {

        Mockito.doReturn(Mono.error(new Exception("error message")))
                .when(fsGitHandler)
                .cloneRemoteIntoArtifactRepo(any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString());
        Mockito.doReturn(Mono.just(true)).when(commonGitFileUtils).deleteLocalRepo(any(Path.class));

        GitConnectDTO gitConnectDTO = new GitConnectDTO();
        gitConnectDTO.setRemoteUrl("git@github.com:test/testRepo.git");
        GitProfile testUserProfile = new GitProfile();
        testUserProfile.setAuthorEmail("test@email.com");
        testUserProfile.setAuthorName("testUser");
        gitConnectDTO.setGitProfile(testUserProfile);

        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("Workspace_" + UUID.randomUUID());
        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        assertThat(workspace).isNotNull();

        // Create application
        Application testApplication = new Application();
        testApplication.setWorkspaceId(workspace.getId());
        testApplication.setName("Test App");
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitArtifactMetadata.setGitAuth(gitAuth);
        gitArtifactMetadata.setDefaultApplicationId(testApplication.getId());
        gitArtifactMetadata.setRepoName("testRepo");
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        Application application1 =
                applicationPageService.createApplication(testApplication).block();

        assertThat(application1).isNotNull();

        Mono<Application> applicationMono = centralGitService
                .connectArtifactToGit(
                        application1.getId(), gitConnectDTO, "baseUrl", ArtifactType.APPLICATION, GitType.FILE_SYSTEM)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.GIT_ACTION_FAILED.getMessage("clone", "error message")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectArtifactToGit_whenUsingGlobalProfile_completesSuccessfully() throws IOException {

        Mockito.doReturn(Mono.just("defaultBranchName"))
                .when(fsGitHandler)
                .cloneRemoteIntoArtifactRepo(any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString());
        Mockito.doReturn(Mono.just("commit"))
                .when(fsGitHandler)
                .commitArtifact(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean());
        Mockito.doReturn(Mono.just(true)).when(fsGitHandler).checkoutToBranch(any(Path.class), Mockito.anyString());
        Mockito.doReturn(Mono.just("success"))
                .when(fsGitHandler)
                .pushApplication(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString());
        Mockito.doReturn(Mono.just(Paths.get("")))
                .when(commonGitFileUtils)
                .saveArtifactToLocalRepoWithAnalytics(any(Path.class), any(), Mockito.anyString());
        Mockito.doReturn(Mono.just(true)).when(commonGitFileUtils).checkIfDirectoryIsEmpty(any(Path.class));
        Mockito.doReturn(Mono.just(Paths.get("textPath")))
                .when(commonGitFileUtils)
                .initializeReadme(any(Path.class), Mockito.anyString(), Mockito.anyString());
        Mockito.doReturn(Mono.just(true)).when(commonGitFileUtils).deleteLocalRepo(any(Path.class));

        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("Workspace_" + UUID.randomUUID());
        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        assertThat(workspace).isNotNull();

        GitProfile gitProfile = new GitProfile();
        gitProfile.setAuthorName(null);
        gitProfile.setAuthorEmail(null);
        gitProfile.setUseGlobalProfile(true);
        Application testApplication = new Application();
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitArtifactMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        testApplication.setName("emptyDefaultProfileConnectTest");
        testApplication.setWorkspaceId(workspace.getId());
        Application application1 =
                applicationPageService.createApplication(testApplication).block();
        assertThat(application1).isNotNull();

        GitConnectDTO gitConnectDTO = new GitConnectDTO();
        gitConnectDTO.setRemoteUrl("git@github.com:test/testRepo.git");
        gitConnectDTO.setGitProfile(gitProfile);
        Mono<Application> applicationMono = centralGitService
                .connectArtifactToGit(
                        application1.getId(), gitConnectDTO, "baseUrl", ArtifactType.APPLICATION, GitType.FILE_SYSTEM)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .assertNext(application -> {
                    GitArtifactMetadata gitArtifactMetadata1 = application.getGitApplicationMetadata();
                    assertThat(gitArtifactMetadata1.getRemoteUrl()).isEqualTo(gitConnectDTO.getRemoteUrl());
                    assertThat(gitArtifactMetadata1.getRefName()).isEqualTo("defaultBranchName");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectArtifactToGit_whenUsingIncompleteLocalProfile_throwsAuthorNameUnavailableError() {
        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("Workspace_" + UUID.randomUUID());
        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        assertThat(workspace).isNotNull();

        GitProfile gitProfile = new GitProfile();
        gitProfile.setAuthorName(null);
        gitProfile.setAuthorEmail(null);
        // Use repo specific git profile but as this is empty default profile will be used as a fallback
        gitProfile.setUseGlobalProfile(false);
        Application testApplication = new Application();
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl("docUrl");
        gitArtifactMetadata.setGitAuth(gitAuth);
        gitArtifactMetadata.setRemoteUrl("git@github.com:test/testRepo.git");
        gitArtifactMetadata.setRefName("defaultBranchNameFromRemote");
        gitArtifactMetadata.setRepoName("testRepo");
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        testApplication.setName("localGitProfile");
        testApplication.setWorkspaceId(workspace.getId());
        Application application1 =
                applicationPageService.createApplication(testApplication).block();
        assertThat(application1).isNotNull();

        GitConnectDTO gitConnectDTO = new GitConnectDTO();
        gitConnectDTO.setRemoteUrl("git@github.com:test/testRepo.git");
        gitConnectDTO.setGitProfile(gitProfile);
        Mono<Application> applicationMono = centralGitService
                .connectArtifactToGit(
                        application1.getId(), gitConnectDTO, "baseUrl", ArtifactType.APPLICATION, GitType.FILE_SYSTEM)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage("Author Name")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectArtifactToGit_whenClonedRepoIsNotEmpty_throwsException() throws IOException {

        Mockito.doReturn(Mono.just("defaultBranchName"))
                .when(fsGitHandler)
                .cloneRemoteIntoArtifactRepo(any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString());
        Mockito.doReturn(Mono.just(false)).when(commonGitFileUtils).checkIfDirectoryIsEmpty(any(Path.class));

        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("Workspace_" + UUID.randomUUID());
        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        assertThat(workspace).isNotNull();

        Application testApplication = new Application();
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitArtifactMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        testApplication.setName("ValidTest TestApp");
        testApplication.setWorkspaceId(workspace.getId());
        Application application1 =
                applicationPageService.createApplication(testApplication).block();
        assertThat(application1).isNotNull();

        GitProfile gitProfile = new GitProfile();
        gitProfile.setAuthorEmail("test@email.com");
        gitProfile.setAuthorName("testUser");
        GitConnectDTO gitConnectDTO = new GitConnectDTO();
        gitConnectDTO.setRemoteUrl("git@github.com:test/testRepo.git");
        gitConnectDTO.setGitProfile(gitProfile);
        Mono<Application> applicationMono = centralGitService
                .connectArtifactToGit(
                        application1.getId(), gitConnectDTO, "baseUrl", ArtifactType.APPLICATION, GitType.FILE_SYSTEM)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_GIT_REPO.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectArtifactToGit_whenDefaultCommitFails_throwsException() throws IOException {

        Mockito.doReturn(Mono.just("defaultBranchName"))
                .when(fsGitHandler)
                .cloneRemoteIntoArtifactRepo(any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString());
        Mockito.doReturn(Mono.just(true)).when(commonGitFileUtils).checkIfDirectoryIsEmpty(any(Path.class));
        Mockito.doReturn(Mono.error(new Exception("default commit error")))
                .when(gitHandlingService)
                .createFirstCommit(Mockito.any(), Mockito.any());

        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("Workspace_" + UUID.randomUUID());
        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        assertThat(workspace).isNotNull();

        Application testApplication = new Application();
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitArtifactMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        testApplication.setName("ValidTest TestApp");
        testApplication.setWorkspaceId(workspace.getId());
        Application application1 =
                applicationPageService.createApplication(testApplication).block();
        assertThat(application1).isNotNull();

        GitProfile gitProfile = new GitProfile();
        gitProfile.setAuthorEmail("test@email.com");
        gitProfile.setAuthorName("testUser");
        GitConnectDTO gitConnectDTO = new GitConnectDTO();
        gitConnectDTO.setRemoteUrl("git@github.com:test/testRepo.git");
        gitConnectDTO.setGitProfile(gitProfile);
        Mono<Application> applicationMono = centralGitService
                .connectArtifactToGit(
                        application1.getId(), gitConnectDTO, "baseUrl", ArtifactType.APPLICATION, GitType.FILE_SYSTEM)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable.getMessage().contains("default commit error"))
                .verify();
    }

    // TODO : write them as templatized integration tests
    //  - commit failed (no write permission perhaps, or protected branch)
    //  - successful connection
    //  - connectArtifactToGit_cancelledMidway_cloneSuccess
}
