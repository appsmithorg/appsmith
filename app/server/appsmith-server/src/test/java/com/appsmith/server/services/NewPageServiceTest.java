package com.appsmith.server.services;

import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Policy;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.ApplicationSnapshotRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.PagePermission;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
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

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationSnapshotRepository applicationSnapshotRepository;

    @Autowired
    NewPageRepository newPageRepository;

    @Autowired
    PagePermission pagePermission;

    @Autowired
    ApplicationPermission applicationPermission;

    String workspaceId = null;

    @BeforeEach
    public void setup() {
        String randomId = UUID.randomUUID().toString();
        Workspace workspace = new Workspace();
        workspace.setName("org_" + randomId);
        workspaceId = workspaceService.create(workspace).map(Workspace::getId).block();
    }

    @AfterEach
    public void cleanup() {
        List<Application> deletedApplications = applicationService
                .findByWorkspaceId(workspaceId, applicationPermission.getDeletePermission())
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .collectList()
                .block();
        Workspace deletedWorkspace = workspaceService.archiveById(workspaceId).block();
    }

    @Test
    @WithUserDetails("api_user")
    public void testCreateDefault() {
        Set<String> permissionGroupIds = permissionGroupRepository.findAll().collectList().block().stream()
                .map(PermissionGroup::getId)
                .collect(Collectors.toSet());
        PageDTO pageDTO = new PageDTO();
        pageDTO.setApplicationId("test-application-id");
        DefaultResources testDefaultResources = new DefaultResources();
        pageDTO.setDefaultResources(testDefaultResources);
        Policy testPolicy =
                Policy.builder().permissionGroups(permissionGroupIds).build();
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
        StepVerifier.create(newPageService.findApplicationPages(null, null, "master", ApplicationMode.EDIT))
                .expectError(AppsmithException.class)
                .verify();
    }

    @Test
    @WithUserDetails("api_user")
    public void findApplicationPages_WhenApplicationIdPresent_ReturnsPages() {
        String randomId = UUID.randomUUID().toString();
        Application application = new Application();
        application.setName("app_" + randomId);
        Mono<ApplicationPagesDTO> applicationPagesDTOMono = applicationPageService
                .createApplication(application, workspaceId)
                .flatMap(application1 -> {
                    PageDTO pageDTO = new PageDTO();
                    pageDTO.setName("page_" + randomId);
                    pageDTO.setApplicationId(application1.getId());
                    return applicationPageService.createPage(pageDTO);
                })
                .flatMap(pageDTO -> newPageService.findApplicationPages(
                        pageDTO.getApplicationId(), null, null, ApplicationMode.EDIT));

        StepVerifier.create(applicationPagesDTOMono)
                .assertNext(applicationPagesDTO -> {
                    assertThat(applicationPagesDTO.getApplication()).isNotNull();
                    assertThat(applicationPagesDTO.getApplication().getViewMode())
                            .isFalse();
                    assertThat(applicationPagesDTO.getApplication().getName()).isEqualTo("app_" + randomId);
                    assertThat(applicationPagesDTO.getPages()).isNotEmpty();
                    applicationPagesDTO.getPages().forEach(pageNameIdDTO -> assertThat(
                                    pageNameIdDTO.getUserPermissions())
                            .isNotEmpty());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void findApplicationPagesInViewMode_WhenApplicationIdPresent_ReturnsViewMode() {
        String randomId = UUID.randomUUID().toString();
        Application application = new Application();
        application.setName("app_" + randomId);
        Mono<ApplicationPagesDTO> applicationPagesDTOMono = applicationPageService
                .createApplication(application, workspaceId)
                .flatMap(application1 -> {
                    PageDTO pageDTO = new PageDTO();
                    pageDTO.setName("page_" + randomId);
                    pageDTO.setApplicationId(application1.getId());
                    Mono<PageDTO> pageDTOMono =
                            applicationPageService.createPage(pageDTO).cache();
                    return pageDTOMono
                            .then(applicationPageService.publish(application1.getId(), true))
                            .then(pageDTOMono);
                })
                .flatMap(pageDTO -> newPageService.findApplicationPages(
                        pageDTO.getApplicationId(), null, null, ApplicationMode.PUBLISHED));

        StepVerifier.create(applicationPagesDTOMono)
                .assertNext(applicationPagesDTO -> {
                    assertThat(applicationPagesDTO.getApplication()).isNotNull();
                    assertThat(applicationPagesDTO.getApplication().getViewMode())
                            .isTrue();
                    assertThat(applicationPagesDTO.getApplication().getName()).isEqualTo("app_" + randomId);
                    assertThat(applicationPagesDTO.getPages()).isNotEmpty();
                    applicationPagesDTO.getPages().forEach(pageNameIdDTO -> assertThat(
                                    pageNameIdDTO.getUserPermissions())
                            .isNotEmpty());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void findApplicationPages_WhenPageIdPresent_ReturnsPages() {
        String randomId = UUID.randomUUID().toString();
        Application application = new Application();
        application.setName("app_" + randomId);
        Mono<ApplicationPagesDTO> applicationPagesDTOMono = applicationPageService
                .createApplication(application, workspaceId)
                .flatMap(application1 -> {
                    PageDTO pageDTO = new PageDTO();
                    pageDTO.setName("page_" + randomId);
                    pageDTO.setApplicationId(application1.getId());
                    return applicationPageService.createPage(pageDTO);
                })
                .flatMap(pageDTO ->
                        newPageService.findApplicationPages(null, pageDTO.getId(), null, ApplicationMode.EDIT));

        StepVerifier.create(applicationPagesDTOMono)
                .assertNext(applicationPagesDTO -> {
                    assertThat(applicationPagesDTO.getApplication()).isNotNull();
                    assertThat(applicationPagesDTO.getApplication().getName()).isEqualTo("app_" + randomId);
                    assertThat(applicationPagesDTO.getPages()).isNotEmpty();
                    applicationPagesDTO.getPages().forEach(pageNameIdDTO -> assertThat(
                                    pageNameIdDTO.getUserPermissions())
                            .isNotEmpty());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void findApplicationPagesByApplicationIdViewMode_WhenApplicationHasNoHomePage_FirstPageIsSetAsHomePage() {
        String randomId = UUID.randomUUID().toString();
        Application application = new Application();
        application.setName("app_" + randomId);
        Mono<ApplicationPagesDTO> applicationPagesDTOMono = applicationPageService
                .createApplication(application, workspaceId)
                .flatMap(application1 -> {
                    // set isDefault=false to the default page
                    ApplicationPage applicationPage = application1.getPages().get(0);
                    applicationPage.setIsDefault(false);
                    return applicationService
                            .save(application1)
                            .then(newPageService.findApplicationPages(
                                    null, applicationPage.getId(), null, ApplicationMode.EDIT));
                });

        StepVerifier.create(applicationPagesDTOMono)
                .assertNext(applicationPagesDTO -> {
                    assertThat(applicationPagesDTO.getPages().get(0).getIsDefault())
                            .isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void findApplicationPage_CheckPageIcon_IsValid() {
        String randomId = UUID.randomUUID().toString();
        Application application = new Application();
        application.setName("app_" + randomId);
        Mono<PageDTO> applicationPageDTOMono = applicationPageService
                .createApplication(application, workspaceId)
                .flatMap(application1 -> {
                    PageDTO pageDTO = new PageDTO();
                    pageDTO.setName("page_" + randomId);
                    pageDTO.setIcon("flight");
                    pageDTO.setApplicationId(application1.getId());
                    return applicationPageService.createPage(pageDTO);
                })
                .flatMap(pageDTO -> applicationPageService.getPageAndMigrateDslByBranchAndDefaultPageId(
                        pageDTO.getId(), null, false, false));

        StepVerifier.create(applicationPageDTOMono)
                .assertNext(applicationPageDTO -> {
                    assertThat(applicationPageDTO.getApplicationId()).isNotNull();
                    assertThat(applicationPageDTO.getName()).isEqualTo("page_" + randomId);
                    assertThat(applicationPageDTO.getIcon()).isEqualTo("flight");
                })
                .verifyComplete();
    }

    private NewPage createPageWithEditPermission(String pageName) {
        Set<String> permissionGroupIds = permissionGroupRepository.findAll().collectList().block().stream()
                .map(PermissionGroup::getId)
                .collect(Collectors.toSet());

        Policy testPolicy = Policy.builder()
                .permissionGroups(permissionGroupIds)
                .permission(pagePermission.getEditPermission().getValue())
                .build();

        NewPage newPage = new NewPage();
        newPage.setPolicies(Set.of(testPolicy));

        PageDTO pageDTO = new PageDTO();
        pageDTO.setSlug(TextUtils.makeSlug(pageName));
        pageDTO.setName(pageName);
        newPage.setUnpublishedPage(pageDTO);
        newPage.setPublishedPage(new PageDTO());
        return newPage;
    }

    @Test
    @WithUserDetails("api_user")
    public void publishPages_WhenUserDoesNotHavePermissionOnPages_NotPublished() {
        List<NewPage> newPages = List.of(
                createPageWithEditPermission("Page1"),
                createPageWithEditPermission("Page2"),
                createPageWithEditPermission("Page3"));

        Mono<List<NewPage>> newPagesMono = newPageRepository
                .saveAll(newPages)
                .collectList()
                .flatMapMany(savedPages -> {
                    // remove edit permission from the first page
                    NewPage firstPage = savedPages.stream()
                            .filter(page -> page.getUnpublishedPage().getName().equals("Page1"))
                            .findFirst()
                            .get();

                    firstPage
                            .getPolicies()
                            .forEach(policy -> policy.setPermission(
                                    pagePermission.getReadPermission().getValue()));
                    return newPageRepository.save(firstPage).thenMany(Flux.fromIterable(savedPages));
                })
                .map(NewPage::getId)
                .collectList()
                .flatMap(pageIds -> newPageService
                        .publishPages(pageIds, pagePermission.getEditPermission())
                        .then(newPageRepository.findAllById(pageIds).collectList()));

        StepVerifier.create(newPagesMono)
                .assertNext(pages -> {
                    assertThat(pages).hasSize(3);
                    pages.forEach(page -> {
                        if (page.getUnpublishedPage().getName().equals("Page1")) {
                            // this page should not get published
                            assertThat(page.getPublishedPage().getName()).isNull();
                            assertThat(page.getPublishedPage().getSlug()).isNull();
                        } else {
                            assertThat(page.getUnpublishedPage().getName())
                                    .isEqualTo(page.getPublishedPage().getName());
                            assertThat(page.getUnpublishedPage().getSlug())
                                    .isEqualTo(page.getPublishedPage().getSlug());
                        }
                    });
                })
                .verifyComplete();
    }
}
