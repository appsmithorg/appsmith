package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.PageRepository;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class PageServiceImpl extends BaseService<PageRepository, Page, String> implements PageService {

    private final ApplicationService applicationService;
    private final SessionUserService sessionUserService;

    @Autowired
    public PageServiceImpl(Scheduler scheduler,
                           Validator validator,
                           MongoConverter mongoConverter,
                           ReactiveMongoTemplate reactiveMongoTemplate,
                           PageRepository repository,
                           ApplicationService applicationService,
                           AnalyticsService analyticsService,
                           SessionUserService sessionUserService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.applicationService = applicationService;
        this.sessionUserService = sessionUserService;
    }

    @Override
    public Mono<Page> create(Page page) {
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
            layoutList.add(createDefaultLayout());
            page.setLayouts(layoutList);
        }
        return super.create(page);
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
    public Mono<Page> doesPageIdBelongToCurrentUserOrganization(Page page) {
        Mono<User> userMono = sessionUserService.getCurrentUser();
        final String[] username = {null};

        return userMono
                .map(user -> {
                    username[0] = user.getEmail();
                    return user;
                })
                .flatMap(user -> applicationService.findByIdAndOrganizationId(page.getApplicationId(), user.getOrganizationId()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.PAGE_DOESNT_BELONG_TO_USER_ORGANIZATION, page.getId(), username[0])))
                //If mono transmits, then application id belongs to the current user's organization. Return page.
                .then(Mono.just(page));
    }

    @Override
    public Mono<Page> findByName(String name) {
        return repository.findByName(name);
    }

    private Layout createDefaultLayout() {
        Layout layout = new Layout();
        layout.setId(new ObjectId().toString());
        return layout;
    }

    @Override
    public Mono<Void> deleteAll() {
        return repository.deleteAll();
    }
}
