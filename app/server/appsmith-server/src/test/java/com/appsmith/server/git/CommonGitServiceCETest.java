package com.appsmith.server.git;

import com.appsmith.external.dtos.GitBranchDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.JSValue;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationDetail;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.AutoCommitConfig;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.GitCommitDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitMergeDTO;
import com.appsmith.server.dtos.GitPullDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.git.common.CommonGitServiceCE;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.GitCloudServicesUtils;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.migrations.JsonSchemaVersions;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.appsmith.server.themes.base.ThemeService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.apache.commons.lang.StringUtils;
import org.eclipse.jgit.api.errors.EmptyCommitException;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.errors.RepositoryNotFoundException;
import org.eclipse.jgit.lib.BranchTrackingStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuple4;

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
import java.util.stream.Collectors;

import static com.appsmith.external.constants.AnalyticsEvents.GIT_ADD_PROTECTED_BRANCH;
import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.constants.FieldName.DEFAULT_PAGE_LAYOUT;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@SpringBootTest
@Slf4j
@DirtiesContext
public class CommonGitServiceCETest {

    private static final String DEFAULT_BRANCH = "defaultBranchName";
    private static final String EMPTY_COMMIT_ERROR_MESSAGE = "On current branch nothing to commit, working tree clean";
    private static final String GIT_CONFIG_ERROR =
            "Unable to find the git configuration, please configure your application "
                    + "with git to use version control service";
    private static String workspaceId;
    private static String defaultEnvironmentId;
    private static Application gitConnectedApplication = new Application();
    private static Boolean isSetupDone = false;
    private static final GitProfile testUserProfile = new GitProfile();
    private static final String filePath =
            "test_assets/ImportExportServiceTest/valid-application-without-action-collection.json";

    @Qualifier("commonGitServiceCEImpl") @Autowired
    CommonGitServiceCE commonGitServiceCE;

    @Autowired
    Gson gson;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    ApplicationPageService applicationPageService;

    @SpyBean
    ApplicationService applicationService;

    @Autowired
    ApplicationRepository applicationRepository;

    @Autowired
    LayoutCollectionService layoutCollectionService;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    UpdateLayoutService updateLayoutService;

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
    UserService userService;

    @MockBean
    GitExecutor gitExecutor;

    @MockBean
    CommonGitFileUtils commonGitFileUtils;

    @MockBean
    GitCloudServicesUtils gitCloudServicesUtils;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    private ThemeService themeService;

    @Autowired
    EnvironmentPermission environmentPermission;

    @Autowired
    ApplicationPermission applicationPermission;

    @Autowired
    SessionUserService sessionUserService;

    @Autowired
    CacheableRepositoryHelper cacheableRepositoryHelper;

    @Autowired
    JsonSchemaMigration jsonSchemaMigration;

    @Autowired
    JsonSchemaVersions jsonSchemaVersions;

    @SpyBean
    AnalyticsService analyticsService;

    @BeforeEach
    public void setup() throws IOException, GitAPIException {
        User currentUser = sessionUserService.getCurrentUser().block();
        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("Git Service Test");

        Set<String> beforeCreatingWorkspace =
                cacheableRepositoryHelper.getPermissionGroupsOfUser(currentUser).block();
        log.info("Permission Groups for User before creating workspace: {}", beforeCreatingWorkspace);
        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        workspaceId = workspace.getId();
        defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                .block();

        Mockito.when(gitCloudServicesUtils.getPrivateRepoLimitForOrg(eq(workspaceId), Mockito.anyBoolean()))
                .thenReturn(Mono.just(-1));

        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(new MockPluginExecutor()));

        testUserProfile.setAuthorEmail("test@email.com");
        testUserProfile.setAuthorName("testUser");

        gitConnectedApplication = createApplicationConnectedToGit("gitConnectedApplication", DEFAULT_BRANCH);
    }

    @AfterEach
    public void cleanup() {
        Mockito.when(commonGitFileUtils.deleteLocalRepo(any(Path.class))).thenReturn(Mono.just(true));
        List<Application> deletedApplications = applicationService
                .findByWorkspaceId(workspaceId, applicationPermission.getDeletePermission())
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .collectList()
                .block();
        Workspace deletedWorkspace = workspaceService.archiveById(workspaceId).block();
    }

    private Mono<ApplicationJson> createAppJson(String filePath) {
        FilePart filePart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils.read(
                        new ClassPathResource(filePath), new DefaultDataBufferFactory(), 4096)
                .cache();

        Mockito.when(filePart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filePart.headers().getContentType()).thenReturn(MediaType.APPLICATION_JSON);

        Mono<String> stringifiedFile = DataBufferUtils.join(filePart.content()).map(dataBuffer -> {
            byte[] data = new byte[dataBuffer.readableByteCount()];
            dataBuffer.read(data);
            DataBufferUtils.release(dataBuffer);
            return new String(data);
        });

        return stringifiedFile
                .map(data -> gson.fromJson(data, ApplicationJson.class))
                .flatMap(applicationJson -> jsonSchemaMigration.migrateArtifactExchangeJsonToLatestSchema(
                        applicationJson, null, null, null))
                .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson);
    }

    private GitConnectDTO getConnectRequest(String remoteUrl, GitProfile gitProfile) {
        GitConnectDTO gitConnectDTO = new GitConnectDTO();
        gitConnectDTO.setRemoteUrl(remoteUrl);
        gitConnectDTO.setGitProfile(gitProfile);
        return gitConnectDTO;
    }

    private Application createApplicationConnectedToGit(String name, String branchName)
            throws IOException, GitAPIException {
        return createApplicationConnectedToGit(name, branchName, workspaceId);
    }

    private Application createApplicationConnectedToGit(String name, String branchName, String workspaceId)
            throws IOException, GitAPIException {

        if (StringUtils.isEmpty(branchName)) {
            branchName = DEFAULT_BRANCH;
        }
        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(branchName));
        Mockito.when(gitExecutor.commitArtifact(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("commit"));
        Mockito.when(gitExecutor.checkoutToBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(any(Path.class), any(), any(), any(), any()))
                .thenReturn(Mono.just("success"));
        Mockito.when(commonGitFileUtils.checkIfDirectoryIsEmpty(any(Path.class)))
                .thenReturn(Mono.just(true));
        Mockito.when(commonGitFileUtils.initializeReadme(any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));
        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                        any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("path")));

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

        String repoUrl = String.format("git@github.com:test/%s.git", name);
        GitConnectDTO gitConnectDTO = getConnectRequest(repoUrl, testUserProfile);
        return commonGitServiceCE
                .connectArtifactToGit(application1.getId(), gitConnectDTO, "baseUrl", ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact)
                .block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectArtifactToGit_EmptyRemoteUrl_ThrowInvalidParameterException() {

        GitConnectDTO gitConnectDTO = getConnectRequest(null, testUserProfile);
        Mono<Application> applicationMono = commonGitServiceCE
                .connectArtifactToGit("testID", gitConnectDTO, "baseUrl", ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage("Remote Url")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectArtifactToGit_EmptyOriginHeader_ThrowInvalidParameterException() {

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<Application> applicationMono = commonGitServiceCE
                .connectArtifactToGit("testID", gitConnectDTO, null, ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage("origin")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectArtifactToGit_InvalidGitApplicationMetadata_ThrowInvalidGitConfigurationException() {

        Application testApplication = new Application();
        testApplication.setGitApplicationMetadata(new GitArtifactMetadata());
        testApplication.setName("InvalidGitApplicationMetadata");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 =
                applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<Application> applicationMono = commonGitServiceCE
                .connectArtifactToGit(application1.getId(), gitConnectDTO, "baseUrl", ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> {
                    assertThat(throwable instanceof AppsmithException).isTrue();
                    assertThat(throwable.getMessage())
                            .contains(AppsmithError.INVALID_GIT_SSH_CONFIGURATION.getMessage("origin"));
                    assertThat(((AppsmithException) throwable).getReferenceDoc())
                            .isNotEmpty();
                    return true;
                })
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectArtifactToGit_EmptyPrivateKey_ThrowInvalidGitConfigurationException() {

        Application testApplication = new Application();
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("publicKey");
        gitArtifactMetadata.setGitAuth(gitAuth);
        testApplication.setName("EmptyPrivateKey");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        Application application1 =
                applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<Application> applicationMono = commonGitServiceCE
                .connectArtifactToGit(application1.getId(), gitConnectDTO, "baseUrl", ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .contains(AppsmithError.INVALID_GIT_SSH_CONFIGURATION.getMessage("origin")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectArtifactToGit_EmptyPublicKey_ThrowInvalidGitConfigurationException() {

        Application testApplication = new Application();
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPrivateKey("privatekey");
        gitArtifactMetadata.setGitAuth(gitAuth);
        testApplication.setName("EmptyPublicKey");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        Application application1 =
                applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<Application> applicationMono = commonGitServiceCE
                .connectArtifactToGit(application1.getId(), gitConnectDTO, "baseUrl", ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .contains(AppsmithError.INVALID_GIT_SSH_CONFIGURATION.getMessage("origin")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectArtifactToGit_InvalidRemoteUrl_ThrowInvalidRemoteUrl() throws IOException {

        Application testApplication = new Application();
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitArtifactMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        testApplication.setName("InvalidRemoteUrl");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 =
                applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);

        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(commonGitFileUtils.checkIfDirectoryIsEmpty(any(Path.class)))
                .thenReturn(Mono.just(false));

        Mono<Application> applicationMono = commonGitServiceCE
                .connectArtifactToGit(application1.getId(), gitConnectDTO, "baseUrl", ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException)
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectArtifactToGit_InvalidRemoteUrlHttp_ThrowInvalidRemoteUrl() throws ClassCastException {

        Application testApplication = new Application();
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitArtifactMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        testApplication.setName("InvalidRemoteUrlHttp");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 =
                applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("https://github.com/test/testRepo.git", testUserProfile);

        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.error(new ClassCastException("TransportHttp")));
        Mockito.when(commonGitFileUtils.deleteLocalRepo(any(Path.class))).thenReturn(Mono.just(true));

        Mono<? extends Artifact> applicationMono = commonGitServiceCE.connectArtifactToGit(
                application1.getId(), gitConnectDTO, "baseUrl", ArtifactType.APPLICATION);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(
                        e -> e.getMessage()
                                .equals(
                                        AppsmithError.INVALID_GIT_CONFIGURATION.getMessage(
                                                "Remote URL is incorrect. "
                                                        + "Please add a URL in standard format. Example: git@example.com:username/reponame.git")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectArtifactToGit_InvalidFilePath_ThrowIOException() throws IOException {

        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(commonGitFileUtils.checkIfDirectoryIsEmpty(any(Path.class)))
                .thenThrow(new IOException("Error while accessing the file system"));

        Application testApplication = new Application();
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitArtifactMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        testApplication.setName("InvalidFilePath");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 =
                applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testy.git", testUserProfile);
        Mono<Application> applicationMono = commonGitServiceCE
                .connectArtifactToGit(application1.getId(), gitConnectDTO, "baseUrl", ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains("Error while accessing the file system"))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectArtifactToGit_ClonedRepoNotEmpty_Failure() throws IOException {

        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(commonGitFileUtils.checkIfDirectoryIsEmpty(any(Path.class)))
                .thenReturn(Mono.just(false));

        Application testApplication = new Application();
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitArtifactMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        testApplication.setName("ValidTest TestApp");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 =
                applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testy.git", testUserProfile);
        Mono<Application> applicationMono = commonGitServiceCE
                .connectArtifactToGit(application1.getId(), gitConnectDTO, "baseUrl", ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_GIT_REPO.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectArtifactToGit_cloneException_throwGitException() throws IOException {

        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.error(new Exception("error message")));
        Mockito.when(commonGitFileUtils.deleteLocalRepo(any(Path.class))).thenReturn(Mono.just(true));

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<Application> applicationMono = commonGitServiceCE
                .connectArtifactToGit(
                        gitConnectedApplication.getId(), gitConnectDTO, "baseUrl", ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().equals(AppsmithError.GIT_GENERIC_ERROR.getMessage("error message")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectArtifactToGit_WithEmptyPublishedPages_CloneSuccess() throws IOException, GitAPIException {

        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitExecutor.commitArtifact(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("commit"));
        Mockito.when(gitExecutor.checkoutToBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString()))
                .thenReturn(Mono.just("success"));
        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                        any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(commonGitFileUtils.checkIfDirectoryIsEmpty(any(Path.class)))
                .thenReturn(Mono.just(true));
        Mockito.when(commonGitFileUtils.initializeReadme(any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));

        Application testApplication = new Application();
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitArtifactMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        testApplication.setName("validData_WithEmptyPublishedPages");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 =
                applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<Application> applicationMono = commonGitServiceCE
                .connectArtifactToGit(application1.getId(), gitConnectDTO, "baseUrl", ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .assertNext(application -> {
                    GitArtifactMetadata gitArtifactMetadata1 = application.getGitApplicationMetadata();
                    assertThat(gitArtifactMetadata1.getRemoteUrl()).isEqualTo(gitConnectDTO.getRemoteUrl());
                    assertThat(gitArtifactMetadata1.getRefName()).isEqualTo("defaultBranchName");
                    assertThat(gitArtifactMetadata1.getGitAuth().getPrivateKey())
                            .isNotNull();
                    assertThat(gitArtifactMetadata1.getGitAuth().getPublicKey()).isNotNull();
                    assertThat(gitArtifactMetadata1.getGitAuth().getGeneratedAt())
                            .isNotNull();
                    assertThat(gitArtifactMetadata1.getRepoName()).isEqualTo("testRepo");
                    assertThat(gitArtifactMetadata1.getDefaultArtifactId()).isEqualTo(application.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectArtifactToGit_WithoutGitProfileUsingDefaultProfile_CloneSuccess()
            throws IOException, GitAPIException {

        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitExecutor.commitArtifact(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("commit"));
        Mockito.when(gitExecutor.checkoutToBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString()))
                .thenReturn(Mono.just("success"));
        Mockito.when(gitExecutor.commitArtifact(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("commit"));
        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                        any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(commonGitFileUtils.checkIfDirectoryIsEmpty(any(Path.class)))
                .thenReturn(Mono.just(true));
        Mockito.when(commonGitFileUtils.initializeReadme(any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));
        Mockito.when(commonGitFileUtils.deleteLocalRepo(any(Path.class))).thenReturn(Mono.just(true));

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
        testApplication.setWorkspaceId(workspaceId);
        Application application1 =
                applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", gitProfile);
        Mono<Application> applicationMono = commonGitServiceCE
                .connectArtifactToGit(application1.getId(), gitConnectDTO, "baseUrl", ArtifactType.APPLICATION)
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
    public void connectArtifactToGit_WithoutGitProfileUsingLocalProfile_ThrowAuthorNameUnavailableError() {

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
        testApplication.setWorkspaceId(workspaceId);
        Application application1 =
                applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", gitProfile);
        Mono<Application> applicationMono = commonGitServiceCE
                .connectArtifactToGit(application1.getId(), gitConnectDTO, "baseUrl", ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage("Author Name")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectArtifactToGit_WithNonEmptyPublishedPages_CloneSuccess() throws IOException, GitAPIException {

        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitExecutor.commitArtifact(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("commit"));
        Mockito.when(gitExecutor.checkoutToBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString()))
                .thenReturn(Mono.just("success"));
        Mockito.when(gitExecutor.commitArtifact(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("commit"));
        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                        any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(commonGitFileUtils.checkIfDirectoryIsEmpty(any(Path.class)))
                .thenReturn(Mono.just(true));
        Mockito.when(commonGitFileUtils.initializeReadme(any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));
        Mockito.when(commonGitFileUtils.deleteLocalRepo(any(Path.class))).thenReturn(Mono.just(true));

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
        testApplication.setWorkspaceId(workspaceId);
        Application application1 =
                applicationPageService.createApplication(testApplication).block();

        PageDTO page = new PageDTO();
        page.setName("New Page");
        page.setApplicationId(application1.getId());
        applicationPageService.createPage(page).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<Application> applicationMono = commonGitServiceCE
                .connectArtifactToGit(application1.getId(), gitConnectDTO, "baseUrl", ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .assertNext(application -> {
                    GitArtifactMetadata gitArtifactMetadata1 = application.getGitApplicationMetadata();
                    assertThat(gitArtifactMetadata1.getRemoteUrl()).isEqualTo(gitConnectDTO.getRemoteUrl());
                    assertThat(gitArtifactMetadata1.getRefName()).isEqualTo("defaultBranchName");
                    assertThat(gitArtifactMetadata1.getGitAuth().getPrivateKey())
                            .isNotNull();
                    assertThat(gitArtifactMetadata1.getGitAuth().getPublicKey()).isNotNull();
                    assertThat(gitArtifactMetadata1.getGitAuth().getGeneratedAt())
                            .isNotNull();
                    assertThat(gitArtifactMetadata1.getRepoName()).isEqualTo("testRepo");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectArtifactToGit_moreThanSupportedPrivateRepos_throwException()
            throws IOException, GitAPIException {
        Workspace workspace = new Workspace();
        workspace.setName("Limit Private Repo Test Workspace");
        String limitPrivateRepoTestWorkspaceId =
                workspaceService.create(workspace).map(Workspace::getId).block();

        Mockito.when(gitCloudServicesUtils.getPrivateRepoLimitForOrg(Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just(0));

        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitExecutor.commitArtifact(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("commit"));
        Mockito.when(gitExecutor.checkoutToBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString()))
                .thenReturn(Mono.just("success"));
        Mockito.when(commonGitFileUtils.checkIfDirectoryIsEmpty(any(Path.class)))
                .thenReturn(Mono.just(true));
        Mockito.when(commonGitFileUtils.initializeReadme(any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));

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

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<Application> applicationMono = commonGitServiceCE
                .connectArtifactToGit(application.getId(), gitConnectDTO, "baseUrl", ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(error -> error instanceof AppsmithException
                        && error.getMessage().equals(AppsmithError.GIT_APPLICATION_LIMIT_ERROR.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectArtifactToGit_toggleAccessibilityToPublicForConnectedApp_connectSuccessful()
            throws IOException, GitAPIException {
        Workspace workspace = new Workspace();
        workspace.setName("Toggle Accessibility To Public From Private Repo Test Workspace");
        String limitPrivateRepoTestWorkspaceId =
                workspaceService.create(workspace).map(Workspace::getId).block();

        Mockito.when(gitCloudServicesUtils.getPrivateRepoLimitForOrg(
                        eq(limitPrivateRepoTestWorkspaceId), Mockito.anyBoolean()))
                .thenReturn(Mono.just(3));
        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitExecutor.commitArtifact(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("commit"));
        Mockito.when(gitExecutor.checkoutToBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString()))
                .thenReturn(Mono.just("success"));
        Mockito.when(commonGitFileUtils.checkIfDirectoryIsEmpty(any(Path.class)))
                .thenReturn(Mono.just(true));
        Mockito.when(commonGitFileUtils.initializeReadme(any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));

        Application application1 =
                this.createApplicationConnectedToGit("private_repo_1", "master", limitPrivateRepoTestWorkspaceId);
        this.createApplicationConnectedToGit("private_repo_2", "master", limitPrivateRepoTestWorkspaceId);

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

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<Application> applicationMono = commonGitServiceCE
                .connectArtifactToGit(application.getId(), gitConnectDTO, "baseUrl", ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        // Use any dummy url so as to get 2xx response
        application1.getGitApplicationMetadata().setBrowserSupportedRemoteUrl("https://www.google.com/");
        applicationService.save(application1).block();

        StepVerifier.create(applicationMono)
                .assertNext(connectedApp -> {
                    assertThat(connectedApp.getId()).isNotEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectArtifactToGit_WithValidCustomGitDomain_CloneSuccess() throws IOException, GitAPIException {

        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitExecutor.commitArtifact(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("commit"));
        Mockito.when(gitExecutor.checkoutToBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString()))
                .thenReturn(Mono.just("success"));
        Mockito.when(gitExecutor.commitArtifact(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("commit"));
        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                        any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(commonGitFileUtils.checkIfDirectoryIsEmpty(any(Path.class)))
                .thenReturn(Mono.just(true));
        Mockito.when(commonGitFileUtils.initializeReadme(any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));

        Application testApplication = new Application();
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitArtifactMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        testApplication.setName("connectArtifactToGit_WithValidCustomGitDomain_CloneSuccess");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 =
                applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO =
                getConnectRequest("git@github.test.net:user/test/tests/testRepo.git", testUserProfile);
        Mono<Application> applicationMono = commonGitServiceCE
                .connectArtifactToGit(application1.getId(), gitConnectDTO, "baseUrl", ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .assertNext(application -> {
                    GitArtifactMetadata gitArtifactMetadata1 = application.getGitApplicationMetadata();
                    assertThat(gitArtifactMetadata1.getRemoteUrl()).isEqualTo(gitConnectDTO.getRemoteUrl());
                    assertThat(gitArtifactMetadata1.getRefName()).isEqualTo("defaultBranchName");
                    assertThat(gitArtifactMetadata1.getGitAuth().getPrivateKey())
                            .isNotNull();
                    assertThat(gitArtifactMetadata1.getGitAuth().getPublicKey()).isNotNull();
                    assertThat(gitArtifactMetadata1.getGitAuth().getGeneratedAt())
                            .isNotNull();
                    assertThat(gitArtifactMetadata1.getRepoName()).isEqualTo("testRepo");
                    assertThat(gitArtifactMetadata1.getDefaultArtifactId()).isEqualTo(application.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateGitMetadata_EmptyData_Success() {
        Application testApplication = new Application();
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl("docUrl");
        gitArtifactMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        testApplication.setName("updateGitMetadata_EmptyData_Success");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 =
                applicationPageService.createApplication(testApplication).block();
        GitArtifactMetadata gitArtifactMetadata1 = null;

        Mono<Application> applicationMono = commonGitServiceCE
                .updateGitMetadata(application1.getId(), gitArtifactMetadata1, ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains("Git metadata values cannot be null"))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateGitMetadata_validData_Success() {
        Application testApplication = new Application();
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl("docUrl");
        gitArtifactMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        testApplication.setName("updateGitMetadata_EmptyData_Success1");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 =
                applicationPageService.createApplication(testApplication).block();
        GitArtifactMetadata gitArtifactMetadata1 = application1.getGitApplicationMetadata();
        gitArtifactMetadata1.setRemoteUrl("https://test/.git");

        Mono<Application> applicationMono = commonGitServiceCE
                .updateGitMetadata(application1.getId(), gitArtifactMetadata1, ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .assertNext(application -> {
                    assertThat(application.getGitApplicationMetadata()).isNotNull();
                    assertThat(application.getGitApplicationMetadata().getRemoteUrl())
                            .isEqualTo("https://test/.git");
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

        Mockito.when(gitExecutor.listBranches(any(Path.class))).thenReturn(Mono.just(branchList));
        Mockito.when(commonGitFileUtils.deleteLocalRepo(any(Path.class))).thenReturn(Mono.just(true));
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Application testApplication = new Application();
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitAuth.setDocUrl("docUrl");
        gitArtifactMetadata.setRemoteUrl("test.com");
        gitArtifactMetadata.setGitAuth(gitAuth);
        gitArtifactMetadata.setRepoName("repoName");
        gitArtifactMetadata.setDefaultApplicationId("TestId");
        gitArtifactMetadata.setDefaultBranchName("defaultBranchFromRemote");
        gitArtifactMetadata.setRefName("defaultBranch");
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        testApplication.setName("detachRemote_validData");
        testApplication.setWorkspaceId(workspaceId);

        Mono<Application> applicationMono = applicationPageService
                .createApplication(testApplication)
                .flatMap(application -> {
                    // Update the defaultIds for resources to mock merge action from other branch
                    application.getPages().forEach(page -> page.setDefaultPageId(page.getId() + "randomId"));
                    return Mono.zip(
                            applicationService.save(application),
                            pluginRepository.findByPackageName("installed-plugin"),
                            newPageService.findPageById(
                                    application.getPages().get(0).getId(), READ_PAGES, false));
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

                    action.setBaseId("branchedActionId");
                    action.setRefType(RefType.branch);
                    action.setRefName("testBranch");

                    ObjectMapper objectMapper = new ObjectMapper();
                    JSONObject parentDsl = null;
                    try {
                        parentDsl = new JSONObject(objectMapper.readValue(
                                DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {}));
                    } catch (JsonProcessingException e) {
                        log.debug(String.valueOf(e));
                    }

                    ArrayList children = (ArrayList) parentDsl.get("children");
                    JSONObject testWidget = new JSONObject();
                    testWidget.put("widgetName", "firstWidget");
                    JSONArray temp = new JSONArray();
                    temp.add(new JSONObject(Map.of("key", "testField")));
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
                                    layoutActionService
                                            .createSingleAction(action, Boolean.FALSE)
                                            .then(updateLayoutService.updateLayout(
                                                    testPage.getId(),
                                                    testPage.getApplicationId(),
                                                    layout.getId(),
                                                    layout)),
                                    layoutCollectionService.createCollection(actionCollectionDTO))
                            .map(tuple2 -> application);
                })
                .cache();

        Mockito.doReturn(applicationMono).when(applicationService).findById(eq("TestId"), any(AclPermission.class));

        Mono<Application> resultMono = applicationMono.flatMap(application -> commonGitServiceCE
                .detachRemote(application.getId(), ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact));

        StepVerifier.create(resultMono.zipWhen(application -> Mono.zip(
                        newActionService
                                .findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null)
                                .collectList(),
                        actionCollectionService
                                .findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null)
                                .collectList(),
                        newPageService
                                .findNewPagesByApplicationId(application.getId(), READ_PAGES)
                                .collectList())))
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    List<NewAction> actionList = tuple.getT2().getT1();
                    List<ActionCollection> actionCollectionList = tuple.getT2().getT2();
                    List<NewPage> pageList = tuple.getT2().getT3();

                    assertThat(application.getGitApplicationMetadata()).isNull();
                    application.getPages().forEach(page -> assertThat(page.getDefaultPageId())
                            .isEqualTo(page.getId()));
                    application.getPublishedPages().forEach(page -> assertThat(page.getDefaultPageId())
                            .isEqualTo(page.getId()));

                    assertThat(pageList).isNotNull();
                    pageList.forEach(newPage -> {
                        assertThat(newPage.getBaseId()).isEqualTo(newPage.getId());
                        assertThat(newPage.getBranchName()).isNullOrEmpty();
                    });

                    assertThat(actionList).hasSize(2);
                    actionList.forEach(newAction -> {
                        assertThat(newAction.getBaseId()).isEqualTo(newAction.getId());
                        assertThat(newAction.getBranchName()).isNullOrEmpty();
                    });

                    assertThat(actionCollectionList).hasSize(1);
                    actionCollectionList.forEach(actionCollection -> {
                        assertThat(actionCollection.getBaseId()).isEqualTo(actionCollection.getId());
                        assertThat(actionCollection.getBranchName()).isNullOrEmpty();
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
        Application application1 =
                applicationPageService.createApplication(testApplication).block();

        Mono<Application> applicationMono = commonGitServiceCE
                .detachRemote(application1.getId(), ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        & throwable.getMessage().contains("Git configuration is invalid"))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void listBranchForArtifact_emptyGitMetadata_throwError() {

        Application testApplication = new Application();
        testApplication.setGitApplicationMetadata(null);
        testApplication.setName("validData_WithNonEmptyPublishedPages");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 =
                applicationPageService.createApplication(testApplication).block();

        Mono<List<GitBranchDTO>> listMono =
                commonGitServiceCE.listBranchForArtifact(application1.getId(), false, ArtifactType.APPLICATION);

        StepVerifier.create(listMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.INVALID_GIT_CONFIGURATION.getMessage(GIT_CONFIG_ERROR)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void listBranchForArtifact_applicationWithInvalidGitConfig_throwError() throws IOException {

        Mockito.when(commonGitFileUtils.checkIfDirectoryIsEmpty(any(Path.class)))
                .thenReturn(Mono.just(true));
        Mockito.when(commonGitFileUtils.initializeReadme(any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));

        Application testApplication = new Application();
        testApplication.setGitApplicationMetadata(null);
        testApplication.setName("listBranchForArtifact_GitFailure_ThrowError");
        testApplication.setWorkspaceId(workspaceId);

        Application application1 =
                applicationPageService.createApplication(testApplication).block();

        Mono<List<GitBranchDTO>> listMono =
                commonGitServiceCE.listBranchForArtifact(application1.getId(), false, ArtifactType.APPLICATION);

        StepVerifier.create(listMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.INVALID_GIT_CONFIGURATION.getMessage(GIT_CONFIG_ERROR)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void listBranchForArtifact_defaultBranchNotChangesInRemote_Success() throws IOException, GitAPIException {
        List<GitBranchDTO> branchList = List.of(
                createGitBranchDTO("defaultBranch", false),
                createGitBranchDTO("feature1", false),
                createGitBranchDTO("origin/defaultBranch", false),
                createGitBranchDTO("origin/feature1", false));

        Mockito.when(gitExecutor.listBranches(any(Path.class))).thenReturn(Mono.just(branchList));
        Mockito.when(gitExecutor.getRemoteDefaultBranch(
                        any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranch"));
        Mockito.when(gitExecutor.createAndCheckoutToBranch(any(Path.class), eq("defaultBranch")))
                .thenReturn(Mono.just("defaultBranch"));
        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranch"));
        Mockito.when(commonGitFileUtils.checkIfDirectoryIsEmpty(any(Path.class)))
                .thenReturn(Mono.just(true));
        Mockito.when(commonGitFileUtils.initializeReadme(any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));
        Mockito.when(gitExecutor.fetchRemote(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        eq(false),
                        Mockito.anyString(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("status"));

        Application application1 = createApplicationConnectedToGit(
                "listBranchForArtifact_pruneBranchNoChangesInRemote_Success", "defaultBranch");

        Mono<List<GitBranchDTO>> listMono =
                commonGitServiceCE.listBranchForArtifact(application1.getId(), true, ArtifactType.APPLICATION);

        StepVerifier.create(listMono)
                .assertNext(listBranch -> {
                    assertThat(listBranch).isEqualTo(branchList);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void listBranchForArtifact_defaultBranchChangesInRemoteExistsInDB_Success()
            throws IOException, GitAPIException {
        List<GitBranchDTO> branchList = List.of(
                createGitBranchDTO("defaultBranch", false),
                createGitBranchDTO("feature1", false),
                createGitBranchDTO("origin/defaultBranch", false),
                createGitBranchDTO("origin/feature1", false));

        Mockito.when(gitExecutor.listBranches(any(Path.class))).thenReturn(Mono.just(branchList));
        Mockito.when(gitExecutor.getRemoteDefaultBranch(
                        any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("feature1"));
        Mockito.when(gitExecutor.createAndCheckoutToBranch(any(Path.class), eq("feature1")))
                .thenReturn(Mono.just("feature1"));
        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranch"));
        Mockito.when(commonGitFileUtils.checkIfDirectoryIsEmpty(any(Path.class)))
                .thenReturn(Mono.just(true));
        Mockito.when(commonGitFileUtils.initializeReadme(any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));
        Mockito.when(gitExecutor.fetchRemote(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        eq(false),
                        Mockito.anyString(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("status"));
        Mockito.when(gitExecutor.deleteBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));

        Application application1 = createApplicationConnectedToGit(
                "listBranchForArtifact_pruneBranchWithBranchNotExistsInDB_Success", "defaultBranch");
        // Create branch
        Application application2 = createApplicationConnectedToGit(
                "listBranchForArtifact_defaultBranchChangesInRemoteExistsInDB_Success", "feature1");
        application2.getGitApplicationMetadata().setDefaultApplicationId(application1.getId());
        applicationService.save(application2).block();

        Mono<Application> applicationUpdatedMono = commonGitServiceCE
                .listBranchForArtifact(application1.getId(), true, ArtifactType.APPLICATION)
                .then(applicationService.findById(application1.getId()));

        StepVerifier.create(applicationUpdatedMono)
                .assertNext(application -> {
                    assertThat(application.getGitApplicationMetadata().getDefaultBranchName())
                            .isEqualTo("feature1");
                    assertThat(application.getGitApplicationMetadata().getRefName())
                            .isEqualTo("defaultBranch");
                })
                .verifyComplete();
    }

    private GitBranchDTO createGitBranchDTO(String branchName, boolean isDefault) {
        GitBranchDTO gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName(branchName);
        gitBranchDTO.setDefault(isDefault);
        return gitBranchDTO;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void listBranchForArtifact_defaultBranchChangesInRemoteDoesNotExistsInDB_Success()
            throws IOException, GitAPIException {
        List<GitBranchDTO> branchList = List.of(
                createGitBranchDTO("defaultBranch", false),
                createGitBranchDTO("feature1", false),
                createGitBranchDTO("origin/defaultBranch", false),
                createGitBranchDTO("origin/feature1", false));

        ApplicationJson applicationJson = createAppJson(filePath).block();
        Mockito.when(gitExecutor.createAndCheckoutToBranch(any(Path.class), eq("feature1")))
                .thenReturn(Mono.just("feature1"));
        Mockito.when(gitExecutor.listBranches(any(Path.class))).thenReturn(Mono.just(branchList));
        Mockito.when(gitExecutor.getRemoteDefaultBranch(
                        any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("feature1"));
        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranch"));
        Mockito.when(commonGitFileUtils.checkIfDirectoryIsEmpty(any(Path.class)))
                .thenReturn(Mono.just(true));
        Mockito.when(commonGitFileUtils.initializeReadme(any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));
        Mockito.when(gitExecutor.fetchRemote(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        eq(false),
                        Mockito.anyString(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("status"));
        Mockito.when(gitExecutor.checkoutRemoteBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just("feature1"));
        Mockito.when(commonGitFileUtils.reconstructArtifactExchangeJsonFromGitRepoWithAnalytics(
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.any()))
                .thenReturn(Mono.just(applicationJson));

        Application application1 = createApplicationConnectedToGit(
                "listBranchForArtifact_defaultBranchChangesInRemoteDoesNotExistsInDB_Success", "defaultBranch");

        Mono<Application> applicationUpdatedMono = commonGitServiceCE
                .listBranchForArtifact(application1.getId(), true, ArtifactType.APPLICATION)
                .then(Mono.defer(() -> applicationService.findById(application1.getId())));

        StepVerifier.create(applicationUpdatedMono)
                .assertNext(application -> {
                    assertThat(application.getGitApplicationMetadata().getDefaultBranchName())
                            .isEqualTo("feature1");
                    assertThat(application.getGitApplicationMetadata().getRefName())
                            .isEqualTo("defaultBranch");
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

        ApplicationJson applicationJson = createAppJson(filePath).block();
        applicationJson.getExportedApplication().setName("upstreamChangesAvailable_pullSuccess");

        GitStatusDTO gitStatusDTO = new GitStatusDTO();
        gitStatusDTO.setAheadCount(2);
        gitStatusDTO.setBehindCount(0);
        gitStatusDTO.setIsClean(true);

        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepo(any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("path")));
        Mockito.when(commonGitFileUtils.reconstructArtifactExchangeJsonFromGitRepoWithAnalytics(
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.any()))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(gitExecutor.pullApplication(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString()))
                .thenReturn(Mono.just(mergeStatusDTO));
        Mockito.when(gitExecutor.getStatus(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(gitStatusDTO));
        Mockito.when(gitExecutor.fetchRemote(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        eq(false),
                        Mockito.anyString(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetched"));
        Mockito.when(gitExecutor.resetToLastCommit(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));

        Mono<GitPullDTO> applicationMono =
                commonGitServiceCE.pullArtifact(application.getId(), ArtifactType.APPLICATION);

        StepVerifier.create(applicationMono)
                .assertNext(gitPullDTO -> {
                    assertThat(gitPullDTO.getMergeStatus().getStatus()).isEqualTo("2 commits pulled");
                    assertThat(gitPullDTO.getArtifact()).isNotNull();
                    assertThat(gitPullDTO.getArtifact().getId()).isEqualTo(application.getId());
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

        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepo(any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.error(new IOException("Error accessing the file System")));
        Mockito.when(commonGitFileUtils.reconstructArtifactExchangeJsonFromGitRepoWithAnalytics(
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.any()))
                .thenReturn(Mono.just(new ApplicationJson()));
        Mockito.when(gitExecutor.fetchRemote(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        eq(false),
                        Mockito.anyString(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetched"));
        Mockito.when(gitExecutor.pullApplication(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString()))
                .thenReturn(Mono.just(mergeStatusDTO));

        Mono<GitPullDTO> applicationMono =
                commonGitServiceCE.pullArtifact(application.getId(), ArtifactType.APPLICATION);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains("Error accessing the file System"))
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

        GitStatusDTO statusDTO = new GitStatusDTO();
        statusDTO.setIsClean(true);

        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepo(any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(commonGitFileUtils.reconstructArtifactExchangeJsonFromGitRepoWithAnalytics(
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.any()))
                .thenReturn(Mono.justOrEmpty(applicationJson));
        Mockito.when(gitExecutor.getStatus(any(), any())).thenReturn(Mono.just(statusDTO));
        Mockito.when(gitExecutor.fetchRemote(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyString(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.pullApplication(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString()))
                .thenReturn(Mono.just(mergeStatusDTO));
        Mockito.when(gitExecutor.resetToLastCommit(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));

        Mono<GitPullDTO> applicationMono =
                commonGitServiceCE.pullArtifact(application.getId(), ArtifactType.APPLICATION);

        StepVerifier.create(applicationMono)
                .assertNext(gitPullDTO -> {
                    assertThat(gitPullDTO.getMergeStatus().getStatus())
                            .isEqualTo("Nothing to fetch from remote. All changes are upto date.");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void isBranchMergeable_nonConflictingChanges_canBeMerged() throws IOException, GitAPIException {

        Application application = createApplicationConnectedToGit("noConflictsApp", "main");
        Application application1 = createApplicationConnectedToGit("noConflictsApp", "branchWithNoConflicts");
        GitArtifactMetadata gitArtifactMetadata = application1.getGitApplicationMetadata();
        gitArtifactMetadata.setDefaultApplicationId(application.getId());
        gitArtifactMetadata.setGitAuth(null);
        application1 = applicationService.save(application1).block();

        GitMergeDTO gitMergeDTO = new GitMergeDTO();
        gitMergeDTO.setSourceBranch(application1.getGitApplicationMetadata().getRefName());
        gitMergeDTO.setDestinationBranch(application.getGitApplicationMetadata().getRefName());

        MergeStatusDTO mergeStatus = new MergeStatusDTO();
        mergeStatus.setMergeAble(true);

        GitStatusDTO gitStatusDTO = new GitStatusDTO();
        gitStatusDTO.setAheadCount(0);
        gitStatusDTO.setBehindCount(0);
        gitStatusDTO.setIsClean(true);

        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepo(any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.isMergeBranch(any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(mergeStatus));
        Mockito.when(gitExecutor.getStatus(any(), any())).thenReturn(Mono.just(gitStatusDTO));
        Mockito.when(gitExecutor.fetchRemote(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyString(),
                        Mockito.anyString()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.resetToLastCommit(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                        any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));

        Mono<MergeStatusDTO> applicationMono =
                commonGitServiceCE.isBranchMergeable(application.getId(), gitMergeDTO, ArtifactType.APPLICATION);

        StepVerifier.create(applicationMono)
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
        gitMergeDTO.setSourceBranch(application.getGitApplicationMetadata().getRefName());
        gitMergeDTO.setDestinationBranch(DEFAULT_BRANCH);

        MergeStatusDTO mergeStatus = new MergeStatusDTO();
        mergeStatus.setMergeAble(false);

        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                        any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.isMergeBranch(any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(mergeStatus));
        Mockito.when(gitExecutor.getStatus(any(), any())).thenReturn(Mono.just(new GitStatusDTO()));
        Mockito.when(gitExecutor.fetchRemote(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyString(),
                        Mockito.anyString()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.resetToLastCommit(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(Boolean.FALSE));
        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                        any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));

        Mono<MergeStatusDTO> applicationMono =
                commonGitServiceCE.isBranchMergeable(application.getId(), gitMergeDTO, ArtifactType.APPLICATION);

        StepVerifier.create(applicationMono)
                .assertNext(s -> {
                    assertThat(s.isMergeAble()).isFalse();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void isBranchMergeable_remoteAhead_remoteAheadErrorMessage() throws IOException, GitAPIException {

        Application application1 =
                createApplicationConnectedToGit(gitConnectedApplication.getName(), "upstreamChangesBeforeMerge");
        GitArtifactMetadata gitArtifactMetadata = application1.getGitApplicationMetadata();
        gitArtifactMetadata.setDefaultApplicationId(gitConnectedApplication.getId());
        application1.setGitApplicationMetadata(gitArtifactMetadata);
        applicationService.save(application1).block();

        GitMergeDTO gitMergeDTO = new GitMergeDTO();
        gitMergeDTO.setSourceBranch(application1.getGitApplicationMetadata().getRefName());
        gitMergeDTO.setDestinationBranch(DEFAULT_BRANCH);

        GitStatusDTO gitStatusDTO = new GitStatusDTO();
        gitStatusDTO.setAheadCount(2);

        MergeStatusDTO mergeStatus = new MergeStatusDTO();
        mergeStatus.setMergeAble(false);

        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepo(any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("path")));
        Mockito.when(gitExecutor.isMergeBranch(any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(mergeStatus));
        Mockito.when(gitExecutor.getStatus(any(), any())).thenReturn(Mono.just(gitStatusDTO));
        Mockito.when(gitExecutor.fetchRemote(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyString(),
                        Mockito.anyString()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.resetToLastCommit(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(Boolean.FALSE));
        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                        any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));

        Mono<MergeStatusDTO> applicationMono = commonGitServiceCE.isBranchMergeable(
                gitConnectedApplication.getId(), gitMergeDTO, ArtifactType.APPLICATION);

        StepVerifier.create(applicationMono)
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

        Mono<MergeStatusDTO> applicationMono = commonGitServiceCE.isBranchMergeable(
                gitConnectedApplication.getId(), gitMergeDTO, ArtifactType.APPLICATION);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains("origin/branch2"))
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

        Mockito.when(gitExecutor.fetchRemote(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyString(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.checkoutRemoteBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just("testBranch"));
        Mockito.when(commonGitFileUtils.reconstructArtifactExchangeJsonFromGitRepoWithAnalytics(
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.any()))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(gitExecutor.listBranches(any())).thenReturn(Mono.just(branchList));

        Mono<Application> applicationMono = commonGitServiceCE
                .checkoutBranch(
                        gitConnectedApplication.getId(), "origin/branchNotInLocal", true, ArtifactType.APPLICATION)
                .flatMap(application1 -> applicationService.findByBranchNameAndBaseApplicationId(
                        "branchNotInLocal", gitConnectedApplication.getId(), READ_APPLICATIONS));

        StepVerifier.create(applicationMono)
                .assertNext(application1 -> {
                    assertThat(application1.getGitApplicationMetadata().getRefName())
                            .isEqualTo("branchNotInLocal");
                    assertThat(application1.getGitApplicationMetadata().getDefaultArtifactId())
                            .isEqualTo(gitConnectedApplication.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void checkoutRemoteBranch_CustomThemeSetToDefaultAppAndRemoteBranch_AppAndThemesCreated() {
        ApplicationJson applicationJson = createAppJson(filePath).block();
        // set custom theme to the json
        String customThemeName = "Custom theme";
        Theme editModeCustomTheme = new Theme();
        Theme viewModeCustomTheme = new Theme();
        editModeCustomTheme.setSystemTheme(false);
        editModeCustomTheme.setName(customThemeName);
        editModeCustomTheme.setDisplayName("Edit mode " + customThemeName);

        viewModeCustomTheme.setSystemTheme(false);
        viewModeCustomTheme.setName(customThemeName);
        viewModeCustomTheme.setDisplayName("View mode " + customThemeName);

        applicationJson.setEditModeTheme(editModeCustomTheme);
        applicationJson.setPublishedTheme(viewModeCustomTheme);

        List<GitBranchDTO> branchList = new ArrayList<>();
        GitBranchDTO gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName("branchInLocal2");
        branchList.add(gitBranchDTO);
        gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName("origin/branchInLocal2");
        branchList.add(gitBranchDTO);

        Mockito.when(gitExecutor.fetchRemote(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyString(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.checkoutRemoteBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just("testBranch"));
        Mockito.when(commonGitFileUtils.reconstructArtifactExchangeJsonFromGitRepoWithAnalytics(
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.any()))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(gitExecutor.listBranches(any())).thenReturn(Mono.just(branchList));

        // set custom theme to the git connected application
        Theme customTheme = themeService
                .getSystemTheme(Theme.DEFAULT_THEME_NAME)
                .flatMap(systemTheme -> {
                    // we'll create a custom theme by copying properties from the system theme
                    Theme theme = new Theme();
                    copyNestedNonNullProperties(systemTheme, theme);
                    theme.setSystemTheme(false);
                    theme.setId(null);
                    return themeService.save(theme);
                })
                .flatMap(savedCustomTheme -> {
                    gitConnectedApplication.setEditModeThemeId(savedCustomTheme.getId());
                    gitConnectedApplication.setPublishedModeThemeId(savedCustomTheme.getId());
                    return applicationService.save(gitConnectedApplication).thenReturn(savedCustomTheme);
                })
                .block();

        Mono<Tuple4<Theme, Application, Theme, Theme>> resultMono = commonGitServiceCE
                .checkoutBranch(
                        gitConnectedApplication.getId(), "origin/branchNotInLocal2", true, ArtifactType.APPLICATION)
                .flatMap(checkedOutArtifact -> applicationService.findByBranchNameAndBaseApplicationId(
                        "branchNotInLocal2", gitConnectedApplication.getId(), READ_APPLICATIONS))
                .flatMap(application -> {
                    Mono<Theme> defaultAppTheme = Mono.just(customTheme);
                    Mono<Application> branchedAppMono = Mono.just(application);
                    Mono<Theme> editThemeMono = themeService.getApplicationTheme(
                            gitConnectedApplication.getId(), ApplicationMode.EDIT, "branchNotInLocal2");
                    Mono<Theme> publishedThemeMono = themeService.getApplicationTheme(
                            gitConnectedApplication.getId(), ApplicationMode.PUBLISHED, "branchNotInLocal2");
                    return Mono.zip(defaultAppTheme, branchedAppMono, editThemeMono, publishedThemeMono);
                });

        StepVerifier.create(resultMono)
                .assertNext(objects -> {
                    Theme themeInDefaultApp = objects.getT1();
                    Application branchedApp = objects.getT2();
                    Theme editModeThemeInBranchedApp = objects.getT3();
                    Theme viewModeThemeInBranchedApp = objects.getT4();

                    // themes in branched app should be different from theme in default application
                    assertThat(branchedApp.getEditModeThemeId()).isNotEqualTo(themeInDefaultApp.getId());
                    assertThat(branchedApp.getPublishedModeThemeId()).isNotEqualTo(themeInDefaultApp.getId());
                    // view mode and edit mode should have two different copies
                    assertThat(editModeThemeInBranchedApp.getId()).isNotEqualTo(viewModeThemeInBranchedApp.getId());
                    // none of themes should be system theme
                    assertThat(editModeThemeInBranchedApp.isSystemTheme()).isFalse();
                    assertThat(viewModeThemeInBranchedApp.isSystemTheme()).isFalse();
                    // names should be same as the name from the application JSON
                    assertThat(editModeThemeInBranchedApp.getDisplayName())
                            .isEqualTo(editModeCustomTheme.getDisplayName());
                    // While checking out from remote, it's also published.
                    // When published, the resources are copied from unpublished field to published filed.
                    assertThat(viewModeThemeInBranchedApp.getDisplayName())
                            .isEqualTo(editModeCustomTheme.getDisplayName());
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

        Mockito.when(gitExecutor.listBranches(any())).thenReturn(Mono.just(branchList));
        Mockito.when(gitExecutor.fetchRemote(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyString(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));

        Mono<Application> applicationMono = commonGitServiceCE
                .checkoutBranch(gitConnectedApplication.getId(), "origin/branchInLocal", true, ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.GIT_ACTION_FAILED.getMessage(
                                        "checkout", "origin/branchInLocal already exists in local - branchInLocal")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void checkoutBranch_branchNotProvided_throwInvalidParameterError() {
        Mono<Application> applicationMono = commonGitServiceCE
                .checkoutBranch(gitConnectedApplication.getId(), null, true, ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.BRANCH_NAME)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void commitArtifact_noChangesInLocal_emptyCommitMessage() throws GitAPIException, IOException {

        GitCommitDTO commitDTO = new GitCommitDTO();
        commitDTO.setDoPush(false);
        commitDTO.setCommitMessage("empty commit");

        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                        any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.commitArtifact(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.error(new EmptyCommitException("nothing to commit")));

        Mono<String> commitMono =
                commonGitServiceCE.commitArtifact(commitDTO, gitConnectedApplication.getId(), ArtifactType.APPLICATION);

        StepVerifier.create(commitMono)
                .assertNext(commitMsg -> {
                    assertThat(commitMsg).contains(EMPTY_COMMIT_ERROR_MESSAGE);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void commitArtifact_applicationNotConnectedToGit_throwInvalidGitConfigException() {

        Application application = new Application();
        application.setName("sampleAppNotConnectedToGit");
        application.setWorkspaceId(workspaceId);
        application.setId(null);
        application = applicationPageService.createApplication(application).block();

        GitCommitDTO commitDTO = new GitCommitDTO();
        commitDTO.setDoPush(false);
        commitDTO.setCommitMessage("empty commit");

        Mono<String> commitMono =
                commonGitServiceCE.commitArtifact(commitDTO, application.getId(), ArtifactType.APPLICATION);

        StepVerifier.create(commitMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.INVALID_GIT_CONFIGURATION.getMessage(GIT_CONFIG_ERROR)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void commitArtifact_localRepoNotAvailable_throwRepoNotFoundException() throws GitAPIException, IOException {

        GitCommitDTO commitDTO = new GitCommitDTO();
        commitDTO.setDoPush(false);
        commitDTO.setCommitMessage("empty commit");

        Mono<String> commitMono =
                commonGitServiceCE.commitArtifact(commitDTO, gitConnectedApplication.getId(), ArtifactType.APPLICATION);

        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                        any(Path.class), any(), Mockito.anyString()))
                .thenReturn(
                        Mono.error(new RepositoryNotFoundException(AppsmithError.REPOSITORY_NOT_FOUND.getMessage())));

        StepVerifier.create(commitMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .contains(
                                        AppsmithError.REPOSITORY_NOT_FOUND.getMessage(gitConnectedApplication.getId())))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void commitArtifact_commitChanges_success() throws GitAPIException, IOException {

        GitCommitDTO commitDTO = new GitCommitDTO();
        commitDTO.setDoPush(false);
        commitDTO.setCommitMessage("commit message");

        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                        any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.commitArtifact(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("sample response for commit"));

        Mono<String> commitMono =
                commonGitServiceCE.commitArtifact(commitDTO, gitConnectedApplication.getId(), ArtifactType.APPLICATION);

        StepVerifier.create(commitMono)
                .assertNext(commitMsg -> {
                    assertThat(commitMsg).contains("sample response for commit");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void commitArtifact_BranchIsProtected_Failure() throws GitAPIException, IOException {
        GitCommitDTO commitDTO = new GitCommitDTO();
        commitDTO.setDoPush(false);
        commitDTO.setCommitMessage("commit message");

        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                        any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.commitArtifact(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("sample response for commit"));

        Mono<String> commitMono = commonGitServiceCE
                .updateProtectedBranches(
                        gitConnectedApplication.getId(), List.of(DEFAULT_BRANCH), ArtifactType.APPLICATION)
                .then(commonGitServiceCE.commitArtifact(
                        commitDTO, gitConnectedApplication.getId(), ArtifactType.APPLICATION));

        StepVerifier.create(commitMono).verifyError();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void commitAndPushApplication_commitAndPushChanges_success() throws GitAPIException, IOException {

        GitCommitDTO commitDTO = new GitCommitDTO();
        commitDTO.setDoPush(true);
        commitDTO.setCommitMessage("commit message");

        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                        any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.commitArtifact(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("sample response for commit"));
        Mockito.when(gitExecutor.checkoutToBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString()))
                .thenReturn(Mono.just("pushed successfully"));

        Mono<String> commitAndPushMono =
                commonGitServiceCE.commitArtifact(commitDTO, gitConnectedApplication.getId(), ArtifactType.APPLICATION);

        StepVerifier.create(commitAndPushMono.zipWhen(
                        status -> applicationService.findByBranchedId(gitConnectedApplication.getId(), null)))
                .assertNext(tuple -> {
                    String commitMsg = tuple.getT1();
                    Application application = tuple.getT2();
                    assertThat(commitMsg).contains("sample response for commit");
                    assertThat(commitMsg).contains("pushed successfully");
                    assertThat(application.getClientSchemaVersion()).isEqualTo(jsonSchemaVersions.getClientVersion());
                    assertThat(application.getServerSchemaVersion()).isEqualTo(jsonSchemaVersions.getServerVersion());
                    assertThat(application.getIsManualUpdate()).isFalse();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void commitAndPushApplication_noChangesToCommitWithLocalCommitsToPush_pushSuccess()
            throws GitAPIException, IOException {

        GitCommitDTO commitDTO = new GitCommitDTO();
        commitDTO.setDoPush(true);
        commitDTO.setCommitMessage("empty commit");

        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                        any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.commitArtifact(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.error(new EmptyCommitException("nothing to commit")));
        Mockito.when(gitExecutor.checkoutToBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString()))
                .thenReturn(Mono.just("pushed successfully"));

        Mono<String> commitAndPushMono =
                commonGitServiceCE.commitArtifact(commitDTO, gitConnectedApplication.getId(), ArtifactType.APPLICATION);

        StepVerifier.create(commitAndPushMono)
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
    public void commitArtifact_pushFails_verifyAppNotPublished_throwUpstreamChangesFoundException()
            throws GitAPIException, IOException {

        // Create and fetch the application state before adding new page
        Application testApplication =
                createApplicationConnectedToGit("gitConnectedPushFailApplication", DEFAULT_BRANCH);
        Application preCommitApplication = applicationService
                .getApplicationByBaseApplicationIdAndDefaultBranch(testApplication.getId())
                .block();

        // Creating a new page to commit to git
        PageDTO testPage = new PageDTO();
        testPage.setName("GitServiceTestPageGitPushFail");
        testPage.setApplicationId(preCommitApplication.getId());
        PageDTO createdPage = applicationPageService.createPage(testPage).block();

        GitCommitDTO commitDTO = new GitCommitDTO();
        commitDTO.setDoPush(true);
        commitDTO.setCommitMessage("New page added");
        Mono<String> commitMono =
                commonGitServiceCE.commitArtifact(commitDTO, preCommitApplication.getId(), ArtifactType.APPLICATION);

        Mono<Application> committedApplicationMono =
                applicationService.getApplicationByBaseApplicationIdAndDefaultBranch(preCommitApplication.getId());

        // Mocking a git push failure
        Mockito.when(gitExecutor.pushApplication(any(), any(), any(), any(), any()))
                .thenReturn(Mono.error(new AppsmithException(AppsmithError.GIT_UPSTREAM_CHANGES)));

        StepVerifier.create(commitMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals((new AppsmithException(
                                                AppsmithError.GIT_ACTION_FAILED,
                                                "push",
                                                AppsmithError.GIT_UPSTREAM_CHANGES.getMessage()))
                                        .getMessage()))
                .verify();

        StepVerifier.create(committedApplicationMono)
                .assertNext(application -> {
                    List<ApplicationPage> publishedPages = application.getPublishedPages();
                    assertThat(application.getPublishedPages())
                            .hasSize(preCommitApplication.getPublishedPages().size());
                    publishedPages.forEach(publishedPage -> {
                        assertThat(publishedPage.getId().equals(createdPage.getId()))
                                .isFalse();
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void commitArtifact_protectedBranch_pushFails() throws GitAPIException, IOException {
        // Create and fetch the application state before adding new page
        Application testApplication =
                createApplicationConnectedToGit("commitApplication_protectedBranch_pushFails", DEFAULT_BRANCH);
        Application preCommitApplication = applicationService
                .getApplicationByBaseApplicationIdAndDefaultBranch(testApplication.getId())
                .block();

        // Creating a new page to commit to git
        PageDTO testPage = new PageDTO();
        testPage.setName("GitServiceTestPageGitPushFail");
        testPage.setApplicationId(preCommitApplication.getId());
        PageDTO createdPage = applicationPageService.createPage(testPage).block();

        GitCommitDTO commitDTO = new GitCommitDTO();
        commitDTO.setDoPush(true);
        commitDTO.setCommitMessage("New page added");
        Mono<String> commitMono =
                commonGitServiceCE.commitArtifact(commitDTO, preCommitApplication.getId(), ArtifactType.APPLICATION);

        // Mocking a git push failure
        Mockito.when(gitExecutor.pushApplication(any(), any(), any(), any(), any()))
                .thenReturn(Mono.just("REJECTED_OTHERREASON, pre-receive hook declined"));
        Mockito.when(gitExecutor.resetHard(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));

        StepVerifier.create(commitMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .contains((new AppsmithException(
                                                AppsmithError.GIT_ACTION_FAILED,
                                                "push",
                                                "Unable to push changes as pre-receive hook declined. Please make sure that you don't have any rules enabled on the branch "))
                                        .getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createBranch_branchWithOriginPrefix_throwUnsupportedException() {

        GitBranchDTO createGitBranchDTO = new GitBranchDTO();
        createGitBranchDTO.setBranchName("origin/createNewBranch");

        Mono<Application> createBranchMono = commonGitServiceCE
                .createBranch(gitConnectedApplication.getId(), createGitBranchDTO, ArtifactType.APPLICATION)
                .map(baseArtifact -> (Application) baseArtifact);

        StepVerifier.create(createBranchMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
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

        Mockito.when(gitExecutor.checkoutToBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.fetchRemote(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyString(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.listBranches(any())).thenReturn(Mono.just(branchList));
        Mono<Application> createBranchMono = commonGitServiceCE
                .createBranch(gitConnectedApplication.getId(), createGitBranchDTO, ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(createBranchMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .contains(AppsmithError.DUPLICATE_KEY_USER_ERROR.getMessage(
                                        "remotes/origin/" + createGitBranchDTO.getBranchName(), FieldName.BRANCH_NAME)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createBranch_validCreateBranchRequest_newApplicationCreated() throws GitAPIException, IOException {

        GitBranchDTO createGitBranchDTO = new GitBranchDTO();
        createGitBranchDTO.setBranchName("valid_branch");

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);

        Mockito.when(gitExecutor.checkoutToBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.fetchRemote(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyString(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.listBranches(any())).thenReturn(Mono.just(new ArrayList<>()));
        Mockito.when(gitExecutor.createAndCheckoutToBranch(any(), any()))
                .thenReturn(Mono.just(createGitBranchDTO.getBranchName()));
        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                        any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.commitArtifact(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("System generated commit"));
        Mockito.when(gitExecutor.checkoutToBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString()))
                .thenReturn(Mono.just("pushed successfully"));

        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(DEFAULT_BRANCH));
        Mockito.when(commonGitFileUtils.checkIfDirectoryIsEmpty(any(Path.class)))
                .thenReturn(Mono.just(true));
        Mockito.when(commonGitFileUtils.initializeReadme(any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));

        Application testApplication = new Application();
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitArtifactMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        testApplication.setName("validAppWithActionAndActionCollection");
        testApplication.setWorkspaceId(workspaceId);

        Mono<Application> createBranchMono = applicationPageService
                .createApplication(testApplication)
                .flatMap(application -> Mono.zip(
                        Mono.just(application),
                        pluginRepository.findByPackageName("installed-plugin"),
                        newPageService.findPageById(
                                application.getPages().get(0).getId(), READ_PAGES, false)))
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
                        parentDsl = new JSONObject(objectMapper.readValue(
                                DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {}));
                    } catch (JsonProcessingException e) {
                        log.debug(String.valueOf(e));
                    }

                    ArrayList children = (ArrayList) parentDsl.get("children");
                    JSONObject testWidget = new JSONObject();
                    testWidget.put("widgetName", "firstWidget");
                    JSONArray temp = new JSONArray();
                    temp.add(new JSONObject(Map.of("key", "testField")));
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
                                    layoutActionService
                                            .createSingleAction(action)
                                            .then(updateLayoutService.updateLayout(
                                                    testPage.getId(),
                                                    testPage.getApplicationId(),
                                                    layout.getId(),
                                                    layout)),
                                    layoutCollectionService.createCollection(actionCollectionDTO))
                            .then(commonGitServiceCE.connectArtifactToGit(
                                    application.getId(), gitConnectDTO, "origin", ArtifactType.APPLICATION))
                            .map(artifact -> (Application) artifact);
                })
                .flatMap(application -> commonGitServiceCE
                        .createBranch(application.getId(), createGitBranchDTO, ArtifactType.APPLICATION)
                        .then(applicationService.findByBranchNameAndBaseApplicationId(
                                createGitBranchDTO.getBranchName(), application.getId(), READ_APPLICATIONS)));

        StepVerifier.create(createBranchMono.zipWhen(application -> Mono.zip(
                        newActionService
                                .findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null)
                                .collectList(),
                        actionCollectionService
                                .findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null)
                                .collectList(),
                        newPageService
                                .findNewPagesByApplicationId(application.getId(), READ_PAGES)
                                .collectList(),
                        applicationService.findById(
                                application.getGitApplicationMetadata().getDefaultArtifactId()))))
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    List<NewAction> actionList = tuple.getT2().getT1();
                    List<ActionCollection> actionCollectionList = tuple.getT2().getT2();
                    List<NewPage> pageList = tuple.getT2().getT3();
                    Application parentApplication = tuple.getT2().getT4();

                    GitArtifactMetadata gitData = application.getGitApplicationMetadata();
                    assertThat(application).isNotNull();
                    assertThat(application.getId()).isNotEqualTo(gitData.getDefaultArtifactId());
                    assertThat(gitData.getDefaultArtifactId()).isEqualTo(parentApplication.getId());
                    assertThat(gitData.getRefName()).isEqualTo(createGitBranchDTO.getBranchName());
                    assertThat(gitData.getDefaultBranchName()).isNotEmpty();
                    assertThat(gitData.getRemoteUrl()).isNotEmpty();
                    assertThat(gitData.getBrowserSupportedRemoteUrl()).isNotEmpty();
                    assertThat(gitData.getRepoName()).isNotEmpty();
                    assertThat(gitData.getGitAuth()).isNull();
                    assertThat(gitData.getIsRepoPrivate()).isNull();

                    application.getPages().forEach(page -> assertThat(page.getDefaultPageId())
                            .isNotEqualTo(page.getId()));
                    application.getPublishedPages().forEach(page -> assertThat(page.getDefaultPageId())
                            .isNotEqualTo(page.getId()));

                    assertThat(pageList).isNotNull();
                    pageList.forEach(newPage -> {
                        assertThat(newPage.getBaseId()).isNotEqualTo(newPage.getId());
                        assertThat(newPage.getBranchName()).isEqualTo(createGitBranchDTO.getBranchName());
                    });

                    assertThat(actionList).hasSize(2);
                    actionList.forEach(newAction -> {
                        assertThat(newAction.getBaseId()).isNotEqualTo(newAction.getId());
                        assertThat(newAction.getBranchName()).isEqualTo(createGitBranchDTO.getBranchName());
                    });

                    assertThat(actionCollectionList).hasSize(1);
                    actionCollectionList.forEach(actionCollection -> {
                        assertThat(actionCollection.getBaseId()).isNotEqualTo(actionCollection.getId());
                        assertThat(actionCollection.getBranchName()).isEqualTo(createGitBranchDTO.getBranchName());
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createBranch_SrcHasCustomTheme_newApplicationCreatedWithThemesCopied()
            throws GitAPIException, IOException {
        GitBranchDTO createGitBranchDTO = new GitBranchDTO();
        createGitBranchDTO.setBranchName("valid_branch");

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);

        Mockito.when(gitExecutor.checkoutToBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.fetchRemote(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyString(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.listBranches(any())).thenReturn(Mono.just(new ArrayList<>()));
        Mockito.when(gitExecutor.createAndCheckoutToBranch(any(), any()))
                .thenReturn(Mono.just(createGitBranchDTO.getBranchName()));
        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                        any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.commitArtifact(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("System generated commit"));
        Mockito.when(gitExecutor.checkoutToBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString()))
                .thenReturn(Mono.just("pushed successfully"));

        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(DEFAULT_BRANCH));
        Mockito.when(commonGitFileUtils.checkIfDirectoryIsEmpty(any(Path.class)))
                .thenReturn(Mono.just(true));
        Mockito.when(commonGitFileUtils.initializeReadme(any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));
        Mockito.when(commonGitFileUtils.deleteLocalRepo(any(Path.class))).thenReturn(Mono.just(true));

        Application testApplication = new Application();
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitArtifactMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        testApplication.setName("Test App" + UUID.randomUUID());
        testApplication.setWorkspaceId(workspaceId);

        Mono<Tuple2<Application, Application>> createBranchMono = applicationPageService
                .createApplication(testApplication)
                .flatMap(application -> Mono.zip(
                        Mono.just(application),
                        pluginRepository.findByPackageName("installed-plugin"),
                        newPageService.findPageById(
                                application.getPages().get(0).getId(), READ_PAGES, false)))
                .flatMap(tuple -> {
                    Application application = tuple.getT1();
                    // customize the theme for this application
                    return themeService
                            .getSystemTheme(Theme.DEFAULT_THEME_NAME)
                            .flatMap(theme -> {
                                theme.setId(null);
                                theme.setName("Custom theme");
                                return themeService.updateTheme(application.getId(), theme);
                            })
                            .then(commonGitServiceCE.connectArtifactToGit(
                                    application.getId(), gitConnectDTO, "origin", ArtifactType.APPLICATION))
                            .map(artifact -> (Application) artifact);
                })
                .flatMap(application -> commonGitServiceCE
                        .createBranch(application.getId(), createGitBranchDTO, ArtifactType.APPLICATION)
                        .then(applicationService.findByBranchNameAndBaseApplicationId(
                                createGitBranchDTO.getBranchName(), application.getId(), READ_APPLICATIONS)))
                .zipWhen(application -> applicationService.findById(
                        application.getGitApplicationMetadata().getDefaultArtifactId()));

        StepVerifier.create(createBranchMono)
                .assertNext(tuple -> {
                    Application srcApp = tuple.getT1();
                    Application branchedApp = tuple.getT2();
                    assertThat(srcApp.getEditModeThemeId()).isNotEqualTo(branchedApp.getEditModeThemeId());
                    assertThat(srcApp.getPublishedModeThemeId()).isNotEqualTo(branchedApp.getPublishedModeThemeId());
                })
                .verifyComplete();
    }

    private void mockitoSetUp(GitBranchDTO createGitBranchDTO) throws GitAPIException, IOException {
        Mockito.when(gitExecutor.checkoutToBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.fetchRemote(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyString(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.listBranches(any())).thenReturn(Mono.just(new ArrayList<>()));
        Mockito.when(gitExecutor.createAndCheckoutToBranch(any(), any()))
                .thenReturn(Mono.just(createGitBranchDTO.getBranchName()));
        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                        any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.commitArtifact(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("System generated commit"));
        Mockito.when(gitExecutor.checkoutToBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString()))
                .thenReturn(Mono.just("pushed successfully"));

        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(DEFAULT_BRANCH));
        Mockito.when(commonGitFileUtils.checkIfDirectoryIsEmpty(any(Path.class)))
                .thenReturn(Mono.just(true));
        Mockito.when(commonGitFileUtils.initializeReadme(any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createBranch_BranchHasCustomApplicationSettings_SrcBranchRemainsUnchanged()
            throws GitAPIException, IOException {
        GitBranchDTO createGitBranchDTO = new GitBranchDTO();
        createGitBranchDTO.setBranchName("valid_branch");

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        mockitoSetUp(createGitBranchDTO);

        Application testApplication = new Application();
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitArtifactMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        testApplication.setName("Test App" + UUID.randomUUID());
        testApplication.setWorkspaceId(workspaceId);

        Mono<Tuple2<Application, Application>> createBranchMono = applicationPageService
                .createApplication(testApplication)
                .flatMap(application -> commonGitServiceCE.connectArtifactToGit(
                        application.getId(), gitConnectDTO, "origin", ArtifactType.APPLICATION))
                .flatMap(application -> commonGitServiceCE
                        .createBranch(application.getId(), createGitBranchDTO, ArtifactType.APPLICATION)
                        .then(applicationService.findByBranchNameAndBaseApplicationId(
                                createGitBranchDTO.getBranchName(), application.getId(), READ_APPLICATIONS)))
                .flatMap(branchedApplication -> {
                    Application.NavigationSetting appNavigationSetting = new Application.NavigationSetting();
                    appNavigationSetting.setOrientation("top");
                    branchedApplication.setUnpublishedApplicationDetail(new ApplicationDetail());
                    branchedApplication.getUnpublishedApplicationDetail().setNavigationSetting(appNavigationSetting);

                    Application.ThemeSetting themeSettings = new Application.ThemeSetting();
                    themeSettings.setSizing(1);
                    themeSettings.setDensity(1);
                    themeSettings.setBorderRadius("#000000");
                    themeSettings.setAccentColor("#FFFFFF");
                    themeSettings.setFontFamily("#000000");
                    themeSettings.setColorMode(Application.ThemeSetting.Type.LIGHT);
                    themeSettings.setIconStyle(Application.ThemeSetting.IconStyle.OUTLINED);
                    themeSettings.setAppMaxWidth(Application.ThemeSetting.AppMaxWidth.LARGE);
                    branchedApplication.getUnpublishedApplicationDetail().setThemeSetting(themeSettings);
                    return Mono.just(branchedApplication);
                })
                .flatMap(branchedApplication -> applicationService.updateApplicationWithPresets(
                        branchedApplication.getId(), branchedApplication))
                .zipWhen(application -> applicationService.findById(
                        application.getGitApplicationMetadata().getDefaultArtifactId()));

        StepVerifier.create(createBranchMono)
                .assertNext(tuple -> {
                    Application branchedApp = tuple.getT1();
                    Application srcApp = tuple.getT2();
                    assertThat(branchedApp
                                    .getUnpublishedApplicationDetail()
                                    .getNavigationSetting()
                                    .getOrientation())
                            .isEqualTo("top");
                    assertThat(srcApp.getUnpublishedApplicationDetail()).isNull();
                    Application.ThemeSetting themes =
                            branchedApp.getApplicationDetail().getThemeSetting();
                    assertThat(themes.getAccentColor()).isEqualTo("#FFFFFF");
                    assertThat(themes.getBorderRadius()).isEqualTo("#000000");
                    assertThat(themes.getColorMode()).isEqualTo(Application.ThemeSetting.Type.LIGHT);
                    assertThat(themes.getDensity()).isEqualTo(1);
                    assertThat(themes.getFontFamily()).isEqualTo("#000000");
                    assertThat(themes.getSizing()).isEqualTo(1);
                    assertThat(themes.getIconStyle()).isEqualTo(Application.ThemeSetting.IconStyle.OUTLINED);
                    assertThat(themes.getAppMaxWidth()).isEqualTo(Application.ThemeSetting.AppMaxWidth.LARGE);
                })
                .verifyComplete();
    }

    private FilePart createMockFilePart() {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils.read(
                        new ClassPathResource("test_assets/WorkspaceServiceTest/my_workspace_logo.png"),
                        new DefaultDataBufferFactory(),
                        4096)
                .cache();
        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.IMAGE_PNG);
        return filepart;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createBranch_BranchUploadLogo_SrcBranchRemainsUnchanged() throws GitAPIException, IOException {
        GitBranchDTO createGitBranchDTO = new GitBranchDTO();
        createGitBranchDTO.setBranchName("valid_branch");

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        mockitoSetUp(createGitBranchDTO);

        Application testApplication = new Application();
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitArtifactMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        testApplication.setName("Test App" + UUID.randomUUID());
        testApplication.setWorkspaceId(workspaceId);

        Mono<Tuple2<Application, Application>> createBranchMono = applicationPageService
                .createApplication(testApplication)
                .flatMap(application -> commonGitServiceCE.connectArtifactToGit(
                        application.getId(), gitConnectDTO, "origin", ArtifactType.APPLICATION))
                .flatMap(application -> commonGitServiceCE
                        .createBranch(application.getId(), createGitBranchDTO, ArtifactType.APPLICATION)
                        .map(artifact -> {
                            return artifact;
                        })
                        .then(applicationService.findByBranchNameAndBaseApplicationId(
                                createGitBranchDTO.getBranchName(), application.getId(), READ_APPLICATIONS)))
                .flatMap(branchedApplication -> {
                    FilePart filepart = createMockFilePart();
                    return applicationService
                            .saveAppNavigationLogo(branchedApplication.getId(), filepart)
                            .cache();
                })
                .zipWhen(application -> applicationService.findById(
                        application.getGitApplicationMetadata().getDefaultArtifactId()));

        StepVerifier.create(createBranchMono)
                .assertNext(tuple -> {
                    Application branchedApp = tuple.getT1();
                    Application srcApp = tuple.getT2();
                    assertThat(branchedApp.getUnpublishedApplicationDetail().getNavigationSetting())
                            .isNotNull();
                    assertThat(branchedApp
                                    .getUnpublishedApplicationDetail()
                                    .getNavigationSetting()
                                    .getLogoAssetId())
                            .isNotNull();
                    assertThat(srcApp.getUnpublishedApplicationDetail()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createBranch_BranchDeleteLogo_SrcLogoRemainsUnchanged() throws GitAPIException, IOException {
        GitBranchDTO createGitBranchDTO = new GitBranchDTO();
        createGitBranchDTO.setBranchName("valid_branch");

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        mockitoSetUp(createGitBranchDTO);

        Application testApplication = new Application();
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitArtifactMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        testApplication.setName("Test App" + UUID.randomUUID());
        testApplication.setWorkspaceId(workspaceId);

        Mono<Tuple2<Application, Application>> createBranchMono = applicationPageService
                .createApplication(testApplication)
                .flatMap(application -> commonGitServiceCE.connectArtifactToGit(
                        application.getId(), gitConnectDTO, "origin", ArtifactType.APPLICATION))
                .map(artifact -> (Application) artifact)
                .flatMap(application -> Mono.zip(
                        commonGitServiceCE
                                .createBranch(application.getId(), createGitBranchDTO, ArtifactType.APPLICATION)
                                .then(applicationService.findByBranchNameAndBaseApplicationId(
                                        createGitBranchDTO.getBranchName(), application.getId(), READ_APPLICATIONS)),
                        Mono.just(application)))
                .flatMap(applicationTuple -> {
                    Application branchedApplication = applicationTuple.getT1();
                    Application application = applicationTuple.getT2();
                    String srcBranchName =
                            application.getGitApplicationMetadata().getRefName();
                    String otherBranchName =
                            branchedApplication.getGitApplicationMetadata().getRefName();
                    String defaultApplicationId =
                            branchedApplication.getGitApplicationMetadata().getDefaultArtifactId();

                    FilePart filepart = createMockFilePart();
                    return Mono.zip(
                            applicationService
                                    .saveAppNavigationLogo(branchedApplication.getId(), filepart)
                                    .cache(),
                            applicationService
                                    .saveAppNavigationLogo(defaultApplicationId, filepart)
                                    .cache());
                })
                .flatMap(appTuple -> {
                    Application branchedApplication = appTuple.getT1();
                    Application application = appTuple.getT2();

                    return applicationService
                            .deleteAppNavigationLogo(branchedApplication.getId())
                            .then(applicationService.findByBranchedId(branchedApplication.getId(), null));
                })
                .zipWhen(application -> applicationService.findById(
                        application.getGitApplicationMetadata().getDefaultArtifactId()));

        StepVerifier.create(createBranchMono)
                .assertNext(tuple -> {
                    Application branchedApp = tuple.getT1();
                    Application srcApp = tuple.getT2();
                    assertThat(branchedApp.getUnpublishedApplicationDetail().getNavigationSetting())
                            .isNotNull();
                    assertThat(branchedApp
                                    .getUnpublishedApplicationDetail()
                                    .getNavigationSetting()
                                    .getLogoAssetId())
                            .isNull();
                    assertThat(srcApp.getUnpublishedApplicationDetail().getNavigationSetting())
                            .isNotNull();
                    assertThat(srcApp.getUnpublishedApplicationDetail()
                                    .getNavigationSetting()
                                    .getLogoAssetId())
                            .isNotNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createBranch_BranchSetPageIcon_SrcBranchPageIconRemainsNull() throws GitAPIException, IOException {
        GitBranchDTO createGitBranchDTO = new GitBranchDTO();
        createGitBranchDTO.setBranchName("valid_branch");

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        mockitoSetUp(createGitBranchDTO);

        Application testApplication = new Application();
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitArtifactMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        testApplication.setName("Test App" + UUID.randomUUID());
        testApplication.setWorkspaceId(workspaceId);

        Mono<Tuple2<PageDTO, PageDTO>> createBranchMono = applicationPageService
                .createApplication(testApplication)
                .flatMap(application -> commonGitServiceCE.connectArtifactToGit(
                        application.getId(), gitConnectDTO, "origin", ArtifactType.APPLICATION))
                .map(artifact -> (Application) artifact)
                .flatMap(application -> Mono.zip(
                        commonGitServiceCE
                                .createBranch(application.getId(), createGitBranchDTO, ArtifactType.APPLICATION)
                                .then(applicationService.findByBranchNameAndBaseApplicationId(
                                        createGitBranchDTO.getBranchName(), application.getId(), READ_APPLICATIONS)),
                        Mono.just(application)))
                .flatMap(applicationTuple -> {
                    Application branchedApplication = applicationTuple.getT1();
                    Application application = applicationTuple.getT2();
                    String srcBranchName =
                            application.getGitApplicationMetadata().getRefName();
                    String otherBranchName =
                            branchedApplication.getGitApplicationMetadata().getRefName();
                    String defaultApplicationId =
                            branchedApplication.getGitApplicationMetadata().getDefaultArtifactId();

                    PageDTO newSrcPage = new PageDTO();
                    newSrcPage.setName("newSrcPage");
                    newSrcPage.setApplicationId(defaultApplicationId);

                    PageDTO newBranchPage = new PageDTO();
                    newBranchPage.setName("newBranchPage");
                    newBranchPage.setIcon("flight");
                    newBranchPage.setApplicationId(defaultApplicationId);

                    return Mono.zip(
                            applicationPageService.createPage(newBranchPage),
                            applicationPageService.createPage(newSrcPage));
                });

        StepVerifier.create(createBranchMono)
                .assertNext(tuple -> {
                    PageDTO branchedPage = tuple.getT1();
                    PageDTO srcPage = tuple.getT2();
                    assertThat(srcPage.getName()).isEqualTo("newSrcPage");
                    assertThat(srcPage.getIcon()).isNull();
                    assertThat(branchedPage.getName()).isEqualTo("newBranchPage");
                    assertThat(branchedPage.getIcon()).isEqualTo("flight");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectArtifactToGit_cancelledMidway_cloneSuccess() throws IOException {

        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranchName"));
        Mockito.when(gitExecutor.commitArtifact(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("commit"));
        Mockito.when(gitExecutor.checkoutToBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString()))
                .thenReturn(Mono.just("success"));
        Mockito.when(commonGitFileUtils.checkIfDirectoryIsEmpty(any(Path.class)))
                .thenReturn(Mono.just(true));
        Mockito.when(commonGitFileUtils.initializeReadme(any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));

        Application testApplication = new Application();
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitAuth.setGeneratedAt(Instant.now());
        gitArtifactMetadata.setGitAuth(gitAuth);
        gitArtifactMetadata.setRemoteUrl("git@github.com:test/testRepo.git");
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        testApplication.setName("validData");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 =
                applicationPageService.createApplication(testApplication).block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);

        commonGitServiceCE
                .connectArtifactToGit(application1.getId(), gitConnectDTO, "baseUrl", ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact)
                .timeout(Duration.ofNanos(100))
                .subscribe();

        // Wait for git clone to complete
        Mono<Application> gitConnectedAppFromDbMono = Mono.just(application1).flatMap(application -> {
            try {
                // Before fetching the git connected application, sleep for 5 seconds to ensure that the clone
                // completes
                Thread.sleep(5000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return applicationService.getById(application.getId());
        });

        StepVerifier.create(gitConnectedAppFromDbMono)
                .assertNext(application -> {
                    assertThat(application.getGitApplicationMetadata().getDefaultArtifactId())
                            .isEqualTo(application.getId());
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

        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                        any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.commitArtifact(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("committed successfully"));
        Mockito.when(gitExecutor.checkoutToBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString()))
                .thenReturn(Mono.just("pushed successfully"));

        commonGitServiceCE
                .commitArtifact(commitDTO, gitConnectedApplication.getId(), ArtifactType.APPLICATION)
                .timeout(Duration.ofMillis(10))
                .subscribe();

        // Wait for git commit to complete
        Mono<Application> appFromDbMono = Mono.just(gitConnectedApplication).flatMap(application -> {
            try {
                // Before fetching the git connected application, sleep for 5 seconds to ensure that the clone
                // completes
                Thread.sleep(5000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return applicationService.getById(application.getId());
        });

        StepVerifier.create(appFromDbMono)
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

        Mockito.when(gitExecutor.checkoutToBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.fetchRemote(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyString(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.listBranches(any())).thenReturn(Mono.just(new ArrayList<>()));
        Mockito.when(gitExecutor.createAndCheckoutToBranch(any(), any()))
                .thenReturn(Mono.just(createGitBranchDTO.getBranchName()));
        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                        any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.commitArtifact(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("System generated commit"));
        Mockito.when(gitExecutor.checkoutToBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString()))
                .thenReturn(Mono.just("pushed successfully"));

        Application application1 =
                createApplicationConnectedToGit("createBranch_cancelledMidway_newApplicationCreated", "master");
        commonGitServiceCE
                .createBranch(application1.getId(), createGitBranchDTO, ArtifactType.APPLICATION)
                .timeout(Duration.ofMillis(10))
                .subscribe();

        Mono<Application> branchedAppMono = Mono.just(application1).flatMap(application -> {
            try {
                // Before fetching the git connected application, sleep for 5 seconds to ensure that the clone
                // completes
                Thread.sleep(10000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return applicationService.findByBranchNameAndBaseApplicationId(
                    createGitBranchDTO.getBranchName(), application.getId(), MANAGE_APPLICATIONS);
        });

        StepVerifier.create(branchedAppMono)
                .assertNext(application -> {
                    GitArtifactMetadata gitData = application.getGitApplicationMetadata();
                    assertThat(application).isNotNull();
                    assertThat(application.getId()).isNotEqualTo(gitData.getDefaultArtifactId());
                    assertThat(gitData.getDefaultArtifactId()).isEqualTo(application1.getId());
                    assertThat(gitData.getRefName()).isEqualTo(createGitBranchDTO.getBranchName());
                    assertThat(gitData.getDefaultBranchName()).isNotEmpty();
                    assertThat(gitData.getRemoteUrl()).isNotEmpty();
                    assertThat(gitData.getBrowserSupportedRemoteUrl()).isNotEmpty();
                    assertThat(gitData.getRepoName()).isNotEmpty();
                    assertThat(gitData.getGitAuth()).isNull();
                    assertThat(gitData.getIsRepoPrivate()).isNull();

                    application.getPages().forEach(page -> assertThat(page.getDefaultPageId())
                            .isNotEqualTo(page.getId()));
                    application.getPublishedPages().forEach(page -> assertThat(page.getDefaultPageId())
                            .isNotEqualTo(page.getId()));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void generateSSHKeyDefaultType_DataNotExistsInCollection_Success() {
        Mono<GitAuth> publicKey = commonGitServiceCE.generateSSHKey(null);

        StepVerifier.create(publicKey)
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
        Mono<GitAuth> publicKey = commonGitServiceCE.generateSSHKey("RSA");

        StepVerifier.create(publicKey)
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
        GitAuth publicKey = commonGitServiceCE.generateSSHKey(null).block();

        Mono<GitAuth> newKey = commonGitServiceCE.generateSSHKey(null);

        StepVerifier.create(newKey)
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
        GitAuth publicKey = commonGitServiceCE.generateSSHKey(null).block();

        Mono<GitAuth> newKey = commonGitServiceCE.generateSSHKey("RSA");

        StepVerifier.create(newKey)
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
    public void importArtifactFromGit_InvalidRemoteUrl_ThrowError() {
        GitConnectDTO gitConnectDTO = getConnectRequest(null, testUserProfile);
        Mono<ApplicationImportDTO> applicationMono = commonGitServiceCE
                .importArtifactFromGit("testID", gitConnectDTO, ArtifactType.APPLICATION)
                .map(artifactImportDTO -> (ApplicationImportDTO) artifactImportDTO);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage("Remote Url")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importArtifactFromGit_emptyWorkspaceId_ThrowError() {
        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<ApplicationImportDTO> applicationMono = commonGitServiceCE
                .importArtifactFromGit(null, gitConnectDTO, ArtifactType.APPLICATION)
                .map(artifactImportDTO -> (ApplicationImportDTO) artifactImportDTO);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .contains(AppsmithError.INVALID_PARAMETER.getMessage("Invalid workspace id")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importArtifactFromGit_privateRepoLimitReached_ThrowApplicationLimitError() {
        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        commonGitServiceCE.generateSSHKey(null).block();
        Mockito.when(gitCloudServicesUtils.getPrivateRepoLimitForOrg(Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just(0));

        Mono<ApplicationImportDTO> applicationMono = commonGitServiceCE
                .importArtifactFromGit(workspaceId, gitConnectDTO, ArtifactType.APPLICATION)
                .map(artifactImportDTO -> (ApplicationImportDTO) artifactImportDTO);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .contains(AppsmithError.GIT_APPLICATION_LIMIT_ERROR.getMessage(
                                        AppsmithError.GIT_APPLICATION_LIMIT_ERROR.getMessage())))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importArtifactFromGit_emptyRepo_ThrowError() {
        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        GitAuth gitAuth = commonGitServiceCE.generateSSHKey(null).block();

        ApplicationJson applicationJson = createAppJson(filePath).block();
        applicationJson.setExportedApplication(null);

        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranch"));
        Mockito.when(commonGitFileUtils.reconstructArtifactExchangeJsonFromGitRepoWithAnalytics(
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.any()))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(commonGitFileUtils.deleteLocalRepo(any(Path.class))).thenReturn(Mono.just(true));

        Mono<ApplicationImportDTO> applicationMono = commonGitServiceCE
                .importArtifactFromGit(workspaceId, gitConnectDTO, ArtifactType.APPLICATION)
                .map(artifactImportDTO -> (ApplicationImportDTO) artifactImportDTO);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains("Cannot import app from an empty repo"))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importArtifactFromGit_validRequest_Success() {
        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        GitAuth gitAuth = commonGitServiceCE.generateSSHKey(null).block();

        ApplicationJson applicationJson = createAppJson(filePath).block();
        applicationJson.getExportedApplication().setName("testRepo");

        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranch"));
        Mockito.when(commonGitFileUtils.reconstructArtifactExchangeJsonFromGitRepoWithAnalytics(
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.any()))
                .thenReturn(Mono.just(applicationJson));

        Mono<ApplicationImportDTO> applicationMono = commonGitServiceCE
                .importArtifactFromGit(workspaceId, gitConnectDTO, ArtifactType.APPLICATION)
                .map(artifactImportDTO -> (ApplicationImportDTO) artifactImportDTO);

        StepVerifier.create(applicationMono)
                .assertNext(applicationImportDTO -> {
                    Application application = applicationImportDTO.getApplication();
                    assertThat(application.getName()).isEqualTo("testRepo");
                    assertThat(application.getGitApplicationMetadata()).isNotNull();
                    assertThat(application.getGitApplicationMetadata().getRefName())
                            .isEqualTo("defaultBranch");
                    assertThat(application.getGitApplicationMetadata().getDefaultBranchName())
                            .isEqualTo("defaultBranch");
                    assertThat(application.getGitApplicationMetadata().getRemoteUrl())
                            .isEqualTo("git@github.com:test/testRepo.git");
                    assertThat(application.getGitApplicationMetadata().getIsRepoPrivate())
                            .isEqualTo(true);
                    assertThat(application
                                    .getGitApplicationMetadata()
                                    .getGitAuth()
                                    .getPublicKey())
                            .isEqualTo(gitAuth.getPublicKey());
                    assertThat(application.getUnpublishedCustomJSLibs())
                            .hasSize(application.getPublishedCustomJSLibs().size());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importArtifactFromGit_validRequestWithDuplicateApplicationName_Success() {
        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testGitRepo.git", testUserProfile);
        GitAuth gitAuth = commonGitServiceCE.generateSSHKey(null).block();

        ApplicationJson applicationJson = createAppJson(filePath).block();
        applicationJson.getExportedApplication().setName("testGitRepo (1)");

        Application testApplication = new Application();
        testApplication.setName("testGitRepo");
        testApplication.setWorkspaceId(workspaceId);
        applicationPageService.createApplication(testApplication).block();

        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranch"));
        Mockito.when(commonGitFileUtils.reconstructArtifactExchangeJsonFromGitRepoWithAnalytics(
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.any()))
                .thenReturn(Mono.just(applicationJson));

        Mono<ApplicationImportDTO> applicationMono = commonGitServiceCE
                .importArtifactFromGit(workspaceId, gitConnectDTO, ArtifactType.APPLICATION)
                .map(artifactImportDTO -> (ApplicationImportDTO) artifactImportDTO);

        StepVerifier.create(applicationMono)
                .assertNext(applicationImportDTO -> {
                    Application application = applicationImportDTO.getApplication();
                    assertThat(application.getName()).isEqualTo("testGitRepo (1)");
                    assertThat(application.getGitApplicationMetadata()).isNotNull();
                    assertThat(application.getGitApplicationMetadata().getRefName())
                            .isEqualTo("defaultBranch");
                    assertThat(application.getGitApplicationMetadata().getDefaultBranchName())
                            .isEqualTo("defaultBranch");
                    assertThat(application.getGitApplicationMetadata().getRemoteUrl())
                            .isEqualTo("git@github.com:test/testGitRepo.git");
                    assertThat(application.getGitApplicationMetadata().getIsRepoPrivate())
                            .isEqualTo(true);
                    assertThat(application
                                    .getGitApplicationMetadata()
                                    .getGitAuth()
                                    .getPublicKey())
                            .isEqualTo(gitAuth.getPublicKey());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importArtifactFromGit_validRequestWithDuplicateDatasourceOfSameType_Success() {
        Workspace workspace = new Workspace();
        workspace.setName("gitImportOrg");
        final String testWorkspaceId =
                workspaceService.create(workspace).map(Workspace::getId).block();
        String environmentId = workspaceService
                .getDefaultEnvironmentId(testWorkspaceId, environmentPermission.getExecutePermission())
                .block();

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testGitImportRepo.git", testUserProfile);
        GitAuth gitAuth = commonGitServiceCE.generateSSHKey(null).block();

        ApplicationJson applicationJson = createAppJson(filePath).block();
        applicationJson.getExportedApplication().setName("testGitImportRepo");
        String appJSONDBName = applicationJson.getDatasourceList().get(0).getName();

        String pluginId =
                pluginRepository.findByPackageName("mongo-plugin").block().getId();
        Datasource datasource = new Datasource();
        datasource.setName(appJSONDBName);
        datasource.setPluginId(pluginId);
        datasource.setWorkspaceId(testWorkspaceId);
        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(environmentId, new DatasourceStorageDTO(null, environmentId, null));
        datasource.setDatasourceStorages(storages);

        datasourceService.create(datasource).block();

        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranch"));
        Mockito.when(commonGitFileUtils.reconstructArtifactExchangeJsonFromGitRepoWithAnalytics(
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.any()))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(commonGitFileUtils.deleteLocalRepo(any(Path.class))).thenReturn(Mono.just(true));

        Mono<ApplicationImportDTO> applicationMono = commonGitServiceCE
                .importArtifactFromGit(workspaceId, gitConnectDTO, ArtifactType.APPLICATION)
                .map(artifactImportDTO -> (ApplicationImportDTO) artifactImportDTO);

        StepVerifier.create(applicationMono)
                .assertNext(applicationImportDTO -> {
                    Application application = applicationImportDTO.getApplication();
                    assertThat(application.getName()).isEqualTo("testGitImportRepo");
                    assertThat(application.getGitApplicationMetadata()).isNotNull();
                    assertThat(application.getGitApplicationMetadata().getRefName())
                            .isEqualTo("defaultBranch");
                    assertThat(application.getGitApplicationMetadata().getDefaultBranchName())
                            .isEqualTo("defaultBranch");
                    assertThat(application.getGitApplicationMetadata().getRemoteUrl())
                            .isEqualTo("git@github.com:test/testGitImportRepo.git");
                    assertThat(application.getGitApplicationMetadata().getIsRepoPrivate())
                            .isEqualTo(true);
                    assertThat(application
                                    .getGitApplicationMetadata()
                                    .getGitAuth()
                                    .getPublicKey())
                            .isEqualTo(gitAuth.getPublicKey());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importArtifactFromGit_validRequestWithDuplicateDatasourceOfSameTypeCancelledMidway_Success() {
        Workspace workspace = new Workspace();
        workspace.setName("gitImportOrgCancelledMidway");
        final String testWorkspaceId =
                workspaceService.create(workspace).map(Workspace::getId).block();
        String environmentId = workspaceService
                .getDefaultEnvironmentId(testWorkspaceId, environmentPermission.getExecutePermission())
                .block();

        GitConnectDTO gitConnectDTO =
                getConnectRequest("git@github.com:test/testGitImportRepoCancelledMidway.git", testUserProfile);
        GitAuth gitAuth = commonGitServiceCE.generateSSHKey(null).block();

        ApplicationJson applicationJson = createAppJson(filePath).block();
        applicationJson.getExportedApplication().setName(null);
        String appJSONDBName = applicationJson.getDatasourceList().get(0).getName();

        String pluginId =
                pluginRepository.findByPackageName("mongo-plugin").block().getId();
        Datasource datasource = new Datasource();
        datasource.setName(appJSONDBName);
        datasource.setPluginId(pluginId);
        datasource.setWorkspaceId(testWorkspaceId);
        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(environmentId, new DatasourceStorageDTO(null, environmentId, null));
        datasource.setDatasourceStorages(storages);

        datasourceService.create(datasource).block();

        Mockito.when(gitCloudServicesUtils.getPrivateRepoLimitForOrg(eq(testWorkspaceId), Mockito.anyBoolean()))
                .thenReturn(Mono.just(3));
        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranch"));
        Mockito.when(commonGitFileUtils.reconstructArtifactExchangeJsonFromGitRepoWithAnalytics(
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.any()))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(commonGitFileUtils.deleteLocalRepo(any(Path.class))).thenReturn(Mono.just(true));

        commonGitServiceCE
                .importArtifactFromGit(testWorkspaceId, gitConnectDTO, ArtifactType.APPLICATION)
                .timeout(Duration.ofMillis(10))
                .subscribe();

        // Wait for git clone to complete
        Mono<Application> gitConnectedAppFromDbMono = Mono.just(testWorkspaceId).flatMap(ignore -> {
            try {
                // Before fetching the git connected application, sleep for 5 seconds to ensure that the clone
                // completes
                Thread.sleep(5000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return applicationService
                    .findByWorkspaceId(testWorkspaceId, READ_APPLICATIONS)
                    .filter(application1 -> "testGitImportRepoCancelledMidway".equals(application1.getName()))
                    .next();
        });

        StepVerifier.create(gitConnectedAppFromDbMono)
                .assertNext(application -> {
                    assertThat(application.getName()).isEqualTo("testGitImportRepoCancelledMidway");
                    assertThat(application.getGitApplicationMetadata()).isNotNull();
                    assertThat(application.getGitApplicationMetadata().getRefName())
                            .isEqualTo("defaultBranch");
                    assertThat(application.getGitApplicationMetadata().getDefaultBranchName())
                            .isEqualTo("defaultBranch");
                    assertThat(application.getGitApplicationMetadata().getRemoteUrl())
                            .isEqualTo("git@github.com:test/testGitImportRepoCancelledMidway.git");
                    assertThat(application.getGitApplicationMetadata().getIsRepoPrivate())
                            .isEqualTo(true);
                    assertThat(application
                                    .getGitApplicationMetadata()
                                    .getGitAuth()
                                    .getPublicKey())
                            .isEqualTo(gitAuth.getPublicKey());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importArtifactFromGit_validRequestWithDuplicateDatasourceOfDifferentType_ThrowError() {
        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testGitImportRepo1.git", testUserProfile);
        commonGitServiceCE.generateSSHKey(null).block();
        ApplicationJson applicationJson = createAppJson(filePath).block();
        applicationJson.getExportedApplication().setName("testGitImportRepo1");
        applicationJson.getDatasourceList().get(0).setName("db-auth-1");

        String pluginId =
                pluginRepository.findByPackageName("postgres-plugin").block().getId();
        Datasource datasource = new Datasource();
        datasource.setName("db-auth-1");
        datasource.setPluginId(pluginId);
        datasource.setWorkspaceId(workspaceId);
        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, null));
        datasource.setDatasourceStorages(storages);

        datasourceService.create(datasource).block();

        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranch"));
        Mockito.when(commonGitFileUtils.reconstructArtifactExchangeJsonFromGitRepoWithAnalytics(
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.any()))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(commonGitFileUtils.deleteLocalRepo(any(Path.class))).thenReturn(Mono.just(true));

        Mono<ApplicationImportDTO> applicationMono = commonGitServiceCE
                .importArtifactFromGit(workspaceId, gitConnectDTO, ArtifactType.APPLICATION)
                .map(artifactImportDTO -> (ApplicationImportDTO) artifactImportDTO);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains("Datasource already exists with the same name"))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importArtifactFromGit_validRequestWithEmptyRepo_ThrowError() {
        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/emptyRepo.git", testUserProfile);
        GitAuth gitAuth = commonGitServiceCE.generateSSHKey(null).block();

        ApplicationJson applicationJson = new ApplicationJson();

        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranch"));
        Mockito.when(commonGitFileUtils.reconstructArtifactExchangeJsonFromGitRepoWithAnalytics(
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.any()))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(commonGitFileUtils.deleteLocalRepo(any(Path.class))).thenReturn(Mono.just(true));

        Mono<ApplicationImportDTO> applicationMono = commonGitServiceCE
                .importArtifactFromGit(workspaceId, gitConnectDTO, ArtifactType.APPLICATION)
                .map(artifactImportDTO -> (ApplicationImportDTO) artifactImportDTO);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains("Cannot import app from an empty repo"))
                .verify();
    }

    // TODO TCs for merge is pending

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteBranch_staleBranchNotInDB_NotFoundError() throws IOException, GitAPIException {
        Application application = createApplicationConnectedToGit("deleteBranch_staleBranchNotInDB_Success", "master");
        application.getGitApplicationMetadata().setDefaultBranchName("master");
        applicationService.save(application).block();

        Mono<? extends Artifact> applicationMono =
                commonGitServiceCE.deleteBranch(application.getId(), "test", ArtifactType.APPLICATION);

        StepVerifier.create(applicationMono).verifyErrorSatisfies(error -> {
            assertThat(error).isInstanceOf(AppsmithException.class);
            assertThat(((AppsmithException) error).getAppErrorCode())
                    .isEqualTo(AppsmithError.NO_RESOURCE_FOUND.getAppErrorCode());
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteBranch_existsInDB_Success() throws IOException, GitAPIException {
        Application application = createApplicationConnectedToGit("deleteBranch_existsInDB_Success", "master");
        application.getGitApplicationMetadata().setDefaultBranchName("test");
        applicationService.save(application).block();
        Mockito.when(gitExecutor.deleteBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));

        Mono<Application> applicationMono = commonGitServiceCE
                .deleteBranch(application.getId(), "master", ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .assertNext(application1 -> {
                    assertThat(application1.getId()).isEqualTo(application.getId());
                    assertThat(application1.isDeleted()).isFalse();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteBranch_BranchIsProtected_Success() throws IOException, GitAPIException {
        String branchName = "master";
        Application application = createApplicationConnectedToGit("deleteBranch_existsInDB_Success", branchName);
        application.getGitApplicationMetadata().setDefaultBranchName(branchName);
        applicationService.save(application).block();
        Mockito.when(gitExecutor.deleteBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));

        Mono<Application> applicationMono = commonGitServiceCE
                .updateProtectedBranches(application.getId(), List.of("master"), ArtifactType.APPLICATION)
                .then(commonGitServiceCE
                        .deleteBranch(application.getId(), branchName, ArtifactType.APPLICATION)
                        .map(artifact -> (Application) artifact));

        StepVerifier.create(applicationMono).verifyError();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteBranch_branchDoesNotExist_ThrowError() throws IOException, GitAPIException {
        Application application =
                createApplicationConnectedToGit("deleteBranch_branchDoesNotExist_ThrowError", "master");
        application.getGitApplicationMetadata().setDefaultBranchName("test");
        applicationService.save(application).block();

        Mockito.when(gitExecutor.deleteBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(false));

        application.getGitApplicationMetadata().setRefName("not-present-branch");
        Mockito.doReturn(Mono.just(application))
                .when(applicationService)
                .findByBranchNameAndBaseApplicationId(anyString(), anyString(), any(AclPermission.class));

        Mono<Application> applicationMono = commonGitServiceCE
                .deleteBranch(application.getId(), "not-present-branch", ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains("delete branch. Branch does not exists in the repo"))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteBranch_defaultBranch_ThrowError() throws IOException, GitAPIException {
        Application application = createApplicationConnectedToGit("deleteBranch_defaultBranch_ThrowError", "master");
        application.getGitApplicationMetadata().setDefaultBranchName("master");
        applicationService.save(application).block();
        Mockito.when(gitExecutor.deleteBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(false));

        Mono<Application> applicationMono = commonGitServiceCE
                .deleteBranch(application.getId(), "master", ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains("Cannot delete default branch"))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteBranch_defaultBranchUpdated_Success() throws IOException, GitAPIException {
        Application application =
                createApplicationConnectedToGit("deleteBranch_defaultBranchUpdated_Success1", "master");
        application.getGitApplicationMetadata().setDefaultBranchName("f1");
        applicationService.save(application).block();

        Application branchApp = createApplicationConnectedToGit("deleteBranch_defaultBranchUpdated_Success2", "f1");
        branchApp.getGitApplicationMetadata().setDefaultBranchName("f1");
        branchApp.getGitApplicationMetadata().setDefaultApplicationId(application.getId());
        applicationService.save(branchApp).block();

        Mockito.when(gitExecutor.deleteBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));

        Mono<Application> applicationMono = commonGitServiceCE
                .deleteBranch(application.getId(), "master", ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .assertNext(application1 -> {
                    assertThat(application1.isDeleted()).isFalse();
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

        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                        any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("path")));
        Mockito.when(commonGitFileUtils.reconstructArtifactExchangeJsonFromGitRepoWithAnalytics(
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.any()))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(gitExecutor.rebaseBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));

        Mono<Application> applicationMono = commonGitServiceCE
                .discardChanges(application.getId(), ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .assertNext(application1 -> {
                    assertThat(application1.getPages()).isNotEqualTo(application.getPages());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void discardChanges_cancelledMidway_discardSuccess() throws IOException, GitAPIException {
        Application application =
                createApplicationConnectedToGit("discard-changes-midway", "discard-change-midway-branch");
        MergeStatusDTO mergeStatusDTO = new MergeStatusDTO();
        mergeStatusDTO.setStatus("Nothing to fetch from remote. All changes are upto date.");
        mergeStatusDTO.setMergeAble(true);

        ApplicationJson applicationJson = createAppJson(filePath).block();
        applicationJson.getExportedApplication().setName("discard-changes-midway");

        GitStatusDTO gitStatusDTO = new GitStatusDTO();
        gitStatusDTO.setAheadCount(0);
        gitStatusDTO.setBehindCount(0);
        gitStatusDTO.setIsClean(true);

        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                        any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("path")));
        Mockito.when(commonGitFileUtils.reconstructArtifactExchangeJsonFromGitRepoWithAnalytics(
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.any()))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(gitExecutor.pullApplication(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString()))
                .thenReturn(Mono.just(mergeStatusDTO));
        Mockito.when(gitExecutor.getStatus(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(gitStatusDTO));
        Mockito.when(gitExecutor.fetchRemote(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        eq(true),
                        Mockito.anyString(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetched"));

        commonGitServiceCE
                .discardChanges(application.getId(), ArtifactType.APPLICATION)
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

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteBranch_cancelledMidway_success() throws GitAPIException, IOException {

        final String DEFAULT_BRANCH = "master", TO_BE_DELETED_BRANCH = "deleteBranch";
        Application application =
                createApplicationConnectedToGit("deleteBranch_defaultBranchUpdated_Success", DEFAULT_BRANCH);
        application.getGitApplicationMetadata().setDefaultBranchName(DEFAULT_BRANCH);
        applicationService.save(application).block();

        Application branchApp =
                createApplicationConnectedToGit("deleteBranch_defaultBranchUpdated_Success2", TO_BE_DELETED_BRANCH);
        branchApp.getGitApplicationMetadata().setDefaultBranchName(DEFAULT_BRANCH);
        branchApp.getGitApplicationMetadata().setDefaultApplicationId(application.getId());
        applicationService.save(branchApp).block();

        Mockito.when(gitExecutor.deleteBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));

        commonGitServiceCE
                .deleteBranch(application.getId(), TO_BE_DELETED_BRANCH, ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact)
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
                    return applicationService.findAllApplicationsByBaseApplicationId(
                            DBApplication.getId(), MANAGE_APPLICATIONS);
                })
                .collectList();

        StepVerifier.create(applicationsFromDbMono)
                .assertNext(applicationList -> {
                    Set<String> branchNames = new HashSet<>();
                    applicationList.forEach(application1 -> branchNames.add(
                            application1.getGitApplicationMetadata().getRefName()));
                    assertThat(branchNames).doesNotContain(TO_BE_DELETED_BRANCH);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void commitAndPushApplication_WithMultipleUsers_success() throws GitAPIException, IOException {
        GitCommitDTO commitDTO = new GitCommitDTO();
        commitDTO.setDoPush(true);
        commitDTO.setCommitMessage("test commit");

        PageDTO page = new PageDTO();
        page.setApplicationId(gitConnectedApplication.getId());
        page.setName("commit_WithMultipleUsers_page");
        applicationPageService.createPage(page).block();

        Mockito.when(commonGitFileUtils.saveArtifactToLocalRepoWithAnalytics(
                        any(Path.class), any(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.commitArtifact(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("committed successfully"));
        Mockito.when(gitExecutor.checkoutToBranch(any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.pushApplication(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString()))
                .thenReturn(Mono.just("pushed successfully"));

        // First request for commit operation
        Mono<String> commitMonoReq1 =
                commonGitServiceCE.commitArtifact(commitDTO, gitConnectedApplication.getId(), ArtifactType.APPLICATION);
        // Second request for commit operation
        Mono<String> commitMonoReq2 =
                commonGitServiceCE.commitArtifact(commitDTO, gitConnectedApplication.getId(), ArtifactType.APPLICATION);

        // Both the request to execute completely without the file lock error from jgit.
        StepVerifier.create(Mono.zip(commitMonoReq1, commitMonoReq2))
                .assertNext(tuple -> {
                    assertThat(tuple.getT1()).contains("committed successfully");
                    assertThat(tuple.getT2()).contains("committed successfully");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getGitConnectedApps_privateRepositories_Success() throws GitAPIException, IOException {

        Workspace workspace = new Workspace();
        workspace.setName("Limit Private Repo Test Workspace");
        String localWorkspaceId =
                workspaceService.create(workspace).map(Workspace::getId).block();

        Mockito.when(gitCloudServicesUtils.getPrivateRepoLimitForOrg(eq(localWorkspaceId), Mockito.anyBoolean()))
                .thenReturn(Mono.just(-1));

        createApplicationConnectedToGit("private_repo_1", "master", localWorkspaceId);
        createApplicationConnectedToGit("private_repo_2", "master", localWorkspaceId);
        createApplicationConnectedToGit("private_repo_3", "master", localWorkspaceId);

        StepVerifier.create(applicationService.getGitConnectedApplicationsCountWithPrivateRepoByWorkspaceId(
                        localWorkspaceId))
                .assertNext(limit -> assertThat(limit).isEqualTo(3))
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void fetchFromRemote_WhenSuccessful_ReturnsResponse() throws GitAPIException, IOException {
        String randomId = UUID.randomUUID().toString();
        String appname = "test-app-" + randomId, branch = "test-branch";
        Application application = createApplicationConnectedToGit(appname, branch);
        GitArtifactMetadata gitData = application.getGitApplicationMetadata();
        GitAuth gitAuth = gitData.getGitAuth();
        Path repoSuffix =
                Paths.get(application.getWorkspaceId(), gitData.getDefaultArtifactId(), gitData.getRepoName());
        Path repoPath = Paths.get("test", "git", "root", repoSuffix.toString());

        BranchTrackingStatus branchTrackingStatus = Mockito.mock(BranchTrackingStatus.class);
        Mockito.when(branchTrackingStatus.getAheadCount()).thenReturn(1);
        Mockito.when(branchTrackingStatus.getBehindCount()).thenReturn(2);

        Mockito.when(gitExecutor.createRepoPath(repoSuffix)).thenReturn(repoPath);
        Mockito.when(gitExecutor.checkoutToBranch(repoSuffix, branch)).thenReturn(Mono.just(true));
        Mockito.when(gitExecutor.fetchRemote(
                        repoPath, gitAuth.getPublicKey(), gitAuth.getPrivateKey(), true, branch, false))
                .thenReturn(Mono.just("success"));
        Mockito.when(gitExecutor.getBranchTrackingStatus(repoPath, branch)).thenReturn(Mono.just(branchTrackingStatus));

        StepVerifier.create(commonGitServiceCE.fetchRemoteChanges(
                        gitData.getDefaultArtifactId(), false, ArtifactType.APPLICATION))
                .assertNext(response -> {
                    assertThat(response.getAheadCount()).isEqualTo(1);
                    assertThat(response.getBehindCount()).isEqualTo(2);
                })
                .verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void checkoutRemoteBranch_WhenApplicationObjectIsPresent_NewAppNotCreated()
            throws GitAPIException, IOException {
        /*
        1. Create an application with a branch.
        2. Mock to ensure that the branch is not present in the local repo
        3. Call checkout to remote branch with the branch name
        4. Ensure that the flow is completed without any errors
         */
        String appName = "app_" + UUID.randomUUID().toString();
        Application application = createApplicationConnectedToGit(appName, "develop");

        assertThat(application.getGitApplicationMetadata().getRefName()).isEqualTo("develop");
        assertThat(application.getId())
                .isEqualTo(application.getGitApplicationMetadata().getDefaultArtifactId());

        List<GitBranchDTO> branches = List.of(new GitBranchDTO("main", true, false));
        ApplicationJson applicationJson = createAppJson(filePath).block();
        assert applicationJson != null;
        // the list of branches does not contain the develop branch
        Mockito.when(gitExecutor.listBranches(Mockito.any(Path.class))).thenReturn(Mono.just(branches));
        Mockito.when(gitExecutor.fetchRemote(
                        Mockito.any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        eq(false),
                        Mockito.anyString(),
                        eq(true)))
                .thenReturn(Mono.just("success"));
        Mockito.when(gitExecutor.checkoutRemoteBranch(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just("success"));

        Mockito.when(commonGitFileUtils.reconstructArtifactExchangeJsonFromGitRepoWithAnalytics(
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.any()))
                .thenReturn(Mono.just(applicationJson));

        Mono<Application> checkoutBranchMono = commonGitServiceCE
                .checkoutBranch(application.getId(), "origin/develop", true, ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);
        StepVerifier.create(checkoutBranchMono)
                .assertNext(app -> {
                    assertThat(app.getId()).isEqualTo(application.getId());
                    assertThat(app.getGitApplicationMetadata().getRefName()).isEqualTo("develop");
                    assertThat(app.getGitApplicationMetadata().getGitAuth()).isNotNull();
                })
                .verifyComplete();
    }

    /**
     * This method creates an workspace, creates an application in the workspace and removes the
     * create application permission from the workspace for the api_user.
     * @return Created Application
     */
    private Application createApplicationAndRemovePermissionFromApplication(AclPermission permission) {
        User apiUser = userService.findByEmail("api_user").block();

        Workspace toCreate = new Workspace();
        toCreate.setName("Workspace_" + UUID.randomUUID());
        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();

        Application testApplication = new Application();
        testApplication.setWorkspaceId(workspace.getId());
        testApplication.setName("Test App");
        Application application1 =
                applicationPageService.createApplication(testApplication).block();

        // remove permission from the application for the api user
        Set<Policy> newPoliciesWithoutPermission = application1.getPolicies().stream()
                .filter(policy -> !policy.getPermission().equals(permission.getValue()))
                .collect(Collectors.toSet());
        application1.setPolicies(newPoliciesWithoutPermission);
        return applicationRepository.save(application1).block();
    }

    @WithUserDetails("api_user")
    @Test
    public void connectArtifactToGit_WhenUserDoesNotHaveRequiredPermission_OperationFails() {
        Application application =
                createApplicationAndRemovePermissionFromApplication(applicationPermission.getGitConnectPermission());

        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        Mono<Application> applicationMono = commonGitServiceCE
                .connectArtifactToGit(application.getId(), gitConnectDTO, "baseUrl", ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMessage(
                        AppsmithError.ACL_NO_RESOURCE_FOUND.getMessage(FieldName.APPLICATION, application.getId()))
                .verify();
    }

    @WithUserDetails("api_user")
    @Test
    public void detachRemote_WhenUserDoesNotHaveRequiredPermission_OperationFails() {
        Application application =
                createApplicationAndRemovePermissionFromApplication(applicationPermission.getGitConnectPermission());
        Mono<Application> applicationMono = commonGitServiceCE
                .detachRemote(application.getId(), ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact);

        StepVerifier.create(applicationMono)
                .expectErrorMessage(
                        AppsmithError.ACL_NO_RESOURCE_FOUND.getMessage(FieldName.APPLICATION, application.getId()))
                .verify();
    }

    @Test
    @WithUserDetails("api_user")
    public void getProtectedBranches_WhenProtectedBranchListExists_ListReturned() {
        Application testApplication = new Application();
        testApplication.setName("App" + UUID.randomUUID());
        testApplication.setWorkspaceId(workspaceId);

        Mono<List<String>> branchListMono = applicationPageService
                .createApplication(testApplication)
                .flatMap(application -> {
                    GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
                    gitArtifactMetadata.setBranchProtectionRules(List.of("main", "develop"));
                    gitArtifactMetadata.setDefaultApplicationId(application.getId());
                    application.setGitApplicationMetadata(gitArtifactMetadata);
                    return applicationRepository.save(application);
                })
                .flatMap(application ->
                        commonGitServiceCE.getProtectedBranches(application.getId(), ArtifactType.APPLICATION));

        StepVerifier.create(branchListMono)
                .assertNext(branches -> {
                    assertThat(branches).isNullOrEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void getProtectedBranches_WhenProtectedBranchListDoestNotExists_EmptyListReturned() {
        Application testApplication = new Application();
        testApplication.setName("App" + UUID.randomUUID());
        testApplication.setWorkspaceId(workspaceId);

        Mono<List<String>> branchListMono = applicationPageService
                .createApplication(testApplication)
                .flatMap(application -> {
                    GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
                    gitArtifactMetadata.setDefaultApplicationId(application.getId());
                    application.setGitApplicationMetadata(gitArtifactMetadata);
                    return applicationRepository.save(application);
                })
                .flatMap(application ->
                        commonGitServiceCE.getProtectedBranches(application.getId(), ArtifactType.APPLICATION));

        StepVerifier.create(branchListMono)
                .assertNext(branches -> {
                    assertThat(branches).isEmpty();
                })
                .verifyComplete();
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
            GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
            gitArtifactMetadata.setRefName(s);
            gitArtifactMetadata.setDefaultBranchName(defaultBranchName);
            gitArtifactMetadata.setDefaultApplicationId(defaultAppId);
            createdApp.setGitApplicationMetadata(gitArtifactMetadata);

            applicationRepository.save(createdApp).block();
        }
        return defaultAppId;
    }

    @Test
    @WithUserDetails("api_user")
    public void updateProtectedBranches_WhenListDoesNotContainOnlyDefaultBranch_ExceptionThrown() {
        List<String> branchList = List.of("master", "develop", "feature");
        // create three app with master as the default branch
        String defaultAppId = createBranchedApplication(branchList);

        StepVerifier.create(commonGitServiceCE.updateProtectedBranches(
                        defaultAppId, List.of("develop", "feature"), ArtifactType.APPLICATION))
                .verifyErrorMessage(AppsmithError.UNSUPPORTED_OPERATION.getMessage());

        StepVerifier.create(commonGitServiceCE.updateProtectedBranches(
                        defaultAppId, List.of("develop"), ArtifactType.APPLICATION))
                .verifyErrorMessage(AppsmithError.UNSUPPORTED_OPERATION.getMessage());

        StepVerifier.create(commonGitServiceCE.updateProtectedBranches(
                        defaultAppId, List.of("master", "develop"), ArtifactType.APPLICATION))
                .verifyErrorMessage(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
    }

    @Test
    @WithUserDetails("api_user")
    public void updateProtectedBranches_WhenListContainsOnlyDefaultBranch_Success() {
        List<String> branchList = List.of("master", "develop", "feature");
        // create three app with master as the default branch
        String defaultAppId = createBranchedApplication(branchList);
        Flux<Application> applicationFlux = commonGitServiceCE
                .updateProtectedBranches(defaultAppId, List.of("master"), ArtifactType.APPLICATION)
                .thenMany(applicationService.findAllApplicationsByBaseApplicationId(
                        defaultAppId, applicationPermission.getEditPermission()));

        StepVerifier.create(applicationFlux.collectList())
                .assertNext(applicationList -> {
                    for (Application application : applicationList) {
                        GitArtifactMetadata metadata = application.getGitApplicationMetadata();
                        assertThat(metadata.getDefaultBranchName()).isEqualTo("master");
                        if (application.getId().equals(defaultAppId)) {
                            // the default app should have the protected branch list
                            assertThat(metadata.getBranchProtectionRules()).containsExactly("master");
                            // the analytics service should be triggered once for this event
                            verify(analyticsService, times(1))
                                    .sendEvent(eq(GIT_ADD_PROTECTED_BRANCH.getEventName()), anyString(), anyMap());
                        }
                    }
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void updateProtectedBranches_WhenListIsEmpty_CurrentProtectedBranchesRemoved() {
        List<String> branchList = List.of("master", "develop", "feature");
        // create three app with master as the default branch
        String defaultAppId = createBranchedApplication(branchList);
        Flux<Application> applicationFlux = commonGitServiceCE
                .updateProtectedBranches(defaultAppId, List.of("master"), ArtifactType.APPLICATION)
                .then(commonGitServiceCE.updateProtectedBranches(
                        defaultAppId, List.of(), ArtifactType.APPLICATION)) // unset the protected branch list
                .thenMany(applicationService.findAllApplicationsByBaseApplicationId(
                        defaultAppId, applicationPermission.getEditPermission()));

        StepVerifier.create(applicationFlux.collectList())
                .assertNext(applicationList -> {
                    for (Application application : applicationList) {
                        GitArtifactMetadata metadata = application.getGitApplicationMetadata();
                        if (application.getId().equals(defaultAppId)) {
                            // the default app should have the empty protected branch list
                            assertThat(metadata.getBranchProtectionRules()).isEmpty();
                        }
                    }
                })
                .verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void updateProtectedBranches_WhenUserDoesNotHaveRequiredPermission_OperationFails() {
        Application application = createApplicationAndRemovePermissionFromApplication(
                applicationPermission.getManageProtectedBranchPermission());
        Mono<List<String>> updateProtectedBranchesMono =
                commonGitServiceCE.updateProtectedBranches(application.getId(), List.of(), ArtifactType.APPLICATION);

        StepVerifier.create(updateProtectedBranchesMono)
                .expectErrorMessage(
                        AppsmithError.ACL_NO_RESOURCE_FOUND.getMessage(FieldName.APPLICATION, application.getId()))
                .verify();
    }

    @WithUserDetails("api_user")
    @Test
    public void updateProtectedBranches_WhenOneOperationFails_ChangesReverted() {
        List<String> branchList = List.of("master", "develop", "feature");
        // create three app with master as the default branch
        String defaultAppId = createBranchedApplication(branchList);

        doReturn(Mono.error(new AppsmithException(AppsmithError.GENERIC_BAD_REQUEST, "Test error")))
                .when(applicationService)
                .updateProtectedBranches(Mockito.anyString(), Mockito.any());

        Mono<List<String>> updateProtectedBranchesMono =
                commonGitServiceCE.updateProtectedBranches(defaultAppId, List.of(), ArtifactType.APPLICATION);

        StepVerifier.create(updateProtectedBranchesMono)
                .expectErrorMessage(AppsmithError.GENERIC_BAD_REQUEST.getMessage("Test error"))
                .verify();

        StepVerifier.create(applicationService.findById(defaultAppId))
                .assertNext(application -> {
                    GitArtifactMetadata metadata = application.getGitApplicationMetadata();
                    // the default app should have the empty protected branch list
                    assertThat(metadata.getBranchProtectionRules()).isNullOrEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void getProtectedBranches_WhenUserHasMultipleBranchProtected_ReturnsEmptyOrDefaultBranchOnly() {
        Application testApplication = new Application();
        testApplication.setName("App" + UUID.randomUUID());
        testApplication.setWorkspaceId(workspaceId);

        Mono<Application> applicationMono = applicationPageService
                .createApplication(testApplication)
                .flatMap(application -> {
                    GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
                    gitArtifactMetadata.setDefaultApplicationId(application.getId());
                    gitArtifactMetadata.setDefaultBranchName("master");
                    // include default branch in the list of the protected branches
                    gitArtifactMetadata.setBranchProtectionRules(List.of("master", "develop"));
                    application.setGitApplicationMetadata(gitArtifactMetadata);
                    return applicationRepository.save(application);
                })
                .cache();

        Mono<List<String>> branchListMonoWithDefaultBranch = applicationMono.flatMap(
                application -> commonGitServiceCE.getProtectedBranches(application.getId(), ArtifactType.APPLICATION));

        StepVerifier.create(branchListMonoWithDefaultBranch)
                .assertNext(branchList -> {
                    assertThat(branchList).containsExactly("master");
                })
                .verifyComplete();

        Mono<List<String>> branchListMonoWithoutDefaultBranch = applicationMono
                .flatMap(application -> {
                    GitArtifactMetadata gitArtifactMetadata = application.getGitApplicationMetadata();
                    // remove the default branch from the protected branches
                    gitArtifactMetadata.setBranchProtectionRules(List.of("develop", "feature"));
                    return applicationRepository.save(application);
                })
                .flatMap(application ->
                        commonGitServiceCE.getProtectedBranches(application.getId(), ArtifactType.APPLICATION));

        StepVerifier.create(branchListMonoWithoutDefaultBranch)
                .assertNext(branchList -> {
                    assertThat(branchList).isNullOrEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void toggleAutoCommit() {
        Application testApplication = new Application();
        testApplication.setName("App" + UUID.randomUUID());
        testApplication.setWorkspaceId(workspaceId);

        Mono<Application> createdApplicationMono = applicationPageService
                .createApplication(testApplication)
                .flatMap(application -> {
                    GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
                    gitArtifactMetadata.setDefaultApplicationId(application.getId());
                    application.setGitApplicationMetadata(gitArtifactMetadata);
                    return applicationRepository.save(application);
                })
                .cache();

        Mono<Boolean> toggleAutoCommitWhenSettingsIsNullMono = createdApplicationMono.flatMap(application ->
                commonGitServiceCE.toggleAutoCommitEnabled(application.getId(), ArtifactType.APPLICATION));

        StepVerifier.create(toggleAutoCommitWhenSettingsIsNullMono)
                .assertNext(aBoolean -> {
                    assertThat(aBoolean).isFalse();
                })
                .verifyComplete();

        Mono<Boolean> toggleAutoCommitWhenSettingsHasTrue = createdApplicationMono
                .flatMap(application -> {
                    application.getGitApplicationMetadata().setAutoCommitConfig(new AutoCommitConfig());
                    application
                            .getGitApplicationMetadata()
                            .getAutoCommitConfig()
                            .setEnabled(TRUE);
                    return applicationRepository.save(application);
                })
                .flatMap(application ->
                        commonGitServiceCE.toggleAutoCommitEnabled(application.getId(), ArtifactType.APPLICATION));

        StepVerifier.create(toggleAutoCommitWhenSettingsHasTrue)
                .assertNext(aBoolean -> {
                    assertThat(aBoolean).isFalse();
                })
                .verifyComplete();

        Mono<Boolean> toggleAutoCommitWhenSettingsHasFalse = createdApplicationMono
                .flatMap(application -> {
                    application.getGitApplicationMetadata().setAutoCommitConfig(new AutoCommitConfig());
                    application
                            .getGitApplicationMetadata()
                            .getAutoCommitConfig()
                            .setEnabled(FALSE);
                    return applicationRepository.save(application);
                })
                .flatMap(application ->
                        commonGitServiceCE.toggleAutoCommitEnabled(application.getId(), ArtifactType.APPLICATION));

        StepVerifier.create(toggleAutoCommitWhenSettingsHasFalse)
                .assertNext(aBoolean -> {
                    assertThat(aBoolean).isTrue();
                })
                .verifyComplete();

        Mono<GitArtifactMetadata> metaDataAfterToggleMono = createdApplicationMono
                .flatMap(application -> {
                    application.getGitApplicationMetadata().setAutoCommitConfig(new AutoCommitConfig());
                    application
                            .getGitApplicationMetadata()
                            .getAutoCommitConfig()
                            .setEnabled(FALSE);
                    return applicationRepository.save(application);
                })
                .flatMap(application ->
                        commonGitServiceCE.getGitArtifactMetadata(application.getId(), ArtifactType.APPLICATION));

        StepVerifier.create(metaDataAfterToggleMono)
                .assertNext(gitApplicationMetadata -> {
                    assertThat(gitApplicationMetadata.getAutoCommitConfig()).isNotNull();
                    assertThat(gitApplicationMetadata.getAutoCommitConfig().getEnabled())
                            .isFalse();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void toggleAutoCommit_WhenUserDoesNotHavePermission_ExceptionThrown() {
        Application testApplication = createApplicationAndRemovePermissionFromApplication(
                applicationPermission.getManageAutoCommitPermission());

        Mono<Boolean> toggleAutoCommitWhenSettingsIsNullMono =
                commonGitServiceCE.toggleAutoCommitEnabled(testApplication.getId(), ArtifactType.APPLICATION);

        StepVerifier.create(toggleAutoCommitWhenSettingsIsNullMono)
                .expectErrorMessage(
                        AppsmithError.ACL_NO_RESOURCE_FOUND.getMessage(FieldName.APPLICATION, testApplication.getId()))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void listBranchForArtifact_WhenLocalRepoDoesNotExist_RepoIsClonedFromRemote()
            throws IOException, GitAPIException {
        List<GitBranchDTO> branchList = List.of(
                createGitBranchDTO("defaultBranch", false),
                createGitBranchDTO("origin/defaultBranch", false),
                createGitBranchDTO("origin/feature1", false));

        Mockito.when(gitExecutor.listBranches(any(Path.class)))
                .thenReturn(Mono.error(new RepositoryNotFoundException("repo not found"))) // throw exception first
                .thenReturn(Mono.just(branchList)); // return list of branches later

        Mockito.when(gitExecutor.cloneRemoteIntoArtifactRepo(
                        any(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranch"));

        Mockito.when(commonGitFileUtils.checkIfDirectoryIsEmpty(any(Path.class)))
                .thenReturn(Mono.just(true));
        Mockito.when(commonGitFileUtils.initializeReadme(any(Path.class), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("textPath")));

        Mockito.when(gitExecutor.fetchRemote(
                        any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        eq(false),
                        Mockito.anyString(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("status"));

        Application application1 = createApplicationConnectedToGit(
                "listBranchForArtifact_pruneBranchNoChangesInRemote_Success", "defaultBranch");

        Mono<List<GitBranchDTO>> listMono =
                commonGitServiceCE.listBranchForArtifact(application1.getId(), false, ArtifactType.APPLICATION);

        StepVerifier.create(listMono)
                .assertNext(listBranch -> {
                    assertThat(listBranch).hasSize(3);
                })
                .verifyComplete();
    }
}
