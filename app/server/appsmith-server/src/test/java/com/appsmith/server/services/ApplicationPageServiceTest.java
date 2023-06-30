package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class ApplicationPageServiceTest {
    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    ApplicationRepository applicationRepository;

    @Autowired
    UserRepository userRepository;

    /**
     * Creates an workspace, an application and a page under that application
     *
     * @param uniquePrefix unique string that'll be added as prefix to org and app names to avoid name collision
     * @return publisher of PageDTO
     */
    private Mono<PageDTO> createPageMono(String uniquePrefix) {
        Workspace unsavedWorkspace = new Workspace();
        unsavedWorkspace.setName(uniquePrefix + "_org");
        return workspaceService.create(unsavedWorkspace)
                .flatMap(workspace -> {
                    Application application = new Application();
                    application.setName(uniquePrefix + "_app");
                    return applicationPageService.createApplication(application, workspace.getId());
                })
                .flatMap(application -> {
                    PageDTO page = new PageDTO();
                    page.setName("Test page");
                    page.setApplicationId(application.getId());
                    return applicationPageService.createPage(page);
                });
    }

    @Test
    @WithUserDetails("api_user")
    public void deleteUnpublishedPage_WhenPageDeleted_ApplicationEditDateSet() {
        Mono<Application> applicationMono = createPageMono(UUID.randomUUID().toString())
                .flatMap(pageDTO -> {
                    Application application = new Application();
                    application.setLastEditedAt(Instant.now().minus(10, ChronoUnit.DAYS));
                    return applicationRepository.updateById(pageDTO.getApplicationId(), application, AclPermission.MANAGE_APPLICATIONS)
                            .then(applicationPageService.deleteUnpublishedPage(pageDTO.getId()))
                            .then(applicationRepository.findById(pageDTO.getApplicationId()));
                });

        StepVerifier.create(applicationMono).assertNext(application -> {
            assertThat(application.getLastEditedAt()).isNotNull();
            Instant yesterday = Instant.now().minus(1, ChronoUnit.DAYS);
            assertThat(application.getLastEditedAt()).isAfter(yesterday);
        }).verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void cloneApplication_WhenClonedSuccessfully_ApplicationIsPublished() {
        Mono<Application> applicationMono = createPageMono(UUID.randomUUID().toString())
                .flatMap(pageDTO -> applicationPageService.cloneApplication(pageDTO.getApplicationId(), null));

        StepVerifier.create(applicationMono).assertNext(application -> {
            assertThat(application.getPages().size()).isEqualTo(application.getPublishedPages().size());
        }).verifyComplete();
    }
}
