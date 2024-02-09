package com.appsmith.server.solutions.ee;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.Environment;
import com.appsmith.external.models.ModuleInput;
import com.appsmith.external.models.ModuleInputForm;
import com.appsmith.external.models.ModuleType;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.Property;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Package;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ConsumablePackagesAndModulesDTO;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.InviteUsersToApplicationDTO;
import com.appsmith.server.dtos.MemberInfoDTO;
import com.appsmith.server.dtos.ModuleActionDTO;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.UpdateApplicationRoleDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exports.exportable.ExportService;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.imports.importable.ImportService;
import com.appsmith.server.moduleinstances.crud.CrudModuleInstanceService;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.packages.crud.CrudPackageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.publish.packages.internal.PublishPackageService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import com.appsmith.server.repositories.ModuleRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.PackageRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.ApplicationMemberService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.EnvironmentService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserGroupService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.UserWorkspaceService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import com.appsmith.server.themes.base.ThemeService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.assertj.core.api.AssertionsForClassTypes;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import static com.appsmith.server.acl.AclPermission.APPLICATION_CREATE_PAGES;
import static com.appsmith.server.acl.AclPermission.CREATE_DATASOURCE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.DELETE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.DELETE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.DELETE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.DELETE_MODULE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.DELETE_PAGES;
import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.EXECUTE_ENVIRONMENTS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_MODULE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.EXPORT_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.INVITE_USERS_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MAKE_PUBLIC_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_MODULE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.MANAGE_THEMES;
import static com.appsmith.server.acl.AclPermission.MANAGE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.MODULE_CREATE_MODULE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.MODULE_READ_MODULE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.PACKAGE_CREATE_MODULE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.PACKAGE_READ_MODULE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.PAGE_CREATE_PAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.PUBLISH_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_MODULE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_THEMES;
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_CREATE_PACKAGE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_DATASOURCE_CREATE_DATASOURCE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_READ_PACKAGE_INSTANCES;
import static com.appsmith.server.constants.ArtifactJsonType.APPLICATION;
import static com.appsmith.server.constants.FieldName.ADMINISTRATOR;
import static com.appsmith.server.constants.FieldName.APPLICATION_DEVELOPER;
import static com.appsmith.server.constants.FieldName.APPLICATION_VIEWER;
import static com.appsmith.server.constants.FieldName.DEVELOPER;
import static com.appsmith.server.constants.FieldName.VIEWER;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
public class ApplicationShareTest {

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    UserUtils userUtils;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    ImportService importService;

    @Autowired
    ExportService exportService;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    LayoutCollectionService layoutCollectionService;

    @SpyBean
    PluginService pluginService;

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    ThemeService themeService;

    @Autowired
    UserAndAccessManagementService userAndAccessManagementService;

    @Autowired
    ApplicationMemberService applicationMemberService;

    @Autowired
    UserGroupService userGroupService;

    @Autowired
    UserService userService;

    @Autowired
    UserWorkspaceService userWorkspaceService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    EnvironmentService environmentService;

    @Autowired
    ApplicationRepository applicationRepository;

    @Autowired
    DatasourceRepository datasourceRepository;

    @Autowired
    NewActionRepository newActionRepository;

    @Autowired
    NewPageRepository newPageRepository;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    ThemeRepository themeRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    WorkspaceRepository workspaceRepository;

    @Autowired
    EnvironmentPermission environmentPermission;

    @Autowired
    ActionCollectionRepository actionCollectionRepository;

    @Autowired
    SessionUserService sessionUserService;

    @SpyBean
    FeatureFlagService featureFlagService;

    @Autowired
    ApplicationPermission applicationPermission;

    @Autowired
    CrudPackageService crudPackageService;

    @Autowired
    PublishPackageService publishPackageService;

    @Autowired
    CrudModuleService crudModuleService;

    @Autowired
    CrudModuleInstanceService crudModuleInstanceService;

    @Autowired
    ModuleInstanceRepository moduleInstanceRepository;

    @Autowired
    ModuleRepository moduleRepository;

    @Autowired
    PackageRepository packageRepository;

    Workspace workspace;

    List<PermissionGroup> defaultWorkspaceRoles;

    PermissionGroup workspaceAdminRole, workspaceDevRole, workspaceViewRole;

    User apiUser = null;
    User testUser = null;

    String originHeader = "http://localhost:8080";
    ModuleDTO sourceModuleDTO = null;
    Optional<ModuleDTO> consumableModuleOptional;
    String workspaceId = null;

    final Set<String> moduleInstancePermissions = Set.of(
            EXECUTE_MODULE_INSTANCES.getValue(),
            READ_MODULE_INSTANCES.getValue(),
            MANAGE_MODULE_INSTANCES.getValue(),
            DELETE_MODULE_INSTANCES.getValue());

    final Set<String> newActionPermissions = Set.of(
            MANAGE_ACTIONS.getValue(), DELETE_ACTIONS.getValue(), READ_ACTIONS.getValue(), EXECUTE_ACTIONS.getValue());

    @BeforeEach
    public void setup() {
        if (apiUser == null) {
            apiUser = userRepository.findByEmail("api_user").block();
        }
        if (testUser == null) {
            testUser = userRepository.findByEmail("usertest@usertest.com").block();
        }
        User currentUser = sessionUserService.getCurrentUser().block();
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_gac_enabled)))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_audit_logs_enabled)))
                .thenReturn(Mono.just(FALSE));

        CachedFeatures cachedFeatures = new CachedFeatures();
        cachedFeatures.setFeatures(Map.of(FeatureFlagEnum.license_gac_enabled.name(), TRUE));
        cachedFeatures.setFeatures(Map.of(FeatureFlagEnum.release_query_module_enabled.name(), TRUE));
        Mockito.when(featureFlagService.getCachedTenantFeatureFlags()).thenReturn(cachedFeatures);
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.release_query_module_enabled)))
                .thenReturn(Mono.just(TRUE));

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        Mockito.doReturn(Mono.just(Map.of())).when(pluginService).getFormConfig(Mockito.anyString());

        Workspace workspace1 = new Workspace();
        workspace1.setName("ApplicationShareTest");
        workspace = workspaceService.create(workspace1, currentUser, TRUE).block();

        workspaceId = workspace.getId();

        defaultWorkspaceRoles = permissionGroupService
                .findAllByIds(workspace.getDefaultPermissionGroups())
                .collectList()
                .block();
        workspaceAdminRole = defaultWorkspaceRoles.stream()
                .filter(role -> role.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();
        workspaceDevRole = defaultWorkspaceRoles.stream()
                .filter(role -> role.getName().startsWith(DEVELOPER))
                .findFirst()
                .get();
        workspaceViewRole = defaultWorkspaceRoles.stream()
                .filter(role -> role.getName().startsWith(VIEWER))
                .findFirst()
                .get();

        createAndPublishPackage();

        fetchConsumableModule();
    }

    private void createAndPublishPackage() {

        PackageDTO aPackage = getPackageRequestDTO();

        PackageDTO packageDTO = createPackage(aPackage);

        ModuleDTO moduleReqDTO = createModuleRequestDTO(packageDTO);

        sourceModuleDTO = createModule(moduleReqDTO);

        publishPackageService.publishPackage(packageDTO.getId()).block();
    }

    private PackageDTO getPackageRequestDTO() {
        PackageDTO aPackage = new PackageDTO();
        aPackage.setName("Package Publish Test");
        aPackage.setColor("#C2DAF0");
        aPackage.setIcon("rupee");

        return aPackage;
    }

    private ModuleDTO createModule(ModuleDTO moduleReqDTO) {
        return crudModuleService.createModule(moduleReqDTO).block();
    }

    private PackageDTO createPackage(PackageDTO aPackage) {
        return crudPackageService.createPackage(aPackage, workspaceId).block();
    }

    private ModuleDTO createModuleRequestDTO(PackageDTO packageDTO) {
        ModuleDTO moduleReqDTO = new ModuleDTO();
        moduleReqDTO.setName("GetUsers");
        moduleReqDTO.setPackageId(packageDTO.getId());
        moduleReqDTO.setType(ModuleType.QUERY_MODULE);

        ModuleActionDTO moduleActionDTO = new ModuleActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("Select * from users where gender = {{inputs.genderInput}}");

        moduleActionDTO.setDynamicBindingPathList(List.of(new Property("body", null)));

        // configure inputs
        List<ModuleInputForm> moduleInputsForm = new ArrayList<>();
        ModuleInputForm genderInputForm = new ModuleInputForm();
        genderInputForm.setId(UUID.randomUUID().toString());
        genderInputForm.setSectionName("");
        List<ModuleInput> inputChildren = new ArrayList<>();
        ModuleInput genderInput = new ModuleInput();
        genderInput.setLabel("genderInput");
        genderInput.setPropertyName("inputs.genderInput");
        genderInput.setDefaultValue("{{\"female\"}}");
        genderInput.setControlType("INPUT_TEXT");
        inputChildren.add(genderInput);
        genderInputForm.setChildren(inputChildren);

        moduleInputsForm.add(genderInputForm);
        moduleReqDTO.setInputsForm(moduleInputsForm);

        Datasource datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(workspaceId);
        Plugin installed_plugin =
                pluginService.findByPackageName("restapi-plugin").block();
        datasource.setPluginId(installed_plugin.getId());
        datasource.setDatasourceConfiguration(new DatasourceConfiguration());

        actionConfiguration.setPluginSpecifiedTemplates(List.of(new Property(null, TRUE)));
        moduleActionDTO.setActionConfiguration(actionConfiguration);
        moduleActionDTO.setDatasource(datasource);
        moduleActionDTO.setPluginId(datasource.getPluginId());

        moduleReqDTO.setEntity(moduleActionDTO);
        return moduleReqDTO;
    }

    private void fetchConsumableModule() {
        ConsumablePackagesAndModulesDTO allConsumablePackages =
                crudPackageService.getAllPackagesForConsumer(workspaceId).block();

        consumableModuleOptional = allConsumablePackages.getModules().stream().findFirst();
        AssertionsForClassTypes.assertThat(consumableModuleOptional).isPresent();
    }

    @AfterEach
    public void cleanup() {
        User currentUser = sessionUserService.getCurrentUser().block();
        permissionGroupService
                .bulkAssignToUsersWithoutPermission(workspaceAdminRole, List.of(currentUser))
                .block();
        applicationService
                .findByWorkspaceId(workspace.getId(), applicationPermission.getDeletePermission())
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .collectList()
                .block();
        workspaceService.archiveById(workspace.getId()).block();
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testGenerateDefaultRoleForTestUser_validateDevAppRole() {
        String testName = "testGenerateDefaultRoleForTestUser_validateDevAppRole";
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        String pluginId =
                pluginService.findByPackageName("restapi-plugin").block().getId();
        PermissionGroup instanceAdminRole =
                userUtils.getSuperAdminPermissionGroup().block();
        String adminRoleId = workspaceAdminRole.getId();
        String devRoleId = workspaceDevRole.getId();

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        Theme systemTheme = themeRepository.getSystemThemeByName("Classic").block();
        Theme applicationTheme = themeService
                .persistCurrentTheme(createdApplication.getId(), null, systemTheme)
                .flatMap(persistedTheme -> themeService.updateTheme(createdApplication.getId(), null, persistedTheme))
                .block();

        Datasource datasource = new Datasource();
        datasource.setName(testName);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        datasource.setWorkspaceId(workspace.getId());
        datasource.setPluginId(pluginId);

        String environmentId = workspaceService
                .getDefaultEnvironmentId(workspace.getId(), environmentPermission.getExecutePermission())
                .block();
        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(environmentId, new DatasourceStorageDTO(null, environmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Datasource createdDatasource = datasourceService.create(datasource).block();

        Datasource datasourceWithoutActions = new Datasource();
        datasourceWithoutActions.setName(testName + "WithoutAction");
        DatasourceConfiguration datasourceConfiguration1 = new DatasourceConfiguration();
        datasourceConfiguration1.setUrl("http://test.com");
        datasourceWithoutActions.setWorkspaceId(workspace.getId());
        datasourceWithoutActions.setPluginId(pluginId);

        HashMap<String, DatasourceStorageDTO> storages2 = new HashMap<>();
        storages2.put(environmentId, new DatasourceStorageDTO(null, environmentId, datasourceConfiguration1));
        datasourceWithoutActions.setDatasourceStorages(storages2);

        Datasource createdDatasourceWithoutActions =
                datasourceService.create(datasourceWithoutActions).block();

        ActionDTO action = new ActionDTO();
        action.setName(testName);
        action.setWorkspaceId(workspace.getId());
        action.setPluginId(pluginId);
        action.setPageId(createdApplication.getPages().get(0).getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(createdDatasource);

        ActionDTO createdActionBlock =
                layoutActionService.createSingleAction(action, FALSE).block();

        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("testActionCollection");
        actionCollectionDTO.setApplicationId(createdApplication.getId());
        actionCollectionDTO.setWorkspaceId(workspace.getId());
        actionCollectionDTO.setPageId(
                createdApplication.getPages().stream().findAny().get().getDefaultPageId());
        actionCollectionDTO.setPluginId(pluginId);
        actionCollectionDTO.setPluginType(PluginType.JS);

        ActionCollectionDTO createdActionCollectionDTO = layoutCollectionService
                .createCollection(actionCollectionDTO, null)
                .block();

        ModuleDTO consumableModule = consumableModuleOptional.get();

        ModuleInstanceDTO moduleInstanceReqDTO = new ModuleInstanceDTO();
        moduleInstanceReqDTO.setContextId(
                createdApplication.getPages().stream().findAny().get().getDefaultPageId());
        moduleInstanceReqDTO.setContextType(CreatorContextType.PAGE);
        moduleInstanceReqDTO.setName("GetUsers1");
        moduleInstanceReqDTO.setSourceModuleId(consumableModule.getId());
        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO = crudModuleInstanceService
                .createModuleInstance(moduleInstanceReqDTO, null)
                .block();
        ModuleInstanceDTO moduleInstanceDTO = createModuleInstanceResponseDTO.getModuleInstance();

        PermissionGroup devApplicationRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_DEVELOPER)
                .block();
        assertThat(devApplicationRole).isNotNull();
        assertThat(devApplicationRole.getName()).isEqualTo(APPLICATION_DEVELOPER + " - " + testName);
        assertThat(devApplicationRole.getDefaultDomainId()).isEqualTo(createdApplication.getId());
        assertThat(devApplicationRole.getDefaultDomainType()).isEqualTo(Application.class.getSimpleName());
        Optional<Policy> managePolicy = devApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.MANAGE_PERMISSION_GROUPS.getValue()))
                .findFirst();
        assertThat(managePolicy.isEmpty()).isTrue();
        Optional<Policy> readPolicy = devApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.READ_PERMISSION_GROUPS.getValue()))
                .findFirst();
        assertThat(readPolicy.isPresent()).isTrue();
        assertThat(readPolicy.get().getPermissionGroups()).isEqualTo(Set.of(instanceAdminRole.getId()));
        Optional<Policy> assignPolicy = devApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.ASSIGN_PERMISSION_GROUPS.getValue()))
                .findFirst();
        assertThat(assignPolicy.isPresent()).isTrue();
        assertThat(assignPolicy.get().getPermissionGroups())
                .isEqualTo(Set.of(devApplicationRole.getId(), instanceAdminRole.getId(), adminRoleId, devRoleId));
        Optional<Policy> unAssignPolicy = devApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.UNASSIGN_PERMISSION_GROUPS.getValue()))
                .findFirst();
        assertThat(unAssignPolicy.isPresent()).isTrue();
        assertThat(unAssignPolicy.get().getPermissionGroups())
                .isEqualTo(Set.of(instanceAdminRole.getId(), adminRoleId));
        Optional<Policy> readMembersPolicyDev = devApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.READ_PERMISSION_GROUP_MEMBERS.getValue()))
                .findFirst();
        assertThat(readMembersPolicyDev.isPresent()).isTrue();
        assertThat(readMembersPolicyDev.get().getPermissionGroups())
                .isEqualTo(Set.of(devApplicationRole.getId(), instanceAdminRole.getId(), adminRoleId, devRoleId));

        Set<Policy> applicationPolicies = applicationRepository
                .findById(createdApplication.getId())
                .block()
                .getPolicies();
        Set<Policy> datasourcePolicies =
                datasourceRepository.findById(createdDatasource.getId()).block().getPolicies();
        Set<Policy> datasourceWithoutActionPolicies = datasourceRepository
                .findById(createdDatasourceWithoutActions.getId())
                .block()
                .getPolicies();
        Set<Policy> newPagePolicies = newPageRepository
                .findById(createdApplication.getPages().get(0).getId())
                .block()
                .getPolicies();
        Set<Policy> newActionPolicies =
                newActionRepository.findById(createdActionBlock.getId()).block().getPolicies();
        Set<Policy> actionCollectionPolicies = actionCollectionRepository
                .findById(createdActionCollectionDTO.getId())
                .block()
                .getPolicies();
        Set<Policy> moduleInstancePolicies = moduleInstanceRepository
                .findById(moduleInstanceDTO.getId())
                .block()
                .getPolicies();

        Module module =
                moduleRepository.findById(moduleInstanceDTO.getSourceModuleId()).block();

        Set<Policy> modulePolicies = module.getPolicies();

        Set<Policy> packagePolicies =
                packageRepository.findById(module.getPackageId()).block().getPolicies();

        Set<Policy> composedActionPolicies = newActionRepository
                .findById(createModuleInstanceResponseDTO
                        .getEntities()
                        .getActions()
                        .get(0)
                        .getId())
                .block()
                .getPolicies();
        Set<Policy> systemThemePolicies =
                themeRepository.findById(systemTheme.getId()).block().getPolicies();
        Set<Policy> applicationThemePolicies =
                themeRepository.findById(applicationTheme.getId()).block().getPolicies();
        Set<Policy> workspacePolicies =
                workspaceRepository.findById(workspace.getId()).block().getPolicies();

        applicationPolicies.forEach(policy -> {
            if (policy.getPermission().equals(EXPORT_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(devApplicationRole.getId());
            }
            if (policy.getPermission().equals(READ_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            }
            if (policy.getPermission().equals(MANAGE_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            }
            if (policy.getPermission().equals(DELETE_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            }
            if (policy.getPermission().equals(PUBLISH_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(devApplicationRole.getId());
            }
            if (policy.getPermission().equals(MAKE_PUBLIC_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(devApplicationRole.getId());
            }
            if (policy.getPermission().equals(APPLICATION_CREATE_PAGES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            }
            if (policy.getPermission().equals(INVITE_USERS_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            }
        });

        /*
         * datasourcePolicies signifies the policies of datasource which is related to the application.
         * datasourceWithoutActionPolicies signifies the policies of datasource which is not related to the application.
         * Both the datasources belong to the same workspace where the application is present.
         * Here we are asserting that irrespective of whether the datasource is related to application or not,
         * application developer role should have the same permissions to all datasources in workspace.
         *
         * Clarification Note:
         * 1. When we say that the datasource is related to an application, what we are actually saying is that
         * there exists a query in the application which is using that datasource.
         */
        Stream.of(datasourcePolicies, datasourceWithoutActionPolicies)
                .forEach(resourcePolicies -> resourcePolicies.forEach(policy -> {
                    if (policy.getPermission().equals(MANAGE_DATASOURCES.getValue())) {
                        assertThat(policy.getPermissionGroups()).doesNotContain(devApplicationRole.getId());
                    }
                    if (policy.getPermission().equals(DELETE_DATASOURCES.getValue())) {
                        assertThat(policy.getPermissionGroups()).doesNotContain(devApplicationRole.getId());
                    }
                    if (policy.getPermission().equals(EXECUTE_DATASOURCES.getValue())) {
                        assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                    }
                    if (policy.getPermission().equals(READ_DATASOURCES.getValue())) {
                        assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                    }
                    if (policy.getPermission().equals(CREATE_DATASOURCE_ACTIONS.getValue())) {
                        assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                    }
                }));

        newPagePolicies.forEach(policy -> {
            if (policy.getPermission().equals(MANAGE_PAGES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            }
            if (policy.getPermission().equals(DELETE_PAGES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            }
            if (policy.getPermission().equals(READ_PAGES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            }
            if (policy.getPermission().equals(PAGE_CREATE_PAGE_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            }
        });

        newActionPolicies.forEach(policy -> {
            if (policy.getPermission().equals(MANAGE_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            }
            if (policy.getPermission().equals(DELETE_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            }
            if (policy.getPermission().equals(READ_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            }
            if (policy.getPermission().equals(EXECUTE_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            }
        });

        actionCollectionPolicies.forEach(policy -> {
            if (policy.getPermission().equals(MANAGE_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            }
            if (policy.getPermission().equals(DELETE_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            }
            if (policy.getPermission().equals(READ_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            }
            if (policy.getPermission().equals(EXECUTE_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            }
        });

        assertThat(moduleInstancePolicies)
                .allMatch(policy -> moduleInstancePermissions.contains(policy.getPermission()));
        moduleInstancePolicies.forEach(
                policy -> assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId()));

        modulePolicies.forEach(policy -> {
            String permission = policy.getPermission();
            Set<String> permissionGroups = policy.getPermissionGroups();

            AclPermission permissionByValue = AclPermission.getPermissionByValue(permission, Module.class);
            assertThat(permissionByValue).isNotNull();
            if (Set.of(MODULE_READ_MODULE_INSTANCES, MODULE_CREATE_MODULE_INSTANCES)
                    .contains(permissionByValue)) {
                assertThat(permissionGroups).contains(devApplicationRole.getId());
            } else {
                assertThat(permissionGroups).doesNotContain(devApplicationRole.getId());
            }
        });

        packagePolicies.forEach(policy -> {
            String permission = policy.getPermission();
            Set<String> permissionGroups = policy.getPermissionGroups();

            AclPermission permissionByValue = AclPermission.getPermissionByValue(permission, Package.class);
            assertThat(permissionByValue).isNotNull();
            if (Set.of(PACKAGE_READ_MODULE_INSTANCES, PACKAGE_CREATE_MODULE_INSTANCES)
                    .contains(permissionByValue)) {
                assertThat(permissionGroups).contains(devApplicationRole.getId());
            } else {
                assertThat(permissionGroups).doesNotContain(devApplicationRole.getId());
            }
        });

        assertThat(composedActionPolicies).allMatch(policy -> newActionPermissions.contains(policy.getPermission()));
        composedActionPolicies.forEach(
                policy -> assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId()));

        systemThemePolicies.forEach(policy -> {
            if (policy.getPermission().equals(READ_THEMES.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(devApplicationRole.getId());
            }
        });

        applicationThemePolicies.forEach(policy -> {
            if (policy.getPermission().equals(READ_THEMES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            }
            if (policy.getPermission().equals(MANAGE_THEMES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            }
        });
        workspacePolicies.forEach(policy -> {
            if (policy.getPermission().equals(READ_WORKSPACES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            } else if (Set.of(
                            WORKSPACE_DATASOURCE_CREATE_DATASOURCE_ACTIONS.getValue(),
                            WORKSPACE_CREATE_PACKAGE_INSTANCES.getValue(),
                            WORKSPACE_READ_PACKAGE_INSTANCES.getValue())
                    .contains(policy.getPermission())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            } else {
                assertThat(policy.getPermissionGroups()).doesNotContain(devApplicationRole.getId());
            }
        });
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testGenerateDefaultRoleForTestUser_validateDevAppRoleWhenAppViewRoleExists() {
        String testName = "testGenerateDefaultRoleForTestUser_validateDevAppRoleWhenAppViewRoleExists";
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        String pluginId =
                pluginService.findByPackageName("restapi-plugin").block().getId();
        PermissionGroup instanceAdminRole =
                userUtils.getSuperAdminPermissionGroup().block();
        String adminRoleId = workspaceAdminRole.getId();
        String devRoleId = workspaceDevRole.getId();
        String viewRoleId = workspaceViewRole.getId();

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        Theme systemTheme = themeRepository.getSystemThemeByName("Classic").block();
        Theme applicationTheme = themeService
                .persistCurrentTheme(createdApplication.getId(), null, systemTheme)
                .flatMap(persistedTheme -> themeService.updateTheme(createdApplication.getId(), null, persistedTheme))
                .block();

        Datasource datasource = new Datasource();
        datasource.setName(testName);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        datasource.setWorkspaceId(workspace.getId());
        datasource.setPluginId(pluginId);

        String environmentId = workspaceService
                .getDefaultEnvironmentId(workspace.getId(), environmentPermission.getExecutePermission())
                .block();

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(environmentId, new DatasourceStorageDTO(null, environmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Datasource createdDatasource = datasourceService.create(datasource).block();

        ActionDTO action = new ActionDTO();
        action.setName(testName);
        action.setWorkspaceId(workspace.getId());
        action.setPluginId(pluginId);
        action.setPageId(createdApplication.getPages().get(0).getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(createdDatasource);

        ActionDTO createdActionBlock =
                layoutActionService.createSingleAction(action, FALSE).block();

        ModuleDTO consumableModule = consumableModuleOptional.get();

        ModuleInstanceDTO moduleInstanceReqDTO = new ModuleInstanceDTO();
        moduleInstanceReqDTO.setContextId(
                createdApplication.getPages().stream().findAny().get().getDefaultPageId());
        moduleInstanceReqDTO.setContextType(CreatorContextType.PAGE);
        moduleInstanceReqDTO.setName("GetUsers1");
        moduleInstanceReqDTO.setSourceModuleId(consumableModule.getId());
        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO = crudModuleInstanceService
                .createModuleInstance(moduleInstanceReqDTO, null)
                .block();
        ModuleInstanceDTO moduleInstanceDTO = createModuleInstanceResponseDTO.getModuleInstance();

        System.out.println("Create Viewer Role");
        PermissionGroup viewApplicationRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_VIEWER)
                .block();
        System.out.println("Create Developer Role");
        assertThat(viewApplicationRole).isNotNull();
        PermissionGroup devApplicationRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_DEVELOPER)
                .block();
        assertThat(devApplicationRole).isNotNull();
        assertThat(devApplicationRole.getName()).isEqualTo(APPLICATION_DEVELOPER + " - " + testName);
        assertThat(devApplicationRole.getDefaultDomainId()).isEqualTo(createdApplication.getId());
        assertThat(devApplicationRole.getDefaultDomainType()).isEqualTo(Application.class.getSimpleName());
        Optional<Policy> managePolicyDev = devApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.MANAGE_PERMISSION_GROUPS.getValue()))
                .findFirst();
        assertThat(managePolicyDev.isEmpty()).isTrue();
        Optional<Policy> readPolicyDev = devApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.READ_PERMISSION_GROUPS.getValue()))
                .findFirst();
        assertThat(readPolicyDev.isPresent()).isTrue();
        assertThat(readPolicyDev.get().getPermissionGroups()).isEqualTo(Set.of(instanceAdminRole.getId()));
        Optional<Policy> assignPolicyDev = devApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.ASSIGN_PERMISSION_GROUPS.getValue()))
                .findFirst();
        assertThat(assignPolicyDev.isPresent()).isTrue();
        assertThat(assignPolicyDev.get().getPermissionGroups())
                .isEqualTo(Set.of(devApplicationRole.getId(), instanceAdminRole.getId(), adminRoleId, devRoleId));
        Optional<Policy> unAssignPolicyDev = devApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.UNASSIGN_PERMISSION_GROUPS.getValue()))
                .findFirst();
        assertThat(unAssignPolicyDev.isPresent()).isTrue();
        assertThat(unAssignPolicyDev.get().getPermissionGroups())
                .isEqualTo(Set.of(instanceAdminRole.getId(), adminRoleId));
        Optional<Policy> readMembersPolicyDev = devApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.READ_PERMISSION_GROUP_MEMBERS.getValue()))
                .findFirst();
        assertThat(readMembersPolicyDev.isPresent()).isTrue();
        assertThat(readMembersPolicyDev.get().getPermissionGroups())
                .isEqualTo(Set.of(devApplicationRole.getId(), instanceAdminRole.getId(), adminRoleId, devRoleId));

        PermissionGroup updatedViewApplicationRole = permissionGroupRepository
                .findById(viewApplicationRole.getId(), Optional.empty())
                .block();
        assertThat(updatedViewApplicationRole).isNotNull();
        assertThat(updatedViewApplicationRole.getName()).isEqualTo(APPLICATION_VIEWER + " - " + testName);
        assertThat(updatedViewApplicationRole.getDefaultDomainId()).isEqualTo(createdApplication.getId());
        assertThat(updatedViewApplicationRole.getDefaultDomainType()).isEqualTo(Application.class.getSimpleName());
        Optional<Policy> managePolicyView = updatedViewApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.MANAGE_PERMISSION_GROUPS.getValue()))
                .findFirst();
        assertThat(managePolicyView.isEmpty()).isTrue();
        Optional<Policy> readPolicyView = updatedViewApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.READ_PERMISSION_GROUPS.getValue()))
                .findFirst();
        assertThat(readPolicyView.isPresent()).isTrue();
        assertThat(readPolicyView.get().getPermissionGroups()).isEqualTo(Set.of(instanceAdminRole.getId()));
        Optional<Policy> assignPolicyView = updatedViewApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.ASSIGN_PERMISSION_GROUPS.getValue()))
                .findFirst();
        assertThat(assignPolicyView.isPresent()).isTrue();
        assertThat(assignPolicyView.get().getPermissionGroups())
                .isEqualTo(Set.of(
                        viewApplicationRole.getId(),
                        devApplicationRole.getId(),
                        instanceAdminRole.getId(),
                        adminRoleId,
                        devRoleId,
                        viewRoleId));
        Optional<Policy> unAssignPolicyView = updatedViewApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.UNASSIGN_PERMISSION_GROUPS.getValue()))
                .findFirst();
        assertThat(unAssignPolicyView.isPresent()).isTrue();
        assertThat(unAssignPolicyView.get().getPermissionGroups())
                .isEqualTo(Set.of(instanceAdminRole.getId(), adminRoleId));
        Optional<Policy> readMembersPolicyView = updatedViewApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.READ_PERMISSION_GROUP_MEMBERS.getValue()))
                .findFirst();
        assertThat(readMembersPolicyView.isPresent()).isTrue();
        assertThat(readMembersPolicyView.get().getPermissionGroups())
                .isEqualTo(Set.of(
                        viewApplicationRole.getId(),
                        devApplicationRole.getId(),
                        instanceAdminRole.getId(),
                        adminRoleId,
                        devRoleId,
                        viewRoleId));

        Set<Policy> applicationPolicies = applicationRepository
                .findById(createdApplication.getId())
                .block()
                .getPolicies();
        Set<Policy> datasourcePolicies =
                datasourceRepository.findById(createdDatasource.getId()).block().getPolicies();
        Set<Policy> newPagePolicies = newPageRepository
                .findById(createdApplication.getPages().get(0).getId())
                .block()
                .getPolicies();
        Set<Policy> newActionPolicies =
                newActionRepository.findById(createdActionBlock.getId()).block().getPolicies();
        ModuleInstance moduleInstance =
                moduleInstanceRepository.findById(moduleInstanceDTO.getId()).block();
        Set<Policy> moduleInstancePolicies = moduleInstance.getPolicies();
        Set<Policy> composedActionPolicies = newActionRepository
                .findById(createModuleInstanceResponseDTO
                        .getEntities()
                        .getActions()
                        .get(0)
                        .getId())
                .block()
                .getPolicies();
        Set<Policy> systemThemePolicies =
                themeRepository.findById(systemTheme.getId()).block().getPolicies();
        Set<Policy> applicationThemePolicies =
                themeRepository.findById(applicationTheme.getId()).block().getPolicies();
        Set<Policy> workspacePolicies =
                workspaceRepository.findById(workspace.getId()).block().getPolicies();

        applicationPolicies.forEach(policy -> {
            if (policy.getPermission().equals(EXPORT_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups())
                        .doesNotContain(devApplicationRole.getId(), viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(READ_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups())
                        .contains(devApplicationRole.getId(), viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(MANAGE_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(DELETE_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(PUBLISH_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups())
                        .doesNotContain(devApplicationRole.getId(), viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(MAKE_PUBLIC_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups())
                        .doesNotContain(devApplicationRole.getId(), viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(APPLICATION_CREATE_PAGES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(INVITE_USERS_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups())
                        .contains(devApplicationRole.getId(), viewApplicationRole.getId());
            }
        });

        datasourcePolicies.forEach(policy -> {
            if (policy.getPermission().equals(MANAGE_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups())
                        .doesNotContain(devApplicationRole.getId(), viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(DELETE_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups())
                        .doesNotContain(devApplicationRole.getId(), viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(EXECUTE_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups())
                        .contains(devApplicationRole.getId(), viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(READ_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(CREATE_DATASOURCE_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
        });

        newPagePolicies.forEach(policy -> {
            if (policy.getPermission().equals(MANAGE_PAGES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(DELETE_PAGES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(READ_PAGES.getValue())) {
                assertThat(policy.getPermissionGroups())
                        .contains(devApplicationRole.getId(), viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(PAGE_CREATE_PAGE_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
        });

        newActionPolicies.forEach(policy -> {
            if (policy.getPermission().equals(MANAGE_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(DELETE_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(READ_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(EXECUTE_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups())
                        .contains(devApplicationRole.getId(), viewApplicationRole.getId());
            }
        });

        moduleInstancePolicies.forEach(policy -> {
            String permission = policy.getPermission();
            Set<String> permissionGroups = policy.getPermissionGroups();

            AclPermission permissionByValue = AclPermission.getPermissionByValue(permission, ModuleInstance.class);
            assertThat(permissionByValue).isNotNull();
            switch (permissionByValue) {
                case MANAGE_MODULE_INSTANCES, DELETE_MODULE_INSTANCES, READ_MODULE_INSTANCES -> {
                    assertThat(permissionGroups).contains(devApplicationRole.getId());
                    assertThat(permissionGroups).doesNotContain(viewApplicationRole.getId());
                }
                case EXECUTE_MODULE_INSTANCES -> assertThat(permissionGroups)
                        .contains(devApplicationRole.getId(), viewApplicationRole.getId());
            }
        });

        assertThat(composedActionPolicies).allMatch(policy -> newActionPermissions.contains(policy.getPermission()));
        composedActionPolicies.forEach(policy -> {
            String permission = policy.getPermission();
            Set<String> permissionGroups = policy.getPermissionGroups();

            AclPermission permissionByValue = AclPermission.getPermissionByValue(permission, NewAction.class);
            assertThat(permissionByValue).isNotNull();
            switch (permissionByValue) {
                case MANAGE_ACTIONS, DELETE_ACTIONS, READ_ACTIONS -> {
                    assertThat(permissionGroups).contains(devApplicationRole.getId());
                    assertThat(permissionGroups).doesNotContain(viewApplicationRole.getId());
                }
                case EXECUTE_ACTIONS -> assertThat(permissionGroups)
                        .contains(devApplicationRole.getId(), viewApplicationRole.getId());
            }
        });

        systemThemePolicies.forEach(policy -> {
            if (policy.getPermission().equals(READ_THEMES.getValue())) {
                assertThat(policy.getPermissionGroups())
                        .doesNotContain(devApplicationRole.getId(), viewApplicationRole.getId());
            }
        });

        applicationThemePolicies.forEach(policy -> {
            if (policy.getPermission().equals(READ_THEMES.getValue())) {
                assertThat(policy.getPermissionGroups())
                        .contains(devApplicationRole.getId(), viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(MANAGE_THEMES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
        });

        workspacePolicies.forEach(policy -> {
            if (policy.getPermission().equals(READ_WORKSPACES.getValue())) {
                assertThat(policy.getPermissionGroups())
                        .contains(devApplicationRole.getId(), viewApplicationRole.getId());
            } else if (Set.of(
                            WORKSPACE_DATASOURCE_CREATE_DATASOURCE_ACTIONS.getValue(),
                            WORKSPACE_CREATE_PACKAGE_INSTANCES.getValue(),
                            WORKSPACE_READ_PACKAGE_INSTANCES.getValue())
                    .contains(policy.getPermission())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            } else {
                assertThat(policy.getPermissionGroups())
                        .doesNotContain(devApplicationRole.getId(), viewApplicationRole.getId());
            }
        });
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testGenerateDefaultRoleForTestUser_validateViewAppRole() {
        String testName = "testGenerateDefaultRoleForTestUser_validateViewAppRole";
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        String pluginId =
                pluginService.findByPackageName("restapi-plugin").block().getId();
        PermissionGroup instanceAdminRole =
                userUtils.getSuperAdminPermissionGroup().block();
        String adminRoleId = workspaceAdminRole.getId();
        String devRoleId = workspaceDevRole.getId();
        String viewRoleId = workspaceViewRole.getId();

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        Datasource datasource = new Datasource();
        datasource.setName(testName);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        datasource.setWorkspaceId(workspace.getId());
        datasource.setPluginId(pluginId);

        String environmentId = workspaceService
                .getDefaultEnvironmentId(workspace.getId(), environmentPermission.getExecutePermission())
                .block();
        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(environmentId, new DatasourceStorageDTO(null, environmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Datasource createdDatasource = datasourceService.create(datasource).block();

        Datasource datasourceWithoutActions = new Datasource();
        datasourceWithoutActions.setName(testName + "WithoutAction");
        DatasourceConfiguration datasourceConfiguration1 = new DatasourceConfiguration();
        datasourceConfiguration1.setUrl("http://test.com");
        datasourceWithoutActions.setWorkspaceId(workspace.getId());
        datasourceWithoutActions.setPluginId(pluginId);

        HashMap<String, DatasourceStorageDTO> storages2 = new HashMap<>();
        storages2.put(environmentId, new DatasourceStorageDTO(null, environmentId, datasourceConfiguration1));
        datasourceWithoutActions.setDatasourceStorages(storages2);

        Datasource createdDatasourceWithoutActions =
                datasourceService.create(datasourceWithoutActions).block();

        ActionDTO action = new ActionDTO();
        action.setName(testName);
        action.setWorkspaceId(workspace.getId());
        action.setPluginId(pluginId);
        action.setPageId(createdApplication.getPages().get(0).getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(createdDatasource);

        ActionDTO createdActionBlock =
                layoutActionService.createSingleAction(action, FALSE).block();

        ModuleDTO consumableModule = consumableModuleOptional.get();

        ModuleInstanceDTO moduleInstanceReqDTO = new ModuleInstanceDTO();
        moduleInstanceReqDTO.setContextId(
                createdApplication.getPages().stream().findAny().get().getDefaultPageId());
        moduleInstanceReqDTO.setContextType(CreatorContextType.PAGE);
        moduleInstanceReqDTO.setName("GetUsers1");
        moduleInstanceReqDTO.setSourceModuleId(consumableModule.getId());
        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO = crudModuleInstanceService
                .createModuleInstance(moduleInstanceReqDTO, null)
                .block();
        ModuleInstanceDTO moduleInstanceDTO = createModuleInstanceResponseDTO.getModuleInstance();

        PermissionGroup viewApplicationRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_VIEWER)
                .block();
        assertThat(viewApplicationRole).isNotNull();
        assertThat(viewApplicationRole.getName()).isEqualTo(APPLICATION_VIEWER + " - " + testName);
        assertThat(viewApplicationRole.getDefaultDomainId()).isEqualTo(createdApplication.getId());
        assertThat(viewApplicationRole.getDefaultDomainType()).isEqualTo(Application.class.getSimpleName());
        Optional<Policy> managePolicy = viewApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.MANAGE_PERMISSION_GROUPS.getValue()))
                .findFirst();
        assertThat(managePolicy.isEmpty()).isTrue();
        Optional<Policy> readPolicy = viewApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.READ_PERMISSION_GROUPS.getValue()))
                .findFirst();
        assertThat(readPolicy.isPresent()).isTrue();
        assertThat(readPolicy.get().getPermissionGroups()).isEqualTo(Set.of(instanceAdminRole.getId()));
        Optional<Policy> assignPolicy = viewApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.ASSIGN_PERMISSION_GROUPS.getValue()))
                .findFirst();
        assertThat(assignPolicy.isPresent()).isTrue();
        assertThat(assignPolicy.get().getPermissionGroups())
                .isEqualTo(Set.of(
                        viewApplicationRole.getId(), instanceAdminRole.getId(), adminRoleId, devRoleId, viewRoleId));
        Optional<Policy> unAssignPolicy = viewApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.UNASSIGN_PERMISSION_GROUPS.getValue()))
                .findFirst();
        assertThat(unAssignPolicy.isPresent()).isTrue();
        assertThat(unAssignPolicy.get().getPermissionGroups())
                .isEqualTo(Set.of(instanceAdminRole.getId(), adminRoleId));
        Optional<Policy> readMembersPolicy = viewApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.READ_PERMISSION_GROUP_MEMBERS.getValue()))
                .findFirst();
        assertThat(readMembersPolicy.isPresent()).isTrue();
        assertThat(readMembersPolicy.get().getPermissionGroups())
                .isEqualTo(Set.of(
                        viewApplicationRole.getId(), instanceAdminRole.getId(), adminRoleId, devRoleId, viewRoleId));

        Set<Policy> applicationPolicies = applicationRepository
                .findById(createdApplication.getId())
                .block()
                .getPolicies();
        Set<Policy> datasourcePolicies =
                datasourceRepository.findById(createdDatasource.getId()).block().getPolicies();
        Set<Policy> datasourceWithoutActionPolicies = datasourceRepository
                .findById(createdDatasourceWithoutActions.getId())
                .block()
                .getPolicies();
        Set<Policy> newPagePolicies = newPageRepository
                .findById(createdApplication.getPages().get(0).getId())
                .block()
                .getPolicies();
        Set<Policy> newActionPolicies =
                newActionRepository.findById(createdActionBlock.getId()).block().getPolicies();
        Set<Policy> moduleInstancePolicies = moduleInstanceRepository
                .findById(moduleInstanceDTO.getId())
                .block()
                .getPolicies();

        Module module =
                moduleRepository.findById(moduleInstanceDTO.getSourceModuleId()).block();

        Set<Policy> modulePolicies = module.getPolicies();

        Set<Policy> packagePolicies =
                packageRepository.findById(module.getPackageId()).block().getPolicies();

        Set<Policy> composedActionPolicies = newActionRepository
                .findById(createModuleInstanceResponseDTO
                        .getEntities()
                        .getActions()
                        .get(0)
                        .getId())
                .block()
                .getPolicies();

        Set<Policy> workspacePolicies =
                workspaceRepository.findById(workspace.getId()).block().getPolicies();

        applicationPolicies.forEach(policy -> {
            if (policy.getPermission().equals(EXPORT_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(READ_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(MANAGE_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(DELETE_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(PUBLISH_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(MAKE_PUBLIC_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(APPLICATION_CREATE_PAGES.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(INVITE_USERS_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(viewApplicationRole.getId());
            }
        });

        /*
         * datasourcePolicies signifies the policies of datasource which is related to the application.
         * datasourceWithoutActionPolicies signifies the policies of datasource which is not related to the application.
         * Both the datasources belong to the same workspace where the application is present.
         * Here we are asserting that irrespective of whether the datasource is related to application or not,
         * application viewer role should not have MANAGE_DATASOURCES, DELETE_DATASOURCES, READ_DATASOURCES &
         * CREATE_DATASOURCE_ACTIONS for any datasource in workspace.
         *
         * application viewer role should have EXECUTE_DATASOURCES for the datasource related to application.
         *
         * Clarification Note:
         * 1. When we say that the datasource is related to an application, what we are actually saying is that
         * there exists a query in the application which is using that datasource.
         */
        Stream.of(datasourcePolicies, datasourceWithoutActionPolicies)
                .forEach(resourcePolicy -> resourcePolicy.forEach(policy -> {
                    if (policy.getPermission().equals(MANAGE_DATASOURCES.getValue())) {
                        assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
                    }
                    if (policy.getPermission().equals(DELETE_DATASOURCES.getValue())) {
                        assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
                    }
                    if (policy.getPermission().equals(READ_DATASOURCES.getValue())) {
                        assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
                    }
                    if (policy.getPermission().equals(CREATE_DATASOURCE_ACTIONS.getValue())) {
                        assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
                    }
                }));
        datasourcePolicies.stream()
                .filter(policy -> policy.getPermission().equals(EXECUTE_DATASOURCES.getValue()))
                .forEach(policy -> assertThat(policy.getPermissionGroups()).contains(viewApplicationRole.getId()));

        datasourceWithoutActionPolicies.stream()
                .filter(policy -> policy.getPermission().equals(EXECUTE_DATASOURCES.getValue()))
                .forEach(
                        policy -> assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId()));

        newPagePolicies.forEach(policy -> {
            if (policy.getPermission().equals(MANAGE_PAGES.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(DELETE_PAGES.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(READ_PAGES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(PAGE_CREATE_PAGE_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
        });

        newActionPolicies.forEach(policy -> {
            if (policy.getPermission().equals(MANAGE_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(DELETE_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(READ_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(EXECUTE_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(viewApplicationRole.getId());
            }
        });

        assertThat(moduleInstancePolicies)
                .allMatch(policy -> moduleInstancePermissions.contains(policy.getPermission()));
        moduleInstancePolicies.forEach(policy -> {
            String permission = policy.getPermission();
            Set<String> permissionGroups = policy.getPermissionGroups();

            AclPermission permissionByValue = AclPermission.getPermissionByValue(permission, ModuleInstance.class);
            assertThat(permissionByValue).isNotNull();
            switch (permissionByValue) {
                case MANAGE_MODULE_INSTANCES, DELETE_MODULE_INSTANCES, READ_MODULE_INSTANCES -> {
                    assertThat(permissionGroups).doesNotContain(viewApplicationRole.getId());
                }
                case EXECUTE_MODULE_INSTANCES -> assertThat(permissionGroups).contains(viewApplicationRole.getId());
            }
        });

        modulePolicies.forEach(policy -> {
            String permission = policy.getPermission();
            Set<String> permissionGroups = policy.getPermissionGroups();

            AclPermission permissionByValue = AclPermission.getPermissionByValue(permission, Module.class);
            assertThat(permissionByValue).isNotNull();
            assertThat(permissionGroups).doesNotContain(viewApplicationRole.getId());
        });

        packagePolicies.forEach(policy -> {
            String permission = policy.getPermission();
            Set<String> permissionGroups = policy.getPermissionGroups();

            AclPermission permissionByValue = AclPermission.getPermissionByValue(permission, Package.class);
            assertThat(permissionByValue).isNotNull();
            assertThat(permissionGroups).doesNotContain(viewApplicationRole.getId());
        });

        assertThat(composedActionPolicies).allMatch(policy -> newActionPermissions.contains(policy.getPermission()));
        composedActionPolicies.forEach(policy -> {
            String permission = policy.getPermission();
            Set<String> permissionGroups = policy.getPermissionGroups();

            AclPermission permissionByValue = AclPermission.getPermissionByValue(permission, NewAction.class);
            assertThat(permissionByValue).isNotNull();
            switch (permissionByValue) {
                case MANAGE_ACTIONS, DELETE_ACTIONS, READ_ACTIONS -> {
                    assertThat(permissionGroups).doesNotContain(viewApplicationRole.getId());
                }
                case EXECUTE_ACTIONS -> assertThat(permissionGroups).contains(viewApplicationRole.getId());
            }
        });

        workspacePolicies.forEach(policy -> {
            if (policy.getPermission().equals(READ_WORKSPACES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(viewApplicationRole.getId());
            } else {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
        });
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testGenerateDefaultRoleForTestUser_validateViewAppRoleWhenDevRoleExists() {
        String testName = "testGenerateDefaultRoleForTestUser_validateViewAppRoleWhenDevRoleCreated";
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        String pluginId =
                pluginService.findByPackageName("restapi-plugin").block().getId();
        PermissionGroup instanceAdminRole =
                userUtils.getSuperAdminPermissionGroup().block();
        String adminRoleId = workspaceAdminRole.getId();
        String devRoleId = workspaceDevRole.getId();
        String viewRoleId = workspaceViewRole.getId();

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        Datasource datasource = new Datasource();
        datasource.setName(testName);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        datasource.setWorkspaceId(workspace.getId());
        datasource.setPluginId(pluginId);

        String environmentId = workspaceService
                .getDefaultEnvironmentId(workspace.getId(), environmentPermission.getExecutePermission())
                .block();

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(environmentId, new DatasourceStorageDTO(null, environmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Datasource createdDatasource = datasourceService.create(datasource).block();

        ActionDTO action = new ActionDTO();
        action.setName(testName);
        action.setWorkspaceId(workspace.getId());
        action.setPluginId(pluginId);
        action.setPageId(createdApplication.getPages().get(0).getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(createdDatasource);

        ActionDTO createdActionBlock =
                layoutActionService.createSingleAction(action, FALSE).block();

        ModuleDTO consumableModule = consumableModuleOptional.get();

        ModuleInstanceDTO moduleInstanceReqDTO = new ModuleInstanceDTO();
        moduleInstanceReqDTO.setContextId(
                createdApplication.getPages().stream().findAny().get().getDefaultPageId());
        moduleInstanceReqDTO.setContextType(CreatorContextType.PAGE);
        moduleInstanceReqDTO.setName("GetUsers1");
        moduleInstanceReqDTO.setSourceModuleId(consumableModule.getId());
        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO = crudModuleInstanceService
                .createModuleInstance(moduleInstanceReqDTO, null)
                .block();
        ModuleInstanceDTO moduleInstanceDTO = createModuleInstanceResponseDTO.getModuleInstance();

        System.out.println("Create Dev Role");
        PermissionGroup devApplicationRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_DEVELOPER)
                .block();
        assertThat(devApplicationRole).isNotNull();
        System.out.println("Create View Role");
        PermissionGroup viewApplicationRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_VIEWER)
                .block();
        assertThat(viewApplicationRole).isNotNull();
        assertThat(viewApplicationRole.getName()).isEqualTo(APPLICATION_VIEWER + " - " + testName);
        assertThat(viewApplicationRole.getDefaultDomainId()).isEqualTo(createdApplication.getId());
        assertThat(viewApplicationRole.getDefaultDomainType()).isEqualTo(Application.class.getSimpleName());
        Optional<Policy> managePolicy = viewApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.MANAGE_PERMISSION_GROUPS.getValue()))
                .findFirst();
        assertThat(managePolicy.isEmpty()).isTrue();
        Optional<Policy> readPolicy = viewApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.READ_PERMISSION_GROUPS.getValue()))
                .findFirst();
        assertThat(readPolicy.isPresent()).isTrue();
        assertThat(readPolicy.get().getPermissionGroups()).isEqualTo(Set.of(instanceAdminRole.getId()));
        Optional<Policy> assignPolicy = viewApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.ASSIGN_PERMISSION_GROUPS.getValue()))
                .findFirst();
        assertThat(assignPolicy.isPresent()).isTrue();
        assertThat(assignPolicy.get().getPermissionGroups())
                .isEqualTo(Set.of(
                        viewApplicationRole.getId(),
                        devApplicationRole.getId(),
                        instanceAdminRole.getId(),
                        adminRoleId,
                        devRoleId,
                        viewRoleId));
        Optional<Policy> unAssignPolicy = viewApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.UNASSIGN_PERMISSION_GROUPS.getValue()))
                .findFirst();
        assertThat(unAssignPolicy.isPresent()).isTrue();
        assertThat(unAssignPolicy.get().getPermissionGroups())
                .isEqualTo(Set.of(instanceAdminRole.getId(), adminRoleId));

        Optional<Policy> readMembersPolicy = viewApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.READ_PERMISSION_GROUP_MEMBERS.getValue()))
                .findFirst();
        assertThat(readMembersPolicy.isPresent()).isTrue();
        assertThat(readMembersPolicy.get().getPermissionGroups())
                .isEqualTo(Set.of(
                        viewApplicationRole.getId(),
                        devApplicationRole.getId(),
                        instanceAdminRole.getId(),
                        adminRoleId,
                        devRoleId,
                        viewRoleId));

        Set<Policy> applicationPolicies = applicationRepository
                .findById(createdApplication.getId())
                .block()
                .getPolicies();
        Set<Policy> datasourcePolicies =
                datasourceRepository.findById(createdDatasource.getId()).block().getPolicies();
        Set<Policy> newPagePolicies = newPageRepository
                .findById(createdApplication.getPages().get(0).getId())
                .block()
                .getPolicies();
        Set<Policy> newActionPolicies =
                newActionRepository.findById(createdActionBlock.getId()).block().getPolicies();

        Set<Policy> moduleInstancePolicies = moduleInstanceRepository
                .findById(moduleInstanceDTO.getId())
                .block()
                .getPolicies();

        Module module =
                moduleRepository.findById(moduleInstanceDTO.getSourceModuleId()).block();

        Set<Policy> modulePolicies = module.getPolicies();

        Set<Policy> packagePolicies =
                packageRepository.findById(module.getPackageId()).block().getPolicies();

        Set<Policy> composedActionPolicies = newActionRepository
                .findById(createModuleInstanceResponseDTO
                        .getEntities()
                        .getActions()
                        .get(0)
                        .getId())
                .block()
                .getPolicies();

        Set<Policy> workspacePolicies =
                workspaceRepository.findById(workspace.getId()).block().getPolicies();

        applicationPolicies.forEach(policy -> {
            if (policy.getPermission().equals(EXPORT_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups())
                        .doesNotContain(devApplicationRole.getId(), viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(READ_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups())
                        .contains(devApplicationRole.getId(), viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(MANAGE_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(DELETE_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(PUBLISH_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups())
                        .doesNotContain(devApplicationRole.getId(), viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(MAKE_PUBLIC_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups())
                        .doesNotContain(devApplicationRole.getId(), viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(APPLICATION_CREATE_PAGES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(INVITE_USERS_APPLICATIONS.getValue())) {
                assertThat(policy.getPermissionGroups())
                        .contains(devApplicationRole.getId(), viewApplicationRole.getId());
            }
        });

        datasourcePolicies.forEach(policy -> {
            if (policy.getPermission().equals(MANAGE_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups())
                        .doesNotContain(devApplicationRole.getId(), viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(DELETE_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups())
                        .doesNotContain(devApplicationRole.getId(), viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(EXECUTE_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups())
                        .contains(devApplicationRole.getId(), viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(READ_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(CREATE_DATASOURCE_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
        });

        newPagePolicies.forEach(policy -> {
            if (policy.getPermission().equals(MANAGE_PAGES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(DELETE_PAGES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(READ_PAGES.getValue())) {
                assertThat(policy.getPermissionGroups())
                        .contains(devApplicationRole.getId(), viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(PAGE_CREATE_PAGE_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
        });

        newActionPolicies.forEach(policy -> {
            if (policy.getPermission().equals(MANAGE_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(DELETE_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(READ_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(EXECUTE_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups())
                        .contains(devApplicationRole.getId(), viewApplicationRole.getId());
            }
        });

        assertThat(moduleInstancePolicies)
                .allMatch(policy -> moduleInstancePermissions.contains(policy.getPermission()));
        moduleInstancePolicies.forEach(policy -> {
            String permission = policy.getPermission();
            Set<String> permissionGroups = policy.getPermissionGroups();

            AclPermission permissionByValue = AclPermission.getPermissionByValue(permission, ModuleInstance.class);
            assertThat(permissionByValue).isNotNull();
            switch (permissionByValue) {
                case MANAGE_MODULE_INSTANCES, DELETE_MODULE_INSTANCES, READ_MODULE_INSTANCES -> {
                    assertThat(permissionGroups).contains(devApplicationRole.getId());
                    assertThat(permissionGroups).doesNotContain(viewApplicationRole.getId());
                }
                case EXECUTE_MODULE_INSTANCES -> assertThat(permissionGroups)
                        .contains(devApplicationRole.getId(), viewApplicationRole.getId());
            }
        });

        modulePolicies.forEach(policy -> {
            String permission = policy.getPermission();
            Set<String> permissionGroups = policy.getPermissionGroups();

            AclPermission permissionByValue = AclPermission.getPermissionByValue(permission, Module.class);
            assertThat(permissionByValue).isNotNull();
            if (Set.of(MODULE_READ_MODULE_INSTANCES, MODULE_CREATE_MODULE_INSTANCES)
                    .contains(permissionByValue)) {
                assertThat(permissionGroups).contains(devApplicationRole.getId());
                assertThat(permissionGroups).doesNotContain(viewApplicationRole.getId());
            } else {
                assertThat(permissionGroups).doesNotContain(devApplicationRole.getId(), viewApplicationRole.getId());
            }
        });

        packagePolicies.forEach(policy -> {
            String permission = policy.getPermission();
            Set<String> permissionGroups = policy.getPermissionGroups();

            AclPermission permissionByValue = AclPermission.getPermissionByValue(permission, Package.class);
            assertThat(permissionByValue).isNotNull();
            if (Set.of(PACKAGE_READ_MODULE_INSTANCES, PACKAGE_CREATE_MODULE_INSTANCES)
                    .contains(permissionByValue)) {
                assertThat(permissionGroups).contains(devApplicationRole.getId());
                assertThat(permissionGroups).doesNotContain(viewApplicationRole.getId());
            } else {
                assertThat(permissionGroups).doesNotContain(devApplicationRole.getId(), viewApplicationRole.getId());
            }
        });

        assertThat(composedActionPolicies).allMatch(policy -> newActionPermissions.contains(policy.getPermission()));
        composedActionPolicies.forEach(policy -> {
            String permission = policy.getPermission();
            Set<String> permissionGroups = policy.getPermissionGroups();

            AclPermission permissionByValue = AclPermission.getPermissionByValue(permission, NewAction.class);
            assertThat(permissionByValue).isNotNull();
            switch (permissionByValue) {
                case MANAGE_ACTIONS, DELETE_ACTIONS, READ_ACTIONS -> {
                    assertThat(permissionGroups).contains(devApplicationRole.getId());
                    assertThat(permissionGroups).doesNotContain(viewApplicationRole.getId());
                }
                case EXECUTE_ACTIONS -> assertThat(permissionGroups)
                        .contains(devApplicationRole.getId(), viewApplicationRole.getId());
            }
        });

        workspacePolicies.forEach(policy -> {
            if (policy.getPermission().equals(READ_WORKSPACES.getValue())) {
                assertThat(policy.getPermissionGroups())
                        .contains(devApplicationRole.getId(), viewApplicationRole.getId());
            } else if (Set.of(
                            WORKSPACE_DATASOURCE_CREATE_DATASOURCE_ACTIONS.getValue(),
                            WORKSPACE_CREATE_PACKAGE_INSTANCES.getValue(),
                            WORKSPACE_READ_PACKAGE_INSTANCES.getValue())
                    .contains(policy.getPermission())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            } else {
                assertThat(policy.getPermissionGroups())
                        .doesNotContain(devApplicationRole.getId(), viewApplicationRole.getId());
            }
        });
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testDeleteDefaultRoleForTestUser_deleteDevRole() {
        String testName = "testDeleteDefaultRoleForTestUser_deleteDevRole";

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        PermissionGroup devApplicationRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_DEVELOPER)
                .block();
        assertThat(devApplicationRole).isNotNull();

        applicationService.deleteDefaultRole(application, devApplicationRole).block();
        PermissionGroup deletedDevApplicationRole =
                permissionGroupRepository.findById(devApplicationRole.getId()).block();
        assertThat(deletedDevApplicationRole).isNull();
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testDeleteDefaultRoleForTestUser_deleteDevRoleWhenViewRolePresent() {
        String testName = "testDeleteDefaultRoleForTestUser_deleteDevRoleWhenViewRolePresent";
        PermissionGroup instanceAdminRole =
                userUtils.getSuperAdminPermissionGroup().block();
        String adminRoleId = workspaceAdminRole.getId();
        String devRoleId = workspaceDevRole.getId();
        String viewRoleId = workspaceViewRole.getId();

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        PermissionGroup devApplicationRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_DEVELOPER)
                .block();
        assertThat(devApplicationRole).isNotNull();
        PermissionGroup viewApplicationRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_VIEWER)
                .block();
        assertThat(viewApplicationRole).isNotNull();

        applicationService.deleteDefaultRole(application, devApplicationRole).block();
        PermissionGroup deletedDevApplicationRole =
                permissionGroupRepository.findById(devApplicationRole.getId()).block();
        assertThat(deletedDevApplicationRole).isNull();

        PermissionGroup updatedViewApplicationRole = permissionGroupRepository
                .findById(viewApplicationRole.getId(), Optional.empty())
                .block();
        assertThat(updatedViewApplicationRole).isNotNull();
        assertThat(updatedViewApplicationRole.getName()).isEqualTo(APPLICATION_VIEWER + " - " + testName);
        assertThat(updatedViewApplicationRole.getDefaultDomainId()).isEqualTo(createdApplication.getId());
        assertThat(updatedViewApplicationRole.getDefaultDomainType()).isEqualTo(Application.class.getSimpleName());
        Optional<Policy> managePolicyView = updatedViewApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.MANAGE_PERMISSION_GROUPS.getValue()))
                .findFirst();
        assertThat(managePolicyView.isEmpty()).isTrue();
        Optional<Policy> readPolicyView = updatedViewApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.READ_PERMISSION_GROUPS.getValue()))
                .findFirst();
        assertThat(readPolicyView.isPresent()).isTrue();
        assertThat(readPolicyView.get().getPermissionGroups()).isEqualTo(Set.of(instanceAdminRole.getId()));
        Optional<Policy> assignPolicyView = updatedViewApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.ASSIGN_PERMISSION_GROUPS.getValue()))
                .findFirst();
        assertThat(assignPolicyView.isPresent()).isTrue();
        assertThat(assignPolicyView.get().getPermissionGroups())
                .contains(viewApplicationRole.getId(), instanceAdminRole.getId(), adminRoleId, devRoleId, viewRoleId);
        Optional<Policy> unAssignPolicyView = updatedViewApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.UNASSIGN_PERMISSION_GROUPS.getValue()))
                .findFirst();
        assertThat(unAssignPolicyView.isPresent()).isTrue();
        assertThat(unAssignPolicyView.get().getPermissionGroups()).contains(instanceAdminRole.getId(), adminRoleId);
        Optional<Policy> readMembersPolicyView = updatedViewApplicationRole.getPolicies().stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.READ_PERMISSION_GROUP_MEMBERS.getValue()))
                .findFirst();
        assertThat(readMembersPolicyView.isPresent()).isTrue();
        assertThat(readMembersPolicyView.get().getPermissionGroups())
                .contains(viewApplicationRole.getId(), instanceAdminRole.getId(), adminRoleId, devRoleId, viewRoleId);
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testDeleteDefaultRoleForTestUser_deleteViewRole() {
        String testName = "testDeleteDefaultRoleForTestUser_deleteViewRole";

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        PermissionGroup viewApplicationRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_VIEWER)
                .block();
        assertThat(viewApplicationRole).isNotNull();

        applicationService.deleteDefaultRole(application, viewApplicationRole).block();
        PermissionGroup deletedViewApplicationRole =
                permissionGroupRepository.findById(viewApplicationRole.getId()).block();
        assertThat(deletedViewApplicationRole).isNull();
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testFetchAllDefaultRolesTestUser_userHasWorkspaceAdminAccess() {
        String testName = "testFetchAllDefaultRolesTestUser_userHasWorkspaceAdminAccess";

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        List<PermissionGroupInfoDTO> defaultRoleDescriptionDTOs = applicationService
                .fetchAllDefaultRoles(createdApplication.getId())
                .block();
        assertThat(defaultRoleDescriptionDTOs).hasSize(2);
        PermissionGroupInfoDTO developerRole = defaultRoleDescriptionDTOs.get(0);
        PermissionGroupInfoDTO viewerRole = defaultRoleDescriptionDTOs.get(1);
        assertThat(developerRole.getName()).startsWith(APPLICATION_DEVELOPER);
        assertThat(viewerRole.getName()).startsWith(APPLICATION_VIEWER);
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testFetchAllDefaultRolesTestUser_userHasWorkspaceDeveloperAccess() {
        String testName = "testFetchAllDefaultRolesTestUser_userHasWorkspaceDeveloperAccess";

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);
        User newUser = userService.userCreate(user, false).block();

        permissionGroupService.assignToUser(workspaceAdminRole, newUser).block();
        permissionGroupService.assignToUser(workspaceDevRole, testUser).block();
        permissionGroupService.unassignFromUser(workspaceAdminRole, testUser).block();

        List<PermissionGroupInfoDTO> defaultRoleDescriptionDTOs = applicationService
                .fetchAllDefaultRoles(createdApplication.getId())
                .block();
        assertThat(defaultRoleDescriptionDTOs).hasSize(2);
        PermissionGroupInfoDTO developerRole = defaultRoleDescriptionDTOs.get(0);
        PermissionGroupInfoDTO viewerRole = defaultRoleDescriptionDTOs.get(1);
        assertThat(developerRole.getName()).startsWith(APPLICATION_DEVELOPER);
        assertThat(viewerRole.getName()).startsWith(APPLICATION_VIEWER);
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testFetchAllDefaultRolesTestUser_userHasWorkspaceViewerAccess() {
        String testName = "testFetchAllDefaultRolesTestUser_userHasWorkspaceViewerAccess";

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);
        User newUser = userService.userCreate(user, false).block();

        permissionGroupService.assignToUser(workspaceAdminRole, newUser).block();
        permissionGroupService.assignToUser(workspaceViewRole, testUser).block();
        permissionGroupService.unassignFromUser(workspaceAdminRole, testUser).block();

        List<PermissionGroupInfoDTO> defaultRoleDescriptionDTOs = applicationService
                .fetchAllDefaultRoles(createdApplication.getId())
                .block();
        assertThat(defaultRoleDescriptionDTOs).hasSize(1);
        PermissionGroupInfoDTO viewerRole = defaultRoleDescriptionDTOs.get(0);
        assertThat(viewerRole.getName()).startsWith(APPLICATION_VIEWER);
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testFetchAllDefaultRolesTestUser_userHasApplicationDeveloperAccess() {
        String testName = "testFetchAllDefaultRolesTestUser_userHasApplicationDeveloperAccess";

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);
        User newUser = userService.userCreate(user, false).block();

        PermissionGroup applicationDevRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_DEVELOPER)
                .block();

        permissionGroupService.assignToUser(workspaceAdminRole, newUser).block();
        permissionGroupService.assignToUser(applicationDevRole, testUser).block();
        permissionGroupService.unassignFromUser(workspaceAdminRole, testUser).block();

        List<PermissionGroupInfoDTO> defaultRoleDescriptionDTOs = applicationService
                .fetchAllDefaultRoles(createdApplication.getId())
                .block();
        assertThat(defaultRoleDescriptionDTOs).hasSize(2);
        PermissionGroupInfoDTO developerRole = defaultRoleDescriptionDTOs.get(0);
        PermissionGroupInfoDTO viewerRole = defaultRoleDescriptionDTOs.get(1);
        assertThat(developerRole.getName()).startsWith(APPLICATION_DEVELOPER);
        assertThat(viewerRole.getName()).startsWith(APPLICATION_VIEWER);
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testFetchAllDefaultRolesTestUser_userHasApplicationViewerAccess() {
        String testName = "testFetchAllDefaultRolesTestUser_userHasApplicationViewerAccess";

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);
        User newUser = userService.userCreate(user, false).block();

        PermissionGroup applicationViewRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_VIEWER)
                .block();

        permissionGroupService.assignToUser(workspaceAdminRole, newUser).block();
        permissionGroupService.assignToUser(applicationViewRole, testUser).block();
        permissionGroupService.unassignFromUser(workspaceAdminRole, testUser).block();

        List<PermissionGroupInfoDTO> defaultRoleDescriptionDTOs = applicationService
                .fetchAllDefaultRoles(createdApplication.getId())
                .block();
        assertThat(defaultRoleDescriptionDTOs).hasSize(1);
        PermissionGroupInfoDTO viewerRole = defaultRoleDescriptionDTOs.get(0);
        assertThat(viewerRole.getName()).startsWith(APPLICATION_VIEWER);
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testFetchAllDefaultRolesTestUser_userHasWorkspaceDeveloperApplicationViewerAccess() {
        String testName = "testFetchAllDefaultRolesTestUser_userHasWorkspaceDeveloperApplicationViewerAccess";

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);
        User newUser = userService.userCreate(user, false).block();

        PermissionGroup applicationViewRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_VIEWER)
                .block();

        permissionGroupService.assignToUser(workspaceAdminRole, newUser).block();
        permissionGroupService.assignToUser(workspaceDevRole, testUser).block();
        permissionGroupService.assignToUser(applicationViewRole, testUser).block();
        permissionGroupService.unassignFromUser(workspaceAdminRole, testUser).block();

        List<PermissionGroupInfoDTO> defaultRoleDescriptionDTOs = applicationService
                .fetchAllDefaultRoles(createdApplication.getId())
                .block();
        assertThat(defaultRoleDescriptionDTOs).hasSize(2);
        PermissionGroupInfoDTO developerRole = defaultRoleDescriptionDTOs.get(0);
        PermissionGroupInfoDTO viewerRole = defaultRoleDescriptionDTOs.get(1);
        assertThat(developerRole.getName()).startsWith(APPLICATION_DEVELOPER);
        assertThat(viewerRole.getName()).startsWith(APPLICATION_VIEWER);
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testFetchAllDefaultRolesTestUser_userHasWorkspaceViewerApplicationDeveloperAccess() {
        String testName = "testFetchAllDefaultRolesTestUser_userHasWorkspaceViewerApplicationDeveloperAccess";

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);
        User newUser = userService.userCreate(user, false).block();

        PermissionGroup applicationDevRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_DEVELOPER)
                .block();

        permissionGroupService.assignToUser(workspaceAdminRole, newUser).block();
        permissionGroupService.assignToUser(workspaceViewRole, testUser).block();
        permissionGroupService.assignToUser(applicationDevRole, testUser).block();
        permissionGroupService.unassignFromUser(workspaceAdminRole, testUser).block();

        List<PermissionGroupInfoDTO> defaultRoleDescriptionDTOs = applicationService
                .fetchAllDefaultRoles(createdApplication.getId())
                .block();
        assertThat(defaultRoleDescriptionDTOs).hasSize(2);
        PermissionGroupInfoDTO developerRole = defaultRoleDescriptionDTOs.get(0);
        PermissionGroupInfoDTO viewerRole = defaultRoleDescriptionDTOs.get(1);
        assertThat(developerRole.getName()).startsWith(APPLICATION_DEVELOPER);
        assertThat(viewerRole.getName()).startsWith(APPLICATION_VIEWER);
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testApplicationNameUpdate_checkDefaultRoleNamesUpdated() {
        String testName = "testApplicationNameUpdate_checkDefaultRoleNamesUpdated";

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        PermissionGroup devApplicationRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_DEVELOPER)
                .block();

        String updatedApplicationName = testName + " - updated";
        Application resource = new Application();
        resource.setName(updatedApplicationName);

        Application updatedApplication = applicationService
                .update(createdApplication.getId(), resource, null)
                .block();
        assertThat(updatedApplication).isNotNull();
        assertThat(updatedApplication.getId()).isEqualTo(createdApplication.getId());
        assertThat(updatedApplication.getName()).isEqualTo(updatedApplicationName);
        PermissionGroup updatedDevApplicationRole =
                permissionGroupRepository.findById(devApplicationRole.getId()).block();
        assertThat(updatedDevApplicationRole).isNotNull();
        assertThat(updatedDevApplicationRole.getName())
                .isEqualTo(APPLICATION_DEVELOPER + " - " + updatedApplicationName);
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testDefaultBranchedApplicationNameUpdate_checkDefaultRoleNamesUpdated() {
        String testName = "testDefaultBranchedApplicationNameUpdate_checkDefaultRoleNamesUpdated";

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        GitArtifactMetadata gitData = new GitArtifactMetadata();
        gitData.setBranchName("release");
        gitData.setDefaultBranchName("release");
        gitData.setRepoName("testRepo");
        gitData.setRemoteUrl("git@test.com:user/testRepo.git");
        gitData.setRepoName("testRepo");
        application.setGitArtifactMetadata(gitData);
        Application createdApplication = applicationPageService
                .createApplication(application)
                .flatMap(application1 -> {
                    application1.getGitArtifactMetadata().setDefaultApplicationId(application1.getId());
                    return applicationService.save(application1);
                })
                .block();

        PermissionGroup devApplicationRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_DEVELOPER)
                .block();

        String updatedApplicationName = testName + " - updated";
        Application resource = new Application();
        resource.setName(updatedApplicationName);

        Application updatedDefaultBranchedApplication = applicationService
                .update(createdApplication.getId(), resource, "release")
                .block();
        assertThat(updatedDefaultBranchedApplication).isNotNull();
        assertThat(updatedDefaultBranchedApplication.getId()).isEqualTo(createdApplication.getId());
        assertThat(updatedDefaultBranchedApplication.getName()).isEqualTo(updatedApplicationName);
        PermissionGroup updatedDevApplicationRole =
                permissionGroupRepository.findById(devApplicationRole.getId()).block();
        assertThat(updatedDevApplicationRole).isNotNull();
        assertThat(updatedDevApplicationRole.getName())
                .isEqualTo(APPLICATION_DEVELOPER + " - " + updatedApplicationName);
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testBranchedApplicationNameUpdate_checkDefaultRoleNamesNotUpdated() {
        String testName = "testBranchedApplicationNameUpdate_checkDefaultRoleNamesNotUpdated";

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        GitArtifactMetadata gitData = new GitArtifactMetadata();
        gitData.setBranchName("release");
        gitData.setDefaultBranchName("release");
        gitData.setRepoName("testRepo");
        gitData.setRemoteUrl("git@test.com:user/testRepo.git");
        gitData.setRepoName("testRepo");
        application.setGitArtifactMetadata(gitData);
        Application createdApplication = applicationPageService
                .createApplication(application)
                .flatMap(application1 -> {
                    application1.getGitArtifactMetadata().setDefaultApplicationId(application1.getId());
                    return applicationService.save(application1);
                })
                .block();

        Application branchedApplication = exportService
                .exportByArtifactIdAndBranchName(createdApplication.getId(), gitData.getBranchName(), APPLICATION)
                .flatMap(applicationJson -> importService.importArtifactInWorkspaceFromGit(
                        workspace.getId(), null, applicationJson, gitData.getBranchName()))
                .map(importableArtifact -> (Application) importableArtifact)
                .flatMap(application1 -> {
                    GitArtifactMetadata gitData1 = new GitArtifactMetadata();
                    gitData1.setBranchName("testBranch");
                    gitData1.setDefaultBranchName("release");
                    gitData1.setRepoName("testRepo");
                    gitData1.setRemoteUrl("git@test.com:user/testRepo.git");
                    gitData1.setRepoName("testRepo");
                    gitData1.setDefaultApplicationId(createdApplication.getId());
                    application1.setGitArtifactMetadata(gitData1);

                    return applicationService.save(application1);
                })
                .block();
        assertThat(branchedApplication).isNotNull();

        PermissionGroup devApplicationRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_DEVELOPER)
                .block();

        String updatedApplicationName = testName + " - updated";
        Application resource = new Application();
        resource.setName(updatedApplicationName);

        Application updatedBranchedApplication = applicationService
                .update(createdApplication.getId(), resource, "testBranch")
                .block();
        assertThat(updatedBranchedApplication).isNotNull();
        assertThat(updatedBranchedApplication.getId()).isEqualTo(branchedApplication.getId());
        assertThat(updatedBranchedApplication.getName()).isEqualTo(updatedApplicationName);
        PermissionGroup notUpdatedDevApplicationRole =
                permissionGroupRepository.findById(devApplicationRole.getId()).block();
        assertThat(notUpdatedDevApplicationRole).isNotNull();
        assertThat(notUpdatedDevApplicationRole.getName())
                .isEqualTo(APPLICATION_DEVELOPER + " - " + createdApplication.getName());
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testDeleteApplication_deleteDefaultApplicationRoles() {
        String testName = "testDeleteApplication_deleteDefaultApplicationRoles";

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        PermissionGroup devApplicationRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_DEVELOPER)
                .block();
        PermissionGroup viewApplicationRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_VIEWER)
                .block();

        Application deletedApplication = applicationPageService
                .deleteApplication(createdApplication.getId())
                .block();
        assertThat(deletedApplication.getDeletedAt()).isBefore(Instant.now());
        assertThat(deletedApplication.isDeleted()).isTrue();

        List<PermissionGroup> defaultApplicationRoles = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(
                        createdApplication.getId(), Application.class.getSimpleName())
                .collectList()
                .block();
        assertThat(defaultApplicationRoles).isEmpty();
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testBranchedApplicationDelete_checkDefaultRoleExist() {
        String testName = "testBranchedApplicationDelete_checkDefaultRoleExist";

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        GitArtifactMetadata gitData = new GitArtifactMetadata();
        gitData.setBranchName("release");
        gitData.setDefaultBranchName("release");
        gitData.setRepoName("testRepo");
        gitData.setRemoteUrl("git@test.com:user/testRepo.git");
        gitData.setRepoName("testRepo");
        application.setGitArtifactMetadata(gitData);
        Application createdApplication = applicationPageService
                .createApplication(application)
                .flatMap(application1 -> {
                    application1.getGitArtifactMetadata().setDefaultApplicationId(application1.getId());
                    return applicationService.save(application1);
                })
                .block();

        Application branchedApplication = exportService
                .exportByArtifactIdAndBranchName(createdApplication.getId(), gitData.getBranchName(), APPLICATION)
                .flatMap(applicationJson -> importService.importArtifactInWorkspaceFromGit(
                        workspace.getId(), null, applicationJson, gitData.getBranchName()))
                .map(importableArtifact -> (Application) importableArtifact)
                .flatMap(application1 -> {
                    GitArtifactMetadata gitData1 = new GitArtifactMetadata();
                    gitData1.setBranchName("testBranch");
                    gitData1.setDefaultBranchName("release");
                    gitData1.setRepoName("testRepo");
                    gitData1.setRemoteUrl("git@test.com:user/testRepo.git");
                    gitData1.setRepoName("testRepo");
                    gitData1.setDefaultApplicationId(createdApplication.getId());
                    application1.setGitArtifactMetadata(gitData1);

                    return applicationService.save(application1);
                })
                .block();
        assertThat(branchedApplication).isNotNull();

        PermissionGroup devApplicationRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_DEVELOPER)
                .block();
        PermissionGroup viewApplicationRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_VIEWER)
                .block();

        Application deletedApplication = applicationPageService
                .deleteApplication(branchedApplication.getId())
                .block();
        List<PermissionGroup> defaultApplicationRoles = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(
                        createdApplication.getId(), Application.class.getSimpleName())
                .collectList()
                .block();
        assertThat(defaultApplicationRoles).hasSize(2);
        Set<String> defaultApplicationRoleIdSet =
                defaultApplicationRoles.stream().map(role -> role.getId()).collect(Collectors.toSet());
        assertThat(defaultApplicationRoleIdSet).contains(devApplicationRole.getId());
        assertThat(defaultApplicationRoleIdSet).contains(viewApplicationRole.getId());
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testInviteToApplication_noDefaultRolesExist_userHasWorkspaceAdminAccess_inviteMultipleUsersToDevRole() {
        String testName =
                "testInviteToApplication_noDefaultRolesExist_userHasWorkspaceAdminAccess_inviteMultipleUsersToDevRole";
        Set<String> usersToInvite = IntStream.range(0, 20)
                .mapToObj(index -> testName + index + "@applicationShareTest.com")
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        InviteUsersToApplicationDTO inviteToApplicationDTO = new InviteUsersToApplicationDTO();
        inviteToApplicationDTO.setApplicationId(createdApplication.getId());
        inviteToApplicationDTO.setRoleType(APPLICATION_DEVELOPER);
        inviteToApplicationDTO.setUsernames(usersToInvite);

        List<MemberInfoDTO> memberInvitedInfoDTOS = applicationService
                .inviteToApplication(inviteToApplicationDTO, originHeader)
                .block();

        Optional<PermissionGroup> appDeveloperRole = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(
                        createdApplication.getId(), Application.class.getSimpleName())
                .collectList()
                .block()
                .stream()
                .filter(role -> role.getName().startsWith(APPLICATION_DEVELOPER))
                .findFirst();
        assertThat(appDeveloperRole.isPresent()).isTrue();

        assertThat(memberInvitedInfoDTOS).isNotNull();
        assertThat(memberInvitedInfoDTOS).hasSize(usersToInvite.size());
        memberInvitedInfoDTOS.forEach(member -> {
            assertThat(member.getRoles()).hasSize(1);
            PermissionGroupInfoDTO roleInfoDTO = member.getRoles().get(0);
            assertThat(roleInfoDTO.getId()).isEqualTo(appDeveloperRole.get().getId());
            assertThat(roleInfoDTO.getName()).isEqualTo(appDeveloperRole.get().getName());
            assertThat(roleInfoDTO.getDescription())
                    .isEqualTo(appDeveloperRole.get().getDescription());
            assertThat(roleInfoDTO.getEntityId()).isEqualTo(createdApplication.getId());
            assertThat(roleInfoDTO.getEntityType()).isEqualTo(Application.class.getSimpleName());
        });
        assertThat(memberInvitedInfoDTOS.stream()
                        .map(MemberInfoDTO::getUsername)
                        .filter(StringUtils::isNotEmpty)
                        .toList())
                .containsExactlyInAnyOrderElementsOf(usersToInvite);

        Map<String, String> mapUsernameToUserId = userRepository
                .findAllByEmailIn(new HashSet<>(usersToInvite))
                .collectMap(User::getUsername, BaseDomain::getId)
                .block();
        Map<String, String> mapInvitedUsernameToUserId = memberInvitedInfoDTOS.stream()
                .filter(member -> StringUtils.isNotEmpty(member.getUsername()))
                .collect(Collectors.toMap(MemberInfoDTO::getUsername, MemberInfoDTO::getUserId));
        assertThat(mapUsernameToUserId).containsExactlyInAnyOrderEntriesOf(mapInvitedUsernameToUserId);

        List<Environment> environmentList = environmentService
                .findByWorkspaceId(workspace.getId())
                .collectList()
                .block();

        assertThat(environmentList).hasSize(2);

        environmentList.forEach(environment -> {
            Optional<Policy> policyOptional = environment.getPolicies().stream()
                    .filter(policy -> EXECUTE_ENVIRONMENTS.getValue().equals(policy.getPermission()))
                    .findFirst();

            assertThat(policyOptional).isNotEmpty();
            Policy policy = policyOptional.get();

            assertThat(policy.getPermissionGroups())
                    .contains(appDeveloperRole.get().getId());
        });
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void
            testInviteToApplication_noDefaultRolesExist_userHasWorkspaceAdminAccess_inviteMultipleUsersToViewRole() {
        String testName =
                "testInviteToApplication_noDefaultRolesExist_userHasWorkspaceAdminAccess_inviteMultipleUsersToViewRole";
        Set<String> usersToInvite = IntStream.range(0, 20)
                .mapToObj(index -> testName + index + "@applicationShareTest.com")
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        InviteUsersToApplicationDTO inviteToApplicationDTO = new InviteUsersToApplicationDTO();
        inviteToApplicationDTO.setApplicationId(createdApplication.getId());
        inviteToApplicationDTO.setRoleType(APPLICATION_VIEWER);
        inviteToApplicationDTO.setUsernames(usersToInvite);

        List<MemberInfoDTO> memberInvitedInfoDTOS = applicationService
                .inviteToApplication(inviteToApplicationDTO, originHeader)
                .block();

        Optional<PermissionGroup> appViewerRole = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(
                        createdApplication.getId(), Application.class.getSimpleName())
                .collectList()
                .block()
                .stream()
                .filter(role -> role.getName().startsWith(APPLICATION_VIEWER))
                .findFirst();
        assertThat(appViewerRole.isPresent()).isTrue();

        assertThat(memberInvitedInfoDTOS).isNotNull();
        assertThat(memberInvitedInfoDTOS).hasSize(usersToInvite.size());
        memberInvitedInfoDTOS.forEach(member -> {
            assertThat(member.getRoles()).hasSize(1);
            PermissionGroupInfoDTO roleInfoDTO = member.getRoles().get(0);
            assertThat(roleInfoDTO.getId()).isEqualTo(appViewerRole.get().getId());
            assertThat(roleInfoDTO.getName()).isEqualTo(appViewerRole.get().getName());
            assertThat(roleInfoDTO.getDescription())
                    .isEqualTo(appViewerRole.get().getDescription());
            assertThat(roleInfoDTO.getEntityId()).isEqualTo(createdApplication.getId());
            assertThat(roleInfoDTO.getEntityType()).isEqualTo(Application.class.getSimpleName());
        });
        assertThat(memberInvitedInfoDTOS.stream()
                        .map(MemberInfoDTO::getUsername)
                        .filter(StringUtils::isNotEmpty)
                        .toList())
                .containsExactlyInAnyOrderElementsOf(usersToInvite);

        Map<String, String> mapUsernameToUserId = userRepository
                .findAllByEmailIn(new HashSet<>(usersToInvite))
                .collectMap(User::getUsername, BaseDomain::getId)
                .block();
        Map<String, String> mapInvitedUsernameToUserId = memberInvitedInfoDTOS.stream()
                .filter(member -> StringUtils.isNotEmpty(member.getUsername()))
                .collect(Collectors.toMap(MemberInfoDTO::getUsername, MemberInfoDTO::getUserId));
        assertThat(mapUsernameToUserId).containsExactlyInAnyOrderEntriesOf(mapInvitedUsernameToUserId);

        List<Environment> environmentList = environmentService
                .findByWorkspaceId(workspace.getId())
                .collectList()
                .block();

        assertThat(environmentList).hasSize(2);

        environmentList.forEach(environment -> {
            Optional<Policy> policyOptional = environment.getPolicies().stream()
                    .filter(policy -> EXECUTE_ENVIRONMENTS.getValue().equals(policy.getPermission()))
                    .findFirst();

            assertThat(policyOptional).isNotEmpty();
            Policy policy = policyOptional.get();

            if (TRUE.equals(environment.getIsDefault())) {
                assertThat(policy.getPermissionGroups())
                        .contains(appViewerRole.get().getId());
            } else {
                assertThat(policy.getPermissionGroups())
                        .doesNotContain(appViewerRole.get().getId());
            }
        });
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void
            testInviteToApplication_noDefaultRolesExist_userHasWorkspaceDeveloperAccess_inviteMultipleUsersToDevRole() {
        String testName =
                "testInviteToApplication_noDefaultRolesExist_userHasWorkspaceDeveloperAccess_inviteMultipleUsersToDevRole";
        Set<String> usersToInvite = IntStream.range(0, 20)
                .mapToObj(index -> testName + index + "@applicationShareTest.com")
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);
        User newUser = userService.userCreate(user, false).block();

        permissionGroupService.assignToUser(workspaceAdminRole, newUser).block();
        permissionGroupService.assignToUser(workspaceDevRole, testUser).block();
        permissionGroupService.unassignFromUser(workspaceAdminRole, testUser).block();

        InviteUsersToApplicationDTO inviteToApplicationDTO = new InviteUsersToApplicationDTO();
        inviteToApplicationDTO.setApplicationId(createdApplication.getId());
        inviteToApplicationDTO.setRoleType(APPLICATION_DEVELOPER);
        inviteToApplicationDTO.setUsernames(usersToInvite);

        List<MemberInfoDTO> memberInvitedInfoDTOS = applicationService
                .inviteToApplication(inviteToApplicationDTO, originHeader)
                .block();

        Optional<PermissionGroup> appDeveloperRole = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(
                        createdApplication.getId(), Application.class.getSimpleName())
                .collectList()
                .block()
                .stream()
                .filter(role -> role.getName().startsWith(APPLICATION_DEVELOPER))
                .findFirst();
        assertThat(appDeveloperRole.isPresent()).isTrue();

        assertThat(memberInvitedInfoDTOS).isNotNull();
        assertThat(memberInvitedInfoDTOS).hasSize(usersToInvite.size());
        memberInvitedInfoDTOS.forEach(member -> {
            assertThat(member.getRoles()).hasSize(1);
            PermissionGroupInfoDTO roleInfoDTO = member.getRoles().get(0);
            assertThat(roleInfoDTO.getId()).isEqualTo(appDeveloperRole.get().getId());
            assertThat(roleInfoDTO.getName()).isEqualTo(appDeveloperRole.get().getName());
            assertThat(roleInfoDTO.getDescription())
                    .isEqualTo(appDeveloperRole.get().getDescription());
            assertThat(roleInfoDTO.getEntityId()).isEqualTo(createdApplication.getId());
            assertThat(roleInfoDTO.getEntityType()).isEqualTo(Application.class.getSimpleName());
        });
        assertThat(memberInvitedInfoDTOS.stream()
                        .map(MemberInfoDTO::getUsername)
                        .filter(StringUtils::isNotEmpty)
                        .toList())
                .containsExactlyInAnyOrderElementsOf(usersToInvite);

        Map<String, String> mapUsernameToUserId = userRepository
                .findAllByEmailIn(new HashSet<>(usersToInvite))
                .collectMap(User::getUsername, BaseDomain::getId)
                .block();
        Map<String, String> mapInvitedUsernameToUserId = memberInvitedInfoDTOS.stream()
                .filter(member -> StringUtils.isNotEmpty(member.getUsername()))
                .collect(Collectors.toMap(MemberInfoDTO::getUsername, MemberInfoDTO::getUserId));
        assertThat(mapUsernameToUserId).containsExactlyInAnyOrderEntriesOf(mapInvitedUsernameToUserId);
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void
            testInviteToApplication_noDefaultRolesExist_userHasWorkspaceDeveloperAccess_inviteMultipleUsersToViewRole() {
        String testName =
                "testInviteToApplication_noDefaultRolesExist_userHasWorkspaceDeveloperAccess_inviteMultipleUsersToViewRole";
        Set<String> usersToInvite = IntStream.range(0, 20)
                .mapToObj(index -> testName + index + "@applicationShareTest.com")
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);
        User newUser = userService.userCreate(user, false).block();

        permissionGroupService.assignToUser(workspaceAdminRole, newUser).block();
        permissionGroupService.assignToUser(workspaceDevRole, testUser).block();
        permissionGroupService.unassignFromUser(workspaceAdminRole, testUser).block();

        InviteUsersToApplicationDTO inviteToApplicationDTO = new InviteUsersToApplicationDTO();
        inviteToApplicationDTO.setApplicationId(createdApplication.getId());
        inviteToApplicationDTO.setRoleType(APPLICATION_VIEWER);
        inviteToApplicationDTO.setUsernames(usersToInvite);

        List<MemberInfoDTO> memberInvitedInfoDTOS = applicationService
                .inviteToApplication(inviteToApplicationDTO, originHeader)
                .block();

        Optional<PermissionGroup> appViewerRole = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(
                        createdApplication.getId(), Application.class.getSimpleName())
                .collectList()
                .block()
                .stream()
                .filter(role -> role.getName().startsWith(APPLICATION_VIEWER))
                .findFirst();
        assertThat(appViewerRole.isPresent()).isTrue();

        assertThat(memberInvitedInfoDTOS).isNotNull();
        assertThat(memberInvitedInfoDTOS).hasSize(usersToInvite.size());
        memberInvitedInfoDTOS.forEach(member -> {
            assertThat(member.getRoles()).hasSize(1);
            PermissionGroupInfoDTO roleInfoDTO = member.getRoles().get(0);
            assertThat(roleInfoDTO.getId()).isEqualTo(appViewerRole.get().getId());
            assertThat(roleInfoDTO.getName()).isEqualTo(appViewerRole.get().getName());
            assertThat(roleInfoDTO.getDescription())
                    .isEqualTo(appViewerRole.get().getDescription());
            assertThat(roleInfoDTO.getEntityId()).isEqualTo(createdApplication.getId());
            assertThat(roleInfoDTO.getEntityType()).isEqualTo(Application.class.getSimpleName());
        });
        assertThat(memberInvitedInfoDTOS.stream()
                        .map(MemberInfoDTO::getUsername)
                        .filter(StringUtils::isNotEmpty)
                        .toList())
                .containsExactlyInAnyOrderElementsOf(usersToInvite);

        Map<String, String> mapUsernameToUserId = userRepository
                .findAllByEmailIn(new HashSet<>(usersToInvite))
                .collectMap(User::getUsername, BaseDomain::getId)
                .block();
        Map<String, String> mapInvitedUsernameToUserId = memberInvitedInfoDTOS.stream()
                .filter(member -> StringUtils.isNotEmpty(member.getUsername()))
                .collect(Collectors.toMap(MemberInfoDTO::getUsername, MemberInfoDTO::getUserId));
        assertThat(mapUsernameToUserId).containsExactlyInAnyOrderEntriesOf(mapInvitedUsernameToUserId);
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void
            testInviteToApplication_noDefaultRolesExist_userHasWorkspaceViewerAccess_inviteMultipleUsersToDevRole() {
        String testName =
                "testInviteToApplication_noDefaultRolesExist_userHasWorkspaceViewerAccess_inviteMultipleUsersToDevRole";
        Set<String> usersToInvite = IntStream.range(0, 20)
                .mapToObj(index -> testName + index + "@applicationShareTest.com")
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);
        User newUser = userService.userCreate(user, false).block();

        permissionGroupService.assignToUser(workspaceAdminRole, newUser).block();
        permissionGroupService.assignToUser(workspaceViewRole, testUser).block();
        permissionGroupService.unassignFromUser(workspaceAdminRole, testUser).block();

        InviteUsersToApplicationDTO inviteToApplicationDTO = new InviteUsersToApplicationDTO();
        inviteToApplicationDTO.setApplicationId(createdApplication.getId());
        inviteToApplicationDTO.setRoleType(APPLICATION_DEVELOPER);
        inviteToApplicationDTO.setUsernames(usersToInvite);

        Mono<List<MemberInfoDTO>> memberInvitedInfoDTOSMono =
                applicationService.inviteToApplication(inviteToApplicationDTO, originHeader);

        StepVerifier.create(memberInvitedInfoDTOSMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.UNAUTHORIZED_ACCESS.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void
            testInviteToApplication_noDefaultRolesExist_userHasWorkspaceViewerAccess_inviteMultipleUsersToViewRole() {
        String testName =
                "testInviteToApplication_noDefaultRolesExist_userHasWorkspaceViewerAccess_inviteMultipleUsersToViewRole";
        Set<String> usersToInvite = IntStream.range(0, 20)
                .mapToObj(index -> testName + index + "@applicationShareTest.com")
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);
        User newUser = userService.userCreate(user, false).block();
        permissionGroupService.assignToUser(workspaceAdminRole, newUser).block();
        permissionGroupService.assignToUser(workspaceViewRole, testUser).block();
        permissionGroupService.unassignFromUser(workspaceAdminRole, testUser).block();

        InviteUsersToApplicationDTO inviteToApplicationDTO = new InviteUsersToApplicationDTO();
        inviteToApplicationDTO.setApplicationId(createdApplication.getId());
        inviteToApplicationDTO.setRoleType(APPLICATION_VIEWER);
        inviteToApplicationDTO.setUsernames(usersToInvite);

        List<MemberInfoDTO> memberInvitedInfoDTOS = applicationService
                .inviteToApplication(inviteToApplicationDTO, originHeader)
                .block();

        Optional<PermissionGroup> appViewerRole = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(
                        createdApplication.getId(), Application.class.getSimpleName())
                .collectList()
                .block()
                .stream()
                .filter(role -> role.getName().startsWith(APPLICATION_VIEWER))
                .findFirst();
        assertThat(appViewerRole.isPresent()).isTrue();

        assertThat(memberInvitedInfoDTOS).isNotNull();
        assertThat(memberInvitedInfoDTOS).hasSize(usersToInvite.size());
        memberInvitedInfoDTOS.forEach(member -> {
            assertThat(member.getRoles()).hasSize(1);
            PermissionGroupInfoDTO roleInfoDTO = member.getRoles().get(0);
            assertThat(roleInfoDTO.getId()).isEqualTo(appViewerRole.get().getId());
            assertThat(roleInfoDTO.getName()).isEqualTo(appViewerRole.get().getName());
            assertThat(roleInfoDTO.getDescription())
                    .isEqualTo(appViewerRole.get().getDescription());
            assertThat(roleInfoDTO.getEntityId()).isEqualTo(createdApplication.getId());
            assertThat(roleInfoDTO.getEntityType()).isEqualTo(Application.class.getSimpleName());
        });
        assertThat(memberInvitedInfoDTOS.stream()
                        .map(MemberInfoDTO::getUsername)
                        .filter(StringUtils::isNotEmpty)
                        .toList())
                .containsExactlyInAnyOrderElementsOf(usersToInvite);

        Map<String, String> mapUsernameToUserId = userRepository
                .findAllByEmailIn(new HashSet<>(usersToInvite))
                .collectMap(User::getUsername, BaseDomain::getId)
                .block();
        Map<String, String> mapInvitedUsernameToUserId = memberInvitedInfoDTOS.stream()
                .filter(member -> StringUtils.isNotEmpty(member.getUsername()))
                .collect(Collectors.toMap(MemberInfoDTO::getUsername, MemberInfoDTO::getUserId));
        assertThat(mapUsernameToUserId).containsExactlyInAnyOrderEntriesOf(mapInvitedUsernameToUserId);
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testInviteToApplication_userHasApplicationDeveloperAccess_inviteMultipleUsersToDevRole() {
        String testName = "testInviteToApplication_userHasApplicationDeveloperAccess_inviteMultipleUsersToDevRole";
        Set<String> usersToInvite = IntStream.range(0, 20)
                .mapToObj(index -> testName + index + "@applicationShareTest.com")
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);
        User newUser = userService.userCreate(user, false).block();

        PermissionGroup applicationDevRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_DEVELOPER)
                .block();

        permissionGroupService.assignToUser(workspaceAdminRole, newUser).block();
        permissionGroupService.assignToUser(applicationDevRole, testUser).block();
        permissionGroupService.unassignFromUser(workspaceAdminRole, testUser).block();

        InviteUsersToApplicationDTO inviteToApplicationDTO = new InviteUsersToApplicationDTO();
        inviteToApplicationDTO.setApplicationId(createdApplication.getId());
        inviteToApplicationDTO.setRoleType(APPLICATION_DEVELOPER);
        inviteToApplicationDTO.setUsernames(usersToInvite);

        List<MemberInfoDTO> memberInvitedInfoDTOS = applicationService
                .inviteToApplication(inviteToApplicationDTO, originHeader)
                .block();

        PermissionGroup appDeveloperRole =
                permissionGroupRepository.findById(applicationDevRole.getId()).block();

        assertThat(memberInvitedInfoDTOS).isNotNull();
        assertThat(memberInvitedInfoDTOS).hasSize(usersToInvite.size());
        memberInvitedInfoDTOS.forEach(member -> {
            assertThat(member.getRoles()).hasSize(1);
            PermissionGroupInfoDTO roleInfoDTO = member.getRoles().get(0);
            assertThat(roleInfoDTO.getId()).isEqualTo(appDeveloperRole.getId());
            assertThat(roleInfoDTO.getName()).isEqualTo(appDeveloperRole.getName());
            assertThat(roleInfoDTO.getDescription()).isEqualTo(appDeveloperRole.getDescription());
            assertThat(roleInfoDTO.getEntityId()).isEqualTo(createdApplication.getId());
            assertThat(roleInfoDTO.getEntityType()).isEqualTo(Application.class.getSimpleName());
        });
        assertThat(memberInvitedInfoDTOS.stream()
                        .map(MemberInfoDTO::getUsername)
                        .filter(StringUtils::isNotEmpty)
                        .toList())
                .containsExactlyInAnyOrderElementsOf(usersToInvite);

        Map<String, String> mapUsernameToUserId = userRepository
                .findAllByEmailIn(new HashSet<>(usersToInvite))
                .collectMap(User::getUsername, BaseDomain::getId)
                .block();
        Map<String, String> mapInvitedUsernameToUserId = memberInvitedInfoDTOS.stream()
                .filter(member -> StringUtils.isNotEmpty(member.getUsername()))
                .collect(Collectors.toMap(MemberInfoDTO::getUsername, MemberInfoDTO::getUserId));
        assertThat(mapUsernameToUserId).containsExactlyInAnyOrderEntriesOf(mapInvitedUsernameToUserId);
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testInviteToApplication_userHasApplicationDeveloperAccess_inviteMultipleUsersToViewRole() {
        String testName = "testInviteToApplication_userHasApplicationDeveloperAccess_inviteMultipleUsersToViewRole";
        Set<String> usersToInvite = IntStream.range(0, 20)
                .mapToObj(index -> testName + index + "@applicationShareTest.com")
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);
        User newUser = userService.userCreate(user, false).block();

        PermissionGroup applicationDevRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_DEVELOPER)
                .block();

        permissionGroupService.assignToUser(workspaceAdminRole, newUser).block();
        permissionGroupService.assignToUser(applicationDevRole, testUser).block();
        permissionGroupService.unassignFromUser(workspaceAdminRole, testUser).block();

        InviteUsersToApplicationDTO inviteToApplicationDTO = new InviteUsersToApplicationDTO();
        inviteToApplicationDTO.setApplicationId(createdApplication.getId());
        inviteToApplicationDTO.setRoleType(APPLICATION_VIEWER);
        inviteToApplicationDTO.setUsernames(usersToInvite);

        List<MemberInfoDTO> memberInvitedInfoDTOS = applicationService
                .inviteToApplication(inviteToApplicationDTO, originHeader)
                .block();

        Optional<PermissionGroup> appViewerRole = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(
                        createdApplication.getId(), Application.class.getSimpleName())
                .collectList()
                .block()
                .stream()
                .filter(role -> role.getName().startsWith(APPLICATION_VIEWER))
                .findFirst();
        assertThat(appViewerRole.isPresent()).isTrue();

        assertThat(memberInvitedInfoDTOS).isNotNull();
        assertThat(memberInvitedInfoDTOS).hasSize(usersToInvite.size());
        memberInvitedInfoDTOS.forEach(member -> {
            assertThat(member.getRoles()).hasSize(1);
            PermissionGroupInfoDTO roleInfoDTO = member.getRoles().get(0);
            assertThat(roleInfoDTO.getId()).isEqualTo(appViewerRole.get().getId());
            assertThat(roleInfoDTO.getName()).isEqualTo(appViewerRole.get().getName());
            assertThat(roleInfoDTO.getDescription())
                    .isEqualTo(appViewerRole.get().getDescription());
            assertThat(roleInfoDTO.getEntityId()).isEqualTo(createdApplication.getId());
            assertThat(roleInfoDTO.getEntityType()).isEqualTo(Application.class.getSimpleName());
        });
        assertThat(memberInvitedInfoDTOS.stream()
                        .map(MemberInfoDTO::getUsername)
                        .filter(StringUtils::isNotEmpty)
                        .toList())
                .containsExactlyInAnyOrderElementsOf(usersToInvite);

        Map<String, String> mapUsernameToUserId = userRepository
                .findAllByEmailIn(new HashSet<>(usersToInvite))
                .collectMap(User::getUsername, BaseDomain::getId)
                .block();
        Map<String, String> mapInvitedUsernameToUserId = memberInvitedInfoDTOS.stream()
                .filter(member -> StringUtils.isNotEmpty(member.getUsername()))
                .collect(Collectors.toMap(MemberInfoDTO::getUsername, MemberInfoDTO::getUserId));
        assertThat(mapUsernameToUserId).containsExactlyInAnyOrderEntriesOf(mapInvitedUsernameToUserId);
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testInviteToApplication_userHasApplicationViewerAccess_inviteMultipleUsersToDevRole() {
        String testName = "testInviteToApplication_userHasApplicationViewerAccess_inviteMultipleUsersToDevRole";
        Set<String> usersToInvite = IntStream.range(0, 20)
                .mapToObj(index -> testName + index + "@applicationShareTest.com")
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);
        User newUser = userService.userCreate(user, false).block();

        PermissionGroup applicationViewRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_VIEWER)
                .block();

        permissionGroupService.assignToUser(workspaceAdminRole, newUser).block();
        permissionGroupService.assignToUser(applicationViewRole, testUser).block();
        permissionGroupService.unassignFromUser(workspaceAdminRole, testUser).block();

        InviteUsersToApplicationDTO inviteToApplicationDTO = new InviteUsersToApplicationDTO();
        inviteToApplicationDTO.setApplicationId(createdApplication.getId());
        inviteToApplicationDTO.setRoleType(APPLICATION_DEVELOPER);
        inviteToApplicationDTO.setUsernames(usersToInvite);

        Mono<List<MemberInfoDTO>> memberInvitedInfoDTOSMono =
                applicationService.inviteToApplication(inviteToApplicationDTO, originHeader);

        StepVerifier.create(memberInvitedInfoDTOSMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.UNAUTHORIZED_ACCESS.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testInviteToApplication_userHasApplicationViewerAccess_inviteMultipleUsersToViewRole() {
        String testName = "testInviteToApplication_userHasApplicationViewerAccess_inviteMultipleUsersToViewRole";
        Set<String> usersToInvite = IntStream.range(0, 20)
                .mapToObj(index -> testName + index + "@applicationShareTest.com")
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);
        User newUser = userService.userCreate(user, false).block();

        PermissionGroup applicationViewRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_VIEWER)
                .block();

        permissionGroupService.assignToUser(workspaceAdminRole, newUser).block();
        permissionGroupService.assignToUser(applicationViewRole, testUser).block();
        permissionGroupService.unassignFromUser(workspaceAdminRole, testUser).block();

        InviteUsersToApplicationDTO inviteToApplicationDTO = new InviteUsersToApplicationDTO();
        inviteToApplicationDTO.setApplicationId(createdApplication.getId());
        inviteToApplicationDTO.setRoleType(APPLICATION_VIEWER);
        inviteToApplicationDTO.setUsernames(usersToInvite);

        List<MemberInfoDTO> memberInvitedInfoDTOS = applicationService
                .inviteToApplication(inviteToApplicationDTO, originHeader)
                .block();

        PermissionGroup appViewerRole =
                permissionGroupRepository.findById(applicationViewRole.getId()).block();

        assertThat(memberInvitedInfoDTOS).isNotNull();
        assertThat(memberInvitedInfoDTOS).hasSize(usersToInvite.size());
        memberInvitedInfoDTOS.forEach(member -> {
            assertThat(member.getRoles()).hasSize(1);
            PermissionGroupInfoDTO roleInfoDTO = member.getRoles().get(0);
            assertThat(roleInfoDTO.getId()).isEqualTo(appViewerRole.getId());
            assertThat(roleInfoDTO.getName()).isEqualTo(appViewerRole.getName());
            assertThat(roleInfoDTO.getDescription()).isEqualTo(appViewerRole.getDescription());
            assertThat(roleInfoDTO.getEntityId()).isEqualTo(createdApplication.getId());
            assertThat(roleInfoDTO.getEntityType()).isEqualTo(Application.class.getSimpleName());
        });
        assertThat(memberInvitedInfoDTOS.stream()
                        .map(MemberInfoDTO::getUsername)
                        .filter(StringUtils::isNotEmpty)
                        .toList())
                .containsExactlyInAnyOrderElementsOf(usersToInvite);

        Map<String, String> mapUsernameToUserId = userRepository
                .findAllByEmailIn(new HashSet<>(usersToInvite))
                .collectMap(User::getUsername, BaseDomain::getId)
                .block();
        Map<String, String> mapInvitedUsernameToUserId = memberInvitedInfoDTOS.stream()
                .filter(member -> StringUtils.isNotEmpty(member.getUsername()))
                .collect(Collectors.toMap(MemberInfoDTO::getUsername, MemberInfoDTO::getUserId));
        assertThat(mapUsernameToUserId).containsExactlyInAnyOrderEntriesOf(mapInvitedUsernameToUserId);
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testInviteToApplication_noDefaultRolesExist_inviteMultipleUserGroups() {
        String testName = "testInviteToApplication_noDefaultRolesExist_inviteMultipleUserGroups";
        userUtils.makeSuperUser(List.of(testUser)).block();
        List<UserGroup> groups = IntStream.range(0, 20)
                .mapToObj(index -> testName + " - " + index)
                .map(String::toLowerCase)
                .map(groupName -> {
                    UserGroup group = new UserGroup();
                    group.setName(groupName);
                    return userGroupService
                            .createGroup(group)
                            .flatMap(group1 -> userGroupService.findById(group1.getId(), MANAGE_USER_GROUPS))
                            .block();
                })
                .toList();
        userUtils.removeSuperUser(List.of(testUser)).block();

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        Set<String> groupIdsToInvite = groups.stream().map(UserGroup::getId).collect(Collectors.toSet());

        InviteUsersToApplicationDTO inviteToApplicationDTO = new InviteUsersToApplicationDTO();
        inviteToApplicationDTO.setApplicationId(createdApplication.getId());
        inviteToApplicationDTO.setRoleType(APPLICATION_VIEWER);
        inviteToApplicationDTO.setGroups(groupIdsToInvite);

        List<MemberInfoDTO> memberInvitedInfoDTOS = applicationService
                .inviteToApplication(inviteToApplicationDTO, originHeader)
                .block();

        Optional<PermissionGroup> appViewerRole = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(
                        createdApplication.getId(), Application.class.getSimpleName())
                .collectList()
                .block()
                .stream()
                .filter(role -> role.getName().startsWith(APPLICATION_VIEWER))
                .findFirst();
        assertThat(appViewerRole.isPresent()).isTrue();

        assertThat(memberInvitedInfoDTOS).isNotNull();
        assertThat(memberInvitedInfoDTOS).hasSize(groupIdsToInvite.size());
        memberInvitedInfoDTOS.forEach(member -> {
            assertThat(member.getRoles()).hasSize(1);
            PermissionGroupInfoDTO roleInfoDTO = member.getRoles().get(0);
            assertThat(roleInfoDTO.getId()).isEqualTo(appViewerRole.get().getId());
            assertThat(roleInfoDTO.getName()).isEqualTo(appViewerRole.get().getName());
            assertThat(roleInfoDTO.getDescription())
                    .isEqualTo(appViewerRole.get().getDescription());
            assertThat(roleInfoDTO.getEntityId()).isEqualTo(createdApplication.getId());
            assertThat(roleInfoDTO.getEntityType()).isEqualTo(Application.class.getSimpleName());
        });
        assertThat(memberInvitedInfoDTOS.stream()
                        .map(MemberInfoDTO::getUserGroupId)
                        .filter(StringUtils::isNotEmpty)
                        .toList())
                .containsExactlyInAnyOrderElementsOf(groupIdsToInvite);
        Map<String, String> mapGroupIdToGroupName =
                groups.stream().collect(Collectors.toMap(UserGroup::getId, UserGroup::getName));
        Map<String, String> mapInvitedGroupIdToGroupName = memberInvitedInfoDTOS.stream()
                .filter(member -> StringUtils.isNotEmpty(member.getUserGroupId()))
                .collect(Collectors.toMap(MemberInfoDTO::getUserGroupId, MemberInfoDTO::getName));
        assertThat(mapGroupIdToGroupName).containsExactlyInAnyOrderEntriesOf(mapInvitedGroupIdToGroupName);
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testInviteToApplication_noDefaultRolesExist_inviteMultipleUsersAndUserGroups() {
        String testName = "testInviteToApplication_noDefaultRolesExist_inviteMultipleUsersAndUserGroups";
        Set<String> usersToInvite = IntStream.range(0, 20)
                .mapToObj(index -> testName + index + "@applicationShareTest.com")
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
        userUtils.makeSuperUser(List.of(testUser)).block();
        List<UserGroup> groups = IntStream.range(0, 20)
                .mapToObj(index -> testName + " - " + index)
                .map(String::toLowerCase)
                .map(groupName -> {
                    UserGroup group = new UserGroup();
                    group.setName(groupName);
                    return userGroupService
                            .createGroup(group)
                            .flatMap(group1 -> userGroupService.findById(group1.getId(), MANAGE_USER_GROUPS))
                            .block();
                })
                .toList();
        userUtils.removeSuperUser(List.of(testUser)).block();

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        Set<String> groupIdsToInvite = groups.stream().map(UserGroup::getId).collect(Collectors.toSet());

        InviteUsersToApplicationDTO inviteToApplicationDTO = new InviteUsersToApplicationDTO();
        inviteToApplicationDTO.setApplicationId(createdApplication.getId());
        inviteToApplicationDTO.setRoleType(APPLICATION_VIEWER);
        inviteToApplicationDTO.setGroups(groupIdsToInvite);
        inviteToApplicationDTO.setUsernames(usersToInvite);

        List<MemberInfoDTO> memberInvitedInfoDTOS = applicationService
                .inviteToApplication(inviteToApplicationDTO, originHeader)
                .block();

        Optional<PermissionGroup> appViewerRole = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(
                        createdApplication.getId(), Application.class.getSimpleName())
                .collectList()
                .block()
                .stream()
                .filter(role -> role.getName().startsWith(APPLICATION_VIEWER))
                .findFirst();
        assertThat(appViewerRole.isPresent()).isTrue();

        assertThat(memberInvitedInfoDTOS).isNotNull();
        assertThat(memberInvitedInfoDTOS).hasSize(usersToInvite.size() + groupIdsToInvite.size());
        memberInvitedInfoDTOS.forEach(member -> {
            assertThat(member.getRoles()).hasSize(1);
            PermissionGroupInfoDTO roleInfoDTO = member.getRoles().get(0);
            assertThat(roleInfoDTO.getId()).isEqualTo(appViewerRole.get().getId());
            assertThat(roleInfoDTO.getName()).isEqualTo(appViewerRole.get().getName());
            assertThat(roleInfoDTO.getDescription())
                    .isEqualTo(appViewerRole.get().getDescription());
            assertThat(roleInfoDTO.getEntityId()).isEqualTo(createdApplication.getId());
            assertThat(roleInfoDTO.getEntityType()).isEqualTo(Application.class.getSimpleName());
        });
        assertThat(memberInvitedInfoDTOS.stream()
                        .map(MemberInfoDTO::getUsername)
                        .filter(StringUtils::isNotEmpty)
                        .toList())
                .containsExactlyInAnyOrderElementsOf(usersToInvite);

        Map<String, String> mapUsernameToUserId = userRepository
                .findAllByEmailIn(new HashSet<>(usersToInvite))
                .collectMap(User::getUsername, BaseDomain::getId)
                .block();
        Map<String, String> mapInvitedUsernameToUserId = memberInvitedInfoDTOS.stream()
                .filter(member -> StringUtils.isNotEmpty(member.getUsername()))
                .collect(Collectors.toMap(MemberInfoDTO::getUsername, MemberInfoDTO::getUserId));
        assertThat(mapUsernameToUserId).containsExactlyInAnyOrderEntriesOf(mapInvitedUsernameToUserId);

        assertThat(memberInvitedInfoDTOS.stream()
                        .map(MemberInfoDTO::getUserGroupId)
                        .filter(StringUtils::isNotEmpty)
                        .toList())
                .containsExactlyInAnyOrderElementsOf(groupIdsToInvite);
        Map<String, String> mapGroupIdToGroupName =
                groups.stream().collect(Collectors.toMap(UserGroup::getId, UserGroup::getName));
        Map<String, String> mapInvitedGroupIdToGroupName = memberInvitedInfoDTOS.stream()
                .filter(member -> StringUtils.isNotEmpty(member.getUserGroupId()))
                .collect(Collectors.toMap(MemberInfoDTO::getUserGroupId, MemberInfoDTO::getName));
        assertThat(mapGroupIdToGroupName).containsExactlyInAnyOrderEntriesOf(mapInvitedGroupIdToGroupName);
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testUpdateRoleForUsers() {
        String testName = "testUpdateRoleForUsers";
        Set<String> usersToInvite = IntStream.range(0, 20)
                .mapToObj(index -> testName + index + "@applicationShareTest.com")
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        InviteUsersToApplicationDTO inviteToApplicationDTO = new InviteUsersToApplicationDTO();
        inviteToApplicationDTO.setApplicationId(createdApplication.getId());
        inviteToApplicationDTO.setRoleType(APPLICATION_VIEWER);
        inviteToApplicationDTO.setUsernames(usersToInvite);

        List<MemberInfoDTO> memberInvitedInfoDTOS = applicationService
                .inviteToApplication(inviteToApplicationDTO, originHeader)
                .block();
        assertThat(memberInvitedInfoDTOS).isNotNull();

        PermissionGroup appViewerRole = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(
                        createdApplication.getId(), Application.class.getSimpleName())
                .collectList()
                .block()
                .stream()
                .filter(role -> role.getName().startsWith(APPLICATION_VIEWER))
                .findFirst()
                .get();

        Random random = new Random();

        List<String> usersToInviteList = usersToInvite.stream().toList();
        User randomUser1 = userRepository
                .findByEmail(usersToInviteList.get(random.nextInt(0, usersToInvite.size() / 2)))
                .block();
        User randomUser2 = userRepository
                .findByEmail(usersToInviteList.get(random.nextInt(usersToInvite.size() / 2, usersToInvite.size())))
                .block();

        UpdateApplicationRoleDTO changeRoleForRandomUser1 = new UpdateApplicationRoleDTO();
        changeRoleForRandomUser1.setNewRole(APPLICATION_DEVELOPER);
        changeRoleForRandomUser1.setUsername(randomUser1.getUsername());

        UpdateApplicationRoleDTO deleteRoleForRandomUser2 = new UpdateApplicationRoleDTO();
        deleteRoleForRandomUser2.setUsername(randomUser2.getUsername());

        MemberInfoDTO updatedRandomUser1 = applicationService
                .updateRoleForMember(createdApplication.getId(), changeRoleForRandomUser1)
                .block();
        MemberInfoDTO deletedRandomUser2 = applicationService
                .updateRoleForMember(createdApplication.getId(), deleteRoleForRandomUser2)
                .block();

        assertThat(updatedRandomUser1).isNotNull();
        assertThat(deletedRandomUser2).isNotNull();

        List<PermissionGroup> defaultApplicationRoles = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(
                        createdApplication.getId(), Application.class.getSimpleName())
                .collectList()
                .block();

        Optional<PermissionGroup> defaultApplicationRoleView = defaultApplicationRoles.stream()
                .filter(role -> role.getName().startsWith(APPLICATION_VIEWER))
                .findFirst();
        assertThat(defaultApplicationRoleView.isPresent()).isTrue();

        Optional<PermissionGroup> defaultApplicationRoleDev = defaultApplicationRoles.stream()
                .filter(role -> role.getName().startsWith(APPLICATION_DEVELOPER))
                .findFirst();
        assertThat(defaultApplicationRoleDev.isPresent()).isTrue();

        assertThat(updatedRandomUser1.getRoles()).hasSize(1);
        assertThat(updatedRandomUser1.getRoles().get(0).getId())
                .isEqualTo(defaultApplicationRoleDev.get().getId());
        assertThat(updatedRandomUser1.getRoles().get(0).getName())
                .isEqualTo(defaultApplicationRoleDev.get().getName());
        assertThat(updatedRandomUser1.getRoles().get(0).getDescription())
                .isEqualTo(defaultApplicationRoleDev.get().getDescription());
        assertThat(updatedRandomUser1.getRoles().get(0).getEntityId()).isEqualTo(createdApplication.getId());
        assertThat(updatedRandomUser1.getRoles().get(0).getEntityType()).isEqualTo(Application.class.getSimpleName());
        assertThat(updatedRandomUser1.getUsername()).isEqualTo(randomUser1.getUsername());

        assertThat(deletedRandomUser2.getRoles()).isNull();
        assertThat(deletedRandomUser2.getUsername()).isEqualTo(randomUser2.getUsername());
        assertThat(deletedRandomUser2.getName()).isEqualTo(randomUser2.getName());
        assertThat(deletedRandomUser2.getUserId()).isEqualTo(randomUser2.getId());

        assertThat(defaultApplicationRoleView.get().getAssignedToUserIds()).hasSize(usersToInvite.size() - 2);
        assertThat(defaultApplicationRoleView.get().getAssignedToUserIds())
                .doesNotContain(randomUser1.getId(), randomUser2.getId());

        assertThat(defaultApplicationRoleDev.get().getAssignedToUserIds()).hasSize(1);
        assertThat(defaultApplicationRoleDev.get().getAssignedToUserIds()).contains(randomUser1.getId());
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testUpdateRoleForMembers() {
        String testName = "testUpdateRoleForMembers";
        Set<String> usersToInvite = IntStream.range(0, 20)
                .mapToObj(index -> testName + index + "@applicationShareTest.com")
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
        userUtils.makeSuperUser(List.of(testUser)).block();
        List<UserGroup> groups = IntStream.range(0, 20)
                .mapToObj(index -> testName + " - " + index)
                .map(String::toLowerCase)
                .map(groupName -> {
                    UserGroup group = new UserGroup();
                    group.setName(groupName);
                    return userGroupService
                            .createGroup(group)
                            .flatMap(group1 -> userGroupService.findById(group1.getId(), MANAGE_USER_GROUPS))
                            .block();
                })
                .toList();
        userUtils.removeSuperUser(List.of(testUser)).block();
        Set<String> groupIdsToInvite = groups.stream().map(UserGroup::getId).collect(Collectors.toSet());

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        InviteUsersToApplicationDTO inviteToApplicationDTO = new InviteUsersToApplicationDTO();
        inviteToApplicationDTO.setApplicationId(createdApplication.getId());
        inviteToApplicationDTO.setRoleType(APPLICATION_VIEWER);
        inviteToApplicationDTO.setUsernames(usersToInvite);
        inviteToApplicationDTO.setGroups(groupIdsToInvite);

        List<MemberInfoDTO> memberInvitedInfoDTOS = applicationService
                .inviteToApplication(inviteToApplicationDTO, originHeader)
                .block();
        assertThat(memberInvitedInfoDTOS).isNotNull();

        Optional<PermissionGroup> appViewerRole = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(
                        createdApplication.getId(), Application.class.getSimpleName())
                .collectList()
                .block()
                .stream()
                .filter(role -> role.getName().startsWith(APPLICATION_VIEWER))
                .findFirst();
        assertThat(appViewerRole.isPresent()).isTrue();

        assertThat(memberInvitedInfoDTOS).isNotNull();
        assertThat(memberInvitedInfoDTOS).hasSize(usersToInvite.size() + groupIdsToInvite.size());
        memberInvitedInfoDTOS.forEach(member -> {
            assertThat(member.getRoles()).hasSize(1);
            PermissionGroupInfoDTO roleInfoDTO = member.getRoles().get(0);
            assertThat(roleInfoDTO.getId()).isEqualTo(appViewerRole.get().getId());
            assertThat(roleInfoDTO.getName()).isEqualTo(appViewerRole.get().getName());
            assertThat(roleInfoDTO.getDescription())
                    .isEqualTo(appViewerRole.get().getDescription());
            assertThat(roleInfoDTO.getEntityId()).isEqualTo(createdApplication.getId());
            assertThat(roleInfoDTO.getEntityType()).isEqualTo(Application.class.getSimpleName());
        });
        assertThat(memberInvitedInfoDTOS.stream()
                        .map(MemberInfoDTO::getUsername)
                        .filter(StringUtils::isNotEmpty)
                        .toList())
                .containsExactlyInAnyOrderElementsOf(usersToInvite);

        Map<String, String> mapUsernameToUserId = userRepository
                .findAllByEmailIn(new HashSet<>(usersToInvite))
                .collectMap(User::getUsername, BaseDomain::getId)
                .block();
        Map<String, String> mapInvitedUsernameToUserId = memberInvitedInfoDTOS.stream()
                .filter(member -> StringUtils.isNotEmpty(member.getUsername()))
                .collect(Collectors.toMap(MemberInfoDTO::getUsername, MemberInfoDTO::getUserId));
        assertThat(mapUsernameToUserId).containsExactlyInAnyOrderEntriesOf(mapInvitedUsernameToUserId);

        assertThat(memberInvitedInfoDTOS.stream()
                        .map(MemberInfoDTO::getUserGroupId)
                        .filter(StringUtils::isNotEmpty)
                        .toList())
                .containsExactlyInAnyOrderElementsOf(groupIdsToInvite);
        Map<String, String> mapGroupIdToGroupName =
                groups.stream().collect(Collectors.toMap(UserGroup::getId, UserGroup::getName));
        Map<String, String> mapInvitedGroupIdToGroupName = memberInvitedInfoDTOS.stream()
                .filter(member -> StringUtils.isNotEmpty(member.getUserGroupId()))
                .collect(Collectors.toMap(MemberInfoDTO::getUserGroupId, MemberInfoDTO::getName));
        assertThat(mapGroupIdToGroupName).containsExactlyInAnyOrderEntriesOf(mapInvitedGroupIdToGroupName);

        Random random = new Random();

        List<String> usersToInviteList = usersToInvite.stream().toList();
        User randomUser1 = userRepository
                .findByEmail(usersToInviteList.get(random.nextInt(0, usersToInvite.size() / 2)))
                .block();
        User randomUser2 = userRepository
                .findByEmail(usersToInviteList.get(random.nextInt(usersToInvite.size() / 2, usersToInvite.size())))
                .block();

        UserGroup randomGroup1 = groups.get(random.nextInt(0, groups.size() / 2));
        UserGroup randomGroup2 = groups.get(random.nextInt(groups.size() / 2, groups.size()));

        UpdateApplicationRoleDTO changeRoleForRandomUser1 = new UpdateApplicationRoleDTO();
        changeRoleForRandomUser1.setNewRole(APPLICATION_DEVELOPER);
        changeRoleForRandomUser1.setUsername(randomUser1.getUsername());

        UpdateApplicationRoleDTO deleteRoleForRandomUser2 = new UpdateApplicationRoleDTO();
        deleteRoleForRandomUser2.setUsername(randomUser2.getUsername());

        UpdateApplicationRoleDTO changeRoleForRandomGroup1 = new UpdateApplicationRoleDTO();
        changeRoleForRandomGroup1.setNewRole(APPLICATION_DEVELOPER);
        changeRoleForRandomGroup1.setUserGroupId(randomGroup1.getId());

        UpdateApplicationRoleDTO deleteRoleForRandomGroup2 = new UpdateApplicationRoleDTO();
        deleteRoleForRandomGroup2.setUserGroupId(randomGroup2.getId());

        MemberInfoDTO updatedRandomUser1 = applicationService
                .updateRoleForMember(createdApplication.getId(), changeRoleForRandomUser1)
                .block();
        MemberInfoDTO deletedRandomUser2 = applicationService
                .updateRoleForMember(createdApplication.getId(), deleteRoleForRandomUser2)
                .block();
        MemberInfoDTO updatedRandomGroup1 = applicationService
                .updateRoleForMember(createdApplication.getId(), changeRoleForRandomGroup1)
                .block();
        MemberInfoDTO deletedRandomGroup2 = applicationService
                .updateRoleForMember(createdApplication.getId(), deleteRoleForRandomGroup2)
                .block();

        assertThat(updatedRandomUser1).isNotNull();
        assertThat(deletedRandomUser2).isNotNull();
        assertThat(updatedRandomGroup1).isNotNull();
        assertThat(deletedRandomGroup2).isNotNull();

        List<PermissionGroup> defaultApplicationRoles = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(
                        createdApplication.getId(), Application.class.getSimpleName())
                .collectList()
                .block();

        Optional<PermissionGroup> defaultApplicationRoleView = defaultApplicationRoles.stream()
                .filter(role -> role.getName().startsWith(APPLICATION_VIEWER))
                .findFirst();
        assertThat(defaultApplicationRoleView.isPresent()).isTrue();

        Optional<PermissionGroup> defaultApplicationRoleDev = defaultApplicationRoles.stream()
                .filter(role -> role.getName().startsWith(APPLICATION_DEVELOPER))
                .findFirst();
        assertThat(defaultApplicationRoleDev.isPresent()).isTrue();

        assertThat(updatedRandomUser1.getRoles()).hasSize(1);
        assertThat(updatedRandomUser1.getRoles().get(0).getId())
                .isEqualTo(defaultApplicationRoleDev.get().getId());
        assertThat(updatedRandomUser1.getRoles().get(0).getName())
                .isEqualTo(defaultApplicationRoleDev.get().getName());
        assertThat(updatedRandomUser1.getRoles().get(0).getDescription())
                .isEqualTo(defaultApplicationRoleDev.get().getDescription());
        assertThat(updatedRandomUser1.getRoles().get(0).getEntityId()).isEqualTo(createdApplication.getId());
        assertThat(updatedRandomUser1.getRoles().get(0).getEntityType()).isEqualTo(Application.class.getSimpleName());
        assertThat(updatedRandomUser1.getUsername()).isEqualTo(randomUser1.getUsername());

        assertThat(deletedRandomUser2.getRoles()).isNull();
        assertThat(deletedRandomUser2.getUsername()).isEqualTo(randomUser2.getUsername());
        assertThat(deletedRandomUser2.getName()).isEqualTo(randomUser2.getName());
        assertThat(deletedRandomUser2.getUserId()).isEqualTo(randomUser2.getId());

        assertThat(updatedRandomGroup1.getRoles()).hasSize(1);
        assertThat(updatedRandomGroup1.getRoles().get(0).getId())
                .isEqualTo(defaultApplicationRoleDev.get().getId());
        assertThat(updatedRandomGroup1.getRoles().get(0).getName())
                .isEqualTo(defaultApplicationRoleDev.get().getName());
        assertThat(updatedRandomGroup1.getRoles().get(0).getDescription())
                .isEqualTo(defaultApplicationRoleDev.get().getDescription());
        assertThat(updatedRandomGroup1.getRoles().get(0).getEntityId()).isEqualTo(createdApplication.getId());
        assertThat(updatedRandomGroup1.getRoles().get(0).getEntityType()).isEqualTo(Application.class.getSimpleName());
        assertThat(updatedRandomGroup1.getUserGroupId()).isEqualTo(randomGroup1.getId());

        assertThat(deletedRandomGroup2.getRoles()).isNull();
        assertThat(deletedRandomGroup2.getUserGroupId()).isEqualTo(randomGroup2.getId());
        assertThat(deletedRandomGroup2.getName()).isEqualTo(randomGroup2.getName());

        assertThat(defaultApplicationRoleView.get().getAssignedToUserIds()).hasSize(usersToInvite.size() - 2);
        assertThat(defaultApplicationRoleView.get().getAssignedToUserIds())
                .doesNotContain(randomUser1.getId(), randomUser2.getId());
        assertThat(defaultApplicationRoleView.get().getAssignedToGroupIds()).hasSize(groupIdsToInvite.size() - 2);
        assertThat(defaultApplicationRoleView.get().getAssignedToGroupIds())
                .doesNotContain(randomGroup1.getId(), randomGroup2.getId());

        assertThat(defaultApplicationRoleDev.get().getAssignedToUserIds()).hasSize(1);
        assertThat(defaultApplicationRoleDev.get().getAssignedToUserIds()).contains(randomUser1.getId());
        assertThat(defaultApplicationRoleDev.get().getAssignedToGroupIds()).hasSize(1);
        assertThat(defaultApplicationRoleDev.get().getAssignedToGroupIds()).contains(randomGroup1.getId());
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testUpdateRoleForMembers_removeAllMembers() {
        String testName = "testUpdateRoleForMembers";
        Set<String> usersToInvite = IntStream.range(0, 20)
                .mapToObj(index -> testName + index + "@applicationShareTest.com")
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
        userUtils.makeSuperUser(List.of(testUser)).block();
        List<UserGroup> groups = IntStream.range(0, 20)
                .mapToObj(index -> testName + " - " + index)
                .map(String::toLowerCase)
                .map(groupName -> {
                    UserGroup group = new UserGroup();
                    group.setName(groupName);
                    return userGroupService
                            .createGroup(group)
                            .flatMap(group1 -> userGroupService.findById(group1.getId(), MANAGE_USER_GROUPS))
                            .block();
                })
                .toList();
        userUtils.removeSuperUser(List.of(testUser)).block();
        Set<String> groupIdsToInvite = groups.stream().map(UserGroup::getId).collect(Collectors.toSet());

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        InviteUsersToApplicationDTO inviteToApplicationDTO = new InviteUsersToApplicationDTO();
        inviteToApplicationDTO.setApplicationId(createdApplication.getId());
        inviteToApplicationDTO.setRoleType(APPLICATION_VIEWER);
        inviteToApplicationDTO.setUsernames(usersToInvite);
        inviteToApplicationDTO.setGroups(groupIdsToInvite);

        List<MemberInfoDTO> memberInvitedInfoDTOS = applicationService
                .inviteToApplication(inviteToApplicationDTO, originHeader)
                .block();
        assertThat(memberInvitedInfoDTOS).isNotNull();

        Optional<PermissionGroup> appViewerRole = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(
                        createdApplication.getId(), Application.class.getSimpleName())
                .collectList()
                .block()
                .stream()
                .filter(role -> role.getName().startsWith(APPLICATION_VIEWER))
                .findFirst();
        assertThat(appViewerRole.isPresent()).isTrue();

        assertThat(memberInvitedInfoDTOS).isNotNull();
        assertThat(memberInvitedInfoDTOS).hasSize(usersToInvite.size() + groupIdsToInvite.size());
        memberInvitedInfoDTOS.forEach(member -> {
            assertThat(member.getRoles()).hasSize(1);
            PermissionGroupInfoDTO roleInfoDTO = member.getRoles().get(0);
            assertThat(roleInfoDTO.getId()).isEqualTo(appViewerRole.get().getId());
            assertThat(roleInfoDTO.getName()).isEqualTo(appViewerRole.get().getName());
            assertThat(roleInfoDTO.getDescription())
                    .isEqualTo(appViewerRole.get().getDescription());
            assertThat(roleInfoDTO.getEntityId()).isEqualTo(createdApplication.getId());
            assertThat(roleInfoDTO.getEntityType()).isEqualTo(Application.class.getSimpleName());
        });
        assertThat(memberInvitedInfoDTOS.stream()
                        .map(MemberInfoDTO::getUsername)
                        .filter(StringUtils::isNotEmpty)
                        .toList())
                .containsExactlyInAnyOrderElementsOf(usersToInvite);

        Map<String, String> mapUsernameToUserId = userRepository
                .findAllByEmailIn(new HashSet<>(usersToInvite))
                .collectMap(User::getUsername, BaseDomain::getId)
                .block();
        Map<String, String> mapInvitedUsernameToUserId = memberInvitedInfoDTOS.stream()
                .filter(member -> StringUtils.isNotEmpty(member.getUsername()))
                .collect(Collectors.toMap(MemberInfoDTO::getUsername, MemberInfoDTO::getUserId));
        assertThat(mapUsernameToUserId).containsExactlyInAnyOrderEntriesOf(mapInvitedUsernameToUserId);

        assertThat(memberInvitedInfoDTOS.stream()
                        .map(MemberInfoDTO::getUserGroupId)
                        .filter(StringUtils::isNotEmpty)
                        .toList())
                .containsExactlyInAnyOrderElementsOf(groupIdsToInvite);
        Map<String, String> mapGroupIdToGroupName =
                groups.stream().collect(Collectors.toMap(UserGroup::getId, UserGroup::getName));
        Map<String, String> mapInvitedGroupIdToGroupName = memberInvitedInfoDTOS.stream()
                .filter(member -> StringUtils.isNotEmpty(member.getUserGroupId()))
                .collect(Collectors.toMap(MemberInfoDTO::getUserGroupId, MemberInfoDTO::getName));
        assertThat(mapGroupIdToGroupName).containsExactlyInAnyOrderEntriesOf(mapInvitedGroupIdToGroupName);

        usersToInvite.forEach(username -> {
            UpdateApplicationRoleDTO deleteRoleForUser = new UpdateApplicationRoleDTO();
            deleteRoleForUser.setUsername(username);
            MemberInfoDTO deletedForUser = applicationService
                    .updateRoleForMember(createdApplication.getId(), deleteRoleForUser)
                    .block();
            assertThat(deletedForUser).isNotNull();
            assertThat(deletedForUser.getRoles()).isNull();
            assertThat(deletedForUser.getUsername()).isEqualTo(username);
        });

        groups.forEach(group -> {
            UpdateApplicationRoleDTO deleteRoleForGroup = new UpdateApplicationRoleDTO();
            deleteRoleForGroup.setUserGroupId(group.getId());
            MemberInfoDTO deletedForGroup = applicationService
                    .updateRoleForMember(createdApplication.getId(), deleteRoleForGroup)
                    .block();
            assertThat(deletedForGroup).isNotNull();
            assertThat(deletedForGroup.getRoles()).isNull();
            assertThat(deletedForGroup.getUserGroupId()).isEqualTo(group.getId());
            assertThat(deletedForGroup.getName()).isEqualTo(group.getName());
        });

        List<PermissionGroup> defaultApplicationRoles = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(
                        createdApplication.getId(), Application.class.getSimpleName())
                .collectList()
                .block();
        assertThat(defaultApplicationRoles).isEmpty();
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testFetchAllDefaultRolesWithoutPermissions() {
        List<PermissionGroupInfoDTO> defaultRoleDescriptionDTOs =
                applicationService.fetchAllDefaultRolesWithoutPermissions().block();
        assertThat(defaultRoleDescriptionDTOs).hasSize(2);
        PermissionGroupInfoDTO developerRole = defaultRoleDescriptionDTOs.get(0);
        PermissionGroupInfoDTO viewerRole = defaultRoleDescriptionDTOs.get(1);
        assertThat(developerRole.getName()).isEqualTo(APPLICATION_DEVELOPER);
        assertThat(viewerRole.getName()).isEqualTo(APPLICATION_VIEWER);
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testGetAllApplicationMembers() {
        String testName = "testGetAllApplicationMembers";

        Set<String> usersToInvite = IntStream.range(0, 20)
                .mapToObj(index -> testName + index + "@applicationShareTest.com")
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
        userUtils.makeSuperUser(List.of(testUser)).block();
        List<UserGroup> groups = IntStream.range(0, 20)
                .mapToObj(index -> testName + " - " + index)
                .map(String::toLowerCase)
                .map(groupName -> {
                    UserGroup group = new UserGroup();
                    group.setName(groupName);
                    return userGroupService
                            .createGroup(group)
                            .flatMap(group1 -> userGroupService.findById(group1.getId(), MANAGE_USER_GROUPS))
                            .block();
                })
                .toList();
        userUtils.removeSuperUser(List.of(testUser)).block();
        Set<String> groupIdsToInvite = groups.stream().map(UserGroup::getId).collect(Collectors.toSet());

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        InviteUsersToApplicationDTO inviteToDevRoleApplicationDTO = new InviteUsersToApplicationDTO();
        inviteToDevRoleApplicationDTO.setApplicationId(createdApplication.getId());
        inviteToDevRoleApplicationDTO.setRoleType(APPLICATION_DEVELOPER);
        inviteToDevRoleApplicationDTO.setUsernames(usersToInvite);

        InviteUsersToApplicationDTO inviteToViewRoleApplicationDTO = new InviteUsersToApplicationDTO();
        inviteToViewRoleApplicationDTO.setApplicationId(createdApplication.getId());
        inviteToViewRoleApplicationDTO.setRoleType(APPLICATION_VIEWER);
        inviteToViewRoleApplicationDTO.setGroups(groupIdsToInvite);

        applicationService
                .inviteToApplication(inviteToDevRoleApplicationDTO, originHeader)
                .block();
        applicationService
                .inviteToApplication(inviteToViewRoleApplicationDTO, originHeader)
                .block();

        List<MemberInfoDTO> defaultApplicationMembers = applicationMemberService
                .getAllMembersForApplication(createdApplication.getId())
                .block();
        assertThat(defaultApplicationMembers).hasSize(usersToInvite.size() + groups.size());
        List<MemberInfoDTO> groupsWhichAreMembers = defaultApplicationMembers.stream()
                .filter(member -> StringUtils.isNotEmpty(member.getUserGroupId()))
                .toList();
        List<MemberInfoDTO> usersWhoAreMembers = defaultApplicationMembers.stream()
                .filter(member -> StringUtils.isNotEmpty(member.getUserId()))
                .toList();
        assertThat(groupsWhichAreMembers).isNotNull();
        assertThat(groupsWhichAreMembers).hasSize(groups.size());
        assertThat(groupsWhichAreMembers.stream()
                        .map(member -> member.getUserGroupId())
                        .collect(Collectors.toSet()))
                .containsAll(groupIdsToInvite);
        assertThat(usersWhoAreMembers).isNotNull();
        assertThat(usersWhoAreMembers).hasSize(usersToInvite.size());
        assertThat(usersWhoAreMembers.stream()
                        .map(member -> member.getUsername())
                        .collect(Collectors.toSet()))
                .containsAll(usersToInvite);
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void getAllWorkspaceAndApplicationMembers_usersAndUserGroups() {
        String testName = "getAllWorkspaceAndApplicationMembers_usersAndUserGroups";

        Set<String> usersToInviteToApplication = Set.of("a+" + testName + "@applicationShareTest.com");
        List<String> usersToInviteToWorkspace = List.of("b+" + testName + "@applicationShareTest.com");
        Set<String> usersToInviteToApplicationAndWorkspaceSet = Set.of("c+" + testName + "@applicationShareTest.com");
        List<String> usersToInviteToApplicationAndWorkspaceList =
                List.of("c+" + testName + "@applicationShareTest.com");

        userUtils.makeSuperUser(List.of(testUser)).block();
        UserGroup group1 = new UserGroup();
        group1.setName("a" + testName);
        UserGroup createdGroup1 = userGroupService
                .createGroup(group1)
                .flatMap(group -> userGroupService.findById(group.getId(), MANAGE_USER_GROUPS))
                .block();
        UserGroup group2 = new UserGroup();
        group2.setName("b" + testName);
        UserGroup createdGroup2 = userGroupService
                .createGroup(group2)
                .flatMap(group -> userGroupService.findById(group.getId(), MANAGE_USER_GROUPS))
                .block();
        UserGroup group3 = new UserGroup();
        group3.setName("c" + testName);
        UserGroup createdGroup3 = userGroupService
                .createGroup(group3)
                .flatMap(group -> userGroupService.findById(group.getId(), MANAGE_USER_GROUPS))
                .block();
        userUtils.removeSuperUser(List.of(testUser)).block();
        Set<String> groupIdsToInviteToApplication = Set.of(createdGroup1.getId());
        Set<String> groupIdsToInviteToWorkspace = Set.of(createdGroup2.getId());
        Set<String> groupIdsToInviteToApplicationAndWorkspace = Set.of(createdGroup3.getId());

        Application application1 = new Application();
        application1.setName(testName + 1);
        application1.setWorkspaceId(workspace.getId());
        Application createdApplication1 =
                applicationPageService.createApplication(application1).block();

        Application application2 = new Application();
        application2.setName(testName + 2);
        application2.setWorkspaceId(workspace.getId());
        Application createdApplication2 =
                applicationPageService.createApplication(application2).block();

        InviteUsersToApplicationDTO inviteToApplicationDTO = new InviteUsersToApplicationDTO();
        inviteToApplicationDTO.setApplicationId(createdApplication1.getId());
        inviteToApplicationDTO.setRoleType(APPLICATION_VIEWER);
        inviteToApplicationDTO.setUsernames(usersToInviteToApplication);
        inviteToApplicationDTO.setGroups(groupIdsToInviteToApplication);

        InviteUsersToApplicationDTO inviteToApplicationAndWorkspaceDTO1 = new InviteUsersToApplicationDTO();
        inviteToApplicationAndWorkspaceDTO1.setApplicationId(createdApplication2.getId());
        inviteToApplicationAndWorkspaceDTO1.setRoleType(APPLICATION_DEVELOPER);
        inviteToApplicationAndWorkspaceDTO1.setUsernames(usersToInviteToApplicationAndWorkspaceSet);
        inviteToApplicationAndWorkspaceDTO1.setGroups(groupIdsToInviteToApplicationAndWorkspace);

        InviteUsersDTO inviteToWorkspaceDTO = new InviteUsersDTO();
        inviteToWorkspaceDTO.setPermissionGroupId(workspaceDevRole.getId());
        inviteToWorkspaceDTO.setUsernames(usersToInviteToWorkspace);
        inviteToWorkspaceDTO.setGroups(groupIdsToInviteToWorkspace);

        InviteUsersDTO inviteToApplicationAndWorkspaceDTO2 = new InviteUsersDTO();
        inviteToApplicationAndWorkspaceDTO2.setPermissionGroupId(workspaceDevRole.getId());
        inviteToApplicationAndWorkspaceDTO2.setUsernames(usersToInviteToApplicationAndWorkspaceList);
        inviteToApplicationAndWorkspaceDTO2.setGroups(groupIdsToInviteToApplicationAndWorkspace);

        applicationService
                .inviteToApplication(inviteToApplicationDTO, originHeader)
                .block();
        applicationService
                .inviteToApplication(inviteToApplicationAndWorkspaceDTO1, originHeader)
                .block();
        userAndAccessManagementService.inviteUsers(inviteToWorkspaceDTO, "test").block();
        userAndAccessManagementService
                .inviteUsers(inviteToApplicationAndWorkspaceDTO2, "test")
                .block();

        PermissionGroup appViewerRole = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(
                        createdApplication1.getId(), Application.class.getSimpleName())
                .collectList()
                .block()
                .stream()
                .filter(role -> role.getName().startsWith(APPLICATION_VIEWER))
                .findFirst()
                .get();

        PermissionGroup devViewerRole = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(
                        createdApplication2.getId(), Application.class.getSimpleName())
                .collectList()
                .block()
                .stream()
                .filter(role -> role.getName().startsWith(APPLICATION_DEVELOPER))
                .findFirst()
                .get();

        /*
         * Below assertions check for the workspace and application members.
         * It checks for the total number of members in the workspace.
         * It also checks for the order in which the members are returned.
         * For individual member, it asserts for the member id or username.
         * It also checks for the order of roles present inside each member.
         * Also, it checks for the individual roles which are present inside each member
         */
        List<MemberInfoDTO> members =
                userWorkspaceService.getWorkspaceMembers(workspace.getId()).block();
        assertThat(members).hasSize(7);
        MemberInfoDTO member1 = members.get(0);
        assertThat(member1.getName()).isEqualTo(testUser.getName());
        assertThat(member1.getUsername()).isEqualTo(testUser.getUsername());
        assertThat(member1.getRoles()).hasSize(1);
        PermissionGroupInfoDTO member1Role1 = member1.getRoles().get(0);
        assertThat(member1Role1.getEntityType()).isEqualTo(Workspace.class.getSimpleName());
        assertThat(member1Role1.getId()).isEqualTo(workspaceAdminRole.getId());
        assertThat(member1Role1.getName()).isEqualTo(workspaceAdminRole.getName());

        MemberInfoDTO member2 = members.get(1);
        assertThat(member2.getUsername()).isEqualToIgnoringCase("b+" + testName + "@applicationShareTest.com");
        assertThat(member2.getRoles()).hasSize(1);
        PermissionGroupInfoDTO member2Role1 = member2.getRoles().get(0);
        assertThat(member2Role1.getEntityType()).isEqualTo(Workspace.class.getSimpleName());
        assertThat(member2Role1.getId()).isEqualTo(workspaceDevRole.getId());
        assertThat(member2Role1.getName()).isEqualTo(workspaceDevRole.getName());

        MemberInfoDTO member3 = members.get(2);
        assertThat(member3.getName()).isEqualTo("b" + testName);
        assertThat(member3.getUserGroupId()).isEqualTo(createdGroup2.getId());
        assertThat(member3.getRoles()).hasSize(1);
        PermissionGroupInfoDTO member3Role1 = member3.getRoles().get(0);
        assertThat(member3Role1.getEntityType()).isEqualTo(Workspace.class.getSimpleName());
        assertThat(member3Role1.getId()).isEqualTo(workspaceDevRole.getId());
        assertThat(member3Role1.getName()).isEqualTo(workspaceDevRole.getName());

        MemberInfoDTO member4 = members.get(3);
        assertThat(member4.getUsername()).isEqualToIgnoringCase("c+" + testName + "@applicationShareTest.com");
        assertThat(member4.getRoles()).hasSize(2);
        PermissionGroupInfoDTO member4Role1 = member4.getRoles().get(0);
        assertThat(member4Role1.getEntityType()).isEqualTo(Workspace.class.getSimpleName());
        assertThat(member4Role1.getId()).isEqualTo(workspaceDevRole.getId());
        assertThat(member4Role1.getName()).isEqualTo(workspaceDevRole.getName());
        PermissionGroupInfoDTO member4Role2 = member4.getRoles().get(1);
        assertThat(member4Role2.getEntityType()).isEqualTo(Application.class.getSimpleName());
        assertThat(member4Role2.getEntityName()).isEqualTo(createdApplication2.getName());
        assertThat(member4Role2.getEntityId()).isEqualTo(createdApplication2.getId());
        assertThat(member4Role2.getId()).isEqualTo(devViewerRole.getId());
        assertThat(member4Role2.getName()).isEqualTo(devViewerRole.getName());

        MemberInfoDTO member5 = members.get(4);
        assertThat(member5.getName()).isEqualTo("c" + testName);
        assertThat(member5.getUserGroupId()).isEqualTo(createdGroup3.getId());
        PermissionGroupInfoDTO member5Role1 = member5.getRoles().get(0);
        assertThat(member5Role1.getEntityType()).isEqualTo(Workspace.class.getSimpleName());
        assertThat(member5Role1.getId()).isEqualTo(workspaceDevRole.getId());
        assertThat(member5Role1.getName()).isEqualTo(workspaceDevRole.getName());
        PermissionGroupInfoDTO member5Role2 = member5.getRoles().get(1);
        assertThat(member5Role2.getEntityType()).isEqualTo(Application.class.getSimpleName());
        assertThat(member5Role2.getEntityName()).isEqualTo(createdApplication2.getName());
        assertThat(member5Role2.getEntityId()).isEqualTo(createdApplication2.getId());
        assertThat(member5Role2.getId()).isEqualTo(devViewerRole.getId());
        assertThat(member5Role2.getName()).isEqualTo(devViewerRole.getName());

        MemberInfoDTO member6 = members.get(5);
        assertThat(member6.getUsername()).isEqualToIgnoringCase("a+" + testName + "@applicationShareTest.com");
        assertThat(member6.getRoles()).hasSize(2);
        PermissionGroupInfoDTO member6Role1 = member6.getRoles().get(0);
        assertThat(member6Role1.getEntityType()).isEqualTo(Workspace.class.getSimpleName());
        assertThat(member6Role1.getId()).isNull();
        PermissionGroupInfoDTO member6Role2 = member6.getRoles().get(1);
        assertThat(member6Role2.getEntityType()).isEqualTo(Application.class.getSimpleName());
        assertThat(member6Role2.getEntityName()).isEqualTo(createdApplication1.getName());
        assertThat(member6Role2.getEntityId()).isEqualTo(createdApplication1.getId());
        assertThat(member6Role2.getId()).isEqualTo(appViewerRole.getId());
        assertThat(member6Role2.getName()).isEqualTo(appViewerRole.getName());

        MemberInfoDTO member7 = members.get(6);
        assertThat(member7.getName()).isEqualTo("a" + testName);
        assertThat(member7.getUserGroupId()).isEqualTo(createdGroup1.getId());
        PermissionGroupInfoDTO member7Role1 = member7.getRoles().get(0);
        assertThat(member7Role1.getEntityType()).isEqualTo(Workspace.class.getSimpleName());
        assertThat(member7Role1.getId()).isNull();
        PermissionGroupInfoDTO member7Role2 = member7.getRoles().get(1);
        assertThat(member7Role2.getEntityType()).isEqualTo(Application.class.getSimpleName());
        assertThat(member7Role2.getEntityName()).isEqualTo(createdApplication1.getName());
        assertThat(member7Role2.getEntityId()).isEqualTo(createdApplication1.getId());
        assertThat(member7Role2.getId()).isEqualTo(appViewerRole.getId());
        assertThat(member7Role2.getName()).isEqualTo(appViewerRole.getName());
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void
            testDatasourcePolicies_createDatasource_thenCreateApplicationViewRole_thenCreateActionCollection_thenCreateAction() {
        String testName =
                "testDatasourcePolicies_createDatasource_thenCreateApplicationViewRole_thenCreateActionCollection_thenCreateAction";
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        String pluginId =
                pluginService.findByPackageName("restapi-plugin").block().getId();

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        Datasource datasource = new Datasource();
        datasource.setName(testName);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        datasource.setWorkspaceId(workspace.getId());
        datasource.setPluginId(pluginId);

        String environmentId = workspaceService
                .getDefaultEnvironmentId(workspace.getId(), environmentPermission.getExecutePermission())
                .block();

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(environmentId, new DatasourceStorageDTO(null, environmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Datasource createdDatasource = datasourceService.create(datasource).block();

        PermissionGroup viewApplicationRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_VIEWER)
                .block();

        Set<Policy> datasourcePolicies =
                datasourceRepository.findById(createdDatasource.getId()).block().getPolicies();

        datasourcePolicies.forEach(policy -> {
            if (policy.getPermission().equals(MANAGE_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(DELETE_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(EXECUTE_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(READ_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(CREATE_DATASOURCE_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
        });

        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName("testActionCollection");
        actionCollectionDTO.setApplicationId(createdApplication.getId());
        actionCollectionDTO.setWorkspaceId(workspace.getId());
        actionCollectionDTO.setPageId(
                createdApplication.getPages().stream().findAny().get().getDefaultPageId());
        actionCollectionDTO.setPluginId(pluginId);
        actionCollectionDTO.setPluginType(PluginType.JS);

        ActionCollectionDTO createdActionCollectionDTO = layoutCollectionService
                .createCollection(actionCollectionDTO, null)
                .block();

        Set<Policy> datasourcePoliciesAfterActionCollectionCreation =
                datasourceRepository.findById(createdDatasource.getId()).block().getPolicies();

        datasourcePoliciesAfterActionCollectionCreation.forEach(policy -> {
            if (policy.getPermission().equals(MANAGE_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(DELETE_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(EXECUTE_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(READ_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(CREATE_DATASOURCE_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
        });

        ActionDTO action = new ActionDTO();
        action.setName(testName);
        action.setPluginId(pluginId);
        action.setPageId(createdApplication.getPages().get(0).getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(createdDatasource);

        ActionDTO createdActionBlock =
                layoutActionService.createSingleAction(action, FALSE).block();

        Set<Policy> datasourcePoliciesAfterActionCreation =
                datasourceRepository.findById(createdDatasource.getId()).block().getPolicies();

        datasourcePoliciesAfterActionCreation.forEach(policy -> {
            if (policy.getPermission().equals(MANAGE_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(DELETE_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(EXECUTE_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(READ_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
            if (policy.getPermission().equals(CREATE_DATASOURCE_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
            }
        });
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testDatasourcePolicies_createDatasource_thenCreateApplicationDevRole_thenCreateDatasource() {
        String testName = "testDatasourcePolicies_createDatasource_thenCreateApplicationDevRole_thenCreateDatasource";
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        String pluginId =
                pluginService.findByPackageName("restapi-plugin").block().getId();

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        Datasource datasource = new Datasource();
        datasource.setName(testName);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        datasource.setWorkspaceId(workspace.getId());
        datasource.setPluginId(pluginId);

        String environmentId = workspaceService
                .getDefaultEnvironmentId(workspace.getId(), environmentPermission.getExecutePermission())
                .block();
        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(environmentId, new DatasourceStorageDTO(null, environmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Datasource createdDatasourceBeforeRoleCreated =
                datasourceService.create(datasource).block();

        PermissionGroup devApplicationRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_DEVELOPER)
                .block();

        Datasource datasource1 = new Datasource();
        datasource1.setName(testName + 1);
        DatasourceConfiguration datasourceConfiguration1 = new DatasourceConfiguration();
        datasourceConfiguration1.setUrl("http://test.com");
        datasource1.setWorkspaceId(workspace.getId());
        datasource1.setPluginId(pluginId);

        HashMap<String, DatasourceStorageDTO> storages1 = new HashMap<>();
        storages1.put(environmentId, new DatasourceStorageDTO(null, environmentId, datasourceConfiguration1));
        datasource1.setDatasourceStorages(storages1);
        Datasource createdDatasourceAfterRoleCreated =
                datasourceService.create(datasource1).block();

        Set<Policy> datasourcePoliciesBeforeRoleCreated = datasourceRepository
                .findById(createdDatasourceBeforeRoleCreated.getId())
                .block()
                .getPolicies();

        Set<Policy> datasourcePoliciesAfterRoleCreated = datasourceRepository
                .findById(createdDatasourceAfterRoleCreated.getId())
                .block()
                .getPolicies();

        datasourcePoliciesBeforeRoleCreated.forEach(policy -> {
            if (policy.getPermission().equals(MANAGE_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(devApplicationRole.getId());
            }
            if (policy.getPermission().equals(DELETE_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(devApplicationRole.getId());
            }
            if (policy.getPermission().equals(EXECUTE_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            }
            if (policy.getPermission().equals(READ_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            }
            if (policy.getPermission().equals(CREATE_DATASOURCE_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            }
        });

        datasourcePoliciesAfterRoleCreated.forEach(policy -> {
            if (policy.getPermission().equals(MANAGE_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(devApplicationRole.getId());
            }
            if (policy.getPermission().equals(DELETE_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups()).doesNotContain(devApplicationRole.getId());
            }
            if (policy.getPermission().equals(EXECUTE_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            }
            if (policy.getPermission().equals(READ_DATASOURCES.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            }
            if (policy.getPermission().equals(CREATE_DATASOURCE_ACTIONS.getValue())) {
                assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
            }
        });
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testEnvironmentPolicies_createApplicationViewRole_grantsPermissionsToOnlyProductionEnv() {
        String testName = "testEnvironmentPolicies_createApplicationViewRole_grantsPermissionsToOnlyProductionEnv";
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        pluginService.findByPackageName("restapi-plugin").block().getId();

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        List<Environment> environmentListBeforeRoleCreated = environmentService
                .findByWorkspaceId(workspace.getId())
                .collectList()
                .block();

        PermissionGroup viewApplicationRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_VIEWER)
                .block();

        List<Environment> environmentListAfterRoleCreated = environmentService
                .findByWorkspaceId(workspace.getId())
                .collectList()
                .block();

        assertThat(environmentListBeforeRoleCreated).hasSize(2);
        environmentListBeforeRoleCreated.forEach(environment -> {
            for (Policy policy : environment.getPolicies()) {
                if (policy.getPermission().equals(EXECUTE_ENVIRONMENTS.getValue())) {
                    assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
                }
            }
        });

        assertThat(environmentListAfterRoleCreated).hasSize(2);
        environmentListAfterRoleCreated.forEach(environment -> {
            for (Policy policy : environment.getPolicies()) {
                if (policy.getPermission().equals(EXECUTE_ENVIRONMENTS.getValue())) {
                    if (TRUE.equals(environment.getIsDefault())) {
                        assertThat(policy.getPermissionGroups()).contains(viewApplicationRole.getId());
                    } else {
                        assertThat(policy.getPermissionGroups()).doesNotContain(viewApplicationRole.getId());
                    }
                }
            }
        });
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void testEnvironmentPolicies_createApplicationDevRole_grantsPermissionsToAllEnvs() {
        String testName = "testEnvironmentPolicies_createApplicationDevRole_grantsPermissionsToAllEnvs";
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        pluginService.findByPackageName("restapi-plugin").block().getId();

        Application application = new Application();
        application.setName(testName);
        application.setWorkspaceId(workspace.getId());
        Application createdApplication =
                applicationPageService.createApplication(application).block();

        List<Environment> environmentListBeforeRoleCreated = environmentService
                .findByWorkspaceId(workspace.getId())
                .collectList()
                .block();

        PermissionGroup devApplicationRole = applicationService
                .createDefaultRole(createdApplication, APPLICATION_DEVELOPER)
                .block();

        List<Environment> environmentListAfterRoleCreated = environmentService
                .findByWorkspaceId(workspace.getId())
                .collectList()
                .block();

        assertThat(environmentListBeforeRoleCreated).hasSize(2);
        environmentListBeforeRoleCreated.forEach(environment -> {
            for (Policy policy : environment.getPolicies()) {
                if (policy.getPermission().equals(EXECUTE_ENVIRONMENTS.getValue())) {
                    assertThat(policy.getPermissionGroups()).doesNotContain(devApplicationRole.getId());
                }
            }
        });

        assertThat(environmentListAfterRoleCreated).hasSize(2);
        environmentListAfterRoleCreated.forEach(environment -> {
            for (Policy policy : environment.getPolicies()) {
                if (policy.getPermission().equals(EXECUTE_ENVIRONMENTS.getValue())) {
                    assertThat(policy.getPermissionGroups()).contains(devApplicationRole.getId());
                }
            }
        });
    }
}
