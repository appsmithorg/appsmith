package com.appsmith.server.solutions.roles;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.ThemeService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.roles.constants.PermissionViewableName;
import com.appsmith.server.solutions.roles.constants.RoleTab;
import com.appsmith.server.solutions.roles.dtos.ActionResourceDTO;
import com.appsmith.server.solutions.roles.dtos.BaseView;
import com.appsmith.server.solutions.roles.dtos.DatasourceResourceDTO;
import com.appsmith.server.solutions.roles.dtos.EntityView;
import com.appsmith.server.solutions.roles.dtos.IdPermissionDTO;
import com.appsmith.server.solutions.roles.dtos.RoleTabDTO;
import com.appsmith.server.solutions.roles.dtos.RoleViewDTO;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleConfigDTO;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleEntityDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_THEMES;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_THEMES;
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
import static com.appsmith.server.constants.FieldName.ADMINISTRATOR;
import static com.appsmith.server.constants.FieldName.DEVELOPER;
import static com.appsmith.server.constants.FieldName.TENANT_GROUP;
import static com.appsmith.server.constants.FieldName.TENANT_ROLE;
import static com.appsmith.server.constants.FieldName.VIEWER;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ExtendWith(SpringExtension.class)
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class WorkspaceResourcesTest {

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserUtils userUtils;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    TenantResources tenantResources;

    @Autowired
    WorkspaceResources workspaceResources;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    PluginService pluginService;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    RoleConfigurationSolution roleConfigurationSolution;

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    PermissionGroupService permissionGroupService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    LayoutCollectionService layoutCollectionService;

    @Autowired
    TenantService tenantService;

    @Autowired
    ThemeService themeService;

    @Autowired
    ApplicationRepository applicationRepository;

    @Autowired
    ThemeRepository themeRepository;

    @Autowired
    NewActionRepository newActionRepository;

    User api_user = null;

    String superAdminPermissionGroupId = null;

    Workspace createdWorkspace;
    Application createdApplication;
    Datasource createdDatasource;
    ActionDTO createdActionDto;
    Plugin restApiPlugin;

    @BeforeEach
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        if (api_user == null) {
            api_user = userRepository.findByEmail("api_user").block();
        }

        // Make api_user instance administrator before starting the test
        userUtils.makeSuperUser(List.of(api_user)).block();

        // Create a workspace, application, page, datasource and action for this test file.
        Workspace workspace = new Workspace();
        String name = UUID.randomUUID().toString();
        workspace.setName(name);
        createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName(UUID.randomUUID().toString());
        createdApplication = applicationPageService.createApplication(application, workspace.getId()).block();

        Application applicationWithoutActions = new Application();
        applicationWithoutActions.setName(UUID.randomUUID().toString());
        Application createdApplicationWithoutActions = applicationPageService.createApplication(applicationWithoutActions, workspace.getId()).block();

        Application applicationWithoutPages = new Application();
        applicationWithoutPages.setName(UUID.randomUUID().toString());
        Application createdApplicationWithoutPages = applicationPageService.createApplication(applicationWithoutPages, workspace.getId()).block();

        Datasource toCreate = new Datasource();
        toCreate.setName("Default Database");
        toCreate.setWorkspaceId(createdWorkspace.getId());
        restApiPlugin = pluginService.findByPackageName("restapi-plugin").block();
        toCreate.setPluginId(restApiPlugin.getId());
        createdDatasource = datasourceService.create(toCreate).block();

        PageDTO pageDTOWithoutActions1 = new PageDTO();
        pageDTOWithoutActions1.setName("Without Any Actions");
        pageDTOWithoutActions1.setApplicationId(createdApplication.getId());
        PageDTO createdPageDTOWithoutActions1 = applicationPageService.createPage(pageDTOWithoutActions1).block();

        PageDTO pageDTOWithoutActions2 = new PageDTO();
        pageDTOWithoutActions2.setName("Without Any Actions");
        pageDTOWithoutActions2.setApplicationId(createdApplicationWithoutActions.getId());
        PageDTO createdPageDTOWithoutActions2 = applicationPageService.createPage(pageDTOWithoutActions2).block();

        ActionDTO actionToCreate = new ActionDTO();
        actionToCreate.setName("validAction");
        actionToCreate.setPageId(createdApplication.getPages().get(0).getId());
        actionToCreate.setExecuteOnLoad(true);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionToCreate.setActionConfiguration(actionConfiguration);
        actionToCreate.setDatasource(createdDatasource);
        actionToCreate.setPluginId(restApiPlugin.getId());

        createdActionDto = layoutActionService.createAction(actionToCreate).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGetDataFromRepositoryForAllTabs() {
        // Make api_user instance administrator before starting the test
        userUtils.makeSuperUser(List.of(api_user)).block();

        CommonAppsmithObjectData dataFromRepositoryForAllTabs = workspaceResources.getDataFromRepositoryForAllTabs();
        Flux<Workspace> workspaceFlux = dataFromRepositoryForAllTabs.getWorkspaceFlux();
        StepVerifier.create(workspaceFlux.collectList())
                .assertNext(workspaces -> {
                    // assert only 1 workspace created during setup
                    assertThat(workspaces.size()).isEqualTo(1);
                    Workspace workspace1 = workspaces.stream()
                            .filter(workspace -> workspace.getName().equals(createdWorkspace.getName()))
                            .findFirst().
                            get();
                    assertThat(workspace1.getId()).isEqualTo(createdWorkspace.getId());
                })
                .verifyComplete();


        Flux<Application> applicationFlux = dataFromRepositoryForAllTabs.getApplicationFlux();
        StepVerifier.create(applicationFlux.collectList())
                .assertNext(applications -> {
                    assertThat(applications).hasSize(3);
                    Application application = applications.stream()
                            .filter(application1 -> application1.getName().equals(createdApplication.getName()))
                            .findFirst().get();
                    assert application.getName().equals(createdApplication.getName());
                })
                .verifyComplete();

        Flux<Datasource> datasourceFlux = dataFromRepositoryForAllTabs.getDatasourceFlux();
        StepVerifier.create(datasourceFlux)
                .assertNext(datasource -> {
                    assert datasource.getName().equals(createdDatasource.getName());
                })
                .verifyComplete();

        Flux<NewPage> pageFlux = dataFromRepositoryForAllTabs.getPageFlux()
                .filter(page -> page.getApplicationId().equals(createdApplication.getId()));
        StepVerifier.create(pageFlux.collectList())
                .assertNext(pages -> {
                    assertThat(pages).hasSize(2);
                })
                .verifyComplete();

        Flux<NewAction> actionFlux = dataFromRepositoryForAllTabs.getActionFlux();
        StepVerifier.create(actionFlux)
                .assertNext(action -> {
                    assert action.getUnpublishedAction().getName().equals(createdActionDto.getName());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testApplicationResourcesTabWithSuperAdminPermissionGroupId() {
        if (superAdminPermissionGroupId == null) {
            superAdminPermissionGroupId = userUtils.getSuperAdminPermissionGroup().block().getId();
        }

        CommonAppsmithObjectData dataFromRepositoryForAllTabs = workspaceResources.getDataFromRepositoryForAllTabs();
        Mono<RoleTabDTO> applicationResourcesTabViewMono =
                workspaceResources.createApplicationResourcesTabView(superAdminPermissionGroupId, dataFromRepositoryForAllTabs);

        StepVerifier.create(applicationResourcesTabViewMono)
                .assertNext(applicationResourcesTabView -> {
                    assertThat(applicationResourcesTabView).isNotNull();
                    assertThat(applicationResourcesTabView.getPermissions()).isEqualTo(RoleTab.APPLICATION_RESOURCES.getViewablePermissions());

                    EntityView topData = applicationResourcesTabView.getData();
                    assertThat(topData).isNotNull();
                    assertThat(topData.getType()).isEqualTo(Workspace.class.getSimpleName());

                    BaseView createdWorkspaceView = topData.getEntities().stream().filter(entity -> entity.getId().equals(createdWorkspace.getId())).findFirst().get();
                    assertThat(createdWorkspaceView.getName().equals(createdWorkspace.getName()));
                    // assert that all the permissions in this view are present and all of them are turned off for this workspace
                    List<Integer> perms = List.of(0, 0, 0, 0, 0, 0);
                    assertThat(createdWorkspaceView.getEnabled()).isEqualTo(perms);
                    // Only kind of child present in workspace in this tab : aka application
                    assertThat(createdWorkspaceView.getChildren().size()).isEqualTo(1);

                    EntityView createdApplicationEntityView = createdWorkspaceView.getChildren().stream().findFirst().get();
                    assertThat(createdApplicationEntityView.getType()).isEqualTo(Application.class.getSimpleName());
                    // We created only one application in this workspace. Assert that the same has been read into the view
                    // We added 2 more applications to the same workspace, one with Page and No action and another with No pages
                    assertThat(createdApplicationEntityView.getEntities().size()).isEqualTo(3);
                    BaseView createdApplicationView = createdApplicationEntityView.getEntities()
                            .stream()
                            .filter(applicationEntity -> applicationEntity.getId().equals(createdApplication.getId()))
                            .findFirst().get();
                    assertThat(createdApplicationView).isNotNull();
                    assertThat(createdApplicationView.getName()).isEqualTo(createdApplication.getName());
                    assertThat(createdApplicationView.getId()).isEqualTo(createdApplication.getId());
                    // assert that all the permissions in this view are present and all of them are turned off for this application
                    perms = List.of(0, 0, 0, 0, 0, 0);
                    assertThat(createdApplicationView.getEnabled()).isEqualTo(perms);
                    // Only one kind of child present in application in this tab : aka page
                    assertThat(createdApplicationView.getChildren().size()).isEqualTo(1);

                    EntityView createdPageEntityView = createdApplicationView.getChildren().stream().findFirst().get();
                    assertThat(createdPageEntityView.getType()).isEqualTo(NewPage.class.getSimpleName());
                    // We created only one page in this application. Assert that the same has been read into the view
                    // We have created 2 pages. 1 with actions, 1 without actions.
                    assertThat(createdPageEntityView.getEntities().size()).isEqualTo(2);
                    BaseView createdPageView = createdPageEntityView.getEntities()
                            .stream()
                            .filter(pageEntity -> pageEntity.getId().equals(createdApplication.getPages().get(0).getDefaultPageId()))
                            .findFirst().get();
                    assertThat(createdPageView).isNotNull();
                    assertThat(createdPageView.getId()).isEqualTo(createdApplication.getPages().get(0).getId());
                    // assert that only the first four permissions in this view are present and all of them are turned off for this page. The rest are disabled
                    perms = List.of(0, 0, 0, 0, -1, -1);
                    assertThat(createdPageView.getEnabled()).isEqualTo(perms);
                    // Only one kind of child present in page in this tab : aka action
                    assertThat(createdPageView.getChildren().size()).isEqualTo(1);

                    EntityView createdActionEntityView = createdPageView.getChildren().stream().findFirst().get();
                    assertThat(createdActionEntityView.getType()).isEqualTo(NewAction.class.getSimpleName());
                    // We created only one action in this page. Assert that the same has been read into the view
                    assertThat(createdActionEntityView.getEntities().size()).isEqualTo(1);
                    BaseView createdActionView = createdActionEntityView.getEntities().get(0);
                    assertThat(createdActionView.getId()).isEqualTo(createdActionDto.getId());
                    // assert that only the edit, view and delete permissions in this view are present and all of them are turned off for this action. The rest are disabled
                    perms = List.of(-1, 0, 0, 0, -1, -1);
                    assertThat(createdActionView.getEnabled()).isEqualTo(perms);
                    // No children present in action in this tab
                    assertThat(createdActionView.getChildren()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testApplicationResourcesTabWithWorkspaceAdminPermissionGroupId() {
        Set<String> defaultPermissionGroupIds = createdWorkspace.getDefaultPermissionGroups();
        Set<PermissionGroup> permissionGroups = permissionGroupRepository.findAllById(defaultPermissionGroupIds).collect(Collectors.toSet()).block();
        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst().get();

        CommonAppsmithObjectData dataFromRepositoryForAllTabs = workspaceResources.getDataFromRepositoryForAllTabs();

        // Fetch the application tab resources for the workspace admin permission group
        Mono<RoleTabDTO> applicationResourcesTabViewMono =
                workspaceResources.createApplicationResourcesTabView(adminPermissionGroup.getId(), dataFromRepositoryForAllTabs);

        StepVerifier.create(applicationResourcesTabViewMono)
                .assertNext(applicationResourcesTabView -> {
                    assertThat(applicationResourcesTabView).isNotNull();
                    assertThat(applicationResourcesTabView.getPermissions()).isEqualTo(RoleTab.APPLICATION_RESOURCES.getViewablePermissions());

                    EntityView topData = applicationResourcesTabView.getData();
                    assertThat(topData).isNotNull();
                    assertThat(topData.getType()).isEqualTo(Workspace.class.getSimpleName());

                    BaseView createdWorkspaceView = topData.getEntities().stream().filter(entity -> entity.getId().equals(createdWorkspace.getId())).findFirst().get();
                    assertThat(createdWorkspaceView.getName().equals(createdWorkspace.getName()));
                    // assert that all the permissions in this view are present and all of them are turned on for this workspace
                    List<Integer> perms = List.of(1, 1, 1, 1, 1, 1);
                    assertThat(createdWorkspaceView.getEnabled()).isEqualTo(perms);
                    // Only kind of child present in workspace in this tab : aka application
                    assertThat(createdWorkspaceView.getChildren().size()).isEqualTo(1);

                    EntityView createdApplicationEntityView = createdWorkspaceView.getChildren().stream().findFirst().get();
                    assertThat(createdApplicationEntityView.getType()).isEqualTo(Application.class.getSimpleName());
                    // We created only one application in this workspace. Assert that the same has been read into the view
                    // We added 2 more applications to the same workspace, one with Page and No action and another with No pages
                    assertThat(createdApplicationEntityView.getEntities().size()).isEqualTo(3);
                    BaseView createdApplicationView = createdApplicationEntityView.getEntities()
                            .stream()
                            .filter(applicationEntity -> applicationEntity.getId().equals(createdApplication.getId()))
                            .findFirst().get();
                    assertThat(createdApplicationView).isNotNull();
                    assertThat(createdApplicationView.getName()).isEqualTo(createdApplication.getName());
                    assertThat(createdApplicationView.getId()).isEqualTo(createdApplication.getId());
                    // assert that all the permissions in this view are present and all of them are turned on for this application
                    perms = List.of(1, 1, 1, 1, 1, 1);
                    assertThat(createdApplicationView.getEnabled()).isEqualTo(perms);
                    // Only one kind of child present in application in this tab : aka page
                    assertThat(createdApplicationView.getChildren().size()).isEqualTo(1);

                    EntityView createdPageEntityView = createdApplicationView.getChildren().stream().findFirst().get();
                    assertThat(createdPageEntityView.getType()).isEqualTo(NewPage.class.getSimpleName());
                    // We created only one page in this application. Assert that the same has been read into the view
                    // We have created 2 pages. 1 with actions, 1 without actions.
                    assertThat(createdPageEntityView.getEntities().size()).isEqualTo(2);
                    BaseView createdPageView = createdPageEntityView.getEntities()
                            .stream()
                            .filter(pageEntity -> pageEntity.getId().equals(createdApplication.getPages().get(0).getDefaultPageId()))
                            .findFirst().get();
                    assertThat(createdPageView).isNotNull();
                    assertThat(createdPageView.getId()).isEqualTo(createdApplication.getPages().get(0).getId());
                    // assert that create, edit, delete and view are turned on. The rest are disabled
                    perms = List.of(1, 1, 1, 1, -1, -1);
                    assertThat(createdPageView.getEnabled()).isEqualTo(perms);
                    // Only one kind of child present in page in this tab : aka action
                    assertThat(createdPageView.getChildren().size()).isEqualTo(1);

                    EntityView createdActionEntityView = createdPageView.getChildren().stream().findFirst().get();
                    assertThat(createdActionEntityView.getType()).isEqualTo(NewAction.class.getSimpleName());
                    // We created only one action in this page. Assert that the same has been read into the view
                    assertThat(createdActionEntityView.getEntities().size()).isEqualTo(1);
                    BaseView createdActionView = createdActionEntityView.getEntities().get(0);
                    assertThat(createdActionView.getId()).isEqualTo(createdActionDto.getId());
                    assertThat(((ActionResourceDTO) createdActionView).getPluginId()).isEqualTo(createdActionDto.getPluginId());
                    // assert that only the edit, view and delete permissions in this view are present and all of them are turned on for this action. The rest are disabled
                    perms = List.of(-1, 1, 1, 1, -1, -1);
                    assertThat(createdActionView.getEnabled()).isEqualTo(perms);
                    // No children present in action in this tab
                    assertThat(createdActionView.getChildren()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testApplicationResourcesTab_testHoverMap() {
        Workspace workspace = new Workspace();
        workspace.setName("testApplicationResourcesTab_testHoverMap workspace");
        Workspace createdWorkspace1 = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("testApplicationResourcesTab_testHoverMap application");
        Application createdApplication1 = applicationPageService.createApplication(application, createdWorkspace1.getId()).block();

        Datasource datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(createdWorkspace1.getId());
        Plugin installed_plugin = pluginRepository.findByPackageName("restapi-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        datasource.setDatasourceConfiguration(new DatasourceConfiguration());

        ActionDTO action = new ActionDTO();
        action.setName("validAction");
        action.setPageId(createdApplication1.getPages().get(0).getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);


        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("validActionCollection");
        actionCollectionDTO.setPageId(createdApplication1.getPages().get(0).getId());
        actionCollectionDTO.setActions(List.of(action));
        actionCollectionDTO.setWorkspaceId(createdWorkspace1.getId());
        actionCollectionDTO.setApplicationId(createdApplication1.getId());
        actionCollectionDTO.setPluginId(restApiPlugin.getId());
        actionCollectionDTO.setPluginType(restApiPlugin.getType());

        ActionCollectionDTO createdActionCollection = layoutCollectionService.createCollection(actionCollectionDTO).block();

        CommonAppsmithObjectData dataFromRepositoryForAllTabs = workspaceResources.getDataFromRepositoryForAllTabs();

        Set<String> defaultPermissionGroupIds = createdWorkspace1.getDefaultPermissionGroups();
        PermissionGroup adminPermissionGroup = permissionGroupRepository.findAllById(defaultPermissionGroupIds)
                .collect(Collectors.toSet()).block()
                .stream().filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst().get();

        RoleTabDTO roleTabDTO = workspaceResources
                .createApplicationResourcesTabView(adminPermissionGroup.getId(), dataFromRepositoryForAllTabs)
                .block();

        assertThat(roleTabDTO).isNotNull();
        assertThat(roleTabDTO.getHoverMap()).isNotNull();
        String createdPageId = createdApplication1.getPages().get(0).getId();
        String createdActionId = createdActionCollection.getActions().get(0).getId();
        String createdWorkspaceEdit = createdWorkspace1.getId() + "_Edit";
        String createdApplicationEdit = createdApplication1.getId() + "_Edit";
        String createdPageEdit = createdPageId + "_Edit";
        String createdActionCollectionEdit = createdActionCollection.getId() + "_Edit";
        assertThat(roleTabDTO.getHoverMap()).contains(Map.entry(createdWorkspaceEdit, Set.of(
                new IdPermissionDTO(createdWorkspace1.getId(), PermissionViewableName.VIEW),
                new IdPermissionDTO(createdApplication1.getId(), PermissionViewableName.EDIT))));
        assertThat(roleTabDTO.getHoverMap()).contains(Map.entry(createdApplicationEdit, Set.of(
                new IdPermissionDTO(createdApplication1.getId(), PermissionViewableName.VIEW),
                new IdPermissionDTO(createdApplication1.getPages().get(0).getId(), PermissionViewableName.EDIT))));
        assertThat(roleTabDTO.getHoverMap()).contains(Map.entry(createdPageEdit, Set.of(
                new IdPermissionDTO(createdPageId, PermissionViewableName.VIEW),
                new IdPermissionDTO(createdActionCollection.getId(), PermissionViewableName.EDIT),
                new IdPermissionDTO(createdActionId, PermissionViewableName.EDIT)
        )));
        assertThat(roleTabDTO.getHoverMap()).contains(Map.entry(createdActionCollectionEdit, Set.of(
                new IdPermissionDTO(createdActionCollection.getId(), PermissionViewableName.VIEW)
        )));

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testDatasourceResourcesTab_testHoverMap() {
        Workspace workspace = new Workspace();
        workspace.setName("testApplicationResourcesTab_testHoverMap workspace");
        Workspace createdWorkspace1 = workspaceService.create(workspace).block();

        Datasource datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(createdWorkspace1.getId());
        Plugin installed_plugin = pluginRepository.findByPackageName("restapi-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        datasource.setDatasourceConfiguration(new DatasourceConfiguration());
        datasource.setWorkspaceId(createdWorkspace1.getId());
        Datasource createdDatasource1 = datasourceService.create(datasource).block();

        CommonAppsmithObjectData dataFromRepositoryForAllTabs = workspaceResources.getDataFromRepositoryForAllTabs();

        Set<String> defaultPermissionGroupIds = createdWorkspace1.getDefaultPermissionGroups();
        PermissionGroup adminPermissionGroup = permissionGroupRepository.findAllById(defaultPermissionGroupIds)
                .collect(Collectors.toSet()).block()
                .stream().filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst().get();

        RoleTabDTO roleTabDTO = workspaceResources
                .createDatasourceResourcesTabView(adminPermissionGroup.getId(), dataFromRepositoryForAllTabs)
                .block();

        assertThat(roleTabDTO).isNotNull();
        assertThat(roleTabDTO.getHoverMap()).isNotNull();

        String createdWorkspaceCreate = createdWorkspace1.getId() + "_Create";
        String createdWorkspaceDelete = createdWorkspace1.getId() + "_Delete";
        String createdWorkspaceEdit = createdWorkspace1.getId() + "_Edit";
        String createdWorkspaceExecute = createdWorkspace1.getId() + "_Execute";
        String createdWorkspaceView = createdWorkspace1.getId() + "_View";

        String createdDatasourceCreate = createdDatasource1.getId() + "_Create";
        String createdDatasourceDelete = createdDatasource1.getId() + "_Delete";
        String createdDatasourceEdit = createdDatasource1.getId() + "_Edit";
        String createdDatasourceView = createdDatasource1.getId() + "_View";

        assertThat(roleTabDTO.getHoverMap()).contains(Map.entry(createdWorkspaceCreate, Set.of(
                new IdPermissionDTO(createdWorkspace1.getId(), PermissionViewableName.DELETE),
                new IdPermissionDTO(createdWorkspace1.getId(), PermissionViewableName.VIEW),
                new IdPermissionDTO(createdWorkspace1.getId(), PermissionViewableName.EXECUTE),
                new IdPermissionDTO(createdWorkspace1.getId(), PermissionViewableName.EDIT),
                new IdPermissionDTO(createdDatasource1.getId(), PermissionViewableName.CREATE)
        )));
        assertThat(roleTabDTO.getHoverMap()).contains(Map.entry(createdWorkspaceDelete, Set.of(
                new IdPermissionDTO(createdWorkspace1.getId(), PermissionViewableName.VIEW),
                new IdPermissionDTO(createdWorkspace1.getId(), PermissionViewableName.EXECUTE),
                new IdPermissionDTO(createdDatasource1.getId(), PermissionViewableName.DELETE)
        )));
        assertThat(roleTabDTO.getHoverMap()).contains(Map.entry(createdWorkspaceEdit, Set.of(
                new IdPermissionDTO(createdWorkspace1.getId(), PermissionViewableName.VIEW),
                new IdPermissionDTO(createdWorkspace1.getId(), PermissionViewableName.EXECUTE),
                new IdPermissionDTO(createdDatasource1.getId(), PermissionViewableName.EDIT)
        )));
        assertThat(roleTabDTO.getHoverMap()).contains(Map.entry(createdWorkspaceExecute, Set.of(
                new IdPermissionDTO(createdDatasource1.getId(), PermissionViewableName.EXECUTE)
        )));
        assertThat(roleTabDTO.getHoverMap()).contains(Map.entry(createdWorkspaceView, Set.of(
                new IdPermissionDTO(createdWorkspace1.getId(), PermissionViewableName.EXECUTE),
                new IdPermissionDTO(createdDatasource1.getId(), PermissionViewableName.VIEW)
        )));

        assertThat(roleTabDTO.getHoverMap()).contains(Map.entry(createdDatasourceCreate, Set.of(
                new IdPermissionDTO(createdDatasource1.getId(), PermissionViewableName.DELETE),
                new IdPermissionDTO(createdDatasource1.getId(), PermissionViewableName.EDIT),
                new IdPermissionDTO(createdDatasource1.getId(), PermissionViewableName.EXECUTE),
                new IdPermissionDTO(createdDatasource1.getId(), PermissionViewableName.VIEW)
        )));
        assertThat(roleTabDTO.getHoverMap()).contains(Map.entry(createdDatasourceDelete, Set.of(
                new IdPermissionDTO(createdDatasource1.getId(), PermissionViewableName.EXECUTE),
                new IdPermissionDTO(createdDatasource1.getId(), PermissionViewableName.VIEW)
        )));
        assertThat(roleTabDTO.getHoverMap()).contains(Map.entry(createdDatasourceEdit, Set.of(
                new IdPermissionDTO(createdDatasource1.getId(), PermissionViewableName.EXECUTE),
                new IdPermissionDTO(createdDatasource1.getId(), PermissionViewableName.VIEW)
        )));
        assertThat(roleTabDTO.getHoverMap()).contains(Map.entry(createdDatasourceView, Set.of(
                new IdPermissionDTO(createdDatasource1.getId(), PermissionViewableName.EXECUTE)
        )));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGroupsAndRolesTab_testHoverMap_testEntityViews() {
        Workspace workspace = new Workspace();
        workspace.setName("testGroupsAndRolesTab_testHoverMap workspace");
        Workspace createdWorkspace1 = workspaceService.create(workspace).block();

        List<PermissionGroup> pgList = permissionGroupRepository
                .findAllById(createdWorkspace1.getDefaultPermissionGroups())
                .collectList().block();
        PermissionGroup adminPg = pgList.stream().filter(pg -> pg.getName().startsWith(ADMINISTRATOR)).findFirst().get();
        PermissionGroup devPg = pgList.stream().filter(pg -> pg.getName().startsWith(DEVELOPER)).findFirst().get();
        PermissionGroup viewPg = pgList.stream().filter(pg -> pg.getName().startsWith(VIEWER)).findFirst().get();

        PermissionGroup pg = new PermissionGroup();
        pg.setName("additional pg");
        PermissionGroup additionalPg = permissionGroupService.create(pg).block();

        String tenantId = tenantService.getDefaultTenantId().block();

        RoleTabDTO roleTabDTO = tenantResources.createGroupsAndRolesTab(additionalPg.getId()).block();

        String tenantAssociateRoleKey = tenantId + "_Associate Role_" + TENANT_ROLE;
        String tenantCreateRoleKey = tenantId + "_Create_" + TENANT_ROLE;
        String tenantDeleteRoleKey = tenantId + "_Delete_" + TENANT_ROLE;
        String tenantEditRoleKey = tenantId + "_Edit_" + TENANT_ROLE;
        String tenantViewRoleKey = tenantId + "_View_" + TENANT_ROLE;
        String tenantCreateGroupKey = tenantId + "_Create_" + TENANT_GROUP;
        String tenantDeleteGroupKey = tenantId + "_Delete_" + TENANT_GROUP;
        String tenantEditGroupKey = tenantId + "_Edit_" + TENANT_GROUP;
        String tenantViewGroupKey = tenantId + "_View_" + TENANT_GROUP;
        String tenantInviteUserGroupKey = tenantId + "_Invite User_" + TENANT_GROUP;
        String tenantRemoveUserGroupKey = tenantId + "_Remove User_" + TENANT_GROUP;
        String adminPgEditKey = adminPg.getId() + "_Edit";
        String adminPgDeleteKey = adminPg.getId() + "_Delete";
        String adminPgViewKey = adminPg.getId() + "_View";
        String devPgEditKey = devPg.getId() + "_Edit";
        String devPgDeleteKey = devPg.getId() + "_Delete";
        String devPgViewKey = devPg.getId() + "_View";
        String viewPgEditKey = viewPg.getId() + "_Edit";
        String viewPgDeleteKey = viewPg.getId() + "_Delete";
        String viewPgViewKey = viewPg.getId() + "_View";
        String additionalPgEditKey = additionalPg.getId() + "_Edit";
        String additionalPgDeleteKey = additionalPg.getId() + "_Delete";
        String additionalPgViewKey = additionalPg.getId() + "_View";


        assertThat(roleTabDTO.getHoverMap()).containsKeys(tenantAssociateRoleKey, tenantCreateRoleKey,
                tenantDeleteRoleKey, tenantEditRoleKey, tenantViewRoleKey, tenantCreateGroupKey, tenantDeleteGroupKey,
                tenantEditGroupKey, tenantViewGroupKey, tenantInviteUserGroupKey, tenantRemoveUserGroupKey,
                adminPgViewKey, devPgViewKey, viewPgViewKey, additionalPgDeleteKey, additionalPgEditKey,
                additionalPgViewKey);

        assertThat(roleTabDTO.getHoverMap()).doesNotContainKeys(adminPgDeleteKey, adminPgEditKey, devPgDeleteKey,
                devPgEditKey, viewPgDeleteKey, viewPgEditKey);

        assertThat(roleTabDTO.getHoverMap().get(tenantCreateRoleKey)).contains(
                new IdPermissionDTO(tenantId, PermissionViewableName.ASSOCIATE_ROLE),
                new IdPermissionDTO(tenantId, PermissionViewableName.DELETE),
                new IdPermissionDTO(tenantId, PermissionViewableName.EDIT),
                new IdPermissionDTO(tenantId, PermissionViewableName.INVITE_USER),
                new IdPermissionDTO(tenantId, PermissionViewableName.REMOVE_USER),
                new IdPermissionDTO(tenantId, PermissionViewableName.VIEW)
        );

        assertThat(roleTabDTO.getHoverMap().get(tenantAssociateRoleKey)).contains(
                new IdPermissionDTO(adminPg.getId(), PermissionViewableName.ASSOCIATE_ROLE),
                new IdPermissionDTO(devPg.getId(), PermissionViewableName.ASSOCIATE_ROLE),
                new IdPermissionDTO(viewPg.getId(), PermissionViewableName.ASSOCIATE_ROLE),
                new IdPermissionDTO(additionalPg.getId(), PermissionViewableName.ASSOCIATE_ROLE)
        );

        assertThat(roleTabDTO.getHoverMap().get(tenantDeleteRoleKey)).contains(
                new IdPermissionDTO(adminPg.getId(), PermissionViewableName.ASSOCIATE_ROLE),
                new IdPermissionDTO(adminPg.getId(), PermissionViewableName.VIEW),
                new IdPermissionDTO(devPg.getId(), PermissionViewableName.ASSOCIATE_ROLE),
                new IdPermissionDTO(devPg.getId(), PermissionViewableName.VIEW),
                new IdPermissionDTO(viewPg.getId(), PermissionViewableName.ASSOCIATE_ROLE),
                new IdPermissionDTO(viewPg.getId(), PermissionViewableName.VIEW),
                new IdPermissionDTO(additionalPg.getId(), PermissionViewableName.DELETE)
        );

        assertThat(roleTabDTO.getHoverMap().get(tenantEditRoleKey)).contains(
                new IdPermissionDTO(adminPg.getId(), PermissionViewableName.ASSOCIATE_ROLE),
                new IdPermissionDTO(adminPg.getId(), PermissionViewableName.VIEW),
                new IdPermissionDTO(devPg.getId(), PermissionViewableName.ASSOCIATE_ROLE),
                new IdPermissionDTO(devPg.getId(), PermissionViewableName.VIEW),
                new IdPermissionDTO(viewPg.getId(), PermissionViewableName.ASSOCIATE_ROLE),
                new IdPermissionDTO(viewPg.getId(), PermissionViewableName.VIEW),
                new IdPermissionDTO(additionalPg.getId(), PermissionViewableName.EDIT)
        );

        assertThat(roleTabDTO.getHoverMap().get(tenantViewRoleKey)).contains(
                new IdPermissionDTO(adminPg.getId(), PermissionViewableName.VIEW),
                new IdPermissionDTO(devPg.getId(), PermissionViewableName.VIEW),
                new IdPermissionDTO(viewPg.getId(), PermissionViewableName.VIEW),
                new IdPermissionDTO(additionalPg.getId(), PermissionViewableName.VIEW)
        );

        assertThat(roleTabDTO.getHoverMap().get(adminPgViewKey)).contains(
                new IdPermissionDTO(adminPg.getId(), PermissionViewableName.ASSOCIATE_ROLE));

        assertThat(roleTabDTO.getHoverMap().get(devPgViewKey)).contains(
                new IdPermissionDTO(devPg.getId(), PermissionViewableName.ASSOCIATE_ROLE));

        assertThat(roleTabDTO.getHoverMap().get(viewPgViewKey)).contains(
                new IdPermissionDTO(viewPg.getId(), PermissionViewableName.ASSOCIATE_ROLE));

        assertThat(roleTabDTO.getHoverMap().get(additionalPgDeleteKey)).contains(
                new IdPermissionDTO(additionalPg.getId(), PermissionViewableName.ASSOCIATE_ROLE),
                new IdPermissionDTO(additionalPg.getId(), PermissionViewableName.VIEW));
        assertThat(roleTabDTO.getHoverMap().get(additionalPgEditKey)).contains(
                new IdPermissionDTO(additionalPg.getId(), PermissionViewableName.ASSOCIATE_ROLE),
                new IdPermissionDTO(additionalPg.getId(), PermissionViewableName.VIEW));
        assertThat(roleTabDTO.getHoverMap().get(additionalPgViewKey)).contains(
                new IdPermissionDTO(additionalPg.getId(), PermissionViewableName.ASSOCIATE_ROLE));

        EntityView groupsAndRolesView = roleTabDTO.getData();
        BaseView rolesView = groupsAndRolesView.getEntities().stream()
                .filter(entity -> entity.getName().equals("Roles")).findFirst().get();

        assertThat(rolesView.getId()).isEqualTo(tenantId);

        BaseView adminPgBaseView = rolesView.getChildren().stream().findAny().get()
                .getEntities().stream().filter(entity -> entity.getId().equals(adminPg.getId()))
                .findFirst().get();
        BaseView devPgBaseView = rolesView.getChildren().stream().findAny().get()
                .getEntities().stream().filter(entity -> entity.getId().equals(devPg.getId()))
                .findFirst().get();
        BaseView viewPgBaseView = rolesView.getChildren().stream().findAny().get()
                .getEntities().stream().filter(entity -> entity.getId().equals(viewPg.getId()))
                .findFirst().get();
        BaseView additionalPgBaseView = rolesView.getChildren().stream().findAny().get()
                .getEntities().stream().filter(entity -> entity.getId().equals(additionalPg.getId()))
                .findFirst().get();

        /*
         * Permissions which can be provided for Groups and Roles Tab:
         * CREATE, EDIT, DELETE, VIEW, INVITE_USER, REMOVE_USER, ASSOCIATE_ROLE
         * Note: The permissions are supposed to be given in this order only.
         * 0 -> Permission has been disabled
         * 1 -> Permission has been enabled
         * -1 -> Permission can't be given
         *
         * Here, All the CREATE permissions can't be given.
         * EDIT and DELETE permissions can't be given for the Auto-created Permission Groups
         */
        assertThat(adminPgBaseView.getEnabled()).isEqualTo(List.of(-1, -1, -1, 0, -1, -1, 0));
        assertThat(devPgBaseView.getEnabled()).isEqualTo(List.of(-1, -1, -1, 0, -1, -1, 0));
        assertThat(viewPgBaseView.getEnabled()).isEqualTo(List.of(-1, -1, -1, 0, -1, -1, 0));
        assertThat(additionalPgBaseView.getEnabled()).isEqualTo(List.of(-1, 0, 0, 0, -1, -1, 0));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testDatasourceResourcesTabWithSuperAdminPermissionGroupId() {
        if (superAdminPermissionGroupId == null) {
            superAdminPermissionGroupId = userUtils.getSuperAdminPermissionGroup().block().getId();
        }

        CommonAppsmithObjectData dataFromRepositoryForAllTabs = workspaceResources.getDataFromRepositoryForAllTabs();
        Mono<RoleTabDTO> datasourcesResourcesTabViewMono =
                workspaceResources.createDatasourceResourcesTabView(superAdminPermissionGroupId, dataFromRepositoryForAllTabs);

        StepVerifier.create(datasourcesResourcesTabViewMono)
                .assertNext(datasourceResourcesTabView -> {
                    assertThat(datasourceResourcesTabView).isNotNull();
                    assertThat(datasourceResourcesTabView.getPermissions()).isEqualTo(RoleTab.DATASOURCES_QUERIES.getViewablePermissions());

                    EntityView topData = datasourceResourcesTabView.getData();
                    assertThat(topData).isNotNull();
                    assertThat(topData.getType()).isEqualTo(Workspace.class.getSimpleName());

                    BaseView createdWorkspaceView = topData.getEntities().stream().filter(entity -> entity.getId().equals(createdWorkspace.getId())).findFirst().get();
                    assertThat(createdWorkspaceView.getName().equals(createdWorkspace.getName()));
                    // assert that all the permissions in this view are present and all of them are turned off for this workspace
                    List<Integer> perms = List.of(0, 0, 0, 0, 0);
                    assertThat(createdWorkspaceView.getEnabled()).isEqualTo(perms);
                    // Only kind of child present in workspace in this tab : aka header
                    assertThat(createdWorkspaceView.getChildren().size()).isEqualTo(1);

                    EntityView createdHeaderEntityView = createdWorkspaceView.getChildren().stream().findFirst().get();
                    assertThat(createdHeaderEntityView.getType()).isEqualTo("Header");
                    // Assert that two kinds of children exist in header in this tab : aka datasource and application
                    assertThat(createdHeaderEntityView.getEntities().size()).isEqualTo(2);

                    EntityView DatasourcesEntityView = createdHeaderEntityView.getEntities().stream().filter(entity -> entity.getName().equals("Datasources")).findFirst().get().getChildren().stream().findFirst().get();
                    EntityView ApplicationsEntityView = createdHeaderEntityView.getEntities().stream().filter(entity -> entity.getName().equals("Applications")).findFirst().get().getChildren().stream().findFirst().get();

                    // Only one datasource was created in this workspace
                    assertThat(DatasourcesEntityView.getEntities().size()).isEqualTo(1);
                    BaseView createdDatasourceView = DatasourcesEntityView.getEntities().get(0);
                    assertThat(createdDatasourceView.getName()).isEqualTo(createdDatasource.getName());
                    assertThat(createdDatasourceView.getId()).isEqualTo(createdDatasource.getId());
                    assertThat(((DatasourceResourceDTO) createdDatasourceView).getPluginId()).isEqualTo(createdDatasource.getPluginId());
                    // assert that all the permissions in this view are present and all of them are turned off for this datasource
                    perms = List.of(0, 0, 0, 0, 0);
                    assertThat(createdDatasourceView.getEnabled()).isEqualTo(perms);
                    // There are no children for datasource
                    assertThat(createdDatasourceView.getChildren()).isNull();

                    // Only one application was created in this workspace
                    // The workspace contains 2 applications, but only 1 application contains Pages with actions
                    // Hence, only 1 application is showing up here.
                    assertThat(ApplicationsEntityView.getEntities().size()).isEqualTo(1);
                    BaseView createdApplicationView = ApplicationsEntityView.getEntities().get(0);
                    assertThat(createdApplicationView.getName()).isEqualTo(createdApplication.getName());
                    assertThat(createdApplicationView.getId()).isEqualTo(createdApplication.getId());
                    // assert that all the permissions in this view are disabled for application
                    perms = List.of(-1, -1, -1, -1, -1);
                    assertThat(createdApplicationView.getEnabled()).isEqualTo(perms);
                    // Only one kind of child present in application in this tab : aka page
                    assertThat(createdApplicationView.getChildren().size()).isEqualTo(1);

                    EntityView createdPageEntityView = createdApplicationView.getChildren().stream().findFirst().get();
                    assertThat(createdPageEntityView.getType()).isEqualTo(NewPage.class.getSimpleName());
                    // We created only one page in this application. Assert that the same has been read into the view
                    // Now the application contains 2 pages, but only 1 page contains Actions.
                    // Hence, only 1 page entity is coming up here.
                    assertThat(createdPageEntityView.getEntities().size()).isEqualTo(1);
                    BaseView createdPageView = createdPageEntityView.getEntities().get(0);
                    assertThat(createdPageView.getId()).isEqualTo(createdApplication.getPages().get(0).getId());
                    // assert that all the permissions in this view are disabled for the page
                    perms = List.of(-1, -1, -1, -1, -1);
                    assertThat(createdPageView.getEnabled()).isEqualTo(perms);
                    // Only one kind of child present in page in this tab : aka action
                    assertThat(createdPageView.getChildren().size()).isEqualTo(1);

                    EntityView createdActionEntityView = createdPageView.getChildren().stream().findFirst().get();
                    assertThat(createdActionEntityView.getType()).isEqualTo(NewAction.class.getSimpleName());
                    // We created only one action in this page. Assert that the same has been read into the view
                    assertThat(createdActionEntityView.getEntities().size()).isEqualTo(1);
                    BaseView createdActionView = createdActionEntityView.getEntities().get(0);
                    assertThat(createdActionView.getId()).isEqualTo(createdActionDto.getId());
                    assertThat(((ActionResourceDTO) createdActionView).getPluginId()).isEqualTo(createdActionDto.getPluginId());
                    // assert that only execute permission is present and is turned off for this action. The rest are disabled
                    perms = List.of(0, -1, -1, -1, -1);
                    assertThat(createdActionView.getEnabled()).isEqualTo(perms);
                    // No children present in action in this tab
                    assertThat(createdActionView.getChildren()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testDatasourceResourcesTabWithWorkspaceAdminPermissionGroupId() {
        Set<String> defaultPermissionGroupIds = createdWorkspace.getDefaultPermissionGroups();
        Set<PermissionGroup> permissionGroups = permissionGroupRepository.findAllById(defaultPermissionGroupIds).collect(Collectors.toSet()).block();
        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst().get();

        CommonAppsmithObjectData dataFromRepositoryForAllTabs = workspaceResources.getDataFromRepositoryForAllTabs();
        Mono<RoleTabDTO> datasourcesResourcesTabViewMono =
                workspaceResources.createDatasourceResourcesTabView(adminPermissionGroup.getId(), dataFromRepositoryForAllTabs);

        StepVerifier.create(datasourcesResourcesTabViewMono)
                .assertNext(datasourceResourcesTabView -> {
                    assertThat(datasourceResourcesTabView).isNotNull();
                    assertThat(datasourceResourcesTabView.getPermissions()).isEqualTo(RoleTab.DATASOURCES_QUERIES.getViewablePermissions());

                    EntityView topData = datasourceResourcesTabView.getData();
                    assertThat(topData).isNotNull();
                    assertThat(topData.getType()).isEqualTo(Workspace.class.getSimpleName());

                    BaseView createdWorkspaceView = topData.getEntities().stream().filter(entity -> entity.getId().equals(createdWorkspace.getId())).findFirst().get();
                    assertThat(createdWorkspaceView.getName().equals(createdWorkspace.getName()));

                    List<Integer> perms = List.of(1, 1, 1, 1, 1);
                    assertThat(createdWorkspaceView.getEnabled()).isEqualTo(perms);
                    // Only kind of child present in workspace in this tab : aka header
                    assertThat(createdWorkspaceView.getChildren().size()).isEqualTo(1);

                    EntityView createdHeaderEntityView = createdWorkspaceView.getChildren().stream().findFirst().get();
                    assertThat(createdHeaderEntityView.getType()).isEqualTo("Header");
                    // Assert that two kinds of children exist in header in this tab : aka datasource and application
                    assertThat(createdHeaderEntityView.getEntities().size()).isEqualTo(2);

                    EntityView DatasourcesEntityView = createdHeaderEntityView.getEntities().stream().filter(entity -> entity.getName().equals("Datasources")).findFirst().get().getChildren().stream().findFirst().get();
                    EntityView ApplicationsEntityView = createdHeaderEntityView.getEntities().stream().filter(entity -> entity.getName().equals("Applications")).findFirst().get().getChildren().stream().findFirst().get();

                    // Only one datasource was created in this workspace
                    assertThat(DatasourcesEntityView.getEntities().size()).isEqualTo(1);
                    BaseView createdDatasourceView = DatasourcesEntityView.getEntities().get(0);
                    assertThat(createdDatasourceView.getName()).isEqualTo(createdDatasource.getName());
                    assertThat(createdDatasourceView.getId()).isEqualTo(createdDatasource.getId());
                    assertThat(((DatasourceResourceDTO) createdDatasourceView).getPluginId()).isEqualTo(createdDatasource.getPluginId());
                    // assert that all the permissions in this view are present and all of them are turned on for this datasource
                    perms = List.of(1, 1, 1, 1, 1);
                    assertThat(createdDatasourceView.getEnabled()).isEqualTo(perms);
                    // There are no children for datasource
                    assertThat(createdDatasourceView.getChildren()).isNull();

                    // Only one application was created in this workspace
                    assertThat(ApplicationsEntityView.getEntities().size()).isEqualTo(1);
                    BaseView createdApplicationView = ApplicationsEntityView.getEntities().get(0);
                    assertThat(createdApplicationView.getName()).isEqualTo(createdApplication.getName());
                    assertThat(createdApplicationView.getId()).isEqualTo(createdApplication.getId());
                    // assert that all the permissions in this view are disabled for application
                    perms = List.of(-1, -1, -1, -1, -1);
                    assertThat(createdApplicationView.getEnabled()).isEqualTo(perms);
                    // Only one kind of child present in application in this tab : aka page
                    assertThat(createdApplicationView.getChildren().size()).isEqualTo(1);

                    EntityView createdPageEntityView = createdApplicationView.getChildren().stream().findFirst().get();
                    assertThat(createdPageEntityView.getType()).isEqualTo(NewPage.class.getSimpleName());
                    // We created only one page in this application. Assert that the same has been read into the view
                    assertThat(createdPageEntityView.getEntities().size()).isEqualTo(1);
                    BaseView createdPageView = createdPageEntityView.getEntities().get(0);
                    assertThat(createdPageView.getId()).isEqualTo(createdApplication.getPages().get(0).getId());
                    // assert that all the permissions in this view are disabled for the page
                    perms = List.of(-1, -1, -1, -1, -1);
                    assertThat(createdPageView.getEnabled()).isEqualTo(perms);
                    // Only one kind of child present in page in this tab : aka action
                    assertThat(createdPageView.getChildren().size()).isEqualTo(1);

                    EntityView createdActionEntityView = createdPageView.getChildren().stream().findFirst().get();
                    assertThat(createdActionEntityView.getType()).isEqualTo(NewAction.class.getSimpleName());
                    // We created only one action in this page. Assert that the same has been read into the view
                    assertThat(createdActionEntityView.getEntities().size()).isEqualTo(1);
                    BaseView createdActionView = createdActionEntityView.getEntities().get(0);
                    assertThat(createdActionView.getId()).isEqualTo(createdActionDto.getId());
                    assertThat(((ActionResourceDTO) createdActionView).getPluginId()).isEqualTo(createdActionDto.getPluginId());
                    // assert that only execute permission is present and is turned on for this action. The rest are disabled
                    perms = List.of(1, -1, -1, -1, -1);
                    assertThat(createdActionView.getEnabled()).isEqualTo(perms);
                    // No children present in action in this tab
                    assertThat(createdActionView.getChildren()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testSaveRoleConfigurationChangesForDatasourceResourcesTab() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Workspace workspace = new Workspace();
        workspace.setName("testSaveRoleConfigurationChanges workspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("testSaveRoleConfigurationChanges application");
        Application createdApplication = applicationPageService.createApplication(application, workspace.getId()).block();

        Datasource datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(createdWorkspace.getId());
        Plugin installed_plugin = pluginRepository.findByPackageName("restapi-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        datasource.setDatasourceConfiguration(new DatasourceConfiguration());

        ActionDTO action = new ActionDTO();
        action.setName("validAction");
        action.setPageId(createdApplication.getPages().get(0).getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        ActionDTO createdAction = layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("validActionCollection");
        actionCollectionDTO.setPageId(createdApplication.getPages().get(0).getId());
        actionCollectionDTO.setActions(List.of(action));
        actionCollectionDTO.setWorkspaceId(createdWorkspace.getId());
        actionCollectionDTO.setApplicationId(createdApplication.getId());
        actionCollectionDTO.setPluginId(restApiPlugin.getId());
        actionCollectionDTO.setPluginType(restApiPlugin.getType());

        ActionCollectionDTO createdActionCollection = layoutCollectionService.createCollection(actionCollectionDTO).block();

        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for editing");
        PermissionGroup createdPermissionGroup = permissionGroupService.create(permissionGroup).block();

        UpdateRoleConfigDTO updateRoleConfigDTO = new UpdateRoleConfigDTO();
        UpdateRoleEntityDTO actionCollectionEntity = new UpdateRoleEntityDTO(
                ActionCollection.class.getSimpleName(),
                createdActionCollection.getId(),
                List.of(1, -1, -1, -1, -1),
                "unnecessary name"
        );
        updateRoleConfigDTO.setEntitiesChanged(Set.of(
                actionCollectionEntity
        ));
        updateRoleConfigDTO.setTabName(RoleTab.DATASOURCES_QUERIES.getName());

        Mono<RoleViewDTO> roleConfigChangeMono = roleConfigurationSolution.updateRoles(createdPermissionGroup.getId(), updateRoleConfigDTO);

        StepVerifier.create(roleConfigChangeMono)
                .assertNext(roleViewDTO -> {
                    assertThat(roleViewDTO).isNotNull();
                    BaseView workspaceView = roleViewDTO.getTabs().get(RoleTab.DATASOURCES_QUERIES.getName())
                            .getData()
                            .getEntities()
                            .stream()
                            .filter(baseView -> baseView.getId().equals(createdWorkspace.getId()))
                            .findFirst().get();

                    BaseView applicationView = workspaceView.getChildren().stream().findFirst().get()
                            .getEntities().stream().filter(entity -> entity.getName().equals("Applications")).findFirst().get()
                            .getChildren().stream().filter(entity -> entity.getType().equals("Application")).findFirst().get()
                            .getEntities().stream().filter(applicationEntity -> applicationEntity.getId().equals(createdApplication.getId())).findFirst().get();

                    BaseView pageView = applicationView.getChildren().stream().filter(entity -> entity.getType().equals("NewPage")).findFirst().get()
                            .getEntities().stream().filter(pageEntity -> pageEntity.getId().equals(createdApplication.getPages().get(0).getId())).findFirst().get();

                    BaseView actionCollectionView = pageView.getChildren().stream().filter(entity -> entity.getType().equals("ActionCollection")).findFirst().get()
                            .getEntities().stream().filter(entity -> entity.getId().equals(createdActionCollection.getId())).findFirst().get();
                    assertThat(actionCollectionView.getEnabled()).isEqualTo(List.of(1, -1, -1, -1, -1));


                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testSaveRoleConfigurationChangesForApplicationResourcesTab() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Workspace workspace = new Workspace();
        workspace.setName("testSaveRoleConfigurationChanges workspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("testSaveRoleConfigurationChanges application");
        Application createdApplication = applicationPageService.createApplication(application, workspace.getId()).block();

        Datasource datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(createdWorkspace.getId());
        Plugin installed_plugin = pluginRepository.findByPackageName("restapi-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        datasource.setDatasourceConfiguration(new DatasourceConfiguration());

        ActionDTO action = new ActionDTO();
        action.setName("validAction");
        action.setPageId(createdApplication.getPages().get(0).getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        ActionDTO createdAction = layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for editing");
        PermissionGroup createdPermissionGroup = permissionGroupService.create(permissionGroup).block();

        UpdateRoleConfigDTO updateRoleConfigDTO = new UpdateRoleConfigDTO();

        // Add entity changes
        // Workspace : Give create, edit and view permissions to the workspace
        UpdateRoleEntityDTO workspaceEntity = new UpdateRoleEntityDTO(
                Workspace.class.getSimpleName(),
                createdWorkspace.getId(),
                List.of(0, 1, 0, 1, 0, 0),
                createdWorkspace.getName()
        );
        UpdateRoleEntityDTO applicationEntity = new UpdateRoleEntityDTO(
                Application.class.getSimpleName(),
                createdApplication.getId(),
                List.of(0, 1, 0, 1, 0, 0),
                createdApplication.getName()
        );
        UpdateRoleEntityDTO pageEntity = new UpdateRoleEntityDTO(
                NewPage.class.getSimpleName(),
                createdApplication.getPages().get(0).getId(),
                List.of(0, 1, 0, 1, -1, -1),
                "unnecessary name"
        );
        UpdateRoleEntityDTO actionEntity = new UpdateRoleEntityDTO(
                NewAction.class.getSimpleName(),
                createdAction.getId(),
                List.of(-1, 1, 0, 1, -1, -1),
                "unnecessary name"
        );
        updateRoleConfigDTO.setEntitiesChanged(Set.of(
                workspaceEntity,
                applicationEntity,
                pageEntity,
                actionEntity
        ));
        updateRoleConfigDTO.setTabName(RoleTab.APPLICATION_RESOURCES.getName());

        Mono<RoleViewDTO> roleConfigChangeMono = roleConfigurationSolution.updateRoles(createdPermissionGroup.getId(), updateRoleConfigDTO);

        StepVerifier.create(roleConfigChangeMono)
                .assertNext(roleViewDTO -> {
                    assertThat(roleViewDTO).isNotNull();
                    BaseView workspaceView = roleViewDTO.getTabs().get(RoleTab.APPLICATION_RESOURCES.getName())
                            .getData()
                            .getEntities()
                            .stream()
                            .filter(baseView -> baseView.getId().equals(createdWorkspace.getId()))
                            .findFirst().get();

                    assertThat(workspaceView.getEnabled()).isEqualTo(List.of(0, 1, 0, 1, 0, 0));

                    BaseView applicationView = workspaceView.getChildren().stream().findFirst().get().getEntities().stream().findFirst().get();
                    assertThat(applicationView.getEnabled()).isEqualTo(List.of(0, 1, 0, 1, 0, 0));

                    BaseView pageView = applicationView.getChildren().stream().findFirst().get().getEntities().stream().findFirst().get();
                    assertThat(pageView.getEnabled()).isEqualTo(List.of(0, 1, 0, 1, -1, -1));

                    BaseView actionView = pageView.getChildren().stream().findFirst().get().getEntities().stream().findFirst().get();
                    assertThat(actionView.getEnabled()).isEqualTo(List.of(-1, 1, 0, 1, -1, -1));


                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    @DirtiesContext
    public void testSaveRoleConfigurationChangesForApplicationResourcesTab_givenViewOnApp_assertViewOnWorkspace() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Workspace workspace = new Workspace();
        workspace.setName("testSaveRoleConfigurationChangesForApplicationResourcesTab_givenViewOnApp_assertViewOnWorkspace workspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("testSaveRoleConfigurationChangesForApplicationResourcesTab_givenViewOnApp_assertViewOnWorkspace application");
        Application createdApplication = applicationPageService.createApplication(application, workspace.getId()).block();

        Datasource datasource = new Datasource();
        datasource.setName("Default Database : testSaveRoleConfigurationChangesForApplicationResourcesTab_givenViewOnApp_assertViewOnWorkspace");
        datasource.setWorkspaceId(createdWorkspace.getId());
        Plugin installed_plugin = pluginRepository.findByPackageName("restapi-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        datasource.setDatasourceConfiguration(new DatasourceConfiguration());

        ActionDTO action = new ActionDTO();
        action.setName("validAction : testSaveRoleConfigurationChangesForApplicationResourcesTab_givenViewOnApp_assertViewOnWorkspace");
        action.setPageId(createdApplication.getPages().get(0).getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        ActionDTO createdAction = layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for editing : testSaveRoleConfigurationChangesForApplicationResourcesTab_givenViewOnApp_assertViewOnWorkspace");
        PermissionGroup createdPermissionGroup = permissionGroupService.create(permissionGroup).block();

        UpdateRoleConfigDTO updateRoleConfigDTO = new UpdateRoleConfigDTO();

        // Add entity changes
        // Application : Give view permissions to the application and its children

        UpdateRoleEntityDTO applicationEntity = new UpdateRoleEntityDTO(
                Application.class.getSimpleName(),
                createdApplication.getId(),
                List.of(0, 0, 0, 1, 0, 0),
                createdApplication.getName()
        );
        UpdateRoleEntityDTO pageEntity = new UpdateRoleEntityDTO(
                NewPage.class.getSimpleName(),
                createdApplication.getPages().get(0).getId(),
                List.of(0, 0, 0, 1, -1, -1),
                "unnecessary name"
        );
        UpdateRoleEntityDTO actionEntity = new UpdateRoleEntityDTO(
                NewAction.class.getSimpleName(),
                createdAction.getId(),
                List.of(-1, 0, 0, 0, -1, -1),
                "unnecessary name"
        );
        updateRoleConfigDTO.setEntitiesChanged(Set.of(
                applicationEntity,
                pageEntity,
                actionEntity
        ));
        updateRoleConfigDTO.setTabName(RoleTab.APPLICATION_RESOURCES.getName());

        Mono<RoleViewDTO> roleConfigChangeMono = roleConfigurationSolution.updateRoles(createdPermissionGroup.getId(), updateRoleConfigDTO)
                .cache();

        // fetch the workspace post the role change with read permissions
        Mono<Workspace> workspaceWithReadMono = roleConfigChangeMono.then(Mono.defer(() -> {
            Mono<Workspace> workspaceMono = workspaceService.findById(createdWorkspace.getId(), READ_WORKSPACES);
            return workspaceMono;
        }));

        StepVerifier.create(Mono.zip(roleConfigChangeMono, workspaceWithReadMono))
                .assertNext(tuple -> {
                    RoleViewDTO roleViewDTO = tuple.getT1();

                    assertThat(roleViewDTO).isNotNull();
                    BaseView workspaceView = roleViewDTO.getTabs().get(RoleTab.APPLICATION_RESOURCES.getName())
                            .getData()
                            .getEntities()
                            .stream()
                            .filter(baseView -> baseView.getId().equals(createdWorkspace.getId()))
                            .findFirst().get();

                    BaseView applicationView = workspaceView.getChildren().stream().findFirst().get().getEntities().stream().findFirst().get();
                    assertThat(applicationView.getEnabled()).isEqualTo(List.of(0, 0, 0, 1, 0, 0));

                    BaseView pageView = applicationView.getChildren().stream().findFirst().get().getEntities().stream().findFirst().get();
                    assertThat(pageView.getEnabled()).isEqualTo(List.of(0, 0, 0, 1, -1, -1));

                    BaseView actionView = pageView.getChildren().stream().findFirst().get().getEntities().stream().findFirst().get();
                    assertThat(actionView.getEnabled()).isEqualTo(List.of(-1, 0, 0, 0, -1, -1));

                    // Assert that workspace read has been given read permission for this permission group
                    Workspace workspaceFromDb = tuple.getT2();
                    assertThat(workspaceFromDb).isNotNull();
                    Policy readWorkspacePolicy = workspaceFromDb.getPolicies().stream()
                            .filter(policy -> policy.getPermission().equals(READ_WORKSPACES.getValue()))
                            .findFirst().get();
                    assertThat(readWorkspacePolicy.getPermissionGroups()).contains(createdPermissionGroup.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    @DirtiesContext
    public void testSaveRoleConfigurationChangesForApplicationResourcesTab_givenRemoveViewOnApp_assertNoViewOnWorkspace() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Workspace workspace = new Workspace();
        workspace.setName("testSaveRoleConfigurationChangesForApplicationResourcesTab_givenRemoveViewOnApp_assertNoViewOnWorkspace workspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("testSaveRoleConfigurationChangesForApplicationResourcesTab_givenRemoveViewOnApp_assertNoViewOnWorkspace application");
        Application createdApplication = applicationPageService.createApplication(application, workspace.getId()).block();

        Datasource datasource = new Datasource();
        datasource.setName("Default Database : testSaveRoleConfigurationChangesForApplicationResourcesTab_givenRemoveViewOnApp_assertNoViewOnWorkspace");
        datasource.setWorkspaceId(createdWorkspace.getId());
        Plugin installed_plugin = pluginRepository.findByPackageName("restapi-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        datasource.setDatasourceConfiguration(new DatasourceConfiguration());

        ActionDTO action = new ActionDTO();
        action.setName("validAction : testSaveRoleConfigurationChangesForApplicationResourcesTab_givenRemoveViewOnApp_assertNoViewOnWorkspace");
        action.setPageId(createdApplication.getPages().get(0).getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        ActionDTO createdAction = layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for editing : testSaveRoleConfigurationChangesForApplicationResourcesTab_givenRemoveViewOnApp_assertNoViewOnWorkspace");
        PermissionGroup createdPermissionGroup = permissionGroupService.create(permissionGroup).block();

        UpdateRoleConfigDTO updateRoleConfigDTO = new UpdateRoleConfigDTO();

        // Add entity changes
        // Application : Give view permissions to the application and its children

        UpdateRoleEntityDTO applicationEntity = new UpdateRoleEntityDTO(
                Application.class.getSimpleName(),
                createdApplication.getId(),
                List.of(0, 0, 0, 1, 0, 0),
                createdApplication.getName()
        );
        UpdateRoleEntityDTO pageEntity = new UpdateRoleEntityDTO(
                NewPage.class.getSimpleName(),
                createdApplication.getPages().get(0).getId(),
                List.of(0, 0, 0, 1, -1, -1),
                "unnecessary name"
        );
        UpdateRoleEntityDTO actionEntity = new UpdateRoleEntityDTO(
                NewAction.class.getSimpleName(),
                createdAction.getId(),
                List.of(-1, 0, 0, 0, -1, -1),
                "unnecessary name"
        );
        updateRoleConfigDTO.setEntitiesChanged(Set.of(
                applicationEntity,
                pageEntity,
                actionEntity
        ));
        updateRoleConfigDTO.setTabName(RoleTab.APPLICATION_RESOURCES.getName());

        roleConfigurationSolution.updateRoles(createdPermissionGroup.getId(), updateRoleConfigDTO).block();

        // Now remove the view access from the application
        updateRoleConfigDTO = new UpdateRoleConfigDTO();
        applicationEntity = new UpdateRoleEntityDTO(
                Application.class.getSimpleName(),
                createdApplication.getId(),
                List.of(0, 0, 0, 0, 0, 0),
                createdApplication.getName()
        );
        pageEntity = new UpdateRoleEntityDTO(
                NewPage.class.getSimpleName(),
                createdApplication.getPages().get(0).getId(),
                List.of(0, 0, 0, 0, -1, -1),
                "unnecessary name"
        );
        updateRoleConfigDTO.setEntitiesChanged(Set.of(
                applicationEntity,
                pageEntity
        ));
        updateRoleConfigDTO.setTabName(RoleTab.APPLICATION_RESOURCES.getName());

        Mono<RoleViewDTO> roleConfigChangeMono = roleConfigurationSolution.updateRoles(createdPermissionGroup.getId(), updateRoleConfigDTO).cache();

        // fetch the workspace post the role change with read permissions
        Mono<Workspace> workspaceWithReadMono = roleConfigChangeMono.then(Mono.defer(() -> {
            Mono<Workspace> workspaceMono = workspaceService.findById(createdWorkspace.getId(), READ_WORKSPACES);
            return workspaceMono;
        }));

        StepVerifier.create(Mono.zip(roleConfigChangeMono, workspaceWithReadMono))
                .assertNext(tuple -> {
                    RoleViewDTO roleViewDTO = tuple.getT1();

                    assertThat(roleViewDTO).isNotNull();
                    BaseView workspaceView = roleViewDTO.getTabs().get(RoleTab.APPLICATION_RESOURCES.getName())
                            .getData()
                            .getEntities()
                            .stream()
                            .filter(baseView -> baseView.getId().equals(createdWorkspace.getId()))
                            .findFirst().get();

                    BaseView applicationView = workspaceView.getChildren().stream().findFirst().get().getEntities().stream().findFirst().get();
                    assertThat(applicationView.getEnabled()).isEqualTo(List.of(0, 0, 0, 0, 0, 0));

                    BaseView pageView = applicationView.getChildren().stream().findFirst().get().getEntities().stream().findFirst().get();
                    assertThat(pageView.getEnabled()).isEqualTo(List.of(0, 0, 0, 0, -1, -1));

                    BaseView actionView = pageView.getChildren().stream().findFirst().get().getEntities().stream().findFirst().get();
                    assertThat(actionView.getEnabled()).isEqualTo(List.of(-1, 0, 0, 0, -1, -1));

                    // Assert that workspace read has been given read permission for this permission group
                    Workspace workspaceFromDb = tuple.getT2();
                    assertThat(workspaceFromDb).isNotNull();
                    Policy readWorkspacePolicy = workspaceFromDb.getPolicies().stream()
                            .filter(policy -> policy.getPermission().equals(READ_WORKSPACES.getValue()))
                            .findFirst().get();
                    assertThat(readWorkspacePolicy.getPermissionGroups()).doesNotContain(createdPermissionGroup.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testApplicationResourcesTab_testDisableHelperMap() {
        Workspace workspace = new Workspace();
        workspace.setName("testApplicationResourcesTab_testDisableHelperMap workspace");
        Workspace createdWorkspace1 = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("testApplicationResourcesTab_testDisableHelperMap application");
        Application createdApplication1 = applicationPageService.createApplication(application, createdWorkspace1.getId()).block();

        Datasource datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(createdWorkspace1.getId());
        Plugin installed_plugin = pluginRepository.findByPackageName("restapi-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        datasource.setDatasourceConfiguration(new DatasourceConfiguration());

        ActionDTO action = new ActionDTO();
        action.setName("validAction");
        action.setPageId(createdApplication1.getPages().get(0).getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        ActionDTO createdAction = layoutActionService.createAction(action).block();

        CommonAppsmithObjectData dataFromRepositoryForAllTabs = workspaceResources.getDataFromRepositoryForAllTabs();

        Set<String> defaultPermissionGroupIds = createdWorkspace1.getDefaultPermissionGroups();
        PermissionGroup adminPermissionGroup = permissionGroupRepository.findAllById(defaultPermissionGroupIds)
                .collect(Collectors.toSet()).block()
                .stream().filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst().get();

        RoleTabDTO roleTabDTO = workspaceResources
                .createApplicationResourcesTabView(adminPermissionGroup.getId(), dataFromRepositoryForAllTabs)
                .block();

        assertThat(roleTabDTO).isNotNull();
        Map<String, Set<IdPermissionDTO>> disableHelperMao = roleTabDTO.getDisableHelperMap();
        assertThat(disableHelperMao).isNotNull();

        String createdPageId = createdApplication1.getPages().get(0).getId();
        String createdActionId = createdAction.getId();
        String createdWorkspaceEdit = createdWorkspace1.getId() + "_Edit";
        String createdApplicationEdit = createdApplication1.getId() + "_Edit";
        String createdPageEdit = createdPageId + "_Edit";
        String createdActionEdit = createdActionId + "_Edit";

        // asserting a few relationships to exist in the map
        assertThat(disableHelperMao).contains(Map.entry(createdWorkspaceEdit, Set.of(
                new IdPermissionDTO(createdWorkspace1.getId(), PermissionViewableName.VIEW))));
        assertThat(disableHelperMao).contains(Map.entry(createdApplicationEdit, Set.of(
                new IdPermissionDTO(createdApplication1.getId(), PermissionViewableName.VIEW))));
        assertThat(disableHelperMao).contains(Map.entry(createdPageEdit, Set.of(
                new IdPermissionDTO(createdPageId, PermissionViewableName.VIEW)
        )));
        assertThat(disableHelperMao.get(createdActionEdit)).containsAll(Set.of(
                new IdPermissionDTO(createdActionId, PermissionViewableName.VIEW)
        ));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testDatasourceResourcesTab_testDisableHelperMap() {
        Workspace workspace = new Workspace();
        workspace.setName("testDatasourceResourcesTab_testDisableHelperMap workspace");
        Workspace createdWorkspace1 = workspaceService.create(workspace).block();

        Datasource datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(createdWorkspace1.getId());
        Plugin installed_plugin = pluginRepository.findByPackageName("restapi-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        datasource.setDatasourceConfiguration(new DatasourceConfiguration());
        Datasource createdDatasource = datasourceService.create(datasource).block();


        CommonAppsmithObjectData dataFromRepositoryForAllTabs = workspaceResources.getDataFromRepositoryForAllTabs();

        Set<String> defaultPermissionGroupIds = createdWorkspace1.getDefaultPermissionGroups();
        PermissionGroup adminPermissionGroup = permissionGroupRepository.findAllById(defaultPermissionGroupIds)
                .collect(Collectors.toSet()).block()
                .stream().filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst().get();

        RoleTabDTO roleTabDTO = workspaceResources
                .createDatasourceResourcesTabView(adminPermissionGroup.getId(), dataFromRepositoryForAllTabs)
                .block();

        assertThat(roleTabDTO).isNotNull();
        Map<String, Set<IdPermissionDTO>> disableHelperMao = roleTabDTO.getDisableHelperMap();
        assertThat(disableHelperMao).isNotNull();


        String createdWorkspaceEdit = createdWorkspace1.getId() + "_Edit";
        String createdWorkspaceCreate = createdWorkspace1.getId() + "_Create";
        String createdDatasourceEdit = createdDatasource.getId() + "_Edit";
        String createdDatasourceCreate = createdDatasource.getId() + "_Create";

        // asserting a few relationships to exist in the map
        assertThat(disableHelperMao.get(createdWorkspaceEdit)).containsAll(Set.of(
                new IdPermissionDTO(createdWorkspace1.getId(), PermissionViewableName.VIEW),
                new IdPermissionDTO(createdWorkspace1.getId(), PermissionViewableName.EXECUTE)
        ));
        assertThat(disableHelperMao.get(createdWorkspaceCreate)).containsAll(Set.of(
                new IdPermissionDTO(createdWorkspace1.getId(), PermissionViewableName.DELETE)
        ));
        assertThat(disableHelperMao.get(createdDatasourceEdit)).containsAll(Set.of(
                new IdPermissionDTO(createdDatasource.getId(), PermissionViewableName.VIEW),
                new IdPermissionDTO(createdDatasource.getId(), PermissionViewableName.EXECUTE)
        ));

    }

    @Test
    @WithUserDetails(value = "api_user")
    @DirtiesContext
    public void testSaveRoleConfigurationChangesForApplicationResourcesTab_givenEditAndView_assertCustomThemePermissions() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Workspace workspace = new Workspace();
        workspace.setName("testSaveRoleConfigurationChangesForApplicationResourcesTab_givenEditAndView_assertCustomThemePermissions workspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("testSaveRoleConfigurationChangesForApplicationResourcesTab_givenEditAndView_assertCustomThemePermissions application");
        Application createdApplication = applicationPageService.createApplication(application, createdWorkspace.getId()).block();

        Theme systemDefaultTheme = themeService.getThemeById(application.getEditModeThemeId(), READ_THEMES).block();

        String applicationId = application.getId();
        // publish the app to ensure system theme gets set
        applicationPageService.publish(application.getId(), TRUE).block();

        // Create and apply custom theme in edit mode.
        Theme customTheme = new Theme();
        customTheme.setDisplayName("My custom theme");
        themeService.persistCurrentTheme(application.getId(), null, customTheme)
                .flatMap(theme -> themeService.changeCurrentTheme(theme.getId(), applicationId, null))
                .block();
        application = applicationRepository.findById(applicationId).block();

        // Apply theme customization.
        Theme themeCustomization = new Theme();
        themeCustomization.setDisplayName("Updated name");
        Mono<Theme> updateThemeMono = themeService.updateTheme(application.getId(), null, themeCustomization);


        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for editing : testSaveRoleConfigurationChangesForApplicationResourcesTab_givenEditAndView_assertCustomThemePermissions");
        PermissionGroup createdPermissionGroup = permissionGroupService.create(permissionGroup).block();

        UpdateRoleConfigDTO updateRoleConfigDTO = new UpdateRoleConfigDTO();

        // Add entity changes
        // Application : Give edit and view permissions to the application
        UpdateRoleEntityDTO applicationEntity = new UpdateRoleEntityDTO(
                Application.class.getSimpleName(),
                createdApplication.getId(),
                List.of(0, 1, 0, 1, 0, 0),
                createdApplication.getName()
        );
        updateRoleConfigDTO.setEntitiesChanged(Set.of(
                applicationEntity
        ));
        updateRoleConfigDTO.setTabName(RoleTab.APPLICATION_RESOURCES.getName());

        // Make the role configuration changes in a blocking manner
        roleConfigurationSolution.updateRoles(createdPermissionGroup.getId(), updateRoleConfigDTO).block();

        // Fetch the application again to ensure the changes are persisted
        // Fetch the themes : 1. Edit mode theme is custom, so we should hav gotten edit and view theme permissions. 2. View mode theme is system default, so we should not have updated the policies.

        Application updatedApplication = applicationRepository.findById(createdApplication.getId()).block();

        Theme editModeTheme = themeRepository.findById(updatedApplication.getEditModeThemeId(), READ_THEMES).block();

        Theme publishedModeTheme = themeRepository.findById(updatedApplication.getPublishedModeThemeId(), READ_THEMES).block();


        // Assert that application policy update happened
        updatedApplication.getPolicies().stream().forEach(
                policy -> {
                    if (policy.getPermission().equals(MANAGE_APPLICATIONS.getValue())) {
                        assertThat(policy.getPermissionGroups()).contains(createdPermissionGroup.getId());
                    } else if (policy.getPermission().equals(READ_APPLICATIONS.getValue())) {
                        assertThat(policy.getPermissionGroups()).contains(createdPermissionGroup.getId());
                    }
                }
        );

        // Assert that edit mode theme policy update happened
        editModeTheme.getPolicies().stream().forEach(
                policy -> {
                    if (policy.getPermission().equals(MANAGE_THEMES.getValue())) {
                        assertThat(policy.getPermissionGroups()).contains(createdPermissionGroup.getId());
                    } else if (policy.getPermission().equals(READ_THEMES.getValue())) {
                        assertThat(policy.getPermissionGroups()).contains(createdPermissionGroup.getId());
                    }
                }
        );

        // Assert that published mode theme policy update did not happen
        assertThat(publishedModeTheme.isSystemTheme()).isTrue();
        publishedModeTheme.getPolicies().stream().forEach(
                policy -> {
                    if (policy.getPermission().equals(MANAGE_THEMES.getValue())) {
                        assertThat(policy.getPermissionGroups()).doesNotContain(createdPermissionGroup.getId());
                    } else if (policy.getPermission().equals(READ_THEMES.getValue())) {
                        assertThat(policy.getPermissionGroups()).doesNotContain(createdPermissionGroup.getId());
                    }
                }
        );

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testSaveRoleConfigurationChangesForApplicationResourcesTab_assertExecuteActionOnPageUpdate() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Workspace workspace = new Workspace();
        workspace.setName("testSaveRoleConfigurationChangesForApplicationResourcesTab_assertExecuteActionOnPageUpdate workspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("testSaveRoleConfigurationChangesForApplicationResourcesTab_assertExecuteActionOnPageUpdate application");
        Application createdApplication = applicationPageService.createApplication(application, workspace.getId()).block();

        Datasource datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(createdWorkspace.getId());
        Plugin installed_plugin = pluginRepository.findByPackageName("restapi-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        datasource.setDatasourceConfiguration(new DatasourceConfiguration());

        ActionDTO action = new ActionDTO();
        action.setName("validAction");
        action.setPageId(createdApplication.getPages().get(0).getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        ActionDTO createdAction = layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for editing");
        PermissionGroup createdPermissionGroup = permissionGroupService.create(permissionGroup).block();

        UpdateRoleConfigDTO updateRoleConfigDTO = new UpdateRoleConfigDTO();

        // Add entity changes
        // Workspace : Give create, edit and view permissions to the workspace
        UpdateRoleEntityDTO workspaceEntity = new UpdateRoleEntityDTO(
                Workspace.class.getSimpleName(),
                createdWorkspace.getId(),
                List.of(0, 1, 0, 1, 0, 0),
                createdWorkspace.getName()
        );
        UpdateRoleEntityDTO applicationEntity = new UpdateRoleEntityDTO(
                Application.class.getSimpleName(),
                createdApplication.getId(),
                List.of(0, 1, 0, 1, 0, 0),
                createdApplication.getName()
        );
        UpdateRoleEntityDTO pageEntity = new UpdateRoleEntityDTO(
                NewPage.class.getSimpleName(),
                createdApplication.getPages().get(0).getId(),
                List.of(0, 1, 0, 1, -1, -1),
                "unnecessary name"
        );
        UpdateRoleEntityDTO actionEntity = new UpdateRoleEntityDTO(
                NewAction.class.getSimpleName(),
                createdAction.getId(),
                List.of(-1, 1, 0, 1, -1, -1),
                "unnecessary name"
        );
        updateRoleConfigDTO.setEntitiesChanged(Set.of(
                workspaceEntity,
                applicationEntity,
                pageEntity,
                actionEntity
        ));
        updateRoleConfigDTO.setTabName(RoleTab.APPLICATION_RESOURCES.getName());

        Mono<NewAction> actionPostUpdateMono = roleConfigurationSolution.updateRoles(createdPermissionGroup.getId(), updateRoleConfigDTO)
                .then(newActionRepository.findById(createdAction.getId()));

        StepVerifier.create(actionPostUpdateMono)
                .assertNext(actionPostUpdate -> {

                    actionPostUpdate.getPolicies().stream().forEach(
                            policy -> {
                                if (policy.getPermission().equals(EXECUTE_ACTIONS.getValue())) {
                                    assertThat(policy.getPermissionGroups()).contains(createdPermissionGroup.getId());
                                }
                            }
                    );

                })
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "api_user")
    @DirtiesContext
    public void testUpdateRoles_updateGroupsAndRoles() {
        Workspace workspace = new Workspace();
        workspace.setName("testUpdateRoles_updateGroupsAndRoles workspace");
        Workspace createdWs = workspaceService.create(workspace).block();

        List<PermissionGroup> autoCreatedPgs = permissionGroupRepository
                .findAllById(createdWs.getDefaultPermissionGroups())
                .collectList().block();

        PermissionGroup adminPg = autoCreatedPgs.stream().filter(pg -> pg.getName().startsWith(ADMINISTRATOR)).findFirst().get();
        PermissionGroup devPg = autoCreatedPgs.stream().filter(pg -> pg.getName().startsWith(DEVELOPER)).findFirst().get();
        PermissionGroup viewPg = autoCreatedPgs.stream().filter(pg -> pg.getName().startsWith(VIEWER)).findFirst().get();

        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for editing : testUpdateRoles_updateGroupsAndRoles");
        PermissionGroup createdPg = permissionGroupService.create(permissionGroup).block();

        String tenantId = tenantService.getDefaultTenantId().block();

        /*
         * Permissions which can be provided for Groups and Roles Tab:
         * CREATE, EDIT, DELETE, VIEW, INVITE_USER, REMOVE_USER, ASSOCIATE_ROLE
         * Note: The permissions are supposed to be given in this order only.
         * 0 -> Permission has been disabled
         * 1 -> Permission has been enabled
         * -1 -> Permission can't be given
         */
        UpdateRoleEntityDTO tenantEntityDto = new UpdateRoleEntityDTO(Tenant.class.getSimpleName(),
                tenantId, List.of(1, 1, 1, 1, -1, -1, 1), "Roles");
        UpdateRoleEntityDTO adminPgEntityDto = new UpdateRoleEntityDTO(PermissionGroup.class.getSimpleName(),
                adminPg.getId(), List.of(-1, -1, -1, 1, -1, -1, 1), adminPg.getName());
        UpdateRoleEntityDTO devPgEntityDto = new UpdateRoleEntityDTO(PermissionGroup.class.getSimpleName(),
                devPg.getId(), List.of(-1, -1, -1, 1, -1, -1, 1), devPg.getName());
        UpdateRoleEntityDTO viewPgEntityDto = new UpdateRoleEntityDTO(PermissionGroup.class.getSimpleName(),
                viewPg.getId(), List.of(-1, -1, -1, 1, -1, -1, 1), viewPg.getName());
        UpdateRoleEntityDTO createdPgEntityDto = new UpdateRoleEntityDTO(PermissionGroup.class.getSimpleName(),
                createdPg.getId(), List.of(-1, 1, 1, 1, -1, -1, 1), createdPg.getName());
        UpdateRoleConfigDTO updateRoleConfigDto = new UpdateRoleConfigDTO();
        updateRoleConfigDto.setTabName(RoleTab.GROUPS_ROLES.getName());
        updateRoleConfigDto.setEntitiesChanged(Set.of(tenantEntityDto, adminPgEntityDto, devPgEntityDto,
                viewPgEntityDto, createdPgEntityDto));

        RoleViewDTO updatedRoleViewDto = roleConfigurationSolution.updateRoles(createdPg.getId(), updateRoleConfigDto).block();

        EntityView groupsAndRolesView = updatedRoleViewDto.getTabs().get(RoleTab.GROUPS_ROLES.getName()).getData();
        BaseView rolesView = groupsAndRolesView.getEntities().stream()
                .filter(entity -> entity.getName().equals("Roles")).findFirst().get();

        BaseView adminPgBaseView = rolesView.getChildren().stream().findAny().get()
                .getEntities().stream().filter(entity -> entity.getId().equals(adminPg.getId()))
                .findFirst().get();
        BaseView devPgBaseView = rolesView.getChildren().stream().findAny().get()
                .getEntities().stream().filter(entity -> entity.getId().equals(devPg.getId()))
                .findFirst().get();
        BaseView viewPgBaseView = rolesView.getChildren().stream().findAny().get()
                .getEntities().stream().filter(entity -> entity.getId().equals(viewPg.getId()))
                .findFirst().get();
        BaseView createdPgBaseView = rolesView.getChildren().stream().findAny().get()
                .getEntities().stream().filter(entity -> entity.getId().equals(createdPg.getId()))
                .findFirst().get();

        assertThat(rolesView.getId()).isEqualTo(tenantId);
        assertThat(rolesView.getEnabled()).isEqualTo(List.of(1, 1, 1, 1, -1, -1, 1));
        assertThat(adminPgBaseView.getEnabled()).isEqualTo(List.of(-1, -1, -1, 1, -1, -1, 1));
        assertThat(devPgBaseView.getEnabled()).isEqualTo(List.of(-1, -1, -1, 1, -1, -1, 1));
        assertThat(viewPgBaseView.getEnabled()).isEqualTo(List.of(-1, -1, -1, 1, -1, -1, 1));
        assertThat(createdPgBaseView.getEnabled()).isEqualTo(List.of(-1, 1, 1, 1, -1, -1, 1));
    }

    @Test
    @WithUserDetails(value = "api_user")
    @DirtiesContext
    public void testUpdateRoles_updateGroupsAndRoles_updateRestrictedPermissions() {
        Workspace workspace = new Workspace();
        workspace.setName("testUpdateRoles_updateGroupsAndRoles_updateRestrictedPermissions workspace");
        Workspace createdWs = workspaceService.create(workspace).block();

        List<PermissionGroup> autoCreatedPgs = permissionGroupRepository
                .findAllById(createdWs.getDefaultPermissionGroups())
                .collectList().block();

        PermissionGroup adminPg = autoCreatedPgs.stream().filter(pg -> pg.getName().startsWith(ADMINISTRATOR)).findFirst().get();

        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for editing : testUpdateRoles_updateGroupsAndRoles_updateRestrictedPermissions");
        PermissionGroup createdPg = permissionGroupService.create(permissionGroup).block();

        /*
         * Permissions which can be provided for Groups and Roles Tab:
         * CREATE, EDIT, DELETE, VIEW, INVITE_USER, REMOVE_USER, ASSOCIATE_ROLE
         * Note: The permissions are supposed to be given in this order only.
         * 0 -> Permission has been disabled
         * 1 -> Permission has been enabled
         * -1 -> Permission can't be given
         *
         * Here we are trying to give EDIT and DELETE permissions for an auto-created role to a custom created role
         * above and this will fail because no user should have EDIT or DELETE permissions for auto-created roles.
         */
        UpdateRoleEntityDTO adminPgEntityDto = new UpdateRoleEntityDTO(PermissionGroup.class.getSimpleName(),
                adminPg.getId(), List.of(-1, 1, 1, 1, -1, -1, 1), adminPg.getName());
        UpdateRoleConfigDTO updateRoleConfigDto = new UpdateRoleConfigDTO();
        updateRoleConfigDto.setTabName(RoleTab.GROUPS_ROLES.getName());
        updateRoleConfigDto.setEntitiesChanged(Set.of(adminPgEntityDto));

        Mono<RoleViewDTO> updatedRoleViewDtoMono = roleConfigurationSolution.updateRoles(createdPg.getId(), updateRoleConfigDto);

        StepVerifier.create(updatedRoleViewDtoMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.ACTION_IS_NOT_AUTHORIZED.getMessage("Update restricted permissions")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void test_actionCollectionPermissionSideEffectToRelatedAction() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for editing");
        PermissionGroup createdPermissionGroup = permissionGroupService.create(permissionGroup).block();

        Workspace workspace = new Workspace();
        workspace.setName("test_actionCollectionPermissionSideEffectToRelatedAction workspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("test_actionCollectionPermissionSideEffectToRelatedAction application");
        Application createdApplication = applicationPageService.createApplication(application, workspace.getId()).block();

        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("testCollection");
        actionCollectionDTO.setPageId(createdApplication.getPages().get(0).getId());
        actionCollectionDTO.setApplicationId(createdApplication.getId());
        actionCollectionDTO.setWorkspaceId(createdWorkspace.getId());
        actionCollectionDTO.setPluginId(pluginRepository.findByPackageName("installed-js-plugin").block().getId());
        actionCollectionDTO.setPluginType(PluginType.JS);
        ActionDTO action = new ActionDTO();
        action.setName("testAction");
        action.setActionConfiguration(new ActionConfiguration());
        action.getActionConfiguration().setBody("mockBody");
        actionCollectionDTO.setActions(List.of(action));
        actionCollectionDTO.setPluginType(PluginType.JS);
        actionCollectionDTO.setBody("export default { x: 1 }");

        ActionCollectionDTO createdActionCollectionDTO = layoutCollectionService.createCollection(actionCollectionDTO).block();

        UpdateRoleConfigDTO updateRoleConfigDTO = new UpdateRoleConfigDTO();
        updateRoleConfigDTO.setTabName(RoleTab.APPLICATION_RESOURCES.getName());
        updateRoleConfigDTO.setEntitiesChanged(Set.of(
                new UpdateRoleEntityDTO(ActionCollection.class.getSimpleName(), createdActionCollectionDTO.getId(), List.of(-1, 1, 0, 1, -1, -1), createdActionCollectionDTO.getName())));
        List<NewAction> actionsBeforeRoleUpdate = newActionRepository
                .findAllByActionCollectionIdWithoutPermissions(List.of(actionCollectionDTO.getId()), null)
                .collectList().block();
        RoleViewDTO roleViewDTO = roleConfigurationSolution.updateRoles(createdPermissionGroup.getId(), updateRoleConfigDTO).block();
        List<NewAction> actionsAfterRoleUpdate = newActionRepository
                .findAllByActionCollectionIdWithoutPermissions(List.of(actionCollectionDTO.getId()), null)
                .collectList().block();

        assertThat(actionsBeforeRoleUpdate).hasSize(1);
        NewAction newActionBeforeRoleUpdate = actionsBeforeRoleUpdate.get(0);
        Optional<Policy> manageActionPolicyBeforeRoleUpdate = newActionBeforeRoleUpdate.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(MANAGE_ACTIONS.getValue()))
                .findFirst();
        assertThat(manageActionPolicyBeforeRoleUpdate.isPresent()).isTrue();
        assertThat(manageActionPolicyBeforeRoleUpdate.get().getPermissionGroups()).doesNotContain(createdPermissionGroup.getId());

        assertThat(actionsAfterRoleUpdate).hasSize(1);
        NewAction newActionAfterRoleUpdate = actionsAfterRoleUpdate.get(0);
        Optional<Policy> manageActionPolicyAfterRoleUpdate = newActionAfterRoleUpdate.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(MANAGE_ACTIONS.getValue()))
                .findFirst();
        assertThat(manageActionPolicyAfterRoleUpdate.isPresent()).isTrue();
        assertThat(manageActionPolicyAfterRoleUpdate.get().getPermissionGroups()).contains(createdPermissionGroup.getId());
    }

}
