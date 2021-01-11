package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.WithMockAppsmithUser;
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
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;
import static com.appsmith.server.acl.AclPermission.READ_USERS;
import static com.appsmith.server.acl.AclPermission.USER_MANAGE_ORGANIZATIONS;
import static com.appsmith.server.acl.AclPermission.USER_READ_ORGANIZATIONS;
import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@RunWith(SpringRunner.class)
@SpringBootTest(properties = { "signup.disabled = true" })
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
                .expectErrorMatches(error -> {
                    assertThat(error).isInstanceOf(AppsmithException.class);
                    assertThat(((AppsmithException) error).getError()).isEqualTo(AppsmithError.SIGNUP_DISABLED);
                    return true;
                })
                .verify();
    }

}

