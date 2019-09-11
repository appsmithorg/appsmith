package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ApplicationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;


@Slf4j
@Service
public class ApplicationServiceImpl extends BaseService<ApplicationRepository, Application, String> implements ApplicationService {

    private final UserService userService;

    @Autowired
    public ApplicationServiceImpl(Scheduler scheduler, Validator validator, MongoConverter mongoConverter, ReactiveMongoTemplate reactiveMongoTemplate, ApplicationRepository repository, UserService userService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository);
        this.userService = userService;
    }

    @Override
    public Mono<Application> create(Application application) {
        if (application.getName() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.NAME));
        }

        Mono<User> userMono = userService.getCurrentUser();

        return userMono
                .map(user -> user.getOrganizationId())
                .map(orgId -> {
                    application.setOrganizationId(orgId);
                    return application;
                })
                .flatMap(repository::save);
    }

    @Override
    public Flux<Application> get() {
        Mono<User> userMono = userService.getCurrentUser();

        return userMono
                .map(user -> user.getOrganizationId())
                .flatMapMany(orgId -> repository.findByOrganizationId(orgId));
    }

    @Override
    public Mono<Application> getById(String id) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        Mono<User> userMono = userService.getCurrentUser();

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
}
