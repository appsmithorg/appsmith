package com.appsmith.server.solutions;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.JSValue;
import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.ThemeService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.apache.commons.lang.StringUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.util.LinkedMultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple3;
import reactor.util.function.Tuple4;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

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
@ExtendWith(SpringExtension.class)
@TestMethodOrder(MethodOrderer.MethodName.class)
@SpringBootTest
@DirtiesContext
public class ApplicationForkingServiceTests {

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
    private SessionUserService sessionUserService;

    @Autowired
    private NewActionService newActionService;

    @Autowired
    private ActionCollectionService actionCollectionService;

    @Autowired
    private PluginRepository pluginRepository;

    @Autowired
    private EncryptionService encryptionService;

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    private LayoutActionService layoutActionService;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private NewPageService newPageService;

    @Autowired
    private UserService userService;

    @Autowired
    private LayoutCollectionService layoutCollectionService;

    @Autowired
    private ThemeService themeService;

    @Autowired
    private PermissionGroupService permissionGroupService;

    @Autowired
    private UserAndAccessManagementService userAndAccessManagementService;

    private static String sourceAppId;

    private static String testUserWorkspaceId;

    private static boolean isSetupDone = false;

    @SneakyThrows
    @BeforeEach
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        // Run setup only once
        if (isSetupDone) {
            return;
        }


        Workspace sourceWorkspace = new Workspace();
        sourceWorkspace.setName("Source Workspace");
        sourceWorkspace = workspaceService.create(sourceWorkspace).block();

        Application app1 = new Application();
        app1.setName("1 - public app");
        app1.setWorkspaceId(sourceWorkspace.getId());
        app1.setForkingEnabled(true);
        app1 = applicationPageService.createApplication(app1).block();
        sourceAppId = app1.getId();

        PageDTO testPage = newPageService.findPageById(app1.getPages().get(0).getId(), READ_PAGES, false).block();

        // Save action
        Datasource datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(app1.getWorkspaceId());
        Plugin installed_plugin = pluginRepository.findByPackageName("installed-plugin").block();
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
        actionCollectionDTO.setApplicationId(sourceAppId);
        actionCollectionDTO.setWorkspaceId(sourceWorkspace.getId());
        actionCollectionDTO.setPluginId(datasource.getPluginId());
        actionCollectionDTO.setVariables(List.of(new JSValue("test", "String", "test", true)));
        actionCollectionDTO.setBody("export default {\n" +
                "\tgetData: async () => {\n" +
                "\t\tconst data = await forkActionTest.run();\n" +
                "\t\treturn data;\n" +
                "\t}\n" +
                "}");
        ActionDTO action1 = new ActionDTO();
        action1.setName("getData");
        action1.setActionConfiguration(new ActionConfiguration());
        action1.getActionConfiguration().setBody(
                "async () => {\n" +
                        "\t\tconst data = await forkActionTest.run();\n" +
                        "\t\treturn data;\n" +
                        "\t}");
        actionCollectionDTO.setActions(List.of(action1));
        actionCollectionDTO.setPluginType(PluginType.JS);

        layoutCollectionService.createCollection(actionCollectionDTO).block();

        ObjectMapper objectMapper = new ObjectMapper();
        JSONObject parentDsl = new JSONObject(objectMapper.readValue(DEFAULT_PAGE_LAYOUT, new TypeReference<HashMap<String, Object>>() {
        }));
        ArrayList children = (ArrayList) parentDsl.get("children");
        JSONObject testWidget = new JSONObject();
        testWidget.put("widgetName", "firstWidget");
        JSONArray temp = new JSONArray();
        temp.addAll(List.of(new JSONObject(Map.of("key", "testField", "key1", "testField1"))));
        testWidget.put("dynamicBindingPathList", temp);
        testWidget.put("testField", "{{ forkActionTest.data }}");
        children.add(testWidget);

        JSONObject secondWidget = new JSONObject();
        secondWidget.put("widgetName", "secondWidget");
        temp = new JSONArray();
        temp.addAll(List.of(new JSONObject(Map.of("key", "testField1"))));
        secondWidget.put("dynamicBindingPathList", temp);
        secondWidget.put("testField1", "{{ testCollection1.getData.data }}");
        children.add(secondWidget);

        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(parentDsl);

        layoutActionService.updateLayout(testPage.getId(), testPage.getApplicationId(), layout.getId(), layout).block();
        // Invite "usertest@usertest.com" with VIEW access, api_user will be the admin of sourceWorkspace and we are
        // controlling this with @FixMethodOrder(MethodSorters.NAME_ASCENDING) to run the TCs in a sequence.
        // Running TC in a sequence is a bad practice for unit TCs but here we are testing the invite user and then fork
        // application as a part of this flow.
        // We need to test with VIEW user access so that any user should be able to fork template applications
        PermissionGroup permissionGroup = permissionGroupService.getByDefaultWorkspace(sourceWorkspace, AclPermission.READ_PERMISSION_GROUP_MEMBERS)
                .collectList().block()
                .stream()
                .filter(permissionGroupElem -> permissionGroupElem.getName().startsWith(FieldName.VIEWER))
                .findFirst().get();
        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        ArrayList<String> users = new ArrayList<>();
        users.add("usertest@usertest.com");
        inviteUsersDTO.setUsernames(users);
        inviteUsersDTO.setPermissionGroupId(permissionGroup.getId());
        userAndAccessManagementService.inviteUsers(inviteUsersDTO, "http://localhost:8080").block();

        isSetupDone = true;
    }

    private static class WorkspaceData {
        Workspace workspace;
        List<Application> applications = new ArrayList<>();
        List<Datasource> datasources = new ArrayList<>();
        List<ActionDTO> actions = new ArrayList<>();
    }

    public Mono<WorkspaceData> loadWorkspaceData(Workspace workspace) {
        final WorkspaceData data = new WorkspaceData();
        data.workspace = workspace;

        return Mono
                .when(
                        applicationService
                                .findByWorkspaceId(workspace.getId(), READ_APPLICATIONS)
                                .map(data.applications::add),
                        datasourceService
                                .findAllByWorkspaceId(workspace.getId(), READ_DATASOURCES)
                                .map(data.datasources::add),
                        getActionsInWorkspace(workspace)
                                .map(data.actions::add)
                )
                .thenReturn(data);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void test1_cloneWorkspaceWithItsContents() {

        Workspace targetWorkspace = new Workspace();
        targetWorkspace.setName("Target Workspace");

        final Mono<Application> resultMono = workspaceService.create(targetWorkspace)
                .map(Workspace::getId)
                .flatMap(targetWorkspaceId ->
                        applicationForkingService.forkApplicationToWorkspace(sourceAppId, targetWorkspaceId)
                );

        StepVerifier.create(resultMono
                        .zipWhen(application -> Mono.zip(
                                newActionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                                actionCollectionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                                newPageService.findNewPagesByApplicationId(application.getId(), READ_PAGES).collectList()
                        )))
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
                        assertThat(newPage.getDefaultResources()).isNotNull();
                        assertThat(newPage.getDefaultResources().getPageId()).isEqualTo(newPage.getId());
                        assertThat(newPage.getDefaultResources().getApplicationId()).isEqualTo(application.getId());

                        newPage.getUnpublishedPage()
                                .getLayouts()
                                .forEach(layout -> {
                                            assertThat(layout.getLayoutOnLoadActions()).hasSize(2);
                                            layout.getLayoutOnLoadActions().forEach(dslActionDTOS -> {
                                                assertThat(dslActionDTOS).hasSize(1);
                                                dslActionDTOS.forEach(actionDTO -> {
                                                    assertThat(actionDTO.getId()).isEqualTo(actionDTO.getDefaultActionId());
                                                    if (!StringUtils.isEmpty(actionDTO.getCollectionId())) {
                                                        assertThat(actionDTO.getCollectionId()).isEqualTo(actionDTO.getDefaultCollectionId());
                                                    }
                                                });
                                            });
                                        }
                                );
                    });

                    assertThat(actionList).hasSize(2);
                    actionList.forEach(newAction -> {
                        assertThat(newAction.getDefaultResources()).isNotNull();
                        assertThat(newAction.getDefaultResources().getActionId()).isEqualTo(newAction.getId());
                        assertThat(newAction.getDefaultResources().getApplicationId()).isEqualTo(application.getId());

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
    @WithUserDetails(value = "usertest@usertest.com")
    public void test2_forkApplicationWithReadApplicationUserAccess() {

        Workspace targetWorkspace = new Workspace();
        targetWorkspace.setName("test-user-workspace");

        // Fork application is currently a slow API because it needs to create application, clone all the pages, and then
        // copy all the actions and collections. This process may take time and since some of the test cases in
        // ApplicationForkingServiceTests observed failure in the CI due to timeoutException, to unblock this temporarily,
        // synchronous block() is being used until it is fixed.
        // TODO: Investigate working of applicationForkingService.forkApplicationToWorkspace() further and fix the timeoutException.
        Workspace workspace = workspaceService.create(targetWorkspace).block();
        testUserWorkspaceId = workspace.getId();
        Application targetApplication = applicationForkingService.forkApplicationToWorkspace(sourceAppId, testUserWorkspaceId).block();
        final Mono<Application> resultMono = Mono.just(targetApplication);

        StepVerifier.create(resultMono)
                .assertNext(application -> {
                    assertThat(application).isNotNull();
                    assertThat(application.getName()).isEqualTo("1 - public app");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void test3_failForkApplicationWithInvalidPermission() {

        final Mono<Application> resultMono = applicationForkingService.forkApplicationToWorkspace(sourceAppId, testUserWorkspaceId);

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.WORKSPACE, testUserWorkspaceId)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void test4_validForkApplication_cancelledMidWay_createValidApplication() {

        Workspace targetWorkspace = new Workspace();
        targetWorkspace.setName("Target Workspace");
        targetWorkspace = workspaceService.create(targetWorkspace).block();

        // Trigger the fork application flow
        applicationForkingService.forkApplicationToWorkspace(sourceAppId, targetWorkspace.getId())
                .timeout(Duration.ofMillis(10))
                .subscribe();

        // Wait for fork to complete
        Mono<Application> forkedAppFromDbMono = Mono.just(targetWorkspace)
                .flatMap(workspace -> {
                    try {
                        // Before fetching the forked application, sleep for 5 seconds to ensure that the forking finishes
                        Thread.sleep(5000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    return applicationService.findByWorkspaceId(workspace.getId(), READ_APPLICATIONS).next();
                })
                .cache();

        StepVerifier
                .create(forkedAppFromDbMono.zipWhen(application ->
                        Mono.zip(
                                newActionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                                actionCollectionService.findAllByApplicationIdAndViewMode(application.getId(), false, READ_ACTIONS, null).collectList(),
                                newPageService.findNewPagesByApplicationId(application.getId(), READ_PAGES).collectList()))
                )
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
                        assertThat(newPage.getDefaultResources()).isNotNull();
                        assertThat(newPage.getDefaultResources().getPageId()).isEqualTo(newPage.getId());
                        assertThat(newPage.getDefaultResources().getApplicationId()).isEqualTo(application.getId());

                        newPage.getUnpublishedPage()
                                .getLayouts()
                                .forEach(layout ->
                                        layout.getLayoutOnLoadActions().forEach(dslActionDTOS -> {
                                            dslActionDTOS.forEach(actionDTO -> {
                                                assertThat(actionDTO.getId()).isEqualTo(actionDTO.getDefaultActionId());
                                            });
                                        })
                                );
                    });

                    assertThat(actionList).hasSize(2);
                    actionList.forEach(newAction -> {
                        assertThat(newAction.getDefaultResources()).isNotNull();
                        assertThat(newAction.getDefaultResources().getActionId()).isEqualTo(newAction.getId());
                        assertThat(newAction.getDefaultResources().getApplicationId()).isEqualTo(application.getId());

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
    @WithUserDetails("api_user")
    public void forkApplicationToWorkspace_WhenAppHasUnsavedThemeCustomization_ForkedWithCustomizations() {
        // Fork application is currently a slow API because it needs to create application, clone all the pages, and then
        // copy all the actions and collections. This process may take time and since some of the test cases in
        // ApplicationForkingServiceTests observed failure in the CI due to timeoutException, to unblock this temporarily,
        // synchronous block() is being used until it is fixed.
        // TODO: Investigate working of applicationForkingService.forkApplicationToWorkspace() further and fix the timeoutException.
        String uniqueString = UUID.randomUUID().toString();
        Workspace srcWorkspace = new Workspace();
        srcWorkspace.setName("ws_" + uniqueString);
        Workspace createdSrcWorkspace = workspaceService.create(srcWorkspace).block();

        Application srcApplication = new Application();
        srcApplication.setName("app_" + uniqueString);
        Application createdSrcApplication = applicationPageService.createApplication(srcApplication, createdSrcWorkspace.getId()).block();

        Theme theme = new Theme();
        theme.setDisplayName("theme_" + uniqueString);

        themeService.updateTheme(createdSrcApplication.getId(), null, theme).block();
        createdSrcApplication = applicationService.findById(srcApplication.getId()).block();

        Workspace destWorkspace = new Workspace();
        destWorkspace.setName("ws_dest_" + uniqueString);
        Workspace createdDestWorkspace = workspaceService.create(destWorkspace).block();
        Application forkedApplication = applicationForkingService.forkApplicationToWorkspace(createdSrcApplication.getId(), createdDestWorkspace.getId()).block();

        Theme forkedApplicationEditModeTheme = themeService.getApplicationTheme(forkedApplication.getId(), ApplicationMode.EDIT, null).block();
        Theme forkedApplicationPublishedModeTheme = themeService.getApplicationTheme(forkedApplication.getId(), ApplicationMode.PUBLISHED, null).block();

        final Mono<Tuple4<Theme, Theme, Application, Application>> tuple4Mono = Mono.zip(Mono.just(forkedApplicationEditModeTheme), Mono.just(forkedApplicationPublishedModeTheme), Mono.just(forkedApplication), Mono.just(createdSrcApplication));

        StepVerifier.create(tuple4Mono).assertNext(objects -> {
            Theme editModeTheme = objects.getT1();
            Theme publishedModeTheme = objects.getT2();
            Application forkedApp = objects.getT3();
            Application srcApp = objects.getT4();

            assertThat(forkedApp.getEditModeThemeId()).isEqualTo(editModeTheme.getId());
            assertThat(forkedApp.getPublishedModeThemeId()).isEqualTo(publishedModeTheme.getId());
            assertThat(forkedApp.getEditModeThemeId()).isNotEqualTo(forkedApp.getPublishedModeThemeId());

            // published mode should have the custom theme as we publish after forking the app
            assertThat(publishedModeTheme.isSystemTheme()).isFalse();
            // published mode theme will have no application id and org id set as the customizations were not saved
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
        }).verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void forkApplicationToWorkspace_WhenAppHasSystemTheme_SystemThemeSet() {
        // Fork application is currently a slow API because it needs to create application, clone all the pages, and then
        // copy all the actions and collections. This process may take time and since some of the test cases in
        // ApplicationForkingServiceTests observed failure in the CI due to timeoutException, to unblock this temporarily,
        // synchronous block() is being used until it is fixed.
        // TODO: Investigate working of applicationForkingService.forkApplicationToWorkspace() further and fix the timeoutException.
        String uniqueString = UUID.randomUUID().toString();
        Workspace workspace = new Workspace();
        workspace.setName("ws_" + uniqueString);

        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("app_" + uniqueString);
        Application createdSrcApplication = applicationPageService.createApplication(application, createdWorkspace.getId()).block();

        Workspace destWorkspace = new Workspace();
        destWorkspace.setName("ws_dest_" + uniqueString);
        Workspace createdDestWorkspace = workspaceService.create(destWorkspace).block();

        Application forkedApplication = applicationForkingService.forkApplicationToWorkspace(createdSrcApplication.getId(), createdDestWorkspace.getId()).block();
        Theme forkedApplicationTheme = themeService.getApplicationTheme(forkedApplication.getId(), ApplicationMode.EDIT, null).block();

        Mono<Tuple3<Theme, Application, Application>> tuple3Mono = Mono.zip(Mono.just(forkedApplicationTheme), Mono.just(forkedApplication), Mono.just(createdSrcApplication));

        StepVerifier.create(tuple3Mono).assertNext(objects -> {
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
        }).verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void forkApplicationToWorkspace_WhenAppHasCustomSavedTheme_NewCustomThemeCreated() {
        // Fork application is currently a slow API because it needs to create application, clone all the pages, and then
        // copy all the actions and collections. This process may take time and since some of the test cases in
        // ApplicationForkingServiceTests observed failure in the CI due to timeoutException, to unblock this temporarily,
        // synchronous block() is being used until it is fixed.
        // TODO: Investigate working of applicationForkingService.forkApplicationToWorkspace() further and fix the timeoutException.
        String uniqueString = UUID.randomUUID().toString();
        Workspace workspace = new Workspace();
        workspace.setName("ws_" + uniqueString);
        Workspace createdSrcWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("app_" + uniqueString);
        Application createdSrcApplication = applicationPageService.createApplication(application, createdSrcWorkspace.getId()).block();

        Theme theme = new Theme();
        theme.setDisplayName("theme_" + uniqueString);
        themeService.updateTheme(createdSrcApplication.getId(), null, theme).block();
        themeService.persistCurrentTheme(createdSrcApplication.getId(), null, theme).block();
        createdSrcApplication = applicationService.findById(createdSrcApplication.getId()).block();

        Workspace destWorkspace = new Workspace();
        destWorkspace.setName("ws_dest_" + uniqueString);
        Workspace createdDestWorkspace = workspaceService.create(destWorkspace).block();

        Application forkedApplication = applicationForkingService.forkApplicationToWorkspace(createdSrcApplication.getId(), createdDestWorkspace.getId()).block();

        Theme forkedApplicationEditModeTheme = themeService.getApplicationTheme(forkedApplication.getId(), ApplicationMode.EDIT, null).block();
        Theme forkedApplicationPublishedModeTheme = themeService.getApplicationTheme(forkedApplication.getId(), ApplicationMode.PUBLISHED, null).block();

        Mono<Tuple4<Theme, Theme, Application, Application>> tuple4Mono = Mono.zip(Mono.just(forkedApplicationEditModeTheme), Mono.just(forkedApplicationPublishedModeTheme), Mono.just(forkedApplication), Mono.just(createdSrcApplication));

        StepVerifier.create(tuple4Mono).assertNext(objects -> {
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
        }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void forkApplication_deletePageAfterBeingPublished_deletedPageIsNotCloned() {
        // Fork application is currently a slow API because it needs to create application, clone all the pages, and then
        // copy all the actions and collections. This process may take time and since some of the test cases in
        // ApplicationForkingServiceTests observed failure in the CI due to timeoutException, to unblock this temporarily,
        // synchronous block() is being used until it is fixed.
        // TODO: Investigate working of applicationForkingService.forkApplicationToWorkspace() further and fix the timeoutException.
        Workspace targetWorkspace = new Workspace();
        targetWorkspace.setName("delete-edit-mode-page-target-org");
        targetWorkspace = workspaceService.create(targetWorkspace).block();
        assert targetWorkspace != null;
        final String targetWorkspaceId = targetWorkspace.getId();

        Workspace srcWorkspace = new Workspace();
        srcWorkspace.setName("delete-edit-mode-page-src-org");
        srcWorkspace = workspaceService.create(srcWorkspace).block();

        Application application = new Application();
        application.setName("delete-edit-mode-page-app");
        assert srcWorkspace != null;
        final String originalAppId = Objects.requireNonNull(applicationPageService.createApplication(application, srcWorkspace.getId()).block()).getId();
        PageDTO pageDTO = new PageDTO();
        pageDTO.setName("delete-edit-mode-page");
        pageDTO.setApplicationId(originalAppId);
        final String pageId = Objects.requireNonNull(applicationPageService.createPage(pageDTO).block()).getId();
        applicationPageService.publish(originalAppId, true).block();
        applicationPageService.deleteUnpublishedPage(pageId).block();
        Application resultApplication = applicationForkingService.forkApplicationToWorkspace(pageDTO.getApplicationId(), targetWorkspaceId).block();
        final Mono<Application> resultMono = Mono.just(resultApplication);

        StepVerifier.create(resultMono
                        .zipWhen(application1 -> newPageService.findNewPagesByApplicationId(application1.getId(), READ_PAGES).collectList()
                                .zipWith(newPageService.findNewPagesByApplicationId(originalAppId, READ_PAGES).collectList())))
                .assertNext(tuple -> {
                    Application forkedApplication = tuple.getT1();
                    List<NewPage> forkedPages = tuple.getT2().getT1();
                    List<NewPage> originalPages = tuple.getT2().getT2();

                    assertThat(forkedApplication).isNotNull();
                    assertThat(forkedPages).hasSize(1);
                    assertThat(originalPages).hasSize(2);
                    forkedPages.forEach(newPage -> assertThat(newPage.getUnpublishedPage().getName()).isNotEqualTo(pageDTO.getName()));
                    NewPage deletedPage = originalPages.stream()
                            .filter(newPage -> pageDTO.getName().equals(newPage.getUnpublishedPage().getName()))
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
                .flatMap(page -> newActionService.getUnpublishedActionsExceptJs(new LinkedMultiValueMap<>(
                        Map.of(FieldName.PAGE_ID, Collections.singletonList(page.getId())))));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void forkGitConnectedApplication_defaultBranchUpdated_forkDefaultBranchApplication() {
        // Fork application is currently a slow API because it needs to create application, clone all the pages, and then
        // copy all the actions and collections. This process may take time and since some of the test cases in
        // ApplicationForkingServiceTests observed failure in the CI due to timeoutException, to unblock this temporarily,
        // synchronous block() is being used until it is fixed.
        // TODO: Investigate working of applicationForkingService.forkApplicationToWorkspace() further and fix the timeoutException.
        String uniqueString = UUID.randomUUID().toString();
        Workspace workspace = new Workspace();
        workspace.setName("ws_" + uniqueString);
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("app_" + uniqueString);
        Application createdSrcApplication = applicationPageService.createApplication(application, createdWorkspace.getId()).block();

        Theme theme = new Theme();
        theme.setDisplayName("theme_" + uniqueString);
        GitApplicationMetadata gitApplicationMetadata = new GitApplicationMetadata();
        gitApplicationMetadata.setDefaultApplicationId(createdSrcApplication.getId());
        gitApplicationMetadata.setBranchName("master");
        gitApplicationMetadata.setDefaultBranchName("feature1");
        gitApplicationMetadata.setIsRepoPrivate(false);
        gitApplicationMetadata.setRepoName("testRepo");
        GitAuth gitAuth = new GitAuth();
        gitAuth.setPublicKey("testkey");
        gitAuth.setPrivateKey("privatekey");
        gitApplicationMetadata.setGitAuth(gitAuth);
        createdSrcApplication.setGitApplicationMetadata(gitApplicationMetadata);

        themeService.updateTheme(createdSrcApplication.getId(), null, theme).block();
        createdSrcApplication = applicationService.save(createdSrcApplication).block();

        // Create a branch application
        Application branchApp = new Application();
        branchApp.setName("app_" + uniqueString);
        Application createdBranchApplication = applicationPageService.createApplication(branchApp, createdSrcApplication.getWorkspaceId()).block();

        GitApplicationMetadata gitApplicationMetadata1 = new GitApplicationMetadata();
        gitApplicationMetadata1.setDefaultApplicationId(createdSrcApplication.getId());
        gitApplicationMetadata1.setBranchName("feature1");
        gitApplicationMetadata1.setDefaultBranchName("feature1");
        gitApplicationMetadata1.setIsRepoPrivate(false);
        gitApplicationMetadata1.setRepoName("testRepo");
        createdBranchApplication.setGitApplicationMetadata(gitApplicationMetadata1);
        createdBranchApplication = applicationService.save(createdBranchApplication).block();

        PageDTO page = new PageDTO();
        page.setName("discard-page-test");
        page.setApplicationId(createdBranchApplication.getId());
        applicationPageService.createPage(page).block();

        Workspace destWorkspace = new Workspace();
        destWorkspace.setName("ws_dest_" + uniqueString);
        Workspace createdDestWorkspace = workspaceService.create(destWorkspace).block();
        Application resultApplication = applicationForkingService.forkApplicationToWorkspace(createdBranchApplication.getGitApplicationMetadata().getDefaultApplicationId(), createdDestWorkspace.getId()).block();

        Mono<Application> applicationMono = Mono.just(resultApplication);

        StepVerifier
                .create(applicationMono)
                .assertNext(forkedApplication -> {
                    assertThat(forkedApplication.getPages().size()).isEqualTo(1);
                }).verifyComplete();
    }
}
