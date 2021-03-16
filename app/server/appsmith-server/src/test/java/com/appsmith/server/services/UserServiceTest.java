package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.configurations.WithMockAppsmithUser;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.InviteUser;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.InviteUsersDTO;
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
import org.springframework.util.CollectionUtils;
import org.springframework.util.LinkedCaseInsensitiveMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_USERS;
import static com.appsmith.server.acl.AclPermission.USER_MANAGE_ORGANIZATIONS;
import static com.appsmith.server.acl.AclPermission.USER_READ_ORGANIZATIONS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.Assert.assertNotNull;

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

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    Mono<User> userMono;

    Mono<Organization> organizationMono;

    @Autowired
    UserSignup userSignup;

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

    /**
     * The following function tests for switch organization
     */
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
    @WithMockAppsmithUser
    public void createNewUserFormSignupNullPassword() {
        User newUser = new User();
        newUser.setEmail("new-user-email-with-null-password@email.com");

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

        Policy manageUserPolicy = Policy.builder()
                .permission(MANAGE_USERS.getValue())
                .users(Set.of(newUser.getUsername())).build();

        Policy manageUserOrgPolicy = Policy.builder()
                .permission(USER_MANAGE_ORGANIZATIONS.getValue())
                .users(Set.of(newUser.getUsername())).build();

        Policy readUserPolicy = Policy.builder()
                .permission(READ_USERS.getValue())
                .users(Set.of(newUser.getUsername())).build();

        Policy readUserOrgPolicy = Policy.builder()
                .permission(USER_READ_ORGANIZATIONS.getValue())
                .users(Set.of(newUser.getUsername())).build();

        Mono<User> userMono = userService.create(newUser);

        StepVerifier.create(userMono)
                .assertNext(user -> {
                    assertThat(user).isNotNull();
                    assertThat(user.getId()).isNotNull();
                    assertThat(user.getEmail()).isEqualTo("new-user-email@email.com");
                    assertThat(user.getName()).isNullOrEmpty();
                    assertThat(user.getPolicies()).isNotEmpty();
                    assertThat(user.getPolicies()).containsAll(Set.of(manageUserPolicy, manageUserOrgPolicy, readUserPolicy, readUserOrgPolicy));
                    // Since there is a template organization, the user won't have an empty default organization. They
                    // will get a clone of the default organization when they first login. So, we expect it to be
                    // empty here.
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

    @Test
    @WithMockAppsmithUser
    public void signUpViaGoogleIfAlreadyInvited() {
        User newUser = new User();
        newUser.setEmail("alreadyInvited@google-gmail.com");
        newUser.setIsEnabled(false);

        userRepository.save(newUser).block();

        User signupUser = new User();
        signupUser.setEmail(newUser.getEmail());
        signupUser.setPassword("password");
        signupUser.setSource(LoginSource.GOOGLE);

        Mono<User> userMono = userService.create(signupUser);

        StepVerifier.create(userMono)
                .assertNext(user -> {
                    assertThat(user.getEmail().equals(newUser.getEmail()));
                    assertThat(user.getSource().equals(LoginSource.GOOGLE));
                    assertThat(user.getIsEnabled()).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void signUpAfterBeingInvitedToAppsmithOrganization() {
        Organization organization = new Organization();
        organization.setName("SignUp after adding user to Test Organization");
        organization.setDomain("example.com");
        organization.setWebsite("https://example.com");

        Mono<Organization> organizationMono = organizationService
                .create(organization)
                .cache();

        String newUserEmail = "inviteUserToApplicationWithoutExisting@test.com";

        organizationMono
                .flatMap(organization1 -> {
                    // Add user to organization
                    InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
                    ArrayList<String> users = new ArrayList<>();
                    users.add(newUserEmail);
                    inviteUsersDTO.setUsernames(users);
                    inviteUsersDTO.setOrgId(organization1.getId());
                    inviteUsersDTO.setRoleName(AppsmithRole.ORGANIZATION_VIEWER.getName());

                    return userService.inviteUsers(inviteUsersDTO, "http://localhost:8080");
                }).block();

        // Now Sign Up as the new user
        User signUpUser = new User();
        signUpUser.setEmail(newUserEmail);
        signUpUser.setPassword("123456");

        Mono<User> invitedUserSignUpMono =
                userService.createUserAndSendEmail(signUpUser, "http://localhost:8080");

        StepVerifier.create(invitedUserSignUpMono)
                .assertNext(user -> {
                    assertThat(user.getIsEnabled().equals(true));
                    assertThat(passwordEncoder.matches("123456", user.getPassword())).isTrue();
                })
                .verifyComplete();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getAllUsersTest() {
        Flux<User> userFlux = userService.get(CollectionUtils.toMultiValueMap(new LinkedCaseInsensitiveMap<>()));

        StepVerifier.create(userFlux)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.UNSUPPORTED_OPERATION.getMessage()))
                .verify();

    }

    @Test
    public void createUserWithInvalidEmailAddress() {
        List<String> invalidAddresses = Arrays.asList(
                "plainaddress",
                "#@%^%#$@#$@#.com",
                "@example.com",
                "Joe Smith <email@example.com>",
                "email.example.com",
                "email@example@example.com",
                ".email@example.com",
                "email.@example.com",
                "email..email@example.com",
                "email@example.com (Joe Smith)",
                "email@-example.com",
                "email@example..com",
                "Abc..123@example.com"
        );
        for (String invalidAddress : invalidAddresses) {
            User user = new User();
            user.setEmail(invalidAddress);
            user.setPassword("test-password");
            user.setName("test-name");
            StepVerifier.create(userSignup.signupAndLogin(user, null))
                    .expectErrorMessage(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.EMAIL));
        }
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateNameOfUser() {
        User updateUser = new User();
        updateUser.setEmail("api_user");
        updateUser.setName("New name of api_user");

        StepVerifier.create(userService.updateCurrentUser(updateUser, null))
                .assertNext(user -> {
                    assertNotNull(user);
                    assertThat(user.getEmail()).isEqualTo("api_user");
                    assertThat(user.getName()).isEqualTo("New name of api_user");
                })
                .verifyComplete();
    }

}
