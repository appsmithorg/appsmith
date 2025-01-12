package com.appsmith.server.fork;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.AuthenticationResponse;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.JSValue;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.models.UploadedFile;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.fork.internal.ApplicationForkingService;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import com.appsmith.server.solutions.WorkspacePermission;
import com.appsmith.server.themes.base.ThemeService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.util.LinkedMultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuple3;
import reactor.util.function.Tuple4;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.constants.FieldName.DEFAULT_PAGE_LAYOUT;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Always run the complete test suite here as TCs have dependency between them. We are controlling this with
 * FixMethodOrder(MethodSorters.NAME_ASCENDING) to run the TCs in a sequence. Running TC in a sequence is a bad
 * practice for unit TCs but here we are actually executing a integration test where we are first inviting user and then
 * forking the application
 */
@Slf4j
@TestMethodOrder(MethodOrderer.MethodName.class)
@SpringBootTest
@DirtiesContext
public class ApplicationForkingServiceTests {

    private static String sourceAppId;
    private static String forkingEnabledAppId;
    private static String sourceWorkspaceId;
    private static String sourceEnvironmentId;
    private static String testUserWorkspaceId;
    private static boolean isSetupDone = false;

    @Autowired
    private ApplicationForkingService applicationForkingService;

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private DatasourceService datasourceService;

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private ApplicationPageService applicationPageService;

    @Autowired
    private NewActionService newActionService;

    @Autowired
    private ActionCollectionService actionCollectionService;

    @Autowired
    private PluginRepository pluginRepository;

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    private LayoutActionService layoutActionService;

    @Autowired
    private UpdateLayoutService updateLayoutService;

    @Autowired
    private NewPageService newPageService;

    @Autowired
    private SessionUserService sessionUserService;

    @Autowired
    private NewPageRepository newPageRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private LayoutCollectionService layoutCollectionService;

    @Autowired
    private ThemeService themeService;

    @Autowired
    private PermissionGroupService permissionGroupService;

    @Autowired
    private UserAndAccessManagementService userAndAccessManagementService;

    @Autowired
    private ImportService importService;

    @Autowired
    private EnvironmentPermission environmentPermission;

    @Autowired
    private PagePermission pagePermission;

    @Autowired
    private WorkspacePermission workspacePermission;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    private Plugin installedPlugin;

    @SneakyThrows
    @BeforeEach
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        installedPlugin = pluginRepository.findByPackageName("installed-plugin").block();

        // Run setup only once
        if (isSetupDone) {
            return;
        }

        Workspace sourceWorkspace = new Workspace();
        sourceWorkspace.setName("Source Workspace");
        sourceWorkspace = workspaceService.create(sourceWorkspace).block();
        sourceWorkspaceId = sourceWorkspace.getId();

        sourceEnvironmentId = workspaceService
                .getDefaultEnvironmentId(sourceWorkspaceId, environmentPermission.getExecutePermission())
                .block();

        Application app1 = new Application();
        app1.setName("1 - public app");
        app1.setWorkspaceId(sourceWorkspaceId);
        sourceAppId = createApplication(app1);

        // Test user does not have access to this application
        Application app2 = new Application();
        app2.setName("2 - public app");
        app2.setForkingEnabled(true);
        app2.setWorkspaceId(sourceWorkspaceId);
        forkingEnabledAppId = createApplication(app2);

        // Invite "usertest@usertest.com" with VIEW access, api_user will be the admin of sourceWorkspace and we are
        // controlling this with @FixMethodOrder(MethodSorters.NAME_ASCENDING) to run the TCs in a sequence.
        // Running TC in a sequence is a bad practice for unit TCs but here we are testing the invite user and then fork
        // application as a part of this flow.
        // We need to test with VIEW user access so that any user should be able to fork template applications
        inviteUserToWorkspaceWithViewAccess(sourceWorkspace);

        isSetupDone = true;
    }

    private void inviteUserToWorkspaceWithViewAccess(Workspace sourceWorkspace) {
        PermissionGroup permissionGroup = permissionGroupService
                .getByDefaultWorkspace(sourceWorkspace, AclPermission.READ_PERMISSION_GROUP_MEMBERS)
                .collectList()
                .block()
                .stream()
                .filter(permissionGroupElem -> permissionGroupElem.getName().startsWith(FieldName.VIEWER))
                .findFirst()
                .get();
        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        ArrayList<String> users = new ArrayList<>();
        users.add("usertest@usertest.com");
        users.add("admin@solutiontest.com");
        inviteUsersDTO.setUsernames(users);
        inviteUsersDTO.setPermissionGroupId(permissionGroup.getId());
        userAndAccessManagementService
                .inviteUsers(inviteUsersDTO, "http://localhost:8080")
                .block();
    }

    private String createApplication(Application app1) throws JsonProcessingException {
        app1 = applicationPageService.createApplication(app1).block();

        PageDTO testPage = newPageService
                .findPageById(app1.getPages().get(0).getId(), READ_PAGES, false)
                .block();

        // Save action
        Datasource datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(app1.getWorkspaceId());
        Plugin installed_plugin =
                pluginRepository.findByPackageName("installed-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        datasource.setDatasourceConfiguration(new DatasourceConfiguration());

        ActionDTO action = new ActionDTO();
        action.setName("forkActionTest");
        action.setPageId(app1.getPages().get(0).getId());
        action.setExecuteOnLoad(true);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        // Save actionCollection
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("testCollection1");
        actionCollectionDTO.setPageId(app1.getPages().get(0).getId());
        actionCollectionDTO.setApplicationId(app1.getId());
        actionCollectionDTO.setWorkspaceId(sourceWorkspaceId);
        actionCollectionDTO.setPluginId(datasource.getPluginId());
        actionCollectionDTO.setVariables(List.of(new JSValue("test", "String", "test", true)));
        actionCollectionDTO.setBody("export default {\n" + "\tgetData: async () => {\n"
                + "\t\tconst data = await forkActionTest.run();\n"
                + "\t\treturn data;\n"
                + "\t}\n"
                + "}");
        ActionDTO action1 = new ActionDTO();
        action1.setName("getData");
        action1.setActionConfiguration(new ActionConfiguration());
        action1.getActionConfiguration()
                .setBody("async () => {\n" + "\t\tconst data = await forkActionTest.run();\n"
                        + "\t\treturn data;\n"
                        + "\t}");
        actionCollectionDTO.setActions(List.of(action1));
        actionCollectionDTO.setPluginType(PluginType.JS);

        layoutCollectionService.createCollection(actionCollectionDTO).block();

        ObjectMapper objectMapper = new ObjectMapper();
        JSONObject parentDsl = new JSONObject(
                objectMapper.readValue(DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {}));
        ArrayList children = (ArrayList) parentDsl.get("children");
        JSONObject testWidget = new JSONObject();
        testWidget.put("widgetName", "firstWidget");
        JSONArray temp = new JSONArray();
        temp.add(new JSONObject(Map.of("key", "testField", "key1", "testField1")));
        testWidget.put("dynamicBindingPathList", temp);
        testWidget.put("testField", "{{ forkActionTest.data }}");
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

        updateLayoutService
                .updateLayout(testPage.getId(), testPage.getApplicationId(), layout.getId(), layout)
                .block();
        return app1.getId();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void test1_cloneWorkspaceWithItsContents() {

        Workspace targetWorkspace = new Workspace();
        targetWorkspace.setName("Target Workspace");

        final Mono<ApplicationImportDTO> resultMono = workspaceService
                .create(targetWorkspace)
                .map(Workspace::getId)
                .flatMap(targetWorkspaceId -> applicationForkingService
                        .forkApplicationToWorkspaceWithEnvironment(sourceAppId, targetWorkspaceId, sourceEnvironmentId)
                        .flatMap(application -> importService.getArtifactImportDTO(
                                application.getWorkspaceId(),
                                application.getId(),
                                application,
                                ArtifactType.APPLICATION)))
                .map(importableArtifactDTO -> (ApplicationImportDTO) importableArtifactDTO);

        StepVerifier.create(resultMono.zipWhen(applicationImportDTO -> Mono.zip(
                        newActionService
                                .findAllByApplicationIdAndViewMode(
                                        applicationImportDTO.getApplication().getId(), false, READ_ACTIONS, null)
                                .collectList(),
                        actionCollectionService
                                .findAllByApplicationIdAndViewMode(
                                        applicationImportDTO.getApplication().getId(), false, READ_ACTIONS, null)
                                .collectList(),
                        newPageService
                                .findNewPagesByApplicationId(
                                        applicationImportDTO.getApplication().getId(), READ_PAGES)
                                .collectList())))
                .assertNext(tuple -> {
                    Application application = tuple.getT1().getApplication();
                    List<NewAction> actionList = tuple.getT2().getT1();
                    List<ActionCollection> actionCollectionList = tuple.getT2().getT2();
                    List<NewPage> pageList = tuple.getT2().getT3();

                    assertThat(application).isNotNull();
                    assertThat(application.getName()).isEqualTo("1 - public app");
                    assertThat(application.getPages().get(0).getDefaultPageId())
                            .isEqualTo(application.getPages().get(0).getId());
                    assertThat(application.getPublishedPages().get(0).getDefaultPageId())
                            .isEqualTo(application.getPublishedPages().get(0).getId());

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
    @WithUserDetails(value = "usertest@usertest.com")
    public void test2_forkApplicationWithReadApplicationUserAccess() {

        Workspace targetWorkspace = new Workspace();
        targetWorkspace.setName("test-user-workspace");

        // Fork application is currently a slow API because it needs to create application, clone all the pages, and
        // then
        // copy all the actions and collections. This process may take time and since some of the test cases in
        // ApplicationForkingServiceTests observed failure in the CI due to timeoutException, to unblock this
        // temporarily,
        // synchronous block() is being used until it is fixed.
        // TODO: Investigate working of applicationForkingService.forkApplicationToWorkspace() further and fix the
        // timeoutException.
        Workspace workspace = workspaceService.create(targetWorkspace).block();
        testUserWorkspaceId = workspace.getId();
        Mono<Application> resultMono = applicationForkingService.forkApplicationToWorkspaceWithEnvironment(
                sourceAppId, testUserWorkspaceId, sourceEnvironmentId);

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains("Forking this application is not permitted at this time."))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void test3_failForkApplicationWithInvalidPermission() {

        final Mono<ApplicationImportDTO> resultMono = applicationForkingService
                .forkApplicationToWorkspaceWithEnvironment(sourceAppId, testUserWorkspaceId, sourceEnvironmentId)
                .flatMap(application -> importService.getArtifactImportDTO(
                        application.getWorkspaceId(), application.getId(), application, ArtifactType.APPLICATION))
                .map(importableArtifactDTO -> (ApplicationImportDTO) importableArtifactDTO);

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(
                                        FieldName.WORKSPACE, testUserWorkspaceId)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void forkingEnabledPublicApp_noPermission_ForkApplicationSuccess() {
        Workspace targetWorkspace = new Workspace();
        targetWorkspace.setName("Target Workspace");
        targetWorkspace = workspaceService.create(targetWorkspace).block();
        final String workspaceId = targetWorkspace.getId();

        Application targetApplication = applicationForkingService
                .forkApplicationToWorkspaceWithEnvironment(forkingEnabledAppId, workspaceId, sourceEnvironmentId)
                .block();
        final Mono<Application> resultMono = Mono.just(targetApplication);

        StepVerifier.create(resultMono)
                .assertNext(application -> {
                    assertThat(application).isNotNull();
                    assertThat(application.getName()).isEqualTo("2 - public app");
                    assertThat(application.getPages()).hasSize(1);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void test4_validForkApplication_cancelledMidWay_createValidApplication() {

        Workspace targetWorkspace = new Workspace();
        targetWorkspace.setName("Target Workspace");
        targetWorkspace = workspaceService.create(targetWorkspace).block();

        // Trigger the fork application flow
        applicationForkingService
                .forkApplicationToWorkspaceWithEnvironment(sourceAppId, targetWorkspace.getId(), sourceEnvironmentId)
                // Increase the timer because feature flags are taking some tiem to be computed.
                .timeout(Duration.ofMillis(50))
                .subscribe();

        // Wait for fork to complete
        Mono<Application> forkedAppFromDbMono = Mono.just(targetWorkspace)
                .flatMap(workspace -> {
                    try {
                        // Before fetching the forked application, sleep for 5 seconds to ensure that the forking
                        // finishes
                        Thread.sleep(5000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    return applicationService
                            .findByWorkspaceId(workspace.getId(), READ_APPLICATIONS)
                            .next();
                })
                .cache();

        StepVerifier.create(forkedAppFromDbMono.zipWhen(application -> Mono.zip(
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

                    assertThat(application).isNotNull();
                    assertThat(application.getName()).isEqualTo("1 - public app");
                    assertThat(application.getPages().get(0).getDefaultPageId())
                            .isEqualTo(application.getPages().get(0).getId());
                    assertThat(application.getPublishedPages().get(0).getDefaultPageId())
                            .isEqualTo(application.getPublishedPages().get(0).getId());

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
    public void test5_failForkApplication_noPageEditPermission() {
        Workspace targetWorkspace = new Workspace();
        targetWorkspace.setName("Target Workspace");
        targetWorkspace = workspaceService.create(targetWorkspace).block();

        Application application = applicationService.findById(sourceAppId).block();
        String appPageId = application.getPages().get(0).getId();
        NewPage appPage = newPageRepository.findById(appPageId).block();
        Set<Policy> existingPolicies = appPage.getPolicies();
        /*
         * We take away all Manage Page permissions for existing page.
         * Now since, no one has the permissions to existing page, the application forking will fail.
         */
        Set<Policy> newPoliciesWithoutEdit = existingPolicies.stream()
                .filter(policy -> !policy.getPermission()
                        .equals(pagePermission.getEditPermission().getValue()))
                .collect(Collectors.toSet());
        appPage.setPolicies(newPoliciesWithoutEdit);
        NewPage updatedGitAppPage = newPageRepository.save(appPage).block();

        final Mono<ApplicationImportDTO> resultMono =
                applicationForkingService.forkApplicationToWorkspace(sourceAppId, targetWorkspace.getId());

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.APPLICATION_NOT_FORKED_MISSING_PERMISSIONS.getMessage(
                                        "page", appPageId)))
                .verify();
        updatedGitAppPage.setPolicies(existingPolicies);
        NewPage setPoliciesBack = newPageRepository.save(updatedGitAppPage).block();

        Mono<List<Application>> applicationsInWorkspace = applicationService
                .findAllApplicationsByWorkspaceId(targetWorkspace.getId())
                .collectList();
        /*
         * Check that no applications have been created in the Target Workspace
         */
        StepVerifier.create(applicationsInWorkspace)
                .assertNext(applications -> assertThat(applications).isEmpty());
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void test6_failForkApplication_noDatasourceCreatePermission() {
        Workspace targetWorkspace = new Workspace();
        targetWorkspace.setName("Target Workspace");
        targetWorkspace = workspaceService.create(targetWorkspace).block();
        final String workspaceId = targetWorkspace.getId();

        Set<Policy> existingPolicies = targetWorkspace.getPolicies();
        /*
         * We take away Workspace Datasource Permission for Target Workspace.
         * Now since, no one has the permissions for Target Workspace, the application forking will fail.
         */
        Set<Policy> newPoliciesWithoutCreateDatasource = existingPolicies.stream()
                .filter(policy -> !policy.getPermission()
                        .equals(workspacePermission
                                .getDatasourceCreatePermission()
                                .getValue()))
                .collect(Collectors.toSet());
        targetWorkspace.setPolicies(newPoliciesWithoutCreateDatasource);
        Workspace updatedargetWorkspace =
                workspaceRepository.save(targetWorkspace).block();

        final Mono<ApplicationImportDTO> resultMono =
                applicationForkingService.forkApplicationToWorkspace(sourceAppId, targetWorkspace.getId());

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.APPLICATION_NOT_FORKED_MISSING_PERMISSIONS.getMessage(
                                        "workspace", workspaceId)))
                .verify();
        targetWorkspace.setPolicies(existingPolicies);
        Workspace setPoliciesBack =
                workspaceRepository.save(updatedargetWorkspace).block();

        Mono<List<Application>> applicationsInWorkspace = applicationService
                .findAllApplicationsByWorkspaceId(targetWorkspace.getId())
                .collectList();
        /*
         * Check that no applications have been created in the Target Workspace
         */
        StepVerifier.create(applicationsInWorkspace)
                .assertNext(applications -> assertThat(applications).isEmpty());
    }

    @Test
    @WithUserDetails("api_user")
    public void forkApplicationToWorkspace_WhenAppHasUnsavedThemeCustomization_ForkedWithCustomizations() {
        // Fork application is currently a slow API because it needs to create application, clone all the pages, and
        // then
        // copy all the actions and collections. This process may take time and since some of the test cases in
        // ApplicationForkingServiceTests observed failure in the CI due to timeoutException, to unblock this
        // temporarily,
        // synchronous block() is being used until it is fixed.
        // TODO: Investigate working of applicationForkingService.forkApplicationToWorkspace() further and fix the
        // timeoutException.
        String uniqueString = UUID.randomUUID().toString();
        Workspace srcWorkspace = new Workspace();
        srcWorkspace.setName("ws_" + uniqueString);
        Workspace createdSrcWorkspace = workspaceService.create(srcWorkspace).block();

        String createdSrcDefaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(createdSrcWorkspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Application srcApplication = new Application();
        srcApplication.setName("app_" + uniqueString);
        Application createdSrcApplication = applicationPageService
                .createApplication(srcApplication, createdSrcWorkspace.getId())
                .block();

        Theme theme = new Theme();
        theme.setDisplayName("theme_" + uniqueString);

        themeService.updateTheme(createdSrcApplication.getId(), theme).block();
        createdSrcApplication =
                applicationService.findById(srcApplication.getId()).block();

        Workspace destWorkspace = new Workspace();
        destWorkspace.setName("ws_dest_" + uniqueString);
        Workspace createdDestWorkspace = workspaceService.create(destWorkspace).block();
        Application forkedApplication = applicationForkingService
                .forkApplicationToWorkspaceWithEnvironment(
                        createdSrcApplication.getId(), createdDestWorkspace.getId(), createdSrcDefaultEnvironmentId)
                .block();

        Theme forkedApplicationEditModeTheme = themeService
                .getApplicationTheme(forkedApplication.getId(), ApplicationMode.EDIT, null)
                .block();
        Theme forkedApplicationPublishedModeTheme = themeService
                .getApplicationTheme(forkedApplication.getId(), ApplicationMode.PUBLISHED, null)
                .block();

        final Mono<Tuple4<Theme, Theme, Application, Application>> tuple4Mono = Mono.zip(
                Mono.just(forkedApplicationEditModeTheme),
                Mono.just(forkedApplicationPublishedModeTheme),
                Mono.just(forkedApplication),
                Mono.just(createdSrcApplication));

        StepVerifier.create(tuple4Mono)
                .assertNext(objects -> {
                    Theme editModeTheme = objects.getT1();
                    Theme publishedModeTheme = objects.getT2();
                    Application forkedApp = objects.getT3();
                    Application srcApp = objects.getT4();

                    assertThat(forkedApp.getEditModeThemeId()).isEqualTo(editModeTheme.getId());
                    assertThat(forkedApp.getPublishedModeThemeId()).isEqualTo(publishedModeTheme.getId());
                    assertThat(forkedApp.getEditModeThemeId()).isNotEqualTo(forkedApp.getPublishedModeThemeId());

                    // published mode should have the custom theme as we publish after forking the app
                    assertThat(publishedModeTheme.isSystemTheme()).isFalse();
                    // published mode theme will have no application id and org id set as the customizations were not
                    // saved
                    assertThat(publishedModeTheme.getWorkspaceId()).isNullOrEmpty();
                    assertThat(publishedModeTheme.getApplicationId()).isNullOrEmpty();

                    // edit mode theme should be a custom one
                    assertThat(editModeTheme.isSystemTheme()).isFalse();
                    // edit mode theme will have no application id and org id set as the customizations were not saved
                    assertThat(editModeTheme.getWorkspaceId()).isNullOrEmpty();
                    assertThat(editModeTheme.getApplicationId()).isNullOrEmpty();

                    // forked theme should have the same name as src theme
                    assertThat(editModeTheme.getDisplayName()).isEqualTo("theme_" + uniqueString);
                    assertThat(publishedModeTheme.getDisplayName()).isEqualTo("theme_" + uniqueString);

                    // forked application should have a new edit mode theme created, should not be same as src app theme
                    assertThat(srcApp.getEditModeThemeId()).isNotEqualTo(forkedApp.getEditModeThemeId());
                    assertThat(srcApp.getPublishedModeThemeId()).isNotEqualTo(forkedApp.getPublishedModeThemeId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void forkApplicationToWorkspace_WhenAppHasSystemTheme_SystemThemeSet() {
        // Fork application is currently a slow API because it needs to create application, clone all the pages, and
        // then
        // copy all the actions and collections. This process may take time and since some of the test cases in
        // ApplicationForkingServiceTests observed failure in the CI due to timeoutException, to unblock this
        // temporarily,
        // synchronous block() is being used until it is fixed.
        // TODO: Investigate working of applicationForkingService.forkApplicationToWorkspace() further and fix the
        // timeoutException.
        String uniqueString = UUID.randomUUID().toString();
        Workspace workspace = new Workspace();
        workspace.setName("ws_" + uniqueString);

        Workspace createdWorkspace = workspaceService.create(workspace).block();

        String createdSrcDefaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(createdWorkspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Application application = new Application();
        application.setName("app_" + uniqueString);
        Application createdSrcApplication = applicationPageService
                .createApplication(application, createdWorkspace.getId())
                .block();

        Workspace destWorkspace = new Workspace();
        destWorkspace.setName("ws_dest_" + uniqueString);
        Workspace createdDestWorkspace = workspaceService.create(destWorkspace).block();

        Application forkedApplication = applicationForkingService
                .forkApplicationToWorkspaceWithEnvironment(
                        createdSrcApplication.getId(), createdDestWorkspace.getId(), createdSrcDefaultEnvironmentId)
                .block();
        Theme forkedApplicationTheme = themeService
                .getApplicationTheme(forkedApplication.getId(), ApplicationMode.EDIT, null)
                .block();

        Mono<Tuple3<Theme, Application, Application>> tuple3Mono = Mono.zip(
                Mono.just(forkedApplicationTheme), Mono.just(forkedApplication), Mono.just(createdSrcApplication));

        StepVerifier.create(tuple3Mono)
                .assertNext(objects -> {
                    Theme editModeTheme = objects.getT1();
                    Application forkedApp = objects.getT2();
                    Application srcApp = objects.getT3();

                    // same theme should be set to edit mode and published mode
                    assertThat(forkedApp.getEditModeThemeId()).isEqualTo(editModeTheme.getId());
                    assertThat(forkedApp.getPublishedModeThemeId()).isEqualTo(editModeTheme.getId());

                    // edit mode theme should be system theme
                    assertThat(editModeTheme.isSystemTheme()).isTrue();
                    // edit mode theme will have no application id and org id set as it's system theme
                    assertThat(editModeTheme.getWorkspaceId()).isNullOrEmpty();
                    assertThat(editModeTheme.getApplicationId()).isNullOrEmpty();

                    // forked theme should be default theme
                    assertThat(editModeTheme.getName()).isEqualToIgnoringCase(Theme.DEFAULT_THEME_NAME);

                    // forked application should have same theme set
                    assertThat(srcApp.getEditModeThemeId()).isEqualTo(forkedApp.getEditModeThemeId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void forkApplicationToWorkspace_WhenAppHasCustomSavedTheme_NewCustomThemeCreated() {
        // Fork application is currently a slow API because it needs to create application, clone all the pages, and
        // then
        // copy all the actions and collections. This process may take time and since some of the test cases in
        // ApplicationForkingServiceTests observed failure in the CI due to timeoutException, to unblock this
        // temporarily,
        // synchronous block() is being used until it is fixed.
        // TODO: Investigate working of applicationForkingService.forkApplicationToWorkspace() further and fix the
        // timeoutException.
        String uniqueString = UUID.randomUUID().toString();
        Workspace workspace = new Workspace();
        workspace.setName("ws_" + uniqueString);
        Workspace createdSrcWorkspace = workspaceService.create(workspace).block();

        String createdSrcDefaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(createdSrcWorkspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Application application = new Application();
        application.setName("app_" + uniqueString);
        Application createdSrcApplication = applicationPageService
                .createApplication(application, createdSrcWorkspace.getId())
                .block();

        Theme theme = new Theme();
        theme.setDisplayName("theme_" + uniqueString);
        themeService.updateTheme(createdSrcApplication.getId(), theme).block();
        themeService
                .persistCurrentTheme(createdSrcApplication.getId(), null, theme)
                .block();
        createdSrcApplication =
                applicationService.findById(createdSrcApplication.getId()).block();

        Workspace destWorkspace = new Workspace();
        destWorkspace.setName("ws_dest_" + uniqueString);
        Workspace createdDestWorkspace = workspaceService.create(destWorkspace).block();

        Application forkedApplication = applicationForkingService
                .forkApplicationToWorkspaceWithEnvironment(
                        createdSrcApplication.getId(), createdDestWorkspace.getId(), createdSrcDefaultEnvironmentId)
                .block();

        Theme forkedApplicationEditModeTheme = themeService
                .getApplicationTheme(forkedApplication.getId(), ApplicationMode.EDIT, null)
                .block();
        Theme forkedApplicationPublishedModeTheme = themeService
                .getApplicationTheme(forkedApplication.getId(), ApplicationMode.PUBLISHED, null)
                .block();

        Mono<Tuple4<Theme, Theme, Application, Application>> tuple4Mono = Mono.zip(
                Mono.just(forkedApplicationEditModeTheme),
                Mono.just(forkedApplicationPublishedModeTheme),
                Mono.just(forkedApplication),
                Mono.just(createdSrcApplication));

        StepVerifier.create(tuple4Mono)
                .assertNext(objects -> {
                    Theme editModeTheme = objects.getT1();
                    Theme publishedModeTheme = objects.getT2();
                    Application forkedApp = objects.getT3();
                    Application srcApp = objects.getT4();

                    assertThat(forkedApp.getEditModeThemeId()).isEqualTo(editModeTheme.getId());
                    assertThat(forkedApp.getPublishedModeThemeId()).isEqualTo(publishedModeTheme.getId());
                    assertThat(forkedApp.getEditModeThemeId()).isNotEqualTo(forkedApp.getPublishedModeThemeId());

                    // published mode should have the custom theme as we publish after forking the app
                    assertThat(publishedModeTheme.isSystemTheme()).isFalse();

                    // published mode theme will have no application id and org id set as it's a copy
                    assertThat(publishedModeTheme.getWorkspaceId()).isNullOrEmpty();
                    assertThat(publishedModeTheme.getApplicationId()).isNullOrEmpty();

                    // edit mode theme should be a custom one
                    assertThat(editModeTheme.isSystemTheme()).isFalse();

                    // edit mode theme will have application id and org id set as the customizations were saved
                    assertThat(editModeTheme.getWorkspaceId()).isNullOrEmpty();
                    assertThat(editModeTheme.getApplicationId()).isNullOrEmpty();

                    // forked theme should have the same name as src theme
                    assertThat(editModeTheme.getDisplayName()).isEqualTo("theme_" + uniqueString);
                    assertThat(publishedModeTheme.getDisplayName()).isEqualTo("theme_" + uniqueString);

                    // forked application should have a new edit mode theme created, should not be same as src app theme
                    assertThat(srcApp.getEditModeThemeId()).isNotEqualTo(forkedApp.getEditModeThemeId());
                    assertThat(srcApp.getPublishedModeThemeId()).isNotEqualTo(forkedApp.getPublishedModeThemeId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void forkApplication_deletePageAfterBeingPublished_deletedPageIsNotCloned() {
        // Fork application is currently a slow API because it needs to create application, clone all the pages, and
        // then
        // copy all the actions and collections. This process may take time and since some of the test cases in
        // ApplicationForkingServiceTests observed failure in the CI due to timeoutException, to unblock this
        // temporarily,
        // synchronous block() is being used until it is fixed.
        // TODO: Investigate working of applicationForkingService.forkApplicationToWorkspace() further and fix the
        // timeoutException.
        Workspace targetWorkspace = new Workspace();
        targetWorkspace.setName("delete-edit-mode-page-target-org");
        targetWorkspace = workspaceService.create(targetWorkspace).block();
        assert targetWorkspace != null;
        final String targetWorkspaceId = targetWorkspace.getId();

        Workspace srcWorkspace = new Workspace();
        srcWorkspace.setName("delete-edit-mode-page-src-org");
        srcWorkspace = workspaceService.create(srcWorkspace).block();

        String srcDefaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(srcWorkspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Application application = new Application();
        application.setName("delete-edit-mode-page-app");
        assert srcWorkspace != null;
        final String originalAppId = Objects.requireNonNull(applicationPageService
                        .createApplication(application, srcWorkspace.getId())
                        .block())
                .getId();
        PageDTO pageDTO = new PageDTO();
        pageDTO.setName("delete-edit-mode-page");
        pageDTO.setApplicationId(originalAppId);
        final String pageId = Objects.requireNonNull(
                        applicationPageService.createPage(pageDTO).block())
                .getId();
        applicationPageService.publish(originalAppId, true).block();
        applicationPageService.deleteUnpublishedPage(pageId).block();
        Application resultApplication = applicationForkingService
                .forkApplicationToWorkspaceWithEnvironment(
                        pageDTO.getApplicationId(), targetWorkspaceId, srcDefaultEnvironmentId)
                .block();
        final Mono<Application> resultMono = Mono.just(resultApplication);

        StepVerifier.create(resultMono.zipWhen(application1 -> newPageService
                        .findNewPagesByApplicationId(application1.getId(), READ_PAGES)
                        .collectList()
                        .zipWith(newPageService
                                .findNewPagesByApplicationId(originalAppId, READ_PAGES)
                                .collectList())))
                .assertNext(tuple -> {
                    Application forkedApplication = tuple.getT1();
                    List<NewPage> forkedPages = tuple.getT2().getT1();
                    List<NewPage> originalPages = tuple.getT2().getT2();

                    assertThat(forkedApplication).isNotNull();
                    assertThat(forkedPages).hasSize(1);
                    assertThat(originalPages).hasSize(2);
                    forkedPages.forEach(newPage ->
                            assertThat(newPage.getUnpublishedPage().getName()).isNotEqualTo(pageDTO.getName()));
                    NewPage deletedPage = originalPages.stream()
                            .filter(newPage -> pageDTO.getName()
                                    .equals(newPage.getUnpublishedPage().getName()))
                            .findAny()
                            .orElse(null);
                    assert deletedPage != null;
                    assertThat(deletedPage.getUnpublishedPage().getName()).isEqualTo(pageDTO.getName());
                })
                .verifyComplete();
    }

    private Flux<ActionDTO> getActionsInWorkspace(Workspace workspace) {
        return applicationService
                .findByWorkspaceId(workspace.getId(), READ_APPLICATIONS)
                // fetch the unpublished pages
                .flatMap(application -> newPageService.findByApplicationId(application.getId(), READ_PAGES, false))
                .flatMap(page -> newActionService.getUnpublishedActionsExceptJs(
                        new LinkedMultiValueMap<>(Map.of(FieldName.PAGE_ID, Collections.singletonList(page.getId())))));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void forkGitConnectedApplication_defaultBranchUpdated_forkDefaultBranchApplication() {
        // Fork application is currently a slow API because it needs to create application, clone all the pages, and
        // then
        // copy all the actions and collections. This process may take time and since some of the test cases in
        // ApplicationForkingServiceTests observed failure in the CI due to timeoutException, to unblock this
        // temporarily,
        // synchronous block() is being used until it is fixed.
        // TODO: Investigate working of applicationForkingService.forkApplicationToWorkspace() further and fix the
        // timeoutException.
        String uniqueString = UUID.randomUUID().toString();
        Workspace workspace = new Workspace();
        workspace.setName("ws_" + uniqueString);
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        String createdSrcDefaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(createdWorkspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Application application = new Application();
        application.setName("app_" + uniqueString);
        Application createdSrcApplication = applicationPageService
                .createApplication(application, createdWorkspace.getId())
                .block();

        Theme theme = new Theme();
        theme.setDisplayName("theme_" + uniqueString);
        GitArtifactMetadata gitArtifactMetadata = new GitArtifactMetadata();
        gitArtifactMetadata.setDefaultApplicationId(createdSrcApplication.getId());
        gitArtifactMetadata.setRefName("master");
        gitArtifactMetadata.setDefaultBranchName("feature1");
        gitArtifactMetadata.setIsRepoPrivate(false);
        gitArtifactMetadata.setRepoName("testRepo");
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitArtifactMetadata.setGitAuth(gitAuth);
        createdSrcApplication.setGitApplicationMetadata(gitArtifactMetadata);

        themeService.updateTheme(createdSrcApplication.getId(), theme).block();
        createdSrcApplication = applicationService.save(createdSrcApplication).block();

        // Create a branch application
        Application branchApp = new Application();
        branchApp.setName("app_" + uniqueString);
        Application createdBranchApplication = applicationPageService
                .createApplication(branchApp, createdSrcApplication.getWorkspaceId())
                .block();

        GitArtifactMetadata gitArtifactMetadata1 = new GitArtifactMetadata();
        gitArtifactMetadata1.setDefaultApplicationId(createdSrcApplication.getId());
        gitArtifactMetadata1.setRefName("feature1");
        gitArtifactMetadata1.setDefaultBranchName("feature1");
        gitArtifactMetadata1.setIsRepoPrivate(false);
        gitArtifactMetadata1.setRepoName("testRepo");
        createdBranchApplication.setGitApplicationMetadata(gitArtifactMetadata1);
        createdBranchApplication =
                applicationService.save(createdBranchApplication).block();

        PageDTO page = new PageDTO();
        page.setName("discard-page-test");
        page.setApplicationId(createdBranchApplication.getId());
        applicationPageService.createPage(page).block();

        Workspace destWorkspace = new Workspace();
        destWorkspace.setName("ws_dest_" + uniqueString);
        Workspace createdDestWorkspace = workspaceService.create(destWorkspace).block();
        Application resultApplication = applicationForkingService
                .forkApplicationToWorkspaceWithEnvironment(
                        createdBranchApplication.getGitApplicationMetadata().getDefaultApplicationId(),
                        createdDestWorkspace.getId(),
                        createdSrcDefaultEnvironmentId)
                .block();

        Mono<Application> applicationMono = Mono.just(resultApplication);

        StepVerifier.create(applicationMono)
                .assertNext(forkedApplication -> {
                    assertThat(forkedApplication.getPages()).hasSize(1);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void forkApplication_WhenContainsInternalFields_InternalFieldsNotForked() {
        Workspace targetWorkspace = new Workspace();
        targetWorkspace.setName("fork-internal-fields-target-org");
        targetWorkspace = workspaceService.create(targetWorkspace).block();
        assert targetWorkspace != null;
        final String targetWorkspaceId = targetWorkspace.getId();

        Workspace srcWorkspace = new Workspace();
        srcWorkspace.setName("fork-internal-fields-src-org");
        srcWorkspace = workspaceService.create(srcWorkspace).block();

        String createdSrcDefaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(srcWorkspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Application application = new Application();
        application.setName("fork-internal-fields-app");
        assert srcWorkspace != null;
        Application srcApp = applicationPageService
                .createApplication(application, srcWorkspace.getId())
                .block();
        srcApp.setForkWithConfiguration(true);
        srcApp.setExportWithConfiguration(true);
        srcApp.setForkingEnabled(true);
        Application resultApplication = applicationForkingService
                .forkApplicationToWorkspaceWithEnvironment(
                        srcApp.getId(), targetWorkspaceId, createdSrcDefaultEnvironmentId)
                .block();
        final Mono<Application> resultMono = Mono.just(resultApplication);

        StepVerifier.create(resultMono)
                .assertNext(forkedApplication -> {
                    assertThat(forkedApplication).isNotNull();
                    assertThat(forkedApplication.getForkWithConfiguration()).isNull();
                    assertThat(forkedApplication.getExportWithConfiguration()).isNull();
                    assertThat(forkedApplication.getForkingEnabled()).isNull();
                })
                .verifyComplete();
    }

    private Mono<Tuple2<Application, String>> forkApplicationSetup(
            Boolean forkWithConfiguration, Boolean connectDatasourceToAction) {
        Workspace targetWorkspace = new Workspace();
        targetWorkspace.setName("target-org");
        targetWorkspace = workspaceService.create(targetWorkspace).block();
        assert targetWorkspace != null;
        final String targetWorkspaceId = targetWorkspace.getId();

        Workspace srcWorkspace = new Workspace();
        srcWorkspace.setName("src-org");
        srcWorkspace = workspaceService.create(srcWorkspace).block();

        String srcDefaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(srcWorkspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Application application = new Application();
        application.setName("app1");
        application.setForkWithConfiguration(forkWithConfiguration);
        assert srcWorkspace != null;
        Application srcApp = applicationPageService
                .createApplication(application, srcWorkspace.getId())
                .block();

        Datasource datasource = new Datasource();
        datasource.setName("test db datasource1");
        datasource.setWorkspaceId(srcApp.getWorkspaceId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Connection connection = new Connection();
        connection.setMode(Connection.Mode.READ_ONLY);
        connection.setType(Connection.Type.REPLICA_SET);
        SSLDetails sslDetails = new SSLDetails();
        sslDetails.setAuthType(SSLDetails.AuthType.CA_CERTIFICATE);
        sslDetails.setKeyFile(new UploadedFile("ssl_key_file_id", ""));
        sslDetails.setCertificateFile(new UploadedFile("ssl_cert_file_id", ""));
        connection.setSsl(sslDetails);
        datasourceConfiguration.setConnection(connection);
        DBAuth auth = new DBAuth();
        auth.setUsername("test");
        auth.setPassword("test");
        datasourceConfiguration.setAuthentication(auth);

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                srcDefaultEnvironmentId,
                new DatasourceStorageDTO(null, srcDefaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Plugin installed_plugin =
                pluginRepository.findByPackageName("installed-plugin").block();
        datasource.setPluginId(installed_plugin.getId());

        Datasource createdDatasource = datasourceService.create(datasource).block();

        if (Boolean.TRUE.equals(connectDatasourceToAction)) {
            ActionDTO action = new ActionDTO();
            action.setName("forkActionTest");
            action.setPageId(srcApp.getPages().get(0).getId());
            action.setExecuteOnLoad(true);
            ActionConfiguration actionConfiguration = new ActionConfiguration();
            actionConfiguration.setHttpMethod(HttpMethod.GET);
            action.setActionConfiguration(actionConfiguration);
            action.setDatasource(createdDatasource);
            layoutActionService.createSingleAction(action, Boolean.FALSE).block();
        }

        return Mono.zip(Mono.just(srcApp), Mono.just(targetWorkspaceId));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void forkApplication_withForkWithConfigurationFalseAndDatasourceUsed_IsPartialImportTrue() {
        Tuple2<Application, String> forkApplicationSetupResponse =
                forkApplicationSetup(false, true).block();
        Application srcApp = forkApplicationSetupResponse.getT1();
        String targetWorkspaceId = forkApplicationSetupResponse.getT2();

        String srcDefaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(srcApp.getWorkspaceId(), environmentPermission.getExecutePermission())
                .block();

        Mono<ApplicationImportDTO> resultMono = applicationForkingService
                .forkApplicationToWorkspaceWithEnvironment(srcApp.getId(), targetWorkspaceId, srcDefaultEnvironmentId)
                .flatMap(application -> importService.getArtifactImportDTO(
                        application.getWorkspaceId(), application.getId(), application, ArtifactType.APPLICATION))
                .map(importableArtifactDTO -> (ApplicationImportDTO) importableArtifactDTO);

        StepVerifier.create(resultMono)
                .assertNext(forkedApplicationImportDTO -> {
                    Application forkedApplication = forkedApplicationImportDTO.getApplication();
                    assertThat(forkedApplication).isNotNull();
                    assertThat(forkedApplicationImportDTO.getIsPartialImport()).isTrue();
                    assertThat(forkedApplication.getForkWithConfiguration()).isNull();
                    assertThat(forkedApplication.getExportWithConfiguration()).isNull();
                    assertThat(forkedApplication.getForkingEnabled()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void forkApplication_withForkWithConfigurationFalseAndDatasourceNotUsed_IsPartialImportFalse() {
        Tuple2<Application, String> forkApplicationSetupResponse =
                forkApplicationSetup(false, false).block();
        Application srcApp = forkApplicationSetupResponse.getT1();
        String targetWorkspaceId = forkApplicationSetupResponse.getT2();

        String srcDefaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(srcApp.getWorkspaceId(), environmentPermission.getExecutePermission())
                .block();

        Mono<ApplicationImportDTO> resultMono = applicationForkingService
                .forkApplicationToWorkspaceWithEnvironment(srcApp.getId(), targetWorkspaceId, srcDefaultEnvironmentId)
                .flatMap(application -> importService.getArtifactImportDTO(
                        application.getWorkspaceId(), application.getId(), application, ArtifactType.APPLICATION))
                .map(importableArtifactDTO -> (ApplicationImportDTO) importableArtifactDTO);

        StepVerifier.create(resultMono)
                .assertNext(forkedApplicationImportDTO -> {
                    Application forkedApplication = forkedApplicationImportDTO.getApplication();
                    assertThat(forkedApplication).isNotNull();
                    assertThat(forkedApplicationImportDTO.getIsPartialImport()).isFalse();
                    assertThat(forkedApplication.getForkWithConfiguration()).isNull();
                    assertThat(forkedApplication.getExportWithConfiguration()).isNull();
                    assertThat(forkedApplication.getForkingEnabled()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void forkApplication_withForkWithConfigurationTrue_IsPartialImportFalse() {
        Tuple2<Application, String> forkApplicationSetupResponse =
                forkApplicationSetup(true, true).block();
        Application srcApp = forkApplicationSetupResponse.getT1();
        String targetWorkspaceId = forkApplicationSetupResponse.getT2();

        String srcDefaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(srcApp.getWorkspaceId(), environmentPermission.getExecutePermission())
                .block();

        Mono<ApplicationImportDTO> resultMono = applicationForkingService
                .forkApplicationToWorkspaceWithEnvironment(srcApp.getId(), targetWorkspaceId, srcDefaultEnvironmentId)
                .flatMap(application -> importService.getArtifactImportDTO(
                        application.getWorkspaceId(), application.getId(), application, ArtifactType.APPLICATION))
                .map(importableArtifactDTO -> (ApplicationImportDTO) importableArtifactDTO);

        StepVerifier.create(resultMono)
                .assertNext(forkedApplicationImportDTO -> {
                    Application forkedApplication = forkedApplicationImportDTO.getApplication();
                    assertThat(forkedApplication).isNotNull();
                    assertThat(forkedApplicationImportDTO.getIsPartialImport()).isFalse();
                    assertThat(forkedApplication.getForkWithConfiguration()).isNull();
                    assertThat(forkedApplication.getExportWithConfiguration()).isNull();
                    assertThat(forkedApplication.getForkingEnabled()).isNull();
                })
                .verifyComplete();
    }

    public Mono<ApplicationForkingServiceTests.WorkspaceData> loadWorkspaceData(Workspace workspace) {
        final ApplicationForkingServiceTests.WorkspaceData data = new ApplicationForkingServiceTests.WorkspaceData();
        data.workspace = workspace;

        return Mono.when(
                        applicationService
                                .findByWorkspaceId(workspace.getId(), READ_APPLICATIONS)
                                .map(data.applications::add),
                        datasourceService
                                .getAllByWorkspaceIdWithStorages(workspace.getId(), READ_DATASOURCES)
                                .map(data.datasources::add),
                        getActionsInWorkspace(workspace).map(data.actions::add),
                        getActionCollectionsInWorkspace(workspace).map(data.actionCollections::add),
                        workspaceService
                                .getDefaultEnvironmentId(
                                        workspace.getId(), environmentPermission.getExecutePermission())
                                .doOnSuccess(signal -> data.defaultEnvironmentId = signal))
                .thenReturn(data);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneApplicationMultipleTimes() {
        Workspace originalWorkspace = new Workspace();
        originalWorkspace.setName("Source Org 1");
        Workspace sourceWorkspace = workspaceService.create(originalWorkspace).block();

        Application app1 = new Application();
        app1.setName("awesome app");
        app1.setWorkspaceId(sourceWorkspace.getId());
        Application sourceApplication =
                applicationPageService.createApplication(app1).block();
        final String appId = sourceApplication.getId();
        final String appName = sourceApplication.getName();

        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Target Org 1");
        Workspace targetWorkspace = workspaceService.create(newWorkspace).block();
        String sourceEnvironmentId = workspaceService
                .getDefaultEnvironmentId(sourceWorkspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Mono<Void> cloneMono = Mono.just(sourceApplication)
                .map(sourceApplication1 -> {
                    sourceApplication1.setName(appName);
                    sourceApplication1.setId(appId);
                    return sourceApplication1;
                })
                .flatMap(sourceApplication1 -> applicationForkingService.forkApplications(
                        targetWorkspace.getId(), sourceApplication1, sourceEnvironmentId))
                .then();
        // Clone this application into the same workspace thrice.
        Mono<List<String>> resultMono = cloneMono
                .then(cloneMono)
                .then(cloneMono)
                .thenMany(applicationRepository.findByWorkspaceId(targetWorkspace.getId()))
                .map(Application::getName)
                .collectList();

        StepVerifier.create(resultMono)
                .assertNext(names -> {
                    assertThat(names).hasSize(3);
                    assertThat(names).containsExactlyInAnyOrder("awesome app", "awesome app (1)", "awesome app (2)");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneApplicationForkWithConfigurationTrueWithActionsThrice() {
        Workspace sourceOrg = new Workspace();
        sourceOrg.setName("Source Org 2");
        Workspace workspace = workspaceService.create(sourceOrg).block();

        Workspace targetOrg = new Workspace();
        targetOrg.setName("Target Org 2");

        final Mono<ApplicationForkingServiceTests.WorkspaceData> resultMono = Mono.zip(
                        workspaceService.getDefaultEnvironmentId(
                                workspace.getId(), environmentPermission.getExecutePermission()),
                        sessionUserService.getCurrentUser())
                .flatMap(tuple -> {
                    String environmentId = tuple.getT1();

                    final Application app1 = new Application();
                    app1.setName("that great app");
                    app1.setForkWithConfiguration(Boolean.TRUE);
                    app1.setWorkspaceId(workspace.getId());
                    app1.setIsPublic(true);

                    final Datasource ds1 = new Datasource();
                    ds1.setName("datasource 1");
                    ds1.setWorkspaceId(workspace.getId());
                    ds1.setPluginId(installedPlugin.getId());
                    DatasourceConfiguration dc = new DatasourceConfiguration();

                    dc.setConnection(new Connection(
                            Connection.Mode.READ_WRITE,
                            Connection.Type.DIRECT,
                            new SSLDetails(
                                    SSLDetails.AuthType.ALLOW,
                                    SSLDetails.CACertificateType.NONE,
                                    new UploadedFile("keyFile", "key file content"),
                                    new UploadedFile("certFile", "cert file content"),
                                    new UploadedFile("caCertFile", "caCert file content"),
                                    new UploadedFile("keyFile", "key file content"),
                                    new UploadedFile("certFile", "cert file content"),
                                    new UploadedFile("caCertFile", "caCert file content")),
                            "default db"));

                    dc.setEndpoints(List.of(new Endpoint("host1", 1L), new Endpoint("host2", 2L)));

                    final DBAuth auth =
                            new DBAuth(DBAuth.Type.USERNAME_PASSWORD, "db username", "db password", "db name");
                    auth.setCustomAuthenticationParameters(Set.of(
                            new Property("custom auth param 1", "custom auth param value 1"),
                            new Property("custom auth param 2", "custom auth param value 2")));
                    auth.setIsAuthorized(true);
                    auth.setAuthenticationResponse(new AuthenticationResponse(
                            "token", "refreshToken", Instant.now(), Instant.now(), null, ""));
                    dc.setAuthentication(auth);
                    HashMap<String, DatasourceStorageDTO> storages1 = new HashMap<>();
                    storages1.put(environmentId, new DatasourceStorageDTO(null, environmentId, dc));
                    ds1.setDatasourceStorages(storages1);

                    final Datasource ds2 = new Datasource();
                    ds2.setName("datasource 2");
                    ds2.setWorkspaceId(workspace.getId());
                    ds2.setPluginId(installedPlugin.getId());
                    DatasourceConfiguration dc2 = new DatasourceConfiguration();
                    dc2.setAuthentication(new OAuth2(
                            OAuth2.Type.CLIENT_CREDENTIALS,
                            true,
                            true,
                            "client id",
                            "client secret",
                            "auth url",
                            "180",
                            "access token url",
                            "scope",
                            Set.of("scope1", "scope2", "scope3"),
                            true,
                            OAuth2.RefreshTokenClientCredentialsLocation.BODY,
                            "header prefix",
                            Set.of(
                                    new Property("custom token param 1", "custom token param value 1"),
                                    new Property("custom token param 2", "custom token param value 2")),
                            null,
                            null,
                            false));

                    HashMap<String, DatasourceStorageDTO> storages2 = new HashMap<>();
                    storages2.put(environmentId, new DatasourceStorageDTO(null, environmentId, dc2));
                    ds2.setDatasourceStorages(storages2);

                    final Datasource ds3 = new Datasource();
                    ds3.setName("datasource 3");
                    ds3.setWorkspaceId(workspace.getId());
                    ds3.setPluginId(installedPlugin.getId());
                    HashMap<String, DatasourceStorageDTO> storages3 = new HashMap<>();
                    storages3.put(environmentId, new DatasourceStorageDTO(null, environmentId, null));
                    ds3.setDatasourceStorages(storages3);

                    return applicationPageService
                            .createApplication(app1)
                            .flatMap(createdApp -> Mono.zip(
                                    Mono.just(createdApp),
                                    newPageRepository
                                            .findByApplicationId(createdApp.getId())
                                            .collectList(),
                                    datasourceService.create(ds1),
                                    datasourceService.create(ds2),
                                    datasourceService.create(ds3)))
                            .flatMap(tuple1 -> {
                                final Application app = tuple1.getT1();
                                final List<NewPage> pages = tuple1.getT2();
                                final Datasource ds1WithId = tuple1.getT3();
                                final Datasource ds2WithId = tuple1.getT4();

                                final NewPage firstPage = pages.get(0);

                                final ActionDTO action1 = new ActionDTO();
                                action1.setName("action1");
                                action1.setPageId(firstPage.getId());
                                action1.setWorkspaceId(workspace.getId());
                                action1.setDatasource(ds1WithId);
                                action1.setPluginId(installedPlugin.getId());

                                final ActionDTO action2 = new ActionDTO();
                                action2.setPageId(firstPage.getId());
                                action2.setName("action2");
                                action2.setWorkspaceId(workspace.getId());
                                action2.setDatasource(ds1WithId);
                                action2.setPluginId(installedPlugin.getId());

                                final ActionDTO action3 = new ActionDTO();
                                action3.setPageId(firstPage.getId());
                                action3.setName("action3");
                                action3.setWorkspaceId(workspace.getId());
                                action3.setDatasource(ds2WithId);
                                action3.setPluginId(installedPlugin.getId());

                                return Mono.when(
                                                layoutActionService.createSingleAction(action1, Boolean.FALSE),
                                                layoutActionService.createSingleAction(action2, Boolean.FALSE),
                                                layoutActionService.createSingleAction(action3, Boolean.FALSE))
                                        .then(Mono.zip(workspaceService.create(targetOrg), Mono.just(app)));
                            })
                            .flatMap(tuple1 -> {
                                final Workspace targetOrg1 = tuple1.getT1();
                                final String originalId = tuple1.getT2().getId();
                                final String originalName = tuple1.getT2().getName();

                                Mono<Void> clonerMono = Mono.just(tuple1.getT2())
                                        .map(app -> {
                                            // We reset these values here because the clone method updates them and that
                                            // just messes with our test.
                                            app.setId(originalId);
                                            app.setName(originalName);
                                            return app;
                                        })
                                        .flatMap(app -> applicationForkingService.forkApplications(
                                                targetOrg1.getId(), app, environmentId))
                                        .then();

                                return clonerMono
                                        .then(clonerMono)
                                        .then(clonerMono)
                                        .thenReturn(targetOrg1);
                            });
                })
                .flatMap(this::loadWorkspaceData)
                .doOnError(error -> log.error("Error in test", error));

        StepVerifier.create(resultMono)
                .assertNext(data -> {
                    assertThat(data.workspace).isNotNull();
                    assertThat(data.workspace.getId()).isNotNull();
                    assertThat(data.workspace.getName()).isEqualTo("Target Org 2");
                    assertThat(data.workspace.getPolicies()).isNotEmpty();

                    assertThat(map(data.applications, Application::getName))
                            .containsExactlyInAnyOrder("that great app", "that great app (1)", "that great app (2)");

                    final Application app1 = data.applications.stream()
                            .filter(app -> app.getName().equals("that great app"))
                            .findFirst()
                            .orElse(null);
                    assert app1 != null;
                    assertThat(app1.getPages().stream()
                                    .filter(ApplicationPage::isDefault)
                                    .count())
                            .isEqualTo(1);

                    final DBAuth a1 = new DBAuth();
                    a1.setUsername("u1");
                    final DBAuth a2 = new DBAuth();
                    a2.setUsername("u1");
                    assertThat(a1).isEqualTo(a2);

                    final OAuth2 o1 = new OAuth2();
                    o1.setClientId("c1");
                    final OAuth2 o2 = new OAuth2();
                    o2.setClientId("c1");
                    assertThat(o1).isEqualTo(o2);
                    assertThat(map(data.datasources, Datasource::getName))
                            .containsExactlyInAnyOrder("datasource 1", "datasource 2");

                    final Datasource ds1 = data.datasources.stream()
                            .filter(ds -> ds.getName().equals("datasource 1"))
                            .findFirst()
                            .get();
                    DatasourceStorageDTO storage1 = ds1.getDatasourceStorages().get(data.defaultEnvironmentId);
                    assertThat(storage1.getDatasourceConfiguration()
                                    .getAuthentication()
                                    .getIsAuthorized())
                            .isNull();

                    final Datasource ds2 = data.datasources.stream()
                            .filter(ds -> ds.getName().equals("datasource 2"))
                            .findFirst()
                            .get();
                    DatasourceStorageDTO storage2 = ds2.getDatasourceStorages().get(data.defaultEnvironmentId);
                    assertThat(storage2.getDatasourceConfiguration()
                                    .getAuthentication()
                                    .getIsAuthorized())
                            .isNull();

                    assertThat(getUnpublishedActionName(data.actions))
                            .containsExactlyInAnyOrder(
                                    "action1", "action2", "action3", "action1", "action2", "action3", "action1",
                                    "action2", "action3");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneApplicationForkWithConfigurationFalseWithActionsThrice() {
        Workspace sourceOrg = new Workspace();
        sourceOrg.setName("Source Org 2");
        Workspace workspace = workspaceService.create(sourceOrg).block();

        Workspace targetOrg = new Workspace();
        targetOrg.setName("Target Org 2");

        final Mono<ApplicationForkingServiceTests.WorkspaceData> resultMono = Mono.zip(
                        workspaceService.getDefaultEnvironmentId(
                                workspace.getId(), environmentPermission.getExecutePermission()),
                        sessionUserService.getCurrentUser())
                .flatMap(tuple -> {
                    String environmentId = tuple.getT1();
                    final Application app1 = new Application();
                    app1.setName("that great app");
                    app1.setForkWithConfiguration(Boolean.FALSE);
                    app1.setWorkspaceId(workspace.getId());
                    app1.setIsPublic(true);

                    final Datasource ds1 = new Datasource();
                    ds1.setName("datasource 1");
                    ds1.setWorkspaceId(workspace.getId());
                    ds1.setPluginId(installedPlugin.getId());
                    DatasourceConfiguration dc = new DatasourceConfiguration();

                    dc.setConnection(new Connection(
                            Connection.Mode.READ_WRITE,
                            Connection.Type.DIRECT,
                            new SSLDetails(
                                    SSLDetails.AuthType.ALLOW,
                                    SSLDetails.CACertificateType.NONE,
                                    new UploadedFile("keyFile", "key file content"),
                                    new UploadedFile("certFile", "cert file content"),
                                    new UploadedFile("caCertFile", "caCert file content"),
                                    new UploadedFile("keyFile", "key file content"),
                                    new UploadedFile("certFile", "cert file content"),
                                    new UploadedFile("caCertFile", "caCert file content")),
                            "default db"));

                    dc.setEndpoints(List.of(new Endpoint("host1", 1L), new Endpoint("host2", 2L)));

                    final DBAuth auth =
                            new DBAuth(DBAuth.Type.USERNAME_PASSWORD, "db username", "db password", "db name");
                    auth.setCustomAuthenticationParameters(Set.of(
                            new Property("custom auth param 1", "custom auth param value 1"),
                            new Property("custom auth param 2", "custom auth param value 2")));
                    auth.setIsAuthorized(true);
                    auth.setAuthenticationResponse(new AuthenticationResponse(
                            "token", "refreshToken", Instant.now(), Instant.now(), null, ""));
                    dc.setAuthentication(auth);
                    HashMap<String, DatasourceStorageDTO> storages1 = new HashMap<>();
                    storages1.put(environmentId, new DatasourceStorageDTO(null, environmentId, dc));
                    ds1.setDatasourceStorages(storages1);

                    final Datasource ds2 = new Datasource();
                    ds2.setName("datasource 2");
                    ds2.setWorkspaceId(workspace.getId());
                    ds2.setPluginId(installedPlugin.getId());
                    DatasourceConfiguration dc2 = new DatasourceConfiguration();
                    dc2.setAuthentication(new OAuth2(
                            OAuth2.Type.CLIENT_CREDENTIALS,
                            true,
                            true,
                            "client id",
                            "client secret",
                            "auth url",
                            "180",
                            "access token url",
                            "scope",
                            Set.of("scope1", "scope2", "scope3"),
                            true,
                            OAuth2.RefreshTokenClientCredentialsLocation.BODY,
                            "header prefix",
                            Set.of(
                                    new Property("custom token param 1", "custom token param value 1"),
                                    new Property("custom token param 2", "custom token param value 2")),
                            null,
                            null,
                            false));
                    HashMap<String, DatasourceStorageDTO> storages2 = new HashMap<>();
                    storages2.put(environmentId, new DatasourceStorageDTO(null, environmentId, dc2));
                    ds2.setDatasourceStorages(storages2);

                    final Datasource ds3 = new Datasource();
                    ds3.setName("datasource 3");
                    ds3.setWorkspaceId(workspace.getId());
                    ds3.setPluginId(installedPlugin.getId());
                    HashMap<String, DatasourceStorageDTO> storages3 = new HashMap<>();
                    storages3.put(environmentId, new DatasourceStorageDTO(null, environmentId, null));
                    ds3.setDatasourceStorages(storages3);

                    return applicationPageService
                            .createApplication(app1)
                            .flatMap(createdApp -> Mono.zip(
                                    Mono.just(createdApp),
                                    newPageRepository
                                            .findByApplicationId(createdApp.getId())
                                            .collectList(),
                                    datasourceService.create(ds1),
                                    datasourceService.create(ds2),
                                    datasourceService.create(ds3)))
                            .flatMap(tuple1 -> {
                                final Application app = tuple1.getT1();
                                final List<NewPage> pages = tuple1.getT2();
                                final Datasource ds1WithId = tuple1.getT3();
                                final Datasource ds2WithId = tuple1.getT4();

                                final NewPage firstPage = pages.get(0);

                                final ActionDTO action1 = new ActionDTO();
                                action1.setName("action1");
                                action1.setPageId(firstPage.getId());
                                action1.setWorkspaceId(workspace.getId());
                                action1.setDatasource(ds1WithId);
                                action1.setPluginId(installedPlugin.getId());

                                final ActionDTO action2 = new ActionDTO();
                                action2.setPageId(firstPage.getId());
                                action2.setName("action2");
                                action2.setWorkspaceId(workspace.getId());
                                action2.setDatasource(ds1WithId);
                                action2.setPluginId(installedPlugin.getId());

                                final ActionDTO action3 = new ActionDTO();
                                action3.setPageId(firstPage.getId());
                                action3.setName("action3");
                                action3.setWorkspaceId(workspace.getId());
                                action3.setDatasource(ds2WithId);
                                action3.setPluginId(installedPlugin.getId());

                                return Mono.when(
                                                layoutActionService.createSingleAction(action1, Boolean.FALSE),
                                                layoutActionService.createSingleAction(action2, Boolean.FALSE),
                                                layoutActionService.createSingleAction(action3, Boolean.FALSE))
                                        .then(Mono.zip(workspaceService.create(targetOrg), Mono.just(app)));
                            })
                            .flatMap(tuple1 -> {
                                final Workspace targetOrg1 = tuple1.getT1();
                                final String originalId = tuple1.getT2().getId();
                                final String originalName = tuple1.getT2().getName();

                                Mono<Void> clonerMono = Mono.just(tuple1.getT2())
                                        .map(app -> {
                                            // We reset these values here because the clone method updates them and that
                                            // just messes with our test.
                                            app.setId(originalId);
                                            app.setName(originalName);
                                            return app;
                                        })
                                        .flatMap(app -> applicationForkingService.forkApplications(
                                                targetOrg1.getId(), app, environmentId))
                                        .then();

                                return clonerMono
                                        .then(clonerMono)
                                        .then(clonerMono)
                                        .thenReturn(targetOrg1);
                            });
                })
                .flatMap(this::loadWorkspaceData)
                .doOnError(error -> log.error("Error in test", error));

        StepVerifier.create(resultMono)
                .assertNext(data -> {
                    assertThat(data.workspace).isNotNull();
                    assertThat(data.workspace.getId()).isNotNull();
                    assertThat(data.workspace.getName()).isEqualTo("Target Org 2");
                    assertThat(data.workspace.getPolicies()).isNotEmpty();

                    assertThat(map(data.applications, Application::getName))
                            .containsExactlyInAnyOrder("that great app", "that great app (1)", "that great app (2)");

                    final Application app1 = data.applications.stream()
                            .filter(app -> app.getName().equals("that great app"))
                            .findFirst()
                            .orElse(null);
                    assert app1 != null;
                    assertThat(app1.getPages().stream()
                                    .filter(ApplicationPage::isDefault)
                                    .count())
                            .isEqualTo(1);

                    final DBAuth a1 = new DBAuth();
                    a1.setUsername("u1");
                    final DBAuth a2 = new DBAuth();
                    a2.setUsername("u1");
                    assertThat(a1).isEqualTo(a2);

                    final OAuth2 o1 = new OAuth2();
                    o1.setClientId("c1");
                    final OAuth2 o2 = new OAuth2();
                    o2.setClientId("c1");
                    assertThat(o1).isEqualTo(o2);

                    assertThat(map(data.datasources, Datasource::getName))
                            .containsExactlyInAnyOrder(
                                    "datasource 1",
                                    "datasource 1 (1)",
                                    "datasource 1 (2)",
                                    "datasource 2",
                                    "datasource 2 (1)",
                                    "datasource 2 (2)");

                    final Datasource ds1 = data.datasources.stream()
                            .filter(ds -> ds.getName().equals("datasource 1"))
                            .findFirst()
                            .get();
                    DatasourceStorageDTO storage1 = ds1.getDatasourceStorages().get(data.defaultEnvironmentId);
                    assertThat(storage1.getDatasourceConfiguration()).isNotNull();
                    assertThat(storage1.getDatasourceConfiguration().getConnection())
                            .isNotNull();
                    assertThat(storage1.getDatasourceConfiguration().getEndpoints())
                            .isNotNull();

                    final Datasource ds2 = data.datasources.stream()
                            .filter(ds -> ds.getName().equals("datasource 2"))
                            .findFirst()
                            .get();
                    DatasourceStorageDTO storage2 = ds2.getDatasourceStorages().get(data.defaultEnvironmentId);
                    assertThat(storage2.getDatasourceConfiguration()).isNotNull();

                    assertThat(getUnpublishedActionName(data.actions))
                            .containsExactlyInAnyOrder(
                                    "action1", "action2", "action3", "action1", "action2", "action3", "action1",
                                    "action2", "action3");
                })
                .verifyComplete();
    }

    private List<String> getUnpublishedActionName(List<ActionDTO> actions) {
        List<String> names = new ArrayList<>();
        for (ActionDTO action : actions) {
            names.add(action.getName());
        }
        return names;
    }

    private <InType, OutType> List<OutType> map(List<InType> list, Function<InType, OutType> fn) {
        return list.stream().map(fn).collect(Collectors.toList());
    }

    private Flux<ActionCollectionDTO> getActionCollectionsInWorkspace(Workspace workspace) {
        return applicationService
                .findByWorkspaceId(workspace.getId(), READ_APPLICATIONS)
                // fetch the unpublished pages
                .flatMap(application -> actionCollectionService.getPopulatedActionCollectionsByViewMode(
                        new LinkedMultiValueMap<>(
                                Map.of(FieldName.APPLICATION_ID, Collections.singletonList(application.getId()))),
                        false));
    }

    private static class WorkspaceData {
        Workspace workspace;
        List<Application> applications = new ArrayList<>();
        List<Datasource> datasources = new ArrayList<>();
        List<ActionDTO> actions = new ArrayList<>();
        List<ActionCollectionDTO> actionCollections = new ArrayList<>();
        String defaultEnvironmentId;
    }
}
