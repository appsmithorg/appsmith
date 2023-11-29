package com.appsmith.server.moduleinstances.share.application;

import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exports.internal.ExportApplicationService;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.imports.internal.ImportApplicationService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.EnvironmentService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.UserWorkspaceService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import com.appsmith.server.solutions.roles.RoleConfigurationSolution;
import com.appsmith.server.testhelpers.moduleinstances.ModuleInstanceTestHelper;
import com.appsmith.server.testhelpers.moduleinstances.ModuleInstanceTestHelperDTO;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
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
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_MODULE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.constants.FieldName.ANONYMOUS_USER;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
public class ModuleInstanceApplicationShareTest {

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserService userService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    PluginService pluginService;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    EnvironmentService environmentService;

    @Autowired
    UserAndAccessManagementService userAndAccessManagementService;

    @Autowired
    UserWorkspaceService userWorkspaceService;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    RoleConfigurationSolution roleConfigurationSolution;

    @Autowired
    SessionUserService sessionUserService;

    @Autowired
    UserUtils userUtils;

    @Autowired
    DatasourceRepository datasourceRepository;

    @Autowired
    NewPageRepository newPageRepository;

    @Autowired
    ImportApplicationService importApplicationService;

    @Autowired
    ExportApplicationService exportApplicationService;

    @Autowired
    EnvironmentPermission environmentPermission;

    @Autowired
    NewActionService newActionService;

    @Autowired
    ModuleInstanceRepository moduleInstanceRepository;

    @SpyBean
    FeatureFlagService featureFlagService;

    @Autowired
    PagePermission pagePermission;

    @Autowired
    DatasourcePermission datasourcePermission;

    @Autowired
    ApplicationPermission applicationPermission;

    @Autowired
    ModuleInstanceTestHelper moduleInstanceTestHelper;

    ModuleInstanceTestHelperDTO moduleInstanceTestHelperDTO;

    String workspaceId;

    Workspace workspace;
    static Application gitConnectedApp = new Application();

    @BeforeEach
    public void setup() {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_audit_logs_enabled)))
                .thenReturn(Mono.just(FALSE));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.release_datasource_environments_enabled)))
                .thenReturn(Mono.just(FALSE));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_gac_enabled)))
                .thenReturn(Mono.just(TRUE));
        CachedFeatures cachedFeatures = new CachedFeatures();
        cachedFeatures.setFeatures(Map.of(FeatureFlagEnum.license_gac_enabled.name(), TRUE));
        Mockito.when(featureFlagService.getCachedTenantFeatureFlags()).thenReturn(cachedFeatures);
        User apiUser = userService.findByEmail("api_user").block();

        Workspace toCreate = new Workspace();
        toCreate.setName("ModuleInstanceApplicationShareTest");

        workspace = workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        workspaceId = workspace.getId();

        gitConnectedApp = new Application();
        gitConnectedApp.setWorkspaceId(workspaceId);
        GitApplicationMetadata gitData = new GitApplicationMetadata();
        gitData.setBranchName("testBranch");
        gitData.setDefaultBranchName("testBranch");
        gitData.setRepoName("testRepo");
        gitData.setRemoteUrl("git@test.com:user/testRepo.git");
        gitData.setRepoName("testRepo");
        gitConnectedApp.setGitApplicationMetadata(gitData);
        // This will be altered in update app by branch test
        gitConnectedApp.setName("gitConnectedApp");
        gitConnectedApp = applicationPageService
                .createApplication(gitConnectedApp)
                .flatMap(application -> {
                    application.getGitApplicationMetadata().setDefaultApplicationId(application.getId());
                    return applicationService.save(application);
                })
                // Assign the branchName to all the resources connected to the application
                .flatMap(application ->
                        exportApplicationService.exportApplicationById(application.getId(), gitData.getBranchName()))
                .flatMap(applicationJson -> importApplicationService.importApplicationInWorkspaceFromGit(
                        workspaceId, applicationJson, gitConnectedApp.getId(), gitData.getBranchName()))
                .block();

        DefaultResources defaultResources = new DefaultResources();
        defaultResources.setApplicationId(gitConnectedApp.getId());
        PageDTO extraPage = new PageDTO();
        extraPage.setName("extra page - gitConnectedApp");
        extraPage.setApplicationId(gitConnectedApp.getId());
        extraPage.setDefaultResources(defaultResources);
        PageDTO pageDTO = applicationPageService
                .createPageWithBranchName(extraPage, gitData.getBranchName())
                .block();
        gitConnectedApp = applicationService.findById(gitConnectedApp.getId()).block();

        moduleInstanceTestHelperDTO = new ModuleInstanceTestHelperDTO();
        moduleInstanceTestHelperDTO.setWorkspaceName("CRUD_Module_Instance_Workspace");
        moduleInstanceTestHelperDTO.setApplicationName("CRUD_Module_Instance_Application");
        moduleInstanceTestHelperDTO.setWorkspaceId(workspaceId);
        moduleInstanceTestHelperDTO.setPageDTO(pageDTO);
        moduleInstanceTestHelper.createPrerequisites(moduleInstanceTestHelperDTO);

        // Make the api_user super admin
        userUtils.makeSuperUser(List.of(apiUser)).block();
    }

    @AfterEach
    public void cleanup() {
        applicationService
                .findById(moduleInstanceTestHelperDTO.getPageDTO().getApplicationId())
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .block();
        workspaceService
                .archiveById(moduleInstanceTestHelperDTO.getWorkspaceId())
                .block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testMakeApplicationPublic_containingModuleInstance_allowsExecuteAccessForAnonUser() {
        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO =
                moduleInstanceTestHelper.createModuleInstance(moduleInstanceTestHelperDTO);

        // Now make the application public
        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);
        Application publicApp = applicationService
                .changeViewAccess(moduleInstanceTestHelperDTO.getPageDTO().getApplicationId(), applicationAccessDTO)
                .block();

        PermissionGroup permissionGroup =
                permissionGroupService.getPublicPermissionGroup().block();

        String publicPageId = publicApp.getPages().get(0).getId();
        Mono<PageDTO> pageMono = newPageService.findPageById(publicPageId, READ_PAGES, false);

        Mono<ModuleInstance> moduleInstanceMono = moduleInstanceRepository.findById(
                createModuleInstanceResponseDTO.getModuleInstance().getId());

        List<ActionViewDTO> actions =
                createModuleInstanceResponseDTO.getEntities().getActions();
        ActionViewDTO moduleInstancePublicActionViewDTO = actions.get(0);
        Mono<NewAction> actionMono = newActionService.findById(moduleInstancePublicActionViewDTO.getId());

        User anonymousUser = userRepository.findByEmail(ANONYMOUS_USER).block();

        StepVerifier.create(Mono.zip(pageMono, moduleInstanceMono, actionMono))
                .assertNext(tuple -> {
                    PageDTO page = tuple.getT1();
                    ModuleInstance moduleInstance = tuple.getT2();
                    NewAction newAction = tuple.getT3();

                    String permissionGroupId = permissionGroup.getId();

                    assertThat(publicApp.getIsPublic()).isTrue();

                    // Check that application view is allowed for public permission group
                    publicApp.getPolicies().stream()
                            .filter(policy -> policy.getPermission().equals(READ_APPLICATIONS.getValue()))
                            .findFirst()
                            .ifPresent(policy -> {
                                assertThat(policy.getPermissionGroups()).contains(permissionGroupId);
                            });

                    // Check that page view is allowed for public permission group
                    page.getPolicies().stream()
                            .filter(policy -> policy.getPermission().equals(READ_PAGES.getValue()))
                            .findFirst()
                            .ifPresent(policy -> {
                                assertThat(policy.getPermissionGroups()).contains(permissionGroupId);
                            });

                    // Check that datasource execute is allowed for public permission group
                    moduleInstance.getPolicies().stream()
                            .filter(policy -> policy.getPermission().equals(EXECUTE_MODULE_INSTANCES.getValue()))
                            .findFirst()
                            .ifPresent(policy ->
                                    assertThat(policy.getPermissionGroups()).contains(permissionGroupId));

                    // Check that action are executable by permission group
                    newAction.getPolicies().stream()
                            .filter(policy -> EXECUTE_ACTIONS.getValue().equals(policy.getPermission()))
                            .findFirst()
                            .ifPresent(policy ->
                                    assertThat(policy.getPermissionGroups()).contains(permissionGroup.getId()));

                    // Finally assert that permission group has been assigned to anonymous user.
                    assertThat(permissionGroup.getAssignedToUserIds()).hasSize(1);
                    assertThat(permissionGroup.getAssignedToUserIds()).containsAll(Set.of(anonymousUser.getId()));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testMakeApplicationPrivate_containingModuleInstance_revokesExecuteAccessForAnonUser() {
        CreateModuleInstanceResponseDTO createModuleInstanceResponseDTO =
                moduleInstanceTestHelper.createModuleInstance(moduleInstanceTestHelperDTO);

        // Now make the application public
        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);
        Application privateApp = applicationService
                .changeViewAccess(moduleInstanceTestHelperDTO.getPageDTO().getApplicationId(), applicationAccessDTO)
                .flatMap(application1 -> {
                    applicationAccessDTO.setPublicAccess(false);
                    return applicationService.changeViewAccess(application1.getId(), applicationAccessDTO);
                })
                .block();

        PermissionGroup permissionGroup =
                permissionGroupService.getPublicPermissionGroup().block();

        String publicPageId = privateApp.getPages().get(0).getId();
        Mono<PageDTO> pageMono = newPageService.findPageById(publicPageId, READ_PAGES, false);

        Mono<ModuleInstance> moduleInstanceMono = moduleInstanceRepository.findById(
                createModuleInstanceResponseDTO.getModuleInstance().getId());

        List<ActionViewDTO> actions =
                createModuleInstanceResponseDTO.getEntities().getActions();
        ActionViewDTO moduleInstancePublicActionViewDTO = actions.get(0);
        Mono<NewAction> actionMono = newActionService.findById(moduleInstancePublicActionViewDTO.getId());

        StepVerifier.create(Mono.zip(pageMono, moduleInstanceMono, actionMono))
                .assertNext(tuple -> {
                    PageDTO page = tuple.getT1();
                    ModuleInstance moduleInstance = tuple.getT2();
                    NewAction newAction = tuple.getT3();

                    assertThat(privateApp.getIsPublic()).isFalse();

                    // Check that the application view is not allowed for public permission group
                    privateApp.getPolicies().stream()
                            .filter(policy -> policy.getPermission().equals(READ_APPLICATIONS.getValue()))
                            .findFirst()
                            .ifPresent(policy ->
                                    assertThat(policy.getPermissionGroups()).doesNotContain(permissionGroup.getId()));

                    // Check that the page view is not allowed for public permission group
                    page.getPolicies().stream()
                            .filter(policy -> policy.getPermission().equals(READ_PAGES.getValue()))
                            .findFirst()
                            .ifPresent(policy ->
                                    assertThat(policy.getPermissionGroups()).doesNotContain(permissionGroup.getId()));

                    // Check that the datasource is not executable by permission group
                    moduleInstance.getPolicies().stream()
                            .filter(policy -> policy.getPermission().equals(EXECUTE_MODULE_INSTANCES.getValue()))
                            .findFirst()
                            .ifPresent(policy ->
                                    assertThat(policy.getPermissionGroups()).doesNotContain(permissionGroup.getId()));

                    // Check that action are not executable by permission group
                    newAction.getPolicies().stream()
                            .filter(policy -> EXECUTE_ACTIONS.getValue().equals(policy.getPermission()))
                            .findFirst()
                            .ifPresent(policy ->
                                    assertThat(policy.getPermissionGroups()).doesNotContain(permissionGroup.getId()));
                })
                .verifyComplete();
    }
}
