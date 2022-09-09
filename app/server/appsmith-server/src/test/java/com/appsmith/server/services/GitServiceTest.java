package com.appsmith.server.services;

import com.appsmith.external.dtos.GitBranchDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.JSValue;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.GitCommitDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitMergeDTO;
import com.appsmith.server.dtos.GitPullDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.GitCloudServicesUtils;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.apache.commons.lang.StringUtils;
import org.assertj.core.api.Assertions;
import org.eclipse.jgit.api.errors.EmptyCommitException;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.errors.RepositoryNotFoundException;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.constants.FieldName.DEFAULT_PAGE_LAYOUT;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class GitServiceTest {

    @Autowired
    GitService gitService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    WorkspaceRepository workspaceRepository;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    LayoutCollectionService layoutCollectionService;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    NewActionService newActionService;

    @Autowired
    ActionCollectionService actionCollectionService;

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    private ThemeService themeService;

    @Autowired
    UserService userService;

    @MockBean
    GitExecutor gitExecutor;

    @MockBean
    GitFileUtils gitFileUtils;

    @MockBean
    GitCloudServicesUtils gitCloudServicesUtils;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    private static String workspaceId;
    private static Application gitConnectedApplication = new Application();
    private static final String DEFAULT_GIT_PROFILE = "default";
    private static final String DEFAULT_BRANCH = "defaultBranchName";
    private static Boolean isSetupDone = false;
    private static GitProfile testUserProfile = new GitProfile();
    private static String filePath = "test_assets/ImportExportServiceTest/valid-application-without-action-collection.json";
    private final static String EMPTY_COMMIT_ERROR_MESSAGE = "On current branch nothing to commit, working tree clean";
    private final static String GIT_CONFIG_ERROR = "Unable to find the git configuration, please configure your application " +
            "with git to use version control service";

    @Before
    public void setup() throws IOException, GitAPIException {

        if (StringUtils.isEmpty(workspaceId)) {

            User apiUser = userService.findByEmail("api_user").block();
            Workspace toCreate = new Workspace();
            toCreate.setName("Git Service Test");

            if (!org.springframework.util.StringUtils.hasLength(workspaceId)) {
                Workspace workspace = workspaceService.create(toCreate, apiUser).block();
                workspaceId = workspace.getId();
            }
        }

        Mockito
                .when(gitCloudServicesUtils.getPrivateRepoLimitForOrg(eq(workspaceId), Mockito.anyBoolean()))
                .thenReturn(Mono.just(-1));

        Mockito
                .when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        if (Boolean.TRUE.equals(isSetupDone)) {
            return;
        }

        gitConnectedApplication = createApplicationConnectedToGit("gitConnectedApplication", DEFAULT_BRANCH);

        testUserProfile.setAuthorEmail("test@email.com");
        testUserProfile.setAuthorName("testUser");
        isSetupDone = true;
    }

    private Mono<ApplicationJson> createAppJson(String filePath) {
        FilePart filePart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils
                .read(
                        new ClassPathResource(filePath),
                        new DefaultDataBufferFactory(),
                        4096)
                .cache();

        Mockito.when(filePart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filePart.headers().getContentType()).thenReturn(MediaType.APPLICATION_JSON);

        Mono<String> stringifiedFile = DataBufferUtils.join(filePart.content())
                .map(dataBuffer -> {
                    byte[] data = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(data);
                    DataBufferUtils.release(dataBuffer);
                    return new String(data);
                });

        return stringifiedFile
                .map(data -> {
                    Gson gson = new Gson();
                    return gson.fromJson(data, ApplicationJson.class);
                })
                .map(JsonSchemaMigration::migrateApplicationToLatestSchema);
    }

    private GitConnectDTO getConnectRequest(String remoteUrl, GitProfile gitProfile) {
        GitConnectDTO gitConnectDTO = new GitConnectDTO();
        gitConnectDTO.setRemoteUrl(remoteUrl);
        gitConnectDTO.setGitProfile(gitProfile);
        return gitConnectDTO;
    }

    private Application createApplicationConnectedToGit(String name, String branchName) throws IOException, GitAPIException {
        return createApplicationConnectedToGit(name, branchName, workspaceId);
    }

    private Application createApplicationConnectedToGit(String name, String branchName, String workspaceId) throws IOException, GitAPIException {

        if (StringUtils.isEmpty(branchName)) {
            branchName = DEFAULT_BRANCH;
        }
        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(branchName));
        Mockito.when(gitExecutor.commitApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("commit"));
        Mockito.when(gitExecutor.checkoutToBranch(Mockito.any(Path.class), Mockito.anyString())).thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(
                Mockito.any(Path.class),
                Mockito.any(),
                Mockito.any(),
                Mockito.any(),
                Mockito.any())
        )
                .thenReturn(Mono.just("success"));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(Mono.just(true));
        Mockito.when(gitFileUtils.initializeReadme(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));
        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("path")));

        Application testApplication = new Application();
        testApplication.setName(name);
        testApplication.setWorkspaceId(workspaceId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        gitApplicationMetadata.setDefaultApplicationId(application1.getId());
        gitApplicationMetadata.setRepoName("testRepo");
        application1.setGitApplicationMetadata(gitApplicationMetadata);
        application1 = applicationService.save(application1).block();

        PageDTO page = new PageDTO();
        page.setName("New Page");
        page.setApplicationId(application1.getId());
        applicationPageService.createPage(page).block();

        String repoUrl = String.format("git@github.com:test/%s.git", name);
        GitConnectDTO gitConnectDTO = getConnectRequest(repoUrl, testUserProfile);
        return gitService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl").block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_EmptyRemoteUrl_ThrowInvalidParameterException() {

        GitConnectDTO gitConnectDTO = getConnectRequest(null, testUserProfile);
        Mono<Application> applicationMono = gitService.connectApplicationToGit("testID", gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage("Remote Url")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_EmptyOriginHeader_ThrowInvalidParameterException() {

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<Application> applicationMono = gitService.connectApplicationToGit("testID", gitConnectDTO, null);

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage("origin")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_InvalidGitApplicationMetadata_ThrowInvalidGitConfigurationException() {

        Application testApplication = new Application();
        testApplication.setGitApplicationMetadata(new GitApplicationMetadata());
        testApplication.setName("InvalidGitApplicationMetadata");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<Application> applicationMono = gitService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> {
                    assertThat(throwable instanceof AppsmithException).isTrue();
                    assertThat(throwable.getMessage())
                            .contains(AppsmithError.INVALID_GIT_SSH_CONFIGURATION.getMessage("origin"));
                    assertThat(((AppsmithException) throwable).getReferenceDoc()).isNotEmpty();
                    return true;
                })
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_EmptyPrivateKey_ThrowInvalidGitConfigurationException() {

        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("publicKey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setName("EmptyPrivateKey");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<Application> applicationMono = gitService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_GIT_SSH_CONFIGURATION.getMessage("origin")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_EmptyPublicKey_ThrowInvalidGitConfigurationException() {

        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPrivateKey("privatekey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setName("EmptyPublicKey");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<Application> applicationMono = gitService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_GIT_SSH_CONFIGURATION.getMessage("origin")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_InvalidRemoteUrl_ThrowInvalidRemoteUrl() throws IOException {

        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("InvalidRemoteUrl");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);

        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(Mono.just(false));

        Mono<Application> applicationMono = gitService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException)
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_InvalidRemoteUrlHttp_ThrowInvalidRemoteUrl() throws ClassCastException {

        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("InvalidRemoteUrlHttp");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("https://github.com/test/testRepo.git", testUserProfile);

        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.error(new ClassCastException("TransportHttp")));
        Mockito.when(gitFileUtils.deleteLocalRepo(Mockito.any(Path.class)))
                .thenReturn(Mono.just(true));

        Mono<Application> applicationMono = gitService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException && throwable.getMessage().equals(AppsmithError.INVALID_GIT_SSH_URL.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_InvalidFilePath_ThrowIOException() throws IOException {

        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenThrow(new IOException("Error while accessing the file system"));

        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("InvalidFilePath");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testy.git", testUserProfile);
        Mono<Application> applicationMono = gitService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains("Error while accessing the file system"))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_ClonedRepoNotEmpty_Failure() throws IOException {

        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(Mono.just(false));

        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("ValidTest TestApp");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testy.git", testUserProfile);
        Mono<Application> applicationMono = gitService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_GIT_REPO.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_cloneException_throwGitException() throws IOException {

        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.error(new Exception("error message")));
        Mockito.when(gitFileUtils.deleteLocalRepo(Mockito.any(Path.class)))
                .thenReturn(Mono.just(true));

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<Application> applicationMono = gitService.connectApplicationToGit(gitConnectedApplication.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().equals(AppsmithError.GIT_GENERIC_ERROR.getMessage("error message")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_WithEmptyPublishedPages_CloneSuccess() throws IOException, GitAPIException {

        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitExecutor.commitApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("commit"));
        Mockito.when(gitExecutor.checkoutToBranch(Mockito.any(Path.class), Mockito.anyString())).thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(),
                Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("success"));
        Mockito.when(gitExecutor.commitApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(),
                Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyBoolean())).thenReturn(Mono.just("commit"));
        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(Mono.just(true));
        Mockito.when(gitFileUtils.initializeReadme(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));

        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("validData_WithEmptyPublishedPages");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<Application> applicationMono = gitService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .assertNext(application -> {
                    GitApplicationMetadata gitApplicationMetadata1 = application.getGitApplicationMetadata();
                    assertThat(gitApplicationMetadata1.getRemoteUrl()).isEqualTo(gitConnectDTO.getRemoteUrl());
                    assertThat(gitApplicationMetadata1.getBranchName()).isEqualTo("defaultBranchName");
                    assertThat(gitApplicationMetadata1.getGitAuth().getPrivateKey()).isNotNull();
                    assertThat(gitApplicationMetadata1.getGitAuth().getPublicKey()).isNotNull();
                    assertThat(gitApplicationMetadata1.getGitAuth().getGeneratedAt()).isNotNull();
                    assertThat(gitApplicationMetadata1.getRepoName()).isEqualTo("testRepo");
                    assertThat(gitApplicationMetadata1.getDefaultApplicationId()).isEqualTo(application.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_WithoutGitProfileUsingDefaultProfile_CloneSuccess() throws IOException, GitAPIException {

        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitExecutor.commitApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("commit"));
        Mockito.when(gitExecutor.checkoutToBranch(Mockito.any(Path.class), Mockito.anyString())).thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(),
                Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("success"));
        Mockito.when(gitExecutor.commitApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(),
                Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyBoolean())).thenReturn(Mono.just("commit"));
        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(Mono.just(true));
        Mockito.when(gitFileUtils.initializeReadme(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));
        Mockito.when(gitFileUtils.deleteLocalRepo(Mockito.any(Path.class)))
                .thenReturn(Mono.just(true));

        GitProfile gitProfile = new GitProfile();
        gitProfile.setAuthorName(null);
        gitProfile.setAuthorEmail(null);
        gitProfile.setUseGlobalProfile(true);
        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("emptyDefaultProfileConnectTest");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", gitProfile);
        Mono<Application> applicationMono = gitService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .assertNext(application -> {
                    GitApplicationMetadata gitApplicationMetadata1 = application.getGitApplicationMetadata();
                    assertThat(gitApplicationMetadata1.getRemoteUrl()).isEqualTo(gitConnectDTO.getRemoteUrl());
                    assertThat(gitApplicationMetadata1.getBranchName()).isEqualTo("defaultBranchName");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_WithoutGitProfileUsingLocalProfile_ThrowAuthorNameUnavailableError() {

        GitProfile gitProfile = new GitProfile();
        gitProfile.setAuthorName(null);
        gitProfile.setAuthorEmail(null);
        // Use repo specific git profile but as this is empty default profile will be used as a fallback
        gitProfile.setUseGlobalProfile(false);
        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl("docUrl");
        gitApplicationMetadata.setGitAuth(gitAuth);
        gitApplicationMetadata.setRemoteUrl("git@github.com:test/testRepo.git");
        gitApplicationMetadata.setBranchName("defaultBranchNameFromRemote");
        gitApplicationMetadata.setRepoName("testRepo");
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("localGitProfile");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", gitProfile);
        Mono<Application> applicationMono = gitService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage("Author Name")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_WithNonEmptyPublishedPages_CloneSuccess() throws IOException, GitAPIException {

        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitExecutor.commitApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("commit"));
        Mockito.when(gitExecutor.checkoutToBranch(Mockito.any(Path.class), Mockito.anyString())).thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(),
                Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("success"));
        Mockito.when(gitExecutor.commitApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(),
                Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyBoolean())).thenReturn(Mono.just("commit"));
        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(Mono.just(true));
        Mockito.when(gitFileUtils.initializeReadme(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));
        Mockito.when(gitFileUtils.deleteLocalRepo(Mockito.any(Path.class)))
                .thenReturn(Mono.just(true));

        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl("docUrl");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("connectApplicationToGit_WithNonEmptyPublishedPages");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        PageDTO page = new PageDTO();
        page.setName("New Page");
        page.setApplicationId(application1.getId());
        applicationPageService.createPage(page).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<Application> applicationMono = gitService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .assertNext(application -> {
                    GitApplicationMetadata gitApplicationMetadata1 = application.getGitApplicationMetadata();
                    assertThat(gitApplicationMetadata1.getRemoteUrl()).isEqualTo(gitConnectDTO.getRemoteUrl());
                    assertThat(gitApplicationMetadata1.getBranchName()).isEqualTo("defaultBranchName");
                    assertThat(gitApplicationMetadata1.getGitAuth().getPrivateKey()).isNotNull();
                    assertThat(gitApplicationMetadata1.getGitAuth().getPublicKey()).isNotNull();
                    assertThat(gitApplicationMetadata1.getGitAuth().getGeneratedAt()).isNotNull();
                    assertThat(gitApplicationMetadata1.getRepoName()).isEqualTo("testRepo");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_moreThanThreePrivateRepos_throwException() throws IOException, GitAPIException {
        Workspace workspace = new Workspace();
        workspace.setName("Limit Private Repo Test Workspace");
        String limitPrivateRepoTestWorkspaceId = workspaceService.create(workspace).map(Workspace::getId).block();

        GitService gitService1 = Mockito.spy(gitService);
        Mockito.doReturn(Mono.just(Boolean.TRUE)).when(gitService1).isRepoLimitReached(Mockito.anyString(), Mockito.anyBoolean());

        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitExecutor.commitApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("commit"));
        Mockito.when(gitExecutor.checkoutToBranch(Mockito.any(Path.class), Mockito.anyString())).thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(),
                Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("success"));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(Mono.just(true));
        Mockito.when(gitFileUtils.initializeReadme(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));

        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl("docUrl");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("connectApplicationToGit_WithNonEmptyPublishedPages");
        testApplication.setWorkspaceId(limitPrivateRepoTestWorkspaceId);
        Application application = applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<Application> applicationMono = gitService1.connectApplicationToGit(application.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(error -> error instanceof AppsmithException
                        && error.getMessage().equals(AppsmithError.GIT_APPLICATION_LIMIT_ERROR.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_toggleAccessibilityToPublicForConnectedApp_connectSuccessful() throws IOException, GitAPIException {
        Workspace workspace = new Workspace();
        workspace.setName("Toggle Accessibility To Public From Private Repo Test Workspace");
        String limitPrivateRepoTestWorkspaceId = workspaceService.create(workspace).map(Workspace::getId).block();

        Mockito
                .when(gitCloudServicesUtils.getPrivateRepoLimitForOrg(eq(limitPrivateRepoTestWorkspaceId), Mockito.anyBoolean()))
                .thenReturn(Mono.just(3));
        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitExecutor.commitApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("commit"));
        Mockito.when(gitExecutor.checkoutToBranch(Mockito.any(Path.class), Mockito.anyString())).thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(),
                Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("success"));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(Mono.just(true));
        Mockito.when(gitFileUtils.initializeReadme(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));

        Application application1 = this.createApplicationConnectedToGit("private_repo_1", "master", limitPrivateRepoTestWorkspaceId);
        this.createApplicationConnectedToGit("private_repo_2", "master", limitPrivateRepoTestWorkspaceId);

        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl("docUrl");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("connectApplicationToGit_WithNonEmptyPublishedPages");
        testApplication.setWorkspaceId(limitPrivateRepoTestWorkspaceId);
        Application application = applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<Application> applicationMono = gitService.connectApplicationToGit(application.getId(), gitConnectDTO, "baseUrl");

        // Use any dummy url so as to get 2xx response
        application1.getGitApplicationMetadata().setBrowserSupportedRemoteUrl("https://www.google.com/");
        applicationService.save(application1).block();

        StepVerifier
                .create(applicationMono)
                .assertNext(connectedApp -> {
                    assertThat(connectedApp.getId()).isNotEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_WithValidCustomGitDomain_CloneSuccess() throws IOException, GitAPIException {

        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitExecutor.commitApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("commit"));
        Mockito.when(gitExecutor.checkoutToBranch(Mockito.any(Path.class), Mockito.anyString())).thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(),
                Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("success"));
        Mockito.when(gitExecutor.commitApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(),
                Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyBoolean())).thenReturn(Mono.just("commit"));
        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(Mono.just(true));
        Mockito.when(gitFileUtils.initializeReadme(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));

        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("connectApplicationToGit_WithValidCustomGitDomain_CloneSuccess");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.test.net:user/test/tests/testRepo.git", testUserProfile);
        Mono<Application> applicationMono = gitService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl");

        StepVerifier
                .create(applicationMono)
                .assertNext(application -> {
                    GitApplicationMetadata gitApplicationMetadata1 = application.getGitApplicationMetadata();
                    assertThat(gitApplicationMetadata1.getRemoteUrl()).isEqualTo(gitConnectDTO.getRemoteUrl());
                    assertThat(gitApplicationMetadata1.getBranchName()).isEqualTo("defaultBranchName");
                    assertThat(gitApplicationMetadata1.getGitAuth().getPrivateKey()).isNotNull();
                    assertThat(gitApplicationMetadata1.getGitAuth().getPublicKey()).isNotNull();
                    assertThat(gitApplicationMetadata1.getGitAuth().getGeneratedAt()).isNotNull();
                    assertThat(gitApplicationMetadata1.getRepoName()).isEqualTo("testRepo");
                    assertThat(gitApplicationMetadata1.getDefaultApplicationId()).isEqualTo(application.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateGitMetadata_EmptyData_Success() {
        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl("docUrl");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("updateGitMetadata_EmptyData_Success");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 = applicationPageService.createApplication(testApplication).block();
        GitApplicationMetadata gitApplicationMetadata1 = null;

        Mono<Application> applicationMono = gitService.updateGitMetadata(application1.getId(), gitApplicationMetadata1);

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().contains("Git metadata values cannot be null"))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateGitMetadata_validData_Success() {
        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl("docUrl");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("updateGitMetadata_EmptyData_Success1");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 = applicationPageService.createApplication(testApplication).block();
        GitApplicationMetadata gitApplicationMetadata1 = application1.getGitApplicationMetadata();
        gitApplicationMetadata1.setRemoteUrl("https://test/.git");

        Mono<Application> applicationMono = gitService.updateGitMetadata(application1.getId(), gitApplicationMetadata1);

        StepVerifier
                .create(applicationMono)
                .assertNext(application -> {
                    assertThat(application.getGitApplicationMetadata()).isNotNull();
                    assertThat(application.getGitApplicationMetadata().getRemoteUrl()).isEqualTo("https://test/.git");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void detachRemote_applicationWithActionAndActionCollection_Success() {
        List<GitBranchDTO> branchList = new ArrayList<>();
        GitBranchDTO gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName("defaultBranch");
        branchList.add(gitBranchDTO);

        GitBranchDTO remoteGitBranchDTO = new GitBranchDTO();
        remoteGitBranchDTO.setBranchName("origin/defaultBranch");
        branchList.add(remoteGitBranchDTO);

        Mockito.when(gitExecutor.listBranches(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), eq(false)))
                .thenReturn(Mono.just(branchList));
        Mockito.when(gitFileUtils.deleteLocalRepo(Mockito.any(Path.class))).thenReturn(Mono.just(true));
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl("docUrl");
        gitApplicationMetadata.setRemoteUrl("test.com");
        gitApplicationMetadata.setGitAuth(gitAuth);
        gitApplicationMetadata.setRepoName("repoName");
        gitApplicationMetadata.setDefaultApplicationId("TestId");
        gitApplicationMetadata.setDefaultBranchName("defaultBranchFromRemote");
        gitApplicationMetadata.setBranchName("defaultBranch");
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("detachRemote_validData");
        testApplication.setWorkspaceId(workspaceId);

        Mono<Application> applicationMono = applicationPageService.createApplication(testApplication)
                .flatMap(application -> {
                    // Update the defaultIds for resources to mock merge action from other branch
                    application.getPages().forEach(page -> page.setDefaultPageId(page.getId() + "randomId"));
                    return Mono.zip(
                            applicationService.save(application),
                            pluginRepository.findByPackageName("installed-plugin"),
                            newPageService.findPageById(application.getPages().get(0).getId(), READ_PAGES, false)
                    );
                })
                .flatMap(tuple -> {

                    Application application = tuple.getT1();
                    PageDTO testPage = tuple.getT3();

                    // Save action
                    Datasource datasource = new Datasource();
                    datasource.setName("Default Database");
                    datasource.setWorkspaceId(application.getWorkspaceId());
                    datasource.setPluginId(tuple.getT2().getId());
                    datasource.setDatasourceConfiguration(new DatasourceConfiguration());

                    ActionDTO action = new ActionDTO();
                    action.setName("onPageLoadAction");
                    action.setPageId(application.getPages().get(0).getId());
                    action.setExecuteOnLoad(true);
                    ActionConfiguration actionConfiguration = new ActionConfiguration();
                    actionConfiguration.setHttpMethod(HttpMethod.GET);
                    action.setActionConfiguration(actionConfiguration);
                    action.setDatasource(datasource);

                    DefaultResources branchedResources = new DefaultResources();
                    branchedResources.setActionId("branchedActionId");
                    branchedResources.setApplicationId("branchedAppId");
                    branchedResources.setPageId("branchedPageId");
                    branchedResources.setCollectionId("branchedCollectionId");
                    branchedResources.setBranchName("testBranch");
                    action.setDefaultResources(branchedResources);

                    ObjectMapper objectMapper = new ObjectMapper();
                    JSONObject parentDsl = null;
                    try {
                        parentDsl = new JSONObject(objectMapper.readValue(DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {
                        }));
                    } catch (JsonProcessingException e) {
                        log.debug(String.valueOf(e));
                    }

                    ArrayList children = (ArrayList) parentDsl.get("children");
                    JSONObject testWidget = new JSONObject();
                    testWidget.put("widgetName", "firstWidget");
                    JSONArray temp = new JSONArray();
                    temp.addAll(List.of(new JSONObject(Map.of("key", "testField"))));
                    testWidget.put("dynamicBindingPathList", temp);
                    testWidget.put("testField", "{{ onPageLoadAction.data }}");
                    children.add(testWidget);

                    Layout layout = testPage.getLayouts().get(0);
                    layout.setDsl(parentDsl);

                    // Save actionCollection
                    ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
                    actionCollectionDTO.setName("testCollection1");
                    actionCollectionDTO.setPageId(application.getPages().get(0).getId());
                    actionCollectionDTO.setApplicationId(application.getId());
                    actionCollectionDTO.setWorkspaceId(application.getWorkspaceId());
                    actionCollectionDTO.setPluginId(datasource.getPluginId());
                    actionCollectionDTO.setVariables(List.of(new JSValue("test", "String", "test", true)));
                    actionCollectionDTO.setBody("collectionBody");
                    ActionDTO action1 = new ActionDTO();
                    action1.setName("testAction1");
                    action1.setActionConfiguration(new ActionConfiguration());
                    action1.getActionConfiguration().setBody("mockBody");
                    actionCollectionDTO.setActions(List.of(action1));
                    actionCollectionDTO.setPluginType(PluginType.JS);
                    actionCollectionDTO.setDefaultResources(branchedResources);
                    actionCollectionDTO.setDefaultToBranchedActionIdsMap(Map.of("branchedId", "collectionId"));

                    return Mono.zip(
                            layoutActionService.createSingleAction(action)
                                    .then(layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout)),
                            layoutCollectionService.createCollection(actionCollectionDTO)
                    )
                            .map(tuple2 -> application);
                });

        Mono<Application> resultMono = applicationMono
                .flatMap(application -> gitService.detachRemote(application.getId()));

        StepVerifier
                .create(resultMono.zipWhen(application -> Mono.zip(
                        newActionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                        actionCollectionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                        newPageService.findNewPagesByApplicationId(application.getId(), READ_PAGES).collectList()
                )))
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    List<NewAction> actionList = tuple.getT2().getT1();
                    List<ActionCollection> actionCollectionList = tuple.getT2().getT2();
                    List<NewPage> pageList = tuple.getT2().getT3();

                    assertThat(application.getGitApplicationMetadata()).isNull();
                    application.getPages().forEach(page -> assertThat(page.getDefaultPageId()).isEqualTo(page.getId()));
                    application.getPublishedPages().forEach(page -> assertThat(page.getDefaultPageId()).isEqualTo(page.getId()));

                    assertThat(pageList).isNotNull();
                    pageList.forEach(newPage -> {
                        assertThat(newPage.getDefaultResources()).isNotNull();
                        assertThat(newPage.getDefaultResources().getPageId()).isEqualTo(newPage.getId());
                        assertThat(newPage.getDefaultResources().getApplicationId()).isEqualTo(application.getId());
                        assertThat(newPage.getDefaultResources().getBranchName()).isNullOrEmpty();

                        newPage.getUnpublishedPage()
                                .getLayouts()
                                .forEach(layout ->
                                        layout.getLayoutOnLoadActions().forEach(dslActionDTOS -> {
                                            dslActionDTOS.forEach(actionDTO -> {
                                                Assertions.assertThat(actionDTO.getId()).isEqualTo(actionDTO.getDefaultActionId());
                                            });
                                        })
                                );
                    });

                    assertThat(actionList).hasSize(2);
                    actionList.forEach(newAction -> {
                        assertThat(newAction.getDefaultResources()).isNotNull();
                        assertThat(newAction.getDefaultResources().getActionId()).isEqualTo(newAction.getId());
                        assertThat(newAction.getDefaultResources().getApplicationId()).isEqualTo(application.getId());
                        assertThat(newAction.getDefaultResources().getBranchName()).isNullOrEmpty();

                        ActionDTO action = newAction.getUnpublishedAction();
                        assertThat(action.getDefaultResources()).isNotNull();
                        assertThat(action.getDefaultResources().getPageId()).isEqualTo(application.getPages().get(0).getId());
                        if (!StringUtils.isEmpty(action.getDefaultResources().getCollectionId())) {
                            assertThat(action.getDefaultResources().getCollectionId()).isEqualTo(action.getCollectionId());
                        }
                    });

                    assertThat(actionCollectionList).hasSize(1);
                    actionCollectionList.forEach(actionCollection -> {
                        assertThat(actionCollection.getDefaultResources()).isNotNull();
                        assertThat(actionCollection.getDefaultResources().getCollectionId()).isEqualTo(actionCollection.getId());
                        assertThat(actionCollection.getDefaultResources().getApplicationId()).isEqualTo(application.getId());
                        assertThat(actionCollection.getDefaultResources().getBranchName()).isNullOrEmpty();

                        ActionCollectionDTO unpublishedCollection = actionCollection.getUnpublishedCollection();

                        assertThat(unpublishedCollection.getDefaultToBranchedActionIdsMap())
                                .hasSize(1);
                        unpublishedCollection.getDefaultToBranchedActionIdsMap().keySet()
                                .forEach(key ->
                                        assertThat(key).isEqualTo(unpublishedCollection.getDefaultToBranchedActionIdsMap().get(key))
                                );

                        assertThat(unpublishedCollection.getDefaultResources()).isNotNull();
                        assertThat(unpublishedCollection.getDefaultResources().getPageId())
                                .isEqualTo(application.getPages().get(0).getId());
                    });

                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void detachRemote_EmptyGitData_NoChange() {
        Application testApplication = new Application();
        testApplication.setGitApplicationMetadata(null);
        testApplication.setName("detachRemote_EmptyGitData");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        Mono<Application> applicationMono = gitService.detachRemote(application1.getId());

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException & throwable.getMessage().contains("Git configuration is invalid"))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void listBranchForApplication_emptyGitMetadata_throwError() {

        Application testApplication = new Application();
        testApplication.setGitApplicationMetadata(null);
        testApplication.setName("validData_WithNonEmptyPublishedPages");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        Mono<List<GitBranchDTO>> listMono = gitService.listBranchForApplication(application1.getId(), false, "defaultBranch");

        StepVerifier
                .create(listMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_GIT_CONFIGURATION.getMessage(GIT_CONFIG_ERROR)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void listBranchForApplication_applicationWithInvalidGitConfig_throwError() throws IOException {

        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(Mono.just(true));
        Mockito.when(gitFileUtils.initializeReadme(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));

        Application testApplication = new Application();
        testApplication.setGitApplicationMetadata(null);
        testApplication.setName("listBranchForApplication_GitFailure_ThrowError");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        Mono<List<GitBranchDTO>> listMono = gitService.listBranchForApplication(application1.getId(), false, "defaultBranch");

        StepVerifier
                .create(listMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_GIT_CONFIGURATION.getMessage(GIT_CONFIG_ERROR)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void listBranchForApplication_defaultBranchNotChangesInRemote_Success() throws IOException, GitAPIException {
        List<GitBranchDTO> branchList = new ArrayList<>();
        GitBranchDTO gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName("defaultBranch");
        gitBranchDTO.setDefault(true);
        branchList.add(gitBranchDTO);
        gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName("origin/defaultBranch");
        gitBranchDTO.setDefault(false);
        branchList.add(gitBranchDTO);

        Mockito.when(gitExecutor.listBranches(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), eq(true)))
                .thenReturn(Mono.just(branchList));
        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranch"));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(Mono.just(true));
        Mockito.when(gitFileUtils.initializeReadme(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));
        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), eq(false), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("status"));

        Application application1 = createApplicationConnectedToGit("listBranchForApplication_pruneBranchNoChangesInRemote_Success", "defaultBranch");

        Mono<List<GitBranchDTO>> listMono = gitService.listBranchForApplication(application1.getId(), true, "defaultBranch");

        StepVerifier
                .create(listMono)
                .assertNext(listBranch -> {
                    assertThat(listBranch).isEqualTo(branchList);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void listBranchForApplication_defaultBranchChangesInRemoteExistsInDB_Success() throws IOException, GitAPIException {
        List<GitBranchDTO> branchList = new ArrayList<>();
        GitBranchDTO gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName("defaultBranch");
        gitBranchDTO.setDefault(false);
        branchList.add(gitBranchDTO);
        gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName("feature1");
        gitBranchDTO.setDefault(true);
        branchList.add(gitBranchDTO);
        gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName("origin/defaultBranch");
        gitBranchDTO.setDefault(false);
        branchList.add(gitBranchDTO);
        gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName("origin/feature1");
        gitBranchDTO.setDefault(false);
        branchList.add(gitBranchDTO);

        Mockito.when(gitExecutor.listBranches(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), eq(true)))
                .thenReturn(Mono.just(branchList));
        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranch"));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(Mono.just(true));
        Mockito.when(gitFileUtils.initializeReadme(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));
        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), eq(false), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("status"));
        Mockito.when(gitExecutor.deleteBranch(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));

        Application application1 = createApplicationConnectedToGit("listBranchForApplication_pruneBranchWithBranchNotExistsInDB_Success", "defaultBranch");
        // Create branch
        Application application2 = createApplicationConnectedToGit("listBranchForApplication_defaultBranchChangesInRemoteExistsInDB_Success",
                "feature1");
        application2.getGitApplicationMetadata().setDefaultApplicationId(application1.getId());
        applicationService.save(application2).block();

        Mono<Application> applicationUpdatedMono = gitService.listBranchForApplication(application1.getId(), true, "defaultBranch")
                .then(applicationService.findById(application1.getId()));

        StepVerifier
                .create(applicationUpdatedMono)
                .assertNext(application -> {
                    assertThat(application.getGitApplicationMetadata().getDefaultBranchName()).isEqualTo("feature1");
                    assertThat(application.getGitApplicationMetadata().getBranchName()).isEqualTo("defaultBranch");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void listBranchForApplication_defaultBranchChangesInRemoteDoesNotExistsInDB_Success() throws IOException, GitAPIException {
        List<GitBranchDTO> branchList = new ArrayList<>();
        GitBranchDTO gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName("defaultBranch");
        gitBranchDTO.setDefault(false);
        branchList.add(gitBranchDTO);
        gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName("feature1");
        gitBranchDTO.setDefault(true);
        branchList.add(gitBranchDTO);
        gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName("origin/defaultBranch");
        gitBranchDTO.setDefault(false);
        branchList.add(gitBranchDTO);
        gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName("origin/feature1");
        gitBranchDTO.setDefault(false);
        branchList.add(gitBranchDTO);

        ApplicationJson applicationJson = createAppJson(filePath).block();

        Mockito.when(gitExecutor.listBranches(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), eq(true)))
                .thenReturn(Mono.just(branchList));
        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranch"));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(Mono.just(true));
        Mockito.when(gitFileUtils.initializeReadme(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));
        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), eq(false), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("status"));
        Mockito.when(gitExecutor.checkoutRemoteBranch(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just("feature1"));
        Mockito.when(gitFileUtils.reconstructApplicationJsonFromGitRepo(Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(applicationJson));

        Application application1 = createApplicationConnectedToGit("listBranchForApplication_defaultBranchChangesInRemoteDoesNotExistsInDB_Success", "defaultBranch");

        Mono<Application> applicationUpdatedMono = gitService.listBranchForApplication(application1.getId(), true, "defaultBranch")
                .then(applicationService.findById(application1.getId()));

        StepVerifier
                .create(applicationUpdatedMono)
                .assertNext(application -> {
                    assertThat(application.getGitApplicationMetadata().getDefaultBranchName()).isEqualTo("feature1");
                    assertThat(application.getGitApplicationMetadata().getBranchName()).isEqualTo("defaultBranch");
                })
                .verifyComplete();

        // Check for the branch application in db with name feature1
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void pullChanges_upstreamChangesAvailable_pullSuccess() throws IOException, GitAPIException {
        Application application = createApplicationConnectedToGit("UpstreamChangesInRemote", "upstreamChangesInRemote");
        MergeStatusDTO mergeStatusDTO = new MergeStatusDTO();
        mergeStatusDTO.setStatus("2 commits pulled");
        mergeStatusDTO.setMergeAble(true);

        ApplicationJson applicationJson = createAppJson(filePath).block();;
        applicationJson.getExportedApplication().setName("upstreamChangesAvailable_pullSuccess");

        GitStatusDTO gitStatusDTO = new GitStatusDTO();
        gitStatusDTO.setAheadCount(2);
        gitStatusDTO.setBehindCount(0);
        gitStatusDTO.setIsClean(true);

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("path")));
        Mockito.when(gitFileUtils.reconstructApplicationJsonFromGitRepo(Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(gitExecutor.pullApplication(
                Mockito.any(Path.class),Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(mergeStatusDTO));
        Mockito.when(gitExecutor.getStatus(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(gitStatusDTO));
        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), eq(true), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetched"));
        Mockito.when(gitExecutor.resetToLastCommit(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));

        Mono<GitPullDTO> applicationMono = gitService.pullApplication(application.getId(), application.getGitApplicationMetadata().getBranchName());

        StepVerifier
                .create(applicationMono)
                .assertNext(gitPullDTO -> {
                    assertThat(gitPullDTO.getMergeStatus().getStatus()).isEqualTo("2 commits pulled");
                    assertThat(gitPullDTO.getApplication()).isNotNull();
                    assertThat(gitPullDTO.getApplication().getId()).isEqualTo(application.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void pullChanges_FileSystemAccessError_throwError() throws IOException, GitAPIException {
        Application application = createApplicationConnectedToGit("FileSystemAccessError", "fileSystemErr");
        MergeStatusDTO mergeStatusDTO = new MergeStatusDTO();
        mergeStatusDTO.setStatus("2 commits pulled");
        mergeStatusDTO.setMergeAble(true);

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenThrow(new IOException("Error accessing the file System"));
        Mockito.when(gitFileUtils.reconstructApplicationJsonFromGitRepo(Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(new ApplicationJson()));
        Mockito.when(gitExecutor.pullApplication(
                Mockito.any(Path.class),Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(mergeStatusDTO));

        Mono<GitPullDTO> applicationMono = gitService.pullApplication(application.getId(), application.getGitApplicationMetadata().getBranchName());

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().contains("Error accessing the file System"))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void pullChanges_noUpstreamChanges_nothingToPullMessage() throws IOException, GitAPIException {
        Application application = createApplicationConnectedToGit("noChangesInRemotePullException", "syncedBranch");

        ApplicationJson applicationJson = createAppJson(filePath).block();

        MergeStatusDTO mergeStatusDTO = new MergeStatusDTO();
        mergeStatusDTO.setStatus("Nothing to fetch from remote. All changes are upto date.");
        mergeStatusDTO.setMergeAble(true);

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitFileUtils.reconstructApplicationJsonFromGitRepo(Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.justOrEmpty(applicationJson));
        Mockito.when(gitExecutor.getStatus(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(new GitStatusDTO()));
        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.pullApplication(
                Mockito.any(Path.class),Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(mergeStatusDTO));
        Mockito.when(gitExecutor.resetToLastCommit(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));

        Mono<GitPullDTO> applicationMono = gitService.pullApplication(application.getId(), application.getGitApplicationMetadata().getBranchName());

        StepVerifier
                .create(applicationMono)
                .assertNext(gitPullDTO -> {
                    assertThat(gitPullDTO.getMergeStatus().getStatus()).isEqualTo("Nothing to fetch from remote. All changes are upto date.");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void isBranchMergeable_nonConflictingChanges_canBeMerged() throws IOException, GitAPIException {

        Application application = createApplicationConnectedToGit("noConflictsApp", "main");
        Application application1 = createApplicationConnectedToGit("noConflictsApp", "branchWithNoConflicts");
        GitApplicationMetadata gitApplicationMetadata = application1.getGitApplicationMetadata();
        gitApplicationMetadata.setDefaultApplicationId(application.getId());
        gitApplicationMetadata.setGitAuth(null);
        application1 = applicationService.save(application1).block();

        GitMergeDTO gitMergeDTO = new GitMergeDTO();
        gitMergeDTO.setSourceBranch(application1.getGitApplicationMetadata().getBranchName());
        gitMergeDTO.setDestinationBranch(application.getGitApplicationMetadata().getBranchName());

        MergeStatusDTO mergeStatus = new MergeStatusDTO();
        mergeStatus.setMergeAble(true);

        GitStatusDTO gitStatusDTO = new GitStatusDTO();
        gitStatusDTO.setAheadCount(0);
        gitStatusDTO.setBehindCount(0);

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.isMergeBranch(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(mergeStatus));
        Mockito.when(gitExecutor.getStatus(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(gitStatusDTO));
        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.resetToLastCommit(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(Boolean.TRUE));
        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));

        Mono<MergeStatusDTO> applicationMono = gitService.isBranchMergeable(application.getId(), gitMergeDTO);

        StepVerifier
                .create(applicationMono)
                .assertNext(s -> assertThat(s.isMergeAble()).isTrue())
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void isBranchMergeable_conflictingChanges_canNotBeMerged() throws IOException, GitAPIException {

        Application application = createApplicationConnectedToGit("conflictingChanges", "branchWithConflicts");

        application.getGitApplicationMetadata().setDefaultApplicationId(gitConnectedApplication.getId());
        applicationService.save(application).block();

        GitMergeDTO gitMergeDTO = new GitMergeDTO();
        gitMergeDTO.setSourceBranch(application.getGitApplicationMetadata().getBranchName());
        gitMergeDTO.setDestinationBranch(DEFAULT_BRANCH);

        MergeStatusDTO mergeStatus = new MergeStatusDTO();
        mergeStatus.setMergeAble(false);

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.isMergeBranch(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(mergeStatus));
        Mockito.when(gitExecutor.getStatus(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(new GitStatusDTO()));
        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.resetToLastCommit(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(Boolean.FALSE));
        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));

        Mono<MergeStatusDTO> applicationMono = gitService.isBranchMergeable(application.getId(), gitMergeDTO);

        StepVerifier
                .create(applicationMono)
                .assertNext(s -> {
                    assertThat(s.isMergeAble()).isFalse();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void isBranchMergeable_remoteAhead_remoteAheadErrorMessage() throws IOException, GitAPIException {

        Application application1 = createApplicationConnectedToGit(gitConnectedApplication.getName(), "upstreamChangesBeforeMerge");
        GitApplicationMetadata gitApplicationMetadata = application1.getGitApplicationMetadata();
        gitApplicationMetadata.setDefaultApplicationId(gitConnectedApplication.getId());
        application1.setGitApplicationMetadata(gitApplicationMetadata);
        applicationService.save(application1).block();

        GitMergeDTO gitMergeDTO = new GitMergeDTO();
        gitMergeDTO.setSourceBranch(application1.getGitApplicationMetadata().getBranchName());
        gitMergeDTO.setDestinationBranch(DEFAULT_BRANCH);

        GitStatusDTO gitStatusDTO = new GitStatusDTO();
        gitStatusDTO.setAheadCount(2);

        MergeStatusDTO mergeStatus = new MergeStatusDTO();
        mergeStatus.setMergeAble(false);

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("path")));
        Mockito.when(gitExecutor.isMergeBranch(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(mergeStatus));
        Mockito.when(gitExecutor.getStatus(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(gitStatusDTO));
        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.resetToLastCommit(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(Boolean.FALSE));
        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));

        Mono<MergeStatusDTO> applicationMono = gitService.isBranchMergeable(gitConnectedApplication.getId(), gitMergeDTO);

        StepVerifier
                .create(applicationMono)
                .assertNext(s -> {
                    assertThat(s.isMergeAble()).isFalse();
                    assertThat(s.getMessage()).contains("Remote is ahead of local");
                })
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void isBranchMergeable_checkMergingWithRemoteBranch_throwsUnsupportedOperationException() {

        GitMergeDTO gitMergeDTO = new GitMergeDTO();
        gitMergeDTO.setSourceBranch("origin/branch2");
        gitMergeDTO.setDestinationBranch("defaultBranch");

        Mono<MergeStatusDTO> applicationMono = gitService.isBranchMergeable(gitConnectedApplication.getId(), gitMergeDTO);

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException && throwable.getMessage().contains("origin/branch2"))
                .verify();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void checkoutRemoteBranch_notPresentInLocal_newApplicationCreated() throws GitAPIException, IOException {

        ApplicationJson applicationJson = createAppJson(filePath).block();

        List<GitBranchDTO> branchList = new ArrayList<>();
        GitBranchDTO gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName("branchInLocal");
        branchList.add(gitBranchDTO);
        gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName("origin/branchInLocal");
        branchList.add(gitBranchDTO);

        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.checkoutRemoteBranch(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just("testBranch"));
        Mockito.when(gitFileUtils.reconstructApplicationJsonFromGitRepo(Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(gitExecutor.listBranches(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(branchList));

        Mono<Application> applicationMono = gitService.checkoutBranch(gitConnectedApplication.getId(), "origin/branchNotInLocal")
                .flatMap(application1 -> applicationService.findByBranchNameAndDefaultApplicationId("branchNotInLocal", gitConnectedApplication.getId(), READ_APPLICATIONS));

        StepVerifier
                .create(applicationMono)
                .assertNext(application1 -> {
                    assertThat(application1.getGitApplicationMetadata().getBranchName()).isEqualTo("branchNotInLocal");
                    assertThat(application1.getGitApplicationMetadata().getDefaultApplicationId()).isEqualTo(gitConnectedApplication.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void checkoutRemoteBranch_presentInLocal_throwError() {

        List<GitBranchDTO> branchList = new ArrayList<>();
        GitBranchDTO gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName("branchInLocal");
        branchList.add(gitBranchDTO);
        gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName("origin/branchInLocal");
        branchList.add(gitBranchDTO);

        Mockito.when(gitExecutor.listBranches(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(branchList));
        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));

        Mono<Application> applicationMono = gitService.checkoutBranch(gitConnectedApplication.getId(), "origin/branchInLocal");

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().equals(AppsmithError.GIT_ACTION_FAILED.getMessage("checkout", "origin/branchInLocal already exists in local - branchInLocal")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void checkoutBranch_branchNotProvided_throwInvalidParameterError() {

        Mono<Application> applicationMono = gitService.checkoutBranch(gitConnectedApplication.getId(), null);

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.BRANCH_NAME)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void commitApplication_noChangesInLocal_emptyCommitMessage() throws GitAPIException, IOException {

        GitCommitDTO commitDTO = new GitCommitDTO();
        commitDTO.setDoPush(false);
        commitDTO.setCommitMessage("empty commit");

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.commitApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyBoolean()))
                .thenReturn(Mono.error(new EmptyCommitException("nothing to commit")));

        Mono<String> commitMono = gitService.commitApplication(commitDTO, gitConnectedApplication.getId(), DEFAULT_BRANCH);

        StepVerifier
                .create(commitMono)
                .assertNext(commitMsg -> {
                    assertThat(commitMsg).contains(EMPTY_COMMIT_ERROR_MESSAGE);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void commitApplication_applicationNotConnectedToGit_throwInvalidGitConfigException() {

        Application application = new Application();
        application.setName("sampleAppNotConnectedToGit");
        application.setWorkspaceId(workspaceId);
        application.setId(null);
        application = applicationPageService.createApplication(application).block();

        GitCommitDTO commitDTO = new GitCommitDTO();
        commitDTO.setDoPush(false);
        commitDTO.setCommitMessage("empty commit");

        Mono<String> commitMono = gitService.commitApplication(commitDTO, application.getId(), DEFAULT_BRANCH);

        StepVerifier
                .create(commitMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().equals(
                        AppsmithError.INVALID_GIT_CONFIGURATION.getMessage(GIT_CONFIG_ERROR))
                )
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void commitApplication_localRepoNotAvailable_throwRepoNotFoundException() throws GitAPIException, IOException {

        GitCommitDTO commitDTO = new GitCommitDTO();
        commitDTO.setDoPush(false);
        commitDTO.setCommitMessage("empty commit");

        Mono<String> commitMono = gitService.commitApplication(commitDTO, gitConnectedApplication.getId(), DEFAULT_BRANCH);

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.error(new RepositoryNotFoundException(AppsmithError.REPOSITORY_NOT_FOUND.getMessage())));

        StepVerifier
                .create(commitMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.REPOSITORY_NOT_FOUND.getMessage(gitConnectedApplication.getId())))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void commitApplication_commitChanges_success() throws GitAPIException, IOException {

        GitCommitDTO commitDTO = new GitCommitDTO();
        commitDTO.setDoPush(false);
        commitDTO.setCommitMessage("commit message");

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.commitApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("sample response for commit"));

        Mono<String> commitMono = gitService.commitApplication(commitDTO, gitConnectedApplication.getId(), DEFAULT_BRANCH);

        StepVerifier
                .create(commitMono)
                .assertNext(commitMsg -> {
                    assertThat(commitMsg).contains("sample response for commit");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void commitAndPushApplication_commitAndPushChanges_success() throws GitAPIException, IOException {

        GitCommitDTO commitDTO = new GitCommitDTO();
        commitDTO.setDoPush(true);
        commitDTO.setCommitMessage("commit message");

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.commitApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("sample response for commit"));
        Mockito.when(gitExecutor.checkoutToBranch(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("pushed successfully"));

        Mono<String> commitAndPushMono = gitService.commitApplication(commitDTO, gitConnectedApplication.getId(), DEFAULT_BRANCH);

        StepVerifier
                .create(commitAndPushMono.zipWhen(status -> applicationService.findByIdAndBranchName(gitConnectedApplication.getId(), DEFAULT_BRANCH)))
                .assertNext(tuple -> {
                    String commitMsg = tuple.getT1();
                    Application application = tuple.getT2();
                    assertThat(commitMsg).contains("sample response for commit");
                    assertThat(commitMsg).contains("pushed successfully");
                    assertThat(application.getClientSchemaVersion()).isEqualTo(JsonSchemaVersions.clientVersion);
                    assertThat(application.getServerSchemaVersion()).isEqualTo(JsonSchemaVersions.serverVersion);
                    assertThat(application.getIsManualUpdate()).isFalse();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void commitAndPushApplication_noChangesToCommitWithLocalCommitsToPush_pushSuccess() throws GitAPIException, IOException {

        GitCommitDTO commitDTO = new GitCommitDTO();
        commitDTO.setDoPush(true);
        commitDTO.setCommitMessage("empty commit");

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.commitApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyBoolean()))
                .thenReturn(Mono.error(new EmptyCommitException("nothing to commit")));
        Mockito.when(gitExecutor.checkoutToBranch(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("pushed successfully"));

        Mono<String> commitAndPushMono = gitService.commitApplication(commitDTO, gitConnectedApplication.getId(), DEFAULT_BRANCH);

        StepVerifier
                .create(commitAndPushMono)
                .assertNext(commitAndPushMsg -> {
                    assertThat(commitAndPushMsg).contains(EMPTY_COMMIT_ERROR_MESSAGE);
                    assertThat(commitAndPushMsg).contains("pushed successfully");
                })
                .verifyComplete();
    }

    /**
     * To verify when a git push fails the application is not deployed
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void commitApplication_pushFails_verifyAppNotPublished_throwUpstreamChangesFoundException() throws GitAPIException, IOException {

        // Create and fetch the application state before adding new page
        Application testApplication = createApplicationConnectedToGit("gitConnectedPushFailApplication", DEFAULT_BRANCH);
        Application preCommitApplication = applicationService.getApplicationByDefaultApplicationIdAndDefaultBranch(testApplication.getId()).block();

        // Creating a new page to commit to git
        PageDTO testPage = new PageDTO();
        testPage.setName("GitServiceTestPageGitPushFail");
        testPage.setApplicationId(preCommitApplication.getId());
        PageDTO createdPage = applicationPageService.createPage(testPage).block();

        GitCommitDTO commitDTO = new GitCommitDTO();
        commitDTO.setDoPush(true);
        commitDTO.setCommitMessage("New page added");
        Mono<String> commitMono = gitService.commitApplication(commitDTO, preCommitApplication.getId(), DEFAULT_BRANCH);

        Mono<Application> committedApplicationMono = applicationService.getApplicationByDefaultApplicationIdAndDefaultBranch(preCommitApplication.getId());

        // Mocking a git push failure
        Mockito.when(gitExecutor.pushApplication(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.error(new AppsmithException(AppsmithError.GIT_UPSTREAM_CHANGES)));

        StepVerifier
                .create(commitMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals((new AppsmithException(AppsmithError.GIT_ACTION_FAILED, "push", AppsmithError.GIT_UPSTREAM_CHANGES.getMessage())).getMessage()))
                .verify();

        StepVerifier
                .create(committedApplicationMono)
                .assertNext(application -> {
                    List<ApplicationPage> publishedPages = application.getPublishedPages();
                    assertThat(application.getPublishedPages().size()).isEqualTo(preCommitApplication.getPublishedPages().size());
                    publishedPages.forEach(publishedPage -> {
                        assertThat(publishedPage.getId().equals(createdPage.getId())).isFalse();
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createBranch_branchWithOriginPrefix_throwUnsupportedException() {

        GitBranchDTO createGitBranchDTO = new GitBranchDTO();
        createGitBranchDTO.setBranchName("origin/createNewBranch");

        Mono<Application> createBranchMono = gitService
                .createBranch(gitConnectedApplication.getId(), createGitBranchDTO, gitConnectedApplication.getGitApplicationMetadata().getBranchName());

        StepVerifier
                .create(createBranchMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException && throwable.getMessage()
                        .contains(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.BRANCH_NAME)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createBranch_duplicateNameBranchPresentInRemote_throwDuplicateKeyException() {

        List<GitBranchDTO> branchList = new ArrayList<>();
        GitBranchDTO gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName("origin/branchInRemote");
        branchList.add(gitBranchDTO);

        GitBranchDTO createGitBranchDTO = new GitBranchDTO();
        createGitBranchDTO.setBranchName("branchInRemote");

        Mockito.when(gitExecutor.checkoutToBranch(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.listBranches(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(branchList));
        Mono<Application> createBranchMono = gitService
                .createBranch(gitConnectedApplication.getId(), createGitBranchDTO, gitConnectedApplication.getGitApplicationMetadata().getBranchName());

        StepVerifier
                .create(createBranchMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException && throwable.getMessage()
                        .contains(AppsmithError.DUPLICATE_KEY_USER_ERROR.getMessage("remotes/origin/" + createGitBranchDTO.getBranchName(), FieldName.BRANCH_NAME)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createBranch_validCreateBranchRequest_newApplicationCreated() throws GitAPIException, IOException {

        GitBranchDTO createGitBranchDTO = new GitBranchDTO();
        createGitBranchDTO.setBranchName("valid_branch");

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);

        Mockito.when(gitExecutor.checkoutToBranch(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.listBranches(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(new ArrayList<>()));
        Mockito.when(gitExecutor.createAndCheckoutToBranch(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(createGitBranchDTO.getBranchName()));
        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.commitApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("System generated commit"));
        Mockito.when(gitExecutor.checkoutToBranch(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("pushed successfully"));

        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(DEFAULT_BRANCH));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(Mono.just(true));
        Mockito.when(gitFileUtils.initializeReadme(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));

        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("validAppWithActionAndActionCollection");
        testApplication.setWorkspaceId(workspaceId);

        Mono<Application> createBranchMono = applicationPageService.createApplication(testApplication)
                .flatMap(application ->
                        Mono.zip(
                                Mono.just(application),
                                pluginRepository.findByPackageName("installed-plugin"),
                                newPageService.findPageById(application.getPages().get(0).getId(), READ_PAGES, false))
                )
                .flatMap(tuple -> {

                    Application application = tuple.getT1();
                    PageDTO testPage = tuple.getT3();

                    // Save action
                    Datasource datasource = new Datasource();
                    datasource.setName("Default Database");
                    datasource.setWorkspaceId(application.getWorkspaceId());
                    datasource.setPluginId(tuple.getT2().getId());
                    datasource.setDatasourceConfiguration(new DatasourceConfiguration());

                    ActionDTO action = new ActionDTO();
                    action.setName("onPageLoadAction");
                    action.setPageId(application.getPages().get(0).getId());
                    action.setExecuteOnLoad(true);
                    ActionConfiguration actionConfiguration = new ActionConfiguration();
                    actionConfiguration.setHttpMethod(HttpMethod.GET);
                    action.setActionConfiguration(actionConfiguration);
                    action.setDatasource(datasource);

                    ObjectMapper objectMapper = new ObjectMapper();
                    JSONObject parentDsl = null;
                    try {
                        parentDsl = new JSONObject(objectMapper.readValue(DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {
                        }));
                    } catch (JsonProcessingException e) {
                        log.debug(String.valueOf(e));
                    }

                    ArrayList children = (ArrayList) parentDsl.get("children");
                    JSONObject testWidget = new JSONObject();
                    testWidget.put("widgetName", "firstWidget");
                    JSONArray temp = new JSONArray();
                    temp.addAll(List.of(new JSONObject(Map.of("key", "testField"))));
                    testWidget.put("dynamicBindingPathList", temp);
                    testWidget.put("testField", "{{ onPageLoadAction.data }}");
                    children.add(testWidget);

                    Layout layout = testPage.getLayouts().get(0);
                    layout.setDsl(parentDsl);

                    // Save actionCollection
                    ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
                    actionCollectionDTO.setName("testCollection1");
                    actionCollectionDTO.setPageId(application.getPages().get(0).getId());
                    actionCollectionDTO.setApplicationId(application.getId());
                    actionCollectionDTO.setWorkspaceId(application.getWorkspaceId());
                    actionCollectionDTO.setPluginId(datasource.getPluginId());
                    actionCollectionDTO.setVariables(List.of(new JSValue("test", "String", "test", true)));
                    actionCollectionDTO.setBody("collectionBody");
                    ActionDTO action1 = new ActionDTO();
                    action1.setName("testAction1");
                    action1.setActionConfiguration(new ActionConfiguration());
                    action1.getActionConfiguration().setBody("mockBody");
                    actionCollectionDTO.setActions(List.of(action1));
                    actionCollectionDTO.setPluginType(PluginType.JS);

                    return Mono.zip(
                            layoutActionService.createSingleActionWithBranch(action, null)
                                    .then(layoutActionService.updateLayout(testPage.getId(), layout.getId(), layout)),
                            layoutCollectionService.createCollection(actionCollectionDTO, null)
                    )
                            .then(gitService.connectApplicationToGit(application.getId(), gitConnectDTO, "origin"));
                })
                .flatMap(application ->
                        gitService
                                .createBranch(application.getId(), createGitBranchDTO, application.getGitApplicationMetadata().getBranchName())
                                .then(applicationService.findByBranchNameAndDefaultApplicationId(createGitBranchDTO.getBranchName(), application.getId(), READ_APPLICATIONS))
                );

        StepVerifier
                .create(createBranchMono.zipWhen(application -> Mono.zip(
                        newActionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                        actionCollectionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                        newPageService.findNewPagesByApplicationId(application.getId(), READ_PAGES).collectList(),
                        applicationService.findById(application.getGitApplicationMetadata().getDefaultApplicationId())
                )))
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    List<NewAction> actionList = tuple.getT2().getT1();
                    List<ActionCollection> actionCollectionList = tuple.getT2().getT2();
                    List<NewPage> pageList = tuple.getT2().getT3();
                    Application parentApplication = tuple.getT2().getT4();

                    GitApplicationMetadata gitData = application.getGitApplicationMetadata();
                    assertThat(application).isNotNull();
                    assertThat(application.getId()).isNotEqualTo(gitData.getDefaultApplicationId());
                    assertThat(gitData.getDefaultApplicationId()).isEqualTo(parentApplication.getId());
                    assertThat(gitData.getBranchName()).isEqualTo(createGitBranchDTO.getBranchName());
                    assertThat(gitData.getDefaultBranchName()).isNotEmpty();
                    assertThat(gitData.getRemoteUrl()).isNotEmpty();
                    assertThat(gitData.getBrowserSupportedRemoteUrl()).isNotEmpty();
                    assertThat(gitData.getRepoName()).isNotEmpty();
                    assertThat(gitData.getGitAuth()).isNull();
                    assertThat(gitData.getIsRepoPrivate()).isNull();

                    application.getPages().forEach(page -> assertThat(page.getDefaultPageId()).isNotEqualTo(page.getId()));
                    application.getPublishedPages().forEach(page -> assertThat(page.getDefaultPageId()).isNotEqualTo(page.getId()));

                    assertThat(pageList).isNotNull();
                    pageList.forEach(newPage -> {
                        assertThat(newPage.getDefaultResources()).isNotNull();
                        assertThat(newPage.getDefaultResources().getPageId()).isNotEqualTo(newPage.getId());
                        assertThat(newPage.getDefaultResources().getApplicationId()).isEqualTo(parentApplication.getId());
                        assertThat(newPage.getDefaultResources().getBranchName()).isEqualTo(createGitBranchDTO.getBranchName());

                        newPage.getUnpublishedPage()
                                .getLayouts()
                                .stream()
                                .filter(layout -> !CollectionUtils.isNullOrEmpty(layout.getLayoutOnLoadActions()))
                                .forEach(layout ->
                                        layout.getLayoutOnLoadActions().forEach(dslActionDTOS -> {
                                            dslActionDTOS.forEach(actionDTO -> {
                                                Assertions.assertThat(actionDTO.getId()).isNotEqualTo(actionDTO.getDefaultActionId());
                                            });
                                        })
                                );
                    });

                    assertThat(actionList).hasSize(2);
                    actionList.forEach(newAction -> {
                        assertThat(newAction.getDefaultResources()).isNotNull();
                        assertThat(newAction.getDefaultResources().getActionId()).isNotEqualTo(newAction.getId());
                        assertThat(newAction.getDefaultResources().getApplicationId()).isEqualTo(parentApplication.getId());
                        assertThat(newAction.getDefaultResources().getBranchName()).isEqualTo(createGitBranchDTO.getBranchName());

                        ActionDTO action = newAction.getUnpublishedAction();
                        assertThat(action.getDefaultResources()).isNotNull();
                        assertThat(action.getDefaultResources().getPageId()).isEqualTo(parentApplication.getPages().get(0).getId());
                        if (!StringUtils.isEmpty(action.getDefaultResources().getCollectionId())) {
                            assertThat(action.getDefaultResources().getCollectionId()).isNotEqualTo(action.getCollectionId());
                        }
                    });

                    assertThat(actionCollectionList).hasSize(1);
                    actionCollectionList.forEach(actionCollection -> {
                        assertThat(actionCollection.getDefaultResources()).isNotNull();
                        assertThat(actionCollection.getDefaultResources().getCollectionId()).isNotEqualTo(actionCollection.getId());
                        assertThat(actionCollection.getDefaultResources().getApplicationId()).isEqualTo(parentApplication.getId());
                        assertThat(actionCollection.getDefaultResources().getBranchName()).isEqualTo(createGitBranchDTO.getBranchName());

                        ActionCollectionDTO unpublishedCollection = actionCollection.getUnpublishedCollection();

                        assertThat(unpublishedCollection.getDefaultToBranchedActionIdsMap())
                                .hasSize(1);
                        unpublishedCollection.getDefaultToBranchedActionIdsMap().forEach((key, value) -> assertThat(key).isNotEqualTo(value));

                        assertThat(unpublishedCollection.getDefaultResources()).isNotNull();
                        assertThat(unpublishedCollection.getDefaultResources().getPageId())
                                .isEqualTo(parentApplication.getPages().get(0).getId());
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createBranch_SrcHasCustomTheme_newApplicationCreatedWithThemesCopied() throws GitAPIException, IOException {
        GitBranchDTO createGitBranchDTO = new GitBranchDTO();
        createGitBranchDTO.setBranchName("valid_branch");

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);

        Mockito.when(gitExecutor.checkoutToBranch(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.listBranches(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(new ArrayList<>()));
        Mockito.when(gitExecutor.createAndCheckoutToBranch(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(createGitBranchDTO.getBranchName()));
        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.commitApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("System generated commit"));
        Mockito.when(gitExecutor.checkoutToBranch(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("pushed successfully"));

        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(DEFAULT_BRANCH));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(Mono.just(true));
        Mockito.when(gitFileUtils.initializeReadme(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));

        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("Test App" + UUID.randomUUID().toString());
        testApplication.setWorkspaceId(workspaceId);

        Mono<Tuple2<Application, Application>> createBranchMono = applicationPageService.createApplication(testApplication)
                .flatMap(application ->
                        Mono.zip(
                                Mono.just(application),
                                pluginRepository.findByPackageName("installed-plugin"),
                                newPageService.findPageById(application.getPages().get(0).getId(), READ_PAGES, false))
                )
                .flatMap(tuple -> {
                    Application application = tuple.getT1();
                    // customize the theme for this application
                    return themeService.getSystemTheme(Theme.DEFAULT_THEME_NAME).flatMap(theme -> {
                        theme.setId(null);
                        theme.setName("Custom theme");
                        return themeService.updateTheme(application.getId(), null, theme);
                    }).then(
                        gitService.connectApplicationToGit(application.getId(), gitConnectDTO, "origin")
                    );
                })
                .flatMap(application ->
                        gitService
                                .createBranch(application.getId(), createGitBranchDTO, application.getGitApplicationMetadata().getBranchName())
                                .then(applicationService.findByBranchNameAndDefaultApplicationId(createGitBranchDTO.getBranchName(), application.getId(), READ_APPLICATIONS))
                )
                .zipWhen(application ->
                    applicationService.findById(application.getGitApplicationMetadata().getDefaultApplicationId())
                );

        StepVerifier
                .create(createBranchMono)
                .assertNext(tuple -> {
                    Application srcApp = tuple.getT1();
                    Application branchedApp = tuple.getT2();
                    assertThat(srcApp.getEditModeThemeId()).isNotEqualTo(branchedApp.getEditModeThemeId());
                    assertThat(srcApp.getPublishedModeThemeId()).isNotEqualTo(branchedApp.getPublishedModeThemeId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_cancelledMidway_cloneSuccess() throws IOException {

        Mockito.when(gitExecutor.cloneApplication(Mockito.any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitExecutor.commitApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("commit"));
        Mockito.when(gitExecutor.checkoutToBranch(Mockito.any(Path.class), Mockito.anyString())).thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(),
                Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("success"));
        Mockito.when(gitFileUtils.checkIfDirectoryIsEmpty(Mockito.any(Path.class))).thenReturn(Mono.just(true));
        Mockito.when(gitFileUtils.initializeReadme(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));

        Application testApplication = new Application();
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitApplicationMetadata.setGitAuth(gitAuth);
        gitApplicationMetadata.setRemoteUrl("git@github.com:test/testRepo.git");
        testApplication.setGitApplicationMetadata(gitApplicationMetadata);
        testApplication.setName("validData");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);

        gitService
                .connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl")
                .timeout(Duration.ofNanos(100))
                .subscribe();

        // Wait for git clone to complete
        Mono<Application> gitConnectedAppFromDbMono = Mono.just(application1)
                .flatMap(application -> {
                    try {
                        // Before fetching the git connected application, sleep for 5 seconds to ensure that the clone
                        // completes
                        Thread.sleep(5000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    return applicationService.getById(application.getId());
                });

        StepVerifier
                .create(gitConnectedAppFromDbMono)
                .assertNext(application -> {
                    assertThat(application.getGitApplicationMetadata().getDefaultApplicationId()).isEqualTo(application.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void commitAndPushApplication_cancelledMidway_pushSuccess() throws GitAPIException, IOException {

        GitCommitDTO commitDTO = new GitCommitDTO();
        commitDTO.setDoPush(true);
        commitDTO.setCommitMessage("test commit");

        PageDTO page = new PageDTO();
        page.setApplicationId(gitConnectedApplication.getId());
        page.setName("commit_sink_page");
        applicationPageService.createPage(page).block();

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.commitApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("committed successfully"));
        Mockito.when(gitExecutor.checkoutToBranch(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("pushed successfully"));

        gitService
                .commitApplication(commitDTO, gitConnectedApplication.getId(), DEFAULT_BRANCH)
                .timeout(Duration.ofMillis(10))
                .subscribe();

        // Wait for git commit to complete
        Mono<Application> appFromDbMono = Mono.just(gitConnectedApplication)
                .flatMap(application -> {
                    try {
                        // Before fetching the git connected application, sleep for 5 seconds to ensure that the clone
                        // completes
                        Thread.sleep(5000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    return applicationService.getById(application.getId());
                });

        StepVerifier
                .create(appFromDbMono)
                .assertNext(application -> {
                    assertThat(application.getPages()).isEqualTo(application.getPublishedPages());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createBranch_cancelledMidway_newApplicationCreated() throws GitAPIException, IOException {

        GitBranchDTO createGitBranchDTO = new GitBranchDTO();
        createGitBranchDTO.setBranchName("midway_cancelled_branch");

        Mockito.when(gitExecutor.checkoutToBranch(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.listBranches(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(new ArrayList<>()));
        Mockito.when(gitExecutor.createAndCheckoutToBranch(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(createGitBranchDTO.getBranchName()));
        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.commitApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("System generated commit"));
        Mockito.when(gitExecutor.checkoutToBranch(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("pushed successfully"));

        gitService
                .createBranch(gitConnectedApplication.getId(), createGitBranchDTO, gitConnectedApplication.getGitApplicationMetadata().getBranchName())
                .timeout(Duration.ofMillis(10))
                .subscribe();

        Mono<Application> branchedAppMono = Mono.just(gitConnectedApplication)
                .flatMap(application -> {
                    try {
                        // Before fetching the git connected application, sleep for 5 seconds to ensure that the clone
                        // completes
                        Thread.sleep(5000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    return applicationService
                            .findByBranchNameAndDefaultApplicationId(createGitBranchDTO.getBranchName(), application.getId(), READ_APPLICATIONS);
                });

        StepVerifier
                .create(branchedAppMono)
                .assertNext(application -> {

                    GitApplicationMetadata gitData = application.getGitApplicationMetadata();
                    assertThat(application).isNotNull();
                    assertThat(application.getId()).isNotEqualTo(gitData.getDefaultApplicationId());
                    assertThat(gitData.getDefaultApplicationId()).isEqualTo(gitConnectedApplication.getId());
                    assertThat(gitData.getBranchName()).isEqualTo(createGitBranchDTO.getBranchName());
                    assertThat(gitData.getDefaultBranchName()).isNotEmpty();
                    assertThat(gitData.getRemoteUrl()).isNotEmpty();
                    assertThat(gitData.getBrowserSupportedRemoteUrl()).isNotEmpty();
                    assertThat(gitData.getRepoName()).isNotEmpty();
                    assertThat(gitData.getGitAuth()).isNull();
                    assertThat(gitData.getIsRepoPrivate()).isNull();

                    application.getPages().forEach(page -> assertThat(page.getDefaultPageId()).isNotEqualTo(page.getId()));
                    application.getPublishedPages().forEach(page -> assertThat(page.getDefaultPageId()).isNotEqualTo(page.getId()));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void generateSSHKeyDefaultType_DataNotExistsInCollection_Success() {
        Mono<GitAuth> publicKey = gitService.generateSSHKey(null);

        StepVerifier
                .create(publicKey)
                .assertNext(s -> {
                    assertThat(s).isNotNull();
                    assertThat(s.getPublicKey()).contains("appsmith");
                    assertThat(s.getPublicKey()).startsWith("ecdsa-sha2-nistp256");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void generateSSHKeyRSAType_DataNotExistsInCollection_Success() {
        Mono<GitAuth> publicKey = gitService.generateSSHKey("RSA");

        StepVerifier
                .create(publicKey)
                .assertNext(s -> {
                    assertThat(s).isNotNull();
                    assertThat(s.getPublicKey()).contains("appsmith");
                    assertThat(s.getPublicKey()).startsWith("ssh-rsa");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void generateSSHKeyDefaultType_KeyExistsInCollection_Success() {
        GitAuth publicKey = gitService.generateSSHKey(null).block();

        Mono<GitAuth> newKey = gitService.generateSSHKey(null);

        StepVerifier
                .create(newKey)
                .assertNext(s -> {
                    assertThat(s).isNotNull();
                    assertThat(s.getPublicKey()).contains("appsmith");
                    assertThat(s.getPublicKey()).startsWith("ecdsa-sha2-nistp256");
                    assertThat(s.getPublicKey()).isNotEqualTo(publicKey.getPublicKey());
                    assertThat(s.getPrivateKey()).isNotEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void generateSSHKeyRSA_KeyExistsInCollection_Success() {
        GitAuth publicKey = gitService.generateSSHKey(null).block();

        Mono<GitAuth> newKey = gitService.generateSSHKey("RSA");

        StepVerifier
                .create(newKey)
                .assertNext(s -> {
                    assertThat(s).isNotNull();
                    assertThat(s.getPublicKey()).contains("appsmith");
                    assertThat(s.getPublicKey()).startsWith("ssh-rsa");
                    assertThat(s.getPublicKey()).isNotEqualTo(publicKey.getPublicKey());
                    assertThat(s.getPrivateKey()).isNotEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplicationFromGit_InvalidRemoteUrl_ThrowError() {
        GitConnectDTO gitConnectDTO = getConnectRequest(null, testUserProfile);
        Mono<ApplicationImportDTO> applicationMono = gitService.importApplicationFromGit("testID", gitConnectDTO);

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage("Remote Url")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplicationFromGit_emptyWorkspaceId_ThrowError() {
        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<ApplicationImportDTO> applicationMono = gitService.importApplicationFromGit(null, gitConnectDTO);

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage("Invalid workspace id")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplicationFromGit_privateRepoLimitReached_ThrowApplicationLimitError() {
        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        gitService.generateSSHKey(null).block();
        GitService gitService1 = Mockito.spy(gitService);
        Mockito.doReturn(Mono.just(Boolean.TRUE)).when(gitService1).isRepoLimitReached(Mockito.anyString(), Mockito.anyBoolean());

        Mono<ApplicationImportDTO> applicationMono = gitService1.importApplicationFromGit(workspaceId, gitConnectDTO);

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.GIT_APPLICATION_LIMIT_ERROR.getMessage(AppsmithError.GIT_APPLICATION_LIMIT_ERROR.getMessage())))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplicationFromGit_emptyRepo_ThrowError() {
        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        GitAuth gitAuth = gitService.generateSSHKey(null).block();

        ApplicationJson applicationJson = createAppJson(filePath).block();
        applicationJson.setExportedApplication(null);
        applicationJson.setDatasourceList(new ArrayList<>());

        Mockito.when(gitExecutor.cloneApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranch"));
        Mockito.when(gitFileUtils.reconstructApplicationJsonFromGitRepo(Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(gitFileUtils.deleteLocalRepo(Mockito.any(Path.class)))
                .thenReturn(Mono.just(true));

        Mono<ApplicationImportDTO> applicationMono = gitService.importApplicationFromGit(workspaceId, gitConnectDTO);

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains("Cannot import app from an empty repo"))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplicationFromGit_validRequest_Success() {
        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        GitAuth gitAuth = gitService.generateSSHKey(null).block();

        ApplicationJson applicationJson = createAppJson(filePath).block();
        applicationJson.getExportedApplication().setName("testRepo");
        applicationJson.setDatasourceList(new ArrayList<>());

        Mockito.when(gitExecutor.cloneApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranch"));
        Mockito.when(gitFileUtils.reconstructApplicationJsonFromGitRepo(Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(applicationJson));

        Mono<ApplicationImportDTO> applicationMono = gitService.importApplicationFromGit(workspaceId, gitConnectDTO);

        StepVerifier
                .create(applicationMono)
                .assertNext(applicationImportDTO -> {
                    Application application = applicationImportDTO.getApplication();
                    assertThat(application.getName()).isEqualTo("testRepo");
                    assertThat(application.getGitApplicationMetadata()).isNotNull();
                    assertThat(application.getGitApplicationMetadata().getBranchName()).isEqualTo("defaultBranch");
                    assertThat(application.getGitApplicationMetadata().getDefaultBranchName()).isEqualTo("defaultBranch");
                    assertThat(application.getGitApplicationMetadata().getRemoteUrl()).isEqualTo("git@github.com:test/testRepo.git");
                    assertThat(application.getGitApplicationMetadata().getIsRepoPrivate()).isEqualTo(true);
                    assertThat(application.getGitApplicationMetadata().getGitAuth().getPublicKey()).isEqualTo(gitAuth.getPublicKey());

                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplicationFromGit_validRequestWithDuplicateApplicationName_Success() {
        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testGitRepo.git", testUserProfile);
        GitAuth gitAuth = gitService.generateSSHKey(null).block();

        ApplicationJson applicationJson =  createAppJson(filePath).block();
        applicationJson.getExportedApplication().setName("testGitRepo (1)");
        applicationJson.setDatasourceList(new ArrayList<>());

        Application testApplication = new Application();
        testApplication.setName("testGitRepo");
        testApplication.setWorkspaceId(workspaceId);
        applicationPageService.createApplication(testApplication).block();

        Mockito.when(gitExecutor.cloneApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranch"));
        Mockito.when(gitFileUtils.reconstructApplicationJsonFromGitRepo(Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(applicationJson));

        Mono<ApplicationImportDTO> applicationMono = gitService.importApplicationFromGit(workspaceId, gitConnectDTO);

        StepVerifier
                .create(applicationMono)
                .assertNext(applicationImportDTO -> {
                    Application application = applicationImportDTO.getApplication();
                    assertThat(application.getName()).isEqualTo("testGitRepo (1)");
                    assertThat(application.getGitApplicationMetadata()).isNotNull();
                    assertThat(application.getGitApplicationMetadata().getBranchName()).isEqualTo("defaultBranch");
                    assertThat(application.getGitApplicationMetadata().getDefaultBranchName()).isEqualTo("defaultBranch");
                    assertThat(application.getGitApplicationMetadata().getRemoteUrl()).isEqualTo("git@github.com:test/testGitRepo.git");
                    assertThat(application.getGitApplicationMetadata().getIsRepoPrivate()).isEqualTo(true);
                    assertThat(application.getGitApplicationMetadata().getGitAuth().getPublicKey()).isEqualTo(gitAuth.getPublicKey());

                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplicationFromGit_validRequestWithDuplicateDatasourceOfSameType_Success() {
        Workspace workspace = new Workspace();
        workspace.setName("gitImportOrg");
        final String testWorkspaceId = workspaceService.create(workspace)
                .map(Workspace::getId)
                .block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testGitImportRepo.git", testUserProfile);
        GitAuth gitAuth = gitService.generateSSHKey(null).block();

        ApplicationJson applicationJson =  createAppJson(filePath).block();
        applicationJson.getExportedApplication().setName("testGitImportRepo");
        applicationJson.getDatasourceList().get(0).setName("db-auth-testGitImportRepo");

        String pluginId = pluginRepository.findByPackageName("mongo-plugin").block().getId();
        Datasource datasource = new Datasource();
        datasource.setName("db-auth-testGitImportRepo");
        datasource.setPluginId(pluginId);
        datasource.setWorkspaceId(testWorkspaceId);
        datasourceService.create(datasource).block();

        Mockito.when(gitExecutor.cloneApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranch"));
        Mockito.when(gitFileUtils.reconstructApplicationJsonFromGitRepo(Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(gitFileUtils.deleteLocalRepo(Mockito.any(Path.class))).thenReturn(Mono.just(true));

        Mono<ApplicationImportDTO> applicationMono = gitService.importApplicationFromGit(workspaceId, gitConnectDTO);

        StepVerifier
                .create(applicationMono)
                .assertNext(applicationImportDTO -> {
                    Application application = applicationImportDTO.getApplication();
                    assertThat(application.getName()).isEqualTo("testGitImportRepo");
                    assertThat(application.getGitApplicationMetadata()).isNotNull();
                    assertThat(application.getGitApplicationMetadata().getBranchName()).isEqualTo("defaultBranch");
                    assertThat(application.getGitApplicationMetadata().getDefaultBranchName()).isEqualTo("defaultBranch");
                    assertThat(application.getGitApplicationMetadata().getRemoteUrl()).isEqualTo("git@github.com:test/testGitImportRepo.git");
                    assertThat(application.getGitApplicationMetadata().getIsRepoPrivate()).isEqualTo(true);
                    assertThat(application.getGitApplicationMetadata().getGitAuth().getPublicKey()).isEqualTo(gitAuth.getPublicKey());

                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplicationFromGit_validRequestWithDuplicateDatasourceOfSameTypeCancelledMidway_Success() {
        Workspace workspace = new Workspace();
        workspace.setName("gitImportOrgCancelledMidway");
        final String testWorkspaceId = workspaceService.create(workspace)
                .map(Workspace::getId)
                .block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testGitImportRepoCancelledMidway.git", testUserProfile);
        GitAuth gitAuth = gitService.generateSSHKey(null).block();

        ApplicationJson applicationJson =  createAppJson(filePath).block();
        applicationJson.getExportedApplication().setName(null);
        applicationJson.getDatasourceList().get(0).setName("db-auth-testGitImportRepo");

        String pluginId = pluginRepository.findByPackageName("mongo-plugin").block().getId();
        Datasource datasource = new Datasource();
        datasource.setName("db-auth-testGitImportRepo");
        datasource.setPluginId(pluginId);
        datasource.setWorkspaceId(testWorkspaceId);
        datasourceService.create(datasource).block();

        Mockito
                .when(gitCloudServicesUtils.getPrivateRepoLimitForOrg(eq(testWorkspaceId), Mockito.anyBoolean()))
                .thenReturn(Mono.just(3));
        Mockito.when(gitExecutor.cloneApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranch"));
        Mockito.when(gitFileUtils.reconstructApplicationJsonFromGitRepo(Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(gitFileUtils.deleteLocalRepo(Mockito.any(Path.class))).thenReturn(Mono.just(true));

        gitService.importApplicationFromGit(testWorkspaceId, gitConnectDTO)
                .timeout(Duration.ofMillis(10))
                .subscribe();

        // Wait for git clone to complete
        Mono<Application> gitConnectedAppFromDbMono = Mono.just(testWorkspaceId)
                .flatMap(ignore -> {
                    try {
                        // Before fetching the git connected application, sleep for 5 seconds to ensure that the clone
                        // completes
                        Thread.sleep(5000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    return applicationService.findByWorkspaceId(testWorkspaceId, READ_APPLICATIONS)
                            .filter(application1 -> "testGitImportRepoCancelledMidway".equals(application1.getName()))
                            .next();
                });

        StepVerifier
                .create(gitConnectedAppFromDbMono)
                .assertNext(application -> {
                    assertThat(application.getName()).isEqualTo("testGitImportRepoCancelledMidway");
                    assertThat(application.getGitApplicationMetadata()).isNotNull();
                    assertThat(application.getGitApplicationMetadata().getBranchName()).isEqualTo("defaultBranch");
                    assertThat(application.getGitApplicationMetadata().getDefaultBranchName()).isEqualTo("defaultBranch");
                    assertThat(application.getGitApplicationMetadata().getRemoteUrl()).isEqualTo("git@github.com:test/testGitImportRepoCancelledMidway.git");
                    assertThat(application.getGitApplicationMetadata().getIsRepoPrivate()).isEqualTo(true);
                    assertThat(application.getGitApplicationMetadata().getGitAuth().getPublicKey()).isEqualTo(gitAuth.getPublicKey());

                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplicationFromGit_validRequestWithDuplicateDatasourceOfDifferentType_ThrowError() {
        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testGitImportRepo1.git", testUserProfile);
        gitService.generateSSHKey(null).block();
        ApplicationJson applicationJson =  createAppJson(filePath).block();
        applicationJson.getExportedApplication().setName("testGitImportRepo1");
        applicationJson.getDatasourceList().get(0).setName("db-auth-1");

        String pluginId = pluginRepository.findByPackageName("postgres-plugin").block().getId();
        Datasource datasource = new Datasource();
        datasource.setName("db-auth-1");
        datasource.setPluginId(pluginId);
        datasource.setWorkspaceId(workspaceId);
        datasourceService.create(datasource).block();

        Mockito.when(gitExecutor.cloneApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranch"));
        Mockito.when(gitFileUtils.reconstructApplicationJsonFromGitRepo(Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(gitFileUtils.deleteLocalRepo(Mockito.any(Path.class)))
                .thenReturn(Mono.just(true));

        Mono<ApplicationImportDTO> applicationMono = gitService.importApplicationFromGit(workspaceId, gitConnectDTO);

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains("Datasource already exists with the same name"))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplicationFromGit_validRequestWithEmptyRepo_ThrowError() {
        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/emptyRepo.git", testUserProfile);
        GitAuth gitAuth = gitService.generateSSHKey(null).block();

        ApplicationJson applicationJson =new ApplicationJson();

        Mockito.when(gitExecutor.cloneApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranch"));
        Mockito.when(gitFileUtils.reconstructApplicationJsonFromGitRepo(Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(gitFileUtils.deleteLocalRepo(Mockito.any(Path.class))).thenReturn(Mono.just(true));

        Mono<ApplicationImportDTO> applicationMono = gitService.importApplicationFromGit(workspaceId, gitConnectDTO);

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains("Cannot import app from an empty repo"))
                .verify();
    }

    // TODO TCs for merge is pending

    @Test
    @WithUserDetails(value ="api_user")
    public void deleteBranch_staleBranchNotInDB_Success() throws IOException, GitAPIException {
        Application application = createApplicationConnectedToGit("deleteBranch_staleBranchNotInDB_Success", "master");
        application.getGitApplicationMetadata().setDefaultBranchName("master");
        applicationService.save(application).block();
        Mockito.when(gitExecutor.deleteBranch(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));

        Mono<Application> applicationMono = gitService.deleteBranch(application.getId(), "test");

        StepVerifier
                .create(applicationMono)
                .assertNext(application1 -> {
                    assertThat(application1.getId()).isEqualTo(application.getId());
                })
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value ="api_user")
    public void deleteBranch_existsInDB_Success() throws IOException, GitAPIException {
        Application application = createApplicationConnectedToGit("deleteBranch_existsInDB_Success", "master");
        application.getGitApplicationMetadata().setDefaultBranchName("test");
        applicationService.save(application).block();
        Mockito.when(gitExecutor.deleteBranch(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));

        Mono<Application> applicationMono = gitService.deleteBranch(application.getId(), "master");

        StepVerifier
                .create(applicationMono)
                .assertNext(application1 -> {
                    assertThat(application1.getId()).isEqualTo(application.getId());
                    assertThat(application1.getDeleted()).isFalse();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteBranch_branchDoesNotExist_ThrowError() throws IOException, GitAPIException {
        Application application = createApplicationConnectedToGit("deleteBranch_branchDoesNotExist_ThrowError", "master");
        application.getGitApplicationMetadata().setDefaultBranchName("test");
        applicationService.save(application).block();
        Mockito.when(gitExecutor.deleteBranch(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(false));

        Mono<Application> applicationMono = gitService.deleteBranch(application.getId(), "master");

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable ->  throwable instanceof AppsmithException &&
                        throwable.getMessage().contains("delete branch. Branch does not exists in the repo"))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteBranch_defaultBranch_ThrowError() throws IOException, GitAPIException {
        Application application = createApplicationConnectedToGit("deleteBranch_defaultBranch_ThrowError", "master");
        application.getGitApplicationMetadata().setDefaultBranchName("master");
        applicationService.save(application).block();
        Mockito.when(gitExecutor.deleteBranch(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(false));

        Mono<Application> applicationMono = gitService.deleteBranch(application.getId(), "master");

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().contains("Cannot delete default branch"))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteBranch_defaultBranchUpdated_Success() throws IOException, GitAPIException {
        Application application = createApplicationConnectedToGit("deleteBranch_defaultBranchUpdated_Success1", "master");
        application.getGitApplicationMetadata().setDefaultBranchName("f1");
        applicationService.save(application).block();

        Application branchApp = createApplicationConnectedToGit("deleteBranch_defaultBranchUpdated_Success2", "f1");
        branchApp.getGitApplicationMetadata().setDefaultBranchName("f1");
        branchApp.getGitApplicationMetadata().setDefaultApplicationId(application.getId());
        applicationService.save(branchApp).block();

        Mockito.when(gitExecutor.deleteBranch(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));

        Mono<Application> applicationMono = gitService.deleteBranch(application.getId(), "master");

        StepVerifier
                .create(applicationMono)
                .assertNext(application1 -> {
                    assertThat(application1.getDeleted()).isEqualTo(Boolean.FALSE);
                    assertThat(application1.getName()).isEqualTo("deleteBranch_defaultBranchUpdated_Success1");
                })
                .verifyComplete();
    }

    // We are only testing git level operations from this testcase. For testcases related to scenarios like
    // 1. Resource is added
    // 2. Resource is deleted
    // and then discard is called will be covered in ImportExportApplicationServiceTests.java
    @Test
    @WithUserDetails(value = "api_user")
    public void discardChanges_upstreamChangesAvailable_discardSuccess() throws IOException, GitAPIException {
        Application application = createApplicationConnectedToGit("discard-changes", "discard-change-branch");
        MergeStatusDTO mergeStatusDTO = new MergeStatusDTO();
        mergeStatusDTO.setStatus("2 commits pulled");
        mergeStatusDTO.setMergeAble(true);

        ApplicationJson applicationJson = createAppJson(filePath).block();
        applicationJson.getExportedApplication().setName("discardChangesAvailable");


        GitStatusDTO gitStatusDTO = new GitStatusDTO();
        gitStatusDTO.setAheadCount(2);
        gitStatusDTO.setBehindCount(0);
        gitStatusDTO.setIsClean(true);

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("path")));
        Mockito.when(gitFileUtils.reconstructApplicationJsonFromGitRepo(Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(gitExecutor.pullApplication(
                Mockito.any(Path.class),Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(mergeStatusDTO));
        Mockito.when(gitExecutor.getStatus(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(gitStatusDTO));
        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), eq(true), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetched"));
        Mockito.when(gitExecutor.resetToLastCommit(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));

        Mono<Application> applicationMono = gitService.discardChanges(application.getId(), application.getGitApplicationMetadata().getBranchName(), true);

        StepVerifier
                .create(applicationMono)
                .assertNext(application1 -> {
                    assertThat(application1.getPages()).isNotEqualTo(application.getPages());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void discardChanges_cancelledMidway_discardSuccess() throws IOException, GitAPIException {
        Application application = createApplicationConnectedToGit("discard-changes-midway", "discard-change-midway-branch");
        MergeStatusDTO mergeStatusDTO = new MergeStatusDTO();
        mergeStatusDTO.setStatus("Nothing to fetch from remote. All changes are upto date.");
        mergeStatusDTO.setMergeAble(true);

        ApplicationJson applicationJson = createAppJson(filePath).block();
        applicationJson.getExportedApplication().setName("discard-changes-midway");


        GitStatusDTO gitStatusDTO = new GitStatusDTO();
        gitStatusDTO.setAheadCount(0);
        gitStatusDTO.setBehindCount(0);
        gitStatusDTO.setIsClean(true);

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("path")));
        Mockito.when(gitFileUtils.reconstructApplicationJsonFromGitRepo(Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(gitExecutor.pullApplication(
                Mockito.any(Path.class),Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(mergeStatusDTO));
        Mockito.when(gitExecutor.getStatus(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(gitStatusDTO));
        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), eq(true), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetched"));

        gitService
                .discardChanges(application.getId(), application.getGitApplicationMetadata().getBranchName(), true)
                .timeout(Duration.ofNanos(100))
                .subscribe();

        // Wait for git clone to complete
        Mono<Application> applicationFromDbMono = Mono.just(application)
                .flatMap(application1 -> {
                    try {
                        // Before fetching the git connected application, sleep for 5 seconds to ensure that the clone
                        // completes
                        Thread.sleep(5000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    return applicationService.getById(application1.getId());
                });

        StepVerifier
                .create(applicationFromDbMono)
                .assertNext(application1 -> {
                    assertThat(application1).isNotEqualTo(application);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteBranch_cancelledMidway_success() throws GitAPIException, IOException {

        final String DEFAULT_BRANCH = "master", TO_BE_DELETED_BRANCH = "deleteBranch";
        Application application = createApplicationConnectedToGit("deleteBranch_defaultBranchUpdated_Success", DEFAULT_BRANCH);
        application.getGitApplicationMetadata().setDefaultBranchName(DEFAULT_BRANCH);
        applicationService.save(application).block();

        Application branchApp = createApplicationConnectedToGit("deleteBranch_defaultBranchUpdated_Success2", TO_BE_DELETED_BRANCH);
        branchApp.getGitApplicationMetadata().setDefaultBranchName(DEFAULT_BRANCH);
        branchApp.getGitApplicationMetadata().setDefaultApplicationId(application.getId());
        applicationService.save(branchApp).block();

        Mockito.when(gitExecutor.deleteBranch(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));

        gitService
                .deleteBranch(application.getId(), TO_BE_DELETED_BRANCH)
                .timeout(Duration.ofMillis(5))
                .subscribe();

        // Wait for git delete branch to complete
        Mono<List<Application>> applicationsFromDbMono = Mono.just(application)
                .flatMapMany(DBApplication -> {
                    try {
                        // Before fetching the git connected application, sleep for 5 seconds to ensure that the delete
                        // completes
                        Thread.sleep(5000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    return applicationService.findAllApplicationsByDefaultApplicationId(DBApplication.getId(), MANAGE_APPLICATIONS);
                })
                .collectList();

        StepVerifier
                .create(applicationsFromDbMono)
                .assertNext(applicationList -> {
                    Set<String> branchNames = new HashSet<>();
                    applicationList.forEach(application1 -> branchNames.add(application1.getGitApplicationMetadata().getBranchName()));
                    assertThat(branchNames).doesNotContain(TO_BE_DELETED_BRANCH);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getGitConnectedApps_privateRepositories_Success() throws GitAPIException, IOException {

        Workspace workspace = new Workspace();
        workspace.setName("Limit Private Repo Test Workspace");
        String localWorkspaceId = workspaceService.create(workspace).map(Workspace::getId).block();

        Mockito.when(gitCloudServicesUtils.getPrivateRepoLimitForOrg(eq(localWorkspaceId), Mockito.anyBoolean()))
                .thenReturn(Mono.just(-1));

        createApplicationConnectedToGit("private_repo_1", "master", localWorkspaceId);
        createApplicationConnectedToGit("private_repo_2", "master", localWorkspaceId);
        createApplicationConnectedToGit("private_repo_3", "master", localWorkspaceId);

        StepVerifier
                .create(gitService.getApplicationCountWithPrivateRepo(localWorkspaceId))
                .assertNext(limit -> assertThat(limit).isEqualTo(3))
                .verifyComplete();
    }
}