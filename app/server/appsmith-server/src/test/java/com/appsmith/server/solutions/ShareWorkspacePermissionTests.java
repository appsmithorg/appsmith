package com.appsmith.server.solutions;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Policy;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.UserGroupInfoDTO;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import lombok.extern.slf4j.Slf4j;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MAKE_PUBLIC_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_INVITE_USERS;
import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class ShareWorkspacePermissionTests {
    @Autowired
    UserService userService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    UserSignup userSignup;

    @Autowired
    PluginService pluginService;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    NewActionService newActionService;

    @Autowired
    ApplicationRepository applicationRepository;

    @Autowired
    NewPageService newPageService;

    @Autowired
    LayoutActionService layoutActionService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    Application savedApplication;

    String workspaceId;

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        Workspace workspace = new Workspace();
        workspace.setName("Share Test Workspace");
        Workspace savedWorkspace = workspaceService.create(workspace).block();
        workspaceId = savedWorkspace.getId();

        Application application = new Application();
        application.setName("Share Test Application");
        application.setWorkspaceId(workspaceId);
        savedApplication = applicationPageService.createApplication(application, workspaceId).block();

        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        ArrayList<String> emails = new ArrayList<>();

//        UserGroup adminUserGroup = userGroupService.getDefaultUserGroups(savedWorkspace.getId())
//                .collectList().block()
//                .stream()
//                .filter(userGroup1 -> userGroup1.getName().startsWith(FieldName.ADMINISTRATOR))
//                .findFirst().get();
//
//        UserGroup developerUserGroup = userGroupService.getDefaultUserGroups(savedWorkspace.getId())
//                .collectList().block()
//                .stream()
//                .filter(userGroup1 -> userGroup1.getName().startsWith(FieldName.DEVELOPER))
//                .findFirst().get();
//
//        // Invite Admin
//        emails.add("admin@solutiontest.com");
//        inviteUsersDTO.setUsernames(emails);
//        inviteUsersDTO.setUserGroupId(adminUserGroup.getId());
//        userService.inviteUsers(inviteUsersDTO, "http://localhost:8080").block();
//
//        emails.clear();
//
//        // Invite Developer
//        emails.add("developer@solutiontest.com");
//        inviteUsersDTO.setUsernames(emails);
//        inviteUsersDTO.setUserGroupId(developerUserGroup.getId());
//        userService.inviteUsers(inviteUsersDTO, "http://localhost:8080").block();
    }

    @Test
    @WithUserDetails(value = "admin@solutiontest.com")
    public void testAdminPermissionsForInviteAndMakePublic() {
        Policy inviteUserPolicy = Policy.builder().permission(WORKSPACE_INVITE_USERS.getValue())
                .users(Set.of("admin@solutiontest.com", "developer@solutiontest.com"))
                .build();

        Policy makePublicApp = Policy.builder().permission(MAKE_PUBLIC_APPLICATIONS.getValue())
                .users(Set.of("admin@solutiontest.com"))
                .build();

        Mono<Application> applicationMono = applicationService.findById(savedApplication.getId());
        Mono<Workspace> workspaceMono = workspaceService.findById(workspaceId, READ_WORKSPACES);

        StepVerifier.create(Mono.zip(applicationMono, workspaceMono))
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    Workspace workspace = tuple.getT2();

                    assertThat(application.getPolicies()).contains(makePublicApp);
                    assertThat(workspace.getPolicies()).contains(inviteUserPolicy);
                })
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "admin@solutiontest.com")
    public void testAdminInviteRoles() {

        Mono<List<UserGroupInfoDTO>> userRolesForWorkspace = workspaceService.getUserGroupsForWorkspace(workspaceId);

        StepVerifier.create(userRolesForWorkspace)
                .assertNext(userGroupInfos -> {
                    assertThat(userGroupInfos).isNotEmpty();
                    assertThat(userGroupInfos).anyMatch(userGroupInfo -> userGroupInfo.getName().startsWith(FieldName.ADMINISTRATOR));
                    assertThat(userGroupInfos).anyMatch(userGroupInfo -> userGroupInfo.getName().startsWith(FieldName.VIEWER));
                    assertThat(userGroupInfos).anyMatch(userGroupInfo -> userGroupInfo.getName().startsWith(FieldName.DEVELOPER));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "developer@solutiontest.com")
    public void testDevPermissionsForInvite() {
        Policy inviteUserPolicy = Policy.builder().permission(WORKSPACE_INVITE_USERS.getValue())
                .users(Set.of("admin@solutiontest.com", "developer@solutiontest.com"))
                .build();

        Mono<Workspace> workspaceMono = workspaceService.findById(workspaceId, READ_WORKSPACES);

        StepVerifier.create(workspaceMono)
                .assertNext(workspace -> {
                    assertThat(workspace.getPolicies()).contains(inviteUserPolicy);
                })
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "developer@solutiontest.com")
    public void testDeveloperInviteRoles() {

        Mono<List<UserGroupInfoDTO>> userRolesForWorkspace = workspaceService.getUserGroupsForWorkspace(workspaceId);

        StepVerifier.create(userRolesForWorkspace)
                .assertNext(userGroupInfos -> {
                    assertThat(userGroupInfos).isNotEmpty();
                    assertThat(userGroupInfos).noneMatch(userGroupInfo -> userGroupInfo.getName().startsWith(FieldName.ADMINISTRATOR));
                    assertThat(userGroupInfos).anyMatch(userGroupInfo -> userGroupInfo.getName().startsWith(FieldName.VIEWER));
                    assertThat(userGroupInfos).anyMatch(userGroupInfo -> userGroupInfo.getName().startsWith(FieldName.DEVELOPER));
                })
                .verifyComplete();
    }


    @Test
    @WithUserDetails(value = "api_user")
    public void validInviteUserWhenCancelledMidWay() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Workspace workspace = new Workspace();
        workspace.setName("Workspace for Invite Cancellation Test");
        Workspace savedWorkspace = workspaceService.create(workspace).block();

        Application application = new Application();
        application.setName("Application for Invite Cancellation Test");
        application.setWorkspaceId(savedWorkspace.getId());
        savedApplication = applicationPageService.createApplication(application, savedWorkspace.getId()).block();

        String pageId = savedApplication.getPages().get(0).getId();

        Plugin plugin = pluginService.findByName("Installed Plugin Name").block();
        Datasource datasource = new Datasource();
        datasource.setName("Invite Cancellation Test");
        datasource.setPluginId(plugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        datasource.setWorkspaceId(savedWorkspace.getId());

        Datasource savedDatasource = datasourceService.create(datasource).block();

        ActionDTO action1 = new ActionDTO();
        action1.setName("Invite Cancellation Testaction1");
        action1.setPageId(pageId);
        action1.setDatasource(savedDatasource);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action1.setActionConfiguration(actionConfiguration);

        ActionDTO savedAction1 = layoutActionService.createSingleAction(action1).block();

        ActionDTO action2 = new ActionDTO();
        action2.setName("Invite Cancellation Test action2");
        action2.setPageId(pageId);
        action2.setDatasource(savedDatasource);
        action2.setActionConfiguration(actionConfiguration);

        ActionDTO savedAction2 = layoutActionService.createSingleAction(action2).block();

        ActionDTO action3 = new ActionDTO();
        action3.setName("Invite Cancellation Test action3");
        action3.setPageId(pageId);
        action3.setDatasource(savedDatasource);
        action3.setActionConfiguration(actionConfiguration);

        ActionDTO savedAction3 = layoutActionService.createSingleAction(action3).block();

//        UserGroup adminUserGroup = userGroupService.getDefaultUserGroups(savedWorkspace.getId())
//                .collectList().block()
//                .stream()
//                .filter(userGroup1 -> userGroup1.getName().startsWith(FieldName.ADMINISTRATOR))
//                .findFirst().get();
//
//        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
//        ArrayList<String> emails = new ArrayList<>();
//
//        // Test invite
//        String email = "inviteCancellationTestEmail@solutionText.com";
//        emails.add(email);
//        inviteUsersDTO.setUsernames(emails);
//        inviteUsersDTO.setUserGroupId(adminUserGroup.getId());
//
//        // Now trigger the invite flow and cancel it almost immediately!
//        // NOTE : This is the main test flow. Invite would be triggered and is expected now to run
//        // to completion even though its timing out in 5 milli seconds.
//        userService.inviteUsers(inviteUsersDTO, "http://localhost:8080")
//                .timeout(Duration.ofMillis(5))
//                .subscribe();
//
//        // Before fetching any objects from the database, to avoid flaky tests, first sleep for 10 seconds. This
//        // ensures that we are guaranteed that the invite flow (which was cancelled in 5 ms) has run to completion
//        // before we fetch the org, app, pages and actions
//        Mono<Workspace> workspaceMono = Mono.just(savedWorkspace.getId())
//                .flatMap(workspaceId -> {
//                    try {
//                        // Before fetching the updated organzation, sleep for 10 seconds to ensure that the invite finishes
//                        Thread.sleep(10000);
//                    } catch (InterruptedException e) {
//                        e.printStackTrace();
//                    }
//                    return workspaceService.findById(workspaceId, READ_WORKSPACES);
//                })
//                .cache();
//
//        Mono<Application> fetchApplicationFromDbMono = workspaceMono
//                .then(Mono.just(savedApplication))
//                .flatMap(originalApp -> applicationService.findById(savedApplication.getId()))
//                .cache();
//
//        Mono<List<NewAction>> actionsMono = fetchApplicationFromDbMono
//                .flatMap(appFromDb -> newActionService
//                        .findAllByApplicationIdAndViewMode(appFromDb.getId(), false, READ_ACTIONS, null)
//                        .collectList()
//                );
//
//        Mono<List<PageDTO>> pagesMono = fetchApplicationFromDbMono
//                .flatMapMany(appFromDb -> Flux.fromIterable(appFromDb.getPages()))
//                .flatMap(applicationPage -> newPageService.findPageById(applicationPage.getId(), READ_PAGES, false))
//                .collectList();
//
//        StepVerifier
//                .create(Mono.zip(workspaceMono, fetchApplicationFromDbMono, actionsMono, pagesMono))
//                .assertNext(tuple -> {
//                    Workspace updatedWorkspace = tuple.getT1();
//                    Application updatedApp = tuple.getT2();
//                    List<NewAction> updatedActions = tuple.getT3();
//                    List<PageDTO> updatedPageDTOs = tuple.getT4();
//
//                    Set<String> userSet = Set.of("api_user", "invitecancellationtestemail@solutiontext.com");
//
//                    // Assert the policy for the invited user in workspace
//                    Policy manageOrgAppPolicy = Policy.builder().permission(WORKSPACE_MANAGE_APPLICATIONS.getValue())
//                            .users(userSet)
//                            .build();
//
//                    Policy manageOrgPolicy = Policy.builder().permission(MANAGE_WORKSPACES.getValue())
//                            .users(userSet)
//                            .build();
//
//                    Policy readOrgPolicy = Policy.builder().permission(READ_WORKSPACES.getValue())
//                            .users(userSet)
//                            .build();
//
//                    assertThat(updatedWorkspace.getPolicies()).isNotEmpty();
//                    assertThat(updatedWorkspace.getPolicies()).containsAll(Set.of(manageOrgAppPolicy, manageOrgPolicy, readOrgPolicy));
//
//                    // Assert the user role in the workspace
//                    List<UserRole> userRoles = updatedWorkspace.getUserRoles();
//                    assertThat(userRoles).isNotEmpty();
//                    Optional<UserRole> userRoleOptional = userRoles.stream().filter(userRole -> userRole.getUsername().equals(email.toLowerCase())).findFirst();
//                    assertThat(userRoleOptional.isPresent()).isTrue();
//                    UserRole userRole = userRoleOptional.get();
//                    assertThat(userRole.getRoleName()).isEqualTo(AppsmithRole.ORGANIZATION_ADMIN.getName());
//
//                    // Assert the policy for the invited user in the workspace application
//                    Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
//                            .users(userSet)
//                            .build();
//                    Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
//                            .users(userSet)
//                            .build();
//
//                    assertThat(updatedApp.getPolicies()).isNotEmpty();
//                    assertThat(updatedApp.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));
//
//                    // Assert the policy for the invited user in the application pages
//                    Policy managePagePolicy = Policy.builder().permission(MANAGE_PAGES.getValue())
//                            .users(userSet)
//                            .build();
//                    Policy readPagePolicy = Policy.builder().permission(READ_PAGES.getValue())
//                            .users(userSet)
//                            .build();
//
//                    for (PageDTO page : updatedPageDTOs) {
//                        assertThat(page.getPolicies()).isNotEmpty();
//                        assertThat(page.getPolicies()).containsAll(Set.of(managePagePolicy, readPagePolicy));
//                    }
//
//                    // Assert the policy for the invited user in the application actions
//                    Policy manageActionPolicy = Policy.builder().permission(MANAGE_ACTIONS.getValue())
//                            .users(userSet)
//                            .build();
//                    Policy readActionPolicy = Policy.builder().permission(READ_ACTIONS.getValue())
//                            .users(userSet)
//                            .build();
//
//                    for (NewAction action : updatedActions) {
//                        assertThat(action.getPolicies()).isNotEmpty();
//                        assertThat(action.getPolicies()).containsAll(Set.of(manageActionPolicy, readActionPolicy));
//                    }
//
//                })
//                .verifyComplete();
    }
}
