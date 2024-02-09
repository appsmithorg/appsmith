package com.appsmith.server.services.ee;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Environment;
import com.appsmith.external.models.Policy;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.ArtifactJsonType;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.PermissionGroupCompactDTO;
import com.appsmith.server.dtos.UpdateRoleAssociationDTO;
import com.appsmith.server.dtos.UserCompactDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exports.exportable.ExportService;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.imports.importable.ImportService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ApplicationPageService;
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
import com.appsmith.server.solutions.roles.constants.RoleTab;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleConfigDTO;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleEntityDTO;
import lombok.extern.slf4j.Slf4j;
import org.assertj.core.api.Assertions;
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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.EXECUTE_ENVIRONMENTS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.constants.FieldName.ADMINISTRATOR;
import static com.appsmith.server.constants.FieldName.ANONYMOUS_USER;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
public class ApplicationServiceTest {

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
    ImportService importService;

    @Autowired
    ExportService exportService;

    @Autowired
    EnvironmentPermission environmentPermission;

    @Autowired
    NewActionService newActionService;

    @SpyBean
    FeatureFlagService featureFlagService;

    @Autowired
    PagePermission pagePermission;

    @Autowired
    DatasourcePermission datasourcePermission;

    @Autowired
    ApplicationPermission applicationPermission;

    String workspaceId;

    Workspace workspace;

    static Plugin testPlugin = new Plugin();

    static Datasource testDatasource = new Datasource();
    static Datasource testDatasource1 = new Datasource();
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
        toCreate.setName("ApplicationServiceTest");

        workspace = workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        workspaceId = workspace.getId();

        testPlugin = pluginService.findByPackageName("restapi-plugin").block();

        Datasource datasource = new Datasource();
        datasource.setName("ApplicationServiceTest Datasource");
        datasource.setPluginId(testPlugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        datasource.setWorkspaceId(workspaceId);
        String environmentId = workspaceService
                .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                .block();

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(environmentId, new DatasourceStorageDTO(null, environmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);
        testDatasource = datasourceService.create(datasource).block();

        gitConnectedApp = new Application();
        gitConnectedApp.setWorkspaceId(workspaceId);
        GitArtifactMetadata gitData = new GitArtifactMetadata();
        gitData.setBranchName("testBranch");
        gitData.setDefaultBranchName("testBranch");
        gitData.setRepoName("testRepo");
        gitData.setRemoteUrl("git@test.com:user/testRepo.git");
        gitData.setRepoName("testRepo");
        gitConnectedApp.setGitArtifactMetadata(gitData);
        // This will be altered in update app by branch test
        gitConnectedApp.setName("gitConnectedApp");
        gitConnectedApp = applicationPageService
                .createApplication(gitConnectedApp)
                .flatMap(application -> {
                    application.getGitArtifactMetadata().setDefaultApplicationId(application.getId());
                    return applicationService.save(application);
                })
                // Assign the branchName to all the resources connected to the application
                .flatMap(application -> exportService.exportByArtifactIdAndBranchName(
                        application.getId(), gitData.getBranchName(), ArtifactJsonType.APPLICATION))
                .flatMap(applicationJson -> importService.importArtifactInWorkspaceFromGit(
                        workspaceId, gitConnectedApp.getId(), applicationJson, gitData.getBranchName()))
                .map(importableArtifact -> (Application) importableArtifact)
                .block();

        DefaultResources defaultResources = new DefaultResources();
        defaultResources.setApplicationId(gitConnectedApp.getId());
        PageDTO extraPage = new PageDTO();
        extraPage.setName("extra page - gitConnectedApp");
        extraPage.setApplicationId(gitConnectedApp.getId());
        extraPage.setDefaultResources(defaultResources);
        applicationPageService
                .createPageWithBranchName(extraPage, gitData.getBranchName())
                .block();

        Datasource datasource1 = new Datasource();
        datasource1.setName("Clone App with action Test");
        datasource1.setPluginId(testPlugin.getId());
        DatasourceConfiguration datasourceConfiguration1 = new DatasourceConfiguration();
        datasourceConfiguration1.setUrl("http://test.com");
        datasource1.setWorkspaceId(workspaceId);

        HashMap<String, DatasourceStorageDTO> storages1 = new HashMap<>();
        storages1.put(environmentId, new DatasourceStorageDTO(null, environmentId, datasourceConfiguration1));
        datasource1.setDatasourceStorages(storages1);

        testDatasource1 = datasourceService.create(datasource1).block();
        gitConnectedApp = applicationService.findById(gitConnectedApp.getId()).block();

        // Make the api_user super admin
        userUtils.makeSuperUser(List.of(apiUser)).block();
    }

    @AfterEach
    public void cleanup() {
        List<Application> deletedApplications = applicationService
                .findByWorkspaceId(workspaceId, applicationPermission.getDeletePermission())
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .collectList()
                .block();
        Workspace deletedWorkspace = workspaceService.archiveById(workspaceId).block();
    }

    private void leaveWorkspaceToLoseAccess() {

        List<PermissionGroup> permissionGroups = permissionGroupRepository
                .findAllById(workspace.getDefaultPermissionGroups())
                .collectList()
                .block();

        String adminPermissionGroupId = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get()
                .getId();

        // Invite another admin
        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        ArrayList<String> invitedUsers = new ArrayList<>();
        invitedUsers.add("b@usertest.com");
        inviteUsersDTO.setUsernames(invitedUsers);
        inviteUsersDTO.setPermissionGroupId(adminPermissionGroupId);
        userAndAccessManagementService.inviteUsers(inviteUsersDTO, "origin").block();

        // Now leave the workspace
        userWorkspaceService.leaveWorkspace(workspace.getId()).block();
    }

    private void gainAccessToWorkspaceAsAdminWithoutPermission() {
        List<PermissionGroup> permissionGroups = permissionGroupRepository
                .findAllById(workspace.getDefaultPermissionGroups())
                .collectList()
                .block();

        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();

        User sessionUser = sessionUserService.getCurrentUser().block();
        Boolean assignmentComplete = permissionGroupService
                .bulkAssignToUsersWithoutPermission(adminPermissionGroup, List.of(sessionUser))
                .block();
    }

    private void getReadWriteMakePublicAccessToApp(String applicationId, String pageId, String actionId) {
        // Add entity changes
        // Application : Give edit, view and make public permissions
        UpdateRoleEntityDTO applicationEntity = new UpdateRoleEntityDTO(
                Application.class.getSimpleName(), applicationId, List.of(0, 1, 0, 1, -1, 1, 0), "unnecessary name");

        // Page : Give edit and view permissions
        UpdateRoleEntityDTO pageEntity = new UpdateRoleEntityDTO(
                NewPage.class.getSimpleName(), pageId, List.of(0, 1, 0, 1, -1, -1, -1), "unnecessary name");

        // Action : Give edit and view permissions
        UpdateRoleEntityDTO actionEntity = new UpdateRoleEntityDTO(
                NewAction.class.getSimpleName(), actionId, List.of(-1, 1, 0, 1, 1, -1, -1), "unnecessary name");

        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for editing");
        PermissionGroup createdPermissionGroup =
                permissionGroupService.create(permissionGroup).block();

        UpdateRoleConfigDTO updateRoleConfigDTO = new UpdateRoleConfigDTO();

        updateRoleConfigDTO.setTabName(RoleTab.APPLICATION_RESOURCES.getName());
        updateRoleConfigDTO.setEntitiesChanged(Set.of(applicationEntity, pageEntity, actionEntity));

        roleConfigurationSolution
                .updateRoles(createdPermissionGroup.getId(), updateRoleConfigDTO)
                .block();

        // Now assign the created permission group to the current user
        User testUser = sessionUserService
                .getCurrentUser()
                .flatMap(user -> userRepository.findByEmail(user.getEmail()))
                .block();

        UserCompactDTO userCompactDTO = new UserCompactDTO();
        userCompactDTO.setId(testUser.getId());
        userCompactDTO.setUsername(testUser.getUsername());
        userCompactDTO.setName(testUser.getName());
        PermissionGroupCompactDTO permissionGroupCompactDTO1 = new PermissionGroupCompactDTO();
        permissionGroupCompactDTO1.setId(createdPermissionGroup.getId());
        permissionGroupCompactDTO1.setName(createdPermissionGroup.getName());
        UpdateRoleAssociationDTO updateRoleAssociationDTO = new UpdateRoleAssociationDTO();
        updateRoleAssociationDTO.setUsers(Set.of(userCompactDTO));
        updateRoleAssociationDTO.setGroups(Set.of());
        updateRoleAssociationDTO.setRolesAdded(Set.of(permissionGroupCompactDTO1));

        // Assign the permission group to the user
        userAndAccessManagementService
                .changeRoleAssociations(updateRoleAssociationDTO, "originHeader")
                .block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validMakeApplicationPublic() {
        Application application = new Application();
        application.setName("validMakeApplicationPublic-Test");

        Application createdApplication = applicationPageService
                .createApplication(application, workspaceId)
                .block();

        String pageId = createdApplication.getPages().get(0).getId();

        ActionDTO action = new ActionDTO();
        action.setName("validAction");
        action.setPageId(pageId);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(testDatasource);
        action.setApplicationId(createdApplication.getId());

        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, FALSE).block();

        // Now lose the access to the workspace and get individual access to the application
        leaveWorkspaceToLoseAccess();
        getReadWriteMakePublicAccessToApp(createdApplication.getId(), pageId, createdAction.getId());

        // Now make the application public
        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);
        Mono<Application> publicAppMono = applicationService
                .changeViewAccess(createdApplication.getId(), applicationAccessDTO)
                .cache();

        PermissionGroup permissionGroup =
                permissionGroupService.getPublicPermissionGroup().block();

        Mono<PageDTO> pageMono = publicAppMono.flatMap(app -> {
            String publicPageId = app.getPages().get(0).getId();
            return newPageService.findPageById(publicPageId, READ_PAGES, false);
        });

        Mono<Datasource> datasourceMono =
                publicAppMono.flatMap(app -> datasourceService.findById(testDatasource.getId()));

        Mono<NewAction> actionMono =
                publicAppMono.flatMap(app -> newActionService.findById(createdAction.getId(), EXECUTE_ACTIONS));

        Mono<List<Environment>> environmentListMono = publicAppMono
                .thenMany(environmentService.findByWorkspaceId(workspaceId))
                .collectList();

        User anonymousUser = userRepository.findByEmail(ANONYMOUS_USER).block();

        StepVerifier.create(Mono.zip(publicAppMono, pageMono, datasourceMono, environmentListMono, actionMono))
                .assertNext(tuple -> {
                    Application publicApp = tuple.getT1();
                    PageDTO page = tuple.getT2();
                    Datasource datasource = tuple.getT3();
                    List<Environment> environmentList = tuple.getT4();
                    NewAction newAction = tuple.getT5();

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
                    datasource.getPolicies().stream()
                            .filter(policy -> policy.getPermission().equals(EXECUTE_DATASOURCES.getValue()))
                            .findFirst()
                            .ifPresent(policy ->
                                    assertThat(policy.getPermissionGroups()).contains(permissionGroupId));

                    // Check that environment execute is allowed for public permission group
                    environmentList.stream().forEach(environment -> {
                        Optional<Policy> policyOptional = environment.getPolicies().stream()
                                .filter(policy -> policy.getPermission().equals(EXECUTE_ENVIRONMENTS.getValue()))
                                .findFirst();

                        assertThat(policyOptional.isPresent()).isTrue();

                        Policy policy = policyOptional.get();

                        if (TRUE.equals(environment.getIsDefault())) {
                            assertThat(policy.getPermissionGroups()).contains(permissionGroup.getId());
                        } else {
                            assertThat(policy.getPermissionGroups()).doesNotContain(permissionGroup.getId());
                        }
                    });

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

        // Join workspace again as an admin.
        // This will be done without permissions.
        gainAccessToWorkspaceAsAdminWithoutPermission();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validMakeApplicationPrivate() {
        Application application = new Application();
        application.setName("validMakeApplicationPrivate-Test");

        Application createdApplication = applicationPageService
                .createApplication(application, workspaceId)
                .block();

        String pageId = createdApplication.getPages().get(0).getId();

        ActionDTO action = new ActionDTO();
        action.setName("validAction");
        action.setPageId(pageId);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(testDatasource);

        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, FALSE).block();

        // Now lose the access to the workspace and get individual access to the application
        leaveWorkspaceToLoseAccess();
        getReadWriteMakePublicAccessToApp(createdApplication.getId(), pageId, createdAction.getId());

        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        Mono<Application> privateAppMono = Mono.just(createdApplication)
                .flatMap(application1 -> {
                    applicationAccessDTO.setPublicAccess(true);
                    return applicationService.changeViewAccess(application1.getId(), applicationAccessDTO);
                })
                .flatMap(application1 -> {
                    applicationAccessDTO.setPublicAccess(false);
                    return applicationService.changeViewAccess(application1.getId(), applicationAccessDTO);
                })
                .cache();

        Mono<PageDTO> pageMono = privateAppMono.flatMap(app -> {
            String privatePage = app.getPages().get(0).getId();
            return newPageService.findPageById(privatePage, READ_PAGES, false);
        });

        Mono<NewAction> actionMono =
                privateAppMono.flatMap(app -> newActionService.findById(createdAction.getId(), EXECUTE_ACTIONS));

        Mono<Datasource> datasourceMono =
                privateAppMono.flatMap(app -> datasourceService.findById(testDatasource.getId()));

        Mono<List<Environment>> environmentListMono = privateAppMono
                .thenMany(environmentService.findByWorkspaceId(workspaceId))
                .collectList();

        PermissionGroup permissionGroup =
                permissionGroupService.getPublicPermissionGroup().block();

        StepVerifier.create(Mono.zip(privateAppMono, pageMono, datasourceMono, environmentListMono, actionMono))
                .assertNext(tuple -> {
                    Application app = tuple.getT1();
                    PageDTO page = tuple.getT2();
                    Datasource datasource = tuple.getT3();
                    List<Environment> environmentList = tuple.getT4();
                    NewAction newAction = tuple.getT5();

                    assertThat(app.getIsPublic()).isFalse();

                    // Check that the application view is not allowed for public permission group
                    app.getPolicies().stream()
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
                    datasource.getPolicies().stream()
                            .filter(policy -> policy.getPermission().equals(EXECUTE_DATASOURCES.getValue()))
                            .findFirst()
                            .ifPresent(policy ->
                                    assertThat(policy.getPermissionGroups()).doesNotContain(permissionGroup.getId()));

                    // Check that environments are not executable by permission group
                    environmentList.stream().forEach(environment -> {
                        environment.getPolicies().stream()
                                .filter(policy -> policy.getPermission().equals(EXECUTE_ENVIRONMENTS.getValue()))
                                .findFirst()
                                .ifPresent(policy -> assertThat(policy.getPermissionGroups())
                                        .doesNotContain(permissionGroup.getId()));
                    });

                    // Check that action are not executable by permission group
                    newAction.getPolicies().stream()
                            .filter(policy -> EXECUTE_ACTIONS.getValue().equals(policy.getPermission()))
                            .findFirst()
                            .ifPresent(policy ->
                                    assertThat(policy.getPermissionGroups()).doesNotContain(permissionGroup.getId()));
                })
                .verifyComplete();

        // Join workspace again as an admin.
        // This will be done without permissions.
        gainAccessToWorkspaceAsAdminWithoutPermission();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void publishApplication_noPageEditPermissions() {
        String gitAppPageId = gitConnectedApp.getPages().get(1).getId();
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
        StepVerifier.create(applicationPageService.publish(gitConnectedApp.getId(), null, true))
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
        String gitAppPageId = gitConnectedApp.getPages().get(1).getId();
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
        StepVerifier.create(applicationPageService.cloneApplication(gitConnectedApp.getId(), null))
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
        String gitAppPageId = gitConnectedApp.getPages().get(1).getId();
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
                layoutActionService.createSingleAction(action, FALSE).block();

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
        StepVerifier.create(applicationPageService.cloneApplication(gitConnectedApp.getId(), null))
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
        layoutActionService.createSingleAction(action, FALSE).block();

        // Check environment before making app public
        PermissionGroup publicPermissionGroup =
                permissionGroupService.getPublicPermissionGroup().block();

        Environment environmentBeforePublicShare =
                workspaceService.getDefaultEnvironment(workspaceId).blockFirst();

        Optional<Policy> policyBeforeOptional = environmentBeforePublicShare.getPolicies().stream()
                .filter(policy -> EXECUTE_ENVIRONMENTS.getValue().equals(policy.getPermission()))
                .findFirst();

        Assertions.assertThat(policyBeforeOptional.isPresent()).isTrue();
        Assertions.assertThat(policyBeforeOptional.get().getPermissionGroups())
                .doesNotContain(publicPermissionGroup.getId());

        // Make first application public
        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);
        applicationService
                .changeViewAccess(createdApplication.getId(), applicationAccessDTO)
                .block();

        Environment environmentAfterPublicShare =
                workspaceService.getDefaultEnvironment(workspaceId).blockFirst();

        Optional<Policy> policyAfterOptional = environmentAfterPublicShare.getPolicies().stream()
                .filter(policy -> EXECUTE_ENVIRONMENTS.getValue().equals(policy.getPermission()))
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
        layoutActionService.createSingleAction(action2, FALSE).block();

        // Make second application public
        ApplicationAccessDTO applicationAccessDTO2 = new ApplicationAccessDTO();
        applicationAccessDTO2.setPublicAccess(true);
        applicationService
                .changeViewAccess(createdApplication2.getId(), applicationAccessDTO2)
                .block();

        // Now revoke public access from first app
        applicationAccessDTO.setPublicAccess(false);
        applicationService
                .changeViewAccess(createdApplication.getId(), applicationAccessDTO)
                .block();

        // Check that environment still has execute access
        Environment environmentAfterRevokeOnePublicShare =
                workspaceService.getDefaultEnvironment(workspaceId).blockFirst();

        Optional<Policy> policyAfterRevokeOneOptional = environmentAfterRevokeOnePublicShare.getPolicies().stream()
                .filter(policy -> EXECUTE_ENVIRONMENTS.getValue().equals(policy.getPermission()))
                .findFirst();

        Assertions.assertThat(policyAfterRevokeOneOptional.isPresent()).isTrue();
        Assertions.assertThat(policyAfterRevokeOneOptional.get().getPermissionGroups())
                .contains(publicPermissionGroup.getId());

        // Now revoke public access from second app
        applicationAccessDTO2.setPublicAccess(false);
        applicationService
                .changeViewAccess(createdApplication2.getId(), applicationAccessDTO2)
                .block();

        // Check that environment now does NOT have execute access
        Environment environmentAfterRevokeAllPublicShare =
                workspaceService.getDefaultEnvironment(workspaceId).blockFirst();

        Optional<Policy> policyAfterRevokeAllOptional = environmentAfterRevokeAllPublicShare.getPolicies().stream()
                .filter(policy -> EXECUTE_ENVIRONMENTS.getValue().equals(policy.getPermission()))
                .findFirst();

        Assertions.assertThat(policyAfterRevokeAllOptional.isPresent()).isTrue();
        Assertions.assertThat(policyAfterRevokeAllOptional.get().getPermissionGroups())
                .doesNotContain(publicPermissionGroup.getId());
    }
}
