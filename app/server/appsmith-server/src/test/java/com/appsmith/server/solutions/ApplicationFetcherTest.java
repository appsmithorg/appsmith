package com.appsmith.server.solutions;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.WorkspaceApplicationsDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.UserHomepageDTO;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.WorkspaceService;
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
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@RunWith(SpringRunner.class)
class ApplicationFetcherTest {

    @Autowired
    private ApplicationPageService applicationPageService;

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private ApplicationFetcher applicationFetcher;

    @Test
    @WithUserDetails("api_user")
    void getAllApplications_WhenUnpublishedPageExists_ReturnsApplications() {
        String randomUUID = UUID.randomUUID().toString();
        Workspace newOrg = new Workspace();
        newOrg.setName("org_" + randomUUID);

        Mono<UserHomepageDTO> homepageDTOMono = workspaceService.create(newOrg).flatMap(organization -> {
            Application application = new Application();
            application.setName("app_" + randomUUID);
            return applicationPageService.createApplication(application, organization.getId());
        }).flatMap(application -> {
            PageDTO pageDTO = new PageDTO();
            pageDTO.setName("New page");
            return applicationPageService.createPage(pageDTO).thenReturn(application);
        }).then(applicationFetcher.getAllApplications());

        StepVerifier.create(homepageDTOMono).assertNext(userHomepageDTO -> {
            assertThat(userHomepageDTO.getOrganizationApplications()).isNotNull();

            WorkspaceApplicationsDTO orgApps = userHomepageDTO.getOrganizationApplications().stream().filter(
                    x -> x.getOrganization().getName().equals(newOrg.getName())
            ).findFirst().orElse(new WorkspaceApplicationsDTO());

            assertThat(orgApps.getApplications().size()).isEqualTo(1);
            assertThat(orgApps.getApplications().get(0).getPublishedPages().size()).isEqualTo(1);
            assertThat(orgApps.getApplications().get(0).getPages().size()).isEqualTo(2);
        });
    }
}