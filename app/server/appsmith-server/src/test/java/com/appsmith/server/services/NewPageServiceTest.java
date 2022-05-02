package com.appsmith.server.services;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithException;
import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@RunWith(SpringRunner.class)
class NewPageServiceTest {

    @Autowired
    NewPageService newPageService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    OrganizationService organizationService;

    @Test
    @WithUserDetails("api_user")
    void findApplicationPages_WhenApplicationIdAndPageIdNotPresent_ThrowsException() {
        StepVerifier.create(
                        newPageService.findApplicationPages(null, null, "master", ApplicationMode.EDIT)
                )
                .expectError(AppsmithException.class)
                .verify();
    }

    @Test
    @WithUserDetails("api_user")
    void findApplicationPages_WhenApplicationIdPresent_ReturnsPages() {
        String randomId = UUID.randomUUID().toString();
        Organization organization = new Organization();
        organization.setName("org_" + randomId);
        Mono<ApplicationPagesDTO> applicationPagesDTOMono = organizationService.create(organization).flatMap(createdOrg -> {
            Application application = new Application();
            application.setName("app_" + randomId);
            return applicationPageService.createApplication(application, createdOrg.getId());
        }).flatMap(application -> {
            PageDTO pageDTO = new PageDTO();
            pageDTO.setName("page_" + randomId);
            pageDTO.setApplicationId(application.getId());
            return applicationPageService.createPage(pageDTO);
        }).flatMap(pageDTO ->
                newPageService.findApplicationPages(pageDTO.getApplicationId(), null, null, ApplicationMode.EDIT)
        );

        StepVerifier.create(applicationPagesDTOMono).assertNext(applicationPagesDTO -> {
            assertThat(applicationPagesDTO.getApplication()).isNotNull();
            assertThat(applicationPagesDTO.getApplication().getName()).isEqualTo("app_"+randomId);
            assertThat(applicationPagesDTO.getPages()).isNotEmpty();
        }).verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    void findApplicationPages_WhenPageIdPresent_ReturnsPages() {
        String randomId = UUID.randomUUID().toString();
        Organization organization = new Organization();
        organization.setName("org_" + randomId);
        Mono<ApplicationPagesDTO> applicationPagesDTOMono = organizationService.create(organization).flatMap(createdOrg -> {
            Application application = new Application();
            application.setName("app_" + randomId);
            return applicationPageService.createApplication(application, createdOrg.getId());
        }).flatMap(application -> {
            PageDTO pageDTO = new PageDTO();
            pageDTO.setName("page_" + randomId);
            pageDTO.setApplicationId(application.getId());
            return applicationPageService.createPage(pageDTO);
        }).flatMap(pageDTO ->
                newPageService.findApplicationPages(null, pageDTO.getId(), null, ApplicationMode.EDIT)
        );

        StepVerifier.create(applicationPagesDTOMono).assertNext(applicationPagesDTO -> {
            assertThat(applicationPagesDTO.getApplication()).isNotNull();
            assertThat(applicationPagesDTO.getApplication().getName()).isEqualTo("app_"+randomId);
            assertThat(applicationPagesDTO.getPages()).isNotEmpty();
        }).verifyComplete();
    }

}