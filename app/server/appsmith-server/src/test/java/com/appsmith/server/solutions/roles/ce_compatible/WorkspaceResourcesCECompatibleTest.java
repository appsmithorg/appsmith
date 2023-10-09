package com.appsmith.server.solutions.roles.ce_compatible;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PageDTO;
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
import com.appsmith.server.services.EnvironmentService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.ThemeService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.appsmith.server.solutions.roles.CommonAppsmithObjectData;
import com.appsmith.server.solutions.roles.RoleConfigurationSolution;
import com.appsmith.server.solutions.roles.TenantResources;
import com.appsmith.server.solutions.roles.WorkspaceResources;
import com.appsmith.server.solutions.roles.constants.PermissionViewableName;
import com.appsmith.server.solutions.roles.constants.RoleTab;
import com.appsmith.server.solutions.roles.dtos.BaseView;
import com.appsmith.server.solutions.roles.dtos.DatasourceResourceDTO;
import com.appsmith.server.solutions.roles.dtos.EntityView;
import com.appsmith.server.solutions.roles.dtos.IdPermissionDTO;
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
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.ce.FieldNameCE.ADMINISTRATOR;
import static java.lang.Boolean.FALSE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;

/**
 * Test class to verify the workspace resources when the environments are not supported
 */
@SpringBootTest
@ExtendWith(SpringExtension.class)
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class WorkspaceResourcesCECompatibleTest {

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserUtils userUtils;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    EnvironmentService environmentService;

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

    @MockBean
    FeatureFlagService featureFlagService;

    @Autowired
    EnvironmentPermission environmentPermission;

    User api_user = null;

    String superAdminPermissionGroupId = null;

    Workspace createdWorkspace;
    Application createdApplication;
    Datasource createdDatasource;
    ActionDTO createdActionDto;
    Plugin restApiPlugin;

    @BeforeEach
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(new MockPluginExecutor()));
        // This stub has been added for featureflag placed for multiple environments
        Mockito.when(featureFlagService.check(any())).thenReturn(Mono.just(FALSE));

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
        createdApplication = applicationPageService
                .createApplication(application, workspace.getId())
                .block();

        Application applicationWithoutActions = new Application();
        applicationWithoutActions.setName(UUID.randomUUID().toString());
        Application createdApplicationWithoutActions = applicationPageService
                .createApplication(applicationWithoutActions, workspace.getId())
                .block();

        Application applicationWithoutPages = new Application();
        applicationWithoutPages.setName(UUID.randomUUID().toString());
        applicationPageService
                .createApplication(applicationWithoutPages, workspace.getId())
                .block();

        Datasource toCreate = new Datasource();
        toCreate.setName("Default Database");
        toCreate.setWorkspaceId(createdWorkspace.getId());
        restApiPlugin = pluginService.findByPackageName("restapi-plugin").block();
        toCreate.setPluginId(restApiPlugin.getId());

        String environmentId = workspaceService
                .getDefaultEnvironmentId(createdWorkspace.getId(), environmentPermission.getExecutePermission())
                .block();
        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(environmentId, new DatasourceStorageDTO(null, environmentId, null));
        toCreate.setDatasourceStorages(storages);

        createdDatasource = datasourceService.create(toCreate).block();

        PageDTO pageDTOWithoutActions1 = new PageDTO();
        pageDTOWithoutActions1.setName("Without Any Actions");
        pageDTOWithoutActions1.setApplicationId(createdApplication.getId());
        applicationPageService.createPage(pageDTOWithoutActions1).block();

        PageDTO pageDTOWithoutActions2 = new PageDTO();
        pageDTOWithoutActions2.setName("Without Any Actions");
        pageDTOWithoutActions2.setApplicationId(createdApplicationWithoutActions.getId());
        applicationPageService.createPage(pageDTOWithoutActions2).block();

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
    public void testDatasourceResourcesTab_testHoverMap() {
        Workspace workspace = new Workspace();
        workspace.setName("testApplicationResourcesTab_testHoverMap workspace");
        Workspace createdWorkspace1 = workspaceService.create(workspace).block();

        Datasource datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(createdWorkspace1.getId());
        Plugin installed_plugin =
                pluginRepository.findByPackageName("restapi-plugin").block();
        datasource.setPluginId(installed_plugin.getId());

        datasource.setWorkspaceId(createdWorkspace1.getId());
        String environmentId = workspaceService
                .getDefaultEnvironmentId(createdWorkspace1.getId(), environmentPermission.getExecutePermission())
                .block();
        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(environmentId, new DatasourceStorageDTO(null, environmentId, new DatasourceConfiguration()));
        datasource.setDatasourceStorages(storages);
        Datasource createdDatasource1 = datasourceService.create(datasource).block();

        CommonAppsmithObjectData dataFromRepositoryForAllTabs = workspaceResources.getDataFromRepositoryForAllTabs();

        Set<String> defaultPermissionGroupIds = createdWorkspace1.getDefaultPermissionGroups();
        PermissionGroup adminPermissionGroup =
                permissionGroupRepository
                        .findAllById(defaultPermissionGroupIds)
                        .collect(Collectors.toSet())
                        .block()
                        .stream()
                        .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                        .findFirst()
                        .get();

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

        assertThat(roleTabDTO.getHoverMap())
                .contains(Map.entry(
                        createdWorkspaceCreate,
                        Set.of(
                                new IdPermissionDTO(createdWorkspace1.getId(), PermissionViewableName.DELETE),
                                new IdPermissionDTO(createdWorkspace1.getId(), PermissionViewableName.VIEW),
                                new IdPermissionDTO(createdWorkspace1.getId(), PermissionViewableName.EXECUTE),
                                new IdPermissionDTO(createdWorkspace1.getId(), PermissionViewableName.EDIT),
                                new IdPermissionDTO(createdDatasource1.getId(), PermissionViewableName.CREATE))));
        assertThat(roleTabDTO.getHoverMap())
                .contains(Map.entry(
                        createdWorkspaceDelete,
                        Set.of(
                                new IdPermissionDTO(createdWorkspace1.getId(), PermissionViewableName.VIEW),
                                new IdPermissionDTO(createdWorkspace1.getId(), PermissionViewableName.EXECUTE),
                                new IdPermissionDTO(createdDatasource1.getId(), PermissionViewableName.DELETE))));
        assertThat(roleTabDTO.getHoverMap())
                .contains(Map.entry(
                        createdWorkspaceEdit,
                        Set.of(
                                new IdPermissionDTO(createdWorkspace1.getId(), PermissionViewableName.VIEW),
                                new IdPermissionDTO(createdWorkspace1.getId(), PermissionViewableName.EXECUTE),
                                new IdPermissionDTO(createdDatasource1.getId(), PermissionViewableName.EDIT))));
        assertThat(roleTabDTO.getHoverMap())
                .contains(Map.entry(
                        createdWorkspaceExecute,
                        Set.of(new IdPermissionDTO(createdDatasource1.getId(), PermissionViewableName.EXECUTE))));
        assertThat(roleTabDTO.getHoverMap())
                .contains(Map.entry(
                        createdWorkspaceView,
                        Set.of(
                                new IdPermissionDTO(createdWorkspace1.getId(), PermissionViewableName.EXECUTE),
                                new IdPermissionDTO(createdDatasource1.getId(), PermissionViewableName.VIEW))));

        assertThat(roleTabDTO.getHoverMap())
                .contains(Map.entry(
                        createdDatasourceCreate,
                        Set.of(
                                new IdPermissionDTO(createdDatasource1.getId(), PermissionViewableName.EXECUTE),
                                new IdPermissionDTO(createdDatasource1.getId(), PermissionViewableName.VIEW))));
        assertThat(roleTabDTO.getHoverMap())
                .contains(Map.entry(
                        createdDatasourceDelete,
                        Set.of(
                                new IdPermissionDTO(createdDatasource1.getId(), PermissionViewableName.EXECUTE),
                                new IdPermissionDTO(createdDatasource1.getId(), PermissionViewableName.VIEW))));
        assertThat(roleTabDTO.getHoverMap())
                .contains(Map.entry(
                        createdDatasourceEdit,
                        Set.of(
                                new IdPermissionDTO(createdDatasource1.getId(), PermissionViewableName.EXECUTE),
                                new IdPermissionDTO(createdDatasource1.getId(), PermissionViewableName.VIEW))));
        assertThat(roleTabDTO.getHoverMap())
                .contains(Map.entry(
                        createdDatasourceView,
                        Set.of(new IdPermissionDTO(createdDatasource1.getId(), PermissionViewableName.EXECUTE))));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testDatasourceResourcesTabWithSuperAdminPermissionGroupId() {
        if (superAdminPermissionGroupId == null) {
            superAdminPermissionGroupId =
                    userUtils.getSuperAdminPermissionGroup().block().getId();
        }

        CommonAppsmithObjectData dataFromRepositoryForAllTabs = workspaceResources.getDataFromRepositoryForAllTabs();
        Mono<RoleTabDTO> datasourcesResourcesTabViewMono = workspaceResources.createDatasourceResourcesTabView(
                superAdminPermissionGroupId, dataFromRepositoryForAllTabs);

        StepVerifier.create(datasourcesResourcesTabViewMono)
                .assertNext(datasourceResourcesTabView -> {
                    assertThat(datasourceResourcesTabView).isNotNull();
                    assertThat(datasourceResourcesTabView.getPermissions())
                            .isEqualTo(RoleTab.DATASOURCES_ENVIRONMENTS.getViewablePermissions());

                    EntityView topData = datasourceResourcesTabView.getData();
                    assertThat(topData).isNotNull();
                    assertThat(topData.getType()).isEqualTo(Workspace.class.getSimpleName());

                    BaseView createdWorkspaceView = topData.getEntities().stream()
                            .filter(entity -> entity.getId().equals(createdWorkspace.getId()))
                            .findFirst()
                            .get();
                    assertThat(createdWorkspaceView.getName().equals(createdWorkspace.getName()));
                    // assert that all the permissions in this view are present and all of them are turned off for this
                    // workspace
                    List<Integer> perms = List.of(0, 0, 0, 0, 0);
                    assertThat(createdWorkspaceView.getEnabled()).isEqualTo(perms);
                    // Only kind of child present in workspace in this tab : aka header
                    assertThat(createdWorkspaceView.getChildren().size()).isEqualTo(1);

                    EntityView createdHeaderEntityView = createdWorkspaceView.getChildren().stream()
                            .findFirst()
                            .get();
                    assertThat(createdHeaderEntityView.getType()).isEqualTo("Header");
                    // Assert that single children exist in header in this tab : aka datasource
                    assertThat(createdHeaderEntityView.getEntities().size()).isEqualTo(1);

                    long environmentsEntityViewCount = createdHeaderEntityView.getEntities().stream()
                            .filter(entity -> entity.getName().equals("Environments"))
                            .count();
                    // As environments are disabled corresponding view will be not created
                    assertThat(environmentsEntityViewCount).isEqualTo(0);

                    EntityView DatasourcesEntityView = createdHeaderEntityView.getEntities().stream()
                            .filter(entity -> entity.getName().equals("Datasources"))
                            .findFirst()
                            .get()
                            .getChildren()
                            .stream()
                            .findFirst()
                            .get();

                    // Only one datasource was created in this workspace
                    assertThat(DatasourcesEntityView.getEntities().size()).isEqualTo(1);
                    BaseView createdDatasourceView =
                            DatasourcesEntityView.getEntities().get(0);
                    assertThat(createdDatasourceView.getName()).isEqualTo(createdDatasource.getName());
                    assertThat(createdDatasourceView.getId()).isEqualTo(createdDatasource.getId());
                    assertThat(((DatasourceResourceDTO) createdDatasourceView).getPluginId())
                            .isEqualTo(createdDatasource.getPluginId());
                    // assert that all the permissions in this view are present and all of them are turned off for this
                    // datasource
                    perms = List.of(0, 0, 0, 0, 0);
                    assertThat(createdDatasourceView.getEnabled()).isEqualTo(perms);
                    // There are no children for datasource
                    assertThat(createdDatasourceView.getChildren()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testDatasourceResourcesTabWithWorkspaceAdminPermissionGroupId() {
        Set<String> defaultPermissionGroupIds = createdWorkspace.getDefaultPermissionGroups();
        Set<PermissionGroup> permissionGroups = permissionGroupRepository
                .findAllById(defaultPermissionGroupIds)
                .collect(Collectors.toSet())
                .block();
        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();

        CommonAppsmithObjectData dataFromRepositoryForAllTabs = workspaceResources.getDataFromRepositoryForAllTabs();
        Mono<RoleTabDTO> datasourcesResourcesTabViewMono = workspaceResources.createDatasourceResourcesTabView(
                adminPermissionGroup.getId(), dataFromRepositoryForAllTabs);

        StepVerifier.create(datasourcesResourcesTabViewMono)
                .assertNext(datasourceResourcesTabView -> {
                    assertThat(datasourceResourcesTabView).isNotNull();
                    assertThat(datasourceResourcesTabView.getPermissions())
                            .isEqualTo(RoleTab.DATASOURCES_ENVIRONMENTS.getViewablePermissions());

                    EntityView topData = datasourceResourcesTabView.getData();
                    assertThat(topData).isNotNull();
                    assertThat(topData.getType()).isEqualTo(Workspace.class.getSimpleName());

                    BaseView createdWorkspaceView = topData.getEntities().stream()
                            .filter(entity -> entity.getId().equals(createdWorkspace.getId()))
                            .findFirst()
                            .get();
                    assertThat(createdWorkspaceView.getName().equals(createdWorkspace.getName()));

                    List<Integer> perms = List.of(1, 1, 1, 1, 1);
                    assertThat(createdWorkspaceView.getEnabled()).isEqualTo(perms);
                    // Only kind of child present in workspace in this tab : aka header
                    assertThat(createdWorkspaceView.getChildren().size()).isEqualTo(1);

                    EntityView createdHeaderEntityView = createdWorkspaceView.getChildren().stream()
                            .findFirst()
                            .get();
                    assertThat(createdHeaderEntityView.getType()).isEqualTo("Header");
                    // Assert that single children exist in header in this tab : aka datasource
                    assertThat(createdHeaderEntityView.getEntities().size()).isEqualTo(1);

                    EntityView DatasourcesEntityView = createdHeaderEntityView.getEntities().stream()
                            .filter(entity -> entity.getName().equals("Datasources"))
                            .findFirst()
                            .get()
                            .getChildren()
                            .stream()
                            .findFirst()
                            .get();

                    // Only one datasource was created in this workspace
                    assertThat(DatasourcesEntityView.getEntities().size()).isEqualTo(1);
                    BaseView createdDatasourceView =
                            DatasourcesEntityView.getEntities().get(0);
                    assertThat(createdDatasourceView.getName()).isEqualTo(createdDatasource.getName());
                    assertThat(createdDatasourceView.getId()).isEqualTo(createdDatasource.getId());
                    assertThat(((DatasourceResourceDTO) createdDatasourceView).getPluginId())
                            .isEqualTo(createdDatasource.getPluginId());
                    // assert that all the permissions in this view are present and all of them are turned on for this
                    // datasource
                    perms = List.of(1, 1, 1, 1, 1);
                    assertThat(createdDatasourceView.getEnabled()).isEqualTo(perms);
                    // There are no children for datasource
                    assertThat(createdDatasourceView.getChildren()).isNull();

                    long environmentEntityCount = createdHeaderEntityView.getEntities().stream()
                            .filter(entity -> entity.getName().equals("Environments"))
                            .count();
                    assertThat(environmentEntityCount).isEqualTo(0);
                })
                .verifyComplete();
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
        Plugin installed_plugin =
                pluginRepository.findByPackageName("restapi-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        String environmentId = workspaceService
                .getDefaultEnvironmentId(createdWorkspace1.getId(), environmentPermission.getExecutePermission())
                .block();
        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(environmentId, new DatasourceStorageDTO(null, environmentId, new DatasourceConfiguration()));
        datasource.setDatasourceStorages(storages);
        Datasource createdDatasource = datasourceService.create(datasource).block();

        CommonAppsmithObjectData dataFromRepositoryForAllTabs = workspaceResources.getDataFromRepositoryForAllTabs();

        Set<String> defaultPermissionGroupIds = createdWorkspace1.getDefaultPermissionGroups();
        PermissionGroup adminPermissionGroup =
                permissionGroupRepository
                        .findAllById(defaultPermissionGroupIds)
                        .collect(Collectors.toSet())
                        .block()
                        .stream()
                        .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                        .findFirst()
                        .get();

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
        assertThat(disableHelperMao.get(createdWorkspaceEdit))
                .containsAll(Set.of(
                        new IdPermissionDTO(createdWorkspace1.getId(), PermissionViewableName.VIEW),
                        new IdPermissionDTO(createdWorkspace1.getId(), PermissionViewableName.EXECUTE)));
        assertThat(disableHelperMao.get(createdWorkspaceCreate))
                .containsAll(Set.of(new IdPermissionDTO(createdWorkspace1.getId(), PermissionViewableName.DELETE)));
        assertThat(disableHelperMao.get(createdDatasourceEdit))
                .containsAll(Set.of(
                        new IdPermissionDTO(createdDatasource.getId(), PermissionViewableName.VIEW),
                        new IdPermissionDTO(createdDatasource.getId(), PermissionViewableName.EXECUTE)));
    }
}
