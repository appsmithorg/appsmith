package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

@Service
public class ApplicationPageServiceImpl implements ApplicationPageService {
    private final ApplicationService applicationService;
    private final PageService pageService;
    private final SessionUserService sessionUserService;

    public ApplicationPageServiceImpl(ApplicationService applicationService,
                                      PageService pageService, SessionUserService sessionUserService) {
        this.applicationService = applicationService;
        this.pageService = pageService;
        this.sessionUserService = sessionUserService;
    }

    public Mono<Page> createPage(Page page) {
        if (page.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        } else if (page.getName() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.NAME));
        } else if (page.getApplicationId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATIONID));
        }

        List<Layout> layoutList = page.getLayouts();
        if (layoutList == null) {
            layoutList = new ArrayList<>();
        }
        if (layoutList.isEmpty()) {
            layoutList.add(pageService.createDefaultLayout());
            page.setLayouts(layoutList);
        }

        Mono<Application> applicationMono = applicationService.findById(page.getApplicationId())
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATIONID, page.getApplicationId())));

        return applicationMono
                .thenReturn(page)
                .flatMap(pageService::create)
                //After the page has been saved, update the application (save the page id inside the application)
                .flatMap(savedPage ->
                        addPageToApplication(applicationMono, savedPage)
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
    public Mono<Application> addPageToApplication(Mono<Application> applicationMono, Page page) {
        return applicationMono
                .map(application -> {
                    List<ApplicationPage> applicationPages = application.getPages();
                    if (applicationPages == null) {
                        applicationPages = new ArrayList<>();
                    }
                    ApplicationPage applicationPage = new ApplicationPage();
                    applicationPage.setId(page.getId());
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
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGEID)))
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

    public Mono<Application> createApplication(Application application) {
        if (application.getName() == null || application.getName().trim().isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.NAME));
        }

        Mono<User> userMono = sessionUserService.getCurrentUser();

        return userMono
                .map(user -> user.getCurrentOrganizationId())
                .map(orgId -> {
                    application.setOrganizationId(orgId);
                    return application;
                })
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
                            .flatMap(savedPage -> addPageToApplication(Mono.just(savedApplication), savedPage));
                });
    }
}
