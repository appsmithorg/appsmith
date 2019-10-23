package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.PageRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.ArrayList;
import java.util.List;


@Slf4j
@Service
public class ApplicationServiceImpl extends BaseService<ApplicationRepository, Application, String> implements ApplicationService {

    private final SessionUserService sessionUserService;

    //Using PageRepository instead of PageService is because a cyclic dependency is introduced if PageService is used here.
    //TODO : Solve for this across LayoutService, PageService and ApplicationService.
    private final PageRepository pageRepository;

    @Autowired
    public ApplicationServiceImpl(Scheduler scheduler,
                                  Validator validator,
                                  MongoConverter mongoConverter,
                                  ReactiveMongoTemplate reactiveMongoTemplate,
                                  ApplicationRepository repository,
                                  AnalyticsService analyticsService,
                                  SessionUserService sessionUserService,
                                  PageRepository pageRepository) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.sessionUserService = sessionUserService;
        this.pageRepository = pageRepository;
    }

    @Override
    public Mono<Application> create(Application application) {
        if (application.getName() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.NAME));
        }

        Mono<User> userMono = sessionUserService.getCurrentUser();

        return userMono
                .map(user -> user.getOrganizationId())
                .map(orgId -> {
                    application.setOrganizationId(orgId);
                    return application;
                })
                .flatMap(super::create);
    }

    @Override
    public Flux<Application> get() {
        Mono<User> userMono = sessionUserService.getCurrentUser();

        return userMono
                .map(user -> user.getOrganizationId())
                .flatMapMany(orgId -> repository.findByOrganizationId(orgId));
    }

    @Override
    public Mono<Application> getById(String id) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        Mono<User> userMono = sessionUserService.getCurrentUser();

        return userMono
                .map(user -> user.getOrganizationId())
                .flatMap(orgId -> repository.findByIdAndOrganizationId(id, orgId))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "resource", id)));
    }

    @Override
    public Mono<Application> findById(String id) {
        return repository.findById(id);
    }

    @Override
    public Mono<Application> findByIdAndOrganizationId(String id, String organizationId) {
        return repository.findByIdAndOrganizationId(id, organizationId);
    }

    @Override
    public Mono<Application> findByName(String name) {
        return repository.findByName(name);
    }

    /**
     * This function is called during page create in Page Service. It adds the newly created
     * page to its ApplicationPages list.
     * @param applicationId
     * @param page
     * @return Updated application
     */
    @Override
    public Mono<Application> addPageToApplication(String applicationId, Page page) {
        Mono<Application> applicationMono = findById(applicationId);

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
                .flatMap(repository::save);
    }

    /**
     * This function walks through all the pages in the application. In each page, it walks through all the layouts.
     * In a layout, dsl and publishedDsl JSONObjects exist. Publish function is responsible for copying the dsl into
     * the publishedDsl.
     * @param applicationId
     * @return Application
     */

    @Override
    public Mono<Application> publish(String applicationId) {
        Mono<Application> applicationMono = findById(applicationId)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "application", applicationId)));

        return applicationMono
                //Return all the pages in the Application
                .map(application -> application.getPages())
                .flatMapMany(Flux::fromIterable)
                //In each page, copy each layout's dsl to publishedDsl field
                .flatMap(applicationPage -> {
                    return pageRepository
                            .findById(applicationPage.getId())
                            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "page", applicationPage.getId())))
                            .map(page -> {
                                List<Layout> layoutList = page.getLayouts();
                                for (Layout layout : layoutList) {
                                    layout.setPublishedDsl(layout.getDsl());
                                }
                                return page;
                            })
                            .flatMap(pageRepository::save);
                })
                .collectList()
                //The only reason the following has been added to ensure that the DAG completes. If the following is missing,
                //the previous flatMap responsible for editing the layouts doesn't execute.
                .flatMap(pages -> {
                    List<ApplicationPage> pageIds = new ArrayList<>();
                    for (Page page : pages) {
                        ApplicationPage applicationPage = new ApplicationPage();
                        applicationPage.setId(page.getId());
                        pageIds.add(applicationPage);
                    }
                    return applicationMono.map(application -> {
                        application.setPages(pageIds);
                        return application;
                    });
                });
    }
}