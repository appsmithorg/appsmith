package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.WithMockAppsmithUser;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.InviteUser;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.solutions.UserSignup;
import lombok.extern.slf4j.Slf4j;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashSet;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@RunWith(SpringRunner.class)
@SpringBootTest(properties = { "signup.disabled = true", "admin.emails = dummy_admin@appsmith.com,dummy2@appsmith.com" })
@DirtiesContext
public class UserServiceWithDisabledSignupTest {

    @Autowired
    UserService userService;

    @Autowired
    OrganizationService organizationService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    CommonConfig commonConfig;

    Mono<User> userMono;

    Mono<Organization> organizationMono;

    @Autowired
    UserSignup userSignup;

    @Before
    public void setup() {
        userMono = userService.findByEmail("usertest@usertest.com");
        organizationMono = organizationService.getBySlug("spring-test-organization");
    }

    @Test
    @WithMockAppsmithUser
    public void createNewUserValidWhenDisabled() {
        User newUser = new User();
        newUser.setEmail("new-user-email@email.com");
        newUser.setPassword("new-user-test-password");

        Mono<User> userMono = userService.create(newUser);

        StepVerifier.create(userMono)
                .expectErrorMatches(error -> {
                    assertThat(error).isInstanceOf(AppsmithException.class);
                    assertThat(((AppsmithException) error).getError()).isEqualTo(AppsmithError.SIGNUP_DISABLED);
                    return true;
                })
                .verify();
    }

    @Test
    @WithMockAppsmithUser
    public void createNewAdminValidWhenDisabled() {
        User newUser = new User();
        newUser.setEmail("dummy_admin@appsmith.com");
        newUser.setPassword("admin-password");

        Mono<User> userMono = userService.create(newUser);

        StepVerifier.create(userMono)
                .assertNext(user -> {
                    assertThat(user).isNotNull();
                    assertThat(user.getId()).isNotNull();
                    assertThat(user.getEmail()).isEqualTo("dummy_admin@appsmith.com");
                    assertThat(user.getName()).isNullOrEmpty();
                    assertThat(user.getPolicies()).isNotEmpty();
                    assertThat(user.getOrganizationIds()).hasSize(1);
                })
                .verifyComplete();
    }

    @Test
    @WithMockAppsmithUser
    public void createNewAdminValidWhenDisabled2() {
        User newUser = new User();
        newUser.setEmail("dummy2@appsmith.com");
        newUser.setPassword("admin-password");

        Mono<User> userMono = userService.create(newUser);

        StepVerifier.create(userMono)
                .assertNext(user -> {
                    assertThat(user).isNotNull();
                    assertThat(user.getId()).isNotNull();
                    assertThat(user.getEmail()).isEqualTo("dummy2@appsmith.com");
                    assertThat(user.getName()).isNullOrEmpty();
                    assertThat(user.getPolicies()).isNotEmpty();
                    assertThat(user.getOrganizationIds()).hasSize(1);
                })
                .verifyComplete();
    }

    @Test
    @DirtiesContext
    @WithUserDetails(value = "api_user")
    public void inviteUserToApplicationValidAsAdmin() {
        InviteUser inviteUser = new InviteUser();
        inviteUser.setEmail("inviteUserToApplication@test.com");
        inviteUser.setRole(AppsmithRole.APPLICATION_ADMIN);

        Mono<Application> applicationMono = applicationService.findByName("LayoutServiceTest TestApplications", MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(new Exception("No such app")));

        Mono<User> userMono = applicationMono.flatMap(application -> userService
                .inviteUserToApplication(inviteUser, "http://localhost:8080", application.getId())).cache();

        Mono<Application> updatedApplication = userMono.then(applicationService.findByName("LayoutServiceTest TestApplications", MANAGE_APPLICATIONS));

        StepVerifier.create(Mono.zip(updatedApplication, userMono))
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    User user = tuple.getT2();

                    Policy manageAppPolicy = Policy.builder()
                            .permission(MANAGE_APPLICATIONS.getValue())
                            .users(Set.of("api_user", user.getUsername()))
                            .groups(new HashSet<>())
                            .build();

                    Policy readAppPolicy = Policy.builder()
                            .permission(READ_APPLICATIONS.getValue())
                            .users(Set.of("api_user", user.getUsername()))
                            .groups(new HashSet<>())
                            .build();


                    assertThat(application).isNotNull();
                    assertThat(application.getPolicies()).isNotEmpty();
                    assertThat(application.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));

                    assertThat(user).isNotNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void inviteUserToApplicationValidAsViewer() {
        InviteUser inviteUser = new InviteUser();
        inviteUser.setEmail("inviteUserToApplication@test.com");
        inviteUser.setRole(AppsmithRole.APPLICATION_VIEWER);

        Mono<Application> applicationMono = applicationService.findByName("LayoutServiceTest TestApplications", READ_APPLICATIONS)
                .switchIfEmpty(Mono.error(new Exception("No such app")));

        Mono<User> userMono = applicationMono.flatMap(application -> userService
                .inviteUserToApplication(inviteUser, "http://localhost:8080", application.getId())).cache();

        Mono<Application> updatedApplication = userMono.then(applicationService.findByName("LayoutServiceTest TestApplications", READ_APPLICATIONS));


        StepVerifier.create(Mono.zip(updatedApplication, userMono))
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    User user = tuple.getT2();

                    Policy readAppPolicy = Policy.builder()
                            .permission(READ_APPLICATIONS.getValue())
                            .users(Set.of("api_user", user.getUsername()))
                            .groups(new HashSet<>())
                            .build();

                    Policy manageAppPolicy = Policy.builder()
                            .permission(MANAGE_APPLICATIONS.getValue())
                            .users(Set.of("api_user"))
                            .build();

                    assertThat(application).isNotNull();
                    assertThat(application.getPolicies()).isNotEmpty();
                    assertThat(application.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));

                    assertThat(user).isNotNull();
                })
                .verifyComplete();
    }

    @Test
    @WithMockAppsmithUser
    public void signUpViaFormLoginIfAlreadyInvited() {
        User newUser = new User();
        newUser.setEmail("alreadyInvited@alreadyInvited.com");
        newUser.setIsEnabled(false);

        userRepository.save(newUser).block();

        User signupUser = new User();
        signupUser.setEmail(newUser.getEmail());
        signupUser.setPassword("password");
        signupUser.setSource(LoginSource.FORM);

        Mono<User> userMono = userService.create(signupUser);

        StepVerifier.create(userMono)
                .assertNext(user -> {
                    assertThat(user.getEmail().equals(newUser.getEmail()));
                    assertThat(user.getSource().equals(LoginSource.FORM));
                    assertThat(user.getIsEnabled()).isTrue();
                })
                .verifyComplete();
    }
}
