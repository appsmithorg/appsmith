package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.constants.AclPermission;
import com.appsmith.server.constants.AnalyticsEvents;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ApplicationPageServiceImpl implements ApplicationPageService {
    private final ApplicationService applicationService;
    private final PageService pageService;
    private final SessionUserService sessionUserService;
    private final OrganizationService organizationService;

    private final AnalyticsService analyticsService;

    public ApplicationPageServiceImpl(ApplicationService applicationService,
                                      PageService pageService,
                                      SessionUserService sessionUserService,
                                      OrganizationService organizationService,
                                      AnalyticsService analyticsService) {
        this.applicationService = applicationService;
        this.pageService = pageService;
        this.sessionUserService = sessionUserService;
        this.organizationService = organizationService;
        this.analyticsService = analyticsService;
    }

    public Mono<Page> createPage(Page page) {
        if (page.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        } else if (page.getName() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.NAME));
        } else if (page.getApplicationId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION_ID));
        }

        List<Layout> layoutList = page.getLayouts();
        if (layoutList == null) {
            layoutList = new ArrayList<>();
        }
        if (layoutList.isEmpty()) {
            layoutList.add(pageService.createDefaultLayout());
            page.setLayouts(layoutList);
        }

        Mono<Application> applicationMono = applicationService.findById(page.getApplicationId(), AclPermission.CREATE_PAGES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION_ID, page.getApplicationId())));

        return applicationMono
                .thenReturn(page)
                .flatMap(pageService::create)
                //After the page has been saved, update the application (save the page id inside the application)
                .flatMap(savedPage ->
                        addPageToApplication(applicationMono, savedPage, false)
                                .thenReturn(savedPage));
    }

    /**
     * This function is called during page create in Page Service. It adds the newly created
     * page to its ApplicationPages list.
     *
     * @param applicationMono
     * @param page
     * @return Updated application
     */
    public Mono<Application> addPageToApplication(Mono<Application> applicationMono, Page page, Boolean isDefault) {
        return applicationMono
                .map(application -> {
                    List<ApplicationPage> applicationPages = application.getPages();
                    if (applicationPages == null) {
                        applicationPages = new ArrayList<>();
                    }
                    ApplicationPage applicationPage = new ApplicationPage();
                    applicationPage.setId(page.getId());
                    applicationPage.setIsDefault(isDefault);
                    applicationPages.add(applicationPage);
                    application.setPages(applicationPages);
                    return application;
                })
                .flatMap(applicationService::save);
    }

    public Mono<Page> doesPageBelongToCurrentUserOrganization(Page page) {
        Mono<User> userMono = sessionUserService.getCurrentUser();
        final String[] username = {null};

        return userMono
                .map(user -> {
                    username[0] = user.getEmail();
                    return user;
                })
                .flatMap(user -> applicationService.findByIdAndOrganizationId(page.getApplicationId(), user.getCurrentOrganizationId()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.PAGE_DOESNT_BELONG_TO_USER_ORGANIZATION, page.getId(), username[0])))
                //If mono transmits, then application id belongs to the current user's organization. Return page.
                .then(Mono.just(page));
    }

    public Mono<Page> getPage(String pageId, Boolean viewMode) {
        return pageService.findById(pageId)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID)))
                .flatMap(this::doesPageBelongToCurrentUserOrganization)
                //The pageId given is correct and belongs to the current user's organization.
                .map(page -> {
                    List<Layout> layoutList = page.getLayouts();
                    // Set the view mode for all the layouts in the page. This ensures that we send the correct DSL
                    // back to the client
                    layoutList.stream()
                            .forEach(layout -> layout.setViewMode(viewMode));
                    page.setLayouts(layoutList);
                    return page;
                });
    }

    @Override
    public Mono<Page> getPageByName(String applicationName, String pageName, Boolean viewMode) {
        return applicationService
                .findByName(applicationName)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.NAME, applicationName)))
                .flatMap(application -> pageService.findByNameAndApplicationId(pageName, application.getId()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.NAME, pageName)))
                .flatMap(this::doesPageBelongToCurrentUserOrganization)
                //The pageId given is correct and belongs to the current user's organization.
                .map(page -> {
                    List<Layout> layoutList = page.getLayouts();
                    // Set the view mode for all the layouts in the page. This ensures that we send the correct DSL
                    // back to the client
                    layoutList.stream()
                            .forEach(layout -> layout.setViewMode(viewMode));
                    page.setLayouts(layoutList);
                    return page;
                });
    }

    @Override
    public Mono<Application> makePageDefault(String applicationId, String pageId) {
        return pageService.findById(pageId)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE_ID, pageId)))
                // Check if the page actually belongs to the application.
                .flatMap(page -> {
                    if (page.getApplicationId().equals(applicationId)) {
                        return Mono.just(page);
                    }
                    return Mono.error(new AppsmithException(AppsmithError.PAGE_DOESNT_BELONG_TO_APPLICATION, page.getName(), applicationId));
                })
                .then(applicationService.findById(applicationId))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION_ID, applicationId)))
                .flatMap(application -> {
                    List<ApplicationPage> pages = application.getPages();

                    // We are guaranteed to find the pageId in this list.
                    pages.stream().forEach(page -> {
                        if (page.getId().equals(pageId)) {
                            page.setIsDefault(true);
                        } else {
                            page.setIsDefault(false);
                        }
                    });
                    application.setPages(pages);
                    return applicationService.save(application);
                });
    }

    private Set<Policy> adminApplicationPolicy(Organization org, User user) {
        Set<Policy> orgPolicies = org.getPolicies();
        // If a user can create an application on org, they can read, update & delete all applications
        return null;
    }

    private Set<Policy> adminPagePolicyForApplication(User user) {
        return null;
    }

    public Mono<Application> createApplication(Application application) {
        if (application.getName() == null || application.getName().trim().isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.NAME));
        }

        Mono<User> userMono = sessionUserService.getCurrentUser();
        Mono<Application> applicationMono = userMono
                .flatMap(user -> {
                    String orgId = user.getCurrentOrganizationId();

                    Mono<Organization> orgMono = organizationService.findById(orgId, AclPermission.MANAGE_APPLICATIONS)
                            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ORGANIZATION, orgId)));

                    return orgMono.map(org -> {
                        application.setOrganizationId(org.getId());
                        // At the organization level, filter out all the application specific policies and apply them
                        // to the new application that we are creating.
                        Set<Policy> policySet = org.getPolicies().stream()
                                .filter(policy ->
                                        policy.getPermission().equals(AclPermission.READ_APPLICATIONS.getValue()) ||
                                                policy.getPermission().equals(AclPermission.MANAGE_APPLICATIONS.getValue())
                                ).collect(Collectors.toSet());
                        Set<String> users = policySet.stream()
                                .map(policy -> policy.getUsers())
                                .flatMap(Collection::stream)
                                .collect(Collectors.toSet());
                        policySet.add(Policy.builder()
                                .permission(AclPermission.CREATE_PAGES.getValue())
                                .users(Set.of(user.getUsername())).build()
                        );
                        application.setPolicies(policySet);
                        return application;
                    });
                });

        return applicationMono
                .flatMap(applicationService::create)
                .flatMap(savedApplication -> {
                    Page page = new Page();
                    page.setName(FieldName.DEFAULT_PAGE_NAME);
                    page.setApplicationId(savedApplication.getId());
                    List<Layout> layoutList = new ArrayList<>();
                    layoutList.add(pageService.createDefaultLayout());
                    page.setLayouts(layoutList);
                    return pageService
                            .create(page)
                            .flatMap(savedPage -> addPageToApplication(Mono.just(savedApplication), savedPage, true));
                });
    }

    /**
     * This function performs a soft delete for the application along with it's associated pages and actions.
     *
     * @param id The application id to delete
     * @return The modified application object with the deleted flag set
     */
    @Override
    public Mono<Application> deleteApplication(String id) {
        log.debug("Archiving application with id: {}", id);

        Mono<Application> applicationMono = applicationService.findById(id)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "application", id)))
                .flatMap(application -> {
                    log.debug("Archiving pages for applicationId: {}", id);
                    return pageService.findByApplicationId(id)
                            .flatMap(page -> pageService.delete(page.getId()))
                            .collectList()
                            .thenReturn(application);
                })
                .flatMap(application -> applicationService.archive(application));

        return applicationMono
                .flatMap(deletedObj -> analyticsService.sendEvent(AnalyticsEvents.DELETE + "_" + deletedObj.getClass().getSimpleName().toUpperCase(), (Application) deletedObj));
    }

}
