package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.List;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class ApplicationServiceTest {

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Test
    @WithUserDetails(value = "api_user")
    public void createApplicationWithNullName() {
        Application application = new Application();
        Mono<Application> applicationMono = Mono.just(application)
                .flatMap(applicationPageService::createApplication);
        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.NAME)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createValidApplication() {
        Application testApplication = new Application();
        testApplication.setName("ApplicationServiceTest TestApp");
        Mono<Application> applicationMono = applicationPageService.createApplication(testApplication);

        Policy manageAppPolicy = Policy.builder().permission(MANAGE_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();
        Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();

        StepVerifier
                .create(applicationMono)
                .assertNext(application -> {
                    assertThat(application).isNotNull();
                    assertThat(application.getId()).isNotNull();
                    assertThat(application.getName().equals("ApplicationServiceTest TestApp"));
                    assertThat(application.getPolicies()).isNotEmpty();
                    assertThat(application.getPolicies()).containsAll(Set.of(manageAppPolicy, readAppPolicy));
                })
                .verifyComplete();
    }

    /* Tests for Get Application Flow */

    @Test
    @WithUserDetails(value = "api_user")
    public void getApplicationInvalidId() {
        Mono<Application> applicationMono = applicationService.getById("random-id");
        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.NO_RESOURCE_FOUND.getMessage("resource", "random-id")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getApplicationNullId() {
        Mono<Application> applicationMono = applicationService.getById(null);
        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validGetApplicationById() {
        Application application = new Application();
        application.setName("validGetApplicationById-Test");
        Mono<Application> createApplication = applicationPageService.createApplication(application);
        Mono<Application> getApplication = createApplication.flatMap(t -> applicationService.getById(t.getId()));
        StepVerifier.create(getApplication)
                .assertNext(t -> {
                    assertThat(t).isNotNull();
                    assertThat(t.getId()).isNotNull();
                    assertThat(t.getName()).isEqualTo("validGetApplicationById-Test");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validGetApplicationsByName() {
        Application application = new Application();
        application.setName("validGetApplicationByName-Test");
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.set(FieldName.NAME, application.getName());

        Mono<Application> createApplication = applicationPageService.createApplication(application);

        Flux<Application> getApplication = createApplication.flatMapMany(t -> applicationService.get(params));
        StepVerifier.create(getApplication)
                .assertNext(t -> {
                    assertThat(t).isNotNull();
                    assertThat(t.getId()).isNotNull();
                    assertThat(t.getName()).isEqualTo("validGetApplicationByName-Test");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void validGetApplications() {
        Application application = new Application();
        application.setName("validGetApplicationByName-Test");

        Policy readAppPolicy = Policy.builder().permission(READ_APPLICATIONS.getValue())
                .users(Set.of("api_user"))
                .build();
        Mono<Application> createApplication = applicationPageService.createApplication(application);
        List<Application> applicationList = createApplication
                .flatMapMany(t -> applicationService.get(new LinkedMultiValueMap<>()))
                .collectList()
                .block();

        assertThat(applicationList.size() > 0);
        applicationList.forEach(t -> {
            assertThat(t.getId()).isNotNull();
            assertThat(t.getPolicies()).isNotEmpty();
            assertThat(t.getPolicies()).containsAll(Set.of(readAppPolicy));
        });
    }

    /* Tests for Update Application Flow */
    @Test
    @WithUserDetails(value = "api_user")
    public void validUpdateApplication() {
        Application application = new Application();
        application.setName("validUpdateApplication-Test");

        Mono<Application> createApplication =
                applicationPageService
                        .createApplication(application);
        Mono<Application> updateApplication = createApplication
                .map(t -> {
                    t.setName("NewValidUpdateApplication-Test");
                    return t;
                })
                .flatMap(t -> applicationService.update(t.getId(), t))
                .flatMap(t -> applicationService.getById(t.getId()));

        StepVerifier.create(updateApplication)
                .assertNext(t -> {
                    assertThat(t).isNotNull();
                    assertThat(t.getId()).isNotNull();
                    assertThat(t.getPolicies()).isNotEmpty();
                    assertThat(t.getName()).isEqualTo("NewValidUpdateApplication-Test");
                })
                .verifyComplete();
    }

}
