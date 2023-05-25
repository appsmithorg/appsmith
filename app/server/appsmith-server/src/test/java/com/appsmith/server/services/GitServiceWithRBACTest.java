package com.appsmith.server.services;

import com.appsmith.external.dtos.GitBranchDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.external.git.GitExecutor;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Environment;
import com.appsmith.external.models.JSValue;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.GitCommitDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitPullDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.GitCloudServicesUtils;
import com.appsmith.server.helpers.GitFileUtils;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.GenericDatabaseOperation;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.repositories.UserRepository;
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
import org.eclipse.jgit.api.errors.GitAPIException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.constants.FieldName.DEFAULT_PAGE_LAYOUT;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class GitServiceWithRBACTest {

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
    UserService userService;

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    GenericDatabaseOperation genericDatabaseOperation;

    @Autowired
    UserUtils userUtils;

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserDataService userDataService;

    @Autowired
    ThemeService themeService;

    @Autowired
    ThemeRepository themeRepository;

    @MockBean
    GitExecutor gitExecutor;

    @MockBean
    GitFileUtils gitFileUtils;

    @MockBean
    GitCloudServicesUtils gitCloudServicesUtils;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    private static String workspaceId;
    //private static Application gitConnectedApplication = new Application();
    private static final String DEFAULT_BRANCH = "defaultBranchName";
    private static Boolean isSetupDone = false;
    private static GitProfile testUserProfile = new GitProfile();
    private static String filePath = "test_assets/ImportExportServiceTest/valid-application-without-action-collection.json";
    @Autowired
    private ApplicationRepository applicationRepository;
    private static User api_user;
    private static Application gitConnectedApplication;

    @BeforeEach
    public void setup() throws IOException, GitAPIException {

        if (StringUtils.isEmpty(workspaceId)) {

            User apiUser = userService.findByEmail("api_user").block();
            Workspace toCreate = new Workspace();
            toCreate.setName("Git Service Test");

            if (!org.springframework.util.StringUtils.hasLength(workspaceId)) {
                Workspace workspace = workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
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

        if (api_user == null) {
            api_user = userRepository.findByEmail("api_user").block();
        }

        // Make api_user instance administrator before starting the test
        userUtils.makeSuperUser(List.of(api_user)).block();

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

    private <I> Mono<I> runAs(Mono<I> input, User user) {
        log.info("Running as user: {}", user.getEmail());
        return input.contextWrite((ctx) -> {
            SecurityContext securityContext = new SecurityContextImpl(new UsernamePasswordAuthenticationToken(user, "password", user.getAuthorities()));
            return ctx.put(SecurityContext.class, Mono.just(securityContext));
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void connectApplicationToGit_WithCRUDPermissionsOnApplication_ConnectSuccess() throws IOException, GitAPIException {

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
        testApplication.setName("connectApplicationToGit_WithCRUDPermissionsOnApplication_ConnectSuccess");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        PageDTO page = new PageDTO();
        page.setName("New Page");
        page.setApplicationId(application1.getId());
        applicationPageService.createPage(page).block();

        String username = UUID.randomUUID().toString() + "@test.com";

        // create user
        User newUser = new User();
        newUser.setEmail(username);
        newUser.setName("other-user");
        newUser.setPassword("testpassword");
        newUser = userService.create(newUser).block();
        final User user = newUser;

        // Create permission group
        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for testUpdatePermissionOnEachResourceTypeInMasterBranch_thenItIsAppliedAcrossBranches");
        permissionGroup = permissionGroupService.create(permissionGroup).block();

        // Give crud permissions to app
        genericDatabaseOperation.updatePolicies(
                workspaceId,
                permissionGroup.getId(),
                List.of(AclPermission.READ_WORKSPACES
                ),
                List.of(),
                Workspace.class).block();

        // Give crud permissions to app
        genericDatabaseOperation.updatePolicies(
                application1.getId(),
                permissionGroup.getId(),
                List.of(AclPermission.APPLICATION_CREATE_PAGES,
                        AclPermission.DELETE_APPLICATIONS,
                        AclPermission.READ_APPLICATIONS,
                        AclPermission.MANAGE_APPLICATIONS
                ),
                List.of(),
                Application.class).block();

        permissionGroup = permissionGroupService.assignToUser(permissionGroup, newUser).block();

        // do following as new user
        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);

        Mono<Application> applicationMono = runAs(gitService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl"), user);

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
    public void connectApplicationToGit_WithNoPermissions_throwException() throws IOException, GitAPIException {

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
        testApplication.setName("connectApplicationToGit_WithNoCRUDPermissionsOnApplication_throwException");
        testApplication.setWorkspaceId(workspaceId);
        Application application1 = applicationPageService.createApplication(testApplication).block();

        PageDTO page = new PageDTO();
        page.setName("New Page");
        page.setApplicationId(application1.getId());
        applicationPageService.createPage(page).block();

        String username = UUID.randomUUID().toString() + "@test.com";

        // create user
        User newUser = new User();
        newUser.setEmail(username);
        newUser.setName("other-user");
        newUser.setPassword("testpassword");
        newUser = userService.create(newUser).block();
        final User user = newUser;

        // Create permission group
        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for testUpdatePermissionOnEachResourceTypeInMasterBranch_thenItIsAppliedAcrossBranches");
        permissionGroup = permissionGroupService.create(permissionGroup).block();

        permissionGroupService.assignToUser(permissionGroup, newUser).block();

        // do following as new user
        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);

        Mono<Application> applicationMono = runAs(gitService.connectApplicationToGit(application1.getId(), gitConnectDTO, "baseUrl"), user);

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(error -> {
                    return error instanceof AppsmithException
                            && error.getMessage().equals(AppsmithError.NO_RESOURCE_FOUND.getMessage("applicationId", application1.getId()));
                })
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void detachRemote_withCRUDOnApplication_Success() {
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
        testApplication.setName("detachRemote_withCRUDOnApplication_Success");
        testApplication.setWorkspaceId(workspaceId);
        testApplication = applicationPageService.createApplication(testApplication).block();
        testApplication.getGitApplicationMetadata().setDefaultApplicationId(testApplication.getId());
        testApplication = applicationRepository.save(testApplication).block();

        String username = UUID.randomUUID().toString() + "@test.com";

        // create user
        User newUser = new User();
        newUser.setEmail(username);
        newUser.setName("other-user");
        newUser.setPassword("testpassword");
        newUser = userService.create(newUser).block();
        final User user = newUser;

        // Create permission group
        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for testUpdatePermissionOnEachResourceTypeInMasterBranch_thenItIsAppliedAcrossBranches");
        permissionGroup = permissionGroupService.create(permissionGroup).block();

        permissionGroupService.assignToUser(permissionGroup, newUser).block();

        // Give crud permissions to app
        genericDatabaseOperation.updatePolicies(
                workspaceId,
                permissionGroup.getId(),
                List.of(AclPermission.READ_WORKSPACES
                ),
                List.of(),
                Workspace.class).block();

        // Give crud permissions to app
        genericDatabaseOperation.updatePolicies(
                testApplication.getId(),
                permissionGroup.getId(),
                List.of(AclPermission.APPLICATION_CREATE_PAGES,
                        AclPermission.DELETE_APPLICATIONS,
                        AclPermission.READ_APPLICATIONS,
                        AclPermission.MANAGE_APPLICATIONS
                ),
                List.of(),
                Application.class).block();

        Mono<Application> applicationMono = applicationService.findById(testApplication.getId())
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
                                    layoutActionService.createSingleAction(action, Boolean.TRUE)
                                            .then(layoutActionService.updateLayout(testPage.getId(), testPage.getApplicationId(), layout.getId(), layout)),
                                    layoutCollectionService.createCollection(actionCollectionDTO)
                            )
                            .map(tuple2 -> application);
                });

        Mono<Application> resultMono = applicationMono
                .flatMap(application -> runAs(gitService.detachRemote(application.getId()), user));

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
    public void detachRemote_withNoPermissions_throwException() {
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
        testApplication.setName("detachRemote_withNoPermissions_throwException");
        testApplication.setWorkspaceId(workspaceId);
        testApplication = applicationPageService.createApplication(testApplication).block();
        testApplication.getGitApplicationMetadata().setDefaultApplicationId(testApplication.getId());
        testApplication = applicationRepository.save(testApplication).block();

        String applicationId = testApplication.getId();

        String username = UUID.randomUUID().toString() + "@test.com";

        // create user
        User newUser = new User();
        newUser.setEmail(username);
        newUser.setName("other-user");
        newUser.setPassword("testpassword");
        newUser = userService.create(newUser).block();
        final User user = newUser;

        // Create permission group
        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for testUpdatePermissionOnEachResourceTypeInMasterBranch_thenItIsAppliedAcrossBranches");
        permissionGroup = permissionGroupService.create(permissionGroup).block();

        permissionGroupService.assignToUser(permissionGroup, newUser).block();

        Mono<Application> applicationMono = applicationService.findById(testApplication.getId())
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
                                    layoutActionService.createSingleAction(action, Boolean.TRUE)
                                            .then(layoutActionService.updateLayout(testPage.getId(), testPage.getApplicationId(), layout.getId(), layout)),
                                    layoutCollectionService.createCollection(actionCollectionDTO)
                            )
                            .map(tuple2 -> application);
                });

        Mono<Application> resultMono = applicationMono
                .flatMap(application -> runAs(gitService.detachRemote(application.getId()), user));

        StepVerifier
                .create(resultMono)
                .expectErrorMatches(error -> {
                    return error instanceof AppsmithException
                            && error.getMessage().equals(AppsmithError.NO_RESOURCE_FOUND.getMessage("applicationId", applicationId));
                })
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void pullChanges_withCRUDOnApplication_pullSuccess() throws IOException, GitAPIException {
        Application application = createApplicationConnectedToGit(
                "pullChanges_withCRUDOnApplication_pullSuccess",
                "upstreamChangesInRemote");
        MergeStatusDTO mergeStatusDTO = new MergeStatusDTO();
        mergeStatusDTO.setStatus("2 commits pulled");
        mergeStatusDTO.setMergeAble(true);

        ApplicationJson applicationJson = createAppJson(filePath).block();
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
                        Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(mergeStatusDTO));
        Mockito.when(gitExecutor.getStatus(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(gitStatusDTO));
        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), eq(true), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetched"));
        Mockito.when(gitExecutor.resetToLastCommit(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));

        String username = UUID.randomUUID().toString() + "@test.com";

        // create user
        User newUser = new User();
        newUser.setEmail(username);
        newUser.setName("other-user");
        newUser.setPassword("testpassword");
        newUser = userService.create(newUser).block();
        final User user = newUser;

        // Create permission group
        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for pullChanges_withCRUDOnApplication_throwError");
        permissionGroup = permissionGroupService.create(permissionGroup).block();

        permissionGroupService.assignToUser(permissionGroup, newUser).block();

        // Give crud permissions to app
        genericDatabaseOperation.updatePolicies(
                workspaceId,
                permissionGroup.getId(),
                List.of(AclPermission.READ_WORKSPACES
                ),
                List.of(),
                Workspace.class).block();

        // Give crud permissions to app
        genericDatabaseOperation.updatePolicies(
                application.getId(),
                permissionGroup.getId(),
                List.of(AclPermission.APPLICATION_CREATE_PAGES,
                        AclPermission.DELETE_APPLICATIONS,
                        AclPermission.READ_APPLICATIONS,
                        AclPermission.MANAGE_APPLICATIONS
                ),
                List.of(),
                Application.class).block();

        // Give crud permissions to environment
        genericDatabaseOperation.updatePolicies(
                gitConnectedApplication.getId(),
                permissionGroup.getId(),
                List.of(AclPermission.EXECUTE_ENVIRONMENTS),
                List.of(),
                Environment.class).block();

        Mono<GitPullDTO> applicationMono = runAs(
                gitService.pullApplication(
                        application.getId(),
                        application.getGitApplicationMetadata().getBranchName()),
                user);

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
    public void pullChanges_withNoPermissions_throwException() throws IOException, GitAPIException {
        Application application = createApplicationConnectedToGit("pullChanges_withNoPermissions_throwException", "upstreamChangesInRemote");
        MergeStatusDTO mergeStatusDTO = new MergeStatusDTO();
        mergeStatusDTO.setStatus("2 commits pulled");
        mergeStatusDTO.setMergeAble(true);

        ApplicationJson applicationJson = createAppJson(filePath).block();
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
                        Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(mergeStatusDTO));
        Mockito.when(gitExecutor.getStatus(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(gitStatusDTO));
        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), eq(true), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetched"));
        Mockito.when(gitExecutor.resetToLastCommit(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));

        String username = UUID.randomUUID().toString() + "@test.com";

        // create user
        User newUser = new User();
        newUser.setEmail(username);
        newUser.setName("other-user");
        newUser.setPassword("testpassword");
        newUser = userService.create(newUser).block();
        final User user = newUser;

        // Create permission group
        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for pullChanges_withCRUDOnApplication_throwError");
        permissionGroup = permissionGroupService.create(permissionGroup).block();

        permissionGroupService.assignToUser(permissionGroup, newUser).block();

        Mono<GitPullDTO> applicationMono = runAs(gitService.pullApplication(application.getId(), application.getGitApplicationMetadata().getBranchName()), user);

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(error -> {
                    return error instanceof AppsmithException
                            && error.getMessage().equals(AppsmithError.NO_RESOURCE_FOUND.getMessage("applicationId", application.getId()));
                })
                .verify();
    }

    /**
     * Test case: Flow the policies from Branched application to all it's Themes (Edited / Published / Persisted).
     * <br>
     * Steps:
     * <ol>
     *     <li>Create custom themes for git and branched application</li>
     *     <li>Create persisted themes for git and branched application</li>
     *     <li>Create a custom permission group.</li>
     *     <li>Update the created permission group with CRUD policies for main application.</li>
     *     <li>Fetch the above created resources from DB.</li>
     * </ol>
     * Observations:
     * <ol>
     *     <li>Before role update, system / custom / persisted themes don't contain the permission group in policies</li>
     *     <li>After role update, system themes don't contain the permission group in policies</li>
     *     <li>After role update, custom / persisted themes contains the permission group in policies</li>
     * </ol>
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void testUpdatePoliciesForApplication_validateRelatedThemesInheritPolicies() {
        ApplicationJson applicationJson = createAppJson(filePath).block();
        String branchName = "testUpdatePoliciesForApplication_validateRelatedThemesInheritPolicies";

        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyString(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.checkoutRemoteBranch(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just("testBranch"));
        Mockito.when(gitFileUtils.reconstructApplicationJsonFromGitRepo(Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(gitExecutor.listBranches(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(Mono.just(List.of()));

        Application branchedApplication = runAs(gitService.checkoutBranch(gitConnectedApplication.getId(), "origin/" + branchName), api_user)
                .flatMap(application1 -> applicationService.findByBranchNameAndDefaultApplicationId(branchName, gitConnectedApplication.getId(), READ_APPLICATIONS))
                .block();

        /*
         * Here we are checking for System themes, which already exists in application entity's
         * editModeThemeId and publishedModeThemeId.
         * We create 2 un-named custom themes, and update themes with specific applications.
         * This will populate the application.editModeThemeId for respective applications.
         * We create 2 persisted themes with specific applications.
         * This will populate theme.applicationId with respective applications' id.
         */

        Theme systemTheme = themeService.getSystemTheme("Classic").block();
        Theme systemTheme2 = themeService.getSystemTheme("Sharp").block();
        Theme systemThemeForGitApp = themeRepository.findById(gitConnectedApplication.getPublishedModeThemeId()).block();
        Theme systemThemeForBranchedApp = themeRepository.findById(branchedApplication.getPublishedModeThemeId()).block();
        /*
         * Creating custom unnamed themes from system theme.
         * themeService.updateTheme will create a custom theme and add it to the application.editModeThemeId for
         * applications it is being updated for.
         */
        Theme customThemeForGitApp = themeService.updateTheme(gitConnectedApplication.getId(), null, systemTheme).block();
        Theme customThemeForBranchedApp = themeService.updateTheme(gitConnectedApplication.getId(), branchName, systemTheme).block();
        /*
         * Creating persisted themes from system theme.
         * themeService.persistCurrentTheme will create persisted themes and populate theme.applicationId in created
         * theme.
         */
        Theme persistedThemeForGitApp = themeService.persistCurrentTheme(gitConnectedApplication.getId(), null, systemTheme2).block();
        Theme persistedThemeForBranchedApp = themeService.persistCurrentTheme(gitConnectedApplication.getId(), branchName, systemTheme2).block();


        // Create permission group
        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for testUpdatePoliciesForApplication_validateRelatedThemesInheritPolicies");
        permissionGroup = permissionGroupService.create(permissionGroup).block();

        PermissionGroup finalPermissionGroup = permissionGroup;
        gitConnectedApplication.getPolicies().forEach(policy ->
                assertThat(policy.getPermissionGroups()).doesNotContain(finalPermissionGroup.getId()));
        branchedApplication.getPolicies().forEach(policy ->
                assertThat(policy.getPermissionGroups()).doesNotContain(finalPermissionGroup.getId()));
        systemThemeForGitApp.getPolicies().forEach(policy ->
                assertThat(policy.getPermissionGroups()).doesNotContain(finalPermissionGroup.getId()));
        systemThemeForBranchedApp.getPolicies().forEach(policy ->
                assertThat(policy.getPermissionGroups()).doesNotContain(finalPermissionGroup.getId()));
        customThemeForGitApp.getPolicies().forEach(policy ->
                assertThat(policy.getPermissionGroups()).doesNotContain(finalPermissionGroup.getId()));
        customThemeForBranchedApp.getPolicies().forEach(policy ->
                assertThat(policy.getPermissionGroups()).doesNotContain(finalPermissionGroup.getId()));
        persistedThemeForGitApp.getPolicies().forEach(policy ->
                assertThat(policy.getPermissionGroups()).doesNotContain(finalPermissionGroup.getId()));
        persistedThemeForBranchedApp.getPolicies().forEach(policy ->
                assertThat(policy.getPermissionGroups()).doesNotContain(finalPermissionGroup.getId()));

        // Give crud permissions to app
        genericDatabaseOperation.updatePolicies(
                workspaceId,
                permissionGroup.getId(),
                List.of(AclPermission.READ_WORKSPACES
                ),
                List.of(),
                Workspace.class).block();

        // Give crud permissions to app
        genericDatabaseOperation.updatePolicies(
                gitConnectedApplication.getId(),
                permissionGroup.getId(),
                List.of(AclPermission.APPLICATION_CREATE_PAGES,
                        AclPermission.DELETE_APPLICATIONS,
                        AclPermission.READ_APPLICATIONS,
                        AclPermission.MANAGE_APPLICATIONS
                ),
                List.of(),
                Application.class).block();

        Application gitApplicationPostUpdatePolicy = applicationRepository.findById(gitConnectedApplication.getId()).block();
        Application branchedApplicationPostUpdatePolicy = applicationRepository.findById(branchedApplication.getId()).block();

        Theme systemThemeForGitAppPostUpdatePolicy = themeRepository.findById(systemThemeForGitApp.getId()).block();
        Theme systemThemeForBranchedAppPostUpdatePolicy = themeRepository.findById(systemThemeForBranchedApp.getId()).block();

        Theme customThemeForGitAppPostUpdatePolicy = themeRepository.findById(customThemeForGitApp.getId()).block();
        Theme customThemeForBranchedAppPostUpdatePolicy = themeRepository.findById(customThemeForBranchedApp.getId()).block();

        Theme persistedThemeForGitAppPostUpdatePolicy = themeRepository.findById(persistedThemeForGitApp.getId()).block();
        Theme persistedThemeForBranchedAppPostUpdatePolicy = themeRepository.findById(persistedThemeForBranchedApp.getId()).block();


        gitApplicationPostUpdatePolicy.getPolicies().forEach(policy -> {
            if (policy.getPermission().equals(AclPermission.EXPORT_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(finalPermissionGroup.getId());
            }
            if (policy.getPermission().equals(AclPermission.READ_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(finalPermissionGroup.getId());
            }
            if (policy.getPermission().equals(AclPermission.MANAGE_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(finalPermissionGroup.getId());
            }
            if (policy.getPermission().equals(AclPermission.DELETE_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(finalPermissionGroup.getId());
            }
            if (policy.getPermission().equals(AclPermission.PUBLISH_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(finalPermissionGroup.getId());
            }
            if (policy.getPermission().equals(AclPermission.MAKE_PUBLIC_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(finalPermissionGroup.getId());
            }
            if (policy.getPermission().equals(AclPermission.APPLICATION_CREATE_PAGES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(finalPermissionGroup.getId());
            }
        });
        branchedApplicationPostUpdatePolicy.getPolicies().forEach(policy -> {
            if (policy.getPermission().equals(AclPermission.EXPORT_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(finalPermissionGroup.getId());
            }
            if (policy.getPermission().equals(AclPermission.READ_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(finalPermissionGroup.getId());
            }
            if (policy.getPermission().equals(AclPermission.MANAGE_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(finalPermissionGroup.getId());
            }
            if (policy.getPermission().equals(AclPermission.DELETE_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(finalPermissionGroup.getId());
            }
            if (policy.getPermission().equals(AclPermission.PUBLISH_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(finalPermissionGroup.getId());
            }
            if (policy.getPermission().equals(AclPermission.MAKE_PUBLIC_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(finalPermissionGroup.getId());
            }
            if (policy.getPermission().equals(AclPermission.APPLICATION_CREATE_PAGES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(finalPermissionGroup.getId());
            }
        });

        systemThemeForGitAppPostUpdatePolicy.getPolicies().forEach(policy ->
                assertThat(policy.getPermissionGroups()).doesNotContain(finalPermissionGroup.getId()));
        systemThemeForBranchedAppPostUpdatePolicy.getPolicies().forEach(policy ->
                assertThat(policy.getPermissionGroups()).doesNotContain(finalPermissionGroup.getId()));
        customThemeForGitAppPostUpdatePolicy.getPolicies().forEach(policy -> {
            if (policy.getPermission().equals(AclPermission.MANAGE_THEMES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(finalPermissionGroup.getId());
            }
            if (policy.getPermission().equals(AclPermission.READ_THEMES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(finalPermissionGroup.getId());
            }
        });
        customThemeForBranchedAppPostUpdatePolicy.getPolicies().forEach(policy -> {
            if (policy.getPermission().equals(AclPermission.MANAGE_THEMES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(finalPermissionGroup.getId());
            }
            if (policy.getPermission().equals(AclPermission.READ_THEMES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(finalPermissionGroup.getId());
            }
        });
        persistedThemeForGitAppPostUpdatePolicy.getPolicies().forEach(policy -> {
            if (policy.getPermission().equals(AclPermission.MANAGE_THEMES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(finalPermissionGroup.getId());
            }
            if (policy.getPermission().equals(AclPermission.READ_THEMES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(finalPermissionGroup.getId());
            }
        });
        persistedThemeForBranchedAppPostUpdatePolicy.getPolicies().forEach(policy -> {
            if (policy.getPermission().equals(AclPermission.MANAGE_THEMES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(finalPermissionGroup.getId());
            }
            if (policy.getPermission().equals(AclPermission.READ_THEMES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(finalPermissionGroup.getId());
            }
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void checkoutRemoteBranch_withCRUDOnApplication_newApplicationCreated() {

        ApplicationJson applicationJson = createAppJson(filePath).block();

        List<GitBranchDTO> branchList = new ArrayList<>();
        GitBranchDTO gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName("branchInLocal");
        branchList.add(gitBranchDTO);
        gitBranchDTO = new GitBranchDTO();
        gitBranchDTO.setBranchName("origin/branchInLocal");
        branchList.add(gitBranchDTO);

        Mockito.when(gitExecutor.fetchRemote(Mockito.any(Path.class),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyBoolean(),
                        Mockito.anyString(),
                        Mockito.anyBoolean()))
                .thenReturn(Mono.just("fetchResult"));
        Mockito.when(gitExecutor.checkoutRemoteBranch(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just("testBranch"));
        Mockito.when(gitFileUtils.reconstructApplicationJsonFromGitRepo(Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString(),
                        Mockito.anyString()))
                .thenReturn(Mono.just(applicationJson));
        Mockito.when(gitExecutor.listBranches(Mockito.any(),
                        Mockito.any(),
                        Mockito.any(),
                        Mockito.any(),
                        Mockito.any()))
                .thenReturn(Mono.just(branchList));

        String username = UUID.randomUUID() + "@test.com";

        // create user
        User newUser = new User();
        newUser.setEmail(username);
        newUser.setName("other-user");
        newUser.setPassword("testpassword");
        newUser = userService.create(newUser).block();
        final User user = newUser;

        // Create permission group
        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for pullChanges_withCRUDOnApplication_throwError");
        permissionGroup = permissionGroupService.create(permissionGroup).block();

        permissionGroupService.assignToUser(permissionGroup, newUser).block();

        // Give crud permissions to app
        genericDatabaseOperation.updatePolicies(
                workspaceId,
                permissionGroup.getId(),
                List.of(AclPermission.READ_WORKSPACES
                ),
                List.of(),
                Workspace.class).block();

        // Give crud permissions to app
        genericDatabaseOperation.updatePolicies(
                gitConnectedApplication.getId(),
                permissionGroup.getId(),
                List.of(AclPermission.APPLICATION_CREATE_PAGES,
                        AclPermission.DELETE_APPLICATIONS,
                        AclPermission.READ_APPLICATIONS,
                        AclPermission.MANAGE_APPLICATIONS
                ),
                List.of(),
                Application.class).block();

        // Give crud permissions to environment
        genericDatabaseOperation.updatePolicies(
                gitConnectedApplication.getId(),
                permissionGroup.getId(),
                List.of(AclPermission.EXECUTE_ENVIRONMENTS),
                List.of(),
                Environment.class).block();

        Mono<Application> applicationMono = runAs(
                gitService.checkoutBranch(
                        gitConnectedApplication.getId(),
                        "origin/branchNotInLocal"), user)
                .flatMap(application1 -> applicationService
                        .findByBranchNameAndDefaultApplicationId(
                                "branchNotInLocal",
                                gitConnectedApplication.getId(),
                                READ_APPLICATIONS));

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
    public void checkoutRemoteBranch_withNoPermissions_throwException() throws GitAPIException, IOException {

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

        String username = UUID.randomUUID().toString() + "@test.com";

        // create user
        User newUser = new User();
        newUser.setEmail(username);
        newUser.setName("other-user");
        newUser.setPassword("testpassword");
        newUser = userService.create(newUser).block();
        final User user = newUser;

        // Create permission group
        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for pullChanges_withCRUDOnApplication_throwError");
        permissionGroup = permissionGroupService.create(permissionGroup).block();

        permissionGroupService.assignToUser(permissionGroup, newUser).block();

        Mono<Application> applicationMono = runAs(gitService.checkoutBranch(gitConnectedApplication.getId(), "origin/branchNotInLocal"), user)
                .flatMap(application1 -> applicationService.findByBranchNameAndDefaultApplicationId("branchNotInLocal", gitConnectedApplication.getId(), READ_APPLICATIONS));

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(error -> {
                    return error instanceof AppsmithException
                            && error.getMessage().equals(AppsmithError.NO_RESOURCE_FOUND.getMessage("applicationId", gitConnectedApplication.getId()));
                })
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importApplicationFromGit_withCreateOnWorkspace_Success() {
        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);

        ApplicationJson applicationJson = createAppJson(filePath).block();
        applicationJson.getExportedApplication().setName("testRepo");
        applicationJson.setDatasourceList(new ArrayList<>());

        Mockito.when(gitExecutor.cloneApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranch"));
        Mockito.when(gitFileUtils.reconstructApplicationJsonFromGitRepo(Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(applicationJson));

        String username = UUID.randomUUID().toString() + "@test.com";

        // create user
        User newUser = new User();
        newUser.setEmail(username);
        newUser.setName("other-user");
        newUser.setPassword("testpassword");
        newUser = userService.create(newUser).block();
        final User user = newUser;

        // Create permission group
        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for pullChanges_withCRUDOnApplication_throwError");
        permissionGroup = permissionGroupService.create(permissionGroup).block();

        permissionGroupService.assignToUser(permissionGroup, newUser).block();

        // Give crud permissions to app
        genericDatabaseOperation.updatePolicies(
                workspaceId,
                permissionGroup.getId(),
                List.of(AclPermission.WORKSPACE_CREATE_APPLICATION, AclPermission.READ_WORKSPACES
                ),
                List.of(),
                Workspace.class).block();

        GitAuth gitAuth = runAs(gitService.generateSSHKey(null), user).block();

        Mono<ApplicationImportDTO> applicationMono = runAs(gitService.importApplicationFromGit(workspaceId, gitConnectDTO), user);

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
    public void importApplicationFromGit_withNoPermissions_throwException() {
        GitConnectDTO gitConnectDTO = getConnectRequest("git@github.com:test/testRepo.git", testUserProfile);
        GitAuth gitAuth = gitService.generateSSHKey(null).block();

        ApplicationJson applicationJson = createAppJson(filePath).block();
        applicationJson.getExportedApplication().setName("testRepo");
        applicationJson.setDatasourceList(new ArrayList<>());

        Mockito.when(gitExecutor.cloneApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just("defaultBranch"));
        Mockito.when(gitFileUtils.reconstructApplicationJsonFromGitRepo(Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyString()))
                .thenReturn(Mono.just(applicationJson));

        String username = UUID.randomUUID().toString() + "@test.com";

        // create user
        User newUser = new User();
        newUser.setEmail(username);
        newUser.setName("other-user");
        newUser.setPassword("testpassword");
        newUser = userService.create(newUser).block();
        final User user = newUser;

        // Create permission group
        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for pullChanges_withCRUDOnApplication_throwError");
        permissionGroup = permissionGroupService.create(permissionGroup).block();

        permissionGroupService.assignToUser(permissionGroup, newUser).block();

        Mono<ApplicationImportDTO> applicationMono = runAs(gitService.importApplicationFromGit(workspaceId, gitConnectDTO), user);

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(error -> {
                    return error instanceof AppsmithException
                            && error.getMessage().equals(AppsmithError.NO_RESOURCE_FOUND.getMessage("workspace", workspaceId));
                })
                .verify();
    }


    @Test
    @WithUserDetails(value = "api_user")
    public void deleteBranch_withCRUDOnApplication_Success() throws IOException, GitAPIException {
        Application application = createApplicationConnectedToGit("deleteBranch_withCRUDOnApplication_Success", "master");
        application.getGitApplicationMetadata().setDefaultBranchName("test");
        applicationService.save(application).block();
        Mockito.when(gitExecutor.deleteBranch(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));

        String username = UUID.randomUUID().toString() + "@test.com";

        // create user
        User newUser = new User();
        newUser.setEmail(username);
        newUser.setName("other-user");
        newUser.setPassword("testpassword");
        newUser = userService.create(newUser).block();
        final User user = newUser;

        // Create permission group
        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for pullChanges_withCRUDOnApplication_throwError");
        permissionGroup = permissionGroupService.create(permissionGroup).block();

        permissionGroupService.assignToUser(permissionGroup, newUser).block();

        // Give crud permissions to app
        genericDatabaseOperation.updatePolicies(
                workspaceId,
                permissionGroup.getId(),
                List.of(AclPermission.READ_WORKSPACES
                ),
                List.of(),
                Workspace.class).block();

        // Give crud permissions to app
        genericDatabaseOperation.updatePolicies(
                application.getId(),
                permissionGroup.getId(),
                List.of(AclPermission.APPLICATION_CREATE_PAGES,
                        AclPermission.DELETE_APPLICATIONS,
                        AclPermission.READ_APPLICATIONS,
                        AclPermission.MANAGE_APPLICATIONS
                ),
                List.of(),
                Application.class).block();

        Mono<Application> applicationMono = runAs(gitService.deleteBranch(application.getId(), "master"), user);

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
    public void deleteBranch_withNoPermissions_throwException() throws IOException, GitAPIException {
        Application application = createApplicationConnectedToGit("deleteBranch_withNoPermissions_throwException", "master");
        application.getGitApplicationMetadata().setDefaultBranchName("test");
        applicationService.save(application).block();
        Mockito.when(gitExecutor.deleteBranch(Mockito.any(Path.class), Mockito.anyString()))
                .thenReturn(Mono.just(true));

        String username = UUID.randomUUID().toString() + "@test.com";

        // create user
        User newUser = new User();
        newUser.setEmail(username);
        newUser.setName("other-user");
        newUser.setPassword("testpassword");
        newUser = userService.create(newUser).block();
        final User user = newUser;

        // Create permission group
        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for pullChanges_withCRUDOnApplication_throwError");
        permissionGroup = permissionGroupService.create(permissionGroup).block();

        permissionGroupService.assignToUser(permissionGroup, newUser).block();

        Mono<Application> applicationMono = runAs(gitService.deleteBranch(application.getId(), "master"), user);

        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(error -> {
                    return error instanceof AppsmithException
                            && error.getMessage().equals(AppsmithError.NO_RESOURCE_FOUND.getMessage("applicationId", application.getId()));
                })
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createBranch_withCRUDOnApp_newApplicationCreated() throws GitAPIException, IOException {

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
        testApplication.setName("createBranch_withCRUDOnApp_newApplicationCreated");
        testApplication.setWorkspaceId(workspaceId);
        testApplication = applicationPageService.createApplication(testApplication).block();

        String username = UUID.randomUUID().toString() + "@test.com";

        // create user
        User newUser = new User();
        newUser.setEmail(username);
        newUser.setName("other-user");
        newUser.setPassword("testpassword");
        newUser = userService.create(newUser).block();
        final User user = newUser;

        // Create permission group
        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for pullChanges_withCRUDOnApplication_throwError");
        permissionGroup = permissionGroupService.create(permissionGroup).block();

        permissionGroupService.assignToUser(permissionGroup, newUser).block();

        // Give crud permissions to app
        genericDatabaseOperation.updatePolicies(
                workspaceId,
                permissionGroup.getId(),
                List.of(AclPermission.READ_WORKSPACES
                ),
                List.of(),
                Workspace.class).block();

        // Give crud permissions to app
        genericDatabaseOperation.updatePolicies(
                testApplication.getId(),
                permissionGroup.getId(),
                List.of(AclPermission.APPLICATION_CREATE_PAGES,
                        AclPermission.DELETE_APPLICATIONS,
                        AclPermission.READ_APPLICATIONS,
                        AclPermission.MANAGE_APPLICATIONS
                ),
                List.of(),
                Application.class).block();

        Mono<Application> createBranchMono = Mono.just(testApplication)
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
                                            .then(layoutActionService.updateLayout(testPage.getId(), testPage.getApplicationId(), layout.getId(), layout)),
                                    layoutCollectionService.createCollection(actionCollectionDTO, null)
                            )
                            .then(gitService.connectApplicationToGit(application.getId(), gitConnectDTO, "origin"));
                })
                .flatMap(application ->
                        runAs(gitService.createBranch(application.getId(), createGitBranchDTO, application.getGitApplicationMetadata().getBranchName()), user)
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
    public void createBranch_withNoPermissions_newApplicationCreated() throws GitAPIException, IOException {

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
        testApplication.setName("createBranch_withNoPermissions_newApplicationCreated");
        testApplication.setWorkspaceId(workspaceId);
        testApplication = applicationPageService.createApplication(testApplication).block();
        Application finalApplication = testApplication;

        String username = UUID.randomUUID().toString() + "@test.com";

        // create user
        User newUser = new User();
        newUser.setEmail(username);
        newUser.setName("other-user");
        newUser.setPassword("testpassword");
        newUser = userService.create(newUser).block();
        final User user = newUser;

        // Create permission group
        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for pullChanges_withCRUDOnApplication_throwError");
        permissionGroup = permissionGroupService.create(permissionGroup).block();

        permissionGroupService.assignToUser(permissionGroup, newUser).block();

        Mono<Application> createBranchMono = Mono.just(testApplication)
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
                                            .then(layoutActionService.updateLayout(testPage.getId(), testPage.getApplicationId(), layout.getId(), layout)),
                                    layoutCollectionService.createCollection(actionCollectionDTO, null)
                            )
                            .then(gitService.connectApplicationToGit(application.getId(), gitConnectDTO, "origin"));
                })
                .flatMap(application ->
                        runAs(gitService.createBranch(application.getId(), createGitBranchDTO, application.getGitApplicationMetadata().getBranchName()), user)
                                .then(applicationService.findByBranchNameAndDefaultApplicationId(createGitBranchDTO.getBranchName(), application.getId(), READ_APPLICATIONS))
                );


        StepVerifier
                .create(createBranchMono.zipWhen(application -> Mono.zip(
                        newActionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                        actionCollectionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                        newPageService.findNewPagesByApplicationId(application.getId(), READ_PAGES).collectList(),
                        applicationService.findById(application.getGitApplicationMetadata().getDefaultApplicationId())
                )))
                .expectErrorMatches(error -> {
                    return error instanceof AppsmithException
                            && error.getMessage().equals(AppsmithError.NO_RESOURCE_FOUND.getMessage("application", finalApplication.getId() + ",defaultBranchName"));
                })
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void commitApplication_withCRUDOnApplication_success() throws GitAPIException, IOException {

        GitCommitDTO commitDTO = new GitCommitDTO();
        commitDTO.setDoPush(false);
        commitDTO.setCommitMessage("commit message");

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.commitApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("sample response for commit"));

        String username = UUID.randomUUID().toString() + "@test.com";

        // create user
        User newUser = new User();
        newUser.setEmail(username);
        newUser.setName("other-user");
        newUser.setPassword("testpassword");
        newUser = userService.create(newUser).block();
        final User user = newUser;

        // Create permission group
        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for pullChanges_withCRUDOnApplication_throwError");
        permissionGroup = permissionGroupService.create(permissionGroup).block();

        permissionGroupService.assignToUser(permissionGroup, newUser).block();

        // Give crud permissions to app
        genericDatabaseOperation.updatePolicies(
                workspaceId,
                permissionGroup.getId(),
                List.of(AclPermission.READ_WORKSPACES
                ),
                List.of(),
                Workspace.class).block();

        // Give crud permissions to app
        genericDatabaseOperation.updatePolicies(
                gitConnectedApplication.getId(),
                permissionGroup.getId(),
                List.of(AclPermission.APPLICATION_CREATE_PAGES,
                        AclPermission.DELETE_APPLICATIONS,
                        AclPermission.READ_APPLICATIONS,
                        AclPermission.MANAGE_APPLICATIONS
                ),
                List.of(),
                Application.class).block();

        Mono<String> commitMono = runAs(gitService.commitApplication(commitDTO, gitConnectedApplication.getId(), DEFAULT_BRANCH), user);

        StepVerifier
                .create(commitMono)
                .assertNext(commitMsg -> {
                    assertThat(commitMsg).contains("sample response for commit");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void commitApplication_withNoPermissions_success() throws GitAPIException, IOException {

        GitCommitDTO commitDTO = new GitCommitDTO();
        commitDTO.setDoPush(false);
        commitDTO.setCommitMessage("commit message");

        Mockito.when(gitFileUtils.saveApplicationToLocalRepo(Mockito.any(Path.class), Mockito.any(ApplicationJson.class), Mockito.anyString()))
                .thenReturn(Mono.just(Paths.get("")));
        Mockito.when(gitExecutor.commitApplication(Mockito.any(Path.class), Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyBoolean()))
                .thenReturn(Mono.just("sample response for commit"));

        String username = UUID.randomUUID().toString() + "@test.com";

        // create user
        User newUser = new User();
        newUser.setEmail(username);
        newUser.setName("other-user");
        newUser.setPassword("testpassword");
        newUser = userService.create(newUser).block();
        final User user = newUser;

        // Create permission group
        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for pullChanges_withCRUDOnApplication_throwError");
        permissionGroup = permissionGroupService.create(permissionGroup).block();

        permissionGroupService.assignToUser(permissionGroup, newUser).block();

        Mono<String> commitMono = runAs(gitService.commitApplication(commitDTO, gitConnectedApplication.getId(), DEFAULT_BRANCH), user);

        StepVerifier
                .create(commitMono)
                .expectErrorMatches(error -> {
                    return error instanceof AppsmithException
                            && error.getMessage().equals(AppsmithError.NO_RESOURCE_FOUND.getMessage("applicationId", gitConnectedApplication.getId()));
                })
                .verify();
    }
}