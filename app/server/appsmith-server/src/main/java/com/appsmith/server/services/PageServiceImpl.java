package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Page;
import com.appsmith.server.dtos.PageNameIdDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.PageRepository;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Service
@Slf4j
public class PageServiceImpl extends BaseService<PageRepository, Page, String> implements PageService {

    private final ApplicationService applicationService;

    @Autowired
    public PageServiceImpl(Scheduler scheduler,
                           Validator validator,
                           MongoConverter mongoConverter,
                           ReactiveMongoTemplate reactiveMongoTemplate,
                           PageRepository repository,
                           ApplicationService applicationService,
                           AnalyticsService analyticsService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.applicationService = applicationService;
    }

    @Override
    public Mono<Page> findById(String pageId) {
        return repository.findById(pageId);
    }

    @Override
    public Mono<Page> save(Page page) {
        return repository.save(page);
    }

    @Override
    public Mono<Page> findByIdAndLayoutsId(String pageId, String layoutId) {
        return repository.findByIdAndLayoutsId(pageId, layoutId);
    }

    @Override
    public Mono<Page> findByName(String name) {
        return repository.findByName(name);
    }

    @Override
    public Layout createDefaultLayout() {
        Layout layout = new Layout();
        layout.setId(new ObjectId().toString());
        return layout;
    }

    @Override
    public Mono<Void> deleteAll() {
        return repository.deleteAll();
    }

    @Override
    public Flux<PageNameIdDTO> findNamesByApplicationId(String applicationId) {
        return repository.findByApplicationId(applicationId);
    }

    @Override
    public Flux<PageNameIdDTO> findNamesByApplicationName(String applicationName) {
        return applicationService
                .findByName(applicationName)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.NAME, applicationName)))
                .map(application -> application.getId())
                .flatMapMany(id -> repository.findByApplicationId(id));
    }

    @Override
    public Mono<Page> findByNameAndApplicationId(String name, String applicationId) {
        return repository.findByNameAndApplicationId(name, applicationId);
    }
}
