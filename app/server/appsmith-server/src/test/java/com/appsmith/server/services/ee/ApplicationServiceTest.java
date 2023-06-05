package com.appsmith.server.services.ee;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
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
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.UserWorkspaceService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ImportExportApplicationService;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import com.appsmith.server.solutions.roles.RoleConfigurationSolution;
import com.appsmith.server.solutions.roles.constants.RoleTab;
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
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.CREATE_DATASOURCE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.constants.FieldName.ADMINISTRATOR;
import static com.appsmith.server.constants.FieldName.ANONYMOUS_USER;
import static org.assertj.core.api.Assertions.assertThat;

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
    ImportExportApplicationService importExportApplicationService;

    String workspaceId;

    Workspace workspace;

    static Plugin testPlugin = new Plugin();

    static Datasource testDatasource = new Datasource();
    static Datasource testDatasource1 = new Datasource();
    static Application gitConnectedApp = new Application();

    @BeforeEach
    @WithUserDetails(value = "api_user")
    public void setup() {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));
        User apiUser = userService.findByEmail("api_user").block();

        Workspace toCreate = new Workspace();
        toCreate.setName("ApplicationServiceTest");

        if (workspaceId == null || workspace == null) {

            workspace = workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            workspaceId = workspace.getId();

            testPlugin = pluginService.findByPackageName("restapi-plugin").block();

            Datasource datasource = new Datasource();
            datasource.setName("ApplicationServiceTest Datasource");
            datasource.setPluginId(testPlugin.getId());
            DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
            datasourceConfiguration.setUrl("http://test.com");
            datasource.setDatasourceConfiguration(datasourceConfiguration);
            datasource.setWorkspaceId(workspaceId);
            String environmentId = workspaceService.getDefaultEnvironmentId(workspaceId).block();
            DatasourceStorage datasourceStorage = new DatasourceStorage(datasource, environmentId);
            HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
            storages.put(environmentId, new DatasourceStorageDTO(datasourceStorage));
            datasource.setDatasourceStorages(storages);
            testDatasource = datasourceService.create(datasource).block();

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
            gitConnectedApp = applicationPageService.createApplication(gitConnectedApp)
                    .flatMap(application -> {
                        application.getGitApplicationMetadata().setDefaultApplicationId(application.getId());
                        return applicationService.save(application);
                    })
                    // Assign the branchName to all the resources connected to the application
                    .flatMap(application -> importExportApplicationService.exportApplicationById(application.getId(), gitData.getBranchName()))
                    .flatMap(applicationJson -> importExportApplicationService.importApplicationInWorkspace(workspaceId, applicationJson, gitConnectedApp.getId(), gitData.getBranchName()))
                    .block();

            DefaultResources defaultResources = new DefaultResources();
            defaultResources.setApplicationId(gitConnectedApp.getId());
            PageDTO extraPage = new PageDTO();
            extraPage.setName("extra page - gitConnectedApp");
            extraPage.setApplicationId(gitConnectedApp.getId());
            extraPage.setDefaultResources(defaultResources);
            applicationPageService.createPageWithBranchName(extraPage, gitData.getBranchName()).block();

            Datasource datasource1 = new Datasource();
            datasource1.setName("Clone App with action Test");
            datasource1.setPluginId(testPlugin.getId());
            DatasourceConfiguration datasourceConfiguration1 = new DatasourceConfiguration();
            datasourceConfiguration1.setUrl("http://test.com");
            datasource1.setDatasourceConfiguration(datasourceConfiguration);
            datasource1.setWorkspaceId(workspaceId);

            DatasourceStorage datasourceStorage1 = new DatasourceStorage(datasource1, environmentId);
            HashMap<String, DatasourceStorageDTO> storages1 = new HashMap<>();
            storages1.put(environmentId, new DatasourceStorageDTO(datasourceStorage1));
            datasource1.setDatasourceStorages(storages1);

            testDatasource1 = datasourceService.create(datasource1).block();
            gitConnectedApp = applicationService.findById(gitConnectedApp.getId()).block();

        }

        // Make the api_user super admin
        userUtils.makeSuperUser(List.of(apiUser)).block();
    }

    private void leaveWorkspaceToLoseAccess() {

        List<PermissionGroup> permissionGroups = permissionGroupRepository
                .findAllById(workspace.getDefaultPermissionGroups()).collectList().block();

        String adminPermissionGroupId = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst().get()
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

    private void getReadWriteMakePublicAccessToApp(String applicationId, String pageId, String actionId) {
        // Add entity changes
        // Application : Give edit, view and make public permissions
        UpdateRoleEntityDTO applicationEntity = new UpdateRoleEntityDTO(
                Application.class.getSimpleName(),
                applicationId,
                List.of(0, 1, 0, 1, 1, 0),
                "unnecessary name"
        );

        // Page : Give edit and view permissions
        UpdateRoleEntityDTO pageEntity = new UpdateRoleEntityDTO(
                NewPage.class.getSimpleName(),
                pageId,
                List.of(0, 1, 0, 1, -1, -1),
                "unnecessary name"
        );

        // Action : Give edit and view permissions
        UpdateRoleEntityDTO actionEntity = new UpdateRoleEntityDTO(
                NewAction.class.getSimpleName(),
                actionId,
                List.of(-1, 1, 0, 1, -1, -1),
                "unnecessary name"
        );

        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for editing");
        PermissionGroup createdPermissionGroup = permissionGroupService.create(permissionGroup).block();

        UpdateRoleConfigDTO updateRoleConfigDTO = new UpdateRoleConfigDTO();

        updateRoleConfigDTO.setTabName(RoleTab.APPLICATION_RESOURCES.getName());
        updateRoleConfigDTO.setEntitiesChanged(Set.of(applicationEntity, pageEntity, actionEntity));

        roleConfigurationSolution.updateRoles(createdPermissionGroup.getId(), updateRoleConfigDTO).block();

        // Now assign the created permission group to the current user
        User testUser = sessionUserService.getCurrentUser()
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
        userAndAccessManagementService.changeRoleAssociations(updateRoleAssociationDTO)
                .block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validMakeApplicationPublic() {
        Application application = new Application();
        application.setName("validMakeApplicationPublic-Test");

        Application createdApplication = applicationPageService.createApplication(application, workspaceId).block();

        String pageId = createdApplication.getPages().get(0).getId();

        ActionDTO action = new ActionDTO();
        action.setName("validAction");
        action.setPageId(pageId);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(testDatasource);

        ActionDTO createdAction = layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        // Now lose the access to the workspace and get individual access to the application
        leaveWorkspaceToLoseAccess();
        getReadWriteMakePublicAccessToApp(createdApplication.getId(), pageId, createdAction.getId());

        // Now make the application public
        ApplicationAccessDTO applicationAccessDTO = new ApplicationAccessDTO();
        applicationAccessDTO.setPublicAccess(true);
        Mono<Application> publicAppMono = applicationService
                .changeViewAccess(createdApplication.getId(), applicationAccessDTO)
                .cache();

        Mono<PageDTO> pageMono = publicAppMono
                .flatMap(app -> {
                    String publicPageId = app.getPages().get(0).getId();
                    return newPageService.findPageById(publicPageId, READ_PAGES, false);
                });

        Mono<PermissionGroup> publicPermissionGroupMono = permissionGroupService.getPublicPermissionGroup();
        Mono<Datasource> datasourceMono = publicAppMono
                .flatMap(app -> datasourceService.findById(testDatasource.getId()));

        User anonymousUser = userRepository.findByEmail(ANONYMOUS_USER).block();

        StepVerifier
                .create(Mono.zip(publicAppMono, pageMono, publicPermissionGroupMono, datasourceMono))
                .assertNext(tuple -> {
                    Application publicApp = tuple.getT1();
                    PageDTO page = tuple.getT2();
                    PermissionGroup permissionGroup = tuple.getT3();
                    Datasource datasource = tuple.getT4();

                    String permissionGroupId = permissionGroup.getId();

                    assertThat(publicApp.getIsPublic()).isTrue();

                    // Check that application view is allowed for public permission group
                    publicApp.getPolicies()
                            .stream()
                            .filter(policy -> policy.getPermission().equals(READ_APPLICATIONS.getValue()))
                            .findFirst()
                            .ifPresent(policy -> {
                                assertThat(policy.getPermissionGroups()).contains(permissionGroupId);
                            });

                    // Check that page view is allowed for public permission group
                    page.getPolicies()
                            .stream()
                            .filter(policy -> policy.getPermission().equals(READ_PAGES.getValue()))
                            .findFirst()
                            .ifPresent(policy -> {
                                assertThat(policy.getPermissionGroups()).contains(permissionGroupId);
                            });

                    // Check that datasource execute is allowed for public permission group
                    datasource.getPolicies()
                            .stream()
                            .filter(policy -> policy.getPermission().equals(EXECUTE_DATASOURCES.getValue()))
                            .findFirst()
                            .ifPresent(policy ->
                                    assertThat(policy.getPermissionGroups())
                                            .contains(permissionGroupId)
                            );

                    // Finally assert that permission group has been assigned to anonymous user.
                    assertThat(permissionGroup.getAssignedToUserIds()).hasSize(1);
                    assertThat(permissionGroup.getAssignedToUserIds()).containsAll(Set.of(anonymousUser.getId()));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validMakeApplicationPrivate() {
        Application application = new Application();
        application.setName("validMakeApplicationPrivate-Test");

        Application createdApplication = applicationPageService.createApplication(application, workspaceId).block();

        String pageId = createdApplication.getPages().get(0).getId();

        ActionDTO action = new ActionDTO();
        action.setName("validAction");
        action.setPageId(pageId);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(testDatasource);

        ActionDTO createdAction = layoutActionService.createSingleAction(action, Boolean.FALSE).block();

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

        Mono<PageDTO> pageMono = privateAppMono
                .flatMap(app -> {
                    String privatePage = app.getPages().get(0).getId();
                    return newPageService.findPageById(privatePage, READ_PAGES, false);
                });

        Mono<Datasource> datasourceMono = privateAppMono
                .flatMap(app -> datasourceService.findById(testDatasource.getId()));

        Mono<PermissionGroup> publicPermissionGroupMono = permissionGroupService.getPublicPermissionGroup();

        StepVerifier
                .create(Mono.zip(privateAppMono, pageMono, datasourceMono, publicPermissionGroupMono))
                .assertNext(tuple -> {
                    Application app = tuple.getT1();
                    PageDTO page = tuple.getT2();
                    Datasource datasource = tuple.getT3();
                    PermissionGroup publicPermissionGroup = tuple.getT4();

                    assertThat(app.getIsPublic()).isFalse();

                    // Check that the application view is not allowed for public permission group
                    app.getPolicies()
                            .stream()
                            .filter(policy -> policy.getPermission().equals(READ_APPLICATIONS.getValue()))
                            .findFirst()
                            .ifPresent(policy ->
                                    assertThat(policy.getPermissionGroups())
                                            .doesNotContain(publicPermissionGroup.getId())
                            );

                    // Check that the page view is not allowed for public permission group
                    page.getPolicies()
                            .stream()
                            .filter(policy -> policy.getPermission().equals(READ_PAGES.getValue()))
                            .findFirst()
                            .ifPresent(policy ->
                                    assertThat(policy.getPermissionGroups())
                                            .doesNotContain(publicPermissionGroup.getId())
                            );

                    // Check that the datasource is not executable by permission group
                    // Check that datasource execute is allowed for public permission group
                    datasource.getPolicies()
                            .stream()
                            .filter(policy -> policy.getPermission().equals(EXECUTE_DATASOURCES.getValue()))
                            .findFirst()
                            .ifPresent(policy ->
                                    assertThat(policy.getPermissionGroups())
                                            .doesNotContain(publicPermissionGroup.getId())
                            );
                })
                .verifyComplete();
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
                .filter(policy -> !policy.getPermission().equals(MANAGE_PAGES.getValue()))
                .collect(Collectors.toSet());
        gitAppPage.setPolicies(newPoliciesWithoutEdit);
        NewPage updatedGitAppPage = newPageRepository.save(gitAppPage).block();
        StepVerifier.create(applicationPageService.publish(gitConnectedApp.getId(), null, true))
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.UNABLE_TO_DEPLOY_MISSING_PERMISSION
                                .getMessage("page", gitAppPageId)))
                .verify();
        updatedGitAppPage.setPolicies(existingPolicies);
        NewPage setPoliciesBack = newPageRepository.save(updatedGitAppPage).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneApplication_noPageEditPermissions() {
        int existingApplicationCount = applicationService.findAllApplicationsByWorkspaceId(workspaceId).collectList().block().size();
        String gitAppPageId = gitConnectedApp.getPages().get(1).getId();
        NewPage gitAppPage = newPageRepository.findById(gitAppPageId).block();
        Set<Policy> existingPolicies = gitAppPage.getPolicies();
        /*
         * Git connected application has 2 pages.
         * We take away all Manage Page permissions for 2nd page.
         * Now since, no one has the permissions to Edit the 2nd page, the application cloning will fail.
         */
        Set<Policy> newPoliciesWithoutEdit = existingPolicies.stream()
                .filter(policy -> !policy.getPermission().equals(MANAGE_PAGES.getValue()))
                .collect(Collectors.toSet());
        gitAppPage.setPolicies(newPoliciesWithoutEdit);
        NewPage updatedGitAppPage = newPageRepository.save(gitAppPage).block();
        StepVerifier.create(applicationPageService.cloneApplication(gitConnectedApp.getId(), null))
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.APPLICATION_NOT_CLONED_MISSING_PERMISSIONS
                                .getMessage("page", gitAppPageId)))
                .verify();
        updatedGitAppPage.setPolicies(existingPolicies);
        NewPage setPoliciesBack = newPageRepository.save(updatedGitAppPage).block();

        Mono<List<Application>> applicationsInWorkspace = applicationService.findAllApplicationsByWorkspaceId(workspaceId).collectList();
        /*
         * Check that no applications have been created in the Target Workspace
         * This can be checked by comparing it with the existing count of applications in the Workspace.
         */
        StepVerifier.create(applicationsInWorkspace).assertNext(applications -> assertThat(applications).hasSize(existingApplicationCount));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void cloneApplication_noDatasourceCreateActionPermissions() {
        String gitAppPageId = gitConnectedApp.getPages().get(1).getId();
        int existingApplicationCount = applicationService.findAllApplicationsByWorkspaceId(workspaceId).collectList().block().size();

        ActionDTO action = new ActionDTO();
        action.setName("validAction");
        action.setPageId(gitAppPageId);
        action.setExecuteOnLoad(true);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(testDatasource1);
        ActionDTO createdAction = layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        Set<Policy> existingPolicies = testDatasource1.getPolicies();
        /*
         * The created Workspace has a Datasource. And we will remove the Create Datasource Action permisison.
         */
        Set<Policy> newPoliciesWithoutEdit = existingPolicies.stream()
                .filter(policy -> !policy.getPermission().equals(CREATE_DATASOURCE_ACTIONS.getValue()))
                .collect(Collectors.toSet());
        testDatasource1.setPolicies(newPoliciesWithoutEdit);
        Datasource updatedTestDatasource = datasourceRepository.save(testDatasource1).block();
        StepVerifier.create(applicationPageService.cloneApplication(gitConnectedApp.getId(), null))
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.APPLICATION_NOT_CLONED_MISSING_PERMISSIONS
                                .getMessage("datasource", testDatasource1.getId())))
                .verify();
        updatedTestDatasource.setPolicies(existingPolicies);
        Datasource setPoliciesBack = datasourceRepository.save(updatedTestDatasource).block();

        ActionDTO deletedAction = layoutActionService.deleteUnpublishedAction(createdAction.getId()).block();

        Mono<List<Application>> applicationsInWorkspace = applicationService.findAllApplicationsByWorkspaceId(workspaceId).collectList();
        /*
         * Check that no applications have been created in the Target Workspace
         * This can be checked by comparing it with the existing count of applications in the Workspace.
         */
        StepVerifier.create(applicationsInWorkspace).assertNext(applications -> assertThat(applications).hasSize(existingApplicationCount));
    }

}
