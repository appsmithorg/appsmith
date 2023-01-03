package com.appsmith.server.services;

import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.PermissionGroupRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ExtendWith(SpringExtension.class)
public class NewPageServiceTest {

    @Autowired
    NewPageService newPageService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Test
    @WithUserDetails("api_user")
    public void testCreateDefault() {
        Set<String> permissionGroupIds = permissionGroupRepository.findAll().collectList().block().stream()
                .map(PermissionGroup::getId).collect(Collectors.toSet());
        PageDTO pageDTO = new PageDTO();
        pageDTO.setApplicationId("test-application-id");
        DefaultResources testDefaultResources = new DefaultResources();
        pageDTO.setDefaultResources(testDefaultResources);
        Policy testPolicy = Policy.builder()
                .permissionGroups(permissionGroupIds)
                .build();
        pageDTO.setPolicies(Set.of(testPolicy));
        StepVerifier.create(newPageService.createDefault(pageDTO))
                .assertNext(pageDTO1 -> {
                    assertThat(pageDTO1.getId()).isNotNull();
                    assertThat(pageDTO1.getUserPermissions()).isNotEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void findApplicationPages_WhenApplicationIdAndPageIdNotPresent_ThrowsException() {
        StepVerifier.create(
                        newPageService.findApplicationPages(null, null, "master", ApplicationMode.EDIT)
                )
                .expectError(AppsmithException.class)
                .verify();
    }

    @Test
    @WithUserDetails("api_user")
    public void findApplicationPages_WhenApplicationIdPresent_ReturnsPages() {
        String randomId = UUID.randomUUID().toString();
        Workspace workspace = new Workspace();
        workspace.setName("org_" + randomId);
        Mono<ApplicationPagesDTO> applicationPagesDTOMono = workspaceService.create(workspace)
                .flatMap(createdOrg -> {
                    Application application = new Application();
                    application.setName("app_" + randomId);
                    return applicationPageService.createApplication(application, createdOrg.getId());
                })
                .flatMap(application -> {
                    PageDTO pageDTO = new PageDTO();
                    pageDTO.setName("page_" + randomId);
                    pageDTO.setApplicationId(application.getId());
                    return applicationPageService.createPage(pageDTO);
                })
                .flatMap(pageDTO ->
                        newPageService.findApplicationPages(pageDTO.getApplicationId(), null, null, ApplicationMode.EDIT)
                );

        StepVerifier.create(applicationPagesDTOMono).assertNext(applicationPagesDTO -> {
                    assertThat(applicationPagesDTO.getApplication()).isNotNull();
                    assertThat(applicationPagesDTO.getApplication().getViewMode()).isFalse();
                    assertThat(applicationPagesDTO.getApplication().getName()).isEqualTo("app_" + randomId);
                    assertThat(applicationPagesDTO.getPages()).isNotEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void findApplicationPagesInViewMode_WhenApplicationIdPresent_ReturnsViewMode() {
        String randomId = UUID.randomUUID().toString();
        Workspace workspace = new Workspace();
        workspace.setName("org_" + randomId);
        Mono<ApplicationPagesDTO> applicationPagesDTOMono = workspaceService.create(workspace)
                .flatMap(createdOrg -> {
                    Application application = new Application();
                    application.setName("app_" + randomId);
                    return applicationPageService.createApplication(application, createdOrg.getId());
                })
                .flatMap(application -> {
                    PageDTO pageDTO = new PageDTO();
                    pageDTO.setName("page_" + randomId);
                    pageDTO.setApplicationId(application.getId());
                    Mono<PageDTO> pageDTOMono = applicationPageService.createPage(pageDTO).cache();
                    return pageDTOMono
                            .then(applicationPageService.publish(application.getId(), true))
                            .then(pageDTOMono);
                })
                .flatMap(pageDTO ->
                        newPageService.findApplicationPages(pageDTO.getApplicationId(), null, null, ApplicationMode.PUBLISHED)
                );

        StepVerifier.create(applicationPagesDTOMono).assertNext(applicationPagesDTO -> {
                    assertThat(applicationPagesDTO.getApplication()).isNotNull();
                    assertThat(applicationPagesDTO.getApplication().getViewMode()).isTrue();
                    assertThat(applicationPagesDTO.getApplication().getName()).isEqualTo("app_" + randomId);
                    assertThat(applicationPagesDTO.getPages()).isNotEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void findApplicationPages_WhenPageIdPresent_ReturnsPages() {
        String randomId = UUID.randomUUID().toString();
        Workspace workspace = new Workspace();
        workspace.setName("org_" + randomId);
        Mono<ApplicationPagesDTO> applicationPagesDTOMono = workspaceService.create(workspace)
                .flatMap(createdWorkspace -> {
                    Application application = new Application();
                    application.setName("app_" + randomId);
                    return applicationPageService.createApplication(application, createdWorkspace.getId());
                })
                .flatMap(application -> {
                    PageDTO pageDTO = new PageDTO();
                    pageDTO.setName("page_" + randomId);
                    pageDTO.setApplicationId(application.getId());
                    return applicationPageService.createPage(pageDTO);
                })
                .flatMap(pageDTO ->
                        newPageService.findApplicationPages(null, pageDTO.getId(), null, ApplicationMode.EDIT)
                );

        StepVerifier.create(applicationPagesDTOMono).assertNext(applicationPagesDTO -> {
                    assertThat(applicationPagesDTO.getApplication()).isNotNull();
                    assertThat(applicationPagesDTO.getApplication().getName()).isEqualTo("app_" + randomId);
                    assertThat(applicationPagesDTO.getPages()).isNotEmpty();
                })
                .verifyComplete();
    }

}