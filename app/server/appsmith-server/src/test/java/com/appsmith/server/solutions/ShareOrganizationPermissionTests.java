package com.appsmith.server.solutions;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.UserService;
import lombok.extern.slf4j.Slf4j;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MAKE_PUBLIC_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_INVITE_USERS;
import static com.appsmith.server.acl.AclPermission.READ_ORGANIZATIONS;
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
        userService.inviteUsers(inviteUsersDTO, "http://localhost:8080").blockLast();

        emails.clear();

        // Invite Developer
        emails.add("developer@solutiontest.com");
        inviteUsersDTO.setUsernames(emails);
        inviteUsersDTO.setRoleName(AppsmithRole.ORGANIZATION_DEVELOPER.getName());
        userService.inviteUsers(inviteUsersDTO, "http://localhost:8080").blockLast();
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
}
