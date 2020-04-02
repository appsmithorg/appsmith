package com.appsmith.server.services;

import com.appsmith.server.configurations.WithMockAppsmithUser;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.InviteUser;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@RunWith(SpringRunner.class)
@SpringBootTest
@DirtiesContext
public class UserServiceTest {

    @Autowired
    UserService userService;

    @Autowired
    OrganizationService organizationService;

    @Autowired
    ApplicationService applicationService;

    Mono<User> userMono;

    Mono<Organization> organizationMono;

    @Before
    public void setup() {
        userMono = userService.findByEmail("usertest@usertest.com");
        organizationMono = organizationService.getBySlug("spring-test-organization");
    }

    //Test the update organization flow.
    @Test
    public void updateInvalidUserWithAnything() {
        User updateUser = new User();
        updateUser.setName("Random User whose updates don't matter");

        User existingUser = new User();
        existingUser.setId("Random-UserId-%Not-In_The-System_For_SUre");

        Mono<User> userMono1 = Mono.just(existingUser).flatMap(user -> userService.update(user.getId(), updateUser));

        StepVerifier.create(userMono1)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.USER, "Random-UserId-%Not-In_The-System_For_SUre")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateUserWithValidOrganization() {
        // Create a new organization
        Organization updateOrg = new Organization();
        updateOrg.setName("UserServiceTest Update Org");

        User updateUser = new User();

        Mono<User> userMono1 = userService.findByEmail("api_user")
                .switchIfEmpty(Mono.error(new Exception("Unable to find user")));

        //Add valid organization id to the updateUser object.
        Mono<User> userMono = organizationService.create(updateOrg)
                .flatMap(org -> {
                    updateUser.setCurrentOrganizationId(org.getId());
                    return userMono1.flatMap(user -> userService.update(user.getId(), updateUser));
                });

        StepVerifier.create(userMono)
                .assertNext(user -> {
                    assertThat(user.getCurrentOrganizationId()).isEqualTo(updateUser.getCurrentOrganizationId());
                })
                .verifyComplete();
    }

    @Test
    public void updateUserWithInvalidOrganization() {
        User updateUser = new User();
        updateUser.setCurrentOrganizationId("Random-OrgId-%Not-In_The-System_For_SUre");
        Mono<User> userMono1 = userMono.flatMap(user -> userService.update(user.getId(), updateUser));
        StepVerifier.create(userMono1)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage("Random-OrgId-%Not-In_The-System_For_SUre")))
                .verify();
    }

    @Test
    @WithMockUser(username = "anonymousUser", roles = {"ANONYMOUS"})
    public void createNewUserFormSignupNullPassword() {
        User newUser = new User();
        newUser.setEmail("new-user-email@email.com");

        Mono<User> userMono = userService.create(newUser);

        StepVerifier.create(userMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_CREDENTIALS.getMessage()))
                .verify();
    }

    @Test
    @WithMockAppsmithUser
    public void createNewUserValid() {
        User newUser = new User();
        newUser.setEmail("new-user-email@email.com");
        newUser.setPassword("new-user-test-password");

        Mono<User> userMono = userService.create(newUser);

        StepVerifier.create(userMono)
                .assertNext(user -> {
                    log.debug("{}", user.getPolicies());
                    assertThat(user).isNotNull();
                    assertThat(user.getId()).isNotNull();
                    assertThat(user.getEmail()).isEqualTo("new-user-email@email.com");
                    assertThat(user.getName()).isEqualTo("new-user-email@email.com");
                    assertThat(user.getPolicies()).isNotEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void inviteUserToApplicationValid() {
        InviteUser inviteUser = new InviteUser();
        inviteUser.setEmail("inviteUserToApplication@test.com");
        inviteUser.setRole(AppsmithRole.APPLICATION_ADMIN);

        Mono<Application> applicationMono = applicationService.findByName("LayoutServiceTest TestApplications")
                .switchIfEmpty(Mono.error(new Exception("No such app")));

        Mono<User> userMono = applicationMono.flatMap(application -> {
            log.debug("In the userMono with application policies: {}", application.getPolicies());
            return userService.inviteUserToApplication(inviteUser, "http://localhost:8080", application.getId());
        }).cache();

        Mono<Application> updatedApplication = userMono.then(applicationService.findByName("LayoutServiceTest TestApplications"))
                .map(application -> {
                    log.debug("In the updatedAppMono with app policies: {}", application.getPolicies());
                    return application;
                });

        StepVerifier.create(Mono.zip(updatedApplication, userMono))
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    User user = tuple.getT2();
                    log.debug("Got the invited user: {}", user);
                    log.debug("Got the application: {}", application);
                    log.debug("Got application policies: {}", application.getPolicies());

                    assertThat(application).isNotNull();
                    assertThat(application.getPolicies()).isNotEmpty();
                    assertThat(user).isNotNull();
                })
                .verifyComplete();
    }
}

