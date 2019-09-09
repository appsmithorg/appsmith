package com.appsmith.server.services;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.ApplicationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
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
        Mono<User> userMono = userService.getCurrentUser();

        return userMono
                .map(user -> user.getOrganizationId())
                .map(orgId -> {
                    application.setOrganizationId(orgId);
                    return application;
                })
                .flatMap(repository::save);
    }
}
