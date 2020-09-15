package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Page;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.repositories.NewPageRepository;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Service
public class NewPageServiceImpl extends BaseService<NewPageRepository, NewPage, String> implements NewPageService {

    public NewPageServiceImpl(Scheduler scheduler, Validator validator, MongoConverter mongoConverter, ReactiveMongoTemplate reactiveMongoTemplate, NewPageRepository repository, AnalyticsService analyticsService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }

    private Page getPageByViewMode(NewPage newPage, Boolean viewMode) {
        Page page = new Page();
        page.setApplicationId(newPage.getApplicationId());
        page.setUserPermissions(newPage.getUserPermissions());
        page.setId(newPage.getId());
        if (Boolean.TRUE.equals(viewMode)) {
            page.setLayouts(newPage.getPublishedPage().getLayouts());
            page.setName(newPage.getPublishedPage().getName());
        } else {
            page.setLayouts(newPage.getUnpublishedPage().getLayouts());
            page.setName(newPage.getUnpublishedPage().getName());
        }

        return page;
    }

    @Override
    public Mono<Page> findById(String pageId, AclPermission aclPermission, Boolean view) {
        return repository.findById(pageId, aclPermission)
                .map(page -> getPageByViewMode(page, view));
    }

    @Override
    public Flux<Page> findByApplicationId(String applicationId, AclPermission permission, Boolean view) {
        return repository.findByApplicationId(applicationId, permission)
                .map(page -> getPageByViewMode(page, view));
    }

    @Override
    public Mono<Page> createDefault(Page object) {
        NewPage newPage = new NewPage();
        newPage.setApplicationId(object.getApplicationId());
        PageDTO unpublishedPageDto = new PageDTO();
        unpublishedPageDto.setLayouts(object.getLayouts());
        unpublishedPageDto.setName(object.getName());
        newPage.setUnpublishedPage(unpublishedPageDto);
        return super.create(newPage)
                .map(page -> getPageByViewMode(page, false));
    }

    @Override
    public Mono<Page> findByIdAndLayoutsId(String pageId, String layoutId, AclPermission aclPermission, Boolean view) {
        return repository.findByIdAndLayoutsId(pageId, layoutId, aclPermission);
    }
}
