package com.appsmith.server.git.ops;

import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.external.git.handler.FSGitHandler;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.git.central.CentralGitService;
import com.appsmith.server.git.central.GitHandlingService;
import com.appsmith.server.git.central.GitType;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.lang.StringUtils;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class GitDiscardTests {

    @Autowired
    CentralGitService centralGitService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    UserService userService;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    JsonSchemaMigration jsonSchemaMigration;

    @SpyBean
    FSGitHandler fsGitHandler;

    @SpyBean
    CommonGitFileUtils commonGitFileUtils;

    @SpyBean
    GitHandlingService gitHandlingService;

    @SpyBean
    PluginExecutorHelper pluginExecutorHelper;

    private Application createApplicationConnectedToGit(String name, String branchName, String workspaceId)
            throws IOException {

        Mockito.doReturn(Mono.just(new MockPluginExecutor()))
                .when(pluginExecutorHelper)
                .getPluginExecutor(any());

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
                .saveArtifactToLocalRepoNew(any(Path.class), any(), Mockito.anyString());

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

    private Mono<? extends ArtifactExchangeJson> createArtifactJson(String filePath) throws IOException {

        ClassPathResource classPathResource = new ClassPathResource(filePath);

        String artifactJson = classPathResource.getContentAsString(Charset.defaultCharset());

        Class<? extends ArtifactExchangeJson> exchangeJsonType = ApplicationJson.class;

        ArtifactExchangeJson artifactExchangeJson =
                objectMapper.copy().disable(MapperFeature.USE_ANNOTATIONS).readValue(artifactJson, exchangeJsonType);

        return jsonSchemaMigration.migrateArtifactExchangeJsonToLatestSchema(artifactExchangeJson, null, null, null);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void discardChanges_whenUpstreamChangesAvailable_discardsSuccessfully() throws IOException {
        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("Workspace_" + UUID.randomUUID());
        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        assertThat(workspace).isNotNull();

        Application application =
                createApplicationConnectedToGit("discard-changes", "discard-change-branch", workspace.getId());
        MergeStatusDTO mergeStatusDTO = new MergeStatusDTO();
        mergeStatusDTO.setStatus("2 commits pulled");
        mergeStatusDTO.setMergeAble(true);

        ArtifactExchangeJson artifactExchangeJson = createArtifactJson(
                        "test_assets/ImportExportServiceTest/valid-application-without-action-collection.json")
                .block();
        ((Application) artifactExchangeJson.getArtifact()).setName("discardChangesAvailable");

        GitStatusDTO gitStatusDTO = new GitStatusDTO();
        gitStatusDTO.setAheadCount(2);
        gitStatusDTO.setBehindCount(0);
        gitStatusDTO.setIsClean(true);

        Mockito.doReturn(Mono.just(Paths.get("path")))
                .when(commonGitFileUtils)
                .saveArtifactToLocalRepoNew(any(Path.class), any(), Mockito.anyString());
        Mockito.doReturn(Mono.just(artifactExchangeJson))
                .when(gitHandlingService)
                .recreateArtifactJsonFromLastCommit(Mockito.any());
        Mockito.doReturn(Mono.just(true)).when(fsGitHandler).rebaseBranch(any(Path.class), Mockito.anyString());

        Mono<Application> applicationMono = centralGitService
                .discardChanges(application.getId(), ArtifactType.APPLICATION, GitType.FILE_SYSTEM)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .assertNext(application1 -> {
                    assertThat(application1.getPages()).isNotEqualTo(application.getPages());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void discardChanges_whenCancelledMidway_discardsSuccessfully() throws IOException, GitAPIException {
        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("Workspace_" + UUID.randomUUID());
        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        assertThat(workspace).isNotNull();

        Application application = createApplicationConnectedToGit(
                "discard-changes-midway", "discard-change-midway-branch", workspace.getId());
        MergeStatusDTO mergeStatusDTO = new MergeStatusDTO();
        mergeStatusDTO.setStatus("Nothing to fetch from remote. All changes are upto date.");
        mergeStatusDTO.setMergeAble(true);

        ArtifactExchangeJson artifactExchangeJson = createArtifactJson(
                        "test_assets/ImportExportServiceTest/valid-application-without-action-collection.json")
                .block();
        ((Application) artifactExchangeJson.getArtifact()).setName("discard-changes-midway");

        GitStatusDTO gitStatusDTO = new GitStatusDTO();
        gitStatusDTO.setAheadCount(0);
        gitStatusDTO.setBehindCount(0);
        gitStatusDTO.setIsClean(true);

        Mockito.doReturn(Mono.just(Paths.get("path")))
                .when(commonGitFileUtils)
                .saveArtifactToLocalRepoNew(any(Path.class), any(), Mockito.anyString());
        Mockito.doReturn(Mono.just(artifactExchangeJson))
                .when(gitHandlingService)
                .recreateArtifactJsonFromLastCommit(Mockito.any());
        Mockito.doReturn(Mono.just(mergeStatusDTO))
                .when(fsGitHandler)
                .pullApplication(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString());
        Mockito.doReturn(Mono.just(gitStatusDTO)).when(fsGitHandler).getStatus(any(Path.class), Mockito.anyString());
        Mockito.doReturn(Mono.just("fetched"))
                .when(fsGitHandler)
                .fetchRemote(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        eq(true),
                        Mockito.anyString(),
                        Mockito.anyBoolean());

        centralGitService
                .discardChanges(application.getId(), ArtifactType.APPLICATION, GitType.FILE_SYSTEM)
                .map(artifact -> (Application) artifact)
                .timeout(Duration.ofNanos(100))
                .subscribe();

        // Wait for git clone to complete
        Mono<Application> applicationFromDbMono = Mono.just(application).flatMap(application1 -> {
            try {
                // Before fetching the git connected application, sleep for 5 seconds to ensure that the clone
                // completes
                Thread.sleep(5000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return applicationService.getById(application1.getId());
        });

        StepVerifier.create(applicationFromDbMono)
                .assertNext(application1 -> {
                    assertThat(application1).isNotEqualTo(application);
                })
                .verifyComplete();
    }
}
