package com.appsmith.server.solutions;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.domains.Application;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.services.UserService;
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
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MAKE_PUBLIC_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ORGANIZATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_INVITE_USERS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_ORGANIZATIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class ShareOrganizationPermissionTests {
    @Autowired
    UserService userService;

    @Autowired
    OrganizationService organizationService;

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

    String organizationId;

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        Organization organization = new Organization();
        organization.setName("Share Test Organization");
        Organization savedOrganization = organizationService.create(organization).block();
        organizationId = savedOrganization.getId();

        Application application = new Application();
        application.setName("Share Test Application");
        application.setOrganizationId(organizationId);
        savedApplication = applicationPageService.createApplication(application, organizationId).block();

        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        inviteUsersDTO.setOrgId(organizationId);
        ArrayList<String> emails = new ArrayList<>();

        // Invite Admin
        emails.add("admin@solutiontest.com");
        inviteUsersDTO.setUsernames(emails);
        inviteUsersDTO.setRoleName(AppsmithRole.ORGANIZATION_ADMIN.getName());
        userService.inviteUsers(inviteUsersDTO, "http://localhost:8080").block();

        emails.clear();

        // Invite Developer
        emails.add("developer@solutiontest.com");
        inviteUsersDTO.setUsernames(emails);
        inviteUsersDTO.setRoleName(AppsmithRole.ORGANIZATION_DEVELOPER.getName());
        userService.inviteUsers(inviteUsersDTO, "http://localhost:8080").block();
    }

    @Test
    @WithUserDetails(value = "admin@solutiontest.com")
    public void testAdminPermissionsForInviteAndMakePublic() {
        Policy inviteUserPolicy = Policy.builder().permission(ORGANIZATION_INVITE_USERS.getValue())
                .users(Set.of("admin@solutiontest.com", "developer@solutiontest.com"))
                .build();

        Policy makePublicApp = Policy.builder().permission(MAKE_PUBLIC_APPLICATIONS.getValue())
                .users(Set.of("admin@solutiontest.com"))
                .build();

        Mono<Application> applicationMono = applicationService.findById(savedApplication.getId());
        Mono<Organization> organizationMono = organizationService.findById(organizationId, READ_ORGANIZATIONS);

        StepVerifier.create(Mono.zip(applicationMono, organizationMono))
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    Organization organization = tuple.getT2();

                    assertThat(application.getPolicies()).contains(makePublicApp);
                    assertThat(organization.getPolicies()).contains(inviteUserPolicy);
                })
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "admin@solutiontest.com")
    public void testAdminInviteRoles() {

        Set<String> roles = Set.of("Administrator", "Developer", "App Viewer");
        Mono<Map<String, String>> userRolesForOrganization = organizationService.getUserRolesForOrganization(organizationId);

        StepVerifier.create(userRolesForOrganization)
                .assertNext(rolesMap -> {
                    Set<String> rolesNames = rolesMap.keySet();
                    assertThat(rolesNames).containsAll(roles);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "developer@solutiontest.com")
    public void testDevPermissionsForInvite() {
        Policy inviteUserPolicy = Policy.builder().permission(ORGANIZATION_INVITE_USERS.getValue())
                .users(Set.of("admin@solutiontest.com", "developer@solutiontest.com"))
                .build();

        Mono<Organization> organizationMono = organizationService.findById(organizationId, READ_ORGANIZATIONS);

        StepVerifier.create(organizationMono)
                .assertNext(organization -> {
                    assertThat(organization.getPolicies()).contains(inviteUserPolicy);
                })
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "developer@solutiontest.com")
    public void testDeveloperInviteRoles() {

        Set<String> roles = Set.of("Developer", "App Viewer");
        Mono<Map<String, String>> userRolesForOrganization = organizationService.getUserRolesForOrganization(organizationId);

        StepVerifier.create(userRolesForOrganization)
                .assertNext(rolesMap -> {
                    Set<String> rolesNames = rolesMap.keySet();
                    assertThat(rolesNames).containsAll(roles);
                })
                .verifyComplete();
    }


    @Test
    @WithUserDetails(value = "api_user")
    public void validInviteUserWhenCancelledMidWay() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Organization organization = new Organization();
        organization.setName("Organization for Invite Cancellation Test");
        Organization savedOrganization = organizationService.create(organization).block();

        Application application = new Application();
        application.setName("Application for Invite Cancellation Test");
        application.setOrganizationId(savedOrganization.getId());
        savedApplication = applicationPageService.createApplication(application, savedOrganization.getId()).block();

        String pageId = savedApplication.getPages().get(0).getId();

        Plugin plugin = pluginService.findByName("Installed Plugin Name").block();
        Datasource datasource = new Datasource();
        datasource.setName("Invite Cancellation Test");
        datasource.setPluginId(plugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        datasource.setOrganizationId(savedOrganization.getId());

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

        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        inviteUsersDTO.setOrgId(savedOrganization.getId());
        ArrayList<String> emails = new ArrayList<>();

        // Test invite
        String email = "inviteCancellationTestEmail@solutionText.com";
        emails.add(email);
        inviteUsersDTO.setUsernames(emails);
        inviteUsersDTO.setRoleName(AppsmithRole.ORGANIZATION_ADMIN.getName());

        // Now trigger the invite flow and cancel it almost immediately!
        // NOTE : This is the main test flow. Invite would be triggered and is expected now to run
        // to completion even though its timing out in 5 milli seconds.
        userService.inviteUsers(inviteUsersDTO, "http://localhost:8080")
                .timeout(Duration.ofMillis(5))
                .subscribe();

        // Before fetching any objects from the database, to avoid flaky tests, first sleep for 10 seconds. This
        // ensures that we are guaranteed that the invite flow (which was cancelled in 5 ms) has run to completion
        // before we fetch the org, app, pages and actions
        Mono<Organization> organizationMono = Mono.just(savedOrganization.getId())
                .flatMap(orgId -> {
                    try {
                        // Before fetching the updated organzation, sleep for 10 seconds to ensure that the invite finishes
                        Thread.sleep(10000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    return organizationService.findById(orgId, READ_ORGANIZATIONS);
                })
                .cache();

        Mono<Application> fetchApplicationFromDbMono = organizationMono
                .then(Mono.just(savedApplication))
                .flatMap(originalApp -> applicationService.findById(savedApplication.getId()))
                .cache();

        Mono<List<NewAction>> actionsMono = fetchApplicationFromDbMono
                .flatMap(appFromDb -> newActionService
                        .findAllByApplicationIdAndViewMode(appFromDb.getId(), false, READ_ACTIONS, null)
                        .collectList()
                );

        Mono<List<PageDTO>> pagesMono = fetchApplicationFromDbMono
                .flatMapMany(appFromDb -> Flux.fromIterable(appFromDb.getPages()))
                .flatMap(applicationPage -> newPageService.findPageById(applicationPage.getId(), READ_PAGES, false))
                .collectList();

        StepVerifier
                .create(Mono.zip(organizationMono, fetchApplicationFromDbMono, actionsMono, pagesMono))
                .assertNext(tuple -> {
                    Organization updatedOrganization = tuple.getT1();
                    Application updatedApp = tuple.getT2();
                    List<NewAction> updatedActions = tuple.getT3();
                    List<PageDTO> updatedPageDTOs = tuple.getT4();

                    Set<String> userSet = Set.of("api_user", "invitecancellationtestemail@solutiontext.com");

                    // Assert the policy for the invited user in organization
                    Policy manageOrgAppPolicy = Policy.builder().permission(ORGANIZATION_MANAGE_APPLICATIONS.getValue())
                            .users(userSet)
                            .build();

                    Policy manageOrgPolicy = Policy.builder().permission(MANAGE_ORGANIZATIONS.getValue())
                            .users(userSet)
                            .build();

                    Policy readOrgPolicy = Policy.builder().permission(READ_ORGANIZATIONS.getValue())
                            .users(userSet)
                            .build();

                    assertThat(updatedOrganization.getPolicies()).isNotEmpty();
                    assertThat(updatedOrganization.getPolicies()).containsAll(Set.of(manageOrgAppPolicy, manageOrgPolicy, readOrgPolicy));

                    // Assert the user role in the organization
                    List<UserRole> userRoles = updatedOrganization.getUserRoles();
                    assertThat(userRoles).isNotEmpty();
                    Optional<UserRole> userRoleOptional = userRoles.stream().filter(userRole -> userRole.getUsername().equals(email.toLowerCase())).findFirst();
                    assertThat(userRoleOptional.isPresent()).isTrue();
                    UserRole userRole = userRoleOptional.get();
                    assertThat(userRole.getRoleName()).isEqualTo(AppsmithRole.ORGANIZATION_ADMIN.getName());

                    // Assert the policy for the invited user in the organization application
                    Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                            .users(userSet)
                            .build();
                    Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                            .users(userSet)
                            .build();

                    assertThat(updatedApp.getPolicies()).isNotEmpty();
                    assertThat(updatedApp.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));

                    // Assert the policy for the invited user in the application pages
                    Policy managePagePolicy = Policy.builder().permission(MANAGE_PAGES.getValue())
                            .users(userSet)
                            .build();
                    Policy readPagePolicy = Policy.builder().permission(READ_PAGES.getValue())
                            .users(userSet)
                            .build();

                    for (PageDTO page : updatedPageDTOs) {
                        assertThat(page.getPolicies()).isNotEmpty();
                        assertThat(page.getPolicies()).containsAll(Set.of(managePagePolicy, readPagePolicy));
                    }

                    // Assert the policy for the invited user in the application actions
                    Policy manageActionPolicy = Policy.builder().permission(MANAGE_ACTIONS.getValue())
                            .users(userSet)
                            .build();
                    Policy readActionPolicy = Policy.builder().permission(READ_ACTIONS.getValue())
                            .users(userSet)
                            .build();

                    for (NewAction action : updatedActions) {
                        assertThat(action.getPolicies()).isNotEmpty();
                        assertThat(action.getPolicies()).containsAll(Set.of(manageActionPolicy, readActionPolicy));
                    }

                })
                .verifyComplete();
    }
}
