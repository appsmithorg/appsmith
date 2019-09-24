package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.annotation.DirtiesContext.ClassMode.BEFORE_CLASS;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
public class ApplicationServiceTest {

    @Autowired
    ApplicationService applicationService;

    @Test
    @WithMockUser(username = "api_user")
    public void createApplicationWithNullName() {
        Application application = new Application();
        Mono<Application> applicationMono = Mono.just(application)
                .flatMap(applicationService::create);
        StepVerifier
                .create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.NAME)))
                .verify();
    }

    @Test
    @WithMockUser(username = "api_user")
    public void createValidApplication() {
        Application testApplication = new Application();
        testApplication.setName("ApplicationServiceTest TestApp");
        Mono<Application> applicationMono = applicationService.create(testApplication);

        StepVerifier
                .create(applicationMono)
                .assertNext(application -> {
                    assertThat(application).isNotNull();
                    assertThat(application.getId()).isNotNull();
                    assertThat(application.getName().equals("ApplicationServiceTest TestApp"));
                })
                .verifyComplete();
    }

    /* Tests for Get Application Flow */

    @Test
    public void getApplicationInvalidId() {
        Mono<Application> applicationMono = applicationService.getById("random-id");
        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.NO_RESOURCE_FOUND.getMessage("resource", "random-id")))
                .verify();
    }

    @Test
    public void getApplicationNullId() {
        Mono<Application> applicationMono = applicationService.getById(null);
        StepVerifier.create(applicationMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.ID)))
                .verify();
    }

    @Test
    @WithMockUser(username = "api_user")
    public void validGetApplicationByName() {
        Application application = new Application();
        application.setName("validGetApplicationByName-Test");
        Mono<Application> createApplication = applicationService.create(application);
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
    @WithMockUser(username = "api_user")
    public void validUpdateApplication() {
        Application application = new Application();
        application.setName("validUpdateApplication-Test");

        Mono<Application> createApplication =
                applicationService
                        .create(application);
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
    
}
