package com.appsmith.server.services;

import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.PageAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Resource;
import com.appsmith.server.dtos.ExecuteActionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ActionRepository;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.PluginManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import javax.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class ActionServiceImpl extends BaseService<ActionRepository, Action, String> implements ActionService {

    private final ActionRepository repository;
    private final ResourceService resourceService;
    private final PluginService pluginService;
    private final PageService pageService;
    private final PluginManager pluginManager;

    @Autowired
    public ActionServiceImpl(Scheduler scheduler,
                             Validator validator,
                             MongoConverter mongoConverter,
                             ReactiveMongoTemplate reactiveMongoTemplate,
                             ActionRepository repository,
                             ResourceService resourceService,
                             PluginService pluginService,
                             PageService pageService,
                             PluginManager pluginManager) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository);
        this.repository = repository;
        this.resourceService = resourceService;
        this.pluginService = pluginService;
        this.pageService = pageService;
        this.pluginManager = pluginManager;
    }

    @Override
    public Mono<Action> create(@NotNull Action action) {
        if (action.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "id"));
        } else if (action.getResourceId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.RESOURCE_ID_NOT_GIVEN));
        } else if (action.getPageId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.PAGE_ID_NOT_GIVEN));
        }

        Mono<Resource> resourceMono = resourceService.findById(action.getResourceId());
        Mono<Plugin> pluginMono = resourceMono.flatMap(resource -> pluginService.findById(resource.getPluginId()));
        Mono<Page> pageMono = pageService.findById(action.getPageId());
        Mono<Action> savedActionMono = pluginMono
                //Set plugin in the action before saving.
                .map(plugin -> {
                    action.setPluginId(plugin.getId());
                    return action;
                })
                .flatMap(repository::save)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.REPOSITORY_SAVE_FAILED)));

        return savedActionMono
                //Now that the action has been stored, add it to the page
                .flatMap(action1 -> {
                    return pageMono
                            .map(page -> {
                                PageAction pageAction = new PageAction();
                                pageAction.setId(action1.getId());
                                pageAction.setName(action1.getName());
                                pageAction.setJsonPathKeys(new ArrayList<>());

                                List<PageAction> actions = page.getActions();

                                if (actions == null) {
                                    actions = new ArrayList<>();
                                }

                                actions.add(pageAction);
                                page.setActions(actions);
                                return page;
                            })
                            .flatMap(pageService::save)
                            .then(Mono.just(action1));
                });
    }

    @Override
    public Flux<Object> executeAction(ExecuteActionDTO executeActionDTO) {
        String actionId = executeActionDTO.getActionId();
        log.debug("Going to execute action with id: {}", actionId);

        // 1. Fetch the query from the DB to get the type
        Mono<Action> actionMono = repository.findById(actionId)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "action", actionId)));

        // 2. Instantiate the implementation class based on the query type
        Mono<Plugin> pluginMono = actionMono.flatMap(action -> pluginService.findById(action.getPluginId()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "plugin")));

        Mono<Resource> resourceMono = actionMono.flatMap(action -> resourceService.findById(action.getResourceId()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "resource")));

        Mono<PluginExecutor> pluginExecutorMono = pluginMono.flatMap(plugin -> {
                    List<PluginExecutor> executorList = pluginManager.getExtensions(PluginExecutor.class, plugin.getExecutorClass());
                    if (executorList.isEmpty()) {
                        return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "plugin", plugin.getExecutorClass()));
                    }
                    return Mono.just(executorList.get(0));
                }
        );

        // 3. Execute the query
        return actionMono.flatMap(action -> resourceMono.zipWith(pluginExecutorMono, (resource, pluginExecutor) ->
        {
            log.debug("*** About to invoke the plugin**");
            // TODO: The CommandParams is being passed as null here. Move it to interfaces.CommandParams
            return pluginExecutor.execute(resource.getResourceConfiguration(), action.getActionConfiguration(), executeActionDTO.getParams());
        }))
                .flatMapIterable(Flux::toIterable);
    }
}
