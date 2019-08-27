package com.appsmith.server.services;

import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Resource;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ActionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.constraints.NotNull;

@Slf4j
@Service
public class ActionServiceImpl extends BaseService<ActionRepository, Action, String> implements ActionService {

    private final ActionRepository repository;
    private final ResourceService resourceService;

    @Autowired
    public ActionServiceImpl(Scheduler scheduler, MongoConverter mongoConverter, ReactiveMongoTemplate reactiveMongoTemplate, ActionRepository repository, ResourceService resourceService) {
        super(scheduler, mongoConverter, reactiveMongoTemplate, repository);
        this.repository = repository;
        this.resourceService = resourceService;
    }

    @Override
    public Mono<Action> create(@NotNull Action action) throws AppsmithException {
        if (action.getId() != null) {
            throw new AppsmithException("During create action, Id is not null. Can't create new action.");
        }

        Mono<Resource> resourceMono = resourceService.findByName(action.getResource().getName());

        return resourceMono
                .map(resource -> {
                    action.setResource(resource);
                    return action;
                })
                .flatMap(repository::save);
    }
}
