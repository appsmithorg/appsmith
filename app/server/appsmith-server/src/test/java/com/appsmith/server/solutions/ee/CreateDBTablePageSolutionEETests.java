package com.appsmith.server.solutions.ee;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.CRUDPageResourceDTO;
import com.appsmith.server.dtos.CRUDPageResponseDTO;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.PermissionGroupCompactDTO;
import com.appsmith.server.dtos.UpdateRoleAssociationDTO;
import com.appsmith.server.dtos.UserCompactDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.DatasourceStructureService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.UserWorkspaceService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.CreateDBTablePageSolution;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.appsmith.server.solutions.ImportExportApplicationService;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import com.appsmith.server.solutions.roles.RoleConfigurationSolution;
import com.appsmith.server.solutions.roles.constants.RoleTab;
import com.appsmith.server.solutions.roles.dtos.RoleViewDTO;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleConfigDTO;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleEntityDTO;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.ce.FieldNameCE.ADMINISTRATOR;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.spy;

@Slf4j
@ExtendWith(SpringExtension.class)
@SpringBootTest
public class CreateDBTablePageSolutionEETests {

    private Datasource testDatasource = new Datasource();
    private static final DatasourceStorageStructure testDatasourceStructure = new DatasourceStorageStructure();
    private Workspace testWorkspace;
    private String testDefaultEnvironmentId;
    private static Application testApp;
    private static Plugin postgreSQLPlugin;
    private static final DatasourceStructure structure = new DatasourceStructure();

    @Autowired
    CreateDBTablePageSolution solution;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    DatasourceStructureService datasourceStructureService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    ImportExportApplicationService importExportApplicationService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    EnvironmentPermission environmentPermission;

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserUtils userUtils;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    UserAndAccessManagementService userAndAccessManagementService;

    @Autowired
    UserWorkspaceService userWorkspaceService;

    @Autowired
    RoleConfigurationSolution roleConfigurationSolution;

    @Autowired
    PermissionGroupService permissionGroupService;

    DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    private PluginExecutor spyMockPluginExecutor = spy(new MockPluginExecutor());

    private final CRUDPageResourceDTO resource = new CRUDPageResourceDTO();

    User api_user;

    @BeforeEach
    @WithUserDetails(value = "api_user")
    public void setup() {

        if (api_user == null) {
            api_user = userRepository.findByEmail("api_user").block();
        }

        // Make api_user instance administrator before starting the test
        userUtils.makeSuperUser(List.of(api_user)).block();

        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(spyMockPluginExecutor));
        Mockito.when(pluginExecutorHelper.getPluginExecutorFromPackageName(Mockito.anyString()))
                .thenReturn(Mono.just(spyMockPluginExecutor))
                .thenReturn(Mono.just(spyMockPluginExecutor));

        testWorkspace = null;
        testApp = null;
        testDatasource = new Datasource();

        Workspace workspace = new Workspace();
        workspace.setName("Create-DB-Table-Page-Org");
        testWorkspace = workspaceService.create(workspace).block();
        testDefaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(testWorkspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Application testApplication = new Application();
        testApplication.setName("DB-Table-Page-Test-Application");
        testApplication.setWorkspaceId(testWorkspace.getId());
        testApp = applicationPageService
                .createApplication(testApplication, testWorkspace.getId())
                .block();

        postgreSQLPlugin = pluginRepository.findByName("PostgreSQL").block();
        // This datasource structure includes only 1 table with 2 columns. This is to test the scenario where
        // template table
        // have more number of columns than the user provided table which leads to deleting the column names from
        // action configuration

        List<DatasourceStructure.Column> limitedColumns = List.of(
                new DatasourceStructure.Column("id", "type1", null, true),
                new DatasourceStructure.Column("field1.something", "VARCHAR(23)", null, false));
        List<DatasourceStructure.Key> keys = List.of(new DatasourceStructure.PrimaryKey("pKey", List.of("id")));
        List<DatasourceStructure.Column> columns = List.of(
                new DatasourceStructure.Column("id", "type1", null, true),
                new DatasourceStructure.Column("field1.something", "VARCHAR(23)", null, false),
                new DatasourceStructure.Column("field2", "type3", null, false),
                new DatasourceStructure.Column("field3", "type4", null, false),
                new DatasourceStructure.Column("field4", "type5", null, false));
        List<DatasourceStructure.Table> tables = List.of(
                new DatasourceStructure.Table(
                        DatasourceStructure.TableType.TABLE, "", "sampleTable", columns, keys, new ArrayList<>()),
                new DatasourceStructure.Table(
                        DatasourceStructure.TableType.TABLE,
                        "",
                        "limitedColumnTable",
                        limitedColumns,
                        keys,
                        new ArrayList<>()));
        structure.setTables(tables);
        testDatasource.setPluginId(postgreSQLPlugin.getId());
        testDatasource.setWorkspaceId(testWorkspace.getId());
        testDatasource.setName("CRUD-Page-Table-DS");

        datasourceConfiguration.setUrl("http://test.com");

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                testDefaultEnvironmentId,
                new DatasourceStorageDTO(testDatasource.getId(), testDefaultEnvironmentId, datasourceConfiguration));
        testDatasource.setDatasourceStorages(storages);
        //
        //        testDatasource.setPolicies(null);

        Datasource datasource = datasourceService.create(testDatasource).block();

        testDatasourceStructure.setDatasourceId(datasource.getId());
        testDatasourceStructure.setEnvironmentId(testDefaultEnvironmentId);
        testDatasourceStructure.setStructure(structure);
        datasourceStructureService.save(testDatasourceStructure).block();

        resource.setTableName(structure.getTables().get(0).getName());
        resource.setDatasourceId(testDatasource.getId());
    }

    private void giveApiUserCustomRoleAccessToOwnWorkspace(Workspace workspace, PermissionGroup customRole) {

        Mono<Set<PermissionGroup>> defaultPermissionGroupMono = Mono.just(workspace)
                .flatMap(workspace1 -> {
                    Set<String> defaultPermissionGroups = workspace1.getDefaultPermissionGroups();
                    return permissionGroupRepository
                            .findAllById(defaultPermissionGroups)
                            .collect(Collectors.toSet());
                });

        Mono<Boolean> updateRoleFromDefaultRoleToCustomRole = defaultPermissionGroupMono
                .flatMap(defaultPermissionGroups -> {
                    PermissionGroup adminPermissionGroup = defaultPermissionGroups.stream()
                            .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                            .findFirst()
                            .get();

                    // Add user to workspace
                    InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
                    ArrayList<String> users = new ArrayList<>();
                    users.add("usertest@usertest.com");
                    inviteUsersDTO.setUsernames(users);
                    inviteUsersDTO.setPermissionGroupId(adminPermissionGroup.getId());

                    return userAndAccessManagementService.inviteUsers(inviteUsersDTO, "origin");
                })
                .flatMap(inviteUsersResponseDTO -> userWorkspaceService.leaveWorkspace(workspace.getId()))
                .flatMap(aVoid -> {
                    // assign custom role to the user
                    UpdateRoleAssociationDTO updateRoleAssociationDTO = new UpdateRoleAssociationDTO();
                    updateRoleAssociationDTO.setUsers(
                            Set.of(new UserCompactDTO(api_user.getId(), api_user.getEmail(), api_user.getName())));
                    updateRoleAssociationDTO.setRolesAdded(
                            Set.of(new PermissionGroupCompactDTO(customRole.getId(), customRole.getName())));

                    // Now assign the user to the role
                    return userAndAccessManagementService.changeRoleAssociations(updateRoleAssociationDTO);
                });

        updateRoleFromDefaultRoleToCustomRole.block();
    }

    private void giveCreateEditViewApplicationPermissionsInTestWorkspace(PermissionGroup customRole) {
        // Workspace : Give create, edit and view permissions to the workspace
        UpdateRoleEntityDTO workspaceEntity = new UpdateRoleEntityDTO(
                Workspace.class.getSimpleName(),
                testWorkspace.getId(),
                List.of(1, 1, 1, 1, -1, 0, 0),
                testWorkspace.getName());
        UpdateRoleEntityDTO applicationEntity = new UpdateRoleEntityDTO(
                Application.class.getSimpleName(), testApp.getId(), List.of(1, 1, 1, 1, -1, 0, 0), testApp.getName());
        UpdateRoleEntityDTO pageEntity = new UpdateRoleEntityDTO(
                NewPage.class.getSimpleName(),
                testApp.getPages().get(0).getId(),
                List.of(1, 1, 1, 1, -1, -1, -1),
                "unnecessary name");

        UpdateRoleConfigDTO updateRoleConfigDTO = new UpdateRoleConfigDTO();
        updateRoleConfigDTO.setEntitiesChanged(Set.of(workspaceEntity, applicationEntity, pageEntity));
        updateRoleConfigDTO.setTabName(RoleTab.APPLICATION_RESOURCES.getName());

        Mono<RoleViewDTO> roleConfigChangeMono =
                roleConfigurationSolution.updateRoles(customRole.getId(), updateRoleConfigDTO);

        roleConfigChangeMono.block();
    }

    private void giveOnlyEditApplicationPermissionInTestWorkspace(PermissionGroup customRole) {
        // Workspace : Give edit/view permissions to the workspace
        UpdateRoleEntityDTO workspaceEntity = new UpdateRoleEntityDTO(
                Workspace.class.getSimpleName(),
                testWorkspace.getId(),
                List.of(0, 1, 0, 1, -1, 0, 0),
                testWorkspace.getName());
        UpdateRoleEntityDTO applicationEntity = new UpdateRoleEntityDTO(
                Application.class.getSimpleName(), testApp.getId(), List.of(0, 1, 0, 1, -1, 0, 0), testApp.getName());
        UpdateRoleEntityDTO pageEntity = new UpdateRoleEntityDTO(
                NewPage.class.getSimpleName(),
                testApp.getPages().get(0).getId(),
                List.of(1, 1, 1, 1, -1, -1, -1),
                "unnecessary name");

        UpdateRoleConfigDTO updateRoleConfigDTO = new UpdateRoleConfigDTO();
        updateRoleConfigDTO.setEntitiesChanged(Set.of(workspaceEntity, applicationEntity, pageEntity));
        updateRoleConfigDTO.setTabName(RoleTab.APPLICATION_RESOURCES.getName());

        Mono<RoleViewDTO> roleConfigChangeMono =
                roleConfigurationSolution.updateRoles(customRole.getId(), updateRoleConfigDTO);

        roleConfigChangeMono.block();
    }

    private void giveOnlyEditExecuteDatasourcePermissionsInTestWorkspace(PermissionGroup customRole) {
        // Workspace : Give edit/view permissions to the workspace
        UpdateRoleEntityDTO datasourceEntity = new UpdateRoleEntityDTO(
                Datasource.class.getSimpleName(),
                testDatasource.getId(),
                List.of(1, 0, 1, 0, 1),
                testDatasource.getName());

        UpdateRoleConfigDTO updateRoleConfigDTO = new UpdateRoleConfigDTO();
        updateRoleConfigDTO.setEntitiesChanged(Set.of(datasourceEntity));
        updateRoleConfigDTO.setTabName(RoleTab.DATASOURCES_ENVIRONMENTS.getName());

        Mono<RoleViewDTO> roleConfigChangeMono =
                roleConfigurationSolution.updateRoles(customRole.getId(), updateRoleConfigDTO);

        roleConfigChangeMono.block();
    }

    private void giveCreateActionPermissionOnTestDatasource(PermissionGroup customRole) {
        UpdateRoleEntityDTO datasourceEntity = new UpdateRoleEntityDTO(
                Datasource.class.getSimpleName(),
                testDatasource.getId(),
                List.of(1, 1, 0, 0, 1),
                testDatasource.getName());

        UpdateRoleConfigDTO updateRoleConfigDTO = new UpdateRoleConfigDTO();
        updateRoleConfigDTO.setEntitiesChanged(Set.of(datasourceEntity));
        updateRoleConfigDTO.setTabName(RoleTab.DATASOURCES_ENVIRONMENTS.getName());

        Mono<RoleViewDTO> roleConfigChangeMono =
                roleConfigurationSolution.updateRoles(customRole.getId(), updateRoleConfigDTO);

        roleConfigChangeMono.block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void invalidCreatePageWithoutCreateActionsPermissionOnDatasource() {

        // Crate a custom role with all permissions at workspace level in application tab, and no permissions for the
        // datasource in the same workspace in datasource tab
        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("createPageWithoutCreateActionsPermissionOnDatasource custom role");
        PermissionGroup createdPermissionGroup =
                permissionGroupService.create(permissionGroup).block();
        giveCreateEditViewApplicationPermissionsInTestWorkspace(createdPermissionGroup);
        // No create action permission on datasource. But give datasource edit permission (which would work on CE repo)
        giveOnlyEditExecuteDatasourcePermissionsInTestWorkspace(createdPermissionGroup);
        giveApiUserCustomRoleAccessToOwnWorkspace(testWorkspace, createdPermissionGroup);

        resource.setApplicationId(testApp.getId());
        Mono<CRUDPageResponseDTO> resultMono =
                solution.createPageFromDBTable(null, resource, testDefaultEnvironmentId, "");

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.ACL_NO_RESOURCE_FOUND.getMessage(
                                        FieldName.DATASOURCE, testDatasource.getId())))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void invalidCreatePageWithoutCreatePagePermissionOnApplication() {

        // Crate a custom role with all permissions at workspace level in application tab, and no permissions for the
        // datasource in the same workspace in datasource tab
        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("createPageWithoutCreatePagePermissionOnApplication custom role");
        PermissionGroup createdPermissionGroup =
                permissionGroupService.create(permissionGroup).block();
        giveOnlyEditApplicationPermissionInTestWorkspace(createdPermissionGroup);
        giveCreateActionPermissionOnTestDatasource(createdPermissionGroup);
        giveApiUserCustomRoleAccessToOwnWorkspace(testWorkspace, createdPermissionGroup);

        resource.setApplicationId(testApp.getId());
        Mono<CRUDPageResponseDTO> resultMono =
                solution.createPageFromDBTable(null, resource, testDefaultEnvironmentId, "");

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(
                                        FieldName.APPLICATION, testApp.getId())))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validCreatePageWithCreateActionsPermissionOnDatasource_CreatePageOnApplication() {

        // Crate a custom role with all permissions at workspace level in application tab, and create action permission
        // for the datasource in the same workspace in datasource tab
        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("createPageWithCreateActionsPermissionOnDatasource custom role");
        PermissionGroup createdPermissionGroup =
                permissionGroupService.create(permissionGroup).block();
        giveCreateEditViewApplicationPermissionsInTestWorkspace(createdPermissionGroup);
        giveCreateActionPermissionOnTestDatasource(createdPermissionGroup);
        giveApiUserCustomRoleAccessToOwnWorkspace(testWorkspace, createdPermissionGroup);

        resource.setApplicationId(testApp.getId());
        Mono<CRUDPageResponseDTO> resultMono = solution.createPageFromDBTable(
                testApp.getPages().get(0).getId(), resource, testDefaultEnvironmentId, "");

        StepVerifier.create(resultMono)
                .assertNext(crudPage -> {
                    assertThat(crudPage.getPage().getId()).isNotNull();
                })
                .verifyComplete();
    }
}
