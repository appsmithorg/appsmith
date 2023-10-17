package com.appsmith.server.solutions;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.UserHomepageDTO;
import com.appsmith.server.dtos.WorkspaceApplicationsDTO;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.WorkspaceService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ExtendWith(SpringExtension.class)
public class ApplicationFetcherTest {

    @Autowired
    private ApplicationPageService applicationPageService;

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private ApplicationFetcher applicationFetcher;

    Workspace workspace;

    @BeforeEach
    public void setup() {
        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("ApplicationFetcherTest");
        workspace = workspaceService.create(newWorkspace).block();
    }

    @AfterEach
    public void cleanup() {
        Workspace deletedWorkspace =
                workspaceService.archiveById(workspace.getId()).block();
    }

    @Test
    @WithUserDetails("api_user")
    public void getAllApplications_WhenUnpublishedPageExists_ReturnsApplications() {
        String randomUUID = UUID.randomUUID().toString();

        Application application = new Application();
        application.setName("app_" + randomUUID);
        Mono<UserHomepageDTO> homepageDTOMono = applicationPageService
                .createApplication(application, workspace.getId())
                .flatMap(application1 -> {
                    PageDTO pageDTO = new PageDTO();
                    pageDTO.setName("New page");
                    return applicationPageService.createPage(pageDTO).thenReturn(application1);
                })
                .then(applicationFetcher.getAllApplications());

        StepVerifier.create(homepageDTOMono).assertNext(userHomepageDTO -> {
            assertThat(userHomepageDTO.getWorkspaceApplications()).isNotNull();

            WorkspaceApplicationsDTO orgApps = userHomepageDTO.getWorkspaceApplications().stream()
                    .filter(x -> x.getWorkspace().getName().equals(workspace.getName()))
                    .findFirst()
                    .orElse(new WorkspaceApplicationsDTO());

            assertThat(orgApps.getApplications().size()).isEqualTo(1);
            assertThat(orgApps.getApplications().get(0).getPublishedPages().size())
                    .isEqualTo(1);
            assertThat(orgApps.getApplications().get(0).getPages().size()).isEqualTo(2);
        });
    }
}
