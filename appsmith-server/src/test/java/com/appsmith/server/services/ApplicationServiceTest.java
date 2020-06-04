package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

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

        StepVerifier
                .create(applicationMono)
                .assertNext(application -> {
                    assertThat(application).isNotNull();
                    assertThat(application.getId()).isNotNull();
                    assertThat(application.getName().equals("ApplicationServiceTest TestApp"));
                    assertThat(application.getPages()).isNotEmpty();
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
    public void validGetApplicationByName() {
        Application application = new Application();
        application.setName("validGetApplicationByName-Test");
        Mono<Application> createApplication = applicationPageService.createApplication(application);
        Mono<Application> getApplication = createApplication.flatMap(t -> applicationService.getById(t.getId()));
        StepVerifier.create(getApplication)
                .assertNext(t -> {
                    assertThat(t).isNotNull();
                    assertThat(t.getId()).isNotNull();
                    assertThat(t.getName()).isEqualTo("validGetApplicationByName-Test");
                })
                .verifyComplete();
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
                    assertThat(t.getName()).isEqualTo("NewValidUpdateApplication-Test");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void reuseDeletedAppName() {
        Application firstApp = new Application();
        firstApp.setName("Ghost app");

        Application secondApp = new Application();
        secondApp.setName("Ghost app");

        Mono<Application> firstAppDeletion = applicationPageService
                .createApplication(firstApp)
                .flatMap(app -> applicationService.archive(app))
                .cache();

        Mono<Application> secondAppCreation = firstAppDeletion.then(
                applicationPageService.createApplication(secondApp));

        StepVerifier
                .create(Mono.zip(firstAppDeletion, secondAppCreation))
                .assertNext(tuple2 -> {
                    Application first = tuple2.getT1(), second = tuple2.getT2();
                    assertThat(first.getName()).isEqualTo("Ghost app");
                    assertThat(second.getName()).isEqualTo("Ghost app");
                    assertThat(first.isDeleted()).isTrue();
                    assertThat(second.isDeleted()).isFalse();
                })
                .verifyComplete();
    }

}
