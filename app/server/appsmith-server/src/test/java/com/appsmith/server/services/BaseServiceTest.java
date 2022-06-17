package com.appsmith.server.services;


import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.User;
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

import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * This class tests base service functions test using one of the domain objects and its corresponding service inheriting
 * from baseService which hasn't overloaded the base functions.
 */
@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class BaseServiceTest {

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    UserService userService;

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        Application testApplication = new Application();
        testApplication.setName("BaseServiceTest TestApp");

        User apiUser = userService.findByEmail("api_user").block();
        String orgId = apiUser.getOrganizationIds().iterator().next();

        applicationPageService.createApplication(testApplication, orgId).subscribe();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testAddAndRemovePoliciesForObject() {
        Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                .users(Set.of("new_user"))
                .build();
        Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                .users(Set.of("new_user"))
                .build();

        Mono<Application> addPolicyMono = applicationService
                .findByName("TestApplications", MANAGE_APPLICATIONS)
                .flatMap(application -> applicationService
                        .addPolicies(application.getId(), Set.of(manageAppPolicy, readAppPolicy))
                )
                .cache();

        StepVerifier
                .create(addPolicyMono)
                .assertNext(application -> {
                    assertThat(application).isNotNull();
                    assertThat(application.getId()).isNotNull();
                    assertThat(application.getName().equals("TestApplications"));
                    assertThat(application.getPolicies()).isNotEmpty();

                    Policy newManageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                            .users(Set.of("new_user", "api_user"))
                            .build();
                    Policy newReadAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                            .users(Set.of("api_user", "new_user"))
                            .build();
                    assertThat(application.getPolicies()).containsAll(Set.of(newManageAppPolicy, newReadAppPolicy));
                })
                .verifyComplete();

        Mono<Application> removePolicyMono = addPolicyMono
                .flatMap(application -> applicationService
                        .removePolicies(application.getId(), Set.of(manageAppPolicy, readAppPolicy))

                );

        StepVerifier
                .create(removePolicyMono)
                .assertNext(application -> {
                    assertThat(application).isNotNull();
                    assertThat(application.getId()).isNotNull();
                    assertThat(application.getName().equals("TestApplications"));
                    assertThat(application.getPolicies()).isNotEmpty();

                    Policy newManageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                            .users(Set.of("api_user"))
                            .build();
                    Policy newReadAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                            .users(Set.of("api_user"))
                            .build();
                    assertThat(application.getPolicies()).containsAll(Set.of(newManageAppPolicy, newReadAppPolicy));
                })
                .verifyComplete();

    }
}
