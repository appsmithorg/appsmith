package com.appsmith.server.solutions.roles;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.roles.constants.RoleTab;
import com.appsmith.server.solutions.roles.dtos.ActionResourceDTO;
import com.appsmith.server.solutions.roles.dtos.BaseView;
import com.appsmith.server.solutions.roles.dtos.EntityView;
import com.appsmith.server.solutions.roles.dtos.RoleTabDTO;
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
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.FieldName.ADMINISTRATOR;
import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

@SpringBootTest
@ExtendWith(SpringExtension.class)
@DirtiesContext
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

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    User api_user = null;

    String superAdminPermissionGroupId = null;

    Workspace createdWorkspace;
    Application createdApplication;
    Datasource createdDatasource;
    ActionDTO createdActionDto;

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
        Datasource toCreate = new Datasource();
        toCreate.setName("Default Database");
        toCreate.setWorkspaceId(createdWorkspace.getId());
        Plugin restApiPlugin = pluginService.findByPackageName("restapi-plugin").block();
        toCreate.setPluginId(restApiPlugin.getId());
        createdDatasource = datasourceService.create(toCreate).block();

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
                    // user's apps created from SeedMongo + workspace created during setup
                    assertThat(workspaces.size()).isEqualTo(2);
                    Workspace workspace1 = workspaces.stream().filter(workspace -> workspace.getName().equals(createdWorkspace.getName())).findFirst().get();
                    assertThat(workspace1.getId()).isEqualTo(createdWorkspace.getId());
                })
                .verifyComplete();


        Flux<Application> applicationFlux = dataFromRepositoryForAllTabs.getApplicationFlux();
        StepVerifier.create(applicationFlux)
                .assertNext(application -> {
                    assert application.getName().equals(createdApplication.getName());
                })
                .verifyComplete();

        Flux<Datasource> datasourceFlux = dataFromRepositoryForAllTabs.getDatasourceFlux();
        StepVerifier.create(datasourceFlux)
                .assertNext(datasource -> {
                    assert datasource.getName().equals(createdDatasource.getName());
                })
                .verifyComplete();

        Flux<NewPage> pageFlux = dataFromRepositoryForAllTabs.getPageFlux();
        StepVerifier.create(pageFlux)
                .assertNext(page -> {
                    assert page.getId().equals(createdApplication.getPages().get(0).getId());
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
                    List<Integer> perms = List.of(0,0,0,0,0,0);
                    assertThat(createdWorkspaceView.getEnabled()).isEqualTo(perms);
                    // Only kind of child present in workspace in this tab : aka application
                    assertThat(createdWorkspaceView.getChildren().size()).isEqualTo(1);

                    EntityView createdApplicationEntityView = createdWorkspaceView.getChildren().stream().findFirst().get();
                    assertThat(createdApplicationEntityView.getType()).isEqualTo(Application.class.getSimpleName());
                    // We created only one application in this workspace. Assert that the same has been read into the view
                    assertThat(createdApplicationEntityView.getEntities().size()).isEqualTo(1);
                    BaseView createdApplicationView = createdApplicationEntityView.getEntities().get(0);
                    assertThat(createdApplicationView.getName()).isEqualTo(createdApplication.getName());
                    assertThat(createdApplicationView.getId()).isEqualTo(createdApplication.getId());
                    // assert that all the permissions in this view are present and all of them are turned off for this application
                    perms = List.of(0,0,0,0,0,0);
                    assertThat(createdApplicationView.getEnabled()).isEqualTo(perms);
                    // Only one kind of child present in application in this tab : aka page
                    assertThat(createdApplicationView.getChildren().size()).isEqualTo(1);

                    EntityView createdPageEntityView = createdApplicationView.getChildren().stream().findFirst().get();
                    assertThat(createdPageEntityView.getType()).isEqualTo(NewPage.class.getSimpleName());
                    // We created only one page in this application. Assert that the same has been read into the view
                    assertThat(createdPageEntityView.getEntities().size()).isEqualTo(1);
                    BaseView createdPageView = createdPageEntityView.getEntities().get(0);
                    assertThat(createdPageView.getId()).isEqualTo(createdApplication.getPages().get(0).getId());
                    // assert that only the first four permissions in this view are present and all of them are turned off for this page. The rest are disabled
                    perms = List.of(0,0,0,0,-1,-1);
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
                    perms = List.of(-1,0,0,0,-1,-1);
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
                    // TODO : Setting make public permission to be turned off till this workspace level permission gets added to all the workspaces
                    List<Integer> perms = List.of(1,1,1,1,0,1);
                    assertThat(createdWorkspaceView.getEnabled()).isEqualTo(perms);
                    // Only kind of child present in workspace in this tab : aka application
                    assertThat(createdWorkspaceView.getChildren().size()).isEqualTo(1);

                    EntityView createdApplicationEntityView = createdWorkspaceView.getChildren().stream().findFirst().get();
                    assertThat(createdApplicationEntityView.getType()).isEqualTo(Application.class.getSimpleName());
                    // We created only one application in this workspace. Assert that the same has been read into the view
                    assertThat(createdApplicationEntityView.getEntities().size()).isEqualTo(1);
                    BaseView createdApplicationView = createdApplicationEntityView.getEntities().get(0);
                    assertThat(createdApplicationView.getName()).isEqualTo(createdApplication.getName());
                    assertThat(createdApplicationView.getId()).isEqualTo(createdApplication.getId());
                    // assert that all the permissions in this view are present and all of them are turned on for this application
                    perms = List.of(1,1,1,1,1,1);
                    assertThat(createdApplicationView.getEnabled()).isEqualTo(perms);
                    // Only one kind of child present in application in this tab : aka page
                    assertThat(createdApplicationView.getChildren().size()).isEqualTo(1);

                    EntityView createdPageEntityView = createdApplicationView.getChildren().stream().findFirst().get();
                    assertThat(createdPageEntityView.getType()).isEqualTo(NewPage.class.getSimpleName());
                    // We created only one page in this application. Assert that the same has been read into the view
                    assertThat(createdPageEntityView.getEntities().size()).isEqualTo(1);
                    BaseView createdPageView = createdPageEntityView.getEntities().get(0);
                    assertThat(createdPageView.getId()).isEqualTo(createdApplication.getPages().get(0).getId());
                    // assert that create, edit, delete and view are turned on. The rest are disabled
                    perms = List.of(1,1,1,1,-1,-1);
                    assertThat(createdPageView.getEnabled()).isEqualTo(perms);
                    // Only one kind of child present in page in this tab : aka action
                    assertThat(createdPageView.getChildren().size()).isEqualTo(1);

                    EntityView createdActionEntityView = createdPageView.getChildren().stream().findFirst().get();
                    assertThat(createdActionEntityView.getType()).isEqualTo(NewAction.class.getSimpleName());
                    // We created only one action in this page. Assert that the same has been read into the view
                    assertThat(createdActionEntityView.getEntities().size()).isEqualTo(1);
                    BaseView createdActionView = createdActionEntityView.getEntities().get(0);
                    assertThat(createdActionView.getId()).isEqualTo(createdActionDto.getId());
                    assertThat(((ActionResourceDTO)createdActionView).getPluginId()).isEqualTo(createdActionDto.getPluginId());
                    // assert that only the edit, view and delete permissions in this view are present and all of them are turned on for this action. The rest are disabled
                    perms = List.of(-1,1,1,1,-1,-1);
                    assertThat(createdActionView.getEnabled()).isEqualTo(perms);
                    // No children present in action in this tab
                    assertThat(createdActionView.getChildren()).isNull();
                })
                .verifyComplete();
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
                    List<Integer> perms = List.of(0,0,0,0,0);
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
                    // assert that all the permissions in this view are present and all of them are turned off for this datasource
                    perms = List.of(0,0,0,0,0);
                    assertThat(createdDatasourceView.getEnabled()).isEqualTo(perms);
                    // There are no children for datasource
                    assertThat(createdDatasourceView.getChildren()).isNull();

                    // Only one application was created in this workspace
                    assertThat(ApplicationsEntityView.getEntities().size()).isEqualTo(1);
                    BaseView createdApplicationView = ApplicationsEntityView.getEntities().get(0);
                    assertThat(createdApplicationView.getName()).isEqualTo(createdApplication.getName());
                    assertThat(createdApplicationView.getId()).isEqualTo(createdApplication.getId());
                    // assert that all the permissions in this view are disabled for application
                    perms = List.of(-1,-1,-1,-1,-1);
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
                    perms = List.of(-1,-1,-1,-1,-1);
                    assertThat(createdPageView.getEnabled()).isEqualTo(perms);
                    // Only one kind of child present in page in this tab : aka action
                    assertThat(createdPageView.getChildren().size()).isEqualTo(1);

                    EntityView createdActionEntityView = createdPageView.getChildren().stream().findFirst().get();
                    assertThat(createdActionEntityView.getType()).isEqualTo(NewAction.class.getSimpleName());
                    // We created only one action in this page. Assert that the same has been read into the view
                    assertThat(createdActionEntityView.getEntities().size()).isEqualTo(1);
                    BaseView createdActionView = createdActionEntityView.getEntities().get(0);
                    assertThat(createdActionView.getId()).isEqualTo(createdActionDto.getId());
                    assertThat(((ActionResourceDTO)createdActionView).getPluginId()).isEqualTo(createdActionDto.getPluginId());
                    // assert that only execute permission is present and is turned off for this action. The rest are disabled
                    perms = List.of(0,-1,-1,-1,-1);
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

                    // TODO : create execute all datasources permission in workspace and assert that it is enabled in the permissions below
                    List<Integer> perms = List.of(0,1,1,1,1);
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
                    // assert that all the permissions in this view are present and all of them are turned on for this datasource
                    // TODO : introduce create actions permission for datasources and introduce the same for all.
                    perms = List.of(1, 0, 1, 1, 1);
                    assertThat(createdDatasourceView.getEnabled()).isEqualTo(perms);
                    // There are no children for datasource
                    assertThat(createdDatasourceView.getChildren()).isNull();

                    // Only one application was created in this workspace
                    assertThat(ApplicationsEntityView.getEntities().size()).isEqualTo(1);
                    BaseView createdApplicationView = ApplicationsEntityView.getEntities().get(0);
                    assertThat(createdApplicationView.getName()).isEqualTo(createdApplication.getName());
                    assertThat(createdApplicationView.getId()).isEqualTo(createdApplication.getId());
                    // assert that all the permissions in this view are disabled for application
                    perms = List.of(-1,-1,-1,-1,-1);
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
                    perms = List.of(-1,-1,-1,-1,-1);
                    assertThat(createdPageView.getEnabled()).isEqualTo(perms);
                    // Only one kind of child present in page in this tab : aka action
                    assertThat(createdPageView.getChildren().size()).isEqualTo(1);

                    EntityView createdActionEntityView = createdPageView.getChildren().stream().findFirst().get();
                    assertThat(createdActionEntityView.getType()).isEqualTo(NewAction.class.getSimpleName());
                    // We created only one action in this page. Assert that the same has been read into the view
                    assertThat(createdActionEntityView.getEntities().size()).isEqualTo(1);
                    BaseView createdActionView = createdActionEntityView.getEntities().get(0);
                    assertThat(createdActionView.getId()).isEqualTo(createdActionDto.getId());
                    assertThat(((ActionResourceDTO)createdActionView).getPluginId()).isEqualTo(createdActionDto.getPluginId());
                    // assert that only execute permission is present and is turned on for this action. The rest are disabled
                    perms = List.of(1,-1,-1,-1,-1);
                    assertThat(createdActionView.getEnabled()).isEqualTo(perms);
                    // No children present in action in this tab
                    assertThat(createdActionView.getChildren()).isNull();
                })
                .verifyComplete();
    }

}
