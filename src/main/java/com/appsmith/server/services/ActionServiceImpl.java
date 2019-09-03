package com.appsmith.server.services;

import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Resource;
import com.appsmith.server.exceptions.AppsmithError;
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
    private final PluginService pluginService;

    @Autowired
    public ActionServiceImpl(Scheduler scheduler, MongoConverter mongoConverter, ReactiveMongoTemplate reactiveMongoTemplate, ActionRepository repository, ResourceService resourceService, PluginService pluginService) {
        super(scheduler, mongoConverter, reactiveMongoTemplate, repository);
        this.repository = repository;
        this.resourceService = resourceService;
        this.pluginService = pluginService;
    }

    @Override
    public Mono<Action> create(@NotNull Action action) throws AppsmithException {
        if (action.getId() != null) {
            throw new AppsmithException("During create action, Id is not null. Can't create new action.");
        } else if (action.getResourceId() == null) {
            throw new AppsmithException(AppsmithError.RESOURCE_ID_NOT_GIVEN);
        }

        Mono<Resource> resourceMono = resourceService.findById(action.getResourceId());
        Mono<Plugin> pluginMono = resourceMono.flatMap(resource -> pluginService.findById(resource.getPluginId()));


        return pluginMono
                //Set plugin in the action before saving.
                .map(plugin -> {
                    action.setPluginId(plugin.getId());
                    return action;
                })
                .flatMap(repository::save);
    }
}
