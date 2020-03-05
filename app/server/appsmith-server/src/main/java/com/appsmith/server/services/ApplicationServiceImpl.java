package com.appsmith.server.services;

import com.appsmith.server.constants.AclPermission;
import com.appsmith.server.constants.Entity;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ActionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.PageRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Example;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.ArrayList;
import java.util.List;


@Slf4j
@Service
@AclEntity(Entity.APPLICATIONS)
public class ApplicationServiceImpl extends BaseService<ApplicationRepository, Application, String> implements ApplicationService {

    private final SessionUserService sessionUserService;

    //Using PageRepository instead of PageService is because a cyclic dependency is introduced if PageService is used here.
    //TODO : Solve for this across LayoutService, PageService and ApplicationService.
    private final PageRepository pageRepository;
    private final ActionRepository actionRepository;

    @Autowired
    public ApplicationServiceImpl(Scheduler scheduler,
                                  Validator validator,
                                  MongoConverter mongoConverter,
                                  ReactiveMongoTemplate reactiveMongoTemplate,
                                  ApplicationRepository repository,
                                  AnalyticsService analyticsService,
                                  SessionUserService sessionUserService,
                                  PageRepository pageRepository,
                                  ActionRepository actionRepository) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.sessionUserService = sessionUserService;
        this.pageRepository = pageRepository;
        this.actionRepository = actionRepository;
    }

    @Override
    public Flux<Application> get(MultiValueMap<String, String> params) {
        Mono<User> userMono = sessionUserService.getCurrentUser();

        return userMono
                .map(user -> user.getCurrentOrganizationId())
                .flatMapMany(orgId -> {
                    Application applicationExample = new Application();
                    applicationExample.setOrganizationId(orgId);
                    return repository.findAll(Example.of(applicationExample));
                });
    }

    @Override
    public Mono<Application> getById(String id) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        Mono<User> userMono = sessionUserService.getCurrentUser();

        return userMono
                .map(user -> user.getCurrentOrganizationId())
                .flatMap(orgId -> repository.findById(id, AclPermission.READ_APPLICATIONS))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "resource", id)));
    }

    @Override
    public Mono<Application> findById(String id) {
        return repository.findById(id);
    }

    @Override
    public Mono<Application> findByIdAndOrganizationId(String id, String organizationId) {
        return repository.findByIdAndOrganizationId(id, organizationId, AclPermission.READ_APPLICATIONS);
    }

    @Override
    public Mono<Application> findByName(String name) {
        return repository.findByName(name, AclPermission.READ_APPLICATIONS);
    }

    @Override
    public Mono<Application> save(Application application) {
        return repository.save(application);
    }

    @Override
    public Mono<Application> archive(Application application) {
        return repository.archive(application);
    }

    /**
     * This function walks through all the pages in the application. In each page, it walks through all the layouts.
     * In a layout, dsl and publishedDsl JSONObjects exist. Publish function is responsible for copying the dsl into
     * the publishedDsl.
     *
     * @param applicationId
     * @return Application
     */

    @Override
    public Mono<Boolean> publish(String applicationId) {
        Mono<Application> applicationMono = findById(applicationId)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "application", applicationId)));

        return applicationMono
                //Return all the pages in the Application
                .map(application -> {
                    List<ApplicationPage> pages = application.getPages();
                    if (pages == null) {
                        pages = new ArrayList<>();
                    }
                    return pages;
                })
                .flatMapMany(Flux::fromIterable)
                //In each page, copy each layout's dsl to publishedDsl field
                .flatMap(applicationPage -> pageRepository
                        .findById(applicationPage.getId())
                        .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "page", applicationPage.getId())))
                        .map(page -> {
                            List<Layout> layoutList = page.getLayouts();
                            for (Layout layout : layoutList) {
                                layout.setPublishedDsl(layout.getDsl());
                                layout.setPublishedLayoutActions(layout.getLayoutActions());
                                layout.setPublishedLayoutOnLoadActions(layout.getLayoutOnLoadActions());
                            }
                            return page;
                        })
                        .flatMap(pageRepository::save))
                .collectList()
                .map(pages -> true);
    }
}