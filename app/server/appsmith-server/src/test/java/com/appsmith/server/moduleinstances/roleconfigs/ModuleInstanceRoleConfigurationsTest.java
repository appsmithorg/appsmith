package com.appsmith.server.moduleinstances.roleconfigs;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Package;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.moduleinstances.crud.CrudModuleInstanceService;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.packages.crud.CrudPackageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.publish.packages.internal.PublishPackageService;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import com.appsmith.server.repositories.ModuleRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.PackageRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.appsmith.server.solutions.roles.RoleConfigurationSolution;
import com.appsmith.server.solutions.roles.constants.RoleTab;
import com.appsmith.server.solutions.roles.dtos.RoleViewDTO;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleConfigDTO;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleEntityDTO;
import com.appsmith.server.testhelpers.moduleinstances.ModuleInstanceTestHelper;
import com.appsmith.server.testhelpers.moduleinstances.ModuleInstanceTestHelperDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.MODULE_CREATE_MODULE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.MODULE_READ_MODULE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.PACKAGE_CREATE_MODULE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.PACKAGE_READ_MODULE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_CREATE_PACKAGE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_READ_PACKAGE_INSTANCES;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ExtendWith(SpringExtension.class)
class ModuleInstanceRoleConfigurationsTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserUtils userUtils;

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private ApplicationPageService applicationPageService;

    @Autowired
    private RoleConfigurationSolution roleConfigurationSolution;

    @Autowired
    private PermissionGroupService permissionGroupService;

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    private NewActionRepository newActionRepository;

    @SpyBean
    private FeatureFlagService featureFlagService;

    @Autowired
    private NewPageService newPageService;

    @Autowired
    private ModuleInstanceRepository moduleInstanceRepository;

    @Autowired
    private NewActionService newActionService;

    @Autowired
    private CrudModuleInstanceService crudModuleInstanceService;

    @Autowired
    private PackageRepository packageRepository;

    @Autowired
    private ModuleRepository moduleRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CrudPackageService crudPackageService;

    @Autowired
    private PublishPackageService publishPackageService;

    @Autowired
    private CrudModuleService crudModuleService;

    @Autowired
    private UserService userService;

    @Autowired
    private EnvironmentPermission environmentPermission;

    @SpyBean
    private CommonConfig commonConfig;

    @SpyBean
    private PluginService pluginService;

    @Autowired
    private CustomJSLibService customJSLibService;

    @Autowired
    PluginRepository pluginRepository;

    User api_user = null;

    @BeforeEach
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        Mockito.when(featureFlagService.check(FeatureFlagEnum.license_audit_logs_enabled))
                .thenReturn(Mono.just(FALSE));
        Mockito.when(featureFlagService.check(FeatureFlagEnum.license_gac_enabled))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(featureFlagService.check(FeatureFlagEnum.release_datasource_environments_enabled))
                .thenReturn(Mono.just(FALSE));
        Mockito.when(featureFlagService.check(FeatureFlagEnum.license_custom_environments_enabled))
                .thenReturn(Mono.just(TRUE));

        Mockito.when(featureFlagService.check(FeatureFlagEnum.release_query_module_enabled))
                .thenReturn(Mono.just(TRUE));

        if (api_user == null) {
            api_user = userRepository.findByEmail("api_user").block();
        }

        // Make api_user instance administrator before starting the test
        userUtils.makeSuperUser(List.of(api_user)).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void
            testSaveRoleConfigurations_withAddCreatePageAction_updatesSideEffectToWorkspaceAndPackagesAndModulesAndComposedActions() {

        String testName = "testSaveRoleConfigurations_withAddCreatePageAction";

        // Create module, publish and create instance in an app
        ModuleInstanceTestHelper moduleInstanceTestHelper = new ModuleInstanceTestHelper(
                crudPackageService,
                publishPackageService,
                crudModuleService,
                userService,
                workspaceService,
                applicationPageService,
                newPageService,
                newActionService,
                pluginExecutorHelper,
                environmentPermission,
                featureFlagService,
                commonConfig,
                pluginService,
                crudModuleInstanceService,
                objectMapper,
                customJSLibService,
                pluginRepository);
        ModuleInstanceTestHelperDTO moduleInstanceTestHelperDTO = new ModuleInstanceTestHelperDTO();
        moduleInstanceTestHelperDTO.setWorkspaceName("Workspace - " + testName);
        moduleInstanceTestHelperDTO.setApplicationName("Application - " + testName);
        moduleInstanceTestHelper.createPrerequisites(moduleInstanceTestHelperDTO);

        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO =
                moduleInstanceTestHelper.createModuleInstance(moduleInstanceTestHelperDTO);
        ModuleInstanceDTO moduleInstanceDTO = createModuleInstanceResponseDTO.getModuleInstance();

        // Create custom role
        PermissionGroup sampleRole = new PermissionGroup();
        sampleRole.setName("Role - " + testName);
        RoleViewDTO sampleRoleViewDTO =
                permissionGroupService.createCustomPermissionGroup(sampleRole).block();
        assert sampleRoleViewDTO != null;

        // Set update permissions request
        UpdateRoleEntityDTO createdPageUpdateRoleEntityDTOWithCreatePermission = new UpdateRoleEntityDTO(
                NewPage.class.getSimpleName(),
                moduleInstanceTestHelperDTO.getPageDTO().getId(),
                List.of(1, 1, 1, 1, -1, -1, -1),
                moduleInstanceTestHelperDTO.getPageDTO().getName());

        UpdateRoleEntityDTO moduleInstanceUpdateEntityDTO = new UpdateRoleEntityDTO(
                ModuleInstance.class.getSimpleName(),
                moduleInstanceDTO.getId(),
                List.of(-1, 1, 1, 1, 1, -1, -1),
                moduleInstanceDTO.getName());

        UpdateRoleConfigDTO updateRoleConfigDTO = new UpdateRoleConfigDTO();
        updateRoleConfigDTO.setTabName(RoleTab.APPLICATION_RESOURCES.getName());
        updateRoleConfigDTO.setEntitiesChanged(
                Set.of(createdPageUpdateRoleEntityDTOWithCreatePermission, moduleInstanceUpdateEntityDTO));

        // Perform update
        roleConfigurationSolution
                .updateRoles(sampleRoleViewDTO.getId(), updateRoleConfigDTO)
                .block();

        // Check workspace permissions
        Workspace workspace = workspaceService
                .getById(moduleInstanceTestHelperDTO.getWorkspaceId())
                .block();
        Set<Policy> workspacePolicies = workspace.getPolicies().stream()
                .filter(policy -> Set.of(
                                WORKSPACE_CREATE_PACKAGE_INSTANCES.getValue(),
                                WORKSPACE_READ_PACKAGE_INSTANCES.getValue())
                        .contains(policy.getPermission()))
                .collect(Collectors.toSet());

        assertThat(workspacePolicies).hasSize(2).allMatch(policy -> policy.getPermissionGroups()
                .contains(sampleRoleViewDTO.getId()));

        // Check package permissions
        PackageDTO sourcePackageDTO = moduleInstanceTestHelperDTO.getOriginPackageDTO();
        Package aPackage = packageRepository.findById(sourcePackageDTO.getId()).block();
        Set<Policy> packagePolicies = aPackage.getPolicies().stream()
                .filter(policy -> Set.of(
                                PACKAGE_CREATE_MODULE_INSTANCES.getValue(), PACKAGE_READ_MODULE_INSTANCES.getValue())
                        .contains(policy.getPermission()))
                .collect(Collectors.toSet());

        assertThat(packagePolicies).hasSize(2).allMatch(policy -> policy.getPermissionGroups()
                .contains(sampleRoleViewDTO.getId()));

        // Check module permissions
        ModuleDTO sourceModuleDTO = moduleInstanceTestHelperDTO.getOriginModuleDTO();
        Module module = moduleRepository.findById(sourceModuleDTO.getId()).block();
        Set<Policy> modulePolicies = module.getPolicies().stream()
                .filter(policy -> Set.of(
                                MODULE_CREATE_MODULE_INSTANCES.getValue(), MODULE_READ_MODULE_INSTANCES.getValue())
                        .contains(policy.getPermission()))
                .collect(Collectors.toSet());

        assertThat(modulePolicies).hasSize(2).allMatch(policy -> policy.getPermissionGroups()
                .contains(sampleRoleViewDTO.getId()));

        // Check module instance permissions
        ModuleInstance moduleInstance =
                moduleInstanceRepository.findById(moduleInstanceDTO.getId()).block();
        Set<Policy> moduleInstancePolicies = moduleInstance.getPolicies();

        assertThat(moduleInstancePolicies).hasSize(4).allMatch(policy -> policy.getPermissionGroups()
                .contains(sampleRoleViewDTO.getId()));

        // Check composed actions permissions
        List<ActionViewDTO> composedActions =
                createModuleInstanceResponseDTO.getEntities().getActions();

        assertThat(composedActions).hasSize(1);

        NewAction newAction =
                newActionRepository.findById(composedActions.get(0).getId()).block();
        assertThat(newAction.getPolicies()).hasSize(4).allMatch(policy -> policy.getPermissionGroups()
                .contains(sampleRoleViewDTO.getId()));
    }

    @Test
    @WithUserDetails(value = "api_user")
    void
            testSaveRoleConfigurations_withAddManageModuleInstance_updatesSideEffectToWorkspaceAndPackagesAndModulesAndComposedActions() {

        String testName = "testSaveRoleConfigurations_withAddManageModuleInstance";

        // Create module, publish and create instance in an app
        ModuleInstanceTestHelper moduleInstanceTestHelper = new ModuleInstanceTestHelper(
                crudPackageService,
                publishPackageService,
                crudModuleService,
                userService,
                workspaceService,
                applicationPageService,
                newPageService,
                newActionService,
                pluginExecutorHelper,
                environmentPermission,
                featureFlagService,
                commonConfig,
                pluginService,
                crudModuleInstanceService,
                objectMapper,
                customJSLibService,
                pluginRepository);
        ModuleInstanceTestHelperDTO moduleInstanceTestHelperDTO = new ModuleInstanceTestHelperDTO();
        moduleInstanceTestHelperDTO.setWorkspaceName("Workspace - " + testName);
        moduleInstanceTestHelperDTO.setApplicationName("Application - " + testName);
        moduleInstanceTestHelper.createPrerequisites(moduleInstanceTestHelperDTO);

        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO =
                moduleInstanceTestHelper.createModuleInstance(moduleInstanceTestHelperDTO);
        ModuleInstanceDTO moduleInstanceDTO = createModuleInstanceResponseDTO.getModuleInstance();

        // Create custom role
        PermissionGroup sampleRole = new PermissionGroup();
        sampleRole.setName("Role - " + testName);
        RoleViewDTO sampleRoleViewDTO =
                permissionGroupService.createCustomPermissionGroup(sampleRole).block();
        assert sampleRoleViewDTO != null;

        // Set update permissions request
        UpdateRoleEntityDTO moduleInstanceUpdateEntityDTO = new UpdateRoleEntityDTO(
                ModuleInstance.class.getSimpleName(),
                moduleInstanceDTO.getId(),
                List.of(-1, 1, -1, 1, 1, -1, -1),
                moduleInstanceDTO.getName());

        UpdateRoleConfigDTO updateRoleConfigDTO = new UpdateRoleConfigDTO();
        updateRoleConfigDTO.setTabName(RoleTab.APPLICATION_RESOURCES.getName());
        updateRoleConfigDTO.setEntitiesChanged(Set.of(moduleInstanceUpdateEntityDTO));

        // Perform update
        roleConfigurationSolution
                .updateRoles(sampleRoleViewDTO.getId(), updateRoleConfigDTO)
                .block();

        // Check workspace permissions
        Workspace workspace = workspaceService
                .getById(moduleInstanceTestHelperDTO.getWorkspaceId())
                .block();
        Set<Policy> workspacePolicies = workspace.getPolicies().stream()
                .filter(policy -> Set.of(
                                WORKSPACE_CREATE_PACKAGE_INSTANCES.getValue(),
                                WORKSPACE_READ_PACKAGE_INSTANCES.getValue())
                        .contains(policy.getPermission()))
                .collect(Collectors.toSet());

        assertThat(workspacePolicies).hasSize(2).allMatch(policy -> {
            return switch (AclPermission.getPermissionByValue(policy.getPermission(), Workspace.class)) {
                case WORKSPACE_CREATE_PACKAGE_INSTANCES:
                    yield !policy.getPermissionGroups().contains(sampleRoleViewDTO.getId());
                case WORKSPACE_READ_PACKAGE_INSTANCES:
                    yield policy.getPermissionGroups().contains(sampleRoleViewDTO.getId());
                default:
                    yield false;
            };
        });

        // Check package permissions
        PackageDTO sourcePackageDTO = moduleInstanceTestHelperDTO.getOriginPackageDTO();
        Package aPackage = packageRepository.findById(sourcePackageDTO.getId()).block();
        Set<Policy> packagePolicies = aPackage.getPolicies().stream()
                .filter(policy -> Set.of(
                                PACKAGE_CREATE_MODULE_INSTANCES.getValue(), PACKAGE_READ_MODULE_INSTANCES.getValue())
                        .contains(policy.getPermission()))
                .collect(Collectors.toSet());

        assertThat(packagePolicies).hasSize(2).allMatch(policy -> {
            return switch (AclPermission.getPermissionByValue(policy.getPermission(), Package.class)) {
                case PACKAGE_CREATE_MODULE_INSTANCES:
                    yield !policy.getPermissionGroups().contains(sampleRoleViewDTO.getId());
                case PACKAGE_READ_MODULE_INSTANCES:
                    yield policy.getPermissionGroups().contains(sampleRoleViewDTO.getId());
                default:
                    yield false;
            };
        });

        // Check module permissions
        ModuleDTO sourceModuleDTO = moduleInstanceTestHelperDTO.getOriginModuleDTO();
        Module module = moduleRepository.findById(sourceModuleDTO.getId()).block();
        Set<Policy> modulePolicies = module.getPolicies().stream()
                .filter(policy -> Set.of(
                                MODULE_CREATE_MODULE_INSTANCES.getValue(), MODULE_READ_MODULE_INSTANCES.getValue())
                        .contains(policy.getPermission()))
                .collect(Collectors.toSet());

        assertThat(modulePolicies).hasSize(2).allMatch(policy -> {
            return switch (AclPermission.getPermissionByValue(policy.getPermission(), Module.class)) {
                case MODULE_CREATE_MODULE_INSTANCES:
                    yield !policy.getPermissionGroups().contains(sampleRoleViewDTO.getId());
                case MODULE_READ_MODULE_INSTANCES:
                    yield policy.getPermissionGroups().contains(sampleRoleViewDTO.getId());
                default:
                    yield false;
            };
        });

        // Check module instance permissions
        ModuleInstance moduleInstance =
                moduleInstanceRepository.findById(moduleInstanceDTO.getId()).block();
        Set<Policy> moduleInstancePolicies = moduleInstance.getPolicies();

        assertThat(moduleInstancePolicies).hasSize(4).allMatch(policy -> {
            return switch (AclPermission.getPermissionByValue(policy.getPermission(), ModuleInstance.class)) {
                case DELETE_MODULE_INSTANCES:
                    yield !policy.getPermissionGroups().contains(sampleRoleViewDTO.getId());
                case READ_MODULE_INSTANCES:
                case MANAGE_MODULE_INSTANCES:
                case EXECUTE_MODULE_INSTANCES:
                    yield policy.getPermissionGroups().contains(sampleRoleViewDTO.getId());
                default:
                    yield false;
            };
        });

        // Check composed actions permissions
        List<ActionViewDTO> composedActions =
                createModuleInstanceResponseDTO.getEntities().getActions();

        assertThat(composedActions).hasSize(1);

        NewAction newAction =
                newActionRepository.findById(composedActions.get(0).getId()).block();
        assertThat(newAction.getPolicies()).hasSize(4).allMatch(policy -> {
            return switch (AclPermission.getPermissionByValue(policy.getPermission(), NewAction.class)) {
                case DELETE_ACTIONS:
                    yield !policy.getPermissionGroups().contains(sampleRoleViewDTO.getId());
                case READ_ACTIONS:
                case MANAGE_ACTIONS:
                case EXECUTE_ACTIONS:
                    yield policy.getPermissionGroups().contains(sampleRoleViewDTO.getId());
                default:
                    yield false;
            };
        });
    }
}
