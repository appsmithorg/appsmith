package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.ResourceConfiguration;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.constants.AnalyticsEvents;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.PageAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Resource;
import com.appsmith.server.dtos.ExecuteActionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ActionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.mustachejava.DefaultMustacheFactory;
import com.github.mustachejava.Mustache;
import com.github.mustachejava.MustacheFactory;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.PluginManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import javax.validation.constraints.NotNull;
import java.io.StringReader;
import java.io.StringWriter;
import java.io.Writer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ActionServiceImpl extends BaseService<ActionRepository, Action, String> implements ActionService {

    private final ActionRepository repository;
    private final ResourceService resourceService;
    private final PluginService pluginService;
    private final PageService pageService;
    private final PluginManager pluginManager;
    private final ObjectMapper objectMapper;
    private final ResourceContextService resourceContextService;

    @Autowired
    public ActionServiceImpl(Scheduler scheduler,
                             Validator validator,
                             MongoConverter mongoConverter,
                             ReactiveMongoTemplate reactiveMongoTemplate,
                             ActionRepository repository,
                             ResourceService resourceService,
                             PluginService pluginService,
                             PageService pageService,
                             PluginManager pluginManager,
                             AnalyticsService analyticsService,
                             ObjectMapper objectMapper,
                             ResourceContextService resourceContextService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
        this.resourceService = resourceService;
        this.pluginService = pluginService;
        this.pageService = pageService;
        this.pluginManager = pluginManager;
        this.objectMapper = objectMapper;
        this.resourceContextService = resourceContextService;
    }

    @Override
    public Mono<Action> create(@NotNull Action action) {
        if (action.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "id"));
        } else if (action.getResourceId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.RESOURCE_ID_NOT_GIVEN));
        }

        Mono<Resource> resourceMono = resourceService.findById(action.getResourceId())
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "resource", action.getResourceId())));
        Mono<Plugin> pluginMono = resourceMono.flatMap(resource -> pluginService.findById(resource.getPluginId())
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "plugin", resource.getPluginId()))));

        return pluginMono
                //Set plugin in the action before saving.
                .map(plugin -> {
                    action.setPluginId(plugin.getId());
                    return action;
                })
                .flatMap(super::create)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.REPOSITORY_SAVE_FAILED)));
    }

    public Mono<Page> bindPageToAction(Action action, String pageId) {
        Mono<Page> pageMono = pageService.findById(pageId);
        action.setPageId(pageId);
        return pageMono
                //If page exists, then continue forward
                .then(repository.save(action))
                .flatMap(action1 -> pageMono
                        .map(page -> {
                            PageAction pageAction = new PageAction();
                            pageAction.setId(action1.getId());

                            List<PageAction> actions = page.getActions();

                            if (actions == null) {
                                actions = new ArrayList<>();
                            }

                            actions.add(pageAction);
                            page.setActions(actions);
                            return page;
                        })
                        .flatMap(pageService::save)
                );
    }

    @Override
    public Mono<ActionExecutionResult> executeAction(ExecuteActionDTO executeActionDTO) {
        String actionId = executeActionDTO.getActionId();

        // 1. Validate input parameters which are required for mustache replacements
        List<Param> params = executeActionDTO.getParams();
        for (Param param:params) {
            if (param.getValue() == null) {
                return Mono.error(new AppsmithException(AppsmithError.ACTION_RUN_KEY_VALUE_INVALID, param.getKey(), param.getValue()));
            }
        }

        // 2. Fetch the query from the DB to get the type
        Mono<Action> actionMono = repository.findById(actionId)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "action", actionId)));

        // 3. Instantiate the implementation class based on the query type
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


        // 4. Execute the query
        return actionMono
                .flatMap(action -> resourceMono.zipWith(pluginExecutorMono, (resource, pluginExecutor) -> {
                    ResourceConfiguration resourceConfiguration;
                    ActionConfiguration actionConfiguration;
                    //Do variable substitution before invoking the plugin
                    //Do this only if params have been provided in the execute command
                    if (executeActionDTO.getParams() != null && !executeActionDTO.getParams().isEmpty()) {
                        Map<String, String> replaceParamsMap = executeActionDTO
                                .getParams()
                                .stream()
                                .collect(Collectors.toMap(Param::getKey, Param::getValue,
                                        // Incase there's a conflict, we pick the older value
                                        (oldValue, newValue) -> oldValue)
                                );
                        resourceConfiguration = (ResourceConfiguration) variableSubstitution(resource.getResourceConfiguration(), replaceParamsMap);
                        actionConfiguration = (ActionConfiguration) variableSubstitution(action.getActionConfiguration(), replaceParamsMap);
                    } else {
                        resourceConfiguration = resource.getResourceConfiguration();
                        actionConfiguration = action.getActionConfiguration();
                    }
                    return resourceContextService
                            .getResourceContext(resource.getId())
                            //Now that we have the context (connection details, execute the action
                            .flatMap(resourceContext -> pluginExecutor.execute(
                                    resourceContext.getConnection(),
                                    resourceConfiguration,
                                    actionConfiguration));
                }))
                .onErrorResume(e -> Mono.error(new AppsmithException(AppsmithError.PLUGIN_RUN_FAILED, e.getMessage())))
                .flatMap(obj -> obj);
    }


    /**
     * This function replaces the variables in the Object with the actual params
     */
    public Object variableSubstitution(Object configuration,
                                       Map<String, String> replaceParamsMap) {

        try {
            // Convert the object to String as a preparation to send it to mustacheReplacement
            String objectInJsonString = objectMapper.writeValueAsString(configuration);
            objectInJsonString = mustacheReplacement(objectInJsonString, configuration.getClass().getSimpleName(), replaceParamsMap);
            return objectMapper.readValue(objectInJsonString, configuration.getClass());
        } catch (Exception e) {
            e.printStackTrace();
        }
        return configuration;
    }

    /**
     * @param template    : This is the string which contains {{key}} which would be replaced with value
     * @param name        : This is the class name of the object from which template string was created
     * @param keyValueMap : This is the map of keys with values.
     * @return It finally returns the string in which all the keys in template have been replaced with values.
     */
    private String mustacheReplacement(String template, String name, Map<String, String> keyValueMap) {
        MustacheFactory mf = new DefaultMustacheFactory();
        Mustache mustache = mf.compile(new StringReader(template), name);
        Writer writer = new StringWriter();
        mustache.execute(writer, keyValueMap);

        return writer.toString();
    }

    @Override
    public Mono<Action> delete(String id) {
        Mono<Action> actionMono = repository.findById(id)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "action", id)));
        return actionMono
                .map(action -> {
                    if (action.getPageId() == null) {
                        //No page id implies that the action is not bound to a page yet. Safe to delete it
                        return action;
                    }
                    Mono<Page> pageMono = pageService.findById(action.getPageId());
                    return pageMono
                            .map(page -> {
                                List<PageAction> actions = page.getActions();
                                actions = actions.stream().filter(a -> a.getId() != action.getId()).collect(Collectors.toList());
                                page.setActions(actions);
                                return page;
                            })
                            .flatMap(pageService::save)
                            .thenReturn(action);
                })
                .flatMap(toDelete ->
                        repository.delete((Action) toDelete)
                                .thenReturn(toDelete))
                .map(deletedObj -> {
                    analyticsService.sendEvent(AnalyticsEvents.DELETE + "_" + deletedObj.getClass().getSimpleName().toUpperCase(), (Action) deletedObj);
                    return (Action) deletedObj;
                });
    }
}
