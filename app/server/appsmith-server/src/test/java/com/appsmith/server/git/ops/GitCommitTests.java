package com.appsmith.server.git.ops;

import com.appsmith.external.git.handler.FSGitHandler;
import com.appsmith.git.dto.CommitDTO;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.git.central.CentralGitService;
import com.appsmith.server.git.central.GitType;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import org.apache.commons.lang.StringUtils;
import org.eclipse.jgit.api.errors.EmptyCommitException;
import org.eclipse.jgit.errors.RepositoryNotFoundException;
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
import java.util.UUID;

import static com.appsmith.external.git.constants.GitConstants.EMPTY_COMMIT_ERROR_MESSAGE;
import static com.appsmith.external.git.constants.GitConstants.GIT_CONFIG_ERROR;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;

@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class GitCommitTests {

    @Autowired
    CentralGitService centralGitService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    UserService userService;

    @SpyBean
    FSGitHandler fsGitHandler;

    @SpyBean
    CommonGitFileUtils commonGitFileUtils;

    @Test
    @WithUserDetails(value = "api_user")
    public void commitArtifact_whenNoChangesInLocal_returnsWithEmptyCommitMessage() throws IOException {

        CommitDTO commitDTO = new CommitDTO();
        commitDTO.setMessage("empty commit");

        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("Workspace_" + UUID.randomUUID());
        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        assertThat(workspace).isNotNull();

        Application application =
                createApplicationConnectedToGit("Application_" + UUID.randomUUID(), "foo", workspace.getId());

        Mockito.doReturn(Mono.just(Paths.get("")))
                .when(commonGitFileUtils)
                .saveArtifactToLocalRepoWithAnalytics(any(Path.class), any(), Mockito.anyString());
        Mockito.doReturn(Mono.error(new EmptyCommitException("nothing to commit")))
                .when(fsGitHandler)
                .commitArtifact(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean());

        Mono<String> commitMono = centralGitService.commitArtifact(
                commitDTO, application.getId(), ArtifactType.APPLICATION, GitType.FILE_SYSTEM);

        StepVerifier.create(commitMono)
                .assertNext(commitMsg -> {
                    assertThat(commitMsg).contains(EMPTY_COMMIT_ERROR_MESSAGE);
                })
                .verifyComplete();
    }

    private Application createApplicationConnectedToGit(String name, String branchName, String workspaceId)
            throws IOException {

        if (StringUtils.isEmpty(branchName)) {
            branchName = "foo";
        }
        Mockito.doReturn(Mono.just(branchName))
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
                .pushApplication(any(Path.class), any(), any(), any(), any());
        Mockito.doReturn(Mono.just(true)).when(commonGitFileUtils).checkIfDirectoryIsEmpty(any(Path.class));
        Mockito.doReturn(Mono.just(Paths.get("textPath")))
                .when(commonGitFileUtils)
                .initializeReadme(any(Path.class), Mockito.anyString(), Mockito.anyString());
        Mockito.doReturn(Mono.just(Paths.get("path")))
                .when(commonGitFileUtils)
                .saveArtifactToLocalRepoWithAnalytics(any(Path.class), any(), Mockito.anyString());

        Application testApplication = new Application();
        testApplication.setName(name);
        testApplication.setWorkspaceId(workspaceId);
        Application application1 =
                applicationPageService.createApplication(testApplication).block();

        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitArtifactMetadata.setGitAuth(gitAuth);
        gitArtifactMetadata.setDefaultApplicationId(application1.getId());
        gitArtifactMetadata.setRepoName("testRepo");
        application1.setGitApplicationMetadata(gitArtifactMetadata);
        application1 = applicationService.save(application1).block();

        PageDTO page = new PageDTO();
        page.setName("New Page");
        page.setApplicationId(application1.getId());
        applicationPageService.createPage(page).block();

        GitProfile gitProfile = new GitProfile();
        gitProfile.setAuthorEmail("test@email.com");
        gitProfile.setAuthorName("testUser");
        GitConnectDTO gitConnectDTO = new GitConnectDTO();
        gitConnectDTO.setRemoteUrl("git@github.com:test/testRepo.git");
        gitConnectDTO.setGitProfile(gitProfile);
        return centralGitService
                .connectArtifactToGit(
                        application1.getId(), ArtifactType.APPLICATION, gitConnectDTO, "baseUrl", GitType.FILE_SYSTEM)
                .map(artifact -> (Application) artifact)
                .block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void commitArtifact_whenApplicationNotConnectedToGit_throwsInvalidGitConfigException() {

        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("Workspace_" + UUID.randomUUID());
        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        assertThat(workspace).isNotNull();

        Application application = new Application();
        application.setName("sampleAppNotConnectedToGit");
        application.setWorkspaceId(workspace.getId());
        application.setId(null);
        application = applicationPageService.createApplication(application).block();

        CommitDTO commitDTO = new CommitDTO();
        commitDTO.setMessage("empty commit");

        Mono<String> commitMono = centralGitService.commitArtifact(
                commitDTO, application.getId(), ArtifactType.APPLICATION, GitType.FILE_SYSTEM);

        StepVerifier.create(commitMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.INVALID_GIT_CONFIGURATION.getMessage(GIT_CONFIG_ERROR)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void commitArtifact_whenLocalRepoNotAvailable_throwsRepoNotFoundException() throws IOException {

        CommitDTO commitDTO = new CommitDTO();
        commitDTO.setMessage("empty commit");

        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("Workspace_" + UUID.randomUUID());
        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        assertThat(workspace).isNotNull();

        Application application =
                createApplicationConnectedToGit("Application_" + UUID.randomUUID(), "foo", workspace.getId());

        Mono<String> commitMono = centralGitService.commitArtifact(
                commitDTO, application.getId(), ArtifactType.APPLICATION, GitType.FILE_SYSTEM);

        Mockito.doReturn(Mono.error(new RepositoryNotFoundException(AppsmithError.REPOSITORY_NOT_FOUND.getMessage())))
                .when(commonGitFileUtils)
                .saveArtifactToLocalRepoWithAnalytics(any(Path.class), any(), Mockito.anyString());

        StepVerifier.create(commitMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .contains(AppsmithError.REPOSITORY_NOT_FOUND.getMessage(application.getId())))
                .verify();
    }
}
