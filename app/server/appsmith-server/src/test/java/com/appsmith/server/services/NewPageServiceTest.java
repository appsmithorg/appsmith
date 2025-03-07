package com.appsmith.server.services;

import com.appsmith.external.git.constants.ce.RefType;
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
import com.appsmith.server.dtos.PageNameIdDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.ApplicationSnapshotRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.PagePermission;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@SpringBootTest
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
        List<Application> deletedApplications = applicationPermission
                .getDeletePermission()
                .flatMapMany(permission -> applicationService.findByWorkspaceId(workspaceId, permission))
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .collectList()
                .block();
        Workspace deletedWorkspace = workspaceService.archiveById(workspaceId).block();
    }

    @Test
    @WithUserDetails("api_user")
    public void findApplicationPages_WhenApplicationIdAndPageIdNotPresent_ThrowsException() {
        StepVerifier.create(newPageService.findApplicationPages(null, null, ApplicationMode.EDIT))
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
                .flatMap(pageDTO ->
                        newPageService.findApplicationPages(pageDTO.getApplicationId(), null, ApplicationMode.EDIT));

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
                        pageDTO.getApplicationId(), null, ApplicationMode.PUBLISHED));

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
                .flatMap(pageDTO -> newPageService.findApplicationPages(null, pageDTO.getId(), ApplicationMode.EDIT));

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
                                    null, applicationPage.getId(), ApplicationMode.EDIT));
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
                .flatMap(pageDTO -> applicationPageService.getPageAndMigrateDslByBranchAndBasePageId(
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

                    Set<Policy> pagePolicies = firstPage.getPolicies().stream()
                            .peek(policy -> policy.setPermission(
                                    pagePermission.getReadPermission().getValue()))
                            .collect(Collectors.toUnmodifiableSet());
                    firstPage.setPolicies(pagePolicies);
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

    @Test
    @WithUserDetails("api_user")
    public void verifyCreateApplicationPagesDTO_ReturnsRightNumberOfPages_BasedOnViewMode() {
        final String appName = "app" + UUID.randomUUID();
        Application application = new Application();
        application.setName(appName);

        String applicationId = applicationPageService
                .createApplication(application, workspaceId)
                .block()
                .getId();

        PageDTO pageDTO = new PageDTO();
        pageDTO.setApplicationId(applicationId);
        final String pageName = "app" + UUID.randomUUID();
        pageDTO.setName(pageName);
        applicationPageService.createPage(pageDTO).block();

        applicationPageService.publish(applicationId, true).block();

        List<NewPage> publishedPages = newPageService
                .findNewPagesByApplicationId(applicationId, pagePermission.getReadPermission())
                .collectList()
                .block();

        PageDTO pageDTO1 = new PageDTO();
        pageDTO1.setApplicationId(applicationId);
        final String unpublishedPageName = "app" + UUID.randomUUID();
        pageDTO1.setName(unpublishedPageName);
        applicationPageService.createPage(pageDTO1).block();

        Application updatedApplication =
                applicationService.findById(applicationId).block();

        List<NewPage> allPages = newPageService
                .findNewPagesByApplicationId(applicationId, pagePermission.getReadPermission())
                .collectList()
                .block();

        Mono<ApplicationPagesDTO> applicationPagesDTOMono =
                newPageService.createApplicationPagesDTO(updatedApplication, allPages, false, true);

        StepVerifier.create(applicationPagesDTOMono)
                .assertNext(applicationPagesDTO -> {
                    assertThat(applicationPagesDTO.getWorkspaceId()).isEqualTo(workspaceId);
                    assertThat(applicationPagesDTO.getApplication().getName()).isEqualTo(updatedApplication.getName());
                    assertThat(applicationPagesDTO.getApplication().getId()).isEqualTo(updatedApplication.getId());

                    assertThat(applicationPagesDTO.getPages().size()).isEqualTo(3);
                    Map<String, PageNameIdDTO> pageNameIdMap = applicationPagesDTO.getPages().stream()
                            .collect(Collectors.toMap(PageNameIdDTO::getName, Function.identity()));

                    assertThat(pageNameIdMap.keySet()).contains(unpublishedPageName);
                    assertThat(pageNameIdMap.keySet()).contains(pageName);
                    assertThat(pageNameIdMap.get("Page1").getIsDefault()).isTrue();
                })
                .verifyComplete();

        Mono<ApplicationPagesDTO> viewModeTrueApplicationPagesDTOMono = newPageService.createApplicationPagesDTO(
                applicationService.findById(applicationId).block(), publishedPages, true, true);

        StepVerifier.create(viewModeTrueApplicationPagesDTOMono)
                .assertNext(applicationPagesDTO -> {
                    assertThat(applicationPagesDTO.getWorkspaceId()).isEqualTo(workspaceId);
                    assertThat(applicationPagesDTO.getApplication().getName()).isEqualTo(updatedApplication.getName());
                    assertThat(applicationPagesDTO.getApplication().getId()).isEqualTo(updatedApplication.getId());

                    assertThat(applicationPagesDTO.getPages().size()).isEqualTo(2);
                    Map<String, PageNameIdDTO> pageNameIdMap = applicationPagesDTO.getPages().stream()
                            .collect(Collectors.toMap(PageNameIdDTO::getName, Function.identity()));

                    assertThat(pageNameIdMap.keySet()).doesNotContain(unpublishedPageName);
                    assertThat(pageNameIdMap.keySet()).contains(pageName);
                    assertThat(pageNameIdMap.get("Page1").getIsDefault()).isTrue();
                })
                .verifyComplete();

        Mono<ApplicationPagesDTO> viewModeTrueMono = Mono.defer(() -> newPageService.createApplicationPagesDTO(
                applicationService.findById(applicationId).block(), allPages, true, true));

        StepVerifier.create(viewModeTrueMono).verifyErrorSatisfies(error -> {
            assertThat(error).isInstanceOf(AppsmithException.class);
            assertThat(((AppsmithException) error).getAppErrorCode())
                    .isEqualTo(AppsmithError.ACL_NO_RESOURCE_FOUND.getAppErrorCode());
        });
    }

    @Test
    @WithUserDetails("api_user")
    public void updateDependencyMap_NotNullValue_shouldUpdateDependencyMap() {
        String randomId = UUID.randomUUID().toString();
        Application application = new Application();
        application.setName("app_" + randomId);
        Mono<NewPage> newPageMono = applicationPageService
                .createApplication(application, workspaceId)
                .flatMap(application1 -> {
                    PageDTO pageDTO = new PageDTO();
                    pageDTO.setName("page_" + randomId);
                    pageDTO.setApplicationId(application1.getId());
                    return applicationPageService.createPage(pageDTO);
                })
                .flatMap(pageDTO -> {
                    Map<String, List<String>> dependencyMap = new HashMap<>();
                    dependencyMap.put("key", List.of("val1", "val2"));
                    dependencyMap.put("key1", List.of("val1", "val2"));
                    dependencyMap.put("key2", List.of("val1", "val2"));
                    dependencyMap.put("key3", List.of("val1", "val2"));
                    return newPageService
                            .updateDependencyMap(pageDTO.getId(), dependencyMap, RefType.branch, null)
                            .then(newPageService.findById(pageDTO.getId(), null));
                });

        StepVerifier.create(newPageMono)
                .assertNext(newPage -> {
                    assertThat(newPage.getUnpublishedPage().getDependencyMap()).isNotNull();
                    assertThat(newPage.getUnpublishedPage().getDependencyMap().size())
                            .isEqualTo(4);
                    assertThat(newPage.getUnpublishedPage().getDependencyMap().get("key"))
                            .isEqualTo(List.of("val1", "val2"));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void updateDependencyMap_NotNullValueAndPublishApplication_shouldUpdateDependencyMap() {
        String randomId = UUID.randomUUID().toString();
        Application application = new Application();
        application.setName("app_" + randomId);
        Mono<NewPage> newPageMono = applicationPageService
                .createApplication(application, workspaceId)
                .flatMap(application1 -> {
                    PageDTO pageDTO = new PageDTO();
                    pageDTO.setName("page_" + randomId);
                    pageDTO.setApplicationId(application1.getId());
                    return applicationPageService.createPage(pageDTO);
                })
                .flatMap(pageDTO -> {
                    Map<String, List<String>> dependencyMap = new HashMap<>();
                    dependencyMap.put("key", List.of("val1", "val2"));
                    dependencyMap.put("key1", List.of("val1", "val2"));
                    dependencyMap.put("key2", List.of("val1", "val2"));
                    dependencyMap.put("key3", List.of("val1", "val2"));
                    return newPageService
                            .updateDependencyMap(pageDTO.getId(), dependencyMap, RefType.branch, null)
                            .flatMap(page -> applicationPageService.publish(application.getId(), false))
                            .then(newPageService.findById(pageDTO.getId(), null));
                });

        StepVerifier.create(newPageMono)
                .assertNext(newPage -> {
                    assertThat(newPage.getUnpublishedPage().getDependencyMap()).isNotNull();
                    assertThat(newPage.getUnpublishedPage().getDependencyMap().size())
                            .isEqualTo(4);
                    assertThat(newPage.getUnpublishedPage().getDependencyMap().get("key"))
                            .isEqualTo(List.of("val1", "val2"));

                    assertThat(newPage.getPublishedPage().getDependencyMap()).isNotNull();
                    assertThat(newPage.getPublishedPage().getDependencyMap().size())
                            .isEqualTo(4);
                    assertThat(newPage.getPublishedPage().getDependencyMap().get("key"))
                            .isEqualTo(List.of("val1", "val2"));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void updateDependencyMap_nullValue_shouldUpdateDependencyMap() {
        String randomId = UUID.randomUUID().toString();
        Application application = new Application();
        application.setName("app_" + randomId);
        Mono<NewPage> newPageMono = applicationPageService
                .createApplication(application, workspaceId)
                .flatMap(application1 -> {
                    PageDTO pageDTO = new PageDTO();
                    pageDTO.setName("page_" + randomId);
                    pageDTO.setApplicationId(application1.getId());
                    return applicationPageService.createPage(pageDTO);
                })
                .flatMap(pageDTO -> newPageService
                        .updateDependencyMap(pageDTO.getId(), null, RefType.branch, null)
                        .then(newPageService.findById(pageDTO.getId(), null)));

        StepVerifier.create(newPageMono)
                .assertNext(newPage -> {
                    assertThat(newPage.getUnpublishedPage().getDependencyMap()).isNull();
                })
                .verifyComplete();
    }
}
