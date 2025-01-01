package com.appsmith.server.services.ce;

import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.JSValue;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Policy;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.artifacts.base.ArtifactService;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationDetail;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Asset;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.RecentlyUsedEntityDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.migrations.ApplicationVersion;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.AssetRepository;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ConsolidatedAPIService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.ReleaseNotesService;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import com.appsmith.server.solutions.UserReleaseNotes;
import com.appsmith.server.themes.base.ThemeService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.assertj.core.api.Assertions;
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
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuple4;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.CONNECT_TO_GIT;
import static com.appsmith.server.acl.AclPermission.DELETE_PAGES;
import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.EXPORT_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_AUTO_COMMIT;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_DEFAULT_BRANCHES;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.MANAGE_PROTECTED_BRANCHES;
import static com.appsmith.server.acl.AclPermission.MANAGE_THEMES;
import static com.appsmith.server.acl.AclPermission.PAGE_CREATE_PAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.PUBLISH_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
import static com.appsmith.server.constants.ArtifactType.APPLICATION;
import static com.appsmith.server.constants.CommonConstants.EVALUATION_VERSION;
import static com.appsmith.server.constants.FieldName.ADMINISTRATOR;
import static com.appsmith.server.constants.FieldName.ANONYMOUS_USER;
import static com.appsmith.server.constants.FieldName.DEFAULT_PAGE_LAYOUT;
import static com.appsmith.server.constants.FieldName.DEVELOPER;
import static com.appsmith.server.constants.FieldName.VIEWER;
import static com.appsmith.server.constants.ce.FieldNameCE.WORKSPACE;
import static com.appsmith.server.dtos.CustomJSLibContextDTO.getDTOFromCustomJSLib;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.doReturn;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@SpringBootTest
@Slf4j
@DirtiesContext
public class ApplicationServiceCETest {

    static Plugin testPlugin = new Plugin();
    static Datasource testDatasource = new Datasource();
    static Datasource testDatasource1 = new Datasource();

    static Application gitConnectedApp = new Application();

    @Autowired
    ArtifactService artifactService;

    @Autowired
    ApplicationService applicationService;

    @Qualifier("applicationPageServiceCEImpl") @Autowired
    ApplicationPageServiceCE applicationPageService;

    @Autowired
    UserService userService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    PluginService pluginService;

    @Autowired
    NewActionService newActionService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    UserReleaseNotes userReleaseNotes;

    @Autowired
    NewPageService newPageService;

    @Autowired
    NewPageRepository newPageRepository;

    @Autowired
    ApplicationRepository applicationRepository;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    UpdateLayoutService updateLayoutService;

    @Autowired
    LayoutCollectionService layoutCollectionService;

    @Autowired
    ActionCollectionService actionCollectionService;

    @Autowired
    CustomJSLibService customJSLibService;

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    ImportService importService;

    @Autowired
    ExportService exportService;

    @Autowired
    ThemeService themeService;

    @Autowired
    PermissionGroupService permissionGroupService;

    @MockBean
    ReleaseNotesService releaseNotesService;

    @MockBean
    PluginExecutor pluginExecutor;

    @Autowired
    ReactiveMongoOperations mongoOperations;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    SessionUserService sessionUserService;

    @Autowired
    EnvironmentPermission environmentPermission;

    @Autowired
    PagePermission pagePermission;

    @Autowired
    DatasourcePermission datasourcePermission;

    @Autowired
    DatasourceRepository datasourceRepository;

    @Autowired
    ApplicationPermission applicationPermission;

    @Autowired
    UserAndAccessManagementService userAndAccessManagementService;

    @Autowired
    CacheableRepositoryHelper cacheableRepositoryHelper;

    @SpyBean
    UserDataService userDataService;

    String workspaceId;
    String defaultEnvironmentId;

    private final String tempUserPassword = "tempUserPassword";

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private ConsolidatedAPIService consolidatedAPIService;

    private <I> Mono<I> runAs(Mono<I> input, User user) {
        log.info("Running as user: {}", user.getEmail());
        return input.contextWrite((ctx) -> {
            SecurityContext securityContext = new SecurityContextImpl(
                    new UsernamePasswordAuthenticationToken(user, tempUserPassword, user.getAuthorities()));
            return ctx.put(SecurityContext.class, Mono.just(securityContext));
        });
    }

    @BeforeEach
    public void setup() {

        User currentUser = sessionUserService.getCurrentUser().block();
        if (currentUser == null || !currentUser.getEmail().equals("api_user")) {
            // Don't do any setups
            return;
        }

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        User apiUser = userService.findByEmail("api_user").block();

        Workspace toCreate = new Workspace();
        toCreate.setName("ApplicationServiceTest");

        Set<String> beforeCreatingWorkspace =
                cacheableRepositoryHelper.getPermissionGroupsOfUser(currentUser).block();
        log.info("Permission Groups for User before creating workspace: {}", beforeCreatingWorkspace);
        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        workspaceId = workspace.getId();

        defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                .block();

        Application gitConnectedApp1 = new Application();
        gitConnectedApp1.setWorkspaceId(workspaceId);
        GitArtifactMetadata gitData = new GitArtifactMetadata();
        gitData.setBranchName("testBranch");
        gitData.setDefaultBranchName("testBranch");
        gitData.setRepoName("testRepo");
        gitData.setRemoteUrl("git@test.com:user/testRepo.git");
        gitData.setRepoName("testRepo");
        gitConnectedApp1.setGitApplicationMetadata(gitData);
        // This will be altered in update app by branch test
        gitConnectedApp1.setName("gitConnectedApp");
        Application newGitConnectedApp = applicationPageService
                .createApplication(gitConnectedApp1)
                .flatMap(application -> {
                    application.getGitApplicationMetadata().setDefaultApplicationId(application.getId());
                    return applicationService.save(application);
                })
                .block();

        // Assign the branchName to all the resources connected to the application
        ApplicationJson gitConnectedApplicationJson = exportService
                .exportByArtifactIdAndBranchName(newGitConnectedApp.getId(), gitData.getBranchName(), APPLICATION)
                .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson)
                .block();
        gitConnectedApp = importService
                .importArtifactInWorkspaceFromGit(
                        workspaceId, newGitConnectedApp.getId(), gitConnectedApplicationJson, gitData.getBranchName())
                .map(importableArtifact -> (Application) importableArtifact)
                .block();

        testPlugin = pluginService.findByPackageName("restapi-plugin").block();

        Datasource datasource = new Datasource();
        datasource.setName("Clone App with action Test");
        datasource.setPluginId(testPlugin.getId());
        datasource.setWorkspaceId(workspaceId);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);
        testDatasource = datasourceService.create(datasource).block();

        String environmentId = workspaceService
                .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                .block();

        Datasource datasource1 = new Datasource();
        datasource1.setName("Clone App with action Test1");
        datasource1.setPluginId(testPlugin.getId());
        DatasourceConfiguration datasourceConfiguration1 = new DatasourceConfiguration();
        datasourceConfiguration1.setUrl("http://test.com");
        datasource1.setWorkspaceId(workspaceId);

        HashMap<String, DatasourceStorageDTO> storages1 = new HashMap<>();
        storages1.put(environmentId, new DatasourceStorageDTO(null, environmentId, datasourceConfiguration1));
        datasource1.setDatasourceStorages(storages1);

        testDatasource1 = datasourceService.create(datasource1).block();
        Set<String> afterCreatingWorkspace =
                cacheableRepositoryHelper.getPermissionGroupsOfUser(currentUser).block();
        log.info("Permission Groups for User after creating workspace: {}", afterCreatingWorkspace);

        log.info("Workspace ID: {}", workspaceId);
        log.info("Workspace Role Ids: {}", workspace.getDefaultPermissionGroups());
        log.info("Policy for created Workspace: {}", workspace.getPolicies());
        log.info("Current User ID: {}", currentUser.getId());
    }

    @AfterEach
    public void cleanup() {
        User currentUser = sessionUserService.getCurrentUser().block();
        if (currentUser == null || !currentUser.getEmail().equals("api_user")) {
            // Since no setup was done, hence no cleanup needs to happen
            return;
        }
        List<Application> deletedApplications = applicationService
                .findByWorkspaceId(workspaceId, applicationPermission.getDeletePermission())
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .collectList()
                .block();
        Workspace deletedWorkspace = workspaceService.archiveById(workspaceId).block();
    }

    private Mono<? extends BaseDomain> getArchivedResource(String id, Class<? extends BaseDomain> domainClass) {
        return mongoOperations.findOne(new Query(where("id").is(id)), domainClass);
    }

    private List<String> createDummyApplications(String workspaceId) {
        List<String> applicationIds = new ArrayList<>();
        for (int count = 0; count < 4; count++) {
            Application application = new Application();
            application.setName("Application " + count);
            application.setWorkspaceId(workspaceId);
            application = applicationPageService.createApplication(application).block();
            applicationIds.add(application.getId());
        }
        return applicationIds;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createApplicationWithNullName() {
        Application application = new Application();
        Mono<Application> applicationMono =
                Mono.just(application).flatMap(app -> applicationPageService.createApplication(app, workspaceId));
        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.NAME)))
                .verify();
    }

    /**
     * Create an application and validate it.
     *
     * @param applicationName      This is the initial name of the application which will try to create the application,
     *                             but not guaranteed this will be the application's final name due to retry logic
     * @param applicationFinalName This is the application final name and it can be different from initial name
     *                             due to retry if there is name clash.
     */
    private void createAndVerifyValidApplication(String applicationName, String applicationFinalName) {
        Application testApplication = new Application();
        testApplication.setName(applicationName);
        Mono<Application> applicationMono = applicationPageService.createApplication(testApplication, workspaceId);

        Mono<Workspace> workspaceResponse = workspaceService.findById(workspaceId, READ_WORKSPACES);

        Mono<List<PermissionGroup>> defaultPermissionGroupsMono = workspaceResponse
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList();

        StepVerifier.create(Mono.zip(applicationMono, themeService.getDefaultThemeId(), defaultPermissionGroupsMono))
                .assertNext(tuple2 -> {
                    Application application = tuple2.getT1();
                    String defaultThemeId = tuple2.getT2();
                    assertThat(application).isNotNull();
                    assertThat(application.getSlug()).isEqualTo(TextUtils.makeSlug(applicationFinalName));
                    assertThat(application.isAppIsExample()).isFalse();
                    assertThat(application.getId()).isNotNull();
                    assertThat(application.getName()).isEqualTo(applicationFinalName);
                    assertThat(application.getPolicies()).isNotEmpty();
                    assertThat(application.getWorkspaceId()).isEqualTo(workspaceId);
                    assertThat(application.getModifiedBy()).isEqualTo("api_user");
                    assertThat(application.getUpdatedAt()).isNotNull();
                    assertThat(application.getEvaluationVersion()).isEqualTo(EVALUATION_VERSION);
                    assertThat(application.getApplicationVersion()).isEqualTo(ApplicationVersion.LATEST_VERSION);
                    assertThat(application.getColor()).isNotEmpty();
                    assertThat(application.getEditModeThemeId()).isEqualTo(defaultThemeId);
                    assertThat(application.getPublishedModeThemeId()).isEqualTo(defaultThemeId);
                    assertThat(application.getCollapseInvisibleWidgets()).isEqualTo(TRUE);

                    List<PermissionGroup> permissionGroups = tuple2.getT3();
                    PermissionGroup adminPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                            .findFirst()
                            .get();

                    PermissionGroup developerPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                            .findFirst()
                            .get();

                    PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                            .findFirst()
                            .get();

                    Policy manageAppPolicy = Policy.builder()
                            .permission(MANAGE_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();

                    Policy connectGitPolicy = Policy.builder()
                            .permission(CONNECT_TO_GIT.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();

                    Policy manageDefaultBranchGitPolicy = Policy.builder()
                            .permission(MANAGE_DEFAULT_BRANCHES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();

                    Policy manageProtectedBranchGitPolicy = Policy.builder()
                            .permission(MANAGE_PROTECTED_BRANCHES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();

                    Policy manageAutoCommitGitPolicy = Policy.builder()
                            .permission(MANAGE_AUTO_COMMIT.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();

                    Policy readAppPolicy = Policy.builder()
                            .permission(READ_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId()))
                            .build();
                    Policy publishAppPolicy = Policy.builder()
                            .permission(PUBLISH_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy exportAppPolicy = Policy.builder()
                            .permission(EXPORT_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId()))
                            .build();
                    Policy deleteApplicationsPolicy = Policy.builder()
                            .permission(AclPermission.DELETE_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy createPagesPolicy = Policy.builder()
                            .permission(AclPermission.APPLICATION_CREATE_PAGES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();

                    assertThat(application.getPolicies())
                            .containsAll(Set.of(
                                    manageAppPolicy,
                                    readAppPolicy,
                                    publishAppPolicy,
                                    exportAppPolicy,
                                    deleteApplicationsPolicy,
                                    createPagesPolicy,
                                    connectGitPolicy,
                                    manageProtectedBranchGitPolicy,
                                    manageDefaultBranchGitPolicy,
                                    manageAutoCommitGitPolicy));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createValidApplication() {
        this.createAndVerifyValidApplication("ApplicationServiceTest TestApp", "ApplicationServiceTest TestApp");
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createApplicationWithDuplicateName() {
        // Creating first App with name "ApplicationServiceTest TestApp"
        this.createAndVerifyValidApplication("ApplicationServiceTest TestApp", "ApplicationServiceTest TestApp");

        // Creating second App with same name "ApplicationServiceTest TestApp" but due to duplicate name its resultant
        // name will be ApplicationServiceTest TestApp (1)
        this.createAndVerifyValidApplication("ApplicationServiceTest TestApp", "ApplicationServiceTest TestApp (1)");
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void defaultPageCreateOnCreateApplicationTest() {
        Application testApplication = new Application();
        testApplication.setName("ApplicationServiceTest TestAppForTestingPage");
        Flux<PageDTO> pagesFlux = applicationPageService
                .createApplication(testApplication, workspaceId)
                // Fetch the unpublished pages by applicationId
                .flatMapMany(application -> newPageService.findByApplicationId(application.getId(), READ_PAGES, false));

        Policy managePagePolicy =
                Policy.builder().permission(MANAGE_PAGES.getValue()).build();
        Policy readPagePolicy =
                Policy.builder().permission(READ_PAGES.getValue()).build();

        StepVerifier.create(pagesFlux)
                .assertNext(page -> {
                    assertThat(page).isNotNull();
                    assertThat(page.getName()).isEqualTo(FieldName.DEFAULT_PAGE_NAME);
                    assertThat(page.getLayouts()).isNotEmpty();
                    assertThat(page.getPolicies()).isNotEmpty();
                    assertThat(page.getPolicies().stream()
                                    .map(Policy::getPermission)
                                    .collect(Collectors.toSet()))
                            .contains(
                                    MANAGE_PAGES.getValue(),
                                    READ_PAGES.getValue(),
                                    PAGE_CREATE_PAGE_ACTIONS.getValue(),
                                    DELETE_PAGES.getValue());
                })
                .verifyComplete();
    }

    /* Tests for Get Application Flow */

    @Test
    @WithUserDetails(value = "api_user")
    public void getApplicationInvalidId() {
        Mono<Application> applicationMono = applicationService.getById("random-id");
        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.APPLICATION, "random-id")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getApplicationNullId() {
        Mono<Application> applicationMono = applicationService.getById(null);
        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validGetApplicationById() {
        Application application = new Application();
        application.setName("validGetApplicationById-Test");
        Mono<Application> createApplication = applicationPageService.createApplication(application, workspaceId);
        Mono<Application> getApplication = createApplication.flatMap(t -> applicationService.getById(t.getId()));
        StepVerifier.create(getApplication)
                .assertNext(t -> {
                    assertThat(t).isNotNull();
                    assertThat(t.isAppIsExample()).isFalse();
                    assertThat(t.getId()).isNotNull();
                    assertThat(t.getName()).isEqualTo("validGetApplicationById-Test");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getApplicationByDefaultIdAndBranchName_emptyBranchName_success() {
        Mono<Application> applicationMono =
                applicationService.findByBranchNameAndBaseApplicationId("", gitConnectedApp.getId(), READ_APPLICATIONS);
        StepVerifier.create(applicationMono)
                .assertNext(application -> {
                    assertThat(application.getId()).isEqualTo(gitConnectedApp.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getApplicationByDefaultIdAndBranchName_invalidBranchName_throwException() {
        Mono<Application> applicationMono = applicationService.findByBranchNameAndBaseApplicationId(
                "randomBranch", gitConnectedApp.getId(), READ_APPLICATIONS);
        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(
                                        FieldName.APPLICATION, gitConnectedApp.getId() + "," + "randomBranch")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getApplicationByDefaultIdAndBranchName_validBranchName_success() {
        Mono<Application> applicationMono = applicationService.findByBranchNameAndBaseApplicationId(
                "testBranch", gitConnectedApp.getId(), READ_APPLICATIONS);
        StepVerifier.create(applicationMono)
                .assertNext(application -> {
                    assertThat(application.getGitApplicationMetadata())
                            .isEqualTo(gitConnectedApp.getGitApplicationMetadata());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getApplicationsByBranchName_validBranchName_success() {
        Mono<Application> getApplication = applicationService.findByBranchedId(gitConnectedApp.getId(), null);
        StepVerifier.create(getApplication)
                .assertNext(t -> {
                    assertThat(t).isNotNull();
                    assertThat(t.getGitApplicationMetadata().getBranchName())
                            .isEqualTo(
                                    gitConnectedApp.getGitApplicationMetadata().getBranchName());
                    assertThat(t.getId()).isEqualTo(gitConnectedApp.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validGetApplications() {
        Application application = new Application();
        application.setName("validGetApplications-Test");

        Mono<Workspace> workspaceResponse = workspaceService.findById(workspaceId, READ_WORKSPACES);

        List<PermissionGroup> permissionGroups = workspaceResponse
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList()
                .block();

        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();

        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                .findFirst()
                .get();

        PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                .findFirst()
                .get();

        Policy readAppPolicy = Policy.builder()
                .permission(READ_APPLICATIONS.getValue())
                .permissionGroups(Set.of(
                        adminPermissionGroup.getId(), developerPermissionGroup.getId(), viewerPermissionGroup.getId()))
                .build();

        Mono<Application> createApplication = applicationPageService.createApplication(application, workspaceId);
        List<Application> applicationList = createApplication
                .flatMapMany(app -> applicationService.findById(app.getId()))
                .collectList()
                .block();

        assertThat(applicationList).isNotEmpty();
        applicationList.stream()
                .filter(t -> t.getName().equals("validGetApplications-Test"))
                .forEach(t -> {
                    assertThat(t.getId()).isNotNull();
                    assertThat(t.isAppIsExample()).isFalse();
                    assertThat(t.getPolicies()).isNotEmpty();
                    assertThat(t.getPolicies()).containsAll(Set.of(readAppPolicy));
                });
    }

    /* Tests for Update Application Flow */
    @Test
    @WithUserDetails(value = "api_user")
    public void validUpdateApplication() {
        Application application = new Application();
        application.setName("validUpdateApplication-Test");

        Mono<Application> createApplication = applicationPageService.createApplication(application, workspaceId);
        Mono<Application> updateApplication = createApplication
                .map(t -> {
                    t.setName("NewValidUpdateApplication-Test");
                    return t;
                })
                .flatMap(t -> applicationService.update(t.getId(), t))
                .flatMap(t -> applicationService.getById(t.getId()));

        StepVerifier.create(updateApplication)
                .assertNext(t -> {
                    assertThat(t).isNotNull();
                    assertThat(t.getId()).isNotNull();
                    assertThat(t.getPolicies()).isNotEmpty();
                    assertThat(t.getName()).isEqualTo("NewValidUpdateApplication-Test");
                    assertThat(t.getSlug()).isEqualTo(TextUtils.makeSlug(t.getName()));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void invalidUpdateApplication() {
        Application testApp1 = new Application();
        testApp1.setName("validApplication1");
        Application testApp2 = new Application();
        testApp2.setName("validApplication2");

        Mono<List<Application>> createMultipleApplications = Mono.zip(
                        applicationPageService.createApplication(testApp1, workspaceId),
                        applicationPageService.createApplication(testApp2, workspaceId))
                .map(tuple -> List.of(tuple.getT1(), tuple.getT2()));

        Mono<Application> updateInvalidApplication = createMultipleApplications
                .map(applicationList -> {
                    Application savedTestApp1 = applicationList.get(0);
                    Application savedTestApp2 = applicationList.get(1);
                    savedTestApp2.setName(savedTestApp1.getName());
                    return savedTestApp2;
                })
                .flatMap(t -> applicationService.update(t.getId(), t));

        StepVerifier.create(updateInvalidApplication)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException)
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateApplicationByIdAndBranchName_validBranchName_success() {
        gitConnectedApp.setName("updatedGitConnectedApplication");

        Mono<Application> updateApplication = applicationService
                .update(gitConnectedApp.getId(), gitConnectedApp)
                .flatMap(t -> {
                    GitArtifactMetadata gitData = t.getGitApplicationMetadata();
                    return applicationService.findByBranchNameAndBaseApplicationId(
                            gitData.getBranchName(), gitData.getDefaultApplicationId(), READ_APPLICATIONS);
                });

        StepVerifier.create(updateApplication)
                .assertNext(t -> {
                    assertThat(t).isNotNull();
                    assertThat(t.getId()).isNotNull();
                    assertThat(t.getPolicies()).isNotEmpty();
                    assertThat(t.getName()).isEqualTo("updatedGitConnectedApplication");
                    assertThat(t.getSlug()).isEqualTo(TextUtils.makeSlug(t.getName()));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void reuseDeletedAppName() {
        Application firstApp = new Application();
        firstApp.setName("Ghost app");

        Application secondApp = new Application();
        secondApp.setName("Ghost app");

        Mono<Application> firstAppDeletion = applicationPageService
                .createApplication(firstApp, workspaceId)
                .flatMap(app -> applicationService.archive(app))
                .cache();

        Mono<Application> secondAppCreation =
                firstAppDeletion.then(applicationPageService.createApplication(secondApp, workspaceId));

        StepVerifier.create(Mono.zip(firstAppDeletion, secondAppCreation))
                .assertNext(tuple2 -> {
                    Application first = tuple2.getT1(), second = tuple2.getT2();
                    assertThat(first.getName()).isEqualTo("Ghost app");
                    assertThat(second.getName()).isEqualTo("Ghost app");
                    assertThat(first.isDeleted()).isTrue();
                    assertThat(second.isDeleted()).isFalse();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validMakeApplicationPublic() {
        Application application = new Application();
        application.setName("validMakeApplicationPublic-Test");

        Application createdApplication = applicationPageService
                .createApplication(application, workspaceId)
                .block();

        Mono<Workspace> workspaceResponse = workspaceService.findById(workspaceId, READ_WORKSPACES);

        List<PermissionGroup> permissionGroups = workspaceResponse
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList()
                .block();

        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();

        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                .findFirst()
                .get();

        PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                .findFirst()
                .get();

        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);

        Mono<Application> publicAppMono = applicationService
                .changeViewAccessForSingleBranchByBranchedApplicationId(
                        createdApplication.getId(), applicationAccessDTO)
                .cache();

        Mono<PageDTO> pageMono = publicAppMono.flatMap(app -> {
            String pageId = app.getPages().get(0).getId();
            return newPageService.findPageById(pageId, READ_PAGES, false);
        });

        Mono<PermissionGroup> publicPermissionGroupMono = permissionGroupService.getPublicPermissionGroup();

        User anonymousUser = userRepository.findByEmail(ANONYMOUS_USER).block();

        StepVerifier.create(Mono.zip(publicAppMono, pageMono, publicPermissionGroupMono))
                .assertNext(tuple -> {
                    Application publicApp = tuple.getT1();
                    PageDTO page = tuple.getT2();
                    PermissionGroup permissionGroup = tuple.getT3();

                    String permissionGroupId = permissionGroup.getId();

                    assertThat(publicApp.getIsPublic()).isTrue();

                    Policy manageAppPolicy = Policy.builder()
                            .permission(MANAGE_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy readAppPolicy = Policy.builder()
                            .permission(READ_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId(),
                                    permissionGroupId))
                            .build();

                    Policy managePagePolicy = Policy.builder()
                            .permission(MANAGE_PAGES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy readPagePolicy = Policy.builder()
                            .permission(READ_PAGES.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId(),
                                    permissionGroupId))
                            .build();

                    assertThat(publicApp.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));

                    // Check the child page's policies
                    assertThat(page.getPolicies()).containsAll(Set.of(managePagePolicy, readPagePolicy));

                    // Finally assert that permission group has been assigned to anonymous user.
                    assertThat(permissionGroup.getAssignedToUserIds()).hasSize(1);
                    assertThat(permissionGroup.getAssignedToUserIds()).containsAll(Set.of(anonymousUser.getId()));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validMakeApplicationPrivate() {
        Application application = new Application();
        application.setName("validMakeApplicationPrivate-Test");

        List<PermissionGroup> permissionGroups = workspaceService
                .findById(workspaceId, READ_WORKSPACES)
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList()
                .block();

        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();

        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                .findFirst()
                .get();

        PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                .findFirst()
                .get();

        Mono<Application> createApplication = applicationPageService.createApplication(application, workspaceId);

        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        Mono<Application> privateAppMono = createApplication
                .flatMap(application1 -> {
                    applicationAccessDTO.setPublicAccess(true);
                    return applicationService.changeViewAccessForSingleBranchByBranchedApplicationId(
                            application1.getId(), applicationAccessDTO);
                })
                .flatMap(application1 -> {
                    applicationAccessDTO.setPublicAccess(false);
                    return applicationService.changeViewAccessForSingleBranchByBranchedApplicationId(
                            application1.getId(), applicationAccessDTO);
                })
                .cache();

        Mono<PageDTO> pageMono = privateAppMono.flatMap(app -> {
            String pageId = app.getPages().get(0).getId();
            return newPageService.findPageById(pageId, READ_PAGES, false);
        });

        StepVerifier.create(Mono.zip(privateAppMono, pageMono))
                .assertNext(tuple -> {
                    Application app = tuple.getT1();
                    PageDTO page = tuple.getT2();

                    Policy manageAppPolicy = Policy.builder()
                            .permission(MANAGE_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy readAppPolicy = Policy.builder()
                            .permission(READ_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId()))
                            .build();

                    Policy managePagePolicy = Policy.builder()
                            .permission(MANAGE_PAGES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy readPagePolicy = Policy.builder()
                            .permission(READ_PAGES.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId()))
                            .build();

                    assertThat(app.getIsPublic()).isFalse();

                    assertThat(app.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));

                    // Check the child page's policies
                    assertThat(page.getPolicies()).containsAll(Set.of(managePagePolicy, readPagePolicy));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void makeApplicationPublic_applicationWithGitMetadata_success() {

        Mono<Workspace> workspaceResponse = workspaceService.findById(workspaceId, READ_WORKSPACES);

        List<PermissionGroup> permissionGroups = workspaceResponse
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList()
                .block();

        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();

        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                .findFirst()
                .get();

        PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                .findFirst()
                .get();

        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);

        // Create a branch
        Application testApplication = new Application();
        testApplication.setName("branch1");
        testApplication.setWorkspaceId(workspaceId);
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        gitArtifactMetadata.setDefaultApplicationId(gitConnectedApp.getId());
        gitArtifactMetadata.setBranchName("test");
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        Application application =
                applicationPageService.createApplication(testApplication).block();

        Mono<Application> publicAppMono = applicationService
                .changeViewAccessForAllBranchesByBranchedApplicationId(gitConnectedApp.getId(), applicationAccessDTO)
                .cache();

        Mono<PageDTO> pageMono = publicAppMono.flatMap(app -> {
            String pageId = app.getPages().get(0).getId();
            return newPageService.findPageById(pageId, READ_PAGES, false);
        });

        Mono<PermissionGroup> publicPermissionGroupMono =
                permissionGroupService.getPublicPermissionGroup().cache();

        User anonymousUser = userRepository.findByEmail(ANONYMOUS_USER).block();

        StepVerifier.create(Mono.zip(publicAppMono, pageMono, publicPermissionGroupMono))
                .assertNext(tuple -> {
                    Application publicApp = tuple.getT1();
                    PageDTO page = tuple.getT2();
                    PermissionGroup permissionGroup = tuple.getT3();

                    String permissionGroupId = permissionGroup.getId();

                    assertThat(publicApp.getIsPublic()).isTrue();

                    Policy manageAppPolicy = Policy.builder()
                            .permission(MANAGE_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy readAppPolicy = Policy.builder()
                            .permission(READ_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId(),
                                    permissionGroupId))
                            .build();

                    Policy managePagePolicy = Policy.builder()
                            .permission(MANAGE_PAGES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy readPagePolicy = Policy.builder()
                            .permission(READ_PAGES.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId(),
                                    permissionGroupId))
                            .build();

                    assertThat(publicApp.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));

                    // Check the child page's policies
                    assertThat(page.getPolicies()).containsAll(Set.of(managePagePolicy, readPagePolicy));

                    // Finally assert that permission group has been assigned to anonymous user.
                    assertThat(permissionGroup.getAssignedToUserIds()).hasSize(1);
                    assertThat(permissionGroup.getAssignedToUserIds()).containsAll(Set.of(anonymousUser.getId()));
                })
                .verifyComplete();

        // Get branch application
        Mono<Application> branchApplicationMono =
                applicationService.findById(application.getId()).cache();

        StepVerifier.create(Mono.zip(branchApplicationMono, publicPermissionGroupMono))
                .assertNext(tuple -> {
                    Application branchApplication = tuple.getT1();
                    String permissionGroupId = tuple.getT2().getId();
                    Policy manageAppPolicy = Policy.builder()
                            .permission(MANAGE_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy readAppPolicy = Policy.builder()
                            .permission(READ_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId(),
                                    permissionGroupId))
                            .build();

                    assertThat(branchApplication.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void makeApplicationPrivate_applicationWithGitMetadata_success() {

        Mono<Workspace> workspaceResponse = workspaceService.findById(workspaceId, READ_WORKSPACES);

        List<PermissionGroup> permissionGroups = workspaceResponse
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList()
                .block();

        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();

        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                .findFirst()
                .get();

        PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                .findFirst()
                .get();

        Policy manageAppPolicy = Policy.builder()
                .permission(MANAGE_APPLICATIONS.getValue())
                .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                .build();
        Policy readAppPolicy = Policy.builder()
                .permission(READ_APPLICATIONS.getValue())
                .permissionGroups(Set.of(
                        adminPermissionGroup.getId(), developerPermissionGroup.getId(), viewerPermissionGroup.getId()))
                .build();

        Policy managePagePolicy = Policy.builder()
                .permission(MANAGE_PAGES.getValue())
                .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                .build();
        Policy readPagePolicy = Policy.builder()
                .permission(READ_PAGES.getValue())
                .permissionGroups(Set.of(
                        adminPermissionGroup.getId(), developerPermissionGroup.getId(), viewerPermissionGroup.getId()))
                .build();

        // Create a branch
        Application testApplication = new Application();
        testApplication.setName("branch2");
        testApplication.setWorkspaceId(workspaceId);
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        gitArtifactMetadata.setDefaultApplicationId(gitConnectedApp.getId());
        gitArtifactMetadata.setBranchName("test2");
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        Application application =
                applicationPageService.createApplication(testApplication).block();

        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);
        Mono<Tuple2<Application, PageDTO>> privateAppAndPageTupleMono =
                // First make the git connected app public
                applicationService
                        .changeViewAccessForAllBranchesByBranchedApplicationId(
                                gitConnectedApp.getId(), applicationAccessDTO)
                        .flatMap(application1 -> {
                            applicationAccessDTO.setPublicAccess(false);
                            // Then make the test branch private
                            return applicationService.changeViewAccessForAllBranchesByBranchedApplicationId(
                                    application1.getId(), applicationAccessDTO);
                        })
                        .flatMap(app -> {
                            String pageId = app.getPages().get(0).getId();
                            return Mono.zip(Mono.just(app), newPageService.findPageById(pageId, READ_PAGES, false));
                        });

        StepVerifier.create(privateAppAndPageTupleMono)
                .assertNext(tuple -> {
                    Application app = tuple.getT1();
                    PageDTO page = tuple.getT2();

                    assertThat(app.getIsPublic()).isFalse();
                    assertThat(app.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));

                    // Check the child page's policies
                    assertThat(page.getPolicies()).containsAll(Set.of(managePagePolicy, readPagePolicy));
                })
                .verifyComplete();

        // Get branch application
        Mono<Application> branchApplicationMono = applicationService.findById(application.getId());
        StepVerifier.create(branchApplicationMono)
                .assertNext(branchApplication -> {
                    assertThat(branchApplication.getIsPublic()).isFalse();
                    assertThat(branchApplication.getPolicies()).containsAll(Set.of(readAppPolicy, manageAppPolicy));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validMakeApplicationPublicWithActions() {

        Mono<Workspace> workspaceResponse = workspaceService.findById(workspaceId, READ_WORKSPACES);

        List<PermissionGroup> permissionGroups = workspaceResponse
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList()
                .block();

        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();

        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                .findFirst()
                .get();

        PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                .findFirst()
                .get();

        Application application = new Application();
        application.setName("validMakeApplicationPublic-ExplicitDatasource-Test");

        Application createdApplication = applicationPageService
                .createApplication(application, workspaceId)
                .block();

        String pageId = createdApplication.getPages().get(0).getId();

        Plugin plugin = pluginService.findByPackageName("restapi-plugin").block();
        Datasource datasource = new Datasource();
        datasource.setName("Public App Test");
        datasource.setPluginId(plugin.getId());
        datasource.setWorkspaceId(workspaceId);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Datasource savedDatasource = datasourceService.create(datasource).block();

        ActionDTO action = new ActionDTO();
        action.setName("Public App Test action");
        action.setPageId(pageId);
        action.setDatasource(savedDatasource);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);

        ActionDTO savedAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);

        Plugin installedJsPlugin =
                pluginRepository.findByPackageName("installed-js-plugin").block();
        assert installedJsPlugin != null;

        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("testActionCollection");
        actionCollectionDTO.setApplicationId(createdApplication.getId());
        actionCollectionDTO.setWorkspaceId(workspaceId);
        actionCollectionDTO.setPageId(pageId);
        actionCollectionDTO.setPluginId(installedJsPlugin.getId());
        actionCollectionDTO.setPluginType(PluginType.JS);

        ActionCollectionDTO savedActionCollection =
                layoutCollectionService.createCollection(actionCollectionDTO).block();

        Mono<Application> publicAppMono = applicationService
                .changeViewAccessForSingleBranchByBranchedApplicationId(
                        createdApplication.getId(), applicationAccessDTO)
                .cache();

        Mono<PermissionGroup> publicPermissionGroupMono = permissionGroupService.getPublicPermissionGroup();

        User anonymousUser = userRepository.findByEmail(ANONYMOUS_USER).block();

        Mono<Datasource> datasourceMono = publicAppMono.then(datasourceService.findById(savedDatasource.getId()));

        Mono<NewAction> actionMono = publicAppMono.then(newActionService.findById(savedAction.getId()));

        final Mono<ActionCollection> actionCollectionMono =
                publicAppMono.then(actionCollectionService.findById(savedActionCollection.getId(), READ_ACTIONS));

        StepVerifier.create(Mono.zip(datasourceMono, actionMono, actionCollectionMono, publicPermissionGroupMono))
                .assertNext(tuple -> {
                    Datasource datasource1 = tuple.getT1();
                    NewAction action1 = tuple.getT2();
                    PermissionGroup publicPermissionGroup = tuple.getT4();
                    final ActionCollection actionCollection1 = tuple.getT3();

                    Policy manageDatasourcePolicy = Policy.builder()
                            .permission(MANAGE_DATASOURCES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy readDatasourcePolicy = Policy.builder()
                            .permission(READ_DATASOURCES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy executeDatasourcePolicy = Policy.builder()
                            .permission(EXECUTE_DATASOURCES.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId(),
                                    publicPermissionGroup.getId()))
                            .build();

                    Policy manageActionPolicy = Policy.builder()
                            .permission(MANAGE_ACTIONS.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy readActionPolicy = Policy.builder()
                            .permission(READ_ACTIONS.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy executeActionPolicy = Policy.builder()
                            .permission(EXECUTE_ACTIONS.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId(),
                                    publicPermissionGroup.getId()))
                            .build();

                    // Check that the datasource used in the app contains public execute permission
                    assertThat(datasource1.getPolicies())
                            .containsAll(Set.of(manageDatasourcePolicy, readDatasourcePolicy, executeDatasourcePolicy));

                    // Check that the action used in the app contains public execute permission
                    assertThat(action1.getPolicies())
                            .containsAll(Set.of(manageActionPolicy, readActionPolicy, executeActionPolicy));

                    // Check that the action collection used in the app contains public execute permission
                    assertThat(actionCollection1.getPolicies())
                            .containsAll(Set.of(manageActionPolicy, readActionPolicy, executeActionPolicy));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void
            testPublicApp_whenMultiplePublicAppsInWorkspaceAndOneAccessRevoked_otherPublicAppRetainsAccessToWorkspaceLevelResources() {
        Workspace toCreate = new Workspace();
        toCreate.setName("Multiple Public Apps Test");
        Workspace workspace = workspaceService.create(toCreate).block();
        String workspaceId = workspace.getId();

        String defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                .block();

        // Create common datasource
        Plugin plugin = pluginService.findByPackageName("restapi-plugin").block();
        Datasource datasource = new Datasource();
        datasource.setName("Public App Test");
        datasource.setPluginId(plugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        datasource.setWorkspaceId(workspaceId);
        datasource.setDatasourceConfiguration(datasourceConfiguration);

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Datasource savedDatasource = datasourceService.create(datasource).block();

        // Create first app to make public
        Application application = new Application();
        application.setName("firstAppToMakePublic");

        Application createdApplication = applicationPageService
                .createApplication(application, workspaceId)
                .block();

        String pageId = createdApplication.getPages().get(0).getId();

        ActionDTO action = new ActionDTO();
        action.setName("Public App Test action");
        action.setPageId(pageId);
        action.setDatasource(savedDatasource);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        // Check datasource before making app public
        PermissionGroup publicPermissionGroup =
                permissionGroupService.getPublicPermissionGroup().block();

        Datasource datasourceBeforePublicShare =
                datasourceService.findById(savedDatasource.getId()).block();

        Optional<Policy> policyBeforeOptional = datasourceBeforePublicShare.getPolicies().stream()
                .filter(policy -> EXECUTE_DATASOURCES.getValue().equals(policy.getPermission()))
                .findFirst();

        Assertions.assertThat(policyBeforeOptional.isPresent()).isTrue();
        Assertions.assertThat(policyBeforeOptional.get().getPermissionGroups())
                .doesNotContain(publicPermissionGroup.getId());

        // Make first application public
        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);
        applicationService
                .changeViewAccessForSingleBranchByBranchedApplicationId(
                        createdApplication.getId(), applicationAccessDTO)
                .block();

        Datasource datasourceAfterPublicShare =
                datasourceService.findById(savedDatasource.getId()).block();

        Optional<Policy> policyAfterOptional = datasourceAfterPublicShare.getPolicies().stream()
                .filter(policy -> EXECUTE_DATASOURCES.getValue().equals(policy.getPermission()))
                .findFirst();

        Assertions.assertThat(policyAfterOptional.isPresent()).isTrue();
        Assertions.assertThat(policyAfterOptional.get().getPermissionGroups()).contains(publicPermissionGroup.getId());

        // Create a second app
        Application application2 = new Application();
        application2.setName("secondAppToMakePublic");

        Application createdApplication2 = applicationPageService
                .createApplication(application2, workspaceId)
                .block();

        String pageId2 = createdApplication2.getPages().get(0).getId();

        ActionDTO action2 = new ActionDTO();
        action2.setName("Public App Test action");
        action2.setPageId(pageId2);
        action2.setDatasource(savedDatasource);
        ActionConfiguration actionConfiguration2 = new ActionConfiguration();
        actionConfiguration2.setHttpMethod(HttpMethod.GET);
        action2.setActionConfiguration(actionConfiguration2);
        layoutActionService.createSingleAction(action2, Boolean.FALSE).block();

        // Make second application public
        ApplicationAccessDTO applicationAccessDTO2 = new ApplicationAccessDTO();
        applicationAccessDTO2.setPublicAccess(true);
        applicationService
                .changeViewAccessForSingleBranchByBranchedApplicationId(
                        createdApplication2.getId(), applicationAccessDTO2)
                .block();

        // Now revoke public access from first app
        applicationAccessDTO.setPublicAccess(false);
        applicationService
                .changeViewAccessForSingleBranchByBranchedApplicationId(
                        createdApplication.getId(), applicationAccessDTO)
                .block();

        // Check that datasource still has execute access
        Datasource datasourceAfterRevokeOnePublicShare =
                datasourceService.findById(savedDatasource.getId()).block();

        Optional<Policy> policyAfterRevokeOneOptional = datasourceAfterRevokeOnePublicShare.getPolicies().stream()
                .filter(policy -> EXECUTE_DATASOURCES.getValue().equals(policy.getPermission()))
                .findFirst();

        Assertions.assertThat(policyAfterRevokeOneOptional.isPresent()).isTrue();
        Assertions.assertThat(policyAfterRevokeOneOptional.get().getPermissionGroups())
                .contains(publicPermissionGroup.getId());

        // Now revoke public access from second app
        applicationAccessDTO2.setPublicAccess(false);
        applicationService
                .changeViewAccessForSingleBranchByBranchedApplicationId(
                        createdApplication2.getId(), applicationAccessDTO2)
                .block();

        // Check that datasource now does NOT have execute access
        Datasource datasourceAfterRevokeAllPublicShare =
                datasourceService.findById(savedDatasource.getId()).block();

        Optional<Policy> policyAfterRevokeAllOptional = datasourceAfterRevokeAllPublicShare.getPolicies().stream()
                .filter(policy -> EXECUTE_DATASOURCES.getValue().equals(policy.getPermission()))
                .findFirst();

        Assertions.assertThat(policyAfterRevokeAllOptional.isPresent()).isTrue();
        Assertions.assertThat(policyAfterRevokeAllOptional.get().getPermissionGroups())
                .doesNotContain(publicPermissionGroup.getId());
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneApplication_applicationWithGitMetadata_success() {

        final String branchName = gitConnectedApp.getGitApplicationMetadata().getBranchName();
        Mono<Application> clonedApplicationMono =
                applicationPageService.cloneApplication(gitConnectedApp.getId()).cache();

        Mono<Workspace> workspaceResponse = workspaceService.findById(workspaceId, READ_WORKSPACES);

        Mono<List<PermissionGroup>> defaultPermissionGroupsMono = workspaceResponse
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList();

        Mono<List<PageDTO>> clonedPageListMono = clonedApplicationMono
                .flatMapMany(application -> Flux.fromIterable(application.getPages()))
                .flatMap(applicationPage -> newPageService.findPageById(applicationPage.getId(), READ_PAGES, false))
                .collectList();

        Mono<List<PageDTO>> srcPageListMono = Flux.fromIterable(gitConnectedApp.getPages())
                .flatMap(applicationPage -> newPageService.findPageById(applicationPage.getId(), READ_PAGES, false))
                .collectList();

        StepVerifier.create(Mono.zip(
                        clonedApplicationMono, clonedPageListMono, srcPageListMono, defaultPermissionGroupsMono))
                .assertNext(tuple -> {
                    Application clonedApplication = tuple.getT1(); // cloned application
                    List<PageDTO> clonedPageList = tuple.getT2();
                    List<PageDTO> srcPageList = tuple.getT3();

                    List<PermissionGroup> permissionGroups = tuple.getT4();
                    PermissionGroup adminPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                            .findFirst()
                            .get();

                    PermissionGroup developerPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                            .findFirst()
                            .get();

                    PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                            .findFirst()
                            .get();

                    Policy manageAppPolicy = Policy.builder()
                            .permission(MANAGE_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();

                    Policy readAppPolicy = Policy.builder()
                            .permission(READ_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId()))
                            .build();

                    Policy managePagePolicy = Policy.builder()
                            .permission(MANAGE_PAGES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy readPagePolicy = Policy.builder()
                            .permission(READ_PAGES.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId()))
                            .build();

                    assertThat(clonedApplication).isNotNull();
                    assertThat(clonedApplication.isAppIsExample()).isFalse();
                    assertThat(clonedApplication.getId()).isNotNull();
                    assertThat(clonedApplication.getName()).isEqualTo("gitConnectedApp Copy");
                    assertThat(clonedApplication.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));
                    assertThat(clonedApplication.getWorkspaceId()).isEqualTo(workspaceId);
                    assertThat(clonedApplication.getModifiedBy()).isEqualTo("api_user");
                    assertThat(clonedApplication.getUpdatedAt()).isNotNull();
                    assertThat(clonedApplication.getEvaluationVersion()).isNotNull();
                    assertThat(clonedApplication.getEvaluationVersion())
                            .isEqualTo(gitConnectedApp.getEvaluationVersion());
                    assertThat(clonedApplication.getApplicationVersion()).isNotNull();
                    assertThat(clonedApplication.getApplicationVersion())
                            .isEqualTo(gitConnectedApp.getApplicationVersion());

                    List<ApplicationPage> pages = clonedApplication.getPages();
                    Set<String> clonedPageIdsFromApplication =
                            pages.stream().map(page -> page.getId()).collect(Collectors.toSet());
                    Set<String> clonedPageIdsFromDb =
                            clonedPageList.stream().map(page -> page.getId()).collect(Collectors.toSet());

                    assertThat(clonedPageIdsFromApplication).containsAll(clonedPageIdsFromDb);

                    Set<String> srcPageIdsFromDb =
                            srcPageList.stream().map(page -> page.getId()).collect(Collectors.toSet());
                    assertThat(Collections.disjoint(srcPageIdsFromDb, clonedPageIdsFromDb))
                            .isTrue();

                    assertThat(clonedPageList).isNotEmpty();
                    for (PageDTO page : clonedPageList) {
                        assertThat(page.getPolicies()).containsAll(Set.of(readPagePolicy, managePagePolicy));
                        assertThat(page.getApplicationId()).isEqualTo(clonedApplication.getId());
                    }
                })
                .verifyComplete();

        // verify that Pages are cloned

        Mono<List<NewPage>> clonedNewPageListMono = clonedApplicationMono
                .flatMapMany(application -> Flux.fromIterable(application.getPages()))
                .flatMap(applicationPage -> newPageRepository.findById(applicationPage.getId()))
                .collectList();

        Mono<List<NewPage>> srcNewPageListMono = Flux.fromIterable(gitConnectedApp.getPages())
                .flatMap(applicationPage -> newPageService.findByRefTypeAndRefNameAndBasePageId(
                        RefType.branch, branchName, applicationPage.getDefaultPageId(), READ_PAGES, null))
                .collectList();

        StepVerifier.create(Mono.zip(clonedNewPageListMono, srcNewPageListMono))
                .assertNext(tuple -> {
                    List<NewPage> clonedNewPageList = tuple.getT1();
                    List<NewPage> srcNewPageList = tuple.getT2();

                    List<String> clonedPageIdList = new ArrayList<>();
                    List<String> clonedDefaultPageIdList = new ArrayList<>();
                    clonedNewPageList.forEach(newPage -> {
                        clonedPageIdList.add(newPage.getId());
                        clonedDefaultPageIdList.add(newPage.getBaseId());
                        assertThat(newPage.getBaseId()).isEqualTo(newPage.getId());
                    });

                    List<String> srcPageIdList = new ArrayList<>();
                    List<String> srcDefaultPageIdList = new ArrayList<>();
                    srcNewPageList.forEach(newPage -> {
                        srcPageIdList.add(newPage.getId());
                        srcDefaultPageIdList.add(newPage.getBaseId());
                        assertThat(newPage.getBaseId()).isEqualTo(newPage.getId());
                    });

                    assertThat(clonedPageIdList).doesNotContainAnyElementsOf(srcPageIdList);
                    assertThat(clonedDefaultPageIdList).doesNotContainAnyElementsOf(srcDefaultPageIdList);
                })
                .verifyComplete();

        // verify that cloned Pages are not renamed

        Mono<List<String>> pageNameListMono = clonedPageListMono
                .flatMapMany(Flux::fromIterable)
                .map(PageDTO::getName)
                .collectList();

        Mono<List<String>> testPageNameListMono = clonedNewPageListMono
                .flatMapMany(Flux::fromIterable)
                .map(newPage -> newPage.getUnpublishedPage().getName())
                .collectList();

        StepVerifier.create(Mono.zip(pageNameListMono, testPageNameListMono))
                .assertNext(tuple -> {
                    List<String> pageNameList = tuple.getT1();
                    List<String> testPageNameList = tuple.getT2();

                    assertThat(pageNameList).containsExactlyInAnyOrderElementsOf(testPageNameList);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneApplication_applicationWithGitMetadataAndActions_success() {

        final String branchName = gitConnectedApp.getGitApplicationMetadata().getBranchName();

        Mono<Workspace> workspaceResponse = workspaceService.findById(workspaceId, READ_WORKSPACES);

        Mono<List<PermissionGroup>> defaultPermissionGroupsMono = workspaceResponse
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList();

        String pageId = gitConnectedApp.getPages().get(0).getId();

        ActionDTO action = new ActionDTO();
        action.setName("Clone App Test action");
        action.setPageId(pageId);
        action.setDatasource(testDatasource);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);

        ActionDTO savedAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        Mono<Application> clonedApplicationMono =
                applicationPageService.cloneApplication(gitConnectedApp.getId()).cache();

        Mono<List<NewAction>> clonedActionListMono = clonedApplicationMono
                .flatMapMany(application -> newActionService.findAllByApplicationIdAndViewMode(
                        application.getId(), false, READ_ACTIONS, null))
                .collectList();

        Mono<List<NewAction>> srcActionListMono = newActionService
                .findAllByApplicationIdAndViewMode(gitConnectedApp.getId(), false, READ_ACTIONS, null)
                .collectList();

        StepVerifier.create(Mono.zip(
                        clonedApplicationMono, clonedActionListMono, srcActionListMono, defaultPermissionGroupsMono))
                .assertNext(tuple -> {
                    Application clonedApplication = tuple.getT1(); // cloned application
                    List<NewAction> clonedActionList = tuple.getT2();
                    List<NewAction> srcActionList = tuple.getT3();
                    List<PermissionGroup> permissionGroups = tuple.getT4();

                    PermissionGroup adminPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                            .findFirst()
                            .get();

                    PermissionGroup developerPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                            .findFirst()
                            .get();

                    PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                            .findFirst()
                            .get();

                    Policy manageActionPolicy = Policy.builder()
                            .permission(MANAGE_ACTIONS.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy readActionPolicy = Policy.builder()
                            .permission(READ_ACTIONS.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy executeActionPolicy = Policy.builder()
                            .permission(EXECUTE_ACTIONS.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId()))
                            .build();

                    Policy manageAppPolicy = Policy.builder()
                            .permission(MANAGE_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();

                    Policy readAppPolicy = Policy.builder()
                            .permission(READ_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId()))
                            .build();

                    assertThat(clonedApplication.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));
                    assertThat(clonedApplication.getWorkspaceId()).isEqualTo(workspaceId);
                    assertThat(clonedApplication.getModifiedBy()).isEqualTo("api_user");
                    assertThat(clonedApplication.getUpdatedAt()).isNotNull();

                    Set<String> clonedPageId = clonedApplication.getPages().stream()
                            .map(page -> page.getId())
                            .collect(Collectors.toSet());
                    Set<String> clonedActionIdsFromDb = clonedActionList.stream()
                            .map(action1 -> action1.getId())
                            .collect(Collectors.toSet());
                    Set<String> clonedPageIdsInActionFromDb = clonedActionList.stream()
                            .map(action1 -> action1.getUnpublishedAction().getPageId())
                            .collect(Collectors.toSet());
                    Set<String> defaultClonedActionIdsFromDb = clonedActionList.stream()
                            .map(newAction -> newAction.getBaseId())
                            .collect(Collectors.toSet());

                    Set<String> srcActionIdsFromDb = srcActionList.stream()
                            .map(action1 -> action1.getId())
                            .collect(Collectors.toSet());
                    Set<String> srcPageIdsInActionFromDb = srcActionList.stream()
                            .map(action1 -> action1.getUnpublishedAction().getPageId())
                            .collect(Collectors.toSet());
                    Set<String> defaultSrcActionIdsFromDb = srcActionList.stream()
                            .map(newAction -> newAction.getBaseId())
                            .collect(Collectors.toSet());

                    assertThat(Collections.disjoint(clonedActionIdsFromDb, srcActionIdsFromDb))
                            .isTrue();
                    assertThat(clonedPageId).containsAll(clonedPageIdsInActionFromDb);
                    assertThat(Collections.disjoint(defaultClonedActionIdsFromDb, defaultSrcActionIdsFromDb))
                            .isTrue();
                    assertThat(Collections.disjoint(clonedPageIdsInActionFromDb, srcPageIdsInActionFromDb))
                            .isTrue();

                    assertThat(clonedActionList).isNotEmpty();
                    assertThat(defaultClonedActionIdsFromDb).isNotEmpty();
                    for (NewAction newAction : clonedActionList) {
                        assertThat(newAction.getPolicies())
                                .containsAll(Set.of(readActionPolicy, executeActionPolicy, manageActionPolicy));
                        assertThat(newAction.getApplicationId()).isEqualTo(clonedApplication.getId());
                    }
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneApplication_withActionAndActionCollection_success() {
        Application testApplication = new Application();
        testApplication.setName("ApplicationServiceTest Clone Source TestApp");

        Mono<Application> originalApplicationMono = applicationPageService
                .createApplication(testApplication, workspaceId)
                .cache();

        Mono<Workspace> workspaceResponse = workspaceService.findById(workspaceId, READ_WORKSPACES);

        Mono<List<PermissionGroup>> defaultPermissionGroupsMono = workspaceResponse
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList();

        Map<String, List<String>> originalResourceIds = new HashMap<>();
        Mono<Application> resultMono = originalApplicationMono
                .zipWhen(application -> newPageService.findPageById(
                        application.getPages().get(0).getId(), READ_PAGES, false))
                .flatMap(tuple -> {
                    Application application = tuple.getT1();
                    PageDTO testPage = tuple.getT2();

                    ActionDTO action = new ActionDTO();
                    action.setName("cloneActionTest");
                    action.setPageId(application.getPages().get(0).getId());
                    action.setExecuteOnLoad(true);
                    ActionConfiguration actionConfiguration = new ActionConfiguration();
                    actionConfiguration.setHttpMethod(HttpMethod.GET);
                    action.setActionConfiguration(actionConfiguration);
                    action.setDatasource(testDatasource);

                    ObjectMapper objectMapper = new ObjectMapper();
                    JSONObject parentDsl = null;
                    try {
                        parentDsl = new JSONObject(objectMapper.readValue(
                                DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {}));
                    } catch (JsonProcessingException e) {
                        log.debug("Error while creating JSONObj from defaultPageLayout: ", e);
                    }

                    ArrayList children = (ArrayList) parentDsl.get("children");
                    JSONObject testWidget = new JSONObject();
                    testWidget.put("widgetName", "firstWidget");
                    JSONArray temp = new JSONArray();
                    temp.add(new JSONObject(Map.of("key", "testField")));
                    testWidget.put("dynamicBindingPathList", temp);
                    testWidget.put("testField", "{{ cloneActionTest.data }}");
                    children.add(testWidget);

                    JSONObject secondWidget = new JSONObject();
                    secondWidget.put("widgetName", "secondWidget");
                    temp = new JSONArray();
                    temp.add(new JSONObject(Map.of("key", "testField1")));
                    secondWidget.put("dynamicBindingPathList", temp);
                    secondWidget.put("testField1", "{{ testCollection1.getData.data }}");
                    children.add(secondWidget);

                    Layout layout = testPage.getLayouts().get(0);
                    layout.setDsl(parentDsl);

                    // Save actionCollection
                    ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
                    actionCollectionDTO.setName("testCollection1");
                    actionCollectionDTO.setPageId(application.getPages().get(0).getId());
                    actionCollectionDTO.setApplicationId(application.getId());
                    actionCollectionDTO.setWorkspaceId(application.getWorkspaceId());
                    actionCollectionDTO.setPluginId(testPlugin.getId());
                    actionCollectionDTO.setVariables(List.of(new JSValue("test", "String", "test", true)));
                    actionCollectionDTO.setBody("export default {\n" + "\tgetData: async () => {\n"
                            + "\t\tconst data = await cloneActionTest.run();\n"
                            + "\t\treturn data;\n"
                            + "\t}\n"
                            + "\tanotherMethod: async () => {\n"
                            + "\t\tconst data = await cloneActionTest.run();\n"
                            + "\t\treturn data;\n"
                            + "\t}\n"
                            + "}");
                    ActionDTO action1 = new ActionDTO();
                    action1.setName("getData");
                    action1.setActionConfiguration(new ActionConfiguration());
                    action1.getActionConfiguration()
                            .setBody("async () => {\n" + "\t\tconst data = await cloneActionTest.run();\n"
                                    + "\t\treturn data;\n"
                                    + "\t}");

                    ActionDTO action2 = new ActionDTO();
                    action2.setName("anotherMethod");
                    action2.setActionConfiguration(new ActionConfiguration());
                    action2.getActionConfiguration()
                            .setBody("async () => {\n" + "\t\tconst data = await cloneActionTest.run();\n"
                                    + "\t\treturn data;\n"
                                    + "\t}");
                    actionCollectionDTO.setActions(List.of(action1, action2));
                    actionCollectionDTO.setPluginType(PluginType.JS);

                    return Mono.zip(
                            layoutCollectionService.createCollection(actionCollectionDTO),
                            layoutActionService.createSingleAction(action, Boolean.FALSE),
                            updateLayoutService.updateLayout(
                                    testPage.getId(), testPage.getApplicationId(), layout.getId(), layout),
                            Mono.just(application));
                })
                .flatMap(tuple -> {
                    List<String> pageIds = new ArrayList<>(), collectionIds = new ArrayList<>();
                    collectionIds.add(tuple.getT1().getId());
                    tuple.getT4().getPages().forEach(page -> pageIds.add(page.getId()));

                    originalResourceIds.put("pageIds", pageIds);
                    originalResourceIds.put("collectionIds", collectionIds);
                    return newActionService
                            .findAllByApplicationIdAndViewMode(tuple.getT4().getId(), false, READ_ACTIONS, null)
                            .collectList()
                            .flatMap(actionList -> {
                                List<String> actionIds = actionList.stream()
                                        .map(BaseDomain::getId)
                                        .collect(Collectors.toList());
                                originalResourceIds.put("actionIds", actionIds);
                                return applicationPageService.cloneApplication(
                                        tuple.getT4().getId());
                            });
                })
                .cache();

        StepVerifier.create(resultMono.zipWhen(application -> Mono.zip(
                        newActionService
                                .findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null)
                                .collectList(),
                        actionCollectionService
                                .findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null)
                                .collectList(),
                        newPageService
                                .findNewPagesByApplicationId(application.getId(), READ_PAGES)
                                .collectList(),
                        defaultPermissionGroupsMono)))
                .assertNext(tuple -> {
                    Application application = tuple.getT1(); // cloned application
                    List<NewAction> actionList = tuple.getT2().getT1();
                    List<ActionCollection> actionCollectionList = tuple.getT2().getT2();
                    List<NewPage> pageList = tuple.getT2().getT3();
                    List<PermissionGroup> permissionGroups = tuple.getT2().getT4();

                    PermissionGroup adminPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                            .findFirst()
                            .get();

                    PermissionGroup developerPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                            .findFirst()
                            .get();

                    PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                            .findFirst()
                            .get();

                    Policy manageAppPolicy = Policy.builder()
                            .permission(MANAGE_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();

                    Policy readAppPolicy = Policy.builder()
                            .permission(READ_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId()))
                            .build();

                    Policy managePagePolicy = Policy.builder()
                            .permission(MANAGE_PAGES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy readPagePolicy = Policy.builder()
                            .permission(READ_PAGES.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId()))
                            .build();

                    assertThat(application).isNotNull();
                    assertThat(application.isAppIsExample()).isFalse();
                    assertThat(application.getId()).isNotNull();
                    assertThat(application.getName()).isEqualTo("ApplicationServiceTest Clone Source TestApp Copy");
                    assertThat(application.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));
                    assertThat(application.getWorkspaceId()).isEqualTo(workspaceId);
                    assertThat(application.getModifiedBy()).isEqualTo("api_user");
                    assertThat(application.getUpdatedAt()).isNotNull();
                    List<ApplicationPage> pages = application.getPages();
                    Set<String> pageIdsFromApplication =
                            pages.stream().map(page -> page.getId()).collect(Collectors.toSet());
                    Set<String> pageIdsFromDb =
                            pageList.stream().map(page -> page.getId()).collect(Collectors.toSet());

                    assertThat(pageIdsFromApplication).containsAll(pageIdsFromDb);

                    assertThat(pageList).isNotEmpty();
                    for (NewPage page : pageList) {
                        assertThat(page.getPolicies()).containsAll(Set.of(managePagePolicy, readPagePolicy));
                        assertThat(page.getApplicationId()).isEqualTo(application.getId());
                    }

                    assertThat(pageList).isNotEmpty();
                    pageList.forEach(newPage -> {
                        assertThat(newPage.getBaseId()).isEqualTo(newPage.getId());
                    });

                    assertThat(actionList).hasSize(3);
                    actionList.forEach(newAction -> {
                        assertThat(newAction.getBaseId()).isEqualTo(newAction.getId());
                    });

                    assertThat(actionCollectionList).hasSize(1);
                    actionCollectionList.forEach(actionCollection -> {
                        assertThat(actionCollection.getBaseId()).isEqualTo(actionCollection.getId());
                    });
                })
                .verifyComplete();

        // Check if the resources from original application are intact
        StepVerifier.create(originalApplicationMono.zipWhen(application -> Mono.zip(
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
                    List<NewAction> actionList = tuple.getT2().getT1();
                    List<ActionCollection> actionCollectionList = tuple.getT2().getT2();
                    List<NewPage> pageList = tuple.getT2().getT3();

                    List<String> pageIds =
                            pageList.stream().map(BaseDomain::getId).collect(Collectors.toList());
                    List<String> actionIds =
                            actionList.stream().map(BaseDomain::getId).collect(Collectors.toList());
                    List<String> collectionIds =
                            actionCollectionList.stream().map(BaseDomain::getId).collect(Collectors.toList());

                    assertThat(originalResourceIds.get("pageIds")).containsAll(pageIds);
                    assertThat(originalResourceIds.get("actionIds")).containsAll(actionIds);
                    assertThat(originalResourceIds.get("collectionIds")).containsAll(collectionIds);
                })
                .verifyComplete();

        Mono<List<PageDTO>> pageListMono = resultMono
                .flatMapMany(application -> Flux.fromIterable(application.getPages()))
                .flatMap(applicationPage -> newPageService.findPageById(applicationPage.getId(), READ_PAGES, false))
                .collectList();

        // verify that Pages are cloned
        Mono<List<NewPage>> testPageListMono = originalApplicationMono
                .flatMapMany(application -> Flux.fromIterable(application.getPages()))
                .flatMap(applicationPage -> newPageRepository.findById(applicationPage.getId()))
                .collectList();

        Mono<List<String>> pageIdListMono =
                pageListMono.flatMapMany(Flux::fromIterable).map(PageDTO::getId).collectList();

        Mono<List<String>> testPageIdListMono = testPageListMono
                .flatMapMany(Flux::fromIterable)
                .map(NewPage::getId)
                .collectList();

        StepVerifier.create(Mono.zip(pageIdListMono, testPageIdListMono))
                .assertNext(tuple -> {
                    List<String> pageIdList = tuple.getT1();
                    List<String> testPageIdList = tuple.getT2();

                    assertThat(pageIdList).doesNotContainAnyElementsOf(testPageIdList);
                })
                .verifyComplete();

        // verify that cloned Pages are not renamed

        Mono<List<String>> pageNameListMono = pageListMono
                .flatMapMany(Flux::fromIterable)
                .map(PageDTO::getName)
                .collectList();

        Mono<List<String>> testPageNameListMono = testPageListMono
                .flatMapMany(Flux::fromIterable)
                .map(newPage -> newPage.getUnpublishedPage().getName())
                .collectList();

        StepVerifier.create(Mono.zip(pageNameListMono, testPageNameListMono))
                .assertNext(tuple -> {
                    List<String> pageNameList = tuple.getT1();
                    List<String> testPageNameList = tuple.getT2();

                    assertThat(pageNameList).containsExactlyInAnyOrderElementsOf(testPageNameList);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneApplication_withDeletedActionInActionCollection_deletedActionIsNotCloned() {
        Application testApplication = new Application();
        testApplication.setName("ApplicationServiceTest-clone-application-deleted-action-within-collection");

        Mono<Application> originalApplicationMono = applicationPageService
                .createApplication(testApplication, workspaceId)
                .cache();

        Mono<Workspace> workspaceResponse = workspaceService.findById(workspaceId, READ_WORKSPACES);

        Mono<List<PermissionGroup>> defaultPermissionGroupsMono = workspaceResponse
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList();

        Map<String, List<String>> originalResourceIds = new HashMap<>();
        Tuple4<ActionCollectionDTO, ActionDTO, LayoutDTO, Application> tuple4 = originalApplicationMono
                .zipWhen(application -> newPageService.findPageById(
                        application.getPages().get(0).getId(), READ_PAGES, false))
                .flatMap(tuple -> {
                    Application application = tuple.getT1();
                    PageDTO testPage = tuple.getT2();

                    ActionDTO action = new ActionDTO();
                    action.setName("cloneActionTest");
                    action.setPageId(application.getPages().get(0).getId());
                    action.setExecuteOnLoad(true);
                    ActionConfiguration actionConfiguration = new ActionConfiguration();
                    actionConfiguration.setHttpMethod(HttpMethod.GET);
                    action.setActionConfiguration(actionConfiguration);
                    action.setDatasource(testDatasource);

                    // Save actionCollection
                    ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
                    actionCollectionDTO.setName("testCollection1");
                    actionCollectionDTO.setPageId(application.getPages().get(0).getId());
                    actionCollectionDTO.setApplicationId(application.getId());
                    actionCollectionDTO.setWorkspaceId(application.getWorkspaceId());
                    actionCollectionDTO.setPluginId(testPlugin.getId());
                    actionCollectionDTO.setVariables(List.of(new JSValue("test", "String", "test", true)));
                    actionCollectionDTO.setBody("export default {\n" + "\tgetData: async () => {\n"
                            + "\t\tconst data = await cloneActionTest.run();\n"
                            + "\t\treturn data;\n"
                            + "\t},\n"
                            + "\tanotherMethod: async () => {\n"
                            + "\t\tconst data = await cloneActionTest.run();\n"
                            + "\t\treturn data;\n"
                            + "\t}\n"
                            + "}");
                    ActionDTO action1 = new ActionDTO();
                    action1.setName("getData");
                    action1.setActionConfiguration(new ActionConfiguration());
                    action1.getActionConfiguration()
                            .setBody("async () => {\n" + "\t\tconst data = await cloneActionTest.run();\n"
                                    + "\t\treturn data;\n"
                                    + "\t}");
                    ActionDTO action2 = new ActionDTO();
                    action2.setName("anotherMethod");
                    action2.setActionConfiguration(new ActionConfiguration());
                    action2.getActionConfiguration()
                            .setBody("async () => {\n" + "\t\tconst data = await cloneActionTest.run();\n"
                                    + "\t\treturn data;\n"
                                    + "\t}");
                    actionCollectionDTO.setActions(List.of(action1, action2));
                    actionCollectionDTO.setPluginType(PluginType.JS);

                    ObjectMapper objectMapper = new ObjectMapper();
                    JSONObject parentDsl = null;
                    try {
                        parentDsl = new JSONObject(objectMapper.readValue(
                                DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {}));
                    } catch (JsonProcessingException e) {
                        log.debug("Error while creating JSONObj from defaultPageLayout: ", e);
                    }

                    ArrayList children = (ArrayList) parentDsl.get("children");
                    JSONObject firstWidget = new JSONObject();
                    firstWidget.put("widgetName", "firstWidget");
                    JSONArray temp = new JSONArray();
                    temp.add(new JSONObject(Map.of("key", "testField")));
                    firstWidget.put("dynamicBindingPathList", temp);
                    firstWidget.put("testField", "{{ cloneActionTest.data }}");
                    children.add(firstWidget);

                    JSONObject secondWidget = new JSONObject();
                    secondWidget.put("widgetName", "secondWidget");
                    temp = new JSONArray();
                    temp.add(new JSONObject(Map.of("key", "testField1")));
                    secondWidget.put("dynamicBindingPathList", temp);
                    secondWidget.put("testField1", "{{ testCollection1.getData.data }}");
                    children.add(secondWidget);

                    JSONObject thirdWidget = new JSONObject();
                    thirdWidget.put("widgetName", "thirdWidget");
                    temp = new JSONArray();
                    temp.add(new JSONObject(Map.of("key", "testField1")));
                    thirdWidget.put("dynamicBindingPathList", temp);
                    thirdWidget.put("testField1", "{{ testCollection1.anotherMethod.data }}");
                    children.add(thirdWidget);

                    Layout layout = testPage.getLayouts().get(0);
                    layout.setDsl(parentDsl);

                    return Mono.zip(
                            layoutCollectionService.createCollection(actionCollectionDTO),
                            layoutActionService.createSingleAction(action, Boolean.FALSE),
                            Mono.just(application),
                            Mono.just(testPage),
                            Mono.just(layout));
                })
                .flatMap(tuple -> {
                    PageDTO testPage = tuple.getT4();
                    Layout layout = tuple.getT5();
                    return Mono.zip(
                            Mono.just(tuple.getT1()),
                            Mono.just(tuple.getT2()),
                            updateLayoutService.updateLayout(
                                    testPage.getId(), testPage.getApplicationId(), layout.getId(), layout),
                            Mono.just(tuple.getT3()));
                })
                .block();

        List<String> pageIds = new ArrayList<>(), collectionIds = new ArrayList<>();
        ActionCollectionDTO collectionDTO = tuple4.getT1();
        collectionIds.add(collectionDTO.getId());
        tuple4.getT4().getPages().forEach(page -> pageIds.add(page.getId()));

        originalResourceIds.put("pageIds", pageIds);
        originalResourceIds.put("collectionIds", collectionIds);

        String deletedActionIdWithinActionCollection = newActionService
                .findByCollectionIdAndViewMode(collectionDTO.getId(), false, null)
                .blockFirst()
                .getId();

        Application application1 = newActionService
                .deleteUnpublishedAction(deletedActionIdWithinActionCollection)
                .thenMany(newActionService.findAllByApplicationIdAndViewMode(
                        tuple4.getT4().getId(), false, READ_ACTIONS, null))
                .collectList()
                .flatMap(actionList -> {
                    List<String> actionIds =
                            actionList.stream().map(BaseDomain::getId).collect(Collectors.toList());
                    originalResourceIds.put("actionIds", actionIds);
                    return applicationPageService.cloneApplication(
                            tuple4.getT4().getId());
                })
                .block();

        StepVerifier.create(Mono.zip(
                        newActionService
                                .findAllByApplicationIdAndViewMode(application1.getId(), false, READ_ACTIONS, null)
                                .collectList(),
                        actionCollectionService
                                .findAllByApplicationIdAndViewMode(application1.getId(), false, READ_ACTIONS, null)
                                .collectList(),
                        newPageService
                                .findNewPagesByApplicationId(application1.getId(), READ_PAGES)
                                .collectList(),
                        defaultPermissionGroupsMono))
                .assertNext(tuple -> {
                    List<NewAction> actionList = tuple.getT1();
                    List<ActionCollection> actionCollectionList = tuple.getT2();
                    List<NewPage> pageList = tuple.getT3();
                    List<PermissionGroup> permissionGroups = tuple.getT4();

                    PermissionGroup adminPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                            .findFirst()
                            .get();

                    PermissionGroup developerPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                            .findFirst()
                            .get();

                    PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                            .findFirst()
                            .get();

                    Policy manageAppPolicy = Policy.builder()
                            .permission(MANAGE_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();

                    Policy readAppPolicy = Policy.builder()
                            .permission(READ_APPLICATIONS.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId()))
                            .build();

                    Policy managePagePolicy = Policy.builder()
                            .permission(MANAGE_PAGES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy readPagePolicy = Policy.builder()
                            .permission(READ_PAGES.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId()))
                            .build();

                    assertThat(application1).isNotNull();
                    assertThat(application1.isAppIsExample()).isFalse();
                    assertThat(application1.getId()).isNotNull();
                    assertThat(application1.getName())
                            .isEqualTo(
                                    "ApplicationServiceTest-clone-application-deleted-action-within-collection Copy");
                    assertThat(application1.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));
                    assertThat(application1.getWorkspaceId()).isEqualTo(workspaceId);
                    assertThat(application1.getModifiedBy()).isEqualTo("api_user");
                    assertThat(application1.getUpdatedAt()).isNotNull();
                    List<ApplicationPage> pages = application1.getPages();
                    Set<String> pageIdsFromApplication =
                            pages.stream().map(ApplicationPage::getId).collect(Collectors.toSet());
                    Set<String> pageIdsFromDb =
                            pageList.stream().map(BaseDomain::getId).collect(Collectors.toSet());

                    assertThat(pageIdsFromApplication).containsAll(pageIdsFromDb);

                    assertThat(pageList).isNotEmpty();
                    for (NewPage page : pageList) {
                        assertThat(page.getPolicies()).containsAll(Set.of(managePagePolicy, readPagePolicy));
                        assertThat(page.getApplicationId()).isEqualTo(application1.getId());
                    }

                    assertThat(pageList).isNotEmpty();
                    pageList.forEach(newPage -> {
                        assertThat(newPage.getBaseId()).isEqualTo(newPage.getId());
                    });

                    assertThat(actionList).hasSize(2);
                    actionList.forEach(newAction -> {
                        assertThat(newAction.getBaseId()).isEqualTo(newAction.getId());
                    });

                    assertThat(actionCollectionList).hasSize(1);
                    actionCollectionList.forEach(actionCollection -> {
                        assertThat(actionCollection.getBaseId()).isEqualTo(actionCollection.getId());
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneGitConnectedApplication_withUpdatedDefaultBranch_sucess() {
        Application application = new Application();
        application.setName("cloneGitConnectedApplication_withUpdatedDefaultBranch_sucess");
        application.setWorkspaceId(workspaceId);
        Application defaultApp = applicationPageService
                .createApplication(application)
                .flatMap(application1 -> {
                    GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
                    gitArtifactMetadata.setDefaultApplicationId(application1.getId());
                    gitArtifactMetadata.setBranchName("master");
                    gitArtifactMetadata.setDefaultBranchName("feature1");
                    gitArtifactMetadata.setIsRepoPrivate(false);
                    gitArtifactMetadata.setRepoName("testRepo");
                    GitAuth gitAuth = new GitAuth();
                    gitAuth.setPublicKey("testkey");
                    gitAuth.setPrivateKey("privatekey");
                    gitArtifactMetadata.setGitAuth(gitAuth);
                    application1.setGitApplicationMetadata(gitArtifactMetadata);
                    return applicationService.save(application1);
                })
                .block();

        // Add a branch to the git connected app
        application = new Application();
        application.setName("cloneGitConnectedApplication_withUpdatedDefaultBranch_sucess");
        application.setWorkspaceId(workspaceId);
        Mono<Application> forkedApp = applicationPageService
                .createApplication(application)
                .flatMap(application1 -> {
                    GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
                    gitArtifactMetadata.setDefaultApplicationId(application1.getId());
                    gitArtifactMetadata.setBranchName("feature1");
                    gitArtifactMetadata.setDefaultBranchName("feature1");
                    gitArtifactMetadata.setIsRepoPrivate(false);
                    gitArtifactMetadata.setRepoName("testRepo");
                    GitAuth gitAuth = new GitAuth();
                    gitAuth.setPublicKey("testkey");
                    gitAuth.setPrivateKey("privatekey");
                    gitArtifactMetadata.setGitAuth(gitAuth);
                    application1.setGitApplicationMetadata(gitArtifactMetadata);
                    return applicationService.save(application1);
                })
                .flatMap(application1 -> {
                    PageDTO pageDTO = new PageDTO();
                    pageDTO.setName("testDuplicatePage");
                    pageDTO.setApplicationId(application1.getId());
                    return applicationPageService.createPage(pageDTO).then(Mono.just(application1));
                })
                .flatMap(application1 -> applicationPageService.cloneApplication(
                        application1.getGitApplicationMetadata().getDefaultApplicationId()));

        StepVerifier.create(forkedApp)
                .assertNext(application1 -> {
                    assertThat(application1.getPages()).hasSize(2);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void basicPublishApplicationTest() {
        Application testApplication = new Application();
        String appName = "ApplicationServiceTest Publish Application";
        testApplication.setName(appName);
        testApplication.setAppLayout(new Application.AppLayout(Application.AppLayout.Type.DESKTOP));
        testApplication.setUnpublishedApplicationDetail(new ApplicationDetail());
        testApplication
                .getUnpublishedApplicationDetail()
                .setAppPositioning(new Application.AppPositioning(Application.AppPositioning.Type.FIXED));
        Application.NavigationSetting appNavigationSetting = new Application.NavigationSetting();
        appNavigationSetting.setOrientation("top");
        testApplication.getUnpublishedApplicationDetail().setNavigationSetting(appNavigationSetting);
        Application.ThemeSetting themeSettings = new Application.ThemeSetting();
        themeSettings.setAccentColor("dark");
        themeSettings.setBorderRadius("#000000");
        themeSettings.setDensity(1);
        themeSettings.setSizing(1);
        themeSettings.setColorMode(Application.ThemeSetting.Type.LIGHT);
        themeSettings.setIconStyle(Application.ThemeSetting.IconStyle.OUTLINED);
        themeSettings.setAppMaxWidth(Application.ThemeSetting.AppMaxWidth.LARGE);
        testApplication.getUnpublishedApplicationDetail().setThemeSetting(themeSettings);

        Mono<Application> applicationMono = applicationPageService
                .createApplication(testApplication, workspaceId)
                .flatMap(application -> applicationPageService
                        .publish(application.getId(), true)
                        .then(applicationService.findById(application.getId(), MANAGE_APPLICATIONS)))
                .cache();

        Mono<List<NewPage>> applicationPagesMono = applicationMono
                .map(application -> application.getPages())
                .flatMapMany(Flux::fromIterable)
                .flatMap(applicationPage -> newPageService.findById(applicationPage.getId(), READ_PAGES))
                .collectList();

        StepVerifier.create(Mono.zip(applicationMono, applicationPagesMono))
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    List<NewPage> pages = tuple.getT2();

                    assertThat(application).isNotNull();
                    assertThat(application.isAppIsExample()).isFalse();
                    assertThat(application.getId()).isNotNull();
                    assertThat(application.getName()).isEqualTo(appName);
                    assertThat(application.getPages()).hasSize(1);
                    assertThat(application.getPublishedPages()).hasSize(1);

                    assertThat(pages).hasSize(1);
                    NewPage newPage = pages.get(0);
                    assertThat(newPage.getUnpublishedPage().getName())
                            .isEqualTo(newPage.getPublishedPage().getName());
                    assertThat(newPage.getUnpublishedPage().getLayouts().get(0).getId())
                            .isEqualTo(newPage.getPublishedPage()
                                    .getLayouts()
                                    .get(0)
                                    .getId());
                    assertThat(newPage.getUnpublishedPage().getLayouts().get(0).getDsl())
                            .isEqualTo(newPage.getPublishedPage()
                                    .getLayouts()
                                    .get(0)
                                    .getDsl());

                    assertThat(application.getPublishedAppLayout()).isEqualTo(application.getUnpublishedAppLayout());
                    assertThat(application.getPublishedApplicationDetail().getAppPositioning())
                            .isEqualTo(application
                                    .getUnpublishedApplicationDetail()
                                    .getAppPositioning());
                    assertThat(application.getPublishedApplicationDetail().getNavigationSetting())
                            .isEqualTo(application
                                    .getUnpublishedApplicationDetail()
                                    .getNavigationSetting());
                    assertThat(application.getPublishedApplicationDetail().getThemeSetting())
                            .isEqualTo(application
                                    .getUnpublishedApplicationDetail()
                                    .getThemeSetting());
                })
                .verifyComplete();
    }

    /**
     * Method to test if the action, pages and actionCollection are archived after the application is published
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void publishApplication_withArchivedUnpublishedResources_resourcesArchived() {

        /*
        1. Create application
        2. Add action and actionCollection
        3. Publish application
        4. Delete page in edit mode
        5. Publish application
        6. Page, action and actionCollection should be soft deleted
        */
        Application testApplication = new Application();
        String appName = "Publish Application With Archived Page";
        testApplication.setName(appName);
        testApplication.setAppLayout(new Application.AppLayout(Application.AppLayout.Type.DESKTOP));
        testApplication.setUnpublishedApplicationDetail(new ApplicationDetail());
        testApplication
                .getUnpublishedApplicationDetail()
                .setAppPositioning(new Application.AppPositioning(Application.AppPositioning.Type.FIXED));
        Application.NavigationSetting appNavigationSetting = new Application.NavigationSetting();
        appNavigationSetting.setOrientation("top");
        testApplication.getUnpublishedApplicationDetail().setNavigationSetting(appNavigationSetting);
        Mono<Tuple4<NewAction, ActionCollection, NewPage, NewAction>> resultMono = applicationPageService
                .createApplication(testApplication, workspaceId)
                .flatMap(application -> {
                    PageDTO page = new PageDTO();
                    page.setName("New Page");
                    page.setApplicationId(application.getId());
                    Layout defaultLayout = newPageService.createDefaultLayout();
                    List<Layout> layouts = new ArrayList<>();
                    layouts.add(defaultLayout);
                    page.setLayouts(layouts);
                    return Mono.zip(
                            applicationPageService.createPage(page),
                            pluginRepository.findByPackageName("installed-plugin"));
                })
                .flatMap(tuple -> {
                    final PageDTO page = tuple.getT1();
                    final Plugin installedPlugin = tuple.getT2();
                    final Datasource datasource = new Datasource();
                    datasource.setName("Default Database");
                    datasource.setWorkspaceId(workspaceId);
                    datasource.setPluginId(installedPlugin.getId());
                    datasource.setDatasourceConfiguration(new DatasourceConfiguration());

                    ActionDTO action = new ActionDTO();
                    action.setName("publishActionTest");
                    action.setPageId(page.getId());
                    action.setExecuteOnLoad(true);
                    ActionConfiguration actionConfiguration = new ActionConfiguration();
                    actionConfiguration.setHttpMethod(HttpMethod.GET);
                    action.setActionConfiguration(actionConfiguration);
                    action.setDatasource(datasource);

                    // Save actionCollection
                    ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
                    actionCollectionDTO.setName("publishCollectionTest");
                    actionCollectionDTO.setPageId(page.getId());
                    actionCollectionDTO.setPluginId(datasource.getPluginId());
                    actionCollectionDTO.setApplicationId(testApplication.getId());
                    actionCollectionDTO.setWorkspaceId(testApplication.getWorkspaceId());
                    actionCollectionDTO.setVariables(List.of(new JSValue("test", "String", "test", true)));
                    ActionDTO action1 = new ActionDTO();
                    action1.setName("publishApplicationTest");
                    action1.setActionConfiguration(new ActionConfiguration());
                    actionCollectionDTO.setActions(List.of(action1));
                    actionCollectionDTO.setPluginType(PluginType.JS);

                    return layoutActionService
                            .createSingleAction(action, Boolean.FALSE)
                            .zipWith(layoutCollectionService.createCollection(actionCollectionDTO))
                            .flatMap(tuple1 -> {
                                ActionDTO savedAction = tuple1.getT1();
                                ActionCollectionDTO savedActionCollection = tuple1.getT2();
                                String actionId = savedActionCollection
                                        .getActions()
                                        .get(0)
                                        .getId();
                                return applicationPageService
                                        .publish(testApplication.getId(), true)
                                        .then(applicationPageService.deleteUnpublishedPage(page.getId()))
                                        .then(applicationPageService.publish(testApplication.getId(), true))
                                        .then(Mono.zip(
                                                (Mono<NewAction>)
                                                        this.getArchivedResource(savedAction.getId(), NewAction.class),
                                                (Mono<ActionCollection>) this.getArchivedResource(
                                                        savedActionCollection.getId(), ActionCollection.class),
                                                (Mono<NewPage>) this.getArchivedResource(page.getId(), NewPage.class),
                                                (Mono<NewAction>) this.getArchivedResource(actionId, NewAction.class)));
                            });
                })
                .cache();

        StepVerifier.create(resultMono)
                .assertNext(tuple -> {
                    NewAction archivedAction = tuple.getT1();
                    ActionCollection archivedActionCollection = tuple.getT2();
                    NewPage archivedPage = tuple.getT3();
                    NewAction archivedActionFromActionCollection = tuple.getT4();

                    assertThat(archivedAction.getDeletedAt()).isNotNull();

                    assertThat(archivedActionCollection.getDeletedAt()).isNotNull();

                    assertThat(archivedPage.getDeletedAt()).isNotNull();

                    assertThat(archivedActionFromActionCollection.getDeletedAt())
                            .isNotNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void publishApplication_withGitConnectedApp_success() {
        GitArtifactMetadata gitData = gitConnectedApp.getGitApplicationMetadata();
        gitConnectedApp.setAppLayout(new Application.AppLayout(Application.AppLayout.Type.DESKTOP));
        gitConnectedApp.setUnpublishedApplicationDetail(new ApplicationDetail());
        gitConnectedApp
                .getUnpublishedApplicationDetail()
                .setAppPositioning(new Application.AppPositioning(Application.AppPositioning.Type.FIXED));

        Application.NavigationSetting appNavigationSetting = new Application.NavigationSetting();
        appNavigationSetting.setOrientation("top");
        gitConnectedApp.getUnpublishedApplicationDetail().setNavigationSetting(appNavigationSetting);

        Mono<Application> applicationMono = applicationService
                .update(gitConnectedApp.getId(), gitConnectedApp)
                .flatMap(updatedApp -> applicationPageService.publish(updatedApp.getId(), true))
                .flatMap(application -> applicationService.findByBranchNameAndBaseApplicationId(
                        gitData.getBranchName(), gitData.getDefaultApplicationId(), MANAGE_APPLICATIONS))
                .cache();

        Mono<List<NewPage>> applicationPagesMono = applicationMono
                .map(application -> application.getPages())
                .flatMapMany(Flux::fromIterable)
                .flatMap(applicationPage -> newPageService.findById(applicationPage.getId(), READ_PAGES))
                .collectList();

        StepVerifier.create(Mono.zip(applicationMono, applicationPagesMono))
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    List<NewPage> pages = tuple.getT2();

                    assertThat(application).isNotNull();
                    assertThat(application.getPages()).hasSize(1);
                    assertThat(application.getPublishedPages()).hasSize(1);

                    assertThat(pages).hasSize(1);
                    NewPage newPage = pages.get(0);
                    assertThat(newPage.getUnpublishedPage().getName())
                            .isEqualTo(newPage.getPublishedPage().getName());
                    assertThat(newPage.getUnpublishedPage().getLayouts().get(0).getId())
                            .isEqualTo(newPage.getPublishedPage()
                                    .getLayouts()
                                    .get(0)
                                    .getId());
                    assertThat(newPage.getUnpublishedPage().getLayouts().get(0).getDsl())
                            .isEqualTo(newPage.getPublishedPage()
                                    .getLayouts()
                                    .get(0)
                                    .getDsl());
                    assertThat(newPage.getBaseId()).isNotNull();

                    assertThat(application.getPublishedAppLayout()).isEqualTo(application.getUnpublishedAppLayout());
                    assertThat(application.getPublishedApplicationDetail().getAppPositioning())
                            .isEqualTo(application
                                    .getUnpublishedApplicationDetail()
                                    .getAppPositioning());
                    assertThat(application.getPublishedApplicationDetail().getNavigationSetting())
                            .isEqualTo(application
                                    .getUnpublishedApplicationDetail()
                                    .getNavigationSetting());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void publishApplication_withPageIconSet_success() {
        Application testApplication = new Application();
        String appName = "ApplicationServiceTest Publish Application Page Icon";
        testApplication.setName(appName);
        testApplication = applicationPageService
                .createApplication(testApplication, workspaceId)
                .block();

        PageDTO page = new PageDTO();
        page.setName("Page2");
        page.setIcon("flight");
        page.setApplicationId(testApplication.getId());
        page = applicationPageService.createPage(page).block();

        Mono<Application> applicationMono = applicationPageService.publish(testApplication.getId(), true);

        Mono<List<NewPage>> applicationPagesMono = applicationMono
                .map(application -> application.getPages())
                .flatMapMany(Flux::fromIterable)
                .flatMap(applicationPage -> newPageService.findById(applicationPage.getId(), READ_PAGES))
                .collectList();

        PageDTO finalPage = page;
        StepVerifier.create(Mono.zip(applicationMono, applicationPagesMono))
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    List<NewPage> pages = tuple.getT2();

                    assertThat(application).isNotNull();
                    assertThat(application.getId()).isNotNull();
                    assertThat(application.getName()).isEqualTo(appName);
                    assertThat(application.getPages()).hasSize(2);
                    assertThat(application.getPublishedPages()).hasSize(2);

                    assertThat(pages).hasSize(2);
                    Optional<NewPage> optionalNewPage = pages.stream()
                            .filter(thisPage -> finalPage.getId().equals(thisPage.getId()))
                            .findFirst();
                    assertThat(optionalNewPage.isPresent()).isTrue();
                    NewPage newPage = optionalNewPage.get();
                    assertThat(newPage.getUnpublishedPage().getName()).isEqualTo("Page2");
                    assertThat(newPage.getUnpublishedPage().getName())
                            .isEqualTo(newPage.getPublishedPage().getName());
                    assertThat(newPage.getUnpublishedPage().getIcon()).isEqualTo("flight");
                    assertThat(newPage.getUnpublishedPage().getIcon())
                            .isEqualTo(newPage.getPublishedPage().getIcon());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteUnpublishedPageFromApplication() {
        Application testApplication = new Application();
        String appName = "ApplicationServiceTest Publish Application Delete Page";
        testApplication.setName(appName);
        Mono<Application> applicationMono = applicationPageService
                .createApplication(testApplication, workspaceId)
                .flatMap(application -> {
                    PageDTO page = new PageDTO();
                    page.setName("New Page");
                    page.setApplicationId(application.getId());
                    Layout defaultLayout = newPageService.createDefaultLayout();
                    List<Layout> layouts = new ArrayList<>();
                    layouts.add(defaultLayout);
                    page.setLayouts(layouts);
                    return applicationPageService
                            .createPage(page)
                            .flatMap(page1 -> applicationPageService.publish(page1.getApplicationId(), true))
                            .then(applicationService.findById(application.getId(), MANAGE_APPLICATIONS));
                })
                .cache();

        PageDTO newPage = applicationMono
                .flatMap(application -> newPageService
                        .findByNameAndApplicationIdAndViewMode("New Page", application.getId(), READ_PAGES, false)
                        .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "page")))
                        .flatMap(page -> applicationPageService.deleteUnpublishedPage(page.getId())))
                .block();

        ApplicationPage applicationPage = new ApplicationPage();
        applicationPage.setId(newPage.getId());
        applicationPage.setIsDefault(false);
        applicationPage.setDefaultPageId(newPage.getId());

        StepVerifier.create(applicationService.findById(newPage.getApplicationId(), MANAGE_APPLICATIONS))
                .assertNext(editedApplication -> {
                    List<ApplicationPage> publishedPages = editedApplication.getPublishedPages();
                    assertThat(publishedPages).size().isEqualTo(2);
                    assertThat(publishedPages).containsAnyOf(applicationPage);

                    List<ApplicationPage> editedApplicationPages = editedApplication.getPages();
                    assertThat(editedApplicationPages).hasSize(1);
                    assertThat(editedApplicationPages).doesNotContain(applicationPage);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteUnpublishedPage_FromApplicationConnectedToGit_success() {

        final String branchName = gitConnectedApp.getGitApplicationMetadata().getBranchName();
        PageDTO page = new PageDTO();
        page.setName("Test delete unPublish page test");
        page.setApplicationId(gitConnectedApp.getId());
        Layout defaultLayout = newPageService.createDefaultLayout();
        List<Layout> layouts = new ArrayList<>();
        layouts.add(defaultLayout);
        page.setLayouts(layouts);

        Mono<Application> applicationMono = applicationPageService
                .createPage(page)
                .flatMap(pageDTO -> applicationPageService.publish(pageDTO.getApplicationId(), true))
                .cache();

        PageDTO newPage = applicationMono
                .flatMap(application -> newPageService
                        .findByNameAndApplicationIdAndViewMode(
                                "Test delete unPublish page test", application.getId(), READ_PAGES, false)
                        .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "page")))
                        .flatMap(pageDTO -> applicationPageService.deleteUnpublishedPage(pageDTO.getId())))
                .block();

        ApplicationPage applicationPage = new ApplicationPage();
        applicationPage.setId(newPage.getId());
        applicationPage.setIsDefault(false);
        applicationPage.setDefaultPageId(newPage.getId());

        StepVerifier.create(applicationService.findById(newPage.getApplicationId(), MANAGE_APPLICATIONS))
                .assertNext(editedApplication -> {
                    List<ApplicationPage> publishedPages = editedApplication.getPublishedPages();
                    assertThat(publishedPages).size().isEqualTo(2);
                    assertThat(publishedPages).containsAnyOf(applicationPage);

                    List<ApplicationPage> editedApplicationPages = editedApplication.getPages();
                    assertThat(editedApplicationPages).hasSize(1);
                    assertThat(editedApplicationPages).doesNotContain(applicationPage);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void changeDefaultPageForAPublishedApplication() {
        Application testApplication = new Application();
        String appName = "ApplicationServiceTest Publish Application Change Default Page";
        testApplication.setName(appName);
        Mono<Application> applicationMono = applicationPageService
                .createApplication(testApplication, workspaceId)
                .flatMap(application -> {
                    PageDTO page = new PageDTO();
                    page.setName("New Page");
                    page.setApplicationId(application.getId());
                    Layout defaultLayout = newPageService.createDefaultLayout();
                    List<Layout> layouts = new ArrayList<>();
                    layouts.add(defaultLayout);
                    page.setLayouts(layouts);
                    return applicationPageService
                            .createPage(page)
                            .flatMap(page1 -> applicationPageService.publish(page1.getApplicationId(), true))
                            .then(applicationService.findById(application.getId(), MANAGE_APPLICATIONS));
                })
                .cache();

        PageDTO newPage = applicationMono
                .flatMap(application -> newPageService
                        .findByNameAndApplicationIdAndViewMode("New Page", application.getId(), READ_PAGES, false)
                        .switchIfEmpty(Mono.error(
                                new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "unpublishedEditedPage"))))
                .block();

        Mono<Application> updatedDefaultPageApplicationMono = applicationMono.flatMap(
                application -> applicationPageService.makePageDefault(application.getId(), newPage.getId()));

        ApplicationPage publishedEditedPage = new ApplicationPage();
        publishedEditedPage.setId(newPage.getId());
        publishedEditedPage.setIsDefault(false);

        ApplicationPage unpublishedEditedPage = new ApplicationPage();
        unpublishedEditedPage.setId(newPage.getId());
        unpublishedEditedPage.setIsDefault(true);

        StepVerifier.create(updatedDefaultPageApplicationMono)
                .assertNext(editedApplication -> {
                    List<ApplicationPage> publishedPages = editedApplication.getPublishedPages();
                    assertThat(publishedPages).size().isEqualTo(2);
                    boolean isFound = false;
                    for (ApplicationPage page : publishedPages) {
                        if (page.getId().equals(publishedEditedPage.getId())
                                && page.getIsDefault().equals(publishedEditedPage.getIsDefault())) {
                            isFound = true;
                            break;
                        }
                    }
                    assertThat(isFound).isTrue();

                    List<ApplicationPage> editedApplicationPages = editedApplication.getPages();
                    assertThat(editedApplicationPages).hasSize(2);
                    isFound = false;
                    for (ApplicationPage page : editedApplicationPages) {
                        if (page.getId().equals(unpublishedEditedPage.getId())
                                && page.getIsDefault().equals(unpublishedEditedPage.getIsDefault())) {
                            isFound = true;
                            break;
                        }
                    }
                    assertThat(isFound).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getApplicationInViewMode() {
        Application testApplication = new Application();
        String appName = "ApplicationServiceTest Get Application In View Mode";
        testApplication.setName(appName);
        Mono<Application> applicationMono = applicationPageService
                .createApplication(testApplication, workspaceId)
                .flatMap(application -> {
                    CustomJSLib jsLib =
                            new CustomJSLib("name1", Set.of("accessor"), "url", "docsUrl", "version", "defs");
                    return customJSLibService
                            .addJSLibsToContext(
                                    application.getId(), CreatorContextType.APPLICATION, Set.of(jsLib), false)
                            .then(applicationService.getById(application.getId()));
                })
                .flatMap(application -> {
                    PageDTO page = new PageDTO();
                    page.setName("New Page");
                    page.setApplicationId(application.getId());
                    Layout defaultLayout = newPageService.createDefaultLayout();
                    List<Layout> layouts = new ArrayList<>();
                    layouts.add(defaultLayout);
                    page.setLayouts(layouts);
                    return applicationPageService
                            .createPage(page)
                            .flatMap(page1 -> applicationPageService.publish(page1.getApplicationId(), true))
                            .then(applicationService.findById(application.getId(), MANAGE_APPLICATIONS));
                })
                .cache();

        PageDTO newPage = applicationMono
                .flatMap(application -> newPageService
                        .findByNameAndApplicationIdAndViewMode("New Page", application.getId(), READ_PAGES, false)
                        .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "page")))
                        .flatMap(page -> applicationPageService.deleteUnpublishedPage(page.getId())))
                .block();

        Mono<Application> viewModeApplicationMono = applicationMono.flatMap(
                application -> applicationService.getApplicationInViewMode(application.getId()));

        ApplicationPage applicationPage = new ApplicationPage();
        applicationPage.setId(newPage.getId());
        applicationPage.setIsDefault(false);

        StepVerifier.create(viewModeApplicationMono)
                .assertNext(viewApplication -> {
                    List<ApplicationPage> editedApplicationPages = viewApplication.getPages();
                    assertThat(editedApplicationPages).hasSize(2);
                    boolean isFound = false;
                    for (ApplicationPage page : editedApplicationPages) {
                        if (page.getId().equals(applicationPage.getId())
                                && page.getIsDefault().equals(applicationPage.getIsDefault())) {
                            isFound = true;
                            break;
                        }
                    }
                    assertThat(isFound).isTrue();

                    assertEquals(1, viewApplication.getPublishedCustomJSLibs().size());
                    CustomJSLib jsLib =
                            new CustomJSLib("name1", Set.of("accessor"), "url", "docsUrl", "version", "defs");
                    assertEquals(
                            getDTOFromCustomJSLib(jsLib),
                            viewApplication.getPublishedCustomJSLibs().toArray()[0]);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validCloneApplicationWhenCancelledMidWay() {
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        Application testApplication = new Application();
        String appName = "ApplicationServiceTest Clone Application Midway Cancellation";
        testApplication.setName(appName);

        Application originalApplication = applicationPageService
                .createApplication(testApplication, workspaceId)
                .block();

        String pageId = originalApplication.getPages().get(0).getId();

        Plugin plugin = pluginService.findByName("Installed Plugin Name").block();
        Datasource datasource = new Datasource();
        datasource.setName("Cloned App Test");
        datasource.setPluginId(plugin.getId());
        datasource.setWorkspaceId(workspaceId);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Datasource savedDatasource = datasourceService.create(datasource).block();

        ActionDTO action1 = new ActionDTO();
        action1.setName("Clone App Test action1");
        action1.setPageId(pageId);
        action1.setDatasource(savedDatasource);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action1.setActionConfiguration(actionConfiguration);

        ActionDTO savedAction1 =
                layoutActionService.createSingleAction(action1, Boolean.FALSE).block();

        ActionDTO action2 = new ActionDTO();
        action2.setName("Clone App Test action2");
        action2.setPageId(pageId);
        action2.setDatasource(savedDatasource);
        action2.setActionConfiguration(actionConfiguration);

        ActionDTO savedAction2 =
                layoutActionService.createSingleAction(action2, Boolean.FALSE).block();

        ActionDTO action3 = new ActionDTO();
        action3.setName("Clone App Test action3");
        action3.setPageId(pageId);
        action3.setDatasource(savedDatasource);
        action3.setActionConfiguration(actionConfiguration);

        ActionDTO savedAction3 =
                layoutActionService.createSingleAction(action3, Boolean.FALSE).block();

        // Testing JS Objects here
        ActionCollectionDTO actionCollectionDTO1 = new ActionCollectionDTO();
        actionCollectionDTO1.setName("testCollection1");
        actionCollectionDTO1.setPageId(pageId);
        actionCollectionDTO1.setApplicationId(originalApplication.getId());
        actionCollectionDTO1.setWorkspaceId(workspaceId);
        actionCollectionDTO1.setPluginId(datasource.getPluginId());
        ActionDTO jsAction = new ActionDTO();
        jsAction.setName("jsFunc");
        jsAction.setActionConfiguration(new ActionConfiguration());
        jsAction.getActionConfiguration().setBody("mockBody");
        actionCollectionDTO1.setActions(List.of(jsAction));
        actionCollectionDTO1.setPluginType(PluginType.JS);

        final ActionCollectionDTO createdActionCollectionDTO1 =
                layoutCollectionService.createCollection(actionCollectionDTO1).block();

        // Trigger the clone of application now.
        applicationPageService
                .cloneApplication(originalApplication.getId())
                .timeout(Duration.ofMillis(50))
                .subscribe();

        // Wait for cloning to complete
        Mono<Application> clonedAppFromDbMono = Mono.just(originalApplication)
                .flatMap(originalApp -> {
                    try {
                        // Before fetching the cloned application, sleep for 5 seconds to ensure that the cloning
                        // finishes
                        Thread.sleep(5000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    return applicationRepository
                            .findByClonedFromApplicationId(originalApp.getId())
                            .next();
                })
                .cache();

        // Find all actions in new app
        Mono<List<NewAction>> actionsMono = clonedAppFromDbMono.flatMap(clonedAppFromDb -> newActionService
                .findAllByApplicationIdAndViewMode(clonedAppFromDb.getId(), false, READ_ACTIONS, null)
                .collectList());

        // Find all pages in new app
        Mono<List<PageDTO>> pagesMono = clonedAppFromDbMono
                .flatMapMany(application -> Flux.fromIterable(application.getPages()))
                .flatMap(applicationPage -> newPageService.findPageById(applicationPage.getId(), READ_PAGES, false))
                .collectList();

        // Find all action collections in new app
        final Mono<List<ActionCollection>> actionCollectionsMono =
                clonedAppFromDbMono.flatMap(clonedAppFromDb -> actionCollectionService
                        .findAllByApplicationIdAndViewMode(clonedAppFromDb.getId(), false, READ_ACTIONS, null)
                        .collectList());

        StepVerifier.create(Mono.zip(clonedAppFromDbMono, actionsMono, pagesMono, actionCollectionsMono))
                .assertNext(tuple -> {
                    Application cloneApp = tuple.getT1();
                    List<NewAction> actions = tuple.getT2();
                    List<PageDTO> pages = tuple.getT3();
                    final List<ActionCollection> actionCollections = tuple.getT4();

                    assertThat(cloneApp).isNotNull();
                    assertThat(pages.get(0).getId()).isNotEqualTo(pageId);
                    assertThat(actions).hasSize(4);
                    Set<String> actionNames = actions.stream()
                            .map(action -> action.getUnpublishedAction().getName())
                            .collect(Collectors.toSet());
                    assertThat(actionNames)
                            .containsExactlyInAnyOrder(
                                    "Clone App Test action1",
                                    "Clone App Test action2",
                                    "Clone App Test action3",
                                    "jsFunc");
                    assertThat(actionCollections).hasSize(1);
                    Set<String> actionCollectionNames = actionCollections.stream()
                            .map(actionCollection ->
                                    actionCollection.getUnpublishedCollection().getName())
                            .collect(Collectors.toSet());
                    assertThat(actionCollectionNames).containsExactlyInAnyOrder("testCollection1");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void newApplicationShouldHavePublishedState() {
        Application testApplication = new Application();
        testApplication.setName("ApplicationServiceTest NewApp PublishedState");
        Mono<Application> applicationMono = applicationPageService
                .createApplication(testApplication, workspaceId)
                .cache();

        Mono<PageDTO> publishedPageMono = applicationMono.flatMap(application -> {
            List<ApplicationPage> publishedPages = application.getPublishedPages();
            return applicationPageService.getPage(publishedPages.get(0).getId(), true);
        });

        StepVerifier.create(Mono.zip(applicationMono, publishedPageMono))
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    PageDTO publishedPage = tuple.getT2();

                    // Assert that the application has 1 published page
                    assertThat(application.getPublishedPages()).hasSize(1);

                    // Assert that the published page and the unpublished page are one and the same
                    assertThat(application.getPages().get(0).getId())
                            .isEqualTo(application.getPublishedPages().get(0).getId());

                    // Assert that the published page has 1 layout
                    assertThat(publishedPage.getLayouts()).hasSize(1);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validGetApplicationPagesMultiPageApp() {
        Application app = new Application();
        app.setName("validGetApplicationPagesMultiPageApp-Test");

        Mono<Application> createApplicationMono =
                applicationPageService.createApplication(app, workspaceId).cache();

        // Create all the pages for this application in a blocking manner.
        createApplicationMono
                .flatMap(application -> {
                    PageDTO testPage = new PageDTO();
                    testPage.setName("Page2");
                    testPage.setIcon("flight");
                    testPage.setApplicationId(application.getId());
                    return applicationPageService.createPage(testPage).then(Mono.just(application));
                })
                .flatMap(application -> {
                    PageDTO testPage = new PageDTO();
                    testPage.setName("Page3");
                    testPage.setIcon("bag");
                    testPage.setApplicationId(application.getId());
                    return applicationPageService.createPage(testPage).then(Mono.just(application));
                })
                .flatMap(application -> {
                    PageDTO testPage = new PageDTO();
                    testPage.setName("Page4");
                    testPage.setIcon("bus");
                    testPage.setApplicationId(application.getId());
                    return applicationPageService.createPage(testPage);
                })
                .block();

        Mono<ApplicationPagesDTO> applicationPagesDTOMono = createApplicationMono
                .map(application -> application.getId())
                .flatMap(applicationId -> newPageService.findApplicationPagesByBranchedApplicationIdAndViewMode(
                        applicationId, false, false));

        StepVerifier.create(applicationPagesDTOMono)
                .assertNext(applicationPagesDTO -> {
                    assertThat(applicationPagesDTO.getPages()).hasSize(4);
                    List<String> pageNames = applicationPagesDTO.getPages().stream()
                            .map(pageNameIdDTO -> pageNameIdDTO.getName())
                            .collect(Collectors.toList());
                    List<String> slugNames = applicationPagesDTO.getPages().stream()
                            .map(pageNameIdDTO -> pageNameIdDTO.getSlug())
                            .collect(Collectors.toList());
                    List<String> pageIconNames = applicationPagesDTO.getPages().stream()
                            .map(pageNameIdDTO -> pageNameIdDTO.getIcon())
                            .collect(Collectors.toList());
                    assertThat(pageNames).containsExactly("Page1", "Page2", "Page3", "Page4");
                    assertThat(slugNames).containsExactly("page1", "page2", "page3", "page4");
                    assertThat(pageIconNames).containsExactly(null, "flight", "bag", "bus");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validChangeViewAccessCancelledMidWay() {

        Application testApplication = new Application();
        String appName = "ApplicationServiceTest Public View Application Midway Cancellation";
        testApplication.setName(appName);

        Application originalApplication = applicationPageService
                .createApplication(testApplication, workspaceId)
                .block();

        String pageId = originalApplication.getPages().get(0).getId();

        Plugin plugin = pluginService.findByName("Installed Plugin Name").block();
        Datasource datasource = new Datasource();
        datasource.setName("Public View App Test");
        datasource.setPluginId(plugin.getId());
        datasource.setWorkspaceId(workspaceId);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Datasource savedDatasource = datasourceService.create(datasource).block();

        ActionDTO action1 = new ActionDTO();
        action1.setName("Public View Test action1");
        action1.setPageId(pageId);
        action1.setDatasource(savedDatasource);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action1.setActionConfiguration(actionConfiguration);

        ActionDTO savedAction1 =
                layoutActionService.createSingleAction(action1, Boolean.FALSE).block();

        ActionDTO action2 = new ActionDTO();
        action2.setName("Public View Test action2");
        action2.setPageId(pageId);
        action2.setDatasource(savedDatasource);
        action2.setActionConfiguration(actionConfiguration);

        ActionDTO savedAction2 =
                layoutActionService.createSingleAction(action2, Boolean.FALSE).block();

        ActionDTO action3 = new ActionDTO();
        action3.setName("Public View Test action3");
        action3.setPageId(pageId);
        action3.setDatasource(savedDatasource);
        action3.setActionConfiguration(actionConfiguration);

        ActionDTO savedAction3 =
                layoutActionService.createSingleAction(action3, Boolean.FALSE).block();

        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);

        // Trigger the change view access of application now.
        applicationService
                .changeViewAccessForSingleBranchByBranchedApplicationId(
                        originalApplication.getId(), applicationAccessDTO)
                .timeout(Duration.ofMillis(10))
                .subscribe();

        Mono<Application> applicationFromDbPostViewChange = Mono.just(originalApplication)
                .flatMap(originalApp -> {
                    try {
                        // Before fetching the public application, sleep for 5 seconds to ensure that the updating
                        // all appsmith objects with public permission finishes.
                        Thread.sleep(5000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    return applicationRepository
                            .findById(originalApplication.getId(), READ_APPLICATIONS)
                            .flatMap(applicationService::setTransientFields);
                })
                .cache();

        Mono<List<NewAction>> actionsMono = applicationFromDbPostViewChange.flatMap(clonedAppFromDb -> newActionService
                .findAllByApplicationIdAndViewMode(clonedAppFromDb.getId(), false, READ_ACTIONS, null)
                .collectList());

        Mono<List<PageDTO>> pagesMono = applicationFromDbPostViewChange
                .flatMapMany(application -> Flux.fromIterable(application.getPages()))
                .flatMap(applicationPage -> newPageService.findPageById(applicationPage.getId(), READ_PAGES, false))
                .collectList();

        Mono<Datasource> datasourceMono = applicationFromDbPostViewChange.flatMap(
                application -> datasourceService.findById(savedDatasource.getId(), READ_DATASOURCES));

        List<PermissionGroup> permissionGroups = workspaceService
                .findById(workspaceId, READ_WORKSPACES)
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList()
                .block();

        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();

        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                .findFirst()
                .get();

        PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                .findFirst()
                .get();

        Mono<PermissionGroup> publicPermissionGroupMono = permissionGroupService.getPublicPermissionGroup();

        User anonymousUser = userRepository.findByEmail(ANONYMOUS_USER).block();

        StepVerifier.create(Mono.zip(
                        applicationFromDbPostViewChange,
                        actionsMono,
                        pagesMono,
                        datasourceMono,
                        publicPermissionGroupMono))
                .assertNext(tuple -> {
                    Application updatedApplication = tuple.getT1();
                    List<NewAction> actions = tuple.getT2();
                    List<PageDTO> pages = tuple.getT3();
                    Datasource datasource1 = tuple.getT4();
                    PermissionGroup permissionGroup = tuple.getT5();

                    assertThat(permissionGroup.getAssignedToUserIds()).containsAll(Set.of(anonymousUser.getId()));

                    assertThat(updatedApplication).isNotNull();
                    assertThat(updatedApplication.getIsPublic()).isTrue();
                    assertThat(updatedApplication.getPolicies().stream()
                                    .filter(policy -> policy.getPermission().equals(READ_APPLICATIONS.getValue()))
                                    .findFirst()
                                    .get()
                                    .getPermissionGroups())
                            .contains(permissionGroup.getId());

                    for (PageDTO page : pages) {
                        assertThat(page.getPolicies().stream()
                                        .filter(policy -> policy.getPermission().equals(READ_PAGES.getValue()))
                                        .findFirst()
                                        .get()
                                        .getPermissionGroups())
                                .contains(permissionGroup.getId());
                    }

                    for (NewAction action : actions) {
                        assertThat(action.getPolicies().stream()
                                        .filter(policy -> policy.getPermission().equals(EXECUTE_ACTIONS.getValue()))
                                        .findFirst()
                                        .get()
                                        .getPermissionGroups())
                                .contains(permissionGroup.getId());
                    }

                    assertThat(datasource1.getPolicies().stream()
                                    .filter(policy -> policy.getPermission().equals(EXECUTE_DATASOURCES.getValue()))
                                    .findFirst()
                                    .get()
                                    .getPermissionGroups())
                            .contains(permissionGroup.getId());
                })
                .verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void saveLastEditInformation_WhenUserHasPermission_Updated() {
        Application testApplication = new Application();
        testApplication.setName("SaveLastEditInformation TestApp");
        testApplication.setModifiedBy("test-user");
        testApplication.setIsPublic(true);

        Mono<Application> updatedApplication = applicationPageService
                .createApplication(testApplication, workspaceId)
                .flatMap(application -> {
                    ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
                    applicationAccessDTO.setPublicAccess(TRUE);
                    return applicationService.changeViewAccessForSingleBranchByBranchedApplicationId(
                            application.getId(), applicationAccessDTO);
                })
                .flatMap(application -> applicationService.saveLastEditInformation(application.getId()));
        StepVerifier.create(updatedApplication)
                .assertNext(application -> {
                    assertThat(application.getLastUpdateTime()).isNotNull();
                    assertThat(application.getPolicies()).isNotNull().isNotEmpty();
                    assertThat(application.getModifiedBy()).isEqualTo("api_user");
                    assertThat(application.getIsPublic()).isTrue();
                    assertThat(application.getIsManualUpdate()).isTrue();
                })
                .verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void generateSshKeyPair_WhenDefaultApplicationIdNotSet_CurrentAppUpdated() {
        Application unsavedApplication = new Application();
        unsavedApplication.setWorkspaceId(workspaceId);
        unsavedApplication.setName("ssh-test-app");

        Mono<Application> applicationMono = applicationPageService
                .createApplication(unsavedApplication)
                .flatMap(savedApplication -> artifactService
                        .createOrUpdateSshKeyPair(ArtifactType.APPLICATION, savedApplication.getId(), null)
                        .thenReturn(savedApplication.getId()))
                .flatMap(testApplicationId -> applicationRepository.findById(testApplicationId, MANAGE_APPLICATIONS));

        StepVerifier.create(applicationMono)
                .assertNext(testApplication -> {
                    GitAuth gitAuth =
                            testApplication.getGitApplicationMetadata().getGitAuth();
                    assertThat(gitAuth.getPublicKey()).isNotNull();
                    assertThat(gitAuth.getPrivateKey()).isNotNull();
                    assertThat(gitAuth.getGeneratedAt()).isNotNull();
                    assertThat(testApplication.getGitApplicationMetadata().getDefaultApplicationId())
                            .isNotNull();
                })
                .verifyComplete();
    }

    @WithUserDetails("api_user")
    @Test
    public void generateSshKeyPair_WhenDefaultApplicationIdSet_DefaultApplicationUpdated() {

        Application unsavedMainApp = new Application();
        unsavedMainApp.setName("ssh-key-master-app");
        unsavedMainApp.setWorkspaceId(workspaceId);

        Application savedApplication = applicationPageService
                .createApplication(unsavedMainApp, workspaceId)
                .block();

        Mono<Tuple2<Application, Application>> tuple2Mono = artifactService
                .createOrUpdateSshKeyPair(ArtifactType.APPLICATION, savedApplication.getId(), null)
                .thenReturn(savedApplication)
                .flatMap(savedMainApp -> {
                    Application unsavedChildApp = new Application();
                    unsavedChildApp.setGitApplicationMetadata(new GitArtifactMetadata());
                    unsavedChildApp.getGitApplicationMetadata().setDefaultApplicationId(savedMainApp.getId());
                    unsavedChildApp.setName("ssh-key-child-app");
                    unsavedChildApp.setWorkspaceId(workspaceId);
                    return applicationPageService.createApplication(unsavedChildApp, workspaceId);
                })
                .flatMap(savedChildApp -> artifactService
                        .createOrUpdateSshKeyPair(ArtifactType.APPLICATION, savedChildApp.getId(), null)
                        .thenReturn(savedChildApp))
                .flatMap(savedChildApp -> {
                    // fetch and return both child and main applications
                    String mainApplicationId =
                            savedChildApp.getGitApplicationMetadata().getDefaultApplicationId();
                    Mono<Application> childAppMono =
                            applicationRepository.findById(savedChildApp.getId(), MANAGE_APPLICATIONS);
                    Mono<Application> mainAppMono =
                            applicationRepository.findById(mainApplicationId, MANAGE_APPLICATIONS);
                    return Mono.zip(childAppMono, mainAppMono);
                });

        StepVerifier.create(tuple2Mono)
                .assertNext(applicationTuple2 -> {
                    Application childApp = applicationTuple2.getT1();
                    Application mainApp = applicationTuple2.getT2();

                    // main app should have the generated keys
                    GitAuth gitAuth = mainApp.getGitApplicationMetadata().getGitAuth();
                    assertThat(gitAuth.getPublicKey()).isNotNull();
                    assertThat(gitAuth.getPrivateKey()).isNotNull();
                    assertThat(gitAuth.getGeneratedAt()).isNotNull();

                    // child app should have null as GitAuth inside the metadata
                    GitArtifactMetadata metadata = childApp.getGitApplicationMetadata();
                    assertThat(metadata.getDefaultApplicationId()).isEqualTo(mainApp.getId());
                    assertThat(metadata.getGitAuth()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteApplication_withPagesActionsAndActionCollections_resourcesArchived() {

        /*
        1. Create application
        2. Add page, action and actionCollection
        5. Delete application
        6. Page, action and actionCollection should be soft deleted
        */
        Application testApplication = new Application();
        String appName = "deleteApplicationWithPagesAndActions";
        testApplication.setName(appName);

        Mono<Tuple4<NewAction, ActionCollection, NewPage, NewAction>> resultMono = applicationPageService
                .createApplication(testApplication, workspaceId)
                .flatMap(application -> {
                    PageDTO page = new PageDTO();
                    page.setName("New Page");
                    page.setApplicationId(application.getId());
                    Layout defaultLayout = newPageService.createDefaultLayout();
                    List<Layout> layouts = new ArrayList<>();
                    layouts.add(defaultLayout);
                    page.setLayouts(layouts);
                    return Mono.zip(
                            applicationPageService.createPage(page),
                            pluginRepository.findByPackageName("installed-plugin"));
                })
                .flatMap(tuple -> {
                    final PageDTO page = tuple.getT1();
                    final Plugin installedPlugin = tuple.getT2();

                    final Datasource datasource = new Datasource();
                    datasource.setName("Default Database");
                    datasource.setWorkspaceId(workspaceId);
                    datasource.setPluginId(installedPlugin.getId());
                    datasource.setDatasourceConfiguration(new DatasourceConfiguration());

                    ActionDTO action = new ActionDTO();
                    action.setName("validAction");
                    action.setPageId(page.getId());
                    action.setExecuteOnLoad(true);
                    ActionConfiguration actionConfiguration = new ActionConfiguration();
                    actionConfiguration.setHttpMethod(HttpMethod.GET);
                    action.setActionConfiguration(actionConfiguration);
                    action.setDatasource(datasource);

                    // Save actionCollection
                    ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
                    actionCollectionDTO.setName("testCollection1");
                    actionCollectionDTO.setPageId(page.getId());
                    actionCollectionDTO.setPluginId(datasource.getPluginId());
                    actionCollectionDTO.setApplicationId(testApplication.getId());
                    actionCollectionDTO.setWorkspaceId(testApplication.getWorkspaceId());
                    actionCollectionDTO.setVariables(List.of(new JSValue("test", "String", "test", true)));
                    ActionDTO action1 = new ActionDTO();
                    action1.setName("archivePageTest");
                    action1.setActionConfiguration(new ActionConfiguration());
                    actionCollectionDTO.setActions(List.of(action1));
                    actionCollectionDTO.setPluginType(PluginType.JS);

                    return layoutActionService
                            .createSingleAction(action, Boolean.FALSE)
                            .zipWith(layoutCollectionService.createCollection(actionCollectionDTO))
                            .flatMap(tuple1 -> {
                                ActionDTO savedAction = tuple1.getT1();
                                ActionCollectionDTO savedActionCollection = tuple1.getT2();
                                return applicationService
                                        .findById(page.getApplicationId(), MANAGE_APPLICATIONS)
                                        .flatMap(application ->
                                                applicationPageService.deleteApplication(application.getId()))
                                        .flatMap(ignored -> {
                                            final String actionId = savedActionCollection
                                                    .getActions()
                                                    .get(0)
                                                    .getId();
                                            return Mono.zip(
                                                    (Mono<NewAction>) this.getArchivedResource(
                                                            savedAction.getId(), NewAction.class),
                                                    (Mono<ActionCollection>) this.getArchivedResource(
                                                            savedActionCollection.getId(), ActionCollection.class),
                                                    (Mono<NewPage>)
                                                            this.getArchivedResource(page.getId(), NewPage.class),
                                                    (Mono<NewAction>)
                                                            this.getArchivedResource(actionId, NewAction.class));
                                        });
                            });
                })
                .cache();

        StepVerifier.create(resultMono)
                .assertNext(tuple -> {
                    NewAction archivedAction = tuple.getT1();
                    ActionCollection archivedActionCollection = tuple.getT2();
                    NewPage archivedPage = tuple.getT3();
                    NewAction archivedActionFromActionCollection = tuple.getT4();

                    assertThat(archivedAction.getDeletedAt()).isNotNull();

                    assertThat(archivedActionCollection.getDeletedAt()).isNotNull();

                    assertThat(archivedPage.getDeletedAt()).isNotNull();

                    assertThat(archivedActionFromActionCollection.getDeletedAt())
                            .isNotNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteApplication_withNullGitData_Success() {
        Application testApplication = new Application();
        String appName = "deleteApplication_withNullGitData_Success";
        testApplication.setName(appName);
        Application application = applicationPageService
                .createApplication(testApplication, workspaceId)
                .block();

        Mono<Application> applicationMono = applicationPageService.deleteApplication(application.getId());

        StepVerifier.create(applicationMono)
                .assertNext(application1 -> {
                    assertThat(application1.isDeleted()).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteApplication_WithDeployKeysNotConnectedToRemote_Success() {
        Application testApplication = new Application();
        String appName = "deleteApplication_WithDeployKeysNotConnectedToRemote_Success";
        testApplication.setName(appName);
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPrivateKey("privateKey");
        gitAuth.setPublicKey("publicKey");
        gitArtifactMetadata.setGitAuth(gitAuth);
        testApplication.setGitApplicationMetadata(gitArtifactMetadata);
        Application application = applicationPageService
                .createApplication(testApplication, workspaceId)
                .block();

        Mono<Application> applicationMono = applicationPageService.deleteApplication(application.getId());

        StepVerifier.create(applicationMono)
                .assertNext(application1 -> {
                    assertThat(application1.isDeleted()).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneApplication_WithCustomSavedTheme_ThemesAlsoCopied() {
        Application testApplication = new Application();
        String appName = "cloneApplication_WithCustomSavedTheme_ThemesAlsoCopied";
        testApplication.setName(appName);

        Theme theme = new Theme();
        theme.setDisplayName("Custom theme");

        Mono<Theme> createTheme = themeService.create(theme);

        Mono<Tuple2<Theme, Tuple2<Application, Application>>> tuple2Application = createTheme
                .then(applicationPageService.createApplication(testApplication, workspaceId))
                .flatMap(application -> themeService
                        .updateTheme(application.getId(), theme)
                        .then(themeService
                                .persistCurrentTheme(application.getId(), null, new Theme())
                                .flatMap(theme1 -> Mono.zip(
                                        applicationPageService.cloneApplication(application.getId()),
                                        Mono.just(application)))))
                .flatMap(objects -> themeService
                        .getThemeById(objects.getT1().getEditModeThemeId(), MANAGE_THEMES)
                        .zipWith(Mono.just(objects)));

        StepVerifier.create(tuple2Application)
                .assertNext(objects -> {
                    Theme clonedTheme = objects.getT1();
                    Application clonedApp = objects.getT2().getT1();
                    Application srcApp = objects.getT2().getT2();
                    assertThat(clonedApp.getEditModeThemeId()).isNotEqualTo(srcApp.getEditModeThemeId());
                    assertThat(clonedTheme.getApplicationId()).isNull();
                    assertThat(clonedTheme.getWorkspaceId()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getApplicationConnectedToGit_defaultBranchUpdated_returnBranchSpecificApplication() {
        // Update the default Branch for the gitConnected App
        gitConnectedApp.getGitApplicationMetadata().setDefaultBranchName("release");
        applicationService.save(gitConnectedApp).block();

        Application testApplication = new Application();
        testApplication.setName("getApplicationConnectedToGit_defaultBranchUpdated_returnBranchSpecificApplication");
        testApplication.setWorkspaceId(workspaceId);
        GitArtifactMetadata gitData = new GitArtifactMetadata();
        gitData.setBranchName("release");
        gitData.setDefaultApplicationId(gitConnectedApp.getId());
        testApplication.setGitApplicationMetadata(gitData);
        Application application = applicationPageService
                .createApplication(testApplication)
                .flatMap(application1 -> exportService
                        .exportByArtifactIdAndBranchName(gitConnectedApp.getId(), gitData.getBranchName(), APPLICATION)
                        .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson)
                        .flatMap(applicationJson -> importService.importArtifactInWorkspaceFromGit(
                                workspaceId, application1.getId(), applicationJson, gitData.getBranchName())))
                .map(importableArtifact -> (Application) importableArtifact)
                .block();

        Mono<Application> getApplication = applicationService.findByBranchedId(application.getId(), null);
        StepVerifier.create(getApplication)
                .assertNext(application1 -> {
                    assertThat(application1).isNotNull();
                    assertThat(application1.getGitApplicationMetadata().getBranchName())
                            .isNotEqualTo(
                                    gitConnectedApp.getGitApplicationMetadata().getBranchName());
                    assertThat(application1.getGitApplicationMetadata().getBranchName())
                            .isEqualTo(application.getGitApplicationMetadata().getBranchName());
                    assertThat(application1.getGitArtifactMetadata().getDefaultArtifactId())
                            .isEqualTo(gitConnectedApp.getId());
                    assertThat(application1.getName()).isEqualTo(application.getName());
                })
                .verifyComplete();
    }

    /**
     * Test case which proves the non-dependency of isPublic Field in Update Application API Response
     * on the deprecated Application collection isPublic field for a public application
     * The following steps are followed:
     * 1. Create a new app
     * 2. Invoke the changeViewAccess method to set the App "Public"
     * 3. Invoke the update method and assert the "isPublic" field in the response
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void validPublicAppUpdateApplication() {
        Application application = new Application();
        application.setName("validPublicAppUpdateApplication-Test");

        Application createdApplication = applicationPageService
                .createApplication(application, workspaceId)
                .block();

        /**
         * Making the App public using changeViewAccess method which changes the permission groups of the app to allow public access
         */
        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);
        Application publicAccessApplication = applicationService
                .changeViewAccessForSingleBranchByBranchedApplicationId(
                        createdApplication.getId(), applicationAccessDTO)
                .block();

        /**
         * setIsPublic to False, purposely set to prove non-dependency on this field of the output
         */
        publicAccessApplication.setIsPublic(false);

        /**
         * Using the Update App method and asserting the response to verify the isPublic field in the response is True
         * which proves it's non-dependency on the deprecated Application collection isPublic field
         * and shows it dependency on the actual app permissions and state of the app which has been set public in this case
         **/
        Mono<Application> updatedApplication =
                applicationService.update(createdApplication.getId(), publicAccessApplication);
        StepVerifier.create(updatedApplication)
                .assertNext(t -> {
                    assertThat(t).isNotNull();
                    assertThat(t.getId()).isNotNull();
                    assertThat(t.getIsPublic()).isTrue();
                })
                .verifyComplete();
    }

    /**
     * Test case which proves the non-dependency of isPublic Field in Update Application API Response
     * on the deprecated Application collection isPublic field for a public application
     * The following steps are followed:
     * 1. Create a new app
     * 2. Invoke the changeViewAccess method to set the App "Public"
     * 3. Invoke the update method and assert the "isPublic" field in the response
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void validPrivateAppUpdateApplication() {
        Application application = new Application();
        application.setName("validPrivateAppUpdateApplication-Test");

        Application createdApplication = applicationPageService
                .createApplication(application, workspaceId)
                .block();

        /**
         * Making the App private using changeViewAccess method which changes the permission groups of the app to restrict public access
         */
        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(false);

        Application privateAccessApplication = applicationService
                .changeViewAccessForSingleBranchByBranchedApplicationId(
                        createdApplication.getId(), applicationAccessDTO)
                .block();

        /**
         * setIsPublic to True, purposely set to prove non-dependency on this field of the output
         */
        privateAccessApplication.setIsPublic(true);

        /**
         * Using the Update App method and asserting the response to verify the isPublic field in the response is False
         * which proves it's non-dependency on the deprecated Application collection isPublic field
         * and shows it dependency on the actual app permissions and state of the app which has been set private in this case
         **/
        Mono<Application> updatedApplication =
                applicationService.update(createdApplication.getId(), privateAccessApplication);
        StepVerifier.create(updatedApplication)
                .assertNext(t -> {
                    assertThat(t).isNotNull();
                    assertThat(t.getId()).isNotNull();
                    assertThat(t.getIsPublic()).isFalse();
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

    private String createTestApplication(String applicationName) {
        Application testApplication = new Application();
        testApplication.setName(applicationName);
        Application application = applicationPageService
                .createApplication(testApplication, workspaceId)
                .block();
        return application.getId();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testUploadAndDeleteNavigationLogo_validImage() {
        FilePart filepart = createMockFilePart();
        String createdApplicationId = createTestApplication("ApplicationServiceTest Upload/Delete Nav Logo");

        final Mono<Application> saveMono = applicationService
                .saveAppNavigationLogo(createdApplicationId, filepart)
                .cache();

        Mono<Tuple2<Application, Asset>> loadLogoImageMono = applicationService
                .findById(createdApplicationId)
                .flatMap(fetchedApplication -> {
                    Mono<Application> fetchedApplicationMono = Mono.just(fetchedApplication);
                    if (StringUtils.isEmpty(fetchedApplication
                            .getUnpublishedApplicationDetail()
                            .getNavigationSetting()
                            .getLogoAssetId())) {
                        return fetchedApplicationMono.zipWith(Mono.just(new Asset()));
                    } else {
                        return fetchedApplicationMono.zipWith(assetRepository.findById(fetchedApplication
                                .getUnpublishedApplicationDetail()
                                .getNavigationSetting()
                                .getLogoAssetId()));
                    }
                });

        final Mono<Tuple2<Application, Asset>> saveAndGetMono = saveMono.then(loadLogoImageMono);
        final Mono<Tuple2<Application, Asset>> deleteAndGetMono = saveMono.then(
                        applicationService.deleteAppNavigationLogo(createdApplicationId))
                .then(loadLogoImageMono);

        StepVerifier.create(saveAndGetMono)
                .assertNext(tuple -> {
                    final Application application1 = tuple.getT1();
                    assertThat(application1
                                    .getUnpublishedApplicationDetail()
                                    .getNavigationSetting()
                                    .getLogoAssetId())
                            .isNotNull();

                    final Asset asset = tuple.getT2();
                    assertThat(asset).isNotNull();
                })
                .verifyComplete();

        StepVerifier.create(deleteAndGetMono)
                .assertNext(objects -> {
                    assertThat(objects.getT1()
                                    .getUnpublishedApplicationDetail()
                                    .getNavigationSetting()
                                    .getLogoAssetId())
                            .isNull();
                    assertThat(objects.getT2().getId()).isNull();
                })
                // Should be empty since the profile photo has been deleted.
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testUploadNavigationLogo_invalidImageFormat() {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils.read(
                        new ClassPathResource("test_assets/WorkspaceServiceTest/my_workspace_logo.png"),
                        new DefaultDataBufferFactory(),
                        4096)
                .cache();

        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.IMAGE_GIF);

        String createdApplicationId = createTestApplication("ApplicationServiceTest Upload Invalid Nav Logo");

        final Mono<Application> saveMono = applicationService
                .saveAppNavigationLogo(createdApplicationId, filepart)
                .cache();
        StepVerifier.create(saveMono)
                .expectErrorMatches(error -> error instanceof AppsmithException)
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testUploadNavigationLogo_invalidImageSize() {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils.read(
                        new ClassPathResource("test_assets/WorkspaceServiceTest/my_workspace_logo_large.png"),
                        new DefaultDataBufferFactory(),
                        4096)
                .repeat(100) // So the file size looks like it's much larger than what it actually is.
                .cache();

        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.IMAGE_PNG);

        String createdApplicationId = createTestApplication("ApplicationServiceTest Upload Invalid Nav Logo Size");

        final Mono<Application> saveMono = applicationService
                .saveAppNavigationLogo(createdApplicationId, filepart)
                .cache();
        StepVerifier.create(saveMono)
                .expectErrorMatches(error -> error instanceof AppsmithException)
                .verify();
    }

    @Test
    @WithUserDetails("api_user")
    public void cloneApplication_WhenClonedSuccessfully_InternalFieldsResetToNull() {
        String applicationName = "ApplicationServiceTest internal fields reset post cloning";
        Application testApplication = new Application();
        testApplication.setName(applicationName);
        testApplication.setExportWithConfiguration(TRUE);
        testApplication.setForkWithConfiguration(TRUE);
        testApplication.setForkingEnabled(TRUE);

        Application application = applicationPageService
                .createApplication(testApplication, workspaceId)
                .block();
        Mono<Application> clonedApplicationMono = applicationPageService.cloneApplication(application.getId());

        StepVerifier.create(clonedApplicationMono)
                .assertNext(clonedApplication -> {
                    assertThat(clonedApplication.getExportWithConfiguration()).isNull();
                    assertThat(clonedApplication.getForkWithConfiguration()).isNull();
                    assertThat(clonedApplication.getForkingEnabled()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void publishApplication_noPageEditPermissions() {
        String gitAppPageId = gitConnectedApp.getPages().get(0).getId();
        NewPage gitAppPage = newPageRepository.findById(gitAppPageId).block();
        Set<Policy> existingPolicies = gitAppPage.getPolicies();
        /*
         * Git connected application has 2 pages.
         * We take away all Manage Page permissions for 2nd page.
         * Now since, no one has the permissions to Edit the 2nd page, teh application deployment will fail.
         */
        Set<Policy> newPoliciesWithoutEdit = existingPolicies.stream()
                .filter(policy -> !policy.getPermission()
                        .equals(pagePermission.getEditPermission().getValue()))
                .collect(Collectors.toSet());
        gitAppPage.setPolicies(newPoliciesWithoutEdit);
        NewPage updatedGitAppPage = newPageRepository.save(gitAppPage).block();
        StepVerifier.create(applicationPageService.publish(gitConnectedApp.getId(), true))
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.UNABLE_TO_DEPLOY_MISSING_PERMISSION.getMessage(
                                        "page", gitAppPageId)))
                .verify();
        updatedGitAppPage.setPolicies(existingPolicies);
        NewPage setPoliciesBack = newPageRepository.save(updatedGitAppPage).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneApplication_noPageEditPermissions() {
        int existingApplicationCount = applicationService
                .findAllApplicationsByWorkspaceId(workspaceId)
                .collectList()
                .block()
                .size();
        String gitAppPageId = gitConnectedApp.getPages().get(0).getId();
        NewPage gitAppPage = newPageRepository.findById(gitAppPageId).block();
        Set<Policy> existingPolicies = gitAppPage.getPolicies();
        /*
         * Git connected application has 2 pages.
         * We take away all Manage Page permissions for 2nd page.
         * Now since, no one has the permissions to Edit the 2nd page, the application cloning will fail.
         */
        Set<Policy> newPoliciesWithoutEdit = existingPolicies.stream()
                .filter(policy -> !policy.getPermission()
                        .equals(pagePermission.getEditPermission().getValue()))
                .collect(Collectors.toSet());
        gitAppPage.setPolicies(newPoliciesWithoutEdit);
        NewPage updatedGitAppPage = newPageRepository.save(gitAppPage).block();
        StepVerifier.create(applicationPageService.cloneApplication(gitConnectedApp.getId()))
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.APPLICATION_NOT_CLONED_MISSING_PERMISSIONS.getMessage(
                                        "page", gitAppPageId)))
                .verify();
        updatedGitAppPage.setPolicies(existingPolicies);
        NewPage setPoliciesBack = newPageRepository.save(updatedGitAppPage).block();

        Mono<List<Application>> applicationsInWorkspace =
                applicationService.findAllApplicationsByWorkspaceId(workspaceId).collectList();
        /*
         * Check that no applications have been created in the Target Workspace
         * This can be checked by comparing it with the existing count of applications in the Workspace.
         */
        StepVerifier.create(applicationsInWorkspace)
                .assertNext(applications -> assertThat(applications).hasSize(existingApplicationCount));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneApplication_noDatasourceCreateActionPermissions() {
        String gitAppPageId = gitConnectedApp.getPages().get(0).getId();
        int existingApplicationCount = applicationService
                .findAllApplicationsByWorkspaceId(workspaceId)
                .collectList()
                .block()
                .size();

        ActionDTO action = new ActionDTO();
        action.setName("validAction");
        action.setPageId(gitAppPageId);
        action.setExecuteOnLoad(true);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(testDatasource1);
        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        Set<Policy> existingPolicies = testDatasource1.getPolicies();
        /*
         * The created Workspace has a Datasource. And we will remove the Create Datasource Action permisison.
         */
        Set<Policy> newPoliciesWithoutEdit = existingPolicies.stream()
                .filter(policy -> !policy.getPermission()
                        .equals(datasourcePermission.getActionCreatePermission().getValue()))
                .collect(Collectors.toSet());
        testDatasource1.setPolicies(newPoliciesWithoutEdit);
        Datasource updatedTestDatasource =
                datasourceRepository.save(testDatasource1).block();
        StepVerifier.create(applicationPageService.cloneApplication(gitConnectedApp.getId()))
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.APPLICATION_NOT_CLONED_MISSING_PERMISSIONS.getMessage(
                                        "datasource", testDatasource1.getId())))
                .verify();
        updatedTestDatasource.setPolicies(existingPolicies);
        Datasource setPoliciesBack =
                datasourceRepository.save(updatedTestDatasource).block();

        ActionDTO deletedAction = layoutActionService
                .deleteUnpublishedAction(createdAction.getId())
                .block();

        Mono<List<Application>> applicationsInWorkspace =
                applicationService.findAllApplicationsByWorkspaceId(workspaceId).collectList();
        /*
         * Check that no applications have been created in the Target Workspace
         * This can be checked by comparing it with the existing count of applications in the Workspace.
         */
        StepVerifier.create(applicationsInWorkspace)
                .assertNext(applications -> assertThat(applications).hasSize(existingApplicationCount));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testUpdateApplication_modifiedByShouldUpdate() {
        String testName = "testUpdateApplication_modifiedByShouldUpdate";

        User user1 = new User();
        user1.setEmail(testName + "@appsmith.com");
        user1.setPassword(tempUserPassword);
        User createdUser = userService.create(user1).block();

        List<PermissionGroup> defaultWorkspaceRoles = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(workspaceId, Workspace.class.getSimpleName())
                .collectList()
                .block();

        PermissionGroup administratorRole = defaultWorkspaceRoles.stream()
                .filter(role -> role.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();
        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        inviteUsersDTO.setPermissionGroupId(administratorRole.getId());
        inviteUsersDTO.setUsernames(List.of(createdUser.getUsername()));
        userAndAccessManagementService.inviteUsers(inviteUsersDTO, testName).block();

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspaceId);
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        Application updateNameOfApplication = new Application();
        updateNameOfApplication.setName(testName + "_editedBy_" + createdUser.getUsername());

        Application updatedNameOfApplication = runAs(
                        applicationService.update(createdApplication.getId(), updateNameOfApplication), createdUser)
                .block();

        Application applicationPostNameUpdate =
                applicationRepository.findById(createdApplication.getId()).block();

        assertThat(applicationPostNameUpdate.getName()).isEqualTo(testName + "_editedBy_" + createdUser.getUsername());
        assertThat(applicationPostNameUpdate.getModifiedBy()).isEqualTo(createdUser.getUsername());
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testCreatePage_lastModifiedByShouldGetChanged() {
        String testName = "testSavedLastEditInformation";

        User user1 = new User();
        user1.setEmail(testName + "@appsmith.com");
        user1.setPassword(tempUserPassword);
        User createdUser = userService.create(user1).block();

        List<PermissionGroup> defaultWorkspaceRoles = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(workspaceId, Workspace.class.getSimpleName())
                .collectList()
                .block();

        PermissionGroup administratorRole = defaultWorkspaceRoles.stream()
                .filter(role -> role.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();
        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        inviteUsersDTO.setPermissionGroupId(administratorRole.getId());
        inviteUsersDTO.setUsernames(List.of(createdUser.getUsername()));
        userAndAccessManagementService.inviteUsers(inviteUsersDTO, testName).block();

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspaceId);
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        PageDTO pageDTO = new PageDTO();
        pageDTO.setName(testName);
        pageDTO.setApplicationId(createdApplication.getId());
        PageDTO createdPageDTO =
                runAs(applicationPageService.createPage(pageDTO), createdUser).block();

        Application applicationPostLastEdit =
                applicationRepository.findById(createdApplication.getId()).block();

        assertThat(applicationPostLastEdit.getPages()).hasSize(2);
        assertThat(applicationPostLastEdit.getModifiedBy()).isEqualTo(createdUser.getUsername());
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void
            findByWorkspaceIdAndDefaultApplicationsInRecentlyUsedOrder_noApplicationPresentInWorkspace_emptyListIsReturned() {
        // Create an workspace for this user first.
        Workspace workspace = new Workspace();
        workspace.setName("usertest's workspace");
        workspace = workspaceService.create(workspace).block();

        assert workspace != null;
        Flux<Application> allApplicationsWithinWorkspace =
                applicationService.findByWorkspaceIdAndBaseApplicationsInRecentlyUsedOrder(workspace.getId());

        StepVerifier.create(allApplicationsWithinWorkspace.collectList())
                .assertNext(applications -> {
                    assertThat(applications).isEmpty();
                })
                .verifyComplete();

        // Clean up
        workspaceService.archiveById(workspace.getId()).block();
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void
            findByWorkspaceIdAndDefaultApplicationsInRecentlyUsedOrder_applicationPresentInWorkspace_recentlyUsedAppsPresent_orderedListIsReturned() {
        // Create an workspace for this user first.
        Workspace workspace = new Workspace();
        workspace.setName("usertest's workspace");
        workspace = workspaceService.create(workspace).block();

        assert workspace != null;
        List<String> applicationIds = createDummyApplications(workspace.getId());

        UserData userData = new UserData();
        RecentlyUsedEntityDTO usedEntityDTO = new RecentlyUsedEntityDTO();
        usedEntityDTO.setWorkspaceId(workspace.getId());
        usedEntityDTO.setApplicationIds(applicationIds);
        userData.setRecentlyUsedEntityIds(List.of(usedEntityDTO));
        doReturn(Mono.just(userData)).when(userDataService).getForCurrentUser();

        Flux<Application> allApplicationsWithinWorkspace =
                applicationService.findByWorkspaceIdAndBaseApplicationsInRecentlyUsedOrder(workspace.getId());

        StepVerifier.create(allApplicationsWithinWorkspace.collectList())
                .assertNext(applications -> {
                    assertThat(applications).hasSize(4);

                    List<String> orderedAppIds = new ArrayList<>();
                    applications.forEach(application -> {
                        assertThat(applicationIds).contains(application.getId());
                        orderedAppIds.add(application.getId());
                    });
                    assertThat(orderedAppIds).isEqualTo(applicationIds);
                })
                .verifyComplete();

        // Clean up
        applicationIds.forEach(applicationId ->
                applicationPageService.deleteApplication(applicationId).block());
        workspaceService.archiveById(workspace.getId()).block();
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void
            findByWorkspaceIdAndDefaultApplicationsInRecentlyUsedOrder_applicationPresentInWorkspace_recentlyUsedAppsAbsent_allAppsAreReturned() {
        // Create an workspace for this user first.
        Workspace workspace = new Workspace();
        workspace.setName("usertest's workspace");
        workspace = workspaceService.create(workspace).block();

        assert workspace != null;
        List<String> applicationIds = createDummyApplications(workspace.getId());

        UserData userData = new UserData();
        doReturn(Mono.just(userData)).when(userDataService).getForCurrentUser();

        Flux<Application> allApplicationsWithinWorkspace =
                applicationService.findByWorkspaceIdAndBaseApplicationsInRecentlyUsedOrder(workspace.getId());

        StepVerifier.create(allApplicationsWithinWorkspace.collectList())
                .assertNext(applications -> {
                    assertThat(applications).hasSize(4);

                    List<String> savedApplicationIds = new ArrayList<>();
                    applications.forEach(application -> {
                        assertThat(applicationIds).contains(application.getId());
                        savedApplicationIds.add(application.getId());
                    });
                    assertTrue(savedApplicationIds.containsAll(applicationIds));
                })
                .verifyComplete();

        // Clean up
        applicationIds.forEach(applicationId ->
                applicationPageService.deleteApplication(applicationId).block());
        workspaceService.archiveById(workspace.getId()).block();
    }

    @Test
    public void findByWorkspaceIdAndDefaultApplicationsInRecentlyUsedOrder_invalidWorkspaceId_throwException() {

        String invalidWorkspaceId = UUID.randomUUID().toString();
        Flux<Application> allApplicationsWithinWorkspace =
                applicationService.findByWorkspaceIdAndBaseApplicationsInRecentlyUsedOrder(invalidWorkspaceId);

        StepVerifier.create(allApplicationsWithinWorkspace.collectList())
                .expectErrorSatisfies(throwable -> {
                    assertThat(throwable).isInstanceOf(AppsmithException.class);
                    assertThat(throwable.getMessage())
                            .isEqualTo(AppsmithError.ACL_NO_RESOURCE_FOUND.getMessage(WORKSPACE, invalidWorkspaceId));
                })
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testCacheEviction_whenPagesDeletedInEditModeFollowedByAppPublish_shouldInvalidateCache() {
        // Step 1: Initialize the test application and page identifiers
        Application testApplication = new Application();
        String appName = "ApplicationServiceTest Publish Application Delete Page";
        testApplication.setName(appName);
        AtomicReference<String> basePageId1Ref = new AtomicReference<>();
        AtomicReference<String> basePageId2Ref = new AtomicReference<>();

        // Step 2: Create an application with a page and publish it
        Mono<Application> applicationMono = applicationPageService
                .createApplication(testApplication, workspaceId)
                .flatMap(application -> {
                    // Step 2.1: Create a new page and set default layout
                    PageDTO page = new PageDTO();
                    page.setName("New Page");
                    page.setApplicationId(application.getId());
                    Layout defaultLayout = newPageService.createDefaultLayout();
                    List<Layout> layouts = new ArrayList<>();
                    layouts.add(defaultLayout);
                    page.setLayouts(layouts);

                    // Step 2.2: Create and clone the page, then publish the application
                    return applicationPageService
                            .createPage(page)
                            .flatMap(page1 -> {
                                basePageId1Ref.set(page1.getBaseId());
                                return applicationPageService
                                        .clonePage(page1.getId())
                                        .flatMap(clonedPage -> {
                                            basePageId2Ref.set(clonedPage.getId());
                                            return applicationPageService.publish(page1.getApplicationId(), true);
                                        });
                            })
                            .then(applicationService.findById(application.getId(), MANAGE_APPLICATIONS));
                })
                .cache();

        // Step 3: Fetch the new page and verify its existence
        PageDTO newPage = applicationMono
                .flatMap(application -> newPageService
                        .findByNameAndApplicationIdAndViewMode("New Page", application.getId(), READ_PAGES, false)
                        .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "page"))))
                .block();

        // Step 4: Assert that page IDs are not null
        assertThat(basePageId1Ref.get()).isNotNull();
        assertThat(basePageId2Ref.get()).isNotNull();

        // Step 5: Delete the pages in edit mode
        applicationPageService.deleteUnpublishedPage(basePageId1Ref.get()).block();
        applicationPageService.deleteUnpublishedPage(basePageId2Ref.get()).block();

        // Step 6: Verify basePageId1 is not cached before calling the consolidated API
        String cachedBaseAppId1 = cacheableRepositoryHelper
                .fetchBaseApplicationId(basePageId1Ref.get(), null)
                .block();
        assertThat(cachedBaseAppId1).isNull();

        // Step 7: Call the consolidated API to force cache update
        consolidatedAPIService
                .getConsolidatedInfoForPageLoad(basePageId1Ref.get(), null, null, null, ApplicationMode.PUBLISHED)
                .block();

        // Step 8: Verify basePageId1 is now cached after the consolidated API call
        cachedBaseAppId1 = cacheableRepositoryHelper
                .fetchBaseApplicationId(basePageId1Ref.get(), null)
                .block();
        assertThat(cachedBaseAppId1).isNotNull();

        // Step 9: Verify basePageId2 is not cached before calling the consolidated API
        String cachedBaseAppId2 = cacheableRepositoryHelper
                .fetchBaseApplicationId(basePageId2Ref.get(), null)
                .block();
        assertThat(cachedBaseAppId2).isNull();

        // Step 10: Call the consolidated API to force cache update for basePageId2
        consolidatedAPIService
                .getConsolidatedInfoForPageLoad(basePageId2Ref.get(), null, null, null, ApplicationMode.PUBLISHED)
                .block();

        // Step 11: Verify basePageId2 is now cached after the consolidated API call
        cachedBaseAppId2 = cacheableRepositoryHelper
                .fetchBaseApplicationId(basePageId2Ref.get(), null)
                .block();
        assertThat(cachedBaseAppId2).isNotNull();

        // Step 12: Verify the application pages after deletion and publishing
        ApplicationPage applicationPage = new ApplicationPage();
        applicationPage.setId(newPage.getId());
        applicationPage.setIsDefault(false);
        applicationPage.setDefaultPageId(newPage.getId());

        StepVerifier.create(applicationService.findById(newPage.getApplicationId(), MANAGE_APPLICATIONS))
                .assertNext(editedApplication -> {
                    // Step 12.1: Check the published pages and edited pages
                    List<ApplicationPage> publishedPages = editedApplication.getPublishedPages();
                    assertThat(publishedPages).size().isEqualTo(3);
                    assertThat(publishedPages).containsAnyOf(applicationPage);

                    List<ApplicationPage> editedApplicationPages = editedApplication.getPages();
                    assertThat(editedApplicationPages).hasSize(1);
                    assertThat(editedApplicationPages).doesNotContain(applicationPage);
                })
                .verifyComplete();

        // Step 13: Publish the application again
        applicationPageService.publish(newPage.getApplicationId(), true).block();

        // Step 14: Verify that the cache entries for deleted pages are evicted
        cachedBaseAppId1 = cacheableRepositoryHelper
                .fetchBaseApplicationId(basePageId1Ref.get(), null)
                .block();
        assertThat(cachedBaseAppId1).isNull();

        cachedBaseAppId2 = cacheableRepositoryHelper
                .fetchBaseApplicationId(basePageId2Ref.get(), null)
                .block();
        assertThat(cachedBaseAppId2).isNull();
    }
}
