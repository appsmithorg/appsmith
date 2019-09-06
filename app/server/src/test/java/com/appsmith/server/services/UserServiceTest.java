package com.appsmith.server.services;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserState;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
public class UserServiceTest {

    @Autowired
    UserService userService;

    @Autowired
    OrganizationService organizationService;

    Mono<User> userMono;
    Mono<Organization> organizationMono;

    @Before
    public void setup() {
        //User init
        User user = new User();
        user.setName("user test");
        user.setEmail("usertest@usertest.com");
        user.setState(UserState.ACTIVATED);
        //Store the user in case its not present in the database.
        userMono = userService.findByEmail("usertest@usertest.com").switchIfEmpty(Mono.defer(() -> userService.save(user)));

        //Organization init
        Organization organization = new Organization();
        organization.setName("Spring Test Organization");
        organization.setDomain("appsmith-spring-test.com");
        organization.setWebsite("appsmith.com");

        //Store the organization in case its not present in the database.
        organizationMono = organizationService.getByName("Spring Test Organization").switchIfEmpty(Mono.defer(() -> organizationService.save(organization)));
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
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage("Random-UserId-%Not-In_The-System_For_SUre")))
                .verify();
    }

    @Test
    public void updateUserWithValidOrganization() {
        User updateUser = new User();
        //Add valid organization id to the updateUser object.
        organizationMono
                .map(organization -> {
                    updateUser.setOrganizationId(organization.getId());
                    return updateUser;
                }).block();

        Mono<User> userMono1 = userMono.flatMap(user -> userService.update(user.getId(), updateUser));
        StepVerifier.create(userMono1)
                .assertNext(updatedUserInRepository -> {
                    assertThat(updatedUserInRepository.getOrganizationId()).isEqualTo(updateUser.getOrganizationId());
                })
                .verifyComplete();
    }

    @Test
    public void updateUserWithInvalidOrganization() {
        User updateUser = new User();
        updateUser.setOrganizationId("Random-OrgId-%Not-In_The-System_For_SUre");
        Mono<User> userMono1 = userMono.flatMap(user -> userService.update(user.getId(), updateUser));
        StepVerifier.create(userMono1)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage("Random-OrgId-%Not-In_The-System_For_SUre")))
                .verify();
    }

}
